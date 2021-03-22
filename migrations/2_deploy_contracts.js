var token = artifacts.require("../contracts/token/HmmCoin.sol");

module.exports = function(deployer) {
    deployer.deploy(token, 100, 1000);
};
