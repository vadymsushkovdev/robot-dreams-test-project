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
     * @dev Buying a domain via eth
     * @param domain The domain
     */
    function buyDomainViaEth(string calldata domain) external payable;

    /**
     * @dev Buying a domain via usdc
     * @param domain The domain
     */
    function buyDomainViaUsdc(string calldata domain)
        external
        payable;

    /**
     * @dev Withdraw usdc to the owner of the contract
     * @notice Checks if the contract balance is not empty and then makes withdraw to "owner"
     */
    function withdrawUsdc() external;

    /**
     * @dev Withdraw eth to the owner of the contract
     * @notice Checks if the contract balance is not empty and then makes withdraw to "owner"
     */
    function withdrawEth() external;

    /**
     * @dev Allows buying a child domain under a parent domain by eth.
     * @param parentDomain The parent domain under which to register the child domain.
     * @param childDomain The name of the child domain.
     */
    function buyChildDomainViaEth(
        string calldata parentDomain,
        string calldata childDomain
    ) external payable;

    /**
     * @dev Allows buying a child domain under a parent domain by usdc.
     * @param parentDomain The parent domain under which to register the child domain.
     * @param childDomain The name of the child domain.
     */
    function buyChildDomainViaUsdc(
        string calldata parentDomain,
        string calldata childDomain
    ) external payable;

    /**
     * @dev Allows domain owners to withdraw their eth funds from the contract.
     * @notice This function allows domain owners to withdraw the eth funds deposited for their domains.
     * @notice Only the domain owner can invoke this function.
     * @notice If the domain owner has no funds deposited, the function reverts.
     */
    function withdrawDomainEth() external;

    /**
     * @dev Allows domain owners to withdraw their usdc funds from the contract.
     * @notice This function allows domain owners to withdraw the usdc funds deposited for their domains.
     * @notice Only the domain owner can invoke this function.
     * @notice If the domain owner has no funds deposited, the function reverts.
     */
    function withdrawDomainUsdc() external;
}
