var token = artifacts.require("../contracts/token/HmmCoin.sol");
var giveaway = artifacts.require("../contracts/giveaway/HmmCoinGiveaway.sol");
var crowdsale = artifacts.require("../contracts/crowdsale/HmmCoinCrowdsale.sol");

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

    } else if (network === "mumbai") { // Polygon testnet
        // var token_address = "0x0d4edD3ACe92E0530FA6aB21e5931AB73e1B7D76";
        // var giveaway_address = "0x0fFd8DcA0e893BE3918d7f221487c9a8F506a14a";
        // var crowdsale_address = "0xafd888F012a1B121AE557c1424Fb0F6bAd78Fb67";

        // deployer.deploy(token, "HmmCoinTestV1", "HMCT", "0xE598723F2e037DdfcbdBba73D3b6c047f939C83D", "1101101000000000000000000", "101101101000000000000000000")
        //     .then(() => token.deployed())
        //     .then(() => deployer.deploy(giveaway, token.address, 60 * 60));
        // HmmCoinCrowdsale.new(exchangeRate, this.token.address, crowdsaleCap, initialHolder);
        // deployer.deploy(crowdsale, 4, "0x0d4edD3ACe92E0530FA6aB21e5931AB73e1B7D76", "20000000000000000000000000", "0xE598723F2e037DdfcbdBba73D3b6c047f939C83D");

    } else if (network === "ethmainnet") {
        // token = 0x57d5e972d912c97bdd21483628c78d4c886218ef
        deployer.deploy(token, "HmmCoin", "HMC", "...", "1101101000000000000000000", "101101101000000000000000000")
            .then(() => token.deployed())
            .then(() => deployer.deploy(giveaway, token.address, 24 * 60 * 60));

    } else if (network === "maticmainnet") {
        // token = 0x6df5c1da0310a0725b919579d06de427cb578c83
        // giveaway = 0xbac146f5863ef1205299a6cf09d4ddee275a12c3
        // crowdsale = 0x9D5ad3001274b4a30B3Dd0efb5b957a489105D21
        // deployer.deploy(token, "HmmCoin", "HMC", "...", "1101101000000000000000000", "101101101000000000000000000")
        //     .then(() => token.deployed())
        //     .then(() => deployer.deploy(giveaway, token.address, 24 * 60 * 60));
        deployer.deploy(crowdsale, 4, "0x6df5c1da0310a0725b919579d06de427cb578c83", "20000000000000000000000000", "...");
    }
};
