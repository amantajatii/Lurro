const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const path = require('node:path'); const ts = require('typescript');
const cache = new Map();
function source(name) { if (cache.has(name)) return cache.get(name); const exports={};cache.set(name,exports);const code=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib',name+'.ts'),'utf8'),{ compilerOptions:{ module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020 } }).outputText;new Function('require','exports',code)(name=>name.startsWith('./')?source(name.slice(2)):require(name),exports);return exports; }
const w = source('workflow'); const audit = source('audit');
const addr = n => '0x'+n.toString(16).padStart(40,'0'); const hash = '0x'+'ab'.repeat(32);
function fixture(status=0) {
 const term={ submitter:addr(5),submissionDeadline:2000n,finalEvidenceDeadline:8000n,recipientAmounts:[600000n,400000n],scopeHash:hash };
 const t={ funder:addr(1),verifier:addr(2),primaryArbiter:addr(3),backupArbiter:addr(4),recipients:[addr(5),addr(6)],milestones:[term],reviewPeriodSeconds:100,approvalChallengeSeconds:100,rejectionChallengeSeconds:100,backupDelaySeconds:300,arbitrationPeriodSeconds:700,cancellationProposalSeconds:700,maxEvidenceRevisions:3 };
 return { runtimeMatches:true,termsMatch:true,vault:{ address:addr(7),terms:t,locked:true,cancelled:false,timestamp:1000000,milestones:[{ ...term,index:0,status }],accepted:[1,2,3,4,5,6].map(n=>({ address:addr(n),accepted:true })),accounting:[1000000n,1000000n,0n,0n,0n,0n] },states:[{ status,revision:1,evidenceHash:hash,submittedAt:950n,approvedAt:950n,rejectedAt:950n,disputeOpenedAt:900n,hadVerifierApprovalBeforeDispute:false }],closeTimes:[1100n],activeObligations:1000000n,stateVersion:5n,proposalId:1n,proposal:[5n,1500n,false],approvals:[1,5,6].map(n=>({ address:addr(n),approved:true })),balance:2000000n,allowance:1000000n };
}
const action = (name,extra={}) => ({ name,label:name,milestone:0,...extra });
test('USDC parser preserves exact base units and rejects rounding, signs and exponent input',()=>{
 assert.equal(w.parseAmount('0.000001'),1n); assert.equal(w.parseAmount('123456789.123456'),123456789123456n);
 for(const input of ['0','-1','1e3','0.0000001','1.','1,000','01','0x10']) assert.throws(()=>w.parseAmount(input));
});
test('funding capacity excludes held allocation; deposit requires funder, allowance and token balance',()=>{
 const s=fixture();s.vault.accounting[1]=200000n;assert.equal(w.depositCapacity(s),800000n);
 const a=action('deposit',{ amount:800000n });assert.equal(w.actionAllowed(s,addr(1),a),true);assert.equal(w.actionAllowed(s,addr(5),a),false);
 s.allowance=799999n;assert.equal(w.actionAllowed(s,addr(1),a),false);s.allowance=800000n;s.balance=799999n;assert.equal(w.actionAllowed(s,addr(1),a),false);
 s.balance=800000n;s.runtimeMatches=false;assert.equal(w.actionAllowed(s,addr(1),a),false);
});
test('reservation is permissionless but requires complete funding, sequence and future deadline',()=>{
 const s=fixture();assert.equal(w.actionAllowed(s,addr(9),action('reserveMilestone')),true);
 s.vault.accounting[1]=999999n;assert.equal(w.actionAllowed(s,addr(9),action('reserveMilestone')),false);
 s.vault.accounting[1]=1000000n;s.vault.timestamp=2000000;assert.equal(w.actionAllowed(s,addr(9),action('reserveMilestone')),false);
});
test('only submitter can submit; resubmission stops at deadline or revision limit',()=>{
 const s=fixture(1);assert.equal(w.actionAllowed(s,addr(5),action('submitEvidence')),true);assert.equal(w.actionAllowed(s,addr(6),action('submitEvidence')),false);
 s.states[0].status=3;assert.equal(w.actionAllowed(s,addr(5),action('resubmitEvidence')),true);s.states[0].revision=3;assert.equal(w.actionAllowed(s,addr(5),action('resubmitEvidence')),false);
 s.states[0].revision=2;s.vault.timestamp=8000000;assert.equal(w.actionAllowed(s,addr(5),action('resubmitEvidence')),false);
});
test('verifier review binds exact evidence and revision and closes at the boundary',()=>{
 const s=fixture(2); const a=action('approveEvidence',{ revision:1,hash });assert.equal(w.actionAllowed(s,addr(2),a),true);
 assert.equal(w.actionAllowed(s,addr(2),{ ...a,revision:2 }),false);assert.equal(w.actionAllowed(s,addr(1),a),false);
 s.vault.timestamp=1050000;assert.equal(w.actionAllowed(s,addr(2),a),false);assert.equal(w.actionAllowed(s,addr(6),action('escalateReviewTimeout')),true);assert.equal(w.actionAllowed(s,addr(9),action('escalateReviewTimeout')),false);
});
test('challenge eligibility distinguishes submitter, funder and allocated recipients',()=>{
 const s=fixture(4);assert.equal(w.actionAllowed(s,addr(1),action('challengeApproval')),true);assert.equal(w.actionAllowed(s,addr(6),action('challengeApproval')),true);
 s.vault.terms.milestones[0].recipientAmounts[1]=0n;assert.equal(w.actionAllowed(s,addr(6),action('challengeApproval')),false);
 s.states[0].status=3;assert.equal(w.actionAllowed(s,addr(5),action('challengeRejection')),true);assert.equal(w.actionAllowed(s,addr(1),action('challengeRejection')),false);
});
test('backup activation and arbitration default honor exact time boundaries',()=>{
 const s=fixture(5);assert.equal(w.actionAllowed(s,addr(3),action('resolveDispute')),true);assert.equal(w.actionAllowed(s,addr(4),action('resolveDispute')),false);
 s.vault.timestamp=1200000;assert.equal(w.actionAllowed(s,addr(4),action('resolveDispute')),true);
 s.vault.timestamp=1600000;assert.equal(w.actionAllowed(s,addr(3),action('resolveDispute')),false);assert.equal(w.actionAllowed(s,addr(9),action('finalizeDefault')),true);
});
test('payout and refund are permissionless and cannot redirect the recipient',()=>{
 const s=fixture(6);assert.equal(w.actionAllowed(s,addr(9),action('executePayout')),true);s.vault.milestones[0].status=7;assert.equal(w.actionAllowed(s,addr(9),action('executePayout')),false);
 s.vault.accounting[3]=1n;assert.equal(w.actionAllowed(s,addr(9),action('claimRefund')),true);assert.deepEqual(w.actionArgs(action('claimRefund')),[]);
});
test('cancellation requires current proposal, live version, unanimity and eligible signers',()=>{
 const s=fixture();const a=action('executeEarlyCancellation',{ proposalId:1n });assert.equal(w.actionAllowed(s,addr(9),a),true);
 s.approvals[1].approved=false;assert.equal(w.actionAllowed(s,addr(9),a),false);
 assert.equal(w.actionAllowed(s,addr(5),action('approveCancellationProposal',{ proposalId:1n })),true);assert.equal(w.actionAllowed(s,addr(2),action('approveCancellationProposal',{ proposalId:1n })),false);
 s.approvals[1].approved=true;s.stateVersion=6n;assert.equal(w.actionAllowed(s,addr(9),a),false);s.stateVersion=5n;s.vault.timestamp=1500000;assert.equal(w.actionAllowed(s,addr(9),a),false);
});
test('audit exports lossless bigint coverage and settlement fields',()=>{
 const value=JSON.parse(audit.serializeAudit({ block:9007199254740993n,amount:1234567n }));assert.equal(value.block,'9007199254740993');assert.equal(value.amount,'1234567');assert.equal(audit.paymentEvent('PaymentSettled'),true);assert.equal(audit.paymentEvent('RefundQueued'),false);
});
test('live workflow identity, accounting, governance and original settlement event trail',{ skip:process.env.LIVE_ARC_TEST!=='1',timeout:120000 },async()=>{
 const { addressFrom,proofVault }=source('vault-reader');const s=await w.readWorkflow(addressFrom(proofVault));assert.equal(s.runtimeMatches,true);assert.equal(s.termsMatch,true);assert.equal(s.vault.accounting[4],1000000n);assert.equal(s.vault.accounting[5],1000000n);assert.equal(s.states[0].status,7);assert.equal(s.states[1].status,8);assert.equal(s.proposal[2],true);
 const block=await audit.deploymentBlock(s.vault.address,s.vault.block);const window=await audit.readAuditWindow(s.vault.address,block,s.vault.block);const names=window.logs.map(l=>l.eventName);assert.ok(names.includes('ProjectCreated'));assert.equal(names.filter(n=>n==='AgreementAccepted').length,6);assert.equal(names.filter(n=>n==='PaymentSettled').length,2);assert.equal(names.filter(n=>n==='RefundSettled').length,1);
 console.log('Verified original event window',block.toString(),window.to.toString(),'events',names.length);
});

test('receipt matching and pending recovery reject another vault, signer, method, chain or native value',()=>{
 const txlib=source('transaction');const expected={ address:addr(7),target:addr(7),account:addr(1),input:'0x12345678',hash,chainId:5042002,label:'Deposit USDC' };
 const observed={ to:addr(7),from:addr(1),input:'0x12345678',value:0n };
 assert.equal(txlib.transactionMatches(observed,expected),true);
 for(const altered of [{ to:addr(8) },{ from:addr(8) },{ input:'0x11111111' },{ value:1n }]) assert.equal(txlib.transactionMatches({ ...observed,...altered },expected),false);
 assert.ok(txlib.restoreAction(JSON.stringify(expected),addr(7)));
 for(const changed of [{ chainId:5042 },{ address:addr(8) },{ target:addr(8) },{ hash:'bad' }]) assert.equal(txlib.restoreAction(JSON.stringify({ ...expected,...changed }),addr(7)),undefined);
 assert.equal(txlib.restoreAction('bad',addr(7)),undefined);
});

test('workflow ABI matches the compiled original contract including write methods and event fields',{ skip:!fs.existsSync(path.join(__dirname,'../../contracts/out/ProjectVault.sol/ProjectVault.json')) },()=>{
 const artifact=JSON.parse(fs.readFileSync(path.join(__dirname,'../../contracts/out/ProjectVault.sol/ProjectVault.json'),'utf8'));
 assert.deepEqual(source('workflow-abi').workflowAbi,artifact.abi.filter(item=>item.type!=='constructor'));
});
test('explorer fallback decodes original event bytes and rejects substituted addresses or topics',()=>{
 const { encodeEventTopics,encodeAbiParameters }=require('viem');const abi=source('workflow-abi').workflowAbi;
 const raw={ address:{ hash:addr(7) },block_number:100,index:1,transaction_hash:hash,topics:[...encodeEventTopics({ abi,eventName:'PaymentSettled',args:{ milestoneId:0n,recipient:addr(5) } }),null],data:encodeAbiParameters([{ type:'uint256' }],[600000n]) };
 const event=audit.decodeExplorerLog(raw,addr(7));assert.equal(event.eventName,'PaymentSettled');assert.equal(event.args.amount,600000n);assert.equal(event.args.recipient.toLowerCase(),addr(5));
 assert.throws(()=>audit.decodeExplorerLog({ ...raw,address:{ hash:addr(8) } },addr(7)));assert.throws(()=>audit.decodeExplorerLog({ ...raw,topics:['invalid'] },addr(7)));
});
test('live explorer fallback exposes actual payout and refund bytes without RPC history access',{ skip:process.env.LIVE_ARC_TEST!=='1',timeout:60000 },async()=>{
 const { addressFrom,proofVault }=source('vault-reader');const events=await audit.readExplorerWindow(addressFrom(proofVault),66841035n,66851034n);
 assert.equal(events.length,36);assert.equal(events.filter(e=>e.eventName==='PaymentSettled').length,2);assert.equal(events.find(e=>e.eventName==='RefundSettled').args.amount,1000000n);
 console.log('Explorer fallback verified',events.length,'original events');
});
