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

    const rate = new BN(3);
    const cap = new BN(10000);

    beforeEach(async function () {
        this.token = await HmmCoin.new(name, symbol, initialHolder, initialSupply, maxSupply);
        this.crowdsale = await HmmCoinCrowdsale.new(rate, recipient, this.token.address, cap);
        await this.token.grantRole(MINTER_ROLE, this.crowdsale.address);
    });

    it('should store the token address', async function () {
        expect(await this.crowdsale.token()).to.equal(this.token.address);
    });

    it('should store the recipient wallet', async function () {
        expect(await this.crowdsale.wallet()).to.equal(recipient);
    });

    it('should store the exchange rate', async function () {
        let a = await this.crowdsale.rate();
        expect(await this.crowdsale.rate()).to.be.bignumber.equal(rate);
    });

    it('should store the wei raised', async function () {
        expect(await this.crowdsale.weiRaised()).to.be.bignumber.equal(new BN(0));

        await this.crowdsale.buyTokens(anotherAccount, { value: new BN(100), from: anotherAccount });
        expect(await this.crowdsale.weiRaised()).to.be.bignumber.equal(new BN(100));

        await this.crowdsale.buyTokens(anotherAccount, { value: new BN(42), from: anotherAccount });
        expect(await this.crowdsale.weiRaised()).to.be.bignumber.equal(new BN(142));

        await this.crowdsale.buyTokens(initialHolder, { value: new BN(58), from: initialHolder });
        expect(await this.crowdsale.weiRaised()).to.be.bignumber.equal(new BN(200));
    });

    it('requires a rate > 0', async function () {
        await expectRevert(
            HmmCoinCrowdsale.new(0, recipient, this.token.address, cap), 'Crowdsale: rate must be > 0',
        );
    });

    it('requires a non-zero wallet address', async function () {
        await expectRevert(
            HmmCoinCrowdsale.new(rate, ZERO_ADDRESS, this.token.address, cap), 'Crowdsale: wallet must be non-zero address',
        );
    });

    it('requires a non-zero token address', async function () {
        await expectRevert(
            HmmCoinCrowdsale.new(rate, recipient, ZERO_ADDRESS, cap), 'Crowdsale: token must be non-zero address',
        );
    });

    describe('cappedCrowdsale', function () {
        it('requires a cap > 0', async function () {
            await expectRevert(
                HmmCoinCrowdsale.new(rate, recipient, this.token.address, 0), 'HmmCoinCrowdsale: cap must be > 0',
            );
        });

        it('should store the correct cap', async function () {
            expect(await this.crowdsale.cap()).to.be.bignumber.equal(cap);
        });

        it('sells when amount is less than cap', async function () {
            const valueWei = cap.subn(1);
            const amountBought = valueWei.mul(rate);

            await this.crowdsale.buyTokens(anotherAccount, { value: valueWei, from: anotherAccount });

            expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal(amountBought);
        });

        it('fails to sell if the amount exceeds the cap', async function () {
            const valueWei = cap.subn(1);

            await this.crowdsale.buyTokens(anotherAccount, { value: valueWei, from: anotherAccount });
            await expectRevert(this.crowdsale.buyTokens(anotherAccount, { value: 2, from: anotherAccount }), 'HmmCoinCrowdsale: cap exceeded');
        });

        it('fails to sell after cap is reached', async function () {
            await this.crowdsale.buyTokens(anotherAccount, { value: cap, from: anotherAccount });
            await expectRevert(this.crowdsale.buyTokens(anotherAccount, { value: 1, from: anotherAccount }), 'HmmCoinCrowdsale: cap exceeded');
        });
    });

    describe('buyTokens', function () {
        it('emits TokensPurchased event', async function () {
            const valueWei = new BN(1000);
            const amountBought = valueWei.mul(rate);

            const receipt = await this.crowdsale.buyTokens(anotherAccount, { value: valueWei, from: initialHolder });
            expectEvent(receipt, 'TokensPurchased', { purchaser: initialHolder, beneficiary: anotherAccount, value: valueWei, amount: amountBought });
        });

        it('mints the tokens', async function () {
            const valueWei = new BN(1000);
            const amountBought = valueWei.mul(rate);

            await this.crowdsale.buyTokens(anotherAccount, { value: valueWei, from: initialHolder });

            let transferEvent = (await this.token.getPastEvents('Transfer'))[0];
            expect(transferEvent.returnValues.from).to.eq(ZERO_ADDRESS);
            expect(transferEvent.returnValues.to).to.eq(anotherAccount);
            expect(transferEvent.returnValues.value).to.eq(amountBought.toString());
        });

        it('buys 30 tokens for 10 wei', async function () {
            const valueWei = new BN(10);
            const amountBought = valueWei.mul(rate);
            const prevBalance = await this.token.balanceOf(anotherAccount);

            await this.crowdsale.buyTokens(anotherAccount, { value: valueWei, from: initialHolder });

            expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal(prevBalance.add(amountBought));
        });

        it('fails when beneficiary is zero address', async function () {
            const valueWei = new BN(10);

            await expectRevert(this.crowdsale.buyTokens(ZERO_ADDRESS, { value: valueWei, from: initialHolder }), 'Crowdsale: beneficiary must be non-zero address');
        });

        it('fails when wei value is zero', async function () {
            const valueWei = new BN(0);

            await expectRevert(this.crowdsale.buyTokens(recipient, { value: valueWei, from: initialHolder }), 'Crowdsale: wei amount is zero');
        });
    });
    // TODO test _forwardFund
    // TODO test _getTokenAmount
});
