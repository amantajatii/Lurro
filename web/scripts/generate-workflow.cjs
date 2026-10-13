const fs = require('node:fs');
const path = require('node:path');
const artifact = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../contracts/out/ProjectVault.sol/ProjectVault.json'), 'utf8'));
const abi = artifact.abi.filter(item => item.type !== 'constructor');
fs.writeFileSync(path.resolve(__dirname, '../lib/workflow-abi.ts'), '// Generated from the original Lurro v1.2 contract artifact.\nexport const workflowAbi = ' + JSON.stringify(abi, null, 2) + ' as const;\n');
