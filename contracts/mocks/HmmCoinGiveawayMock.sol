pragma solidity ^0.8.0;

import "../giveaway/HmmCoinGiveaway.sol";

contract HmmCoinGiveawayMock is HmmCoinGiveaway {
    constructor(HmmCoin token_, uint256 timePeriodLen_) HmmCoinGiveaway(token_, timePeriodLen_) {}

    function setTokensGivenAway(uint256 value) public {
        tokensGivenAway = value;
    }
}
