// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import "./ERC20.sol";

contract USDC is ERC20 {
    constructor()
    ERC20('USDC', 'USDC')
    {
        // Mint 100 tokens to msg.sender
        // Similar to how
        // 1 dollar = 100 cents
        // 1 token = 1 * (10 ** decimals)
        _mint(msg.sender, 100 * 10 ** uint256(6));
    }
}