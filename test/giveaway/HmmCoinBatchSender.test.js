const { BN, constants, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { expect } = require('chai');

const HmmCoinBatchSender = artifacts.require('HmmCoinBatchSender');
const HmmCoin = artifacts.require('HmmCoin');

const { shouldBehaveLikeAccessControl } = require("../access/AccessControl.behavior");

contract('HmmCoinBatchSender', function (accounts) {
    const [ initialHolder, recipient, anotherAccount ] = accounts;

    const name = 'HmmCoin';
    const symbol = 'hmm';

    const decimals = new BN(18);
    const decimalsMult = new BN(10).pow(decimals);
    const initialSupply = new BN(1101101).mul(decimalsMult);
    const maxSupply = new BN(101101101).mul(decimalsMult);

    const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');

    const giveawayAmount = new BN(142).mul(decimalsMult);

    beforeEach(async function () {
        this.token = await HmmCoin.new(name, symbol, initialHolder, initialSupply, maxSupply);
        this.batchSender = await HmmCoinBatchSender.new(giveawayAmount, this.token.address, initialHolder);
        await this.token.grantRole(MINTER_ROLE, this.batchSender.address);
        this.accessControl = this.batchSender;
    });

    it('should store the token address', async function () {
        expect(await this.batchSender.token()).to.equal(this.token.address);
    });

    it('requires a giveaway amount > 0', async function () {
        await expectRevert(
            HmmCoinBatchSender.new(0, this.token.address, initialHolder), 'HmmCoinBatchSender: amount must be > 0',
        );
    });

    it('requires a non-zero owner address', async function () {
        await expectRevert(
            HmmCoinBatchSender.new(giveawayAmount, this.token.address, ZERO_ADDRESS), 'HmmCoinBatchSender: owner must be non-zero address',
        );
    });

    it('requires a non-zero token address', async function () {
        await expectRevert(
            HmmCoinBatchSender.new(giveawayAmount, ZERO_ADDRESS, initialHolder), 'HmmCoinBatchSender: token must be non-zero address',
        );
    });

    shouldBehaveLikeAccessControl('AccessControl', initialHolder, anotherAccount, recipient, initialHolder);

    describe('sendBatch', function () {
        it('fails when msg sender is not admin', async function () {
            await expectRevert(this.batchSender.sendBatch([], {from: anotherAccount }), 'HmmCoinBatchSender: must have owner role to execute giveaway');
        });

        it('fails when no MINTER_ROLE granted', async function () {
            let token = await HmmCoin.new(name, symbol, initialHolder, initialSupply, maxSupply);
            let batchSender = await HmmCoinBatchSender.new(giveawayAmount, token.address, initialHolder);

            await expectRevert(
                batchSender.sendBatch([anotherAccount, recipient], { from: initialHolder }), 'HmmCoin: must have minter role to mint',
            );
        });

        it('mints the tokens', async function () {
            await this.batchSender.sendBatch([anotherAccount, recipient], { from: initialHolder });

            let transferEvent = (await this.token.getPastEvents('Transfer'))[0];
            expect(transferEvent.returnValues.from).to.eq(ZERO_ADDRESS);
            expect(transferEvent.returnValues.to).to.eq(anotherAccount);
            expect(transferEvent.returnValues.value).to.eq(giveawayAmount.toString());

            transferEvent = (await this.token.getPastEvents('Transfer'))[1];
            expect(transferEvent.returnValues.from).to.eq(ZERO_ADDRESS);
            expect(transferEvent.returnValues.to).to.eq(recipient);
            expect(transferEvent.returnValues.value).to.eq(giveawayAmount.toString());
        });

        it('delivers the tokens', async function () {
            await this.batchSender.sendBatch([anotherAccount, recipient, initialHolder], { from: initialHolder });

            expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal(giveawayAmount);
            expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(giveawayAmount);
            expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(giveawayAmount.add(initialSupply));
        });
    });
});
