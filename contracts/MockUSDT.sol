// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDT
 * @dev Mock USDT token for testing purposes
 */
contract MockUSDT is ERC20, Ownable {
    uint8 private _decimals = 6; // USDT has 6 decimals

    constructor() ERC20("Mock USDT", "USDT") {
        // Mint 1 billion USDT to deployer for testing
        _mint(msg.sender, 1000000000 * 10 ** _decimals);
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Mint tokens for testing
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Faucet function for easy testing - anyone can get 10,000 USDT
     */
    function faucet() external {
        require(
            balanceOf(msg.sender) < 100000 * 10 ** _decimals,
            "Already has enough tokens"
        );
        _mint(msg.sender, 10000 * 10 ** _decimals);
    }
}
