const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
// Exercise the actual reader without adding a test runner dependency.
function source(file, resolve = require) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  new Function('require', 'exports', code)(resolve, exports);
  return exports;
}
const abi = source('vault-abi.ts');
const arc = source('arc-client.ts');
const reader = source('vault-reader.ts', name => name === './vault-abi' ? abi : name === './arc-client' ? arc : require(name));
const { formatUSDC, addressFrom, rolesFor, vaultStatus, pendingFor } = reader;
const actor = '0x1111111111111111111111111111111111111111';
const other = '0x2222222222222222222222222222222222222222';
function vault() { return { locked: true, cancelled: false, terms: { funder: actor, verifier: actor, primaryArbiter: other, backupArbiter: other, recipients: [actor], milestones: [] }, milestones: [{ status: 7, index: 0 }], accepted: [{ address: actor, accepted: true }], accounting: [1n, 0n, 0n, 0n, 1n, 0n] }; }
test('USDC retains six-decimal precision and never converts through floating point', () => {
  assert.equal(formatUSDC(600001n), '0.600001');
  assert.equal(formatUSDC(1000000n), '1');
  assert.equal(formatUSDC(9007199254740993000001n), '9,007,199,254,740,993.000001');
});
test('invalid address never reaches the RPC', () => {
  assert.throws(() => addressFrom('not-a-vault'));
  assert.throws(() => addressFrom('0x111'));
});
test('wallet can hold several actual roles; disconnected users are observers', () => {
  assert.deepEqual(rolesFor(vault(), actor), ['Funder', 'Recipient', 'Verifier']);
  assert.deepEqual(rolesFor(vault()), ['Observer']);
});
test('terminal milestones do not create false pending actions', () => {
  assert.equal(vaultStatus(vault()), 'Completed');
  assert.deepEqual(pendingFor(vault(), actor), []);
  assert.deepEqual(pendingFor(vault()), []);
});
test('review and atomic settlement queues follow live statuses and assigned wallet', () => {
  const v = vault(); v.milestones = [{ status: 2, index: 0 }, { status: 6, index: 1 }];
  assert.equal(pendingFor(v, actor).length, 2);
  assert.deepEqual(pendingFor(v, other), ['Milestone 2 · ready for atomic settlement']);
});
test('failed network reads are rejected rather than converted into zero funds', async () => {
  const fetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('offline'); };
  try { await assert.rejects(reader.readVault(addressFrom(actor))); }
  finally { globalThis.fetch = fetch; }
});
test('live Arc proof vault satisfies accounting and exposes terminal statuses', { skip: process.env.LIVE_ARC_TEST !== '1' }, async () => {
  const v = await reader.readVault(addressFrom(reader.proofVault));
  assert.equal(v.accounting[0], v.accounting.slice(1).reduce((sum, n) => sum + n, 0n));
  assert.equal(v.locked, true);
  assert.deepEqual(v.milestones.map(m => m.status), [7, 8]);
  assert.equal(v.accounting[4], 1000000n);
  assert.equal(v.accounting[5], 1000000n);
  console.log(`Read Arc block ${v.block}; actual test USDC D=${formatUSDC(v.accounting[0])}, P=${formatUSDC(v.accounting[4])}, F=${formatUSDC(v.accounting[5])}`);
});

test('public reads fall back to documented dRPC when the primary endpoint is blocked', async () => {
  const originalFetch = globalThis.fetch;
  const visited = [];
  globalThis.fetch = async (input) => {
    const url = input.url || String(input); visited.push(url);
    if (url.includes('rpc.testnet.arc.io')) throw new Error('blocked by client');
    return new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x4cef52' }), { headers: { 'Content-Type': 'application/json' } });
  };
  try {
    assert.equal(await arc.arcClient.getChainId(), 5042002);
    assert.ok(visited.some(url => url.includes('rpc.testnet.arc.io')));
    assert.ok(visited.some(url => url.includes('arc-testnet.drpc.org')));
  } finally { globalThis.fetch = originalFetch; }
});
