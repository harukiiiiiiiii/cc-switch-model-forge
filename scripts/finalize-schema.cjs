const fs = require('node:fs');

function replaceOnce(source, before, after, label) {
  const index = source.indexOf(before);
  if (index < 0) throw new Error(`target not found: ${label}`);
  if (source.indexOf(before, index + before.length) >= 0) throw new Error(`target ambiguous: ${label}`);
  return source.slice(0, index) + after + source.slice(index + before.length);
}

let schema = fs.readFileSync('model-schema.js', 'utf8');
schema = replaceOnce(
  schema,
  '      if (model.default_reasoning_summary !== undefined && model.default_reasoning_summary !== null && !ENUMS.reasoningSummary.includes(model.default_reasoning_summary)) {',
  '      if (model.default_reasoning_summary !== undefined && !ENUMS.reasoningSummary.includes(model.default_reasoning_summary)) {',
  'default_reasoning_summary null semantics'
);

schema = replaceOnce(
  schema,
  '      if (model.service_tiers !== undefined) {',
  `      if (model.default_service_tier !== undefined && model.default_service_tier !== null && typeof model.default_service_tier !== "string") {
        add("error", index, "default_service_tier", "default_service_tier 必须是字符串或 null");
      }

      if (model.availability_nux !== undefined && model.availability_nux !== null) {
        if (!isPlainObject(model.availability_nux) || typeof model.availability_nux.message !== "string") {
          add("error", index, "availability_nux", "availability_nux 必须是包含字符串 message 的对象或 null");
        }
      }

      if (model.upgrade !== undefined && model.upgrade !== null) {
        if (!isPlainObject(model.upgrade) || typeof model.upgrade.model !== "string" || typeof model.upgrade.migration_markdown !== "string") {
          add("error", index, "upgrade", "upgrade 必须包含字符串 model 和 migration_markdown");
        } else if (model.upgrade.retirement_at !== undefined && model.upgrade.retirement_at !== null && typeof model.upgrade.retirement_at !== "string") {
          add("error", index, "upgrade", "upgrade.retirement_at 必须是 RFC3339 字符串或 null");
        }
      }

      if (model.service_tiers !== undefined) {`,
  'nested ModelInfo validation'
);
fs.writeFileSync('model-schema.js', schema);

let app = fs.readFileSync('app.js', 'utf8');
app = replaceOnce(
  app,
  '{ key: "default_reasoning_summary", label: "默认推理摘要", type: "enumInput", module: "reasoning", options: SCHEMA.ENUMS.reasoningSummary, nullable: true }',
  '{ key: "default_reasoning_summary", label: "默认推理摘要", type: "enumInput", module: "reasoning", options: SCHEMA.ENUMS.reasoningSummary }',
  'default reasoning summary field'
);
app = replaceOnce(
  app,
  '{ key: "web_search_tool_type", label: "搜索工具类型", type: "enumInput", module: "reasoning", options: ["text", "text_and_image"], nullable: true }',
  '{ key: "web_search_tool_type", label: "搜索工具类型", type: "enumInput", module: "reasoning", options: SCHEMA.ENUMS.webSearchToolType }',
  'web search tool field'
);
app = replaceOnce(
  app,
  '{ key: "max_context_window", label: "最大上下文窗口", type: "number", module: "runtime" }',
  '{ key: "max_context_window", label: "允许覆盖的最大上下文窗口", type: "number", module: "runtime" }',
  'max context label'
);
app = replaceOnce(
  app,
  '{ key: "base_instructions", label: "基础指令", type: "textarea", module: "messages", rows: 8 }',
  '{ key: "base_instructions", label: "Legacy 基础指令", type: "textarea", module: "messages", rows: 8 }',
  'legacy instructions label'
);
app = replaceOnce(
  app,
  '{ key: "additional_speed_tiers", label: "附加速度档", type: "chipList", module: "reasoning" }',
  '{ key: "additional_speed_tiers", label: "Deprecated：附加速度档", type: "chipList", module: "reasoning" }',
  'deprecated speed tiers label'
);
fs.writeFileSync('app.js', app);
