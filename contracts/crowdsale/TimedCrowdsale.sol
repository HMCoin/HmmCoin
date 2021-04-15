pragma solidity ^0.8.0;

import "./Crowdsale.sol";


/**
 * @title TimedCrowdsale
 * @dev Crowdsale accepting contributions only within a time frame.
 */
abstract contract TimedCrowdsale is Crowdsale {
    uint256 public openingTime;
    uint256 public closingTime;

    /**
     * @dev Reverts if not in crowdsale time range.
     */
    modifier onlyWhileOpen {
        // solium-disable-next-line security/no-block-members
        require(_nowTime() >= openingTime, "TimedCrowdsale: crowdsale not opened");
        require(_nowTime() <= closingTime, "TimedCrowdsale: crowdsale closed");
        _;
    }

    /**
     * @dev Constructor, takes crowdsale opening and closing times.
     * @param _openingTime Crowdsale opening time
     * @param _closingTime Crowdsale closing time
     */
    constructor(uint256 _openingTime, uint256 _closingTime) {
        // solium-disable-next-line security/no-block-members
        require(_openingTime >= _nowTime(), "TimedCrowdsale: incorrect closing time");
        require(_closingTime > _openingTime, "TimedCrowdsale: incorrect closing time");

        openingTime = _openingTime;
        closingTime = _closingTime;
    }

    /**
     * @dev Checks whether the period in which the crowdsale is open has already elapsed.
     * @return Whether crowdsale period has elapsed
     */
    function hasClosed() public view returns (bool) {
        // solium-disable-next-line security/no-block-members
        return _nowTime() > closingTime;
    }

    /**
     * @dev Extend parent behavior requiring to be within contributing period
     * @param _beneficiary Token purchaser
     * @param _weiAmount Amount of wei contributed
     */
    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal view override onlyWhileOpen {
        super._preValidatePurchase(_beneficiary, _weiAmount);
    }

    /*
    * @dev looks like genache returns invalid block.timestamp for testrpc
    * This function is here to be overrided by mock contract for TESTING PURPOSES ONLY.
    */
    function _nowTime() internal virtual view returns (uint256) {
        return block.timestamp;
    }
}
