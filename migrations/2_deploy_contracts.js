var token = artifacts.require("../contracts/token/HmmCoin.sol");

module.exports = function(deployer) {
    deployer.deploy(token, "name", "symbol", "0x6889f0f7ac8012ac7f2ceb61398836f93c1e6452", 1000000000, 20000000000000);
};
