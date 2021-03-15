pragma solidity ^0.8.0;

import "./ERC20/ERC20Capped.sol";
import "../access/AccessControl.sol"; // TODO simplify to MinterRole?
import "./ERC20/ERC20Burnable.sol";

contract HmmCoin is Context, AccessControl, ERC20Capped, ERC20Burnable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    string public constant name = "HmmCoin";
    string public constant symbol = "hmm";
    uint public constant decimals = 18;

    // @param _initialSupply Initial supply of the contract that will be minted into owner's account
    // @param _maxSupply Maximum possible tokens cap
    function HmmCoin(uint256 _initialSupply, uint256 _maxSupply) ERC20(name, symbol) ERC20Capped(_maxSupply) {
        require(_initialSupply <= _maxSupply, "HmmCoin: initial supply must be lower or equal max supply");

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());

        _totalSupply = _initialSupply;
        balances[_msgSender()] = _initialSupply;
    }

    /**
    * @dev Creates `amount` new tokens for `to`.
     *
     * See {ERC20-_mint}.
     *
     * Requirements:
     *
     * - the caller must have the `MINTER_ROLE`.
     */
    function mint(address to, uint256 amount) public virtual {
        require(hasRole(MINTER_ROLE, _msgSender()), "HmmCoin: must have minter role to mint");
        _mint(to, amount);
    }
}
