const { expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
const ROLE = web3.utils.soliditySha3('ROLE');
const OTHER_ROLE = web3.utils.soliditySha3('OTHER_ROLE');

function shouldBehaveLikeAccessControl (errorPrefix, admin, authorized, other, otherAdmin) {

    describe('default admin', function () {
        it('deployer has default admin role', async function () {
            expect(await this.accessControl.hasRole(DEFAULT_ADMIN_ROLE, admin)).to.equal(true);
        });

        it('other roles\'s admin is the default admin role', async function () {
            expect(await this.accessControl.getRoleAdmin(ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
        });

        it('default admin role\'s admin is itself', async function () {
            expect(await this.accessControl.getRoleAdmin(DEFAULT_ADMIN_ROLE)).to.equal(DEFAULT_ADMIN_ROLE);
        });
    });

    describe('granting', function () {
        it('admin can grant role to other accounts', async function () {
            const receipt = await this.accessControl.grantRole(ROLE, authorized, { from: admin });
            expectEvent(receipt, 'RoleGranted', { account: authorized, role: ROLE, sender: admin });

            expect(await this.accessControl.hasRole(ROLE, authorized)).to.equal(true);
        });

        it('non-admin cannot grant role to other accounts', async function () {
            await expectRevert(
                this.accessControl.grantRole(ROLE, authorized, { from: other }),
                `${errorPrefix}: sender must be an admin to grant`,
            );
        });

        it('accounts can be granted a role multiple times', async function () {
            await this.accessControl.grantRole(ROLE, authorized, { from: admin });
            const receipt = await this.accessControl.grantRole(ROLE, authorized, { from: admin });
            expectEvent.notEmitted(receipt, 'RoleGranted');
        });
    });

    describe('revoking', function () {
        it('roles that are not had can be revoked', async function () {
            expect(await this.accessControl.hasRole(ROLE, authorized)).to.equal(false);

            const receipt = await this.accessControl.revokeRole(ROLE, authorized, { from: admin });
            expectEvent.notEmitted(receipt, 'RoleRevoked');
        });

        context('with granted role', function () {
            beforeEach(async function () {
                await this.accessControl.grantRole(ROLE, authorized, { from: admin });
            });

            it('admin can revoke role', async function () {
                const receipt = await this.accessControl.revokeRole(ROLE, authorized, { from: admin });
                expectEvent(receipt, 'RoleRevoked', { account: authorized, role: ROLE, sender: admin });

                expect(await this.accessControl.hasRole(ROLE, authorized)).to.equal(false);
            });

            it('non-admin cannot revoke role', async function () {
                await expectRevert(
                    this.accessControl.revokeRole(ROLE, authorized, { from: other }),
                    `${errorPrefix}: sender must be an admin to revoke`,
                );
            });

            it('a role can be revoked multiple times', async function () {
                await this.accessControl.revokeRole(ROLE, authorized, { from: admin });

                const receipt = await this.accessControl.revokeRole(ROLE, authorized, { from: admin });
                expectEvent.notEmitted(receipt, 'RoleRevoked');
            });
        });
    });

    describe('renouncing', function () {
        it('roles that are not had can be renounced', async function () {
            const receipt = await this.accessControl.renounceRole(ROLE, authorized, { from: authorized });
            expectEvent.notEmitted(receipt, 'RoleRevoked');
        });

        context('with granted role', function () {
            beforeEach(async function () {
                await this.accessControl.grantRole(ROLE, authorized, { from: admin });
            });

            it('bearer can renounce role', async function () {
                const receipt = await this.accessControl.renounceRole(ROLE, authorized, { from: authorized });
                expectEvent(receipt, 'RoleRevoked', { account: authorized, role: ROLE, sender: authorized });

                expect(await this.accessControl.hasRole(ROLE, authorized)).to.equal(false);
            });

            it('only the sender can renounce their roles', async function () {
                await expectRevert(
                    this.accessControl.renounceRole(ROLE, authorized, { from: admin }),
                    `${errorPrefix}: can only renounce roles for self`,
                );
            });

            it('a role can be renounced multiple times', async function () {
                await this.accessControl.renounceRole(ROLE, authorized, { from: authorized });

                const receipt = await this.accessControl.renounceRole(ROLE, authorized, { from: authorized });
                expectEvent.notEmitted(receipt, 'RoleRevoked');
            });
        });
    });
}

module.exports = {
    shouldBehaveLikeAccessControl,
};
