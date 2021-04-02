pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Giveaway is AccessControl {
    IERC20 private _token; // TODO set this
    uint256 public giveawayAmount;
    // TODO limits, daily
    // TODO 20% limit
    // TODO increasing user id

    constructor(uint256 _amount) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        giveawayAmount = _amount;
    }

    function token() public view returns(IERC20) {
        return _token;
    }

    function sendBatch(address[] memory _addrs) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "Giveaway: must have owner role to execute giveaway");
        uint256 addrsLength = _addrs.length;

        for (uint256 i = 0; i < addrsLength; i++) {
            _deliverTokens(_addrs[i], giveawayAmount);
        }
    }

    function _deliverTokens(address beneficiary, uint256 tokenAmount) internal virtual {
        _token.transfer(beneficiary, tokenAmount);
    }
}
