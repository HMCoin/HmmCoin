var token = artifacts.require("../contracts/token/HmmCoin.sol");
var giveaway = artifacts.require("../contracts/giveaway/HmmCoinGiveaway.sol");

module.exports = function(deployer, network) {
    if (network === "develop") {
        deployer.deploy(token, "name", "symbol", "0x6889f0f7ac8012ac7f2ceb61398836f93c1e6452", 1000000000, 20000000000000);

    } else if (network === "ropsten") {
        deployer.deploy(token, "HmmCoinTestV1", "HMCT", "0xE598723F2e037DdfcbdBba73D3b6c047f939C83D", "1101101000000000000000000", "101101101000000000000000000")
            .then(() => token.deployed())
            .then(() => deployer.deploy(giveaway, token.address, 60 * 60));

    } else if (network === "rinkeby") {
        deployer.deploy(token, "HmmCoinTestV1", "HMCT", "0xE598723F2e037DdfcbdBba73D3b6c047f939C83D", "1101101000000000000000000", "101101101000000000000000000")
            .then(() => token.deployed())
            .then(() => deployer.deploy(giveaway, token.address, 60 * 60));

    } else if (network === "mainnet") {
        deployer.deploy(token, "HmmCoin", "HMC", "...", "1101101000000000000000000", "101101101000000000000000000")
            .then(() => token.deployed())
            .then(() => deployer.deploy(giveaway, token.address, 24 * 60 * 60));
    }
};
