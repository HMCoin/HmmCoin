pragma solidity ^0.8.0;

import "../crowdsale/TimedCrowdsale.sol";

contract TimedCrowdsaleMock is TimedCrowdsale {
    constructor(uint256 rate, IERC20 token, address owner, uint256 _openingTime, uint256 _closingTime)
    TimedCrowdsale(_openingTime, _closingTime) Crowdsale(rate, token, owner) { }
}
