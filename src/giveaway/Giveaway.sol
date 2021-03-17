// external

pragma solidity ^0.8.0;

import "../access/AccessControl.sol";
import "../token/ERC20/IERC20.sol";

contract Giveaway is AccessControl {
    IERC20 private _token;
    uint256 public giveawayAmount;
    // TODO events?

    function Giveaway(uint256 _amount) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        giveawayAmount = _amount;
    }

    function token() public view returns(IERC20) {
        return _token;
    }

    function sendBatch(address[] _addrs) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "Giveaway: must have owner role to execute giveaway");

        for (uint256 i = 0; i < _addrs.length; i++) {
            _deliverTokens(_addrs[i], giveawayAmount);
        }
    }

    function _deliverTokens(address beneficiary, uint256 tokenAmount) internal {
        _token.transfer(beneficiary, tokenAmount);
    }
}
