var token = artifacts.require("../contracts/token/HmmCoin.sol");

module.exports = function(deployer) {
    deployer.deploy(token, "name", "symbol", "0xee3a56aa7824971803af7ba5eac9a7c635eb3635", 1, 2);
};
