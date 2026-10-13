const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { keccak256, toHex, encodeFunctionData } = require('viem');
const cache = new Map();
function source(name) {
  if (cache.has(name)) return cache.get(name);
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib', name + '.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {}; cache.set(name, exports);
  new Function('require', 'exports', code)(request => request.startsWith('./') ? source(request.slice(2)) : require(request), exports); return exports;
}
const a = source('agreement');
const { agreementAbi } = source('agreement-abi');
const { buildProject } = source('project-draft');
const addr = n => '0x' + n.toString(16).padStart(40, '0');
function fixture() {
  const now = Date.parse('2026-10-13T00:00:00Z') / 1000;
  const project = buildProject({ name: 'Shared agreement', description: 'Exact rights', funder: addr(1), verifier: addr(2), primaryArbiter: addr(3), backupArbiter: addr(4), recipients: [{ id: 'a', name: 'A', address: addr(5) }, { id: 'b', name: 'B', address: addr(6) }], milestones: [{ id: 'm', title: 'Deliver', scope: 'Deliver the agreed scope', deadline: '2026-11-01T00:00:00Z', submitter: 'a', amounts: { a: '0.6', b: '0.4' } }] }, '0x' + 'ab'.repeat(32), now);
  const vault = { address: addr(7), terms: project.terms, value: project.total, block: 1n, timestamp: now * 1000, locked: false, cancelled: false, acceptanceCount: 0n, accounting: [0n,0n,0n,0n,0n,0n], milestones: project.terms.milestones.map((m, index) => ({ ...m, index, status: 0 })), accepted: [1,2,3,4,5,6].map(n => ({ address: addr(n), accepted: false })) };
  const snapshot = { vault, termsHash: a.computeTermsHash(vault), runtimeMatches: true, termsMatch: true };
  return { project, snapshot, bytes: new TextEncoder().encode(project.document) };
}
test('original document verifies exact bytes, full terms and scope commitments', () => {
  const { snapshot, bytes } = fixture();
  const doc = a.reviewDocument(bytes, 'agreement.json', snapshot.vault);
  assert.equal(doc.name, 'Shared agreement'); assert.equal(doc.scopes[0].scope, 'Deliver the agreed scope');
  assert.throws(() => a.reviewDocument(new TextEncoder().encode(new TextDecoder().decode(bytes).replace(/\n/g, '\r\n')), 'changed.json', snapshot.vault), /does not match/);
});
test('a committed document with different encoded rights cannot enable acceptance', () => {
  const { project, snapshot } = fixture(); const doc = JSON.parse(project.document);
  doc.terms.milestones[0].recipientAmounts = ['1000000', '0'];
  const bytes = new TextEncoder().encode(JSON.stringify(doc)); snapshot.vault.terms.signedDocumentHash = keccak256(toHex(bytes));
  assert.throws(() => a.reviewDocument(bytes, 'wrong-rights.json', snapshot.vault), /encoded terms do not match/);
});
test('unparseable external documents still require their exact committed bytes', () => {
  const { snapshot } = fixture(); const bytes = new TextEncoder().encode('Original externally authored agreement\n');
  snapshot.vault.terms.signedDocumentHash = keccak256(toHex(bytes));
  assert.equal(a.reviewDocument(bytes, 'agreement.txt', snapshot.vault).hash, snapshot.vault.terms.signedDocumentHash);
});
test('canonical acceptance hashes bind vault address and the complete v1.2 tuple', () => {
  const { snapshot } = fixture(); const original = snapshot.termsHash;
  snapshot.vault.address = addr(8); assert.notEqual(a.computeTermsHash(snapshot.vault), original);
  snapshot.vault.address = addr(7); snapshot.vault.terms.recoveryPolicy = 1;
  assert.notEqual(a.computeTermsHash(snapshot.vault), original);
});
test('only named, unaccepted participants with a matching document and trusted vault may accept', () => {
  const { snapshot, bytes } = fixture(); const doc = a.reviewDocument(bytes, 'agreement.json', snapshot.vault);
  assert.equal(a.agreementEligibility(snapshot, addr(1), doc).canAccept, true);
  assert.equal(a.agreementEligibility(snapshot, addr(9), doc).canAccept, false);
  assert.equal(a.agreementEligibility(snapshot, addr(1)).canAccept, false);
  snapshot.vault.accepted[0].accepted = true; assert.equal(a.agreementEligibility(snapshot, addr(1), doc).canAccept, false);
  snapshot.vault.accepted[0].accepted = false; snapshot.runtimeMatches = false;
  assert.equal(a.agreementEligibility(snapshot, addr(1), doc).canAccept, false);
  snapshot.runtimeMatches = true; snapshot.termsMatch = false;
  assert.equal(a.agreementEligibility(snapshot, addr(1), doc).canAccept, false);
});
test('lock is permissionless only after all required parties accept, with a consistent count', () => {
  const { snapshot } = fixture(); assert.equal(a.agreementEligibility(snapshot, addr(9)).canLock, false);
  snapshot.vault.accepted.forEach(p => p.accepted = true); snapshot.vault.acceptanceCount = 6n;
  assert.equal(a.agreementEligibility(snapshot, addr(9)).canLock, true);
  assert.equal(a.agreementEligibility(snapshot).canLock, false);
  snapshot.vault.acceptanceCount = 5n; assert.equal(a.agreementEligibility(snapshot, addr(9)).canLock, false);
  snapshot.vault.acceptanceCount = 6n; snapshot.vault.locked = true;
  assert.equal(a.agreementEligibility(snapshot, addr(9)).canLock, false);
});
test('receipt verification rejects another actor, target, method, terms hash or native value', () => {
  const { snapshot } = fixture(); const expected = { address: snapshot.vault.address, account: addr(1), termsHash: snapshot.termsHash, action: 'accept' };
  const observed = { to: expected.address, from: expected.account, input: encodeFunctionData({ abi: agreementAbi, functionName: 'acceptAgreement', args: [expected.termsHash] }), value: 0n };
  assert.equal(a.agreementTransactionMatches(observed, expected), true);
  for (const patch of [{ to: addr(9) }, { from: addr(9) }, { value: 1n }, { input: encodeFunctionData({ abi: agreementAbi, functionName: 'lockAgreement' }) }]) assert.equal(a.agreementTransactionMatches({ ...observed, ...patch }, expected), false);
  assert.equal(a.agreementTransactionMatches(observed, { ...expected, termsHash: '0x' + 'ff'.repeat(32) }), false);
});
test('compiled runtime matcher rejects empty, truncated or modified contract code', { skip: !fs.existsSync(path.join(__dirname, '../../contracts/out/ProjectVault.sol/ProjectVault.json')) }, () => {
  const artifact = JSON.parse(fs.readFileSync(path.join(__dirname, '../../contracts/out/ProjectVault.sol/ProjectVault.json')));
  const code = artifact.deployedBytecode.object;
  assert.equal(a.matchesVaultRuntime(code), true);
  assert.equal(a.matchesVaultRuntime('0x'), false);
  assert.equal(a.matchesVaultRuntime(code.slice(0, -2)), false);
  assert.equal(a.matchesVaultRuntime('0xff' + code.slice(4)), false);
});
test('live agreement matches independently recomputed terms hash and compiled P0 runtime', { skip: process.env.LIVE_ARC_TEST !== '1' }, async () => {
  const snapshot = await a.readAgreement(source('vault-reader').addressFrom(source('vault-reader').proofVault));
  assert.equal(snapshot.runtimeMatches, true); assert.equal(snapshot.termsMatch, true);
  assert.equal(snapshot.vault.locked, true); assert.equal(snapshot.vault.acceptanceCount, 6n);
  console.log(`Agreement verified at Arc block ${snapshot.vault.block}; no wallet action broadcast.`);
});

test('pending recovery is scoped to Arc Testnet and this vault, and ignores malformed data', () => {
  const { snapshot } = fixture();
  const pending = { chainId: 5042002, hash: '0x' + 'aa'.repeat(32), address: snapshot.vault.address, account: addr(1), termsHash: snapshot.termsHash, action: 'accept' };
  assert.deepEqual(a.restoreAgreementTransaction(JSON.stringify(pending), snapshot.vault.address), pending);
  assert.equal(a.restoreAgreementTransaction(JSON.stringify({ ...pending, chainId: 5042 }), snapshot.vault.address), undefined);
  assert.equal(a.restoreAgreementTransaction(JSON.stringify(pending), addr(9)), undefined);
  assert.equal(a.restoreAgreementTransaction('{bad-json', snapshot.vault.address), undefined);
  assert.equal(a.restoreAgreementTransaction(JSON.stringify({ ...pending, action: 'deposit' }), snapshot.vault.address), undefined);
});
