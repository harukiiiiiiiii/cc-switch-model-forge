const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.resolve(__dirname, '..', relativePath), 'utf8');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('GitHub Pages packages every local runtime asset referenced by index.html', () => {
  const html = read('index.html');
  const workflow = read('.github/workflows/pages.yml');
  const packageStep = workflow.match(/- name: Build static artifact[\s\S]*?(?=\n\s*- name: Upload Pages artifact)/)?.[0] || '';

  const scripts = [...html.matchAll(/<script\s+[^>]*src="([^"]+)"/g)].map((match) => match[1]);
  const styles = [...html.matchAll(/<link\s+[^>]*href="([^"]+\.css)"/g)].map((match) => match[1]);
  const runtimeAssets = ['index.html', ...scripts, ...styles].filter((asset) => !/^(?:https?:)?\/\//.test(asset));

  assert.ok(packageStep, 'Pages workflow must define a Build static artifact step');
  for (const asset of runtimeAssets) {
    assert.match(packageStep, new RegExp(`(?:^|\\s)${escapeRegExp(asset)}(?:\\s|$)`), `${asset} is referenced by index.html but missing from the Pages artifact`);
  }
});
