const {BN, constants, expectEvent, expectRevert} = require('@openzeppelin/test-helpers');
const {expect} = require('chai');
const {ZERO_ADDRESS} = constants;

const {shouldBehaveLikeAccessControl} = require("../access/AccessControl.behavior");

const HmmCoin = artifacts.require('HmmCoin');
const HmmCoinGiveaway = artifacts.require('HmmCoinGiveaway');

contract('HmmCoinGiveaway', function (accounts) {
    const [initialHolder, recipient, anotherAccount] = accounts;

    const name = 'HmmCoin';
    const symbol = 'hmm';

    const initialSupply = new BN(100);
    const maxSupply = new BN(10000000);
    const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');

    beforeEach(async function () {
        this.token = await HmmCoin.new(name, symbol, initialHolder, initialSupply, maxSupply);
        this.giveaway = await HmmCoinGiveaway.new(initialHolder, this.token.address);
        await this.token.grantRole(MINTER_ROLE, this.giveaway.address);
        this.accessControl = this.giveaway;
    });

    shouldBehaveLikeAccessControl('AccessControl', initialHolder, anotherAccount, recipient, initialHolder);

    describe('Pausable', function () {
        it('emits Paused event', async function () {
            const receipt = await this.giveaway.pauseGiveaway({from: initialHolder});

            expectEvent(receipt, 'Paused', {account: initialHolder});
        });

        it('emits Unpaused event', async function () {
            await this.giveaway.pauseGiveaway({from: initialHolder});
            const receipt = await this.giveaway.unpauseGiveaway({from: initialHolder});

            expectEvent(receipt, 'Unpaused', {account: initialHolder});
        });

        it('fails when pause callee is not owner', async function () {
            await expectRevert(this.giveaway.pauseGiveaway({from: anotherAccount}), 'Giveaway: must have owner role to pause');
        });

        it('fails when unpause callee is not owner', async function () {
            await this.giveaway.pauseGiveaway({from: initialHolder});
            await expectRevert(this.giveaway.unpauseGiveaway({from: anotherAccount}), 'Giveaway: must have owner role to unpause');
        });
    });

    describe('getTokens', function () {
        it('emits TokensGivenAway event', async function () {
            const amountExpected = new BN(42);
            const receipt = await this.giveaway.getTokens(anotherAccount);

            expectEvent(receipt, 'TokensGivenAway', {beneficiary: anotherAccount, amount: amountExpected});
        });

        it('mints the tokens', async function () {
            const amountExpected = new BN(42);
            await this.giveaway.getTokens(anotherAccount);

            let transferEvent = (await this.token.getPastEvents('Transfer'))[0];
            expect(transferEvent.returnValues.from).to.eq(ZERO_ADDRESS);
            expect(transferEvent.returnValues.to).to.eq(anotherAccount);
            expect(transferEvent.returnValues.value).to.eq(amountExpected.toString());
        });

        it('delivers the tokens', async function () {
            const amountExpected = new BN(42);
            await this.giveaway.getTokens(anotherAccount);

            expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal(amountExpected);
        });

        it('fails when beneficiary is zero address', async function () {
            await expectRevert(this.giveaway.getTokens(ZERO_ADDRESS), 'Giveaway: beneficiary must be non-zero address');
        });

        it('fails when paused', async function () {
            await this.giveaway.pauseGiveaway({from: initialHolder});
            await expectRevert(this.giveaway.getTokens(recipient), 'Pausable: paused');
        });

        it('allows unpausing', async function () {
            await this.giveaway.pauseGiveaway({from: initialHolder});
            await expectRevert(this.giveaway.getTokens(recipient), 'Pausable: paused');
            await this.giveaway.unpauseGiveaway({from: initialHolder});

            const amountExpected = new BN(42);
            await this.giveaway.getTokens(recipient);

            expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(amountExpected);
        });

        // TODO test _getTokenAmount
    });
});
