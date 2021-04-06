const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { expect } = require('chai');

const HmmCoinGiveawayHelper = artifacts.require('HmmCoinGiveawayHelper');
const HmmCoinCrowdsale = artifacts.require('HmmCoinCrowdsale');
const HmmCoin = artifacts.require('HmmCoin');

contract('RealWorldEnvironment', function (accounts) {
    const [ initialHolder, recipient, anotherAccount ] = accounts;

    const name = 'HmmCoin';
    const symbol = 'hmm';

    const initialSupply = new BN(5000);
    const maxSupply = new BN(10000000);

    const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');

    const giveawayAmount = new BN(142);

    const rate = new BN(3);
    const cap = new BN(10000);

    beforeEach(async function () {
        // the thing is to have the real world migrations here
        // TODO real params
        this.token = await HmmCoin.new(name, symbol, initialHolder, initialSupply, maxSupply);
        this.giveawayHelper = await HmmCoinGiveawayHelper.new(giveawayAmount, this.token.address, initialHolder);
        await this.token.grantRole(MINTER_ROLE, this.giveawayHelper.address);
        this.crowdsale = await HmmCoinCrowdsale.new(rate, this.token.address, cap, initialHolder);
        await this.token.grantRole(MINTER_ROLE, this.crowdsale.address);
    });

    describe('HmmCoinGiveawayHelper', function () {
        describe('sendBatch', function () {
            it('delivers the tokens', async function () {
                await this.giveawayHelper.sendBatch([anotherAccount, recipient, initialHolder], { from: initialHolder });

                expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal(giveawayAmount);
                expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(giveawayAmount);
                expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(giveawayAmount.add(initialSupply));
            });
        });
    });

    describe('HmmCoinCrowdsale', function () {
        describe('buyTokens', function () {
            it('delivers the tokens', async function () {
                const valueWei = new BN(10);
                const amountBought = valueWei.mul(rate);

                await this.crowdsale.buyTokens(anotherAccount, { value: valueWei, from: initialHolder });

                expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal(amountBought);
            });
        });
    });

    describe('HmmCoin', function () {
        it('fails when mint callee is not owner', async function () {
            await expectRevert(this.token.mint(anotherAccount, 9999, { from: anotherAccount }), 'HmmCoin: must have minter role to mint');
        });

        describe('TokenGiveaway', function () {
            describe('getTokens', function () {
                it('delivers the tokens', async function () {
                    const amountExpected = new BN(42);
                    await this.token.getTokens(anotherAccount);

                    expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal(amountExpected);
                });
            });

            it('allows unpausing', async function () {
                await this.token.pauseGiveaway({ from: initialHolder });
                await expectRevert(this.token.getTokens(recipient), 'Pausable: paused');
                await this.token.unpauseGiveaway({ from: initialHolder });

                const amountExpected = new BN(42);
                await this.token.getTokens(recipient);

                expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(amountExpected);
            });
        });
    });
});
