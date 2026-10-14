const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { createPublicClient, http, encodeDeployData, erc20Abi } = require('viem');
const { arc } = require('viem/chains');
test('Mainnet RPC and constructor simulation use actual USDC without broadcasting', { skip: process.env.LIVE_MAINNET_READ !== '1' }, async () => {
  const cache=new Map();
  function load(name) {
    if(cache.has(name))return cache.get(name);
    const out={};cache.set(name,out);
    const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
    new Function('require','exports','process',code)(r=>r.startsWith('./')?load(r.slice(2)):require(r),out,{env:{NEXT_PUBLIC_LURRO_NETWORK:'mainnet'}});
    return out;
  }
  const client=createPublicClient({chain:arc,transport:http('https://rpc.mainnet.arc.io',{timeout:15000,retryCount:1})});
  assert.equal(await client.getChainId(),5042);
  const block=await client.getBlock();
  assert.equal(await client.readContract({address:'0x3600000000000000000000000000000000000000',abi:erc20Abi,functionName:'decimals',blockNumber:block.number}),6);
  // Synthetic fixture for an unsigned eth_call only. Never deploy these terms.
  const address=n=>'0x'+n.toString(16).padStart(40,'0');
  const draft={name:'Unsigned simulation',description:'Not a deployed project',funder:address(1),verifier:address(2),primaryArbiter:address(3),backupArbiter:address(4),recipients:[{id:'r',name:'Fixture',address:address(5)}],milestones:[{id:'m',title:'Fixture',scope:'Simulation only',deadline:new Date((Number(block.timestamp)+30*86400)*1000).toISOString(),submitter:'r',amounts:{r:'1'}}]};
  const review=load('project-draft').buildProject(draft,'0x'+'ab'.repeat(32),Number(block.timestamp));
  const {deploymentAbi,vaultBytecode}=load('vault-deployment');
  const data=encodeDeployData({abi:deploymentAbi,bytecode:vaultBytecode,args:[review.terms]});
  const result=await client.call({account:review.terms.funder,data,blockNumber:block.number});
  assert.ok(load('agreement').matchesVaultRuntime(result.data));
  console.log(JSON.stringify({network:'Arc Mainnet',chainId:5042,block:String(block.number),timestamp:String(block.timestamp),usdcDecimals:6,runtimeMatches:true,broadcast:false}));
});
