## Deploy
```
$ truffle version
  Truffle v5.2.5 (core: 5.2.5)
  Solidity - 0.8.0 (solc-js)
  Node v14.16.0
  Web3.js v1.2.9

$ truffle compile --all
$ truffle deploy --network ...
```

## Interact
```
$ truffle console --network ...
truffle(ropsten)> let token = await HmmCoin.deployed() // or let token = await HmmCoin.at("...")
truffle(ropsten)> let giveaway = await HmmCoinGiveaway.deployed()
truffle(ropsten)> const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE')
truffle(ropsten)> token.grantRole(MINTER_ROLE, giveaway.address, { gasPrice: ... })
truffle(ropsten)> giveaway.getTokens(...)
```
