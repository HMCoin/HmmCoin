const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { expect } = require('chai');

const HmmCoinCrowdsale = artifacts.require('HmmCoinCrowdsale');
const HmmCoin = artifacts.require('HmmCoin');

contract('HmmCoinCrowdsale', function (accounts) {
    const [ initialHolder, recipient, anotherAccount ] = accounts;

    const name = 'HmmCoin';
    const symbol = 'hmm';

    const initialSupply = new BN(0);
    const maxSupply = new BN(10000000);

    const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');

    const rate = 3;

    beforeEach(async function () {
        this.token = await HmmCoin.new(name, symbol, initialHolder, initialSupply, maxSupply);
        this.crowdsale = await HmmCoinCrowdsale.new(rate, recipient, this.token.address);
        await this.token.grantRole(MINTER_ROLE, this.crowdsale.address);
    });

    it('should store the token address', async function () {
        expect(await this.crowdsale.token()).to.equal(this.token.address);
    });

    it('should store the recipient wallet', async function () {
        expect(await this.crowdsale.wallet()).to.equal(recipient);
    });

    describe('buyTokens', function () {
        it('emits TokensPurchased event', async function () {
            const valueWei = new BN(1000);
            const amountBought = valueWei.muln(rate);

            const receipt = await this.crowdsale.buyTokens(anotherAccount, { value: valueWei, from: initialHolder });
            expectEvent(receipt, 'TokensPurchased', { purchaser: initialHolder, beneficiary: anotherAccount, value: valueWei, amount: amountBought });
        });

        it('mints tokens', async function () {
            const valueWei = new BN(1000);
            const amountBought = valueWei.muln(rate);

            await this.crowdsale.buyTokens(anotherAccount, { value: valueWei, from: initialHolder });

            let transferEvent = (await this.token.getPastEvents('Transfer'))[0];
            expect(transferEvent.returnValues.from).to.eq(ZERO_ADDRESS);
            expect(transferEvent.returnValues.to).to.eq(anotherAccount);
            expect(transferEvent.returnValues.value).to.eq(amountBought.toString());
        });

        it('buys 30 tokens for 10 wei', async function () {
            const valueWei = new BN(10);
            const amountBought = valueWei.muln(rate);
            const prevBalance = await this.token.balanceOf(anotherAccount);

            await this.crowdsale.buyTokens(anotherAccount, { value: valueWei, from: initialHolder });

            expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal(prevBalance.add(amountBought));
        });
    });
});
