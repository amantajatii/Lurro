const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { keccak256, toHex, encodeDeployData } = require('viem');
function source(file) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {}; new Function('require', 'exports', code)(require, exports); return exports;
}
const { buildProject, parseAmount, completedProjectSteps } = source('project-draft.ts');
const { deploymentAbi, vaultBytecode } = source('vault-deployment.ts');
const addr = n => '0x' + n.toString(16).padStart(40, '0');
const salt = '0x' + 'ab'.repeat(32);
const now = Date.parse('2026-10-13T00:00:00Z') / 1000;
function draft() { return { name: 'Test agreement', description: 'Exact document commitment', funder: addr(1), verifier: addr(2), primaryArbiter: addr(3), backupArbiter: addr(4), recipients: [{ id: 'high', name: 'Higher', address: addr(6) }, { id: 'low', name: 'Lower', address: addr(5) }], milestones: [{ id: 'm', title: 'Delivery', scope: '  Agreed deliverables  ', deadline: '2026-11-01T00:00:00Z', submitter: 'high', amounts: { high: '1.000001', low: '2' } }] }; }
test('sorted addresses retain each recipient allocation and evidence submitter', () => {
  const r = buildProject(draft(), salt, now);
  assert.deepEqual(r.terms.recipients, [addr(5), addr(6)]);
  assert.deepEqual(r.terms.milestones[0].recipientAmounts, [2000000n, 1000001n]);
  assert.equal(r.terms.milestones[0].submitter, addr(6));
  assert.equal(r.total, 3000001n);
});
test('downloaded document bytes and trimmed scope reproduce on-chain hashes', () => {
  const r = buildProject(draft(), salt, now);
  assert.equal(keccak256(toHex(r.document)), r.terms.signedDocumentHash);
  assert.equal(r.terms.milestones[0].scopeHash, keccak256(toHex('Agreed deliverables')));
  assert.equal(r.terms.milestones[0].finalEvidenceDeadline - r.terms.milestones[0].submissionDeadline, 604800n);
  assert.equal(JSON.parse(r.document).terms.milestones[0].recipientAmounts[1], '1000001');
});
test('USDC rejects rounding, negatives, exponents, and uint256 overflow', () => {
  assert.equal(parseAmount('9007199254740993.000001'), 9007199254740993000001n);
  for (const value of ['1.0000001', '-1', '1e6', 'Infinity', '', '01', '9'.repeat(80)]) assert.throws(() => parseAmount(value));
});
test('role collisions, zero/token recipients, missing entitlements and submitters are rejected', () => {
  let d = draft(); d.verifier = d.funder; assert.throws(() => buildProject(d, salt, now));
  d = draft(); d.recipients[0].address = addr(1); assert.throws(() => buildProject(d, salt, now));
  d = draft(); d.recipients[0].address = addr(0); assert.throws(() => buildProject(d, salt, now));
  d = draft(); d.recipients[0].address = '0x3600000000000000000000000000000000000000'; assert.throws(() => buildProject(d, salt, now));
  d = draft(); d.milestones[0].amounts.high = '0'; assert.throws(() => buildProject(d, salt, now));
  d = draft(); d.milestones[0].submitter = 'removed'; assert.throws(() => buildProject(d, salt, now));
});
test('expired, equal, and descending submission deadlines are rejected', () => {
  const d = draft(); assert.throws(() => buildProject(d, salt, Date.parse(d.milestones[0].deadline) / 1000));
  d.milestones.push({ ...d.milestones[0], id: 'm2' }); assert.throws(() => buildProject(d, salt, now));
  d.milestones[1].deadline = '2026-10-20T00:00:00Z'; assert.throws(() => buildProject(d, salt, now));
});
test('constructor bundle matches the compiled Solidity artifact and encodes actual terms', () => {
  const artifactPath = path.join(__dirname, '../../contracts/out/ProjectVault.sol/ProjectVault.json');
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath));
    assert.equal(vaultBytecode, artifact.bytecode.object);
    assert.deepEqual(deploymentAbi, artifact.abi.filter(item => item.type === 'constructor' || item.type === 'error'));
  }
  const r = buildProject(draft(), salt, now);
  const data = encodeDeployData({ abi: deploymentAbi, bytecode: vaultBytecode, args: [r.terms] });
  assert.ok(data.startsWith(vaultBytecode)); assert.ok(data.length > vaultBytecode.length);
});
test('live Arc constructor simulation accepts the generated P0 terms without broadcasting', { skip: process.env.LIVE_ARC_TEST !== '1' }, async () => {
  const { createPublicClient, http } = require('viem');
  const { arcTestnet } = require('viem/chains');
  const client = createPublicClient({ chain: arcTestnet, transport: http('https://rpc.testnet.arc.io', { timeout: 15000 }) });
  const block = await client.getBlock();
  const d = draft(); d.milestones[0].deadline = new Date((Number(block.timestamp) + 30 * 86400) * 1000).toISOString();
  const r = buildProject(d, salt, Number(block.timestamp));
  const data = encodeDeployData({ abi: deploymentAbi, bytecode: vaultBytecode, args: [r.terms] });
  const result = await client.call({ account: r.terms.funder, data });
  assert.ok(result.data && result.data.length > 1000);
  console.log(`Constructor simulated at Arc block ${block.number}; no transaction broadcast.`);
});

test('step checkmarks follow current valid fields and disappear when fields are cleared', () => {
  const d = draft();
  assert.deepEqual(completedProjectSteps(d, now), [true, true, true]);
  d.name = ''; assert.deepEqual(completedProjectSteps(d, now), [false, true, false]);
  d.name = 'Project'; d.verifier = d.funder;
  assert.deepEqual(completedProjectSteps(d, now), [false, true, false]);
  d.verifier = addr(2); d.recipients[0].name = '';
  assert.deepEqual(completedProjectSteps(d, now), [true, false, false]);
  d.recipients[0].name = 'Higher'; d.recipients[0].address = '';
  assert.deepEqual(completedProjectSteps(d, now), [true, false, false]);
  d.recipients[0].address = addr(6); d.milestones[0].amounts.high = '0';
  assert.deepEqual(completedProjectSteps(d, now), [true, true, false]);
  d.milestones[0].amounts.high = '1'; d.funder = '';
  assert.deepEqual(completedProjectSteps(d, now), [false, true, false]);
});
