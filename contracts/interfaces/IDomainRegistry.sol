// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

/**
 * @title Domain Registry Interface
 * @notice This interface defines the methods required for interacting with a domain registry contract.
 */
interface IDomainRegistry {
    /**
     * @dev Change price for domain registration
     * @param newPrice The new price of the domain
     */
    function changePrice(uint256 newPrice) external;

    /**
     * @dev Buying a domain
     * @param domain The domain
     */
    function buyDomain(string calldata domain) external payable;


    //@dev Withdraw money to the owner of the contract
    function withdraw() external;
}
