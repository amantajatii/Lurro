const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function source(file, resolve = require) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {}; new Function('require', 'exports', code)(name => name === "./network" ? source("network.ts") : resolve(name), exports); return exports;
}
const abi = source('vault-abi.ts');
const arc = source('arc-client.ts');
const reader = source('vault-reader.ts', name => name === './vault-abi' ? abi : name === './arc-client' ? arc : require(name));
const { projectOverview, projectNextSteps, chainDate } = source('project-overview.ts', name => name === './vault-reader' ? reader : require(name));
const addr = n => '0x' + n.toString(16).padStart(40, '0');
function vault() {
  const m = (index, status, deadline) => ({ index, status, submissionDeadline: deadline, recipientAmounts: [600000n, 400000n], submitter: addr(5) });
  return { value: 3000000n, timestamp: 1000000, locked: true, cancelled: false, terms: { funder: addr(1), verifier: addr(2), primaryArbiter: addr(3), backupArbiter: addr(4), recipients: [addr(5), addr(6)], milestones: [] }, accounting: [2000000n, 0n, 0n, 0n, 1000000n, 1000000n], accepted: [], milestones: [m(0, 7, 2000n), m(1, 8, 3000n), m(2, 0, 4000n)] };
}
test('lifetime deposits and refunds are kept separate from funds currently held', () => {
  const s = projectOverview(vault());
  assert.equal(s.deposited, 2000000n); assert.equal(s.retained, 0n);
  assert.equal(s.paidCount, 1); assert.equal(s.cancelledCount, 1); assert.equal(s.openCount, 1);
  assert.equal(s.nextSubmission.index, 2);
});
test('recipient paid totals exclude cancelled milestones and retain exact amounts', () => {
  const s = projectOverview(vault());
  assert.equal(s.recipients[0].committed, 1800000n);
  assert.equal(s.recipients[0].paid, 600000n);
  assert.equal(s.recipients[1].paid, 400000n);
});
test('funding progress stays bounded with zero commitments and very large BigInts', () => {
  const v = vault(); v.value = 0n; assert.equal(projectOverview(v).barPercent, 0);
  v.value = 1n; v.accounting[0] = (1n << 255n); assert.equal(projectOverview(v).barPercent, 100);
});
test('closed projects do not advertise upcoming submission deadlines', () => {
  const v = vault(); v.milestones.pop(); assert.equal(projectOverview(v).nextSubmission, undefined);
});
test('next steps distinguish funder deposits, permissionless reservations and recipient submission', () => {
  const v = vault();
  assert.match(projectNextSteps(v, addr(1))[0], /not fully funded/);
  assert.deepEqual(projectNextSteps(v), []);
  assert.deepEqual(projectNextSteps(v, addr(5)), []);
  v.accounting[1] = 1000000n;
  assert.match(projectNextSteps(v, addr(5))[0], /available to reserve/);
  v.milestones[2].status = 1; v.accounting[1] = 0n; v.accounting[2] = 1000000n;
  assert.match(projectNextSteps(v, addr(5))[0], /submit the agreed work/);
  assert.deepEqual(projectNextSteps(v, addr(6)), []);
  v.milestones[2].submissionDeadline = 999n; assert.deepEqual(projectNextSteps(v, addr(5)), []);
});
test('date display is UTC and tolerates unsupported JS date ranges', () => {
  assert.equal(chainDate(0n), '1970-01-01 00:00 UTC');
  assert.match(chainDate((1n << 64n) - 1n), /Unix seconds/);
});
