const { BN, expectRevert } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');

function shouldBehaveLikeERC20Capped (minter, [other], cap, initialSupply) {
    describe('capped token', function () {
        const from = minter;

        it('starts with the correct cap', async function () {
            expect(await this.token.cap()).to.be.bignumber.equal(cap);
        });

        it('mints when amount is less than cap', async function () {
            const _cap = cap.sub(initialSupply);
            await this.token.mint(other, _cap.subn(1), { from });
            expect(await this.token.totalSupply()).to.be.bignumber.equal(cap.subn(1));
        });

        it('fails to mint if the amount exceeds the cap', async function () {
            const _cap = cap.sub(initialSupply);
            await this.token.mint(other, _cap.subn(1), { from });
            await expectRevert(this.token.mint(other, 2, { from }), 'ERC20Capped: cap exceeded');
        });

        it('fails to mint after cap is reached', async function () {
            const _cap = cap.sub(initialSupply);
            await this.token.mint(other, _cap, { from });
            await expectRevert(this.token.mint(other, 1, { from }), 'ERC20Capped: cap exceeded');
        });
    });
}

module.exports = {
    shouldBehaveLikeERC20Capped,
};
