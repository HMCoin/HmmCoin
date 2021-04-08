const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;

const {
    shouldBehaveLikeERC20,
    shouldBehaveLikeERC20Transfer,
    shouldBehaveLikeERC20Approve,
} = require('./ERC20.behavior');

const { shouldBehaveLikeERC20Burnable } = require("./ERC20Burnable.behavior");
const { shouldBehaveLikeERC20Capped } = require("./ERC20Capped.behavior");
const { shouldBehaveLikeAccessControl } = require("../access/AccessControl.behavior");

const HmmCoin = artifacts.require('HmmCoin');

contract('HmmCoin', function (accounts) {
    const [ initialHolder, recipient, anotherAccount ] = accounts;

    const name = 'HmmCoin';
    const symbol = 'hmm';

    const initialSupply = new BN(100);
    const maxSupply = new BN(10000000);

    const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');

    beforeEach(async function () {
        this.token = await HmmCoin.new(name, symbol, initialHolder, initialSupply, maxSupply);
        this.accessControl = this.token;
    });

    it('has a name', async function () {
        expect(await this.token.name()).to.equal(name);
    });

    it('has a symbol', async function () {
        expect(await this.token.symbol()).to.equal(symbol);
    });

    it('has 18 decimals', async function () {
        expect(await this.token.decimals()).to.be.bignumber.equal('18');
    });

    it('requires a non-zero cap', async function () {
        await expectRevert(
            HmmCoin.new(name, symbol, initialHolder, new BN(12), new BN(0)), 'ERC20Capped: cap is 0',
        );
    });

    it('requires a non-zero owner address', async function () {
        await expectRevert(
            HmmCoin.new(name, symbol, ZERO_ADDRESS, initialSupply, maxSupply), 'HmmCoin: owner must be non-zero address',
        );
    });

    it('requires initial balance >= max supply', async function () {
        await expectRevert(
            HmmCoin.new(name, symbol, initialHolder, new BN(12), new BN(10)), 'HmmCoin: initial supply must be lower or equal max supply',
        );
    });

    it('initialHolder has the default admin role', async function () {
        expect(await this.token.hasRole(DEFAULT_ADMIN_ROLE, initialHolder)).to.equal(true);
    });

    it('initialHolder has the minter role', async function () {
        expect(await this.token.hasRole(MINTER_ROLE, initialHolder)).to.equal(true);
    });

    shouldBehaveLikeAccessControl('AccessControl', initialHolder, anotherAccount, recipient, initialHolder);

    describe('minting', function () {
        it('initialHolder can mint tokens', async function () {
            const amount = new BN(5);
            const receipt = await this.token.mint(recipient, amount, { from: initialHolder });

            expectEvent(receipt, 'Transfer', { from: ZERO_ADDRESS, to: recipient, value: amount });
            expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(amount);
        });

        it('minter can mint tokens', async function () {
            await this.token.grantRole(MINTER_ROLE, anotherAccount);
            const amount = new BN(5);
            const receipt = await this.token.mint(recipient, amount, { from: anotherAccount });

            expectEvent(receipt, 'Transfer', { from: ZERO_ADDRESS, to: recipient, value: amount });
            expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(amount);
        });

        it('accepts multiple MINTER_ROLE roles', async function () {
            await this.token.grantRole(MINTER_ROLE, anotherAccount);
            await this.token.grantRole(MINTER_ROLE, recipient);
            const amount = new BN(5);

            let receipt = await this.token.mint(recipient, amount, { from: anotherAccount });
            expectEvent(receipt, 'Transfer', { from: ZERO_ADDRESS, to: recipient, value: amount });
            expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(amount);

            receipt = await this.token.mint(anotherAccount, amount, { from: recipient });
            expectEvent(receipt, 'Transfer', { from: ZERO_ADDRESS, to: anotherAccount, value: amount });
            expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal(amount);
        });

        it('other accounts cannot mint tokens', async function () {
            const amount = new BN(5);
            await expectRevert(
                this.token.mint(recipient, amount, { from: anotherAccount }),
                'HmmCoin: must have minter role to mint',
            );
        });
    });

    describe('burning', function () {
        it('holders can burn their tokens', async function () {
            const amount = new BN(5);
            await this.token.mint(anotherAccount, amount, { from: initialHolder });

            const receipt = await this.token.burn(amount.subn(1), { from: anotherAccount });
            expectEvent(receipt, 'Transfer', { from: anotherAccount, to: ZERO_ADDRESS, value: amount.subn(1) });

            expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal('1');
        });
    });

    shouldBehaveLikeERC20('ERC20', initialSupply, initialHolder, recipient, anotherAccount);

    shouldBehaveLikeERC20Burnable(initialHolder, initialSupply, [recipient, anotherAccount]);

    shouldBehaveLikeERC20Capped(initialHolder, [recipient], maxSupply, initialSupply);

    describe('decrease allowance', function () {
        describe('when the spender is not the zero address', function () {
            const spender = recipient;

            function shouldDecreaseApproval (amount) {
                describe('when there was no approved amount before', function () {
                    it('reverts', async function () {
                        await expectRevert(this.token.decreaseAllowance(
                            spender, amount, { from: initialHolder }), 'ERC20: decreased allowance below zero',
                        );
                    });
                });

                describe('when the spender had an approved amount', function () {
                    const approvedAmount = amount;

                    beforeEach(async function () {
                        ({ logs: this.logs } = await this.token.approve(spender, approvedAmount, { from: initialHolder }));
                    });

                    it('emits an approval event', async function () {
                        const { logs } = await this.token.decreaseAllowance(spender, approvedAmount, { from: initialHolder });

                        expectEvent.inLogs(logs, 'Approval', {
                            owner: initialHolder,
                            spender: spender,
                            value: new BN(0),
                        });
                    });

                    it('decreases the spender allowance subtracting the requested amount', async function () {
                        await this.token.decreaseAllowance(spender, approvedAmount.subn(1), { from: initialHolder });

                        expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal('1');
                    });

                    it('sets the allowance to zero when all allowance is removed', async function () {
                        await this.token.decreaseAllowance(spender, approvedAmount, { from: initialHolder });
                        expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal('0');
                    });

                    it('reverts when more than the full allowance is removed', async function () {
                        await expectRevert(
                            this.token.decreaseAllowance(spender, approvedAmount.addn(1), { from: initialHolder }),
                            'ERC20: decreased allowance below zero',
                        );
                    });
                });
            }

            describe('when the sender has enough balance', function () {
                const amount = initialSupply;

                shouldDecreaseApproval(amount);
            });

            describe('when the sender does not have enough balance', function () {
                const amount = initialSupply.addn(1);

                shouldDecreaseApproval(amount);
            });
        });

        describe('when the spender is the zero address', function () {
            const amount = initialSupply;
            const spender = ZERO_ADDRESS;

            it('reverts', async function () {
                await expectRevert(this.token.decreaseAllowance(
                    spender, amount, { from: initialHolder }), 'ERC20: decreased allowance below zero',
                );
            });
        });
    });

    describe('increase allowance', function () {
        const amount = initialSupply;

        describe('when the spender is not the zero address', function () {
            const spender = recipient;

            describe('when the sender has enough balance', function () {
                it('emits an approval event', async function () {
                    const { logs } = await this.token.increaseAllowance(spender, amount, { from: initialHolder });

                    expectEvent.inLogs(logs, 'Approval', {
                        owner: initialHolder,
                        spender: spender,
                        value: amount,
                    });
                });

                describe('when there was no approved amount before', function () {
                    it('approves the requested amount', async function () {
                        await this.token.increaseAllowance(spender, amount, { from: initialHolder });

                        expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(amount);
                    });
                });

                describe('when the spender had an approved amount', function () {
                    beforeEach(async function () {
                        await this.token.approve(spender, new BN(1), { from: initialHolder });
                    });

                    it('increases the spender allowance adding the requested amount', async function () {
                        await this.token.increaseAllowance(spender, amount, { from: initialHolder });

                        expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(amount.addn(1));
                    });
                });
            });

            describe('when the sender does not have enough balance', function () {
                const amount = initialSupply.addn(1);

                it('emits an approval event', async function () {
                    const { logs } = await this.token.increaseAllowance(spender, amount, { from: initialHolder });

                    expectEvent.inLogs(logs, 'Approval', {
                        owner: initialHolder,
                        spender: spender,
                        value: amount,
                    });
                });

                describe('when there was no approved amount before', function () {
                    it('approves the requested amount', async function () {
                        await this.token.increaseAllowance(spender, amount, { from: initialHolder });

                        expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(amount);
                    });
                });

                describe('when the spender had an approved amount', function () {
                    beforeEach(async function () {
                        await this.token.approve(spender, new BN(1), { from: initialHolder });
                    });

                    it('increases the spender allowance adding the requested amount', async function () {
                        await this.token.increaseAllowance(spender, amount, { from: initialHolder });

                        expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(amount.addn(1));
                    });
                });
            });
        });

        describe('when the spender is the zero address', function () {
            const spender = ZERO_ADDRESS;

            it('reverts', async function () {
                await expectRevert(
                    this.token.increaseAllowance(spender, amount, { from: initialHolder }), 'ERC20: approve to the zero address',
                );
            });
        });
    });

    describe('_mint', function () {
        const amount = new BN(50);
        it('rejects a null account', async function () {
            await expectRevert(
                this.token.mint(ZERO_ADDRESS, amount), 'ERC20: mint to the zero address',
            );
        });

        describe('for a non zero account', function () {
            beforeEach('minting', async function () {
                const { logs } = await this.token.mint(recipient, amount);
                this.logs = logs;
            });

            it('increments totalSupply', async function () {
                const expectedSupply = initialSupply.add(amount);
                expect(await this.token.totalSupply()).to.be.bignumber.equal(expectedSupply);
            });

            it('increments recipient balance', async function () {
                expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(amount);
            });

            it('emits Transfer event', async function () {
                const event = expectEvent.inLogs(this.logs, 'Transfer', {
                    from: ZERO_ADDRESS,
                    to: recipient,
                });

                expect(event.args.value).to.be.bignumber.equal(amount);
            });
        });
    });

    describe('_burn', function () {
        it('rejects a null account', async function () {
            await expectRevert(this.token.burnFrom(ZERO_ADDRESS, new BN(1)),
                'ERC20: burn amount exceeds allowance');
        });

        describe('for a non zero account', function () {
            it('rejects burning more than balance', async function () {
                await expectRevert(this.token.burnFrom(
                    initialHolder, initialSupply.addn(1)), 'ERC20: burn amount exceeds allowance',
                );
            });

            it('rejects burning more than balance 2', async function () {
                await expectRevert(this.token.burn(initialSupply.addn(1)), 'ERC20: burn amount exceeds balance',
                );
            });

            const describeBurn = function (description, amount) {
                describe(description, function () {
                    beforeEach('burning', async function () {
                        await this.token.approve(initialHolder, amount);
                        const { logs } = await this.token.burnFrom(initialHolder, amount);
                        this.logs = logs;
                    });

                    it('decrements totalSupply', async function () {
                        const expectedSupply = initialSupply.sub(amount);
                        expect(await this.token.totalSupply()).to.be.bignumber.equal(expectedSupply);
                    });

                    it('decrements initialHolder balance', async function () {
                        const expectedBalance = initialSupply.sub(amount);
                        expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(expectedBalance);
                    });

                    it('emits Transfer event', async function () {
                        const event = expectEvent.inLogs(this.logs, 'Transfer', {
                            from: initialHolder,
                            to: ZERO_ADDRESS,
                        });

                        expect(event.args.value).to.be.bignumber.equal(amount);
                    });
                });
            };

            describeBurn('for entire balance', initialSupply);
            describeBurn('for less amount than balance', initialSupply.subn(1));
        });
    });

    describe('_transfer', function () {
        shouldBehaveLikeERC20Transfer('ERC20', initialHolder, recipient, initialSupply, function (from, to, amount) {
            return this.token.transfer(to, amount, { from: from });
        });
    });

    describe('_approve', function () {
        shouldBehaveLikeERC20Approve('ERC20', initialHolder, recipient, initialSupply, function (owner, spender, amount) {
            return this.token.approve(spender, amount, { from: owner });
        });
    });
});
