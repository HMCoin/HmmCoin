module.exports = {
    networks: {
        develop: {
            host: "127.0.0.1",
            port: 9545,
            network_id: "*"
        }
    },
    compilers: {
        solc: {
            version: "0.8.0"
        }
    }
};
