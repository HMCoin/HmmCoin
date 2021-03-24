pragma solidity ^0.8.0;

import "./ERC20/ERC20Capped.sol";
import "../access/AccessControl.sol"; // TODO simplify to MinterRole?
import "./ERC20/ERC20Burnable.sol";

contract HmmCoin is Context, AccessControl, ERC20Capped, ERC20Burnable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    string private constant name_ = "HmmCoin";
    string private constant symbol_ = "hmm"; // TODO move this?

    // @param _initialSupply Initial supply of the contract that will be minted into owner's account
    // @param _maxSupply Maximum possible tokens cap
    constructor(uint256 _initialSupply, uint256 _maxSupply) ERC20(name_, symbol_) ERC20Capped(_maxSupply) {
        require(_initialSupply <= _maxSupply, "HmmCoin: initial supply must be lower or equal max supply");

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());

        ERC20._mint(_msgSender(), _initialSupply);
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
    function mint(address to, uint256 amount) public {
        require(hasRole(MINTER_ROLE, _msgSender()), "HmmCoin: must have minter role to mint");
        _mint(to, amount);
    }

    function _mint(address account, uint256 amount) internal virtual override(ERC20, ERC20Capped) {
        ERC20Capped._mint(account, amount);
    }
}
