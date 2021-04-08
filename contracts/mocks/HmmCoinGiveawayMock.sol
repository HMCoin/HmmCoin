pragma solidity ^0.8.0;

import "../giveaway/HmmCoinGiveaway.sol";

contract HmmCoinGiveawayMock is HmmCoinGiveaway {
    constructor(HmmCoin token_) HmmCoinGiveaway(token_) {}

    function setTokensGivenAway(uint256 value) public {
        tokensGivenAway = value;
    }
}
