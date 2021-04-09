pragma solidity ^0.8.0;

import "./Giveaway.sol";
import "../token/HmmCoin.sol";

contract HmmCoinGiveaway is Giveaway {
    uint256 public tokensGivenAway;
    uint256 public nextResetTime;

    uint256 private _decimals;
    mapping (address => bool) private _lastRequestsMap;
    address[] private _lastRequests;
    uint256 private _timePeriodLenSecs;

    constructor(HmmCoin token_, uint256 timePeriodLenSecs_) Giveaway(token_) {
        require(timePeriodLenSecs_ > 0, "HmmCoinGiveaway: timePeriodLenSecs must be > 0");
        _decimals = token_.decimals();
        require(_decimals > 6, "HmmCoinGiveaway: token not supported");
        tokensGivenAway = 0;
        _timePeriodLenSecs = timePeriodLenSecs_;
        nextResetTime = block.timestamp + timePeriodLenSecs_;
    }

    function _deliverTokens(address beneficiary, uint256 tokenAmount) internal override {
        HmmCoin(address(token())).mint(beneficiary, tokenAmount);
    }

    function _getTokenAmount() internal override view returns (uint256) {
        // those values are multiplied by 10 ** 6 to avoid float numbers operations
        // [1 HMC, 0.9 HMC, 0.81 HMC, ...]
        uint24[80] memory rewards = [1000000, 900000, 810000, 729000, 656100, 590490, 531441, 478296, 430467, 387420, 348678, 313810, 282429, 254186, 228767, 205891, 185302, 166771, 150094, 135085, 121576, 109418, 98477, 88629, 79766, 71789, 64610, 58149, 52334, 47101, 42391, 38152, 34336, 30903, 27812, 25031, 22528, 20275, 18248, 16423, 14780, 13302, 11972, 10775, 9697, 8727, 7854, 7069, 6362, 5726, 5153, 4638, 4174, 3757, 3381, 3043, 2738, 2465, 2218, 1996, 1797, 1617, 1455, 1310, 1179, 1061, 955, 859, 773, 696, 626, 563, 506, 456, 411, 369, 332, 299, 269, 242];
        uint256 decimalsLeft = _decimals - 6;

        uint256 level = tokensGivenAway / 1000000 / (10 ** _decimals);
        require(level >= 0);
        require(level < 80, "HmmCoinGiveaway: all tokens given away");
        return rewards[level] * (10 ** decimalsLeft);
    }

    function _preValidateRequest(address beneficiary) internal override {
        super._preValidateRequest(beneficiary);

        if (block.timestamp >= nextResetTime) {
            _resetLastRequests();
        }

        require(_lastRequestsMap[beneficiary] == false, "HmmCoinGiveaway: address already requested within the time period");
    }

    function _ceilDiv(uint256 a, uint256 m) internal pure returns (uint256) {
        return (a + m - 1) / m;
    }

    function _resetLastRequests() internal {
        nextResetTime = nextResetTime + (_ceilDiv(block.timestamp - nextResetTime, _timePeriodLenSecs) * _timePeriodLenSecs);

        for (uint256 i = 0; i < _lastRequests.length; i++) {
            _lastRequestsMap[_lastRequests[i]] = false;
        }

        delete _lastRequests;
    }

    function _updatePurchasingState(address beneficiary, uint256 tokenAmount) internal override {
        tokensGivenAway = tokensGivenAway + tokenAmount;
        _lastRequestsMap[beneficiary] = true;
        _lastRequests.push(beneficiary);
    }
}
