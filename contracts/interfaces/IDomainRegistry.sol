// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

/// @author Vadym Sushkov
/// @title Domain Registry Interface
/// @notice This interface defines the methods required for interacting with a domain registry contract.
interface IDomainRegistry {
    /// Add new domain
    /// @dev Checks if "domain" is not existing and sets record to "domainList"
    /// @param domain The domain name
    function addNewDomain(string calldata domain) external;

    /// Change price for domain registration
    /// @dev Sets "newPrice" to "registrationPrice"
    /// @param newPrice The new price of the domain
    function changePrice(int256 newPrice) external;

    /// Buying a domain
    /// @dev Checks if amount value is correct and "domain" is available, sets data to "domainList" and then emits "DomainRegistered"
    /// @param domain The domain
    function buyDomain(string calldata domain) external payable;

    /// Withdraw money to the owner of the contract
    /// @dev Checks if the contract balance is not empty and then makes withdraw to "owner"
    function withdraw() external;
}
