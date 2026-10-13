// Run after forge build: node web/scripts/generate-agreement.cjs
const fs = require('node:fs');
const path = require('node:path');
const { keccak256, toHex } = require('viem');
const root = path.join(__dirname, '../..');
const artifact = JSON.parse(fs.readFileSync(path.join(root, 'contracts/out/ProjectVault.sol/ProjectVault.json')));
const abi = artifact.abi.filter(item => ['termsHash', 'acceptAgreement', 'lockAgreement'].includes(item.name) || item.type === 'error');
const runtime = new Uint8Array(Buffer.from(artifact.deployedBytecode.object.slice(2), 'hex'));
const ranges = Object.values(artifact.deployedBytecode.immutableReferences).flat().sort((a,b) => a.start-b.start);
for (const { start, length } of ranges) runtime.fill(0, start, start + length);
fs.writeFileSync(path.join(root, 'web/lib/agreement-abi.ts'), '// Generated from ProjectVault.sol. Regenerate with web/scripts/generate-agreement.cjs.\nexport const agreementAbi = ' + JSON.stringify(abi, null, 2) + ' as const;\nexport const runtimeLength = ' + runtime.length + ';\nexport const immutableRanges = ' + JSON.stringify(ranges) + ' as const;\nexport const normalizedRuntimeHash = "' + keccak256(toHex(runtime)) + '" as const;\n');
