pragma solidity ^0.8.0;

import "../crowdsale/IncreasingPriceCrowdsale.sol";

contract IncreasingPriceCrowdsaleMock is IncreasingPriceCrowdsale {
    uint256 public nowTime_;

    constructor(IERC20 token, address owner, uint256 _openingTime, uint256 _closingTime, uint256 initialRate, uint256 finalRate)
    Crowdsale(1, token, owner) TimedCrowdsale(_openingTime, _closingTime) IncreasingPriceCrowdsale(initialRate, finalRate) { }

    function _nowTime() internal override view returns (uint256) {
        return nowTime_;
    }

    function setNowTime(uint256 v) public {
        nowTime_ = v;
    }
}
