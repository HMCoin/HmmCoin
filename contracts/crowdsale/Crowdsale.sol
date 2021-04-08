pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title Crowdsale
 * @dev Crowdsale is a base contract for managing a token crowdsale,
 * allowing investors to purchase tokens with ether. This contract implements
 * such functionality in its most fundamental form and can be extended to provide additional
 * functionality and/or custom behavior.
 * The external interface represents the basic interface for purchasing tokens, and conform
 * the base architecture for crowdsales. They are *not* intended to be modified / overridden.
 * The internal interface conforms the extensible and modifiable surface of crowdsales. Override
 * the methods to add functionality. Consider using 'super' where appropriate to concatenate
 * behavior.
 */
abstract contract Crowdsale is ReentrancyGuard, Context, AccessControl {
    // The token being sold
    IERC20 private _token;

    // How many token units a buyer gets per wei.
    // The rate is the conversion between wei and the smallest and indivisible token unit.
    // So, if you are using a rate of 1 with a ERC20Detailed token with 3 decimals called TOK
    // 1 wei will give you 1 unit, or 0.001 TOK.
    uint256 private _rate;

    // Amount of wei raised
    uint256 private _weiRaised;

    /**
     * Event for token purchase logging
     * @param purchaser who paid for the tokens
     * @param beneficiary who got the tokens
     * @param value weis paid for purchase
     * @param amount amount of tokens purchased
     */
    event TokensPurchased(
        address indexed purchaser,
        address indexed beneficiary,
        uint256 value,
        uint256 amount
    );

    /**
     * @param rate_ Number of token units a buyer gets per wei
     * @dev The rate is the conversion between wei and the smallest and indivisible
     * token unit. So, if you are using a rate of 1 with a ERC20Detailed token
     * with 3 decimals called TOK, 1 wei will give you 1 unit, or 0.001 TOK.
     * @param token_ Address of the token being sold
     */
    constructor(uint256 rate_, IERC20 token_, address owner) {
        require(rate_ > 0, "Crowdsale: rate must be > 0");
        require(address(token_) != address(0), "Crowdsale: token must be non-zero address");
        require(owner != address(0), "Crowdsale: owner must be non-zero address");

        _setupRole(DEFAULT_ADMIN_ROLE, owner);
        _rate = rate_;
        _token = token_;
    }

    // -----------------------------------------
    // Crowdsale external interface
    // -----------------------------------------

    /**
     * @dev fallback function ***DO NOT OVERRIDE***
     * Note that other contracts will transfer fund with a base gas stipend
     * of 2300, which is not enough to call buyTokens. Consider calling
     * buyTokens directly when purchasing tokens from a contract.
     */
    fallback() external payable {
        buyTokens(_msgSender());
    }

    receive() external payable {
        revert();
    }

    /**
     * @return the token being sold.
     */
    function token() public view returns(IERC20) {
        return _token;
    }

    /**
     * @return the number of token units a buyer gets per wei.
     */
    function rate() public view returns(uint256) {
        return _rate;
    }

    /**
     * @return the amount of wei raised.
     */
    function weiRaised() public view returns (uint256) {
        return _weiRaised;
    }

    /**
     * @dev low level token purchase ***DO NOT OVERRIDE***
     * This function has a non-reentrancy guard, so it shouldn't be called by
     * another `nonReentrant` function.
     * @param beneficiary Recipient of the token purchase
     */
    function buyTokens(address beneficiary) public nonReentrant payable {
        uint256 weiAmount = msg.value;
        _preValidatePurchase(beneficiary, weiAmount);

        // calculate token amount to be created
        uint256 tokens = _getTokenAmount(weiAmount);

        // update state
        _weiRaised = _weiRaised + weiAmount;

        _processPurchase(beneficiary, tokens);
        emit TokensPurchased(
            _msgSender(),
            beneficiary,
            weiAmount,
            tokens
        );

        _updatePurchasingState(beneficiary, weiAmount);
        _postValidatePurchase(beneficiary, weiAmount);
    }

    function forwardFunds(address payable recipient, uint256 amount) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "Crowdsale: must have owner role to withdraw");

        _forwardFunds(recipient, amount);
    }

    // -----------------------------------------
    // Internal interface (extensible)
    // -----------------------------------------

    /**
    * @dev Executed to withdraw ether from crowdsale
    */
    function _forwardFunds(address payable recipient, uint256 amount) internal virtual {
        require(amount > 0, "Crowdsale: amount must be > 0");
        require(amount <= address(this).balance, "Crowdsale: amount must be <= current balance");

        recipient.transfer(amount);
    }

    /**
     * @dev Validation of an incoming purchase. Use require statements to revert state when conditions are not met. Use `super` in contracts that inherit from Crowdsale to extend their validations.
     * Example from CappedCrowdsale.sol's _preValidatePurchase method:
     *   super._preValidatePurchase(beneficiary, weiAmount);
     *   require(weiRaised().add(weiAmount) <= cap);
     * @param beneficiary Address performing the token purchase
     * @param weiAmount Value in wei involved in the purchase
     */
    function _preValidatePurchase(
        address beneficiary,
        uint256 weiAmount
    )
    internal virtual
    view
    {
        require(beneficiary != address(0), "Crowdsale: beneficiary must be non-zero address");
        require(weiAmount != 0, "Crowdsale: wei amount is zero");
    }

    /**
     * @dev Validation of an executed purchase. Observe state and use revert statements to undo rollback when valid conditions are not met.
     * @param beneficiary Address performing the token purchase
     * @param weiAmount Value in wei involved in the purchase
     */
    function _postValidatePurchase(
        address beneficiary,
        uint256 weiAmount
    )
    internal virtual
    view
    {
        // optional override
    }

    /**
     * @dev Source of tokens. Override this method to modify the way in which the crowdsale ultimately gets and sends its tokens.
     * @param beneficiary Address performing the token purchase
     * @param tokenAmount Number of tokens to be emitted
     */
    function _deliverTokens(
        address beneficiary,
        uint256 tokenAmount
    )
    internal virtual
    {
        _token.transfer(beneficiary, tokenAmount);
    }

    /**
     * @dev Executed when a purchase has been validated and is ready to be executed. Doesn't necessarily emit/send tokens.
     * @param beneficiary Address receiving the tokens
     * @param tokenAmount Number of tokens to be purchased
     */
    function _processPurchase(
        address beneficiary,
        uint256 tokenAmount
    )
    internal virtual
    {
        _deliverTokens(beneficiary, tokenAmount);
    }

    /**
     * @dev Override for extensions that require an internal state to check for validity (current user contributions, etc.)
     * @param beneficiary Address receiving the tokens
     * @param weiAmount Value in wei involved in the purchase
     */
    function _updatePurchasingState(
        address beneficiary,
        uint256 weiAmount
    )
    internal virtual
    {
        // optional override
    }

    /**
     * @dev Override to extend the way in which ether is converted to tokens.
     * @param weiAmount Value in wei to be converted into tokens
     * @return Number of tokens that can be purchased with the specified _weiAmount
     */
    function _getTokenAmount(uint256 weiAmount)
    internal virtual view returns (uint256)
    {
        return weiAmount * _rate;
    }
}
