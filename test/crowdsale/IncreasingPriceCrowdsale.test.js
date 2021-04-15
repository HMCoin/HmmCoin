const {BN, expectRevert} = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const IncreasingPriceCrowdsaleMock = artifacts.require('IncreasingPriceCrowdsaleMock');
const SimpleToken = artifacts.require('SimpleToken');

contract('IncreasingPriceCrowdsale', function ([_, investor, wallet, purchaser]) {
    const decimals = new BN(18);
    const decimalsMult = new BN(10).pow(decimals);
    const value = new BN(5).mul(new BN(10).pow(decimals.subn(5)));
    const nowTime = new BN(1718424762);

    describe('rate during crowdsale should change at a fixed step every block', async function () {
        let balance;
        const initialRate = new BN(9166);
        const finalRate = new BN(5500);
        const rateAtTime150 = new BN(9166);
        const rateAtTime300 = new BN(9165);
        const rateAtTime1500 = new BN(9157);
        const rateAtTime30 = new BN(9166);
        const rateAtTime150000 = new BN(8257);
        const rateAtTime450000 = new BN(6439);

        beforeEach(async function () {
            this.token = await SimpleToken.new();

            this.startTime = nowTime.addn(604800); //  + 1 week
            this.closingTime = this.startTime.addn(604800); //  + 1 week

            this.crowdsale = await IncreasingPriceCrowdsaleMock.new(this.token.address, wallet, this.startTime, this.closingTime, initialRate, finalRate);

            await this.token.transfer(this.crowdsale.address, new BN(9999).mul(decimalsMult));
            await this.crowdsale.setNowTime(nowTime);
        });

        // TODO test requires...

        it('at start', async function () {
            await this.crowdsale.setNowTime(this.startTime);
            await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
            balance = await this.token.balanceOf(investor);
            expect(balance).to.be.bignumber.equal(value.mul(initialRate));
        });

        it('at time 150', async function () {
            await this.crowdsale.setNowTime(this.startTime.addn(150));
            await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
            balance = await this.token.balanceOf(investor);
            expect(balance).to.be.bignumber.equal(value.mul(rateAtTime150));
        });

        it('at time 300', async function () {
            await this.crowdsale.setNowTime(this.startTime.addn(300));
            await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
            balance = await this.token.balanceOf(investor);
            expect(balance).to.be.bignumber.equal(value.mul(rateAtTime300));
        });

        it('at time 1500', async function () {
            await this.crowdsale.setNowTime(this.startTime.addn(1500));
            await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
            balance = await this.token.balanceOf(investor);
            expect(balance).to.be.bignumber.equal(value.mul(rateAtTime1500));
        });

        it('at time 30', async function () {
            await this.crowdsale.setNowTime(this.startTime.addn(30));
            await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
            balance = await this.token.balanceOf(investor);
            expect(balance).to.be.bignumber.equal(value.mul(rateAtTime30));
        });

        it('at time 150000', async function () {
            await this.crowdsale.setNowTime(this.startTime.addn(150000));
            await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
            balance = await this.token.balanceOf(investor);
            expect(balance).to.be.bignumber.equal(value.mul(rateAtTime150000));
        });

        it('at time 450000', async function () {
            await this.crowdsale.setNowTime(this.startTime.addn(450000));
            await this.crowdsale.buyTokens(investor, { value: value, from: purchaser });
            balance = await this.token.balanceOf(investor);
            expect(balance).to.be.bignumber.equal(value.mul(rateAtTime450000));
        });
    });
});
