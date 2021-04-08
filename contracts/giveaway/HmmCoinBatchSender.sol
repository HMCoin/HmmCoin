pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../token/HmmCoin.sol";

contract HmmCoinBatchSender is AccessControl {
    HmmCoin public _token;
    uint256 public giveawayAmount;

    constructor(uint256 _amount, HmmCoin token_, address owner) {
        require(address(token_) != address(0), "HmmCoinBatchSender: token must be non-zero address");
        require(owner != address(0), "HmmCoinBatchSender: owner must be non-zero address");
        require(_amount > 0, "HmmCoinBatchSender: amount must be > 0");

        _setupRole(DEFAULT_ADMIN_ROLE, owner);
        giveawayAmount = _amount;
        _token = token_;
    }

    function token() public view returns(IERC20) {
        return _token;
    }

    function sendBatch(address[] memory _addrs) external {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "HmmCoinBatchSender: must have owner role to execute giveaway");
        uint256 addrsLength = _addrs.length;

        for (uint256 i = 0; i < addrsLength; i++) {
            _deliverTokens(_addrs[i], giveawayAmount);
        }
    }

    function _deliverTokens(address beneficiary, uint256 tokenAmount) internal {
        _token.mint(beneficiary, tokenAmount);
    }
}
