const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { expect } = require('chai');

const HmmCoinBatchSender = artifacts.require('HmmCoinBatchSender');
const HmmCoinCrowdsale = artifacts.require('HmmCoinCrowdsale');
const HmmCoin = artifacts.require('HmmCoin');
const HmmCoinGiveaway = artifacts.require('HmmCoinGiveaway');

contract('RealWorldEnvironment', function (accounts) {
    const [ initialHolder, recipient, anotherAccount ] = accounts;

    const name = 'HmmCoin';
    const symbol = 'HMC';

    const decimals = new BN(18);
    const decimalsMult = new BN(10).pow(decimals);
    const initialSupply = new BN(1101101).mul(decimalsMult);
    const maxSupply = new BN(101101101).mul(decimalsMult);

    const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');

    const freeGiveawayAmount = new BN(5).mul(decimalsMult);
    const giveawayTimePeriodLen = new BN(24).muln(60).muln(60); // 24h

    const exchangeRate = new BN(3);
    const crowdsaleCap = new BN(20000000).mul(decimalsMult);

    beforeEach(async function () {
        // the thing is to have the real world migrations here
        this.token = await HmmCoin.new(name, symbol, initialHolder, initialSupply, maxSupply);

        this.batchSender = await HmmCoinBatchSender.new(freeGiveawayAmount, this.token.address, initialHolder);
        await this.token.grantRole(MINTER_ROLE, this.batchSender.address);

        this.crowdsale = await HmmCoinCrowdsale.new(exchangeRate, this.token.address, crowdsaleCap, initialHolder);
        await this.token.grantRole(MINTER_ROLE, this.crowdsale.address);

        this.giveaway = await HmmCoinGiveaway.new(this.token.address, giveawayTimePeriodLen);
        await this.token.grantRole(MINTER_ROLE, this.giveaway.address);
    });

    // crucial, end-user functionalities

    describe('HmmCoinBatchSender', function () {
        describe('sendBatch', function () {
            it('delivers the tokens', async function () {
                await this.batchSender.sendBatch([anotherAccount, recipient, initialHolder], { from: initialHolder });

                expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal(freeGiveawayAmount);
                expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(freeGiveawayAmount);
                expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(freeGiveawayAmount.add(initialSupply));
            });

            it('fails when callee is not owner', async function () {
                await expectRevert(this.batchSender.sendBatch([anotherAccount], { from: recipient }), 'HmmCoinBatchSender: must have owner role to execute giveaway');
            });
        });
    });

    describe('HmmCoinCrowdsale', function () {
        describe('buyTokens', function () {
            it('delivers the tokens', async function () {
                const valueWei = new BN(10).pow(decimals); // 1 ether
                const amountBought = valueWei.mul(exchangeRate);

                await this.crowdsale.buyTokens(anotherAccount, { value: valueWei, from: recipient });

                expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal(amountBought);
            });
        });
    });

    describe('HmmCoin', function () {
        it('fails when mint callee is not owner', async function () {
            await expectRevert(this.token.mint(anotherAccount, 9999, { from: recipient }), 'HmmCoin: must have minter role to mint');
        });
    });

    describe('HmmCoinGiveaway', function () {
        describe('getTokens', function () {
            it('delivers the tokens', async function () {
                const amountExpected = new BN(10).pow(decimals); // 1 HMC
                await this.giveaway.getTokens(anotherAccount);

                expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal(amountExpected);
            });

            it('fails when trying to request second time', async function () {
                await this.giveaway.getTokens(anotherAccount);
                await expectRevert(this.giveaway.getTokens(anotherAccount), "HmmCoinGiveaway: address already requested within the time period");
            });
        });
    });
});
