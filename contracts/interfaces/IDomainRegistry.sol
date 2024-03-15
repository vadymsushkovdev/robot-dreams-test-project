// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

/// @author Vadym Sushkov
/// @title Domain Registry Interface
/// @notice This interface defines the methods required for interacting with a domain registry contract.
interface IDomainRegistry {
    /// @dev Struct representing a booking of a domain name.
    struct DomainNameBooking {
        address controller; // The address of the controller of the domain
        uint256 registrationTimeStamp; // The timestamp when the domain was registered
    }

    /// @dev Event emitted when a domain is registered.
    /// @param domain The domain name.
    /// @param controller The address of the controller of the domain.
    /// @param registrationTimeStamp The timestamp when the domain was registered.
    event DomainRegistered(
        string domain,
        address indexed controller,
        uint256 indexed registrationTimeStamp
    );

    /// @dev Function to add a new domain with its price.
    /// @param domain The domain name.
    /// @param price The price of the domain.
    function addNewDomain(string calldata domain, uint256 price)
        external;

    /// @dev Function to change the price of a domain.
    /// @param domain The domain name.
    /// @param newPrice The new price of the domain.
    function changePrice(string calldata domain, uint256 newPrice)
        external;

    /// @dev Function to buy a domain.
    /// @param domain The domain name.
    function buyDomain(
        string calldata domain
    ) external payable;

    /// @dev Function to withdraw funds from the contract
    function withdraw() external;
}
