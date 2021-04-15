pragma solidity ^0.8.0;

import "./TimedCrowdsale.sol";


/**
 * @title IncreasingPriceCrowdsale
 * @dev Extension of Crowdsale contract that increases the price of tokens linearly in time.
 * Note that what should be provided to the constructor is the initial and final _rates_, that is,
 * the amount of tokens per wei contributed. Thus, the initial rate must be greater than the final rate.
 */
abstract contract IncreasingPriceCrowdsale is TimedCrowdsale {
    uint256 public initialRate;
    uint256 public finalRate;

    /**
     * @dev Constructor, takes initial and final rates of tokens received per wei contributed.
     * @param _initialRate Number of tokens a buyer gets per wei at the start of the crowdsale
     * @param _finalRate Number of tokens a buyer gets per wei at the end of the crowdsale
     */
    constructor(uint256 _initialRate, uint256 _finalRate) {
        require(_initialRate >= _finalRate, "IncreasingPriceCrowdsale: incorrect initial rate");
        require(_finalRate > 0, "IncreasingPriceCrowdsale: incorrect final rate");
        initialRate = _initialRate;
        finalRate = _finalRate;
    }

    /**
     * @dev Returns the rate of tokens per wei at the present time.
     * Note that, as price _increases_ with time, the rate _decreases_.
     * @return The number of tokens a buyer gets per wei at a given time
     */
    function getCurrentRate() public view returns (uint256) {
        // solium-disable-next-line security/no-block-members
        uint256 elapsedTime = _nowTime() - openingTime;
        uint256 timeRange = closingTime - openingTime;
        uint256 rateRange = initialRate - finalRate;
        return initialRate - ((elapsedTime * rateRange) / timeRange);
    }

    /**
     * @dev Overrides parent method taking into account variable rate.
     * @param _weiAmount The value in wei to be converted into tokens
     * @return The number of tokens _weiAmount wei will buy at present time
     */
    function _getTokenAmount(uint256 _weiAmount) internal override view returns (uint256) {
        uint256 currentRate = getCurrentRate();
        return currentRate * _weiAmount;
    }
}
