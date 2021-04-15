pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";


/**
 * @title SimpleToken
 * @dev Very simple ERC20 Token Mock.
 */
contract SimpleToken is ERC20 {
    string public constant name_ = "SimpleToken"; // solium-disable-line uppercase
    string public constant symbol_ = "SIM"; // solium-disable-line uppercase

    constructor() public ERC20(name_, symbol_) {
        ERC20._mint(msg.sender, 9999 * (10 ** 18)); // 9999 SIM
    }
}
