const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function build(env = {}) {
  const cache = new Map();
  function load(name) {
    if (cache.has(name)) return cache.get(name);
    const exports = {}; cache.set(name,exports);
    const code = ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib',name+'.ts'),'utf8'),{ compilerOptions:{ module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020 } }).outputText;
    new Function('require','exports','process',code)(r=>r.startsWith('./')?load(r.slice(2)):require(r),exports,{ env });
    return exports;
  }
  return load;
}
const main = () => build({ NEXT_PUBLIC_LURRO_NETWORK:'mainnet' });
test('network selection fails closed and Mainnet never inherits Testnet proof or RPCs', () => {
  const t=build()('network'), m=main()('network');
  assert.equal(t.network.chain.id,5042002);assert.equal(m.network.chain.id,5042);
  assert.throws(()=>t.networkSettings('mainent'));
  assert.equal(m.network.proofVault,'');
  assert.ok(m.network.rpcUrls.every(url=>!url.includes('testnet')));
  assert.equal(m.network.explorer,'https://explorer.arc.io');
  assert.equal(m.writesEnabled,false);
  assert.throws(()=>m.assertWriteAccess(true),/disabled/);
});
test('Mainnet write opt-in still requires action acknowledgement; Testnet remains usable', () => {
  const m=build({ NEXT_PUBLIC_LURRO_NETWORK:'mainnet',NEXT_PUBLIC_LURRO_MAINNET_WRITES_ENABLED:'true' })('network');
  assert.throws(()=>m.assertWriteAccess(),/Confirm/);
  assert.doesNotThrow(()=>m.assertWriteAccess(true));
  assert.doesNotThrow(()=>build()('network').assertWriteAccess());
});
test('project metadata and pending receipt keys are isolated between environments', () => {
  const t=build(),m=main();
  assert.notEqual(t('project-bookmarks').projectBookmarksKey,m('project-bookmarks').projectBookmarksKey);
  assert.notEqual(t('project-bookmarks').projectNamesKey,m('project-bookmarks').projectNamesKey);
  for(const kind of ['creation','agreement','workflow'])
    assert.notEqual(t('network').pendingStorageKey(kind,'0xabc'),m('network').pendingStorageKey(kind,'0xabc'));
  assert.equal(t('project-bookmarks').projectBookmarksKey,'lurro:testnet:linked-vaults:v1');
});
test('receipt recovery refuses other-chain transactions even at an identical vault address', () => {
  const addr='0x'+'11'.repeat(20);
  const tx={ address:addr,target:addr,account:addr,input:'0x12345678',hash:'0x'+'aa'.repeat(32),label:'Deposit',chainId:5042002 };
  const m=main()('transaction');
  assert.equal(m.restoreAction(JSON.stringify(tx),addr),undefined);
  assert.ok(m.restoreAction(JSON.stringify({...tx,chainId:5042}),addr));
});
test('wallet recognizes both chains but initial chain and public RPC follow the app build', () => {
  const config=main()('wallet-config').createLurroWalletConfig();
  assert.deepEqual(config.chains.map(c=>c.id),[5042,5042002]);
  assert.equal(main()('arc-client').arcClient.chain.id,5042);
});
test('Mainnet agreement document commits to chain 5042 and changes its exact document hash', () => {
  const addr=n=>'0x'+n.toString(16).padStart(40,'0');
  const draft={name:'Mainnet simulation',description:'Local only',funder:addr(1),verifier:addr(2),primaryArbiter:addr(3),backupArbiter:addr(4),recipients:[{id:'r',name:'Recipient',address:addr(5)}],milestones:[{id:'m',title:'Delivery',scope:'Exact scope',deadline:'2026-12-01T00:00:00Z',submitter:'r',amounts:{r:'1'}}]};
  const salt='0x'+'ab'.repeat(32),now=1790000000;
  const t=build()('project-draft').buildProject(draft,salt,now),m=main()('project-draft').buildProject(draft,salt,now);
  assert.equal(JSON.parse(m.document).chainId,5042);
  assert.notEqual(t.terms.signedDocumentHash,m.terms.signedDocumentHash);
});
test('production defaults to Mainnet while explicit Testnet builds remain Testnet', () => {
  const prod=build({ NODE_ENV:'production' })('network');
  assert.equal(prod.network.chain.id,5042);
  assert.equal(prod.writesEnabled,false);
  assert.equal(build({ NODE_ENV:'production',NEXT_PUBLIC_LURRO_NETWORK:'testnet' })('network').network.chain.id,5042002);
});
test('Mainnet public proof exposes deployment evidence without relabelling Testnet payments', () => {
  const proof=main()('public-proof').publicProof;
  assert.ok(proof.vault.startsWith('https://explorer.arc.io/address/'));
  assert.ok(proof.cards.some(card=>card.title==='Successful deployment'));
  assert.ok(proof.cards.some(card=>card.href.includes('sourcify.dev')));
  assert.ok(proof.cards.every(card=>!card.href.includes('testnet') && !card.title.includes('payout')));
  assert.ok(!JSON.stringify(proof).includes('Testnet'));
  assert.ok(build({ NEXT_PUBLIC_LURRO_NETWORK:'testnet' })('public-proof').publicProof.vault.includes('explorer.testnet.arc.io'));
});
