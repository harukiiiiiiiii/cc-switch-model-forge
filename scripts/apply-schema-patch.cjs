const fs = require('node:fs');
const vm = require('node:vm');

function replaceOnce(source, before, after, label) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`patch target not found: ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`patch target is ambiguous: ${label}`);
  return source.slice(0, first) + after + source.slice(first + before.length);
}

function replaceRegexOnce(source, regex, after, label) {
  const matches = [...source.matchAll(new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g'))];
  if (matches.length !== 1) throw new Error(`expected one regex target for ${label}, found ${matches.length}`);
  return source.replace(regex, after);
}

let app = fs.readFileSync('app.js', 'utf8');

app = replaceOnce(
  app,
  '  const REASONING_LEVELS = ["low", "medium", "high", "xhigh", "max", "ultra"];',
  '  const SCHEMA = window.CC_MODEL_SCHEMA;\n  if (!SCHEMA) throw new Error("model-schema.js 未加载");\n  const REASONING_LEVELS = SCHEMA.ENUMS.reasoningEffort;',
  'schema bootstrap'
);

const replacements = [
  ['{ key: "display_name", label: "显示名称", type: "text", module: "identity" }', '{ key: "display_name", label: "显示名称", type: "text", module: "identity", required: true }', 'display_name required'],
  ['{ key: "visibility", label: "可见性", type: "select", module: "identity", options: ["list", "hide"] }', '{ key: "visibility", label: "可见性", type: "select", module: "identity", options: SCHEMA.ENUMS.visibility, required: true }', 'visibility enum'],
  ['{ key: "priority", label: "优先级", type: "number", module: "identity" }', '{ key: "priority", label: "优先级", type: "number", module: "identity", required: true }', 'priority required'],
  ['{ key: "supported_in_api", label: "支持 API 调用", type: "triBool", module: "identity" }', '{ key: "supported_in_api", label: "支持 API 调用", type: "triBool", module: "identity", required: true }', 'supported_in_api required'],
  ['{ key: "shell_type", label: "执行模式", type: "select", module: "identity", options: ["shell_command"] }', '{ key: "shell_type", label: "执行模式", type: "select", module: "identity", options: SCHEMA.ENUMS.shellType, required: true }', 'shell enum'],
  ['{ key: "supported_reasoning_levels", label: "支持的推理等级", type: "reasoningList", module: "reasoning" }', '{ key: "supported_reasoning_levels", label: "支持的推理等级", type: "reasoningList", module: "reasoning", required: true }', 'reasoning list required'],
  ['{ key: "default_reasoning_summary", label: "默认推理摘要", type: "enumInput", module: "reasoning", options: ["none", "auto"], nullable: true }', '{ key: "default_reasoning_summary", label: "默认推理摘要", type: "enumInput", module: "reasoning", options: SCHEMA.ENUMS.reasoningSummary, nullable: true }', 'reasoning summary enum'],
  ['{ key: "support_verbosity", label: "支持详细度", type: "triBool", module: "reasoning" }', '{ key: "support_verbosity", label: "支持详细度", type: "triBool", module: "reasoning", required: true }', 'support verbosity required'],
  ['{ key: "default_verbosity", label: "默认详细度", type: "enumInput", module: "reasoning", options: ["low", "medium"], nullable: true }', '{ key: "default_verbosity", label: "默认详细度", type: "enumInput", module: "reasoning", options: SCHEMA.ENUMS.verbosity, nullable: true }', 'verbosity enum'],
  ['{ key: "supports_reasoning_summaries", label: "支持推理摘要", type: "triBool", module: "reasoning" }', '{ key: "supports_reasoning_summaries", label: "上游元数据：支持推理摘要", type: "triBool", module: "reasoning" },\n    { key: "supports_reasoning_summary_parameter", label: "允许 reasoning.summary 参数", type: "triBool", module: "reasoning" }', 'reasoning summary parameter'],
  ['{ key: "supports_parallel_tool_calls", label: "并行工具调用", type: "triBool", module: "reasoning" }', '{ key: "supports_parallel_tool_calls", label: "Legacy：并行工具调用", type: "triBool", module: "reasoning" }', 'legacy parallel label'],
  ['{ key: "tool_mode", label: "工具模式", type: "enumInput", module: "reasoning", options: ["code_mode_only"], nullable: true }', '{ key: "tool_mode", label: "工具模式", type: "enumInput", module: "reasoning", options: SCHEMA.ENUMS.toolMode, nullable: true }', 'tool mode enum'],
  ['{ key: "multi_agent_version", label: "多智能体版本", type: "enumInput", module: "reasoning", options: ["v1", "v2"], nullable: true }', '{ key: "multi_agent_version", label: "多智能体版本", type: "enumInput", module: "reasoning", options: SCHEMA.ENUMS.multiAgentVersion, nullable: true }', 'multi-agent enum'],
  ['{ key: "truncation_policy", label: "截断策略", type: "truncation", module: "runtime" }', '{ key: "truncation_policy", label: "截断策略", type: "truncation", module: "runtime", required: true }', 'truncation required'],
  ['{ key: "prefer_websockets", label: "偏好 WebSocket", type: "triBool", module: "runtime" }', '{ key: "prefer_websockets", label: "上游元数据：偏好 WebSocket", type: "triBool", module: "runtime" }', 'upstream websocket label'],
  ['{ key: "minimal_client_version", label: "最低客户端版本", type: "text", module: "runtime" }', '{ key: "minimal_client_version", label: "上游元数据：最低客户端版本", type: "text", module: "runtime" }', 'upstream client version label'],
  ['{ key: "comp_hash", label: "编译哈希", type: "text", module: "runtime" }', '{ key: "comp_hash", label: "压缩兼容配置标识", type: "text", module: "runtime", nullable: true },\n    { key: "node_repl_auto_review_required", label: "Node REPL 需要自动审批", type: "triBool", module: "runtime" },\n    { key: "node_repl_disabled", label: "禁用 Node REPL", type: "triBool", module: "runtime" },\n    { key: "model_specialty", label: "模型专长", type: "text", module: "runtime", nullable: true }', 'new runtime fields'],
  ['{ key: "model_messages.permissions", label: "权限配置", type: "permissions", module: "messages", parent: "model_messages" }', '{ key: "model_messages.permissions", label: "权限配置", type: "permissions", module: "messages", parent: "model_messages" },\n    { key: "model_messages.multi_agent", label: "多智能体消息", type: "jsonObj", module: "messages", parent: "model_messages" },\n    { key: "model_messages.token_budget", label: "Token 预算", type: "jsonObj", module: "messages", parent: "model_messages" },\n    { key: "model_messages.guardian_v2", label: "Guardian v2", type: "jsonObj", module: "messages", parent: "model_messages" }', 'new model message fields'],
  ['"service_tiers", "default_reasoning_level", "default_reasoning_summary", "support_verbosity",\n    "default_verbosity", "supports_reasoning_summaries", "reasoning_summary_format", "supports_search_tool",', '"service_tiers", "default_reasoning_level", "default_reasoning_summary", "support_verbosity",\n    "default_verbosity", "supports_reasoning_summaries", "supports_reasoning_summary_parameter", "reasoning_summary_format", "supports_search_tool",', 'bulk reasoning field'],
  ['"visibility", "supported_in_api", "use_responses_lite", "prefer_websockets",', '"visibility", "supported_in_api", "use_responses_lite", "prefer_websockets", "node_repl_auto_review_required", "node_repl_disabled",', 'bulk runtime bool fields'],
  ['      case "number": case "nullableNumber": return 0;', '      case "number": return 0;\n      case "nullableNumber": return null;', 'nullable number default'],
  ['  function defaultModelMessages() {\n    return {\n      instructions_template: "",\n      instructions_variables: { personality_default: "", personality_friendly: "", personality_pragmatic: "" },\n      approvals: null,\n      collaboration_modes: null,\n      auto_review: null,\n      permissions: null\n    };\n  }', '  function defaultModelMessages() {\n    return SCHEMA.defaultModelMessages();\n  }', 'default model messages'],
  ['      supports_parallel_tool_calls: true,\n      supports_image_detail_original: true,', '      supports_parallel_tool_calls: true,\n      supports_reasoning_summary_parameter: true,\n      supports_image_detail_original: true,', 'new model reasoning summary'],
  ['      use_responses_lite: false,\n      base_instructions:', '      use_responses_lite: false,\n      node_repl_auto_review_required: false,\n      node_repl_disabled: false,\n      model_specialty: null,\n      base_instructions:', 'new model runtime defaults']
];
for (const [before, after, label] of replacements) app = replaceOnce(app, before, after, label);

app = replaceRegexOnce(
  app,
  /  function validateCatalog\(models\) \{[\s\S]*?\n  \}\n\n  function renderValidation/,
  '  function validateCatalog(models) {\n    return SCHEMA.validateCatalog(models);\n  }\n\n  function renderValidation',
  'validator delegation'
);

app = replaceOnce(
  app,
  '    if (field.type === "triBool") return [true, false, null];',
  '    if (field.type === "triBool") return field.required ? [true, false] : [true, false, null];',
  'bulk boolean choices'
);

app = replaceOnce(
  app,
  '    const same = hasPath(model, bulkFieldKey) && JSON.stringify(getPath(model, bulkFieldKey)) === JSON.stringify(bulkValue);',
  '    const same = bulkValue === null ? !hasPath(model, bulkFieldKey) : hasPath(model, bulkFieldKey) && JSON.stringify(getPath(model, bulkFieldKey)) === JSON.stringify(bulkValue);',
  'bulk unset comparison'
);

app = replaceOnce(
  app,
  '    indexes.forEach((index) => setPath(next[index], bulkFieldKey, deepClone(bulkValue)));',
  '    indexes.forEach((index) => bulkValue === null ? delPath(next[index], bulkFieldKey) : setPath(next[index], bulkFieldKey, deepClone(bulkValue)));',
  'bulk dry run unset'
);
app = replaceOnce(
  app,
  '      indexes.forEach((index) => setPath(catalog[index], bulkFieldKey, deepClone(bulkValue)));',
  '      indexes.forEach((index) => bulkValue === null ? delPath(catalog[index], bulkFieldKey) : setPath(catalog[index], bulkFieldKey, deepClone(bulkValue)));',
  'bulk apply unset'
);

app = replaceRegexOnce(
  app,
  /  function renderTriBool\(key, val, label\) \{[\s\S]*?\n  \}\n\n  function renderChips/,
  `  function renderTriBool(key, val, label) {
    const field = fieldDef(key);
    const hasUnset = !field?.required;
    const cur = val === true || val === "true" ? "true" : val === false || val === "false" ? "false" : "null";
    const opts = [
      ["true", "启用", "on"],
      ["false", "关闭", "off"],
      ...(hasUnset ? [["null", "使用默认值", "nul"]] : [])
    ];
    return \`<div class="tri-select" role="group" aria-label="\${esc(label)}">\${opts
      .map(
        ([v, optionLabel, cls]) =>
          \`<button class="tri-option \${cls} \${cur === v ? "active" : ""}" data-action="tri" data-path="\${esc(key)}" data-val="\${v}" aria-pressed="\${cur === v}">\${optionLabel}</button>\`
      )
      .join("")}</div>\`;
  }

  function renderChips`,
  'tri bool rendering'
);

