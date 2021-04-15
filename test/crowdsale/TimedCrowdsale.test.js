const {BN, expectRevert} = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const TimedCrowdsaleMock = artifacts.require('TimedCrowdsaleMock');
const SimpleToken = artifacts.require('SimpleToken');

contract('TimedCrowdsale', function ([_, investor, wallet, purchaser]) {
    const rate = new BN(1);
    const decimals = new BN(18);
    const decimalsMult = new BN(10).pow(decimals);
    const value = new BN(2).mul(decimalsMult);
    const nowTime = new BN(1718424762);

    // TODO test requires...

    beforeEach(async function () {
        this.token = await SimpleToken.new();

        this.openingTime = nowTime.addn(604800); //  + 1 week
        this.closingTime = this.openingTime.addn(604800); //  + 1 week
        this.afterClosingTime = this.closingTime.addn(10);

        this.crowdsale = await TimedCrowdsaleMock.new(rate, this.token.address, wallet, this.openingTime, this.closingTime);

        await this.token.transfer(this.crowdsale.address, value.muln(42));
        await this.crowdsale.setNowTime(nowTime);
    });

    it('should be ended only after end', async function () {
        expect(await this.crowdsale.hasClosed()).to.equal(false);

        await this.crowdsale.setNowTime(this.afterClosingTime);
        expect(await this.crowdsale.hasClosed()).to.equal(true);
    });

    describe('accepting payments', function () {
        it('should reject payments before start', async function () {
            await expectRevert(this.crowdsale.buyTokens(investor, {value: value}), "TimedCrowdsale: crowdsale not opened");
            await expectRevert(this.crowdsale.buyTokens(investor, {from: purchaser, value: value}), "TimedCrowdsale: crowdsale not opened");
        });

        it('should accept payments after start', async function () {
            await this.crowdsale.setNowTime(this.openingTime);
            await this.crowdsale.buyTokens(investor, {value: value, from: purchaser});
        });

        it('should reject payments after end', async function () {
            await this.crowdsale.setNowTime(this.afterClosingTime);
            await expectRevert(this.crowdsale.buyTokens(investor, {value: value, from: purchaser}), "TimedCrowdsale: crowdsale closed");
        });
    });
});
