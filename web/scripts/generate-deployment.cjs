// Run after forge build from the repo root: node web/scripts/generate-deployment.cjs
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '../..');
const artifact = JSON.parse(fs.readFileSync(path.join(root, 'contracts/out/ProjectVault.sol/ProjectVault.json'), 'utf8'));
const abi = artifact.abi.filter(item => item.type === 'constructor' || item.type === 'error');
fs.writeFileSync(path.join(root, 'web/lib/vault-deployment.ts'), '// Generated from ProjectVault.sol, Solidity 0.8.30. Regenerate with web/scripts/generate-deployment.cjs.\nexport const deploymentAbi = ' + JSON.stringify(abi, null, 2) + ' as const;\nexport const vaultBytecode = "' + artifact.bytecode.object + '" as const;\n');
