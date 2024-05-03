export const DomainRegistry = {
  abi: [
    {
      inputs: [
        {
          internalType: "address",
          name: "controller",
          type: "address",
        },
      ],
      name: "getControllerFunds",
      outputs: [
        {
          internalType: "uint256",
          name: "usdcFunds",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "ethFunds",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "DomainAlreadyTaken",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "reciever",
          type: "address",
        },
        {
          internalType: "bytes",
          name: "data",
          type: "bytes",
        },
      ],
      name: "FailedToWithdraw",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "incomingUsdc",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "expectingUsdc",
          type: "uint256",
        },
      ],
      name: "IncorrectUsdcAmount",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "incomingValue",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "expectingValue",
          type: "uint256",
        },
      ],
      name: "IncorrectValueAmount",
      type: "error",
    },
    {
      inputs: [],
      name: "InvalidInitialization",
      type: "error",
    },
    {
      inputs: [],
      name: "InvalidPriceFromOracle",
      type: "error",
    },
    {
      inputs: [],
      name: "NotInitializing",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "requester",
          type: "address",
        },
      ],
      name: "NothingToWithdraw",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
      ],
      name: "OwnableInvalidOwner",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "account",
          type: "address",
        },
      ],
      name: "OwnableUnauthorizedAccount",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "incomingDomain",
          type: "string",
        },
      ],
      name: "ParentDomainNotFound",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "incomingValue",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "expectingValue",
          type: "uint256",
        },
      ],
      name: "PriceEqualsZero",
      type: "error",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "string",
          name: "domain",
          type: "string",
        },
        {
          indexed: true,
          internalType: "address",
          name: "controller",
          type: "address",
        },
      ],
      name: "DomainRegistered",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint64",
          name: "version",
          type: "uint64",
        },
      ],
      name: "Initialized",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "previousOwner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "newOwner",
          type: "address",
        },
      ],
      name: "OwnershipTransferred",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "newPrice",
          type: "uint256",
        },
      ],
      name: "PriceChanged",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "reciever",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "amount",
          type: "uint256",
        },
      ],
      name: "Withdrawal",
      type: "event",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "parentDomain",
          type: "string",
        },
        {
          internalType: "string",
          name: "childDomain",
          type: "string",
        },
      ],
      name: "buyChildDomainViaEth",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "parentDomain",
          type: "string",
        },
        {
          internalType: "string",
          name: "childDomain",
          type: "string",
        },
      ],
      name: "buyChildDomainViaUsdc",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "domain",
          type: "string",
        },
      ],
      name: "buyDomainViaEth",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "domain",
          type: "string",
        },
      ],
      name: "buyDomainViaUsdc",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "newPrice",
          type: "uint256",
        },
      ],
      name: "changePrice",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "string",
          name: "domain",
          type: "string",
        },
      ],
      name: "getDomainOwner",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "getRegistrationPriceInEth",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "getRegistrationPriceInUsdc",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "uint256",
          name: "initialPrice",
          type: "uint256",
        },
        {
          internalType: "address",
          name: "_pricefeed",
          type: "address",
        },
        {
          internalType: "address",
          name: "_usdcToken",
          type: "address",
        },
      ],
      name: "initialize",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "owner",
      outputs: [
        {
          internalType: "address",
          name: "",
          type: "address",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "renounceOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "newOwner",
          type: "address",
        },
      ],
      name: "transferOwnership",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "withdrawDomainEth",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "withdrawDomainUsdc",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "withdrawEth",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "withdrawUsdc",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
};

export const USDC_ABI = {
  abi: [
    {
      inputs: [],
      stateMutability: "nonpayable",
      type: "constructor",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "allowance",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "needed",
          type: "uint256",
        },
      ],
      name: "ERC20InsufficientAllowance",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "sender",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "balance",
          type: "uint256",
        },
        {
          internalType: "uint256",
          name: "needed",
          type: "uint256",
        },
      ],
      name: "ERC20InsufficientBalance",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "approver",
          type: "address",
        },
      ],
      name: "ERC20InvalidApprover",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "receiver",
          type: "address",
        },
      ],
      name: "ERC20InvalidReceiver",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "sender",
          type: "address",
        },
      ],
      name: "ERC20InvalidSender",
      type: "error",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "spender",
          type: "address",
        },
      ],
      name: "ERC20InvalidSpender",
      type: "error",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Approval",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "from",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Transfer",
      type: "event",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          internalType: "address",
          name: "spender",
          type: "address",
        },
      ],
      name: "allowance",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "approve",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "account",
          type: "address",
        },
      ],
      name: "balanceOf",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "decimals",
      outputs: [
        {
          internalType: "uint8",
          name: "",
          type: "uint8",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "name",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "symbol",
      outputs: [
        {
          internalType: "string",
          name: "",
          type: "string",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalSupply",
      outputs: [
        {
          internalType: "uint256",
          name: "",
          type: "uint256",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "transfer",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        {
          internalType: "address",
          name: "from",
          type: "address",
        },
        {
          internalType: "address",
          name: "to",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "transferFrom",
      outputs: [
        {
          internalType: "bool",
          name: "",
          type: "bool",
        },
      ],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
};
