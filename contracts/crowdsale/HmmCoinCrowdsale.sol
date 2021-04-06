pragma solidity ^0.8.0;

import "./Crowdsale.sol";
import "../token/HmmCoin.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract HmmCoinCrowdsale is Crowdsale, AccessControl {
    uint256 private _cap;

    /**
    * @dev Constructor, takes maximum amount of wei accepted in the crowdsale.
    * @param cap_ Max amount of wei to be contributed
    */
    constructor(uint256 rate, HmmCoin token, uint256 cap_, address owner) Crowdsale(rate, token) {
        require(cap_ > 0, "HmmCoinCrowdsale: cap must be > 0");
        require(owner != address(0), "HmmCoinCrowdsale: owner must be non-zero address");

        _setupRole(DEFAULT_ADMIN_ROLE, owner);
        _cap = cap_;
    }

    function cap() public view returns(uint256) {
        return _cap;
    }

    function forwardFunds(address payable recipient, uint256 amount) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "HmmCoinCrowdsale: must have owner role to withdraw");
        require(amount > 0, "HmmCoinCrowdsale: amount must be > 0");
        require(amount <= address(this).balance, "HmmCoinCrowdsale: amount must be <= current balance");

        recipient.transfer(amount);
    }

    /**
     * @dev Overrides delivery by minting tokens upon purchase.
     * @param beneficiary Token purchaser
     * @param tokenAmount Number of tokens to be minted
     */
    function _deliverTokens(address beneficiary, uint256 tokenAmount) internal override {
        HmmCoin(address(token())).mint(beneficiary, tokenAmount);
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
        return weiAmount * rate(); // TODO
    }
}
