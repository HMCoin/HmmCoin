pragma solidity ^0.8.0;

import "../access/AccessControl.sol";

contract Donation is AccessControl {
    mapping (address => uint256) public donators;

    event NewDonation(address indexed donator, uint256 amount);
    event Withdrawal(address indexed addr, uint256 amount);
    event ContractDestroyed(address indexed contractAddress);

    function Donation() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    function () external payable {
        donate(_msgSender());
    }

    function donate() public payable {
        require(msg.value > 0, "Donation: value must be > 0");

        uint256 share = donators[_msgSender()];
        donators[_msgSender()] = share + msg.value;

        emit NewDonation(_msgSender(), msg.value);
    }

    function withdraw(uint amount) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "Donation: must have owner role to withdraw");
        require(amount > 0, "Donation: amount must be > 0");
        require(amount <= this.balance, "Donation: amount must be <= current balance");

        _msgSender().transfer(amount);
    }

    function kill() external { // TODO move to Killable.sol?
        require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "Donation: must have owner role to destruct contract");

        emit ContractDestroyed(this);
        selfdestruct(_msgSender());
    }
}
