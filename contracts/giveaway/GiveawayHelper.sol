pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract GiveawayHelper is AccessControl {
    IERC20 private _token;
    uint256 public giveawayAmount;

    constructor(uint256 _amount, IERC20 token_, address owner) {
        require(address(token_) != address(0), "GiveawayHelper: token must be non-zero address");
        require(owner != address(0), "GiveawayHelper: owner must be non-zero address");
        require(_amount > 0, "GiveawayHelper: amount must be > 0");

        _setupRole(DEFAULT_ADMIN_ROLE, owner);
        giveawayAmount = _amount;
        _token = token_;
    }

    function token() public view returns(IERC20) {
        return _token;
    }

    function sendBatch(address[] memory _addrs) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "GiveawayHelper: must have owner role to execute giveaway");
        uint256 addrsLength = _addrs.length;

        for (uint256 i = 0; i < addrsLength; i++) {
            _deliverTokens(_addrs[i], giveawayAmount);
        }
    }

    function _deliverTokens(address beneficiary, uint256 tokenAmount) internal virtual {
        _token.transfer(beneficiary, tokenAmount);
    }
}
