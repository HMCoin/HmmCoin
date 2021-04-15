pragma solidity ^0.8.0;

import "../crowdsale/TimedCrowdsale.sol";

contract TimedCrowdsaleMock is TimedCrowdsale {
    uint256 public nowTime_;

    constructor(uint256 rate, IERC20 token, address owner, uint256 _openingTime, uint256 _closingTime)
    TimedCrowdsale(_openingTime, _closingTime) Crowdsale(rate, token, owner) { }

    function _nowTime() internal override view returns (uint256) {
        return nowTime_;
    }

    function setNowTime(uint256 v) public {
        nowTime_ = v;
    }
}
