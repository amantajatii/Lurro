const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function harness() {
  const slots = []; const effects = []; let index;
  const react = {
    useState(initial) { const i = index++; if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }]; },
    useRef(initial) { const i = index++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
    useEffect(fn, deps) { const i = index++; if (!slots[i] || deps.some((d,j) => d !== slots[i].deps[j])) { slots[i]?.cleanup?.(); slots[i] = { deps }; effects.push(() => { slots[i].cleanup = fn(); }); } },
  };
  return { react, render(fn) { index = 0; const result = fn(); effects.splice(0).forEach(e => e()); return result; } };
}
function load(file, mocks) {
  const js = ts.transpileModule(fs.readFileSync(path.join(__dirname,'../components',file),'utf8'),{ compilerOptions:{ module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {}; new Function('require','exports',js)(name => { if (name in mocks) return mocks[name]; throw Error('Unmocked dependency: '+name); },exports); return exports;
}
const addr = '0x'+'11'.repeat(20); const hash = '0x'+'ab'.repeat(32);
for (const kind of ['agreement','workflow']) {
  for (const outcome of ['verified','unverified','reverted']) test(`${kind}: ${outcome} receipt releases actions only after verification`, async () => {
    const h = harness(); let refreshes = 0; let confirmations = 0; let sends = 0;
    const saved = { address:addr,account:addr,target:addr,hash,input:'0x1234',label:'Deposit USDC',termsHash:hash,action:'accept',chainId:5042002 };
    const storage = new Map([['pending',JSON.stringify(saved)]]);
    const previous = global.sessionStorage;
    global.sessionStorage = { getItem:() => storage.get('pending') ?? null, setItem:(_,v) => storage.set('pending',v), removeItem:() => storage.delete('pending') };
    const snapshot = { termsHash:hash,runtimeMatches:outcome !== 'unverified',termsMatch:true,vault:{ block:10n } };
    const client = { waitForTransactionReceipt:async () => ({ status:outcome === 'reverted' ? 'reverted':'success',transactionHash:hash,blockNumber:10n }),getTransaction:async () => ({ input:'0x1234',value:0n }) };
    const mocks = {
      '../../lib/network':{ pendingStorageKey:()=> 'pending',assertWriteAccess:()=>{} },
      react:h.react, viem:{ createWalletClient:() => { sends++; return {}; } },
      '../dashboard/use-wallet':{ useWallet:() => ({ account:addr,provider:{ request:async()=>[addr] } }) },
      '../../lib/arc-client':{ arcClient:client }, '../../lib/vault-reader':{ chain:{ id:5042002 } },
      '../../lib/agreement-abi':{ agreementAbi:[] }, '../../lib/workflow-abi':{ workflowAbi:[] },
      '../../lib/agreement':{ restoreAgreementTransaction:s=>s?JSON.parse(s):undefined,agreementTransactionMatches:()=>true,acceptanceReceiptMatches:()=>outcome !== 'unverified',readAgreement:async()=>snapshot },
      '../../lib/transaction':{ restoreAction:s=>s?JSON.parse(s):undefined,transactionMatches:()=>true },
      '../../lib/workflow':{ readWorkflow:async()=>snapshot,actionAllowed:()=>true },
    };
    try {
      const isAgreement = kind === 'agreement';
      const hooks = load(isAgreement?'project/use-agreement-transaction.ts':'workflow/use-vault-action.ts',mocks);
      const render = () => h.render(() => isAgreement ? hooks.useAgreementTransaction(addr,()=>refreshes++) : hooks.useVaultAction(addr,()=>refreshes++,()=>confirmations++));
      render(); let hook = render();
      await (isAgreement ? hook.checkReceipt() : hook.check()); hook = render();
      assert.equal(hook.busy,false);
      if (outcome === 'verified') {
        assert.equal(hook.transaction,undefined); assert.equal(hook.completed.hash,hash);
        assert.equal(refreshes,1); assert.equal(storage.has('pending'),false);
        if (!isAgreement) assert.equal(confirmations,1);
      } else {
        assert.equal(hook.transaction.hash,hash); assert.equal(hook.completed,undefined);
        assert.equal(refreshes,0); assert.equal(storage.has('pending'),true);
        await hook.send(isAgreement?'accept':{ name:'deposit',label:'Deposit USDC',amount:1n });
        assert.equal(sends,0);
      }
    } finally { global.sessionStorage = previous; }
  });
}
test('project refresh preserves display, isolates another vault and drops failed data', async () => {
  const h = harness(); let raw = addr; const requests = [];
  const reader = () => new Promise((resolve,reject)=>requests.push({resolve,reject}));
  const { useProjectRead } = load('project/use-project-read.ts',{ react:h.react,'next/navigation':{useSearchParams:()=>({get:()=>raw})},'../../lib/vault-reader':{addressFrom:v=>v} });
  const render = () => h.render(()=>useProjectRead(reader));
  assert.equal(render().data,undefined); requests[0].resolve({value:2}); await Promise.resolve();
  let hook = render(); assert.equal(hook.data.value,2); hook.refresh(); hook = render();
  assert.equal(hook.loading,true); assert.equal(hook.data.value,2);
  raw = '0x'+'22'.repeat(20); hook = render(); assert.equal(hook.data,undefined);
  requests[1].resolve({value:99}); await Promise.resolve(); assert.equal(render().data,undefined);
  requests[2].reject(Error('RPC unavailable')); await Promise.resolve(); hook = render();
  assert.equal(hook.loading,false); assert.equal(hook.data,undefined); assert.match(hook.error,/RPC unavailable/);
});

for (const kind of ['agreement','workflow']) {
  for (const scenario of ['release-disabled','missing-consent','wrong-wallet-chain']) test(`${kind}: Mainnet ${scenario} never opens a signing request`,async()=>{
    const h=harness();let requests=0,signers=0,reads=0;
    const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/network.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
    const settings={};new Function('require','exports','process',code)(require,settings,{env:{NEXT_PUBLIC_LURRO_NETWORK:'mainnet',NEXT_PUBLIC_LURRO_MAINNET_WRITES_ENABLED:scenario==='release-disabled'?'false':'true'}});
    const previous=global.sessionStorage;global.sessionStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
    const wallet={account:addr,provider:{request:async({method})=>{requests++;return method==='eth_accounts'?[addr]:'0x4cef52';}}};
    const mocks={
      react:h.react,viem:{createWalletClient:()=>{signers++;throw Error('Unexpected signer');}},
      '../dashboard/use-wallet':{useWallet:()=>wallet},'../../lib/network':settings,
      '../../lib/vault-reader':{chain:{id:5042}},'../../lib/arc-client':{arcClient:{getChainId:async()=>5042}},
      '../../lib/agreement-abi':{agreementAbi:[]},'../../lib/workflow-abi':{workflowAbi:[]},
      '../../lib/agreement':{restoreAgreementTransaction:()=>undefined,readAgreement:async()=>{reads++;throw Error('Unexpected read');}},
      '../../lib/transaction':{restoreAction:()=>undefined},
      '../../lib/workflow':{readWorkflow:async()=>{reads++;throw Error('Unexpected read');}},
    };
    try{
      const agreement=kind==='agreement';
      const hooks=load(agreement?'project/use-agreement-transaction.ts':'workflow/use-vault-action.ts',mocks);
      const render=()=>agreement?hooks.useAgreementTransaction(addr,()=>{}):hooks.useVaultAction(addr,()=>{},()=>{});
      const tx=h.render(render),ack=scenario!=='missing-consent';
      if(agreement)await tx.send('accept',{},undefined,ack);
      else await tx.send({name:'deposit',amount:1000000n,label:'Deposit'},ack);
      const result=h.render(render);
      assert.match(result.error,scenario==='release-disabled'?/disabled/:scenario==='missing-consent'?/Confirm/:/Arc Mainnet/);
      assert.equal(signers,0);assert.equal(reads,0);
      if(scenario!=='wrong-wallet-chain')assert.equal(requests,0);
    }finally{global.sessionStorage=previous;}
  });
}