app = replaceOnce(
  app,
  '        ${showNested("permissions") ? renderPermissions(mm.permissions) : ""}\n      </div>',
  '        ${showNested("permissions") ? renderPermissions(mm.permissions) : ""}\n        ${showNested("multi_agent") ? renderJsonField("model_messages.multi_agent", "multi_agent · 多智能体消息", mm.multi_agent) : ""}\n        ${showNested("token_budget") ? renderJsonField("model_messages.token_budget", "token_budget · Token 预算", mm.token_budget) : ""}\n        ${showNested("guardian_v2") ? renderJsonField("model_messages.guardian_v2", "guardian_v2 · Guardian v2", mm.guardian_v2) : ""}\n      </div>',
  'model message renderers'
);

app = replaceOnce(
  app,
  '      case "tri":\n        mutate(() => {\n          const v = el.dataset.val;\n          setPath(model, path, v === "null" ? null : v === "true");\n        });',
  '      case "tri":\n        mutate(() => {\n          const v = el.dataset.val;\n          if (v === "null") delPath(model, path);\n          else setPath(model, path, v === "true");\n        });',
  'tri bool unset behavior'
);

app = replaceOnce(
  app,
  '  function renderSidebar() {',
  '  function visibilityLabel(value) {\n    if (value === "list") return "列表";\n    if (value === "hide") return "隐藏";\n    if (value === "none") return "不展示";\n    return value || "未知";\n  }\n\n  function visibilityClass(value) {\n    return value === "list" ? "on" : "off";\n  }\n\n  function nextVisibility(value) {\n    if (value === "list") return "hide";\n    if (value === "hide") return "none";\n    return "list";\n  }\n\n  function renderSidebar() {',
  'visibility helpers'
);

