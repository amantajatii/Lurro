// Read-only ABI generated from contracts/out/ProjectVault.sol/ProjectVault.json.
export const vaultAbi = [
  {
    "type": "function",
    "name": "TERMS_SCHEMA",
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
    "type": "function",
    "name": "acceptanceCount",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "acceptedAgreement",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "agreementLocked",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "contractValue",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "deploymentChainId",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "effectiveStatus",
    "inputs": [
      {
        "name": "id",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "enum ProjectVault.Status"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getProjectAccounting",
    "inputs": [],
    "outputs": [
      {
        "name": "d",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "a",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "r",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "q",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "p",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "f",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTerms",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct ProjectVault.ProjectTerms",
        "components": [
          {
            "name": "projectSalt",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "signedDocumentHash",
            "type": "bytes32",
            "internalType": "bytes32"
          },
          {
            "name": "funder",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "usdcToken",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "verifier",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "primaryArbiter",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "backupArbiter",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "recipients",
            "type": "address[]",
            "internalType": "address[]"
          },
          {
            "name": "milestones",
            "type": "tuple[]",
            "internalType": "struct ProjectVault.MilestoneTerms[]",
            "components": [
              {
                "name": "submitter",
                "type": "address",
                "internalType": "address"
              },
              {
                "name": "submissionDeadline",
                "type": "uint64",
                "internalType": "uint64"
              },
              {
                "name": "finalEvidenceDeadline",
                "type": "uint64",
                "internalType": "uint64"
              },
              {
                "name": "scopeHash",
                "type": "bytes32",
                "internalType": "bytes32"
              },
              {
                "name": "recipientAmounts",
                "type": "uint256[]",
                "internalType": "uint256[]"
              }
            ]
          },
          {
            "name": "reviewPeriodSeconds",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "approvalChallengeSeconds",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "rejectionChallengeSeconds",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "backupDelaySeconds",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "arbitrationPeriodSeconds",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "cancellationProposalSeconds",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "maxEvidenceRevisions",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "fallbackPolicy",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "cancellationPolicy",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "recoveryPolicy",
            "type": "uint8",
            "internalType": "uint8"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "projectCancelled",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  }
] as const;
