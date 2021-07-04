pragma solidity ^0.8.0;

import "../token/HmmCoin.sol";
import "./CappedCrowdsale.sol";

contract HmmCoinCrowdsale is CappedCrowdsale {
    /**
    * @dev Constructor, takes maximum amount of wei accepted in the crowdsale.
    * @param cap_ Max amount of wei to be contributed
    */
    constructor(uint256 rate, HmmCoin token, uint256 cap_, address owner)
    CappedCrowdsale(cap_) Crowdsale(rate, token, owner) { }

    /**
     * @dev Overrides delivery by minting tokens upon purchase.
     * @param beneficiary Token purchaser
     * @param tokenAmount Number of tokens to be minted
     */
    function _deliverTokens(address beneficiary, uint256 tokenAmount) internal override {
        HmmCoin(address(token())).mint(beneficiary, tokenAmount);
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
}
