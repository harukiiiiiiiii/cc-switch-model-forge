const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadSchema() {
  const modulePath = path.resolve(__dirname, '..', 'model-schema.js');
  delete require.cache[modulePath];
  return require(modulePath);
}

function validModel(overrides = {}) {
  return {
    slug: 'test-model',
    display_name: 'Test Model',
    description: 'test',
    supported_reasoning_levels: [
      { effort: 'medium', description: 'Balanced reasoning' }
    ],
    default_reasoning_level: 'medium',
    shell_type: 'shell_command',
    visibility: 'list',
    supported_in_api: true,
    priority: 1,
    additional_speed_tiers: [],
    service_tiers: [],
    model_messages: {
      instructions_template: 'You are Codex.',
      instructions_variables: null,
      approvals: null,
      collaboration_modes: null,
      auto_review: null,
      permissions: null,
      multi_agent: null,
      token_budget: null,
      guardian_v2: null
    },
    include_skills_usage_instructions: false,
    include_plugin_usage_instructions: false,
    include_apps_usage_instructions: true,
    supports_reasoning_summary_parameter: true,
    default_reasoning_summary: 'auto',
    support_verbosity: true,
    default_verbosity: 'medium',
    apply_patch_tool_type: 'freeform',
    web_search_tool_type: 'text',
    truncation_policy: { mode: 'tokens', limit: 10000 },
    supports_image_detail_original: false,
    context_window: 272000,
    max_context_window: 272000,
    auto_compact_token_limit: null,
    comp_hash: null,
    effective_context_window_percent: 95,
    experimental_supported_tools: [],
    input_modalities: ['text', 'image'],
    supports_search_tool: false,
    use_responses_lite: false,
    node_repl_auto_review_required: false,
    node_repl_disabled: false,
    auto_review_model_override: null,
    model_specialty: null,
    tool_mode: null,
    multi_agent_version: null,
    ...overrides
  };
}

test('schema exposes current Codex enum values', () => {
  const { ENUMS } = loadSchema();
  assert.deepEqual(ENUMS.reasoningEffort, ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra']);
  assert.deepEqual(ENUMS.visibility, ['list', 'hide', 'none']);
  assert.deepEqual(ENUMS.shellType, ['default', 'local', 'unified_exec', 'disabled', 'shell_command']);
  assert.deepEqual(ENUMS.reasoningSummary, ['auto', 'concise', 'detailed', 'none']);
  assert.deepEqual(ENUMS.verbosity, ['low', 'medium', 'high']);
  assert.deepEqual(ENUMS.toolMode, ['direct', 'code_mode', 'code_mode_only']);
  assert.deepEqual(ENUMS.multiAgentVersion, ['disabled', 'v1', 'v2']);
  assert.deepEqual(ENUMS.inputModality, ['text', 'image', 'audio']);
  assert.deepEqual(ENUMS.truncationMode, ['bytes', 'tokens']);
});

test('valid ModelInfo-shaped catalog passes validation', () => {
  const { validateCatalog } = loadSchema();
  const result = validateCatalog([validModel()]);
  assert.deepEqual(result.errors, []);
});

test('required ModelInfo fields cannot be omitted', () => {
  const { validateCatalog } = loadSchema();
  const model = validModel();
  for (const key of ['display_name', 'supported_reasoning_levels', 'shell_type', 'visibility', 'supported_in_api', 'priority', 'support_verbosity', 'truncation_policy', 'experimental_supported_tools']) {
    delete model[key];
  }
  const paths = new Set(validateCatalog([model]).errors.map((issue) => issue.path));
  for (const key of ['display_name', 'supported_reasoning_levels', 'shell_type', 'visibility', 'supported_in_api', 'priority', 'support_verbosity', 'truncation_policy', 'experimental_supported_tools']) {
    assert.ok(paths.has(key), `expected required-field error for ${key}`);
  }
});

test('plain bool fields reject explicit null while defaultable bools may be omitted', () => {
  const { validateCatalog } = loadSchema();
  const requiredNull = validateCatalog([validModel({ supported_in_api: null })]);
  assert.ok(requiredNull.errors.some((issue) => issue.path === 'supported_in_api'));

  const defaultableNull = validateCatalog([validModel({ supports_search_tool: null })]);
  assert.ok(defaultableNull.errors.some((issue) => issue.path === 'supports_search_tool'));

  const omitted = validModel();
  delete omitted.supports_search_tool;
  assert.ok(!validateCatalog([omitted]).errors.some((issue) => issue.path === 'supports_search_tool'));
});

test('catalog requires an instruction template from canonical or legacy field', () => {
  const { validateCatalog } = loadSchema();
  const model = validModel({ model_messages: null });
  delete model.base_instructions;
  const result = validateCatalog([model]);
  assert.ok(result.errors.some((issue) => issue.path === 'model_messages.instructions_template'));

  model.base_instructions = 'Legacy instructions';
  assert.ok(!validateCatalog([model]).errors.some((issue) => issue.path === 'model_messages.instructions_template'));
});

test('nested ModelInfo structures are validated strictly', () => {
  const { validateCatalog } = loadSchema();
  const model = validModel({
    supported_reasoning_levels: [{ effort: 'medium' }],
    service_tiers: [{ id: 'priority', name: '', description: 1 }],
    truncation_policy: { mode: 'banana', limit: -1 },
    input_modalities: ['text', 'video'],
    model_messages: {
      instructions_template: 'You are Codex.',
      instructions_variables: { personality_default: 1 },
      multi_agent: { role: { root: 3 } },
      token_budget: { reminder_threshold_tokens: '100' },
      guardian_v2: { review_threshold_basis_points: 10001 }
    }
  });
  const result = validateCatalog([model]);
  const paths = new Set(result.errors.map((issue) => issue.path));
  assert.ok(paths.has('supported_reasoning_levels'));
  assert.ok(paths.has('service_tiers'));
  assert.ok(paths.has('truncation_policy'));
  assert.ok(paths.has('input_modalities'));
  assert.ok(paths.has('model_messages.instructions_variables'));
  assert.ok(paths.has('model_messages.multi_agent'));
  assert.ok(paths.has('model_messages.token_budget'));
  assert.ok(paths.has('model_messages.guardian_v2'));
});

test('nullable numeric fields default to null instead of zero', () => {
  const { defaultFieldValue } = loadSchema();
  assert.equal(defaultFieldValue('auto_compact_token_limit', 'nullableNumber'), null);
});

test('embedded GPT-5.6 Sol baseline uses current override ceiling', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '..', 'catalog-data.js'), 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context);
  const sol = context.window.CC_CATALOG.models.find((model) => model.slug === 'gpt-5.6-sol');
  assert.ok(sol, 'gpt-5.6-sol must exist in embedded catalog');
  assert.equal(sol.context_window, 272000);
  assert.equal(sol.max_context_window, 872000);
});