app = replaceOnce(
  app,
  '<button class="vis-toggle card-visibility ${m.visibility === "hide" ? "off" : "on"}" data-action="toggle-visibility" data-model-index="${modelIndex}" aria-pressed="${m.visibility !== "hide"}" title="点击切换可见/隐藏">\n            <span class="vis-dot"></span>${m.visibility === "hide" ? "隐藏" : "可见"}\n          </button>',
  '<button class="vis-toggle card-visibility ${visibilityClass(m.visibility)}" data-action="toggle-visibility" data-model-index="${modelIndex}" aria-label="当前可见性 ${visibilityLabel(m.visibility)}，点击切换" title="点击循环 list / hide / none">\n            <span class="vis-dot"></span>${visibilityLabel(m.visibility)}\n          </button>',
  'sidebar visibility'
);

app = replaceOnce(
  app,
  '    const visible = catalog.filter((m) => m.visibility !== "hide").length;\n    const hidden = catalog.length - visible;',
  '    const visible = catalog.filter((m) => m.visibility === "list").length;\n    const hidden = catalog.length - visible;',
  'visibility stats count'
);
app = replaceOnce(app, '<span class="stat-chip"><b class="hot">${hidden}</b> 隐藏</span>', '<span class="stat-chip"><b class="hot">${hidden}</b> 非列表</span>', 'visibility stats label');

