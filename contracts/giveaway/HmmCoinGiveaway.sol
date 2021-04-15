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
        // [1 HMC, 0.93 HMC, 0.86 HMC, ...]
        uint24[77] memory rewards = [1000000, 930000, 864900, 804357, 748052, 695688, 646990, 601700, 559581, 520411, 483982, 450103, 418596, 389294, 362043, 336700, 313131, 291212, 270827, 251869, 234238, 217842, 202593, 188411, 175222, 162957, 151550, 140941, 131075, 121900, 113367, 105431, 98051, 91187, 84804, 78868, 73347, 68213, 63438, 58997, 54867, 51027, 47455, 44133, 41044, 38170, 35498, 33014, 30703, 28553, 26555, 24696, 22967, 21359, 19864, 18474, 17180, 15978, 14859, 13819, 12852, 11952, 11115, 10337, 9614, 8941, 8315, 7733, 7191, 6688, 6220, 5784, 5379, 5003, 4653, 4327, 4024];
        uint256 decimalsLeft = _decimals - 6;

        uint256 level = tokensGivenAway / 1000000 / (10 ** _decimals);
        require(level >= 0);
        require(level < 77, "HmmCoinGiveaway: all tokens given away");
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
