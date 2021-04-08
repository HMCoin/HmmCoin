pragma solidity ^0.8.0;

import "./Giveaway.sol";
import "../token/HmmCoin.sol";

contract HmmCoinGiveaway is Giveaway {
    uint256 public giveawayId;

    constructor(address owner, HmmCoin token_) Giveaway(owner, token_) {
        giveawayId = 0;
    }

    function _deliverTokens(address beneficiary, uint256 tokenAmount) internal override {
        HmmCoin(address(token())).mint(beneficiary, tokenAmount);
    }

    function _getTokenAmount() internal override view returns (uint256) {
        return 42;
        // TODO
    }

    function _updatePurchasingState(address beneficiary, uint256 tokenAmount) internal override {
        giveawayId = giveawayId + 1;
    }
}