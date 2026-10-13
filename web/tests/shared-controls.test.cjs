const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
// Render the real shared controls. No browser or wallet transaction is invoked.
function source(file) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../components/ui', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const exports = {}; new Function('require', 'exports', code)(require, exports); return exports;
}
const { Button, ButtonLink } = source('button.tsx');
const { AppPageHeading } = source('page-heading.tsx');
test('shared buttons inside a form do not submit it unless explicitly requested', () => {
  const html = renderToStaticMarkup(React.createElement('form', null,
    React.createElement(Button, { variant: 'icon', disabled: true, 'aria-label': 'Remove recipient' }, 'Remove'),
    React.createElement(Button, { type: 'submit', variant: 'primary' }, 'Continue')));
  assert.match(html, /type="button"/); assert.match(html, /type="submit"/);
  assert.match(html, /disabled=""/); assert.match(html, /aria-label="Remove recipient"/);
});
test('link buttons retain navigation semantics and external-link attributes', () => {
  const html = renderToStaticMarkup(React.createElement(ButtonLink, { href: 'https://explorer.testnet.arc.io', variant: 'text', target: '_blank', rel: 'noopener noreferrer' }, 'Explorer'));
  assert.match(html, /<a /); assert.match(html, /href="https:\/\/explorer.testnet.arc.io"/);
  assert.match(html, /target="_blank"/); assert.match(html, /rel="noopener noreferrer"/);
});
test('shared page heading preserves actionable slots alongside the single page title', () => {
  const html = renderToStaticMarkup(React.createElement(AppPageHeading, { title: 'Project', description: 'Snapshot', actions: React.createElement(Button, null, 'Copy link') }));
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  assert.match(html, />Copy link<\/button>/);
});