app = replaceOnce(
  app,
  '<button class="vis-toggle ${model.visibility === "hide" ? "off" : "on"}" data-action="toggle-visibility" data-model-index="${selectedIndex}" aria-pressed="${model.visibility !== "hide"}" title="点击切换可见/隐藏">\n                <span class="vis-dot"></span>${model.visibility === "hide" ? "隐藏" : "可见"}\n              </button>',
  '<button class="vis-toggle ${visibilityClass(model.visibility)}" data-action="toggle-visibility" data-model-index="${selectedIndex}" aria-label="当前可见性 ${visibilityLabel(model.visibility)}，点击切换" title="点击循环 list / hide / none">\n                <span class="vis-dot"></span>${visibilityLabel(model.visibility)}\n              </button>',
  'hero visibility'
);

app = replaceOnce(
  app,
  '<td><span class="badge${m.visibility === "hide" ? " hide" : ""}">${m.visibility === "hide" ? "隐藏" : "可见"}</span></td>',
  '<td><span class="badge${m.visibility === "list" ? "" : " hide"}">${visibilityLabel(m.visibility)}</span></td>',
  'overview visibility'
);

app = replaceOnce(
  app,
  '      mutate(() => {\n        target.visibility = target.visibility === "hide" ? "list" : "hide";\n      });\n      toast(target.visibility === "hide" ? "已隐藏 " + target.slug : "已设为可见 " + target.slug, "ok");',
  '      mutate(() => {\n        target.visibility = nextVisibility(target.visibility);\n      });\n      toast(`可见性已设为 ${target.visibility}：${target.slug}`, "ok");',
  'visibility toggle cycle'
);

fs.writeFileSync('app.js', app);

const catalogSource = fs.readFileSync('catalog-data.js', 'utf8');
const context = { window: {} };
vm.runInNewContext(catalogSource, context);
if (!context.window.CC_CATALOG || !Array.isArray(context.window.CC_CATALOG.models)) throw new Error('invalid catalog-data.js');
const sol = context.window.CC_CATALOG.models.find((model) => model.slug === 'gpt-5.6-sol');
if (!sol) throw new Error('gpt-5.6-sol not found');
sol.context_window = 272000;
sol.max_context_window = 872000;
fs.writeFileSync('catalog-data.js', `window.CC_CATALOG = ${JSON.stringify(context.window.CC_CATALOG, null, 2)};\n`);
