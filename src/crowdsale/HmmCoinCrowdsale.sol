pragma solidity ^0.8.0;

import "./Crowdsale.sol";
import "../token/HmmCoin.sol";

contract HmmCoinCrowdsale is Crowdsale {
    constructor(uint256 rate, address payable wallet, HmmCoin token) public Crowdsale(rate, wallet, token) {}

    /**
     * @dev Overrides delivery by minting tokens upon purchase.
     * @param beneficiary Token purchaser
     * @param tokenAmount Number of tokens to be minted
     */
    function _deliverTokens(address beneficiary, uint256 tokenAmount) internal override {
        require(HmmCoin(address(token())).mint(beneficiary, tokenAmount));
    }

    // TODO _preValidatePurchase capped?
    // TODO _getTokenAmount to calculate token amount
    // TODO _forwardFunds when? on demand?
}
