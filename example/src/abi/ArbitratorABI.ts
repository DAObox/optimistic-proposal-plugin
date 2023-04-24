const ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_arbitrationPrice",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "_disputeID",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "contract IArbitrable",
        name: "_arbitrable",
        type: "address",
      },
    ],
    name: "AppealDecision",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "_disputeID",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "contract IArbitrable",
        name: "_arbitrable",
        type: "address",
      },
    ],
    name: "AppealPossible",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "_disputeID",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "contract IArbitrable",
        name: "_arbitrable",
        type: "address",
      },
    ],
    name: "DisputeCreation",
    type: "event",
  },
  {
    inputs: [],
    name: "NOT_PAYABLE_VALUE",
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
        name: "_disputeID",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "_extraData",
        type: "bytes",
      },
    ],
    name: "appeal",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_disputeID",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "_extraData",
        type: "bytes",
      },
    ],
    name: "appealCost",
    outputs: [
      {
        internalType: "uint256",
        name: "fee",
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
        name: "_disputeID",
        type: "uint256",
      },
    ],
    name: "appealPeriod",
    outputs: [
      {
        internalType: "uint256",
        name: "start",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "end",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "_extraData",
        type: "bytes",
      },
    ],
    name: "arbitrationCost",
    outputs: [
      {
        internalType: "uint256",
        name: "fee",
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
        name: "_choices",
        type: "uint256",
      },
      {
        internalType: "bytes",
        name: "_extraData",
        type: "bytes",
      },
    ],
    name: "createDispute",
    outputs: [
      {
        internalType: "uint256",
        name: "disputeID",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_disputeID",
        type: "uint256",
      },
    ],
    name: "currentRuling",
    outputs: [
      {
        internalType: "uint256",
        name: "ruling",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "disputeId",
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
        name: "_disputeID",
        type: "uint256",
      },
    ],
    name: "disputeStatus",
    outputs: [
      {
        internalType: "enum IArbitrator.DisputeStatus",
        name: "status",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "disputes",
    outputs: [
      {
        internalType: "contract IArbitrable",
        name: "arbitrated",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "choices",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "fee",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "ruling",
        type: "uint256",
      },
      {
        internalType: "enum IArbitrator.DisputeStatus",
        name: "status",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_disputeID",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_ruling",
        type: "uint256",
      },
    ],
    name: "giveRuling",
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
    inputs: [
      {
        internalType: "uint256",
        name: "_arbitrationPrice",
        type: "uint256",
      },
    ],
    name: "setArbitrationPrice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export default ABI;
