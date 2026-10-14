const { test } = require('node:test');
const assert = require('node:assert/strict');
test('RainbowKit QR generator renders its border-zero mobile pairing layout', async () => {
  const { create } = await import('cuer/QrCode');
  const value = 'wc:' + 'ab'.repeat(32) + '@2?relay-protocol=irn&symKey=' + 'cd'.repeat(32);
  const qr = create(value);
  assert.ok(qr.edgeLength > 0); assert.equal(qr.grid.length,qr.edgeLength);assert.ok(qr.grid.every(row=>row.length===qr.edgeLength));
});

test('workspace wallet config hydrates SSR with no persistent or automatically restored connections', async () => {
  const fs=require('node:fs');const path=require('node:path');const ts=require('typescript');const exports={};
  const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/wallet-config.ts'),'utf8'),{ compilerOptions:{ module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020 } }).outputText;
  const networkCode=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/network.ts'),'utf8'),{ compilerOptions:{ module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020 } }).outputText;
  const settings={};new Function('require','exports',networkCode)(require,settings);
  new Function('require','exports',code)(name=>name==='./network'?settings:require(name),exports);
  const config=exports.createLurroWalletConfig();
  const { hydrate }=await import('@wagmi/core');
  await hydrate(config,{ reconnectOnMount:false }).onMount();
  assert.equal(config.state.connections.size,0);assert.equal(await config.storage.getItem('state'),null);assert.equal(config.chains[0].id,5042002);
});
