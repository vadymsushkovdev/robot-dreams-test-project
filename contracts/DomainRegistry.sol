// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import './interfaces/IDomainRegistry.sol';

/// @author Vadym Sushkov
/// @title Domain Registry
contract DomainRegistry is IDomainRegistry {
    /// Sets structure to describe all necessary domain metadata
    /// @dev Struct representing metadata associated with a registered domain.
    struct DomainMetadata {
        address controller; // The address of the controller of the domain
        uint64 registrationTimeStamp; // The timestamp when the domain was registered
        bool isExists; // The marker indicating that domain was actually created
    }

    /// Owner of the contract
    /// @dev The owner of the contract who has administrative control.
    address public owner;

    /// Domain registration price
    /// @dev The price set for domain registration.
    int256 public registrationPrice;

    /// Domain registry container
    /// @dev Mapping to store domain metadata against their names.
    mapping(string => DomainMetadata) public domainList;

    /// @dev Event emitted when a domain is registered.
    /// @param domain The domain name.
    /// @param controller The address of the controller of the domain.
    /// @param registrationTimeStamp The timestamp when the domain was registered.
    event DomainRegistered(
        string domain,
        address indexed controller,
        uint256 indexed registrationTimeStamp
    );

    /// @dev Event emitted when funds are withdrawn from the contract.
    /// @param amount The amount of funds withdrawn.
    /// @param timeStamp The timestamp when the withdrawal was made.
    event Withdrawal(uint256 amount, uint256 indexed timeStamp);

    /// @dev Event emitted when the price for domain registration is changed.
    /// @param newPrice The new price of the domain registration.
    event PriceChanged(int256 newPrice);

    /// @dev Event emitted when a new domain is added.
    /// @param domain The domain name.
    event DomainAdded(string domain);

    /// @dev Error thrown when a domain is not found in the domain list.
    /// @param incomingDomain The domain that was attempted to be found.
    error DomainNotFound(string incomingDomain);

    /// @dev Error thrown when the provided price is less than or equal to zero.
    /// @param incomingValue The value that caused the error.
    error PriceLessOrEqualsZero(int256 incomingValue);

    /// @dev Error thrown when attempting to register a domain that already exists.
    error DomainAlreadyTaken();

    /// @dev Error thrown when access to a restricted resource is forbidden.
    /// @param nonOwner The address of the non-owner who called the owner function
    error OnlyOwner(address nonOwner);

    /// @dev Error thrown when the value provided is not equal to the expected value.
    /// @param incomingValue The value provided.
    /// @param expectingValue The expected value.
    error IncorrectValueAmount(
        uint256 incomingValue,
        int256 expectingValue
    );

    /// @dev Error thrown when attempting to add a domain that already exists.
    error DomainAlreadyExists();

    /// @dev Error thrown when there is nothing to withdraw from the contract.
    error NothingToWithdraw();

    /// @dev Error thrown when the withdrawal operation fails.
    /// @param data The error data.
    error FailedToWithdraw(bytes data);

    /// Sets owner of the contract and price for domain registration
    /// @dev Sets values "owner" of the contract and "registrationPrice"
    /// @param initialPrice Sets default price for domains
    constructor(int256 initialPrice)
        priceBiggerThanZero(initialPrice)
    {
        owner = msg.sender;
        registrationPrice = initialPrice;
    }

    /// Check if requesting user is the owner
    /// @dev Modifier to restrict access to only the owner of the contract
    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert OnlyOwner(msg.sender);
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

    /// @dev Modifier to ensure that the provided price is greater than zero.
    /// @param price The price value to check.
    modifier priceBiggerThanZero(int256 price) {
        if (price <= 0) {
            revert PriceLessOrEqualsZero({incomingValue: price});
        }
        _;
    }

    /// Buying a domain
    /// @dev Checks if amount value is correct and "domain" is available and sets data to "domainList"
    /// @param domain The domain
    function buyDomain(string calldata domain)
        external
        payable
        existingDomain(domain)
    {
        if (domainList[domain].controller != address(0)) {
            revert DomainAlreadyTaken();
        }

        if (int256(msg.value) != registrationPrice) {
            revert IncorrectValueAmount({
                incomingValue: msg.value,
                expectingValue: registrationPrice
            });
        }

        domainList[domain].controller = msg.sender;
        domainList[domain].registrationTimeStamp = uint64(block.timestamp);

        emit DomainRegistered(domain, msg.sender, block.timestamp);
    }

    /// Add new domain
    /// @dev Checks if "domain" is not existing and sets record to "domainList"
    /// @param domain The domain name
    function addNewDomain(string calldata domain) external onlyOwner {
        if (domainList[domain].isExists) {
            revert DomainAlreadyExists();
        }

        domainList[domain].isExists = true;

        emit DomainAdded(domain);
    }

    /// Change price for domain registration
    /// @dev Sets "newPrice" to "registrationPrice"
    /// @param newPrice The new price of the domain
    function changePrice(int256 newPrice)
        external
        onlyOwner
        priceBiggerThanZero(newPrice)
    {
        registrationPrice = newPrice;

        emit PriceChanged(newPrice);
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

        emit Withdrawal(contractBalance, block.timestamp);
    }
}
