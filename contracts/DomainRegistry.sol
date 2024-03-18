// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import './interfaces/IDomainRegistry.sol';

/// @author Vadym Sushkov
/// @title Domain Registry
contract DomainRegistry is IDomainRegistry {
    address public owner;
    int256 public registrationPrice;
    mapping(string => DomainMetadata) public domainList;

    /// Sets structure to describe all necessary metadata
    /// @dev Struct representing a booking of a domain name.
    struct DomainMetadata {
        address controller; // The address of the controller of the domain
        uint256 registrationTimeStamp; // The timestamp when the domain was registered
        bool isExists; // The marker indicating that domain was actually created
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

    /// Check if requesting user is the owner
    /// @dev Modifier to restrict access to only the owner of the contract
    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert ForbiddenResource();
        }
        _;
    }

    /// Check if requesting domain is exists
    /// @dev Modifier to check if a "domain" exists in "domainList"
    modifier existingDomain(string calldata domain) {
        if (!domainList[domain].isExists) {
            revert DomainNotFound({incomingDomain: domain});
        }
        _;
    }

    error DomainNotFound(string incomingDomain);
    error PriceLessOrEqualsZero(int256 incomingValue);
    error ForbiddenResource();
    error ValueLessOrEqualsZero(uint256 incomingValue);
    error DomainAlreadyTaken();
    error IncorrectValueAmount(
        uint256 incomingValue,
        int256 expectingValue
    );
    error NothingToWithdraw();
    error FailedToWithdraw(bytes data);
    error DomainAlreadyExists();

    /// Sets owner of the contract and price for domain registration
    /// @dev Sets values "owner" of the contract and "registrationPrice"
    /// @param initialPrice Sets default price for domains
    constructor(int256 initialPrice) {
        if (initialPrice <= 0) {
            revert PriceLessOrEqualsZero({
                incomingValue: initialPrice
            });
        }
        owner = msg.sender;
        registrationPrice = initialPrice;
    }

    /// Buying a domain
    /// @dev Checks if amount value is correct and "domain" is available and sets data to "domainList"
    /// @param domain The domain
    function buyDomain(string calldata domain)
        external
        payable
        existingDomain(domain)
    {
        if (msg.value <= 0) {
            revert ValueLessOrEqualsZero({incomingValue: msg.value});
        }

        if (domainList[domain].controller != address(0)) {
            revert DomainAlreadyTaken();
        }

        if (int256(msg.value) != registrationPrice) {
            revert IncorrectValueAmount({
                incomingValue: msg.value,
                expectingValue: registrationPrice
            });
        }

        domainList[domain] = DomainMetadata(
            msg.sender,
            block.timestamp,
            true
        );

        emit DomainRegistered(domain, msg.sender, block.timestamp);
    }

    /// Add new domain
    /// @dev Checks if "domain" is not existing and sets record to "domainList"
    /// @param domain The domain name
    function addNewDomain(string calldata domain) external onlyOwner {
        if (domainList[domain].isExists) {
            revert DomainAlreadyExists();
        }

        domainList[domain] = DomainMetadata(
            address(0),
            uint256(0),
            true
        );
    }

    /// Change price for domain registration
    /// @dev Sets "newPrice" to "registrationPrice"
    /// @param newPrice The new price of the domain
    function changePrice(int256 newPrice) external onlyOwner {
        if (newPrice <= 0) {
            revert PriceLessOrEqualsZero({incomingValue: newPrice});
        }

        registrationPrice = newPrice;
    }

    /// Withdraw money to the owner of the contract
    /// @dev Checks if the contract balance is not empty and then makes withdraw to "owner"
    function withdraw() public onlyOwner {
        uint256 contractBalance = address(this).balance;

        if (contractBalance == 0) {
            revert NothingToWithdraw();
        }

        (bool sent, bytes memory data) = payable(owner).call{
            value: contractBalance
        }('');

        if (!sent) {
            revert FailedToWithdraw({data: data});
        }
    }
}
