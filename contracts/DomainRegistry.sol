// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import './interfaces/IDomainRegistry.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

/**
 * @title Domain Registry
 * @author Vadym Sushkov
 */
contract DomainRegistry is
    Initializable,
    IDomainRegistry,
    OwnableUpgradeable
{
    /// @custom:storage-location erc7201:domainRegistry.domain
    struct DomainStorage {

        /**
         * @dev Domain registration price
         * @notice The price set for domain registration.
         */
        uint256 registrationPrice;

        /**
         * @dev Domain registry container
         * @notice Mapping to store domain metadata against their names.
         */
        mapping(string => address) domainList;
    }

    // keccak256(abi.encode(uint256(keccak256("domainRegistry.domain")) - 1)) & ~bytes32(uint256(0xff));
    bytes32 private constant DOMAIN_STORAGE_LOCATION =
        0x34d79759018dd62b1c8d40a6535099f131828aa4665b939adf68c4556b516400;

    /**
     * @dev Event emitted when a domain is registered.
     * @param domain The domain name.
     * @param controller The address of the controller of the domain.
     */
    event DomainRegistered(string domain, address indexed controller);

    /**
     * @dev Event emitted when funds are withdrawn from the contract.
     * @param amount The amount of funds withdrawn.
     */
    event Withdrawal(uint256 amount);

    /**
     * @dev Event emitted when the price for domain registration is changed.
     * @param newPrice The new price of the domain registration.
     */
    event PriceChanged(uint256 newPrice);

    /**
     * @dev Error thrown when the provided price equals to zero.
     * @param incomingValue The value that caused the error.
     * @param expectingValue The expected value.
     */
    error PriceEqualsZero(
        uint256 incomingValue,
        uint256 expectingValue
    );

    /// @dev Error thrown when attempting to register a domain that already exists.
    error DomainAlreadyTaken();

    /**
     * @dev Error thrown when the value provided is not equal to the expected value.
     * @param incomingValue The value provided.
     * @param expectingValue The expected value.
     */
    error IncorrectValueAmount(
        uint256 incomingValue,
        uint256 expectingValue
    );

    /// @dev Error thrown when there is nothing to withdraw from the contract.
    error NothingToWithdraw();

    /**
     * @dev Error thrown when the withdrawal operation fails.
     * @param data The error data.
     */
    error FailedToWithdraw(bytes data);

    /**
     * @dev Modifier to ensure that the provided price is greater than zero.
     * @param price The price value to check.
     */
    modifier priceBiggerThanZero(uint256 price) {
        if (price == 0) {
            revert PriceEqualsZero(
                price,
                _getDomainStorage().registrationPrice
            );
        }
        _;
    }

    /**
     * @dev Sets owner of the contract and price for domain registration
     * @param initialPrice Sets default price for domains
     */
    function initialize(uint256 initialPrice) public initializer {
        _getDomainStorage().registrationPrice = initialPrice;
        __Ownable_init(msg.sender);
    }

    // @dev Return domain registration price
    function getDomainRegistrationPrice() public view returns (uint256) {
        return _getDomainStorage().registrationPrice;
    }

    /**
     * @dev Buying a domain
     * @param domain The domain
     */
    function buyDomain(string calldata domain) external payable {
        if (_getDomainStorage().domainList[domain] != address(0)) {
            revert DomainAlreadyTaken();
        }

        if (msg.value != _getDomainStorage().registrationPrice) {
            revert IncorrectValueAmount({
                incomingValue: msg.value,
                expectingValue: _getDomainStorage().registrationPrice
            });
        }

        _getDomainStorage().domainList[domain] = msg.sender;

        emit DomainRegistered(domain, msg.sender);
    }

    /**
     * @dev Change price for domain registration
     * @param newPrice The new price of the domain
     */
    function changePrice(uint256 newPrice)
        external
        onlyOwner
        priceBiggerThanZero(newPrice)
    {
        _getDomainStorage().registrationPrice = newPrice;

        emit PriceChanged(newPrice);
    }

    /**
     * @dev Withdraw money to the owner of the contract
     * @notice Checks if the contract balance is not empty and then makes withdraw to "owner"
     */
    function withdraw() public onlyOwner {
        uint256 contractBalance = address(this).balance;

        if (contractBalance == 0) {
            revert NothingToWithdraw();
        }

        (bool sent, bytes memory data) = payable(owner()).call{
            value: contractBalance
        }('');

        if (!sent) {
            revert FailedToWithdraw({data: data});
        }

        emit Withdrawal(contractBalance);
    }

    function _getDomainStorage()
        private
        pure
        returns (DomainStorage storage $)
    {
        assembly {
            $.slot := DOMAIN_STORAGE_LOCATION
        }
    }
}
