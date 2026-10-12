import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { encodeAbiParameters, keccak256, toHex } from "viem";

// Independent client schema; a swapped field must fail against Solidity's vector.
export const termsParameter = {
  type: "tuple",
  components: [
    { name: "projectSalt", type: "bytes32" },
    { name: "signedDocumentHash", type: "bytes32" },
    { name: "funder", type: "address" },
    { name: "usdcToken", type: "address" },
    { name: "verifier", type: "address" },
    { name: "primaryArbiter", type: "address" },
    { name: "backupArbiter", type: "address" },
    { name: "recipients", type: "address[]" },
    {
      name: "milestones", type: "tuple[]", components: [
        { name: "submitter", type: "address" },
        { name: "submissionDeadline", type: "uint64" },
        { name: "finalEvidenceDeadline", type: "uint64" },
        { name: "scopeHash", type: "bytes32" },
        { name: "recipientAmounts", type: "uint256[]" },
      ],
    },
    { name: "reviewPeriodSeconds", type: "uint32" },
    { name: "approvalChallengeSeconds", type: "uint32" },
    { name: "rejectionChallengeSeconds", type: "uint32" },
    { name: "backupDelaySeconds", type: "uint32" },
    { name: "arbitrationPeriodSeconds", type: "uint32" },
    { name: "cancellationProposalSeconds", type: "uint32" },
    { name: "maxEvidenceRevisions", type: "uint8" },
    { name: "fallbackPolicy", type: "uint8" },
    { name: "cancellationPolicy", type: "uint8" },
    { name: "recoveryPolicy", type: "uint8" },
  ],
};

const address = (value) => `0x${value.toString(16).padStart(40, "0")}`;
const terms = {
  projectSalt: keccak256(toHex("test-project")),
  signedDocumentHash: keccak256(toHex("exact signed document bytes")),
  funder: address(0x100),
  usdcToken: "0x3600000000000000000000000000000000000000",
  verifier: address(0x400), primaryArbiter: address(0x500), backupArbiter: address(0x600),
  recipients: [address(0x200), address(0x300)],
  milestones: [0n, 1n].map((id) => ({
    submitter: address(0x200),
    submissionDeadline: 1_800_864_000n + id * 864_000n,
    finalEvidenceDeadline: 1_801_468_800n + id * 864_000n,
    scopeHash: keccak256(encodeAbiParameters([{ type: "uint256" }], [id])),
    recipientAmounts: [60_000_000n, 40_000_000n],
  })),
  reviewPeriodSeconds: 259_200,
  approvalChallengeSeconds: 172_800,
  rejectionChallengeSeconds: 172_800,
  backupDelaySeconds: 259_200,
  arbitrationPeriodSeconds: 604_800,
  cancellationProposalSeconds: 604_800,
  maxEvidenceRevisions: 3, fallbackPolicy: 0, cancellationPolicy: 0, recoveryPolicy: 0,
};
const vector = JSON.parse(readFileSync(new URL("../out/terms-hash-vector.json", import.meta.url)));
const schema = keccak256(toHex("LURRO_PROJECT_TERMS_V1_2"));
const hash = (input, chain = BigInt(vector.chainId), vault = vector.vault) => keccak256(encodeAbiParameters(
  [{ type: "bytes32" }, { type: "uint256" }, { type: "address" }, termsParameter],
  [schema, chain, vault, input],
));

assert.equal(encodeAbiParameters([termsParameter], [terms]), vector.encodedTerms);
assert.equal(hash(terms), vector.termsHash);
assert.notEqual(hash(terms, 5042n), vector.termsHash);
assert.notEqual(hash(terms, BigInt(vector.chainId), address(0x900)), vector.termsHash);
assert.notEqual(hash({ ...terms, recoveryPolicy: 1 }), vector.termsHash);
assert.notEqual(hash({ ...terms, recipients: [address(0x201), address(0x300)] }), vector.termsHash);
const changedAmount = structuredClone(terms);
changedAmount.milestones[0].recipientAmounts[0]++;
assert.notEqual(hash(changedAmount), vector.termsHash);
const changedDeadline = structuredClone(terms);
changedDeadline.milestones[0].submissionDeadline++;
assert.notEqual(hash(changedDeadline), vector.termsHash);
console.log("Solidity/viem agreement encoding and hash checks passed.");
