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

    /**
     * @dev Allows buying a child domain under a parent domain.
     * @param parentDomain The parent domain under which to register the child domain.
     * @param childDomain The name of the child domain.
     */
    function buyChildDomain(
        string calldata parentDomain,
        string calldata childDomain
    ) external payable;

    /**
     * @dev Allows domain owners to withdraw their funds from the contract.
     * @notice This function allows domain owners to withdraw the funds deposited for their domains.
     * @notice Only the domain owner can invoke this function.
     * @notice If the domain owner has no funds deposited, the function reverts.
     */
    function withdrawDomain() external;
}
