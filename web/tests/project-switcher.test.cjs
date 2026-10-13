const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function source(file) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../lib', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {}; new Function('require', 'exports', code)(require, exports); return exports;
}
const { switchProjectRoute } = source('project-routes.ts');
const { parseProjectBookmarks, saveProjectBookmarks, readProjectBookmarks, subscribeProjectBookmarks, projectBookmarksKey } = source('project-bookmarks.ts');
const vault = '0xa3b6db6a52ff3cf32438c0989af041d77d3dacae';
test('switching preserves only a supported project section and replaces the vault', () => {
  for (const section of ['agreement','funding','milestones','payments','governance','audit']) {
    assert.equal(switchProjectRoute(section, vault), `/app/${section}/?project=${vault}`);
  }
  for (const section of ['dashboard','create','overview','../../unsafe']) assert.equal(switchProjectRoute(section, vault), `/app/project/?project=${vault}`);
});
test('saved projects normalize and deduplicate addresses, reject malformed entries and cap at twelve', () => {
  assert.deepEqual(parseProjectBookmarks('{broken'), []);
  assert.deepEqual(parseProjectBookmarks('{"address":"0x"}'), []);
  const actual = parseProjectBookmarks(JSON.stringify([vault, vault.toUpperCase().replace('0X','0x'), null, {}, 'https://evil.test', '0x']));
  assert.equal(actual.length, 1); assert.equal(actual[0].toLowerCase(), vault);
  assert.equal(parseProjectBookmarks(JSON.stringify(Array.from({length:20}, (_,i)=>`0x${(i+1).toString(16).padStart(40,'0')}`))).length, 12);
});
test('bookmark writers notify mounted switchers in the same tab and storage changes from another tab', () => {
  const oldWindow = global.window, oldStorage = global.localStorage;
  const target = new EventTarget(), values = new Map();
  global.window = target; global.localStorage = { getItem:key=>values.get(key) ?? null, setItem:(key,value)=>values.set(key,value) };
  try {
    let changes=0; const unsubscribe = subscribeProjectBookmarks(()=>changes++);
    saveProjectBookmarks([vault]); assert.equal(changes,1); assert.equal(readProjectBookmarks()[0].toLowerCase(),vault);
    const unrelated = new Event('storage'); unrelated.key='other'; target.dispatchEvent(unrelated); assert.equal(changes,1);
    const update = new Event('storage'); update.key=projectBookmarksKey; target.dispatchEvent(update); assert.equal(changes,2);
    unsubscribe(); saveProjectBookmarks([]); assert.equal(changes,2);
  } finally { global.window=oldWindow; global.localStorage=oldStorage; }
});
