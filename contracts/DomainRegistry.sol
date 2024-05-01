// SPDX-License-Identifier: MIT

pragma solidity 0.8.24;

import './interfaces/IDomainRegistry.sol';
import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

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
    using SafeERC20 for IERC20;

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


    /// @custom:storage-location erc7201:domainRegistry.fund
    struct FundStorage {
        /**
         * @dev Tracks the balance frozen within the contract.
         * @notice This balance represents funds that are not available for withdrawal by owner.
         */
        uint256 frozenBalance;
        /**
         * @dev Tracks the funds owned by each domain owner.
         * @notice This mapping holds the funds of each domain owner to withdraw.
         */
        mapping(address => uint256) domainOwnersFunds;
    }

    /// @custom:storage-location erc7201:domainRegistry.usdcFund
    struct UsdcFundStorage {
        /**
         * @dev Tracks the balance frozen within the contract.
         * @notice This balance represents funds that are not available for withdrawal by owner.
         */
        uint256 frozenBalance;
        /**
         * @dev Tracks the funds owned by each domain owner.
         * @notice This mapping holds the funds of each domain owner to withdraw.
         */
        mapping(address => uint256) domainOwnersFunds;
    }

    // keccak256(abi.encode(uint256(keccak256("domainRegistry.domain")) - 1)) & ~bytes32(uint256(0xff));
    bytes32 private constant DOMAIN_STORAGE_LOCATION =
        0x34d79759018dd62b1c8d40a6535099f131828aa4665b939adf68c4556b516400;

    // keccak256(abi.encode(uint256(keccak256("domainRegistry.fund")) - 1)) & ~bytes32(uint256(0xff));
    bytes32 private constant FUND_STORAGE_LOCATION =
        0x249f20ee916056548cfe0204d9ea4281f252680318bb5252f87aa5a31ec81e00;

    // keccak256(abi.encode(uint256(keccak256("domainRegistry.usdcFund")) - 1)) & ~bytes32(uint256(0xff));
    bytes32 private constant USDC_FUND_STORAGE_LOCATION =
        0x64d6ff49462c7266e92c8aa47370a483b3bb1c9ff7216e1d88a62c1eb24ffb00;

    /**
     * @dev Separator used to concatenate domain names.
     */
    string private constant domainSeparator = '.';

    /**
     * @dev Contract to get the latest price ETH/USD.
     */
    AggregatorV3Interface private priceFeed;

    /**
     * @dev Contract to interact with usdc token.
     */
    IERC20 private usdcToken;

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
     * @dev Error thrown when price from oracle is incorrect.
     */
    error InvalidPriceFromOracle();

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
     * @dev Error thrown when the usdc provided is not equal to the expected amount of usdc.
     * @param incomingUsdc The value provided.
     * @param expectingUsdc The expected udc amount.
     */
    error IncorrectUsdcAmount(
        uint256 incomingUsdc,
        uint256 expectingUsdc
    );

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
     * @dev Modifier to ensure that the eth sent is equal to the registration price.
     */
    modifier incorrectValueAmount() {
        uint256 ethPrice = getRegistrationPriceInEth();

        if (msg.value != ethPrice) {
            revert IncorrectValueAmount({
                incomingValue: msg.value,
                expectingValue: ethPrice
            });
        }
        _;
    }

    /**
     * @dev Modifier to ensure that the usdc sent is equal to the registration price.
     */
    modifier incorrectUsdcAmount() {
        uint256 allowance = getUsdcAllowance();
        uint256 _registrationPrice = _getDomainStorage()
            .registrationPrice;

        if (allowance != _registrationPrice) {
            revert IncorrectUsdcAmount({
                incomingUsdc: allowance,
                expectingUsdc: _registrationPrice
            });
        }
        _;
    }

    /**
     * @dev Modifier to ensure that the requested domain is available to registrate.
     */
    modifier existingDomain(string calldata domain) {
        if (_getDomainStorage().domainList[domain] != address(0)) {
            revert DomainAlreadyTaken();
        }

        _;
    }

    /**
     * @dev Sets owner of the contract and price for domain registration
     * @param initialPrice Sets default price for domains
     */
    function initialize(
        uint256 initialPrice,
        address _pricefeed,
        address _usdcToken
    ) public initializer {
        _getDomainStorage().registrationPrice = initialPrice;
        __Ownable_init(msg.sender);
        priceFeed = AggregatorV3Interface(_pricefeed);
        usdcToken = IERC20(_usdcToken);
    }

    // @dev Returns domain registration price in usdc
    function getRegistrationPriceInEth()
        public
        view
        returns (uint256)
    {
        return (_getDomainStorage().registrationPrice * 10**2 * 1 ether) / _getEthToUsdPriceFromOracle();
    }

    // @dev Returns domain registration price in usdc
    function getRegistrationPriceInUsdc()
        public
        view
        returns (uint256)
    {
        return _getDomainStorage().registrationPrice;
    }

    // @dev Return domain owner address
    function getDomainOwner(string calldata domain)
        public
        view
        returns (address)
    {
        return _getDomainStorage().domainList[domain];
    }

    /**
     * @dev Allows buying a child domain under a parent domain.
     * @param parentDomain The parent domain under which to register the child domain.
     * @param childDomain The name of the child domain.
     */
    function buyChildDomainViaEth(
        string calldata parentDomain,
        string calldata childDomain
    ) external payable incorrectValueAmount {
        string memory domain = createAndCheckFullDomain(
            parentDomain,
            childDomain
        );

        _getDomainStorage().domainList[domain] = msg.sender;

        _getFundStorage().frozenBalance += msg.value;
        _getFundStorage().domainOwnersFunds[
            _getDomainStorage().domainList[parentDomain]
        ] += msg.value;

        emit DomainRegistered(domain, msg.sender);
    }

    function buyChildDomainViaUsdc(
        string calldata parentDomain,
        string calldata childDomain
    ) external payable incorrectUsdcAmount {
        string memory domain = createAndCheckFullDomain(
            parentDomain,
            childDomain
        );
        uint256 allowance = getUsdcAllowance();

        transferUsdc(allowance);

        _getDomainStorage().domainList[domain] = msg.sender;

        _getUsdcFundStorage().frozenBalance += allowance;
        _getUsdcFundStorage().domainOwnersFunds[
            _getDomainStorage().domainList[parentDomain]
        ] += allowance;

        emit DomainRegistered(domain, msg.sender);
    }

    /**
     * @dev Buying a domain via eth
     * @param domain The domain
     */
    function buyDomainViaEth(string calldata domain)
        external
        payable
        incorrectValueAmount
        existingDomain(domain)
    {
        _getDomainStorage().domainList[domain] = msg.sender;

        emit DomainRegistered(domain, msg.sender);
    }

    /**
     * @dev Buying a domain via usdc
     * @param domain The domain
     */
    function buyDomainViaUsdc(string calldata domain)
        external
        payable
        incorrectUsdcAmount
        existingDomain(domain)
    {
        uint256 allowance = getUsdcAllowance();

        transferUsdc(allowance);

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
     * @dev Withdraw eth to the owner of the contract
     * @notice Checks if the contract balance is not empty and then makes withdraw to "owner"
     */
    function withdrawEth() public onlyOwner {
        uint256 contractBalance = address(this).balance -
            _getFundStorage().frozenBalance;

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
     * @dev Withdraw usdc to the owner of the contract
     * @notice Checks if the contract balance is not empty and then makes withdraw to "owner"
     */
    function withdrawUsdc() public onlyOwner {
        uint256 contractBalance = getUsdcContractBalance() -
            _getUsdcFundStorage().frozenBalance;

        if (contractBalance == 0) {
            revert NothingToWithdraw(owner());
        }

        usdcToken.transfer(msg.sender, contractBalance);

        emit Withdrawal(owner(), contractBalance);
    }

    /**
     * @dev Allows domain owners to withdraw their eth funds from the contract.
     * @notice This function allows domain owners to withdraw the eth funds deposited for their domains.
     * @notice Only the domain owner can invoke this function.
     * @notice If the domain owner has no funds deposited, the function reverts.
     */
    function withdrawDomainEth() public {
        if (_getFundStorage().domainOwnersFunds[msg.sender] == 0) {
            revert NothingToWithdraw(msg.sender);
        }

        (bool sent, bytes memory data) = payable(msg.sender).call{
            value: _getFundStorage().domainOwnersFunds[msg.sender]
        }('');

        if (!sent) {
            revert FailedToWithdraw(msg.sender, data);
        }

        _getFundStorage().frozenBalance -= _getFundStorage()
            .domainOwnersFunds[msg.sender];
        _getFundStorage().domainOwnersFunds[msg.sender] = 0;

        emit Withdrawal(
            msg.sender,
            _getFundStorage().domainOwnersFunds[msg.sender]
        );
    }

    /**
     * @dev Allows domain owners to withdraw their usdc funds from the contract.
     * @notice This function allows domain owners to withdraw the usdc funds deposited for their domains.
     * @notice Only the domain owner can invoke this function.
     * @notice If the domain owner has no funds deposited, the function reverts.
     */
    function withdrawDomainUsdc() public {
        if (_getUsdcFundStorage().domainOwnersFunds[msg.sender] == 0) {
            revert NothingToWithdraw(msg.sender);
        }

        uint256 fundsToSend = _getFundStorage().domainOwnersFunds[msg.sender];

        usdcToken.transfer(msg.sender, fundsToSend);

        _getFundStorage().frozenBalance -= fundsToSend;
        _getFundStorage().domainOwnersFunds[msg.sender] = 0;

        emit Withdrawal(
            msg.sender,
            fundsToSend
        );
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

    /**
     * @dev Returns domain storage
     * @notice Domain storage contains domainList and registrationsPrice data
     */
    function _getDomainStorage()
        private
        pure
        returns (DomainStorage storage $)
    {
        assembly {
            $.slot := DOMAIN_STORAGE_LOCATION
        }
    }

    /**
     * @dev Returns fund storage
     * @notice Fund storage contains frozenBalance and domainOwnersFunds data
     */
    function _getFundStorage()
        private
        pure
        returns (FundStorage storage $)
    {
        assembly {
            $.slot := FUND_STORAGE_LOCATION
        }
    }

    /**
     * @dev Returns current Eth/Usd price
     */
    function _getEthToUsdPriceFromOracle()
        public 
        view
        returns (uint256)
    {
        (, int256 price, , , ) = priceFeed.latestRoundData();

        if (price < 0) {
            revert InvalidPriceFromOracle();
        }

        return uint256(price);
    }

    /**
     * @dev Returns allowance of user to the contract
     */
    function getUsdcAllowance() private view returns (uint256) {
        return usdcToken.allowance(msg.sender, address(this));
    }

    /**
     * @dev Returns usdc fund storage
     * @notice Fund storage contains frozenBalance and domainOwnersFunds data
     */
    function _getUsdcFundStorage()
        private
        pure
        returns (UsdcFundStorage storage $)
    {
        assembly {
            $.slot := USDC_FUND_STORAGE_LOCATION
        }
    }

    /**
     * @dev Checks and returns domain
     */
    function createAndCheckFullDomain(
        string calldata parentDomain,
        string calldata childDomain
    ) private view returns (string memory) {
        if (
            _getDomainStorage().domainList[parentDomain] == address(0)
        ) {
            revert ParentDomainNotFound(parentDomain);
        }

        string memory domain = createFullDomain(
            childDomain,
            parentDomain
        );

        if (_getDomainStorage().domainList[domain] != address(0)) {
            revert DomainAlreadyTaken();
        }

        return domain;
    }

    /**
     * @dev Transfering usdc funds from sender to the contract
     */
    function transferUsdc(uint256 allowance) private {
        usdcToken.transferFrom(
            msg.sender,
            address(this),
            allowance
        );
    }

    /**
     * @dev Returns balance of the contract
     */
    function getUsdcContractBalance() private view returns(uint256) {
        return usdcToken.balanceOf(address(this));
    }
}
