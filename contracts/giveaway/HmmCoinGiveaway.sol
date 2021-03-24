pragma solidity ^0.8.0;

import "./Giveaway.sol";
import "../token/HmmCoin.sol";

contract HmmCoinGiveaway is Giveaway {
    constructor(uint256 _amount) Giveaway(_amount) {}

    function _deliverTokens(address beneficiary, uint256 tokenAmount) internal override {
        // TODO mint(beneficiary, tokenAmount)
    }
}
