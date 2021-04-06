pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @dev Extension of {ERC20} that adds ability to request tokens.
 */
abstract contract TokenGiveaway is ERC20, ReentrancyGuard, Pausable, AccessControl {
    constructor(address owner) {
        require(owner != address(0), "TokenGiveaway: owner must be non-zero address");
        _setupRole(DEFAULT_ADMIN_ROLE, owner);
    }

    event TokensGivenAway(
        address indexed beneficiary,
        uint256 amount
    );

    function pauseGiveaway() public {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "TokenGiveaway: must have owner role to pause");
        _pause();
    }

    function unpauseGiveaway() public {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "TokenGiveaway: must have owner role to unpause");
        _unpause();
    }

    /**
     * @param beneficiary Recipient of the token purchase
     */
    function getTokens(address beneficiary) public nonReentrant whenNotPaused {
        _preValidateRequest(beneficiary);

        // calculate token amount to be created
        uint256 tokens = _getTokenAmount();

        _processRequest(beneficiary, tokens);
        emit TokensGivenAway(
            beneficiary,
            tokens
        );

        _updatePurchasingState(beneficiary, tokens);
        _postValidateRequest(beneficiary, tokens);
    }

    /**
     * @dev Validation of an incoming request. Use require statements to revert state when conditions are not met. Use `super` in contracts that inherit from TokenGiveaway to extend their validations.
     * @param beneficiary Address performing the token purchase
     */
    function _preValidateRequest(address beneficiary) internal virtual view {
        require(beneficiary != address(0), "TokenGiveaway: beneficiary must be non-zero address");
    }

    /**
     * @dev Executed when a request has been validated and is ready to be executed. Doesn't necessarily emit/send tokens.
     * @param beneficiary Address receiving the tokens
     * @param tokenAmount Number of tokens to be purchased
     */
    function _processRequest(address beneficiary, uint256 tokenAmount) internal virtual {
        _deliverTokens(beneficiary, tokenAmount);
    }

    /**
     * @dev Source of tokens. Override this method to modify the way in which the giveaway ultimately gets and sends its tokens.
     * @param beneficiary Address performing the token purchase
     * @param tokenAmount Number of tokens to be emitted
     */
    function _deliverTokens(address beneficiary, uint256 tokenAmount) internal virtual {
        transfer(beneficiary, tokenAmount);
    }

    /**
     * @dev Validation of an executed purchase. Observe state and use revert statements to undo rollback when valid conditions are not met.
     * @param beneficiary Address performing the request
     * @param tokenAmount Value in tokens given away
     */
    function _postValidateRequest(address beneficiary, uint256 tokenAmount) internal virtual view {
        // optional override
    }

    /**
     * @dev Override to extend the way in which ether is converted to tokens.
     * @return Number of tokens that can be given away
     */
    function _getTokenAmount() internal virtual view returns (uint256);

    /**
     * @dev Override for extensions that require an internal state to check for validity (current user contributions, etc.)
     * @param beneficiary Address receiving the tokens
     * @param tokenAmount Value in tokens given away
     */
    function _updatePurchasingState(address beneficiary, uint256 tokenAmount) internal virtual {
        // optional override
    }
}
