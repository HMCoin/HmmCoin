pragma solidity ^0.8.0;

import "./Crowdsale.sol";
import "../token/HmmCoin.sol";

contract HmmCoinCrowdsale is Crowdsale {
    uint256 private _cap;

    /**
    * @dev Constructor, takes maximum amount of wei accepted in the crowdsale.
    * @param cap_ Max amount of wei to be contributed
    */
    constructor(uint256 rate, address payable wallet, HmmCoin token, uint256 cap_) Crowdsale(rate, wallet, token) {
        require(cap_ > 0, "HmmCoinCrowdsale: cap must be > 0");
        _cap = cap_;
    }

    function cap() public view returns(uint256) {
        return _cap;
    }

    /**
     * @dev Overrides delivery by minting tokens upon purchase.
     * @param beneficiary Token purchaser
     * @param tokenAmount Number of tokens to be minted
     */
    function _deliverTokens(address beneficiary, uint256 tokenAmount) internal override {
        HmmCoin(address(token())).mint(beneficiary, tokenAmount); // TODO require?
    }

    /**
    * @dev Extend parent behavior requiring purchase to respect the funding cap.
    * @param _beneficiary Token purchaser
    * @param _weiAmount Amount of wei contributed
    */
    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal view override {
        super._preValidatePurchase(_beneficiary, _weiAmount);
        require(weiRaised() + _weiAmount <= _cap, "HmmCoinCrowdsale: cap exceeded");
    }

    /**
     * @dev Override to extend the way in which ether is converted to tokens.
     * @param weiAmount Value in wei to be converted into tokens
     * @return Number of tokens that can be purchased with the specified _weiAmount
     */
    function _getTokenAmount(uint256 weiAmount) internal override view returns (uint256)
    {
        return weiAmount * rate();
    }



    // TODO _preValidatePurchase capped?
    // TODO _getTokenAmount to calculate token amount
    // TODO _forwardFunds when? on demand?
}
