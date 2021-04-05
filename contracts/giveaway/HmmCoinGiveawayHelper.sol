pragma solidity ^0.8.0;

import "./GiveawayHelper.sol";
import "../token/HmmCoin.sol";

contract HmmCoinGiveawayHelper is GiveawayHelper {
    constructor(uint256 _amount, IERC20 token_, address owner) GiveawayHelper(_amount, token_, owner) {}

    function _deliverTokens(address beneficiary, uint256 tokenAmount) internal override {
        HmmCoin(address(token())).mint(beneficiary, tokenAmount);
    }
}
