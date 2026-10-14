// Generated from ProjectVault.sol. Regenerate with web/scripts/generate-agreement.cjs.
export const agreementAbi = [
  {
    "type": "function",
    "name": "acceptAgreement",
    "inputs": [
      {
        "name": "hash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "lockAgreement",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "termsHash",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "error",
    "name": "DeadlineNotReached",
    "inputs": []
  },
  {
    "type": "error",
    "name": "DeadlinePassed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InsufficientFunding",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidInput",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidState",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ReentrancyGuardReentrantCall",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SafeERC20FailedOperation",
    "inputs": [
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "StaleProposal",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Unauthorized",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnexpectedTransfer",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnsupportedChain",
    "inputs": []
  }
] as const;
export const runtimeLength = 12270;
export const immutableRanges = [{"start":652,"length":32},{"start":920,"length":32},{"start":1144,"length":32},{"start":1220,"length":32},{"start":1498,"length":32},{"start":1809,"length":32},{"start":1990,"length":32},{"start":2067,"length":32},{"start":2616,"length":32},{"start":2823,"length":32},{"start":2954,"length":32},{"start":3101,"length":32},{"start":3306,"length":32},{"start":3359,"length":32},{"start":3592,"length":32},{"start":3867,"length":32},{"start":3945,"length":32},{"start":4177,"length":32},{"start":4510,"length":32},{"start":4653,"length":32},{"start":5108,"length":32},{"start":6920,"length":32},{"start":7378,"length":32},{"start":7944,"length":32},{"start":8278,"length":32},{"start":8616,"length":32},{"start":8969,"length":32},{"start":9194,"length":32}] as const;
export const normalizedRuntimeHash = "0xb8fc9ec281ae86f1eac93792d758db405305f3769e79c0597c90900f89ec686e" as const;
