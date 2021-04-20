const { projectId, mnemonic } = require('./.secrets.json');
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
    networks: {
        mainnet: {
            provider: () => new HDWalletProvider(mnemonic, `wss://mainnet.infura.io/ws/v3/${projectId}`),
            network_id: 1,
            gas: 0,
            gasPrice: 0,
            // confirmations: 2,    // # of confs to wait between deployments. (default: 0)
            networkCheckTimeout: 10000000,
            timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
            skipDryRun: false
        },
        develop: {
            host: "127.0.0.1",
            port: 7545,
            network_id: 5777
        },
        ropsten: {
            provider: () => new HDWalletProvider(mnemonic, `wss://ropsten.infura.io/ws/v3/${projectId}`),
            network_id: 3,
            gas: 5500000,
            // confirmations: 2,    // # of confs to wait between deployments. (default: 0)
            networkCheckTimeout: 10000000,
            timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
            skipDryRun: false
        },
        rinkeby: {
            provider: () => new HDWalletProvider(mnemonic, `wss://rinkeby.infura.io/ws/v3/${projectId}`),
            network_id: 4,
            gas: 4500000,
            networkCheckTimeout: 10000000,
            timeoutBlocks: 200,
            skipDryRun: false
            // gasPrice: 10000000000,
        },
    },

    compilers: {
        solc: {
            version: "0.8.0"
        }
    }
};
