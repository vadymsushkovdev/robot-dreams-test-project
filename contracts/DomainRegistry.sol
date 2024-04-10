// SPDX-License-Identifier: MIT

pragma solidity 0.8.24;

import './interfaces/IDomainRegistry.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';

/**
 * @title Domain Registry
 * @author Vadym Sushkov
 * @notice This contract allows registration and management of domains.
 */
contract DomainRegistry is
    Initializable,
    IDomainRegistry,
    OwnableUpgradeable
{
    /**
     * @dev Domain registration price
     * @notice The price set for domain registration.
     */
    uint256 public registrationPrice;

    /**
     * @dev Domain registry container
     * @notice Mapping to store domain metadata against their names.
     */
    mapping(string => address) public domainList;

    /**
     * @dev Tracks the balance frozen within the contract.
     * @notice This balance represents funds that are not available for withdrawal by owner.
     */
    uint256 private frozenBalance;

    /**
     * @dev Tracks the funds owned by each domain owner.
     * @notice This mapping holds the funds of each domain owner to withdraw.
     */
    mapping(address => uint256) private domainOwnersFunds;

    /**
     * @dev Separator used to concatenate domain names.
     */
    string private constant domainSeparator = '.';

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
    event Withdrawal(address reciever, uint256 amount);

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

    /**
     * @dev Error thrown when there is nothing to withdraw from the contract.
     * @param requester The address of requester who request withdraw funds.
     */
    error NothingToWithdraw(address requester);

    /**
     * @dev Error thrown when the withdrawal operation fails.
     * @param data The error data.
     */
    error FailedToWithdraw(address reciever, bytes data);

    /**
     * @dev Error thrown when the parent domain is not found.
     * @param incomingDomain The domain for which the parent domain is not found.
     */

    error ParentDomainNotFound(string incomingDomain);

    /**
     * @dev Modifier to ensure that the provided price is greater than zero.
     * @param price The price value to check.
     */
    modifier priceBiggerThanZero(uint256 price) {
        if (price == 0) {
            revert PriceEqualsZero(price, registrationPrice);
        }
        _;
    }

    /**
     * @dev Modifier to ensure that the value sent is equal to the registration price.
     */
    modifier incorrectValueAmount() {
        if (msg.value != registrationPrice) {
            revert IncorrectValueAmount({
                incomingValue: msg.value,
                expectingValue: registrationPrice
            });
        }
        _;
    }

    /**
     * @dev Sets owner of the contract and price for domain registration
     * @param initialPrice Sets default price for domains
     */
    function initialize(uint256 initialPrice) public initializer {
        registrationPrice = initialPrice;
        __Ownable_init(msg.sender);
    }

    /**
     * @dev Allows buying a child domain under a parent domain.
     * @param parentDomain The parent domain under which to register the child domain.
     * @param childDomain The name of the child domain.
     */
    function buyChildDomain(
        string calldata parentDomain,
        string calldata childDomain
    ) external payable incorrectValueAmount {
        if (domainList[parentDomain] == address(0)) {
            revert ParentDomainNotFound(parentDomain);
        }

        string memory domain = createFullDomain(
            childDomain,
            parentDomain
        );

        if (domainList[domain] != address(0)) {
            revert DomainAlreadyTaken();
        }

        domainList[domain] = msg.sender;

        frozenBalance += msg.value;
        domainOwnersFunds[domainList[parentDomain]] += msg.value;

        emit DomainRegistered(domain, msg.sender);
    }

    /**
     * @dev Buying a domain
     * @param domain The domain
     */
    function buyDomain(string calldata domain)
        external
        payable
        incorrectValueAmount
    {
        if (domainList[domain] != address(0)) {
            revert DomainAlreadyTaken();
        }

        domainList[domain] = msg.sender;

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
        registrationPrice = newPrice;

        emit PriceChanged(newPrice);
    }

    /**
     * @dev Withdraw money to the owner of the contract
     * @notice Checks if the contract balance is not empty and then makes withdraw to "owner"
     */
    function withdraw() public onlyOwner {
        uint256 contractBalance = address(this).balance -
            frozenBalance;

        if (contractBalance == 0) {
            revert NothingToWithdraw(owner());
        }

        (bool sent, bytes memory data) = payable(owner()).call{
            value: contractBalance
        }('');

        if (!sent) {
            revert FailedToWithdraw(owner(), data);
        }

        emit Withdrawal(owner(), contractBalance);
    }

    /**
     * @dev Allows domain owners to withdraw their funds from the contract.
     * @notice This function allows domain owners to withdraw the funds deposited for their domains.
     * @notice Only the domain owner can invoke this function.
     * @notice If the domain owner has no funds deposited, the function reverts.
     */
    function withdrawDomain() public {
        if (domainOwnersFunds[msg.sender] == 0) {
            revert NothingToWithdraw(msg.sender);
        }

        (bool sent, bytes memory data) = payable(msg.sender).call{
            value: domainOwnersFunds[msg.sender]
        }('');

        if (!sent) {
            revert FailedToWithdraw(msg.sender, data);
        }

        frozenBalance -= domainOwnersFunds[msg.sender];
        domainOwnersFunds[msg.sender] = 0;

        emit Withdrawal(msg.sender, domainOwnersFunds[msg.sender]);
    }

    /**
     * @dev Concatenates child and parent domain names.
     * @param childDomain The name of the child domain.
     * @param parentDomain The name of the parent domain.
     * @return domain The concatenated domain name.
     */
    function createFullDomain(
        string calldata childDomain,
        string calldata parentDomain
    ) private pure returns (string memory domain) {
        domain = string(
            abi.encodePacked(
                childDomain,
                domainSeparator,
                parentDomain
            )
        );
    }
}
