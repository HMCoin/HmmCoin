const {BN, expectRevert} = require('@openzeppelin/test-helpers');

const TimedCrowdsaleMock = artifacts.require('TimedCrowdsaleMock');
const SimpleToken = artifacts.require('SimpleToken');

contract('TimedCrowdsale', function ([_, investor, wallet, purchaser]) {
    const rate = new BN(1);
    const decimals = new BN(18);
    const decimalsMult = new BN(10).pow(decimals);
    const value = new BN(42).mul(decimalsMult);

    before(async function () {
        // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
        await advanceBlock();
    });

    beforeEach(async function () {
        this.token = await SimpleToken.new();

        this.openingTime = new BN(1718424762).addn(604800); //  + 1 week
        this.closingTime = this.openingTime.addn(604800); //  + 1 week
        this.afterClosingTime = this.closingTime.addn(10);

        this.crowdsale = await TimedCrowdsaleMock.new(rate, this.token.address, wallet, this.openingTime, this.closingTime);
    });

    it('should be ended only after end', async function () {
        expect(await this.crowdsale.hasClosed()).to.equal(false);

        await setTime(this.afterClosingTime);
        expect(await this.crowdsale.hasClosed()).to.equal(true);
    });

    describe('accepting payments', function () {
        it('should reject payments before start', async function () {
            await expectRevert(this.crowdsale.buyTokens(investor, {value: value}), "TimedCrowdsale: crowdsale not opened");
            await expectRevert(this.crowdsale.buyTokens(investor, {from: purchaser, value: value}), "TimedCrowdsale: crowdsale not opened");
        });

        it('should accept payments after start', async function () {
            await setTime(this.openingTime);
            await this.crowdsale.buyTokens(investor, {value: value, from: purchaser});
        });

        it('should reject payments after end', async function () {
            await setTime(this.afterClosingTime);
            await expectRevert(this.crowdsale.buyTokens(investor, {value: value, from: purchaser}), "TimedCrowdsale: crowdsale closed");
        });
    });
});

async function setTime(time) {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send(
            {
                jsonrpc: "2.0",
                method: "evm_mine",
                params: [time],
                id: new Date().getTime(),
            },
            (err, res) => {
                return err ? reject(err) : resolve(res);
            }
        );
    });
}

async function advanceBlock() {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send(
            {
                jsonrpc: '2.0',
                method: 'evm_mine',
                id: Date.now(),
            }, (err, res) => {
                return err ? reject(err) : resolve(res);
            });
    });
}
