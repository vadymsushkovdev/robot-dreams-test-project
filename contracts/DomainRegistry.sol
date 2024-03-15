// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import './interfaces/IDomainRegistry.sol';

/// @author Vadym Sushkov
/// @title Domain Registry
contract DomainRegistry is IDomainRegistry {
    /// Owner of the contract
    address public owner;

    /// Mapping to store domain prices. Domain => Price
    mapping(string => uint256) public domainPrices;

    /// Mapping to store domain bookings. Domain => DomainNameBooking
    mapping(string => DomainNameBooking) private domainBookings;

    /// @dev Modifier to restrict access to only the owner of the contract
    modifier onlyOwner() {
        require(msg.sender == owner, 'Forbidden Resource');
        _;
    }

    /// @dev Modifier to check if a domain exists
    modifier existingDomain(string calldata domain) {
        require(domainPrices[domain] != 0, 'Domain Does Not Exists');
        _;
    }

    /// @dev Constructor to set the owner of the contract
    constructor() {
        owner = msg.sender;
    }

    /// @dev Function to get the price of a domain
    /// @param domain The domain name
    /// @return The price of the domain
    function getDomainPrice(string calldata domain)
        private
        view
        existingDomain(domain)
        returns (uint256)
    {
        return domainPrices[domain];
    }

    /// @dev Function to register a domain
    /// @param domain The domain
    function registerDomain(string calldata domain)
        private
        existingDomain(domain)
    {
        require(
            domainBookings[domain].controller == address(0),
            'Domain Already Taken'
        );

        domainBookings[domain] = DomainNameBooking(
            msg.sender,
            block.timestamp
        );

        emit DomainRegistered(domain, msg.sender, block.timestamp);
    }

    /// @dev Function to buy a domain
    /// @param domain The domain
    function buyDomain(string calldata domain) external payable {
        require(
            msg.value == getDomainPrice(domain),
            'Incorrect Value Amount'
        );

        registerDomain(domain);
    }

    /// @dev Function to add a new domain with its price
    /// @param domain The domain name
    /// @param price The price of the domain
    function addNewDomain(string calldata domain, uint256 price)
        external
        onlyOwner
    {
        require(domainPrices[domain] == 0, 'Domain Already Exists');

        domainPrices[domain] = price;
    }

    /// @dev Function to change the price of a domain
    /// @param domain The domain name
    /// @param newPrice The new price of the domain
    function changePrice(string calldata domain, uint256 newPrice)
        external
        onlyOwner
        existingDomain(domain)
    {
        domainPrices[domain] = newPrice;
    }

    /// @dev Function to withdraw funds from the contract
    function withdraw() public onlyOwner {
        uint256 contractBalance = address(this).balance;

        require(contractBalance != 0, 'Nothing To Withdraw');

        (bool sent, ) = payable(owner).call{value: contractBalance}(
            ''
        );

        require(sent, 'Failed To Withdraw');
    }
}
