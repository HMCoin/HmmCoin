const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { expect } = require('chai');

const { shouldBehaveLikeAccessControl } = require("../access/AccessControl.behavior");

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
        this.crowdsale = await HmmCoinCrowdsale.new(rate, this.token.address, cap, initialHolder);
        await this.token.grantRole(MINTER_ROLE, this.crowdsale.address);
        this.accessControl = this.crowdsale;
    });

    shouldBehaveLikeAccessControl('AccessControl', initialHolder, anotherAccount, recipient, initialHolder);

    it('should store the token address', async function () {
        expect(await this.crowdsale.token()).to.equal(this.token.address);
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
            HmmCoinCrowdsale.new(0, this.token.address, cap, initialHolder), 'Crowdsale: rate must be > 0',
        );
    });

    it('requires a non-zero token address', async function () {
        await expectRevert(
            HmmCoinCrowdsale.new(rate, ZERO_ADDRESS, cap, initialHolder), 'Crowdsale: token must be non-zero address',
        );
    });

    it('requires a non-zero owner address', async function () {
        await expectRevert(
            HmmCoinCrowdsale.new(rate, this.token.address, cap, ZERO_ADDRESS), 'HmmCoinCrowdsale: owner must be non-zero address',
        );
    });

    describe('forwardFunds', function () {
        it('fails when called by non-admin', async function () {
            await this.crowdsale.buyTokens(anotherAccount, { value: 999, from: anotherAccount });

            await expectRevert(
                this.crowdsale.forwardFunds(initialHolder, 1, { from: anotherAccount }), 'HmmCoinCrowdsale: must have owner role to withdraw',
            );
        });

        it('fails when trying to withdraw too much', async function () {
            await this.crowdsale.buyTokens(anotherAccount, { value: 5000, from: anotherAccount });

            await expectRevert(
                this.crowdsale.forwardFunds(recipient, 6000, { from: initialHolder }), 'HmmCoinCrowdsale: amount must be <= current balance',
            );
        });

        it('fails when amount is zero', async function () {
            await this.crowdsale.buyTokens(anotherAccount, { value: 5000, from: anotherAccount });

            await expectRevert(
                this.crowdsale.forwardFunds(recipient, 0, { from: initialHolder }), 'HmmCoinCrowdsale: amount must be > 0',
            );
        });

        it('forwards funds', async function () {
            const prevBalance = await web3.eth.getBalance(recipient);
            await this.crowdsale.buyTokens(anotherAccount, { value: new BN(5000), from: anotherAccount });
            await this.crowdsale.forwardFunds(recipient, new BN(4000), { from: initialHolder });

            expect(await web3.eth.getBalance(recipient)).to.be.bignumber.equal(new BN(prevBalance).addn(4000));
            expect(await web3.eth.getBalance(this.crowdsale.address)).to.be.bignumber.equal(new BN(1000));
        });
    });

    describe('cappedCrowdsale', function () {
        it('requires a cap > 0', async function () {
            await expectRevert(
                HmmCoinCrowdsale.new(rate, this.token.address, 0, initialHolder), 'HmmCoinCrowdsale: cap must be > 0',
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
        it('stores funds', async function () {
            const valueWei = new BN(5000);
            await this.crowdsale.buyTokens(anotherAccount, { value: valueWei, from: anotherAccount });

            expect(await web3.eth.getBalance(this.crowdsale.address)).to.be.bignumber.equal(new BN(valueWei));
        });

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
    // TODO test _getTokenAmount
});
