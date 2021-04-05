const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { expect } = require('chai');

const HmmCoinGiveawayHelper = artifacts.require('HmmCoinGiveawayHelper');
const HmmCoin = artifacts.require('HmmCoin');

const { shouldBehaveLikeAccessControl } = require("../access/AccessControl.behavior");

contract('HmmCoinGiveawayHelper', function (accounts) {
    const [ initialHolder, recipient, anotherAccount ] = accounts;

    const name = 'HmmCoin';
    const symbol = 'hmm';

    const initialSupply = new BN(0);
    const maxSupply = new BN(10000000);

    const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');

    const giveawayAmount = new BN(142);

    beforeEach(async function () {
        this.token = await HmmCoin.new(name, symbol, initialHolder, initialSupply, maxSupply);
        this.giveawayHelper = await HmmCoinGiveawayHelper.new(giveawayAmount, this.token.address, initialHolder);
        await this.token.grantRole(MINTER_ROLE, this.giveawayHelper.address);
        this.accessControl = this.giveawayHelper;
    });

    it('should store the token address', async function () {
        expect(await this.giveawayHelper.token()).to.equal(this.token.address);
    });

    it('requires a giveaway amount > 0', async function () {
        await expectRevert(
            HmmCoinGiveawayHelper.new(0, this.token.address, initialHolder), 'GiveawayHelper: amount must be > 0',
        );
    });

    it('requires a non-zero owner address', async function () {
        await expectRevert(
            HmmCoinGiveawayHelper.new(giveawayAmount, this.token.address, ZERO_ADDRESS), 'GiveawayHelper: owner must be non-zero address',
        );
    });

    it('requires a non-zero token address', async function () {
        await expectRevert(
            HmmCoinGiveawayHelper.new(giveawayAmount, ZERO_ADDRESS, initialHolder), 'GiveawayHelper: token must be non-zero address',
        );
    });

    shouldBehaveLikeAccessControl('AccessControl', initialHolder, anotherAccount, recipient, initialHolder);

    describe('sendBatch', function () {
        it('fails when msg sender is not admin', async function () {
            await expectRevert(this.giveawayHelper.sendBatch([], {from: anotherAccount }), 'GiveawayHelper: must have owner role to execute giveaway');
        });

        it('mints the tokens', async function () {
            await this.giveawayHelper.sendBatch([anotherAccount, recipient], { from: initialHolder });

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
            await this.giveawayHelper.sendBatch([anotherAccount, recipient, initialHolder], { from: initialHolder });

            expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal(giveawayAmount);
            expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(giveawayAmount);
            expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(giveawayAmount);
        });
    });

    // TODO test giveaway amount, limits
});
