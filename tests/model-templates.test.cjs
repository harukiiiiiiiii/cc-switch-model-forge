const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadCatalog() {
  const source = fs.readFileSync(path.resolve(__dirname, '..', 'catalog-data.js'), 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return context.window.CC_CATALOG.models;
}

function loadTemplates(catalog) {
  const modulePath = path.resolve(__dirname, '..', 'model-templates.js');
  delete require.cache[modulePath];
  const templates = require(modulePath);
  templates.applyBuiltInDefaults(catalog);
  return templates;
}

test('default template list includes blank, compatibility, current OpenAI, Grok, and DeepSeek presets', () => {
  const catalog = loadCatalog();
  const templates = loadTemplates(catalog);
  const ids = templates.listTemplates().map((item) => item.id);
  assert.deepEqual(ids, [
    'blank',
    'openai-compatible',
    'gpt-5.6-sol',
    'gpt-5.6-terra',
    'gpt-5.6-luna',
    'grok-4.6',
    'deepseek-v4-flash',
    'deepseek-v4-pro'
  ]);
});

test('catalog-backed templates clone existing models without sharing references', () => {
  const catalog = loadCatalog();
  const templates = loadTemplates(catalog);
  const source = catalog.find((model) => model.slug === 'gpt-5.6-sol');
  const copy = templates.createTemplate('gpt-5.6-sol', catalog);
  assert.deepEqual(copy, source);
  assert.notEqual(copy, source);
  assert.notEqual(copy.model_messages, source.model_messages);
});

test('Grok 4.6 defaults match xAI grok-build capabilities and stay conservative for Codex-specific flags', () => {
  const catalog = loadCatalog();
  const templates = loadTemplates(catalog);
  const grok = templates.createTemplate('grok-4.6', catalog);

  assert.equal(grok.slug, 'grok-4.6');
  assert.equal(grok.display_name, 'Grok 4.6');
  assert.equal(grok.context_window, 500000);
  assert.equal(grok.max_context_window, 500000);
  assert.equal(grok.default_reasoning_level, 'high');
  assert.deepEqual(grok.supported_reasoning_levels.map((row) => row.effort), ['low', 'medium', 'high', 'xhigh']);
  assert.deepEqual(grok.input_modalities, ['text', 'image']);
  assert.equal(grok.supports_search_tool, true);
  assert.equal(grok.web_search_tool_type, 'text');
  assert.equal(grok.use_responses_lite, false);
  assert.equal(grok.multi_agent_version, null);
  assert.equal(grok.tool_mode, null);
  assert.equal(grok.comp_hash, null);
  assert.equal(grok.supports_image_detail_original, false);
  assert.equal(grok.supports_reasoning_summary_parameter, true);
  assert.equal(grok.support_verbosity, true);
  assert.equal(grok.default_verbosity, 'medium');
});

test('Grok 4.6 built-in catalog entry is normalized to the same defaults', () => {
  const catalog = loadCatalog();
  const templates = loadTemplates(catalog);
  const grok = catalog.find((model) => model.slug === 'grok-4.6');
  const expected = templates.createTemplate('grok-4.6', catalog);

  for (const key of [
    'context_window',
    'max_context_window',
    'default_reasoning_level',
    'supported_reasoning_levels',
    'input_modalities',
    'supports_search_tool',
    'web_search_tool_type',
    'use_responses_lite',
    'multi_agent_version',
    'tool_mode',
    'comp_hash'
  ]) {
    assert.deepEqual(grok[key], expected[key], `expected normalized Grok field ${key}`);
  }
});

test('blank and OpenAI-compatible templates produce schema-valid editable starting points', () => {
  const catalog = loadCatalog();
  const templates = loadTemplates(catalog);
  const { validateCatalog } = require(path.resolve(__dirname, '..', 'model-schema.js'));

  for (const id of ['blank', 'openai-compatible', 'grok-4.6']) {
    const model = templates.createTemplate(id, catalog);
    model.priority = 9999;
    assert.deepEqual(validateCatalog([model]).errors, [], `${id} should be schema-valid`);
  }
});

test('page loads the template module and exposes a template selector near new model creation', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.resolve(__dirname, '..', 'app.js'), 'utf8');
  assert.match(html, /src="model-templates\.js"/);
  assert.match(html, /id="modelTemplateSelect"/);
  assert.match(app, /CC_MODEL_TEMPLATES/);
  assert.match(app, /modelTemplateSelect/);
});
