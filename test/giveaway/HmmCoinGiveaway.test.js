const {BN, constants, expectEvent, expectRevert} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const {ZERO_ADDRESS} = constants;

const HmmCoin = artifacts.require('HmmCoin');
const HmmCoinGiveawayMock = artifacts.require('HmmCoinGiveawayMock');

contract('HmmCoinGiveaway', function (accounts) {
    const [initialHolder, recipient, anotherAccount] = accounts;

    const name = 'HmmCoin';
    const symbol = 'hmm';

    const decimals = new BN(18);
    const decimalsMult = new BN(10).pow(decimals);
    const initialSupply = new BN(1101101).mul(decimalsMult);
    const maxSupply = new BN(101101101).mul(decimalsMult);
    const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');

    const giveawayTimePeriodLen = new BN(24).muln(60).muln(60); // 24h

    const firstLevelAmountExpected = new BN(10).pow(decimals); // 1 HMC
    const secondLevelAmountExpected = new BN(10).pow(decimals.subn(1)).muln(9); // 0.9 HMC

    beforeEach(async function () {
        this.token = await HmmCoin.new(name, symbol, initialHolder, initialSupply, maxSupply);
        this.giveaway = await HmmCoinGiveawayMock.new(this.token.address, giveawayTimePeriodLen);
        await this.token.grantRole(MINTER_ROLE, this.giveaway.address);
        this.accessControl = this.giveaway;
    });

    it('requires a non-zero token address', async function () {
        await expectRevert(
            HmmCoinGiveawayMock.new(ZERO_ADDRESS, giveawayTimePeriodLen), 'Giveaway: token must be non-zero address',
        );
    });

    it('requires a non-zero time period len', async function () {
        await expectRevert(
            HmmCoinGiveawayMock.new(this.token.address, 0), 'HmmCoinGiveaway: timePeriodLenSecs must be > 0',
        );
    });

    it('should store the token address', async function () {
        expect(await this.giveaway.token()).to.equal(this.token.address);
    });

    describe('getTokens', function () {
        it('emits TokensGivenAway event', async function () {
            const receipt = await this.giveaway.getTokens(anotherAccount);

            expectEvent(receipt, 'TokensGivenAway', {beneficiary: anotherAccount, amount: firstLevelAmountExpected});
        });

        it('mints the tokens', async function () {
            await this.giveaway.getTokens(anotherAccount);

            let transferEvent = (await this.token.getPastEvents('Transfer'))[0];
            expect(transferEvent.returnValues.from).to.eq(ZERO_ADDRESS);
            expect(transferEvent.returnValues.to).to.eq(anotherAccount);
            expect(transferEvent.returnValues.value).to.eq(firstLevelAmountExpected.toString());
        });

        it('delivers the tokens', async function () {
            await this.giveaway.getTokens(anotherAccount);

            expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal(firstLevelAmountExpected);
        });

        it('fails when beneficiary is zero address', async function () {
            await expectRevert(this.giveaway.getTokens(ZERO_ADDRESS), 'Giveaway: beneficiary must be non-zero address');
        });

        it('fails when all tokens given away', async function () {
            await this.giveaway.setTokensGivenAway(new BN(80000000).mul(decimalsMult));
            await expectRevert(this.giveaway.getTokens(anotherAccount), "HmmCoinGiveaway: all tokens given away");
        });

        it('gives 1 token for first 1 000 000 coins given away', async function () {
            await this.giveaway.getTokens(anotherAccount);
            await this.giveaway.getTokens(recipient);

            expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal(firstLevelAmountExpected);
            expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(firstLevelAmountExpected);
        });

        it('gives right amount of tokens across 2 levels', async function () {
            await this.giveaway.getTokens(recipient);
            expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(firstLevelAmountExpected);

            await this.giveaway.setTokensGivenAway(new BN(1000000 - 1).mul(decimalsMult));
            await this.giveaway.getTokens(anotherAccount);
            expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal(firstLevelAmountExpected);

            await this.giveaway.getTokens(initialHolder);
            expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(initialSupply.add(secondLevelAmountExpected));
        });

        it('gives 0.9 token for second 1 000 000 coins given away', async function () {
            await this.giveaway.setTokensGivenAway(new BN(1000000).mul(decimalsMult));

            await this.giveaway.getTokens(anotherAccount);
            await this.giveaway.getTokens(recipient);

            expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal(secondLevelAmountExpected);
            expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(secondLevelAmountExpected);
        });

        it('gives 0.81 token for third 1 000 000 coins given away', async function () {
            const thirdLevelAmountExpected = new BN(10).pow(decimals.subn(2)).muln(81); // 0.81 HMC
            await this.giveaway.setTokensGivenAway(new BN(2000000).mul(decimalsMult));

            await this.giveaway.getTokens(anotherAccount);
            await this.giveaway.getTokens(recipient);

            expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal(thirdLevelAmountExpected);
            expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(thirdLevelAmountExpected);
        });

        it('gives 0.013302 token for in level 42', async function () {
            const level42AmountExpected = new BN(10).pow(decimals.subn(6)).muln(13302); // 0.013302 HMC
            await this.giveaway.setTokensGivenAway(new BN(41000000).mul(decimalsMult));

            await this.giveaway.getTokens(anotherAccount);
            await this.giveaway.getTokens(recipient);

            expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal(level42AmountExpected);
            expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(level42AmountExpected);
        });

        it('gives 0.000242 token for in level 80', async function () {
            const level80AmountExpected = new BN(10).pow(decimals.subn(6)).muln(242); // 0.000242 HMC
            await this.giveaway.setTokensGivenAway(new BN(79555555).mul(decimalsMult));

            await this.giveaway.getTokens(anotherAccount);
            await this.giveaway.getTokens(recipient);

            expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal(level80AmountExpected);
            expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(level80AmountExpected);
        });
    });

    describe('timelock', function () {
        it('fails when trying to request second time', async function () {
            await this.giveaway.getTokens(anotherAccount);
            await expectRevert(this.giveaway.getTokens(anotherAccount), "HmmCoinGiveaway: address already requested within the time period");
        });

        it('fails when trying to request too early', async function () {
            await this.giveaway.getTokens(anotherAccount);
            await forwardTime(giveawayTimePeriodLen.divn(2).toNumber());

            await expectRevert(this.giveaway.getTokens(anotherAccount), "HmmCoinGiveaway: address already requested within the time period");
        });

        it('resets lock after specified time passed', async function () {
            await this.giveaway.getTokens(anotherAccount);
            await forwardTime(giveawayTimePeriodLen.addn(60).toNumber());

            await this.giveaway.getTokens(anotherAccount);
        });

        it('resets lock after specified time passed for multiple accounts', async function () {
            await this.giveaway.getTokens(anotherAccount);
            await this.giveaway.getTokens(recipient);
            await this.giveaway.getTokens(initialHolder);
            await forwardTime(giveawayTimePeriodLen.addn(60).toNumber());

            await this.giveaway.getTokens(anotherAccount);
            await this.giveaway.getTokens(recipient);
            await this.giveaway.getTokens(initialHolder);
        });

        it('resets lock after specified time passed multiple times', async function () {
            await this.giveaway.getTokens(anotherAccount);
            await forwardTime(giveawayTimePeriodLen.muln(3).toNumber());

            await this.giveaway.getTokens(anotherAccount);
        });

        it('sets correct nextResetTime after specified time passed multiple times', async function () {
            await this.giveaway.getTokens(anotherAccount);
            await forwardTime(giveawayTimePeriodLen.muln(42).addn(10).toNumber());
            await this.giveaway.getTokens(anotherAccount);
            await expectRevert(this.giveaway.getTokens(anotherAccount), "HmmCoinGiveaway: address already requested within the time period");

            await forwardTime(giveawayTimePeriodLen.subn(100).toNumber());
            await expectRevert(this.giveaway.getTokens(anotherAccount), "HmmCoinGiveaway: address already requested within the time period");

            await forwardTime(giveawayTimePeriodLen.toNumber());
            await this.giveaway.getTokens(anotherAccount);
        });

        it('resets lock at specified time', async function () {
            await this.giveaway.getTokens(anotherAccount);
            await forwardTime(giveawayTimePeriodLen.subn(10).toNumber());
            await expectRevert(this.giveaway.getTokens(anotherAccount), "HmmCoinGiveaway: address already requested within the time period");

            await forwardTime(20);
            await this.giveaway.getTokens(anotherAccount);
        });
    });
});

async function forwardTime(deltaSecs) {
    let currentBlock = await web3.eth.getBlock('latest');
    let time = Number(currentBlock.timestamp) + deltaSecs;

    return new Promise((resolve, reject) => {
        web3.currentProvider.send(
            {
                jsonrpc: "2.0",
                method: "evm_mine",
                params: [time],
                id: new Date().getTime(),
            },
            (err, res) => {
                err ? reject(err) : resolve(res);
            }
        );
    });
}
