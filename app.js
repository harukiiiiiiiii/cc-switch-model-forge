(() => {
  "use strict";

  /* ---------------------------------------------------------------- */
  /* Constants                                                        */
  /* ---------------------------------------------------------------- */

  const STORAGE_KEY = "cc-switch-catalog-ui:v1";
  const BASELINE_KEY = "cc-switch-catalog-ui:baseline:v1";
  const MODEL_REFS_KEY = "cc-switch-catalog-ui:model-refs:v1";
  const REASONING_LEVELS = ["low", "medium", "high", "xhigh", "max", "ultra"];

  const FIELDS = [
    { key: "slug", label: "标识 slug", type: "text", module: "identity", required: true },
    { key: "display_name", label: "显示名称", type: "text", module: "identity" },
    { key: "description", label: "描述", type: "textarea", module: "identity", rows: 3 },
    { key: "visibility", label: "可见性", type: "select", module: "identity", options: ["list", "hide"] },
    { key: "priority", label: "优先级", type: "number", module: "identity" },
    { key: "supported_in_api", label: "支持 API 调用", type: "triBool", module: "identity" },
    { key: "shell_type", label: "执行模式", type: "select", module: "identity", options: ["shell_command"] },
    { key: "availability_nux", label: "新用户引导", type: "nullableObject", module: "identity",
      children: [{ key: "message", label: "引导文案", type: "textarea", rows: 3 }] },
    { key: "upgrade", label: "升级迁移", type: "nullableObject", module: "identity",
      children: [
        { key: "model", label: "目标模型", type: "text" },
        { key: "migration_markdown", label: "迁移说明", type: "textarea", rows: 5 }
      ] },

    { key: "supported_reasoning_levels", label: "支持的推理等级", type: "reasoningList", module: "reasoning" },
    { key: "default_reasoning_level", label: "默认推理等级", type: "enumInput", module: "reasoning", options: REASONING_LEVELS },
    { key: "default_reasoning_summary", label: "默认推理摘要", type: "enumInput", module: "reasoning", options: ["none", "auto"], nullable: true },
    { key: "support_verbosity", label: "支持详细度", type: "triBool", module: "reasoning" },
    { key: "default_verbosity", label: "默认详细度", type: "enumInput", module: "reasoning", options: ["low", "medium"], nullable: true },
    { key: "supports_reasoning_summaries", label: "支持推理摘要", type: "triBool", module: "reasoning" },
    { key: "reasoning_summary_format", label: "摘要格式", type: "enumInput", module: "reasoning", options: ["experimental"], nullable: true },
    { key: "additional_speed_tiers", label: "附加速度档", type: "chipList", module: "reasoning" },
    { key: "service_tiers", label: "服务层级", type: "serviceList", module: "reasoning" },
    { key: "default_service_tier", label: "默认服务层级", type: "text", module: "reasoning", nullable: true },
    { key: "supports_search_tool", label: "支持联网搜索", type: "triBool", module: "reasoning" },
    { key: "web_search_tool_type", label: "搜索工具类型", type: "enumInput", module: "reasoning", options: ["text", "text_and_image"], nullable: true },
    { key: "supports_parallel_tool_calls", label: "并行工具调用", type: "triBool", module: "reasoning" },
    { key: "supports_image_detail_original", label: "支持原图细节", type: "triBool", module: "reasoning" },
    { key: "input_modalities", label: "输入模态", type: "modalityList", module: "reasoning" },
    { key: "experimental_supported_tools", label: "实验性工具", type: "chipList", module: "reasoning" },
    { key: "tool_mode", label: "工具模式", type: "enumInput", module: "reasoning", options: ["code_mode_only"], nullable: true },
    { key: "multi_agent_version", label: "多智能体版本", type: "enumInput", module: "reasoning", options: ["v1", "v2"], nullable: true },

    { key: "context_window", label: "上下文窗口", type: "number", module: "runtime" },
    { key: "max_context_window", label: "最大上下文窗口", type: "number", module: "runtime" },
    { key: "effective_context_window_percent", label: "生效上下文比例 %", type: "number", module: "runtime" },
    { key: "truncation_policy", label: "截断策略", type: "truncation", module: "runtime" },
    { key: "use_responses_lite", label: "轻量响应模式", type: "triBool", module: "runtime" },
    { key: "prefer_websockets", label: "偏好 WebSocket", type: "triBool", module: "runtime" },
    { key: "minimal_client_version", label: "最低客户端版本", type: "text", module: "runtime" },
    { key: "auto_compact_token_limit", label: "自动压缩 Token 阈值", type: "nullableNumber", module: "runtime" },
    { key: "auto_review_model_override", label: "审批模型覆盖", type: "text", module: "runtime", nullable: true },
    { key: "comp_hash", label: "编译哈希", type: "text", module: "runtime" },

    { key: "include_skills_usage_instructions", label: "包含技能使用说明", type: "triBool", module: "messages" },
    { key: "include_plugin_usage_instructions", label: "包含插件使用说明", type: "triBool", module: "messages" },
    { key: "include_apps_usage_instructions", label: "包含应用使用说明", type: "triBool", module: "messages" },
    { key: "apply_patch_tool_type", label: "补丁工具类型", type: "enumInput", module: "messages", options: ["freeform"], nullable: true },
    { key: "base_instructions", label: "基础指令", type: "textarea", module: "messages", rows: 8 },
    { key: "model_messages", label: "模型消息", type: "modelMessages", module: "messages" },

    { key: "model_messages.instructions_template", label: "指令模板", type: "textarea", module: "messages", parent: "model_messages" },
    { key: "model_messages.instructions_variables", label: "指令变量", type: "varMap", module: "messages", parent: "model_messages" },
    { key: "model_messages.approvals", label: "审批策略", type: "approvals", module: "messages", parent: "model_messages" },
    { key: "model_messages.collaboration_modes", label: "协作模式", type: "jsonObj", module: "messages", parent: "model_messages" },
    { key: "model_messages.auto_review", label: "自动审批", type: "autoReview", module: "messages", parent: "model_messages" },
    { key: "model_messages.permissions", label: "权限配置", type: "permissions", module: "messages", parent: "model_messages" }
  ];

  const MODULES = [
    { id: "identity", no: "01", title: "基础信息", sub: "身份 · 可见性 · 优先级 · 引导与迁移" },
    { id: "reasoning", no: "02", title: "推理与能力", sub: "推理等级 · 服务层级 · 搜索与模态" },
    { id: "runtime", no: "03", title: "上下文与运行", sub: "上下文窗口 · 截断策略 · 客户端要求" },
    { id: "messages", no: "04", title: "指令与权限", sub: "指令模板 · 审批策略 · 权限配置" }
  ];

  const TYPE_LABELS = {
    text: "string", textarea: "string", select: "enum", enumInput: "enum", number: "int",
    nullableNumber: "int?", triBool: "bool?", chipList: "string[]", modalityList: "string[]",
    reasoningList: "obj[]", serviceList: "obj[]", truncation: "obj", nullableObject: "obj?",
    modelMessages: "obj?", varMap: "obj", approvals: "obj?", jsonObj: "json?", autoReview: "obj?", permissions: "obj?"
  };

  const APPROVAL_KEYS = ["never", "on_request", "on_request_auto_review", "unless_trusted"];
  const PERMISSION_KEYS = ["danger_full_access", "workspace_write", "read_only"];
  const BULK_FIELD_KEYS = [
    "multi_agent_version", "default_reasoning_level", "default_reasoning_summary", "support_verbosity",
    "default_verbosity", "supports_reasoning_summaries", "reasoning_summary_format", "supports_search_tool",
    "web_search_tool_type", "supports_parallel_tool_calls", "supports_image_detail_original", "tool_mode",
    "visibility", "supported_in_api", "use_responses_lite", "prefer_websockets",
    "include_skills_usage_instructions", "include_plugin_usage_instructions", "include_apps_usage_instructions",
    "apply_patch_tool_type", "context_window", "max_context_window", "effective_context_window_percent",
    "auto_compact_token_limit"
  ];

  /* ---------------------------------------------------------------- */
  /* State                                                            */
  /* ---------------------------------------------------------------- */

  let recoveredSavedIssueCount = 0;
  let discardedSavedCatalog = false;
  let catalog = load();
  let original = loadBaseline();
  let modelRefs = loadModelRefs(catalog, original);
  let selectedIndex = catalog.length ? 0 : -1;
  let searchQuery = "";
  let fieldSearchQuery = "";
  let onlyModifiedFields = false;
  let bulkFieldKey = "multi_agent_version";
  let bulkValue = "v1";
  let bulkIncludeMissing = true;
  let filter = "all";
  let activeTab = "editor";
  let showAllFields = true;
  let sortKey = "priority";
  let sortDir = 1;
  let toastTimer = null;
  let saveTimer = null;
  let lightTimer = null;
  let commitTimer = null;
  let history = [];
  let future = [];
  const jsonDrafts = new Map();
  let committedSnapshot = serializeState();

  /* ---------------------------------------------------------------- */
  /* Utilities                                                        */
  /* ---------------------------------------------------------------- */

  function deepClone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function loadModelRefs(models, baseline) {
    try {
      const raw = localStorage.getItem(MODEL_REFS_KEY);
      const refs = raw ? JSON.parse(raw) : null;
      if (Array.isArray(refs) && refs.length === models.length) {
        return refs.map((ref) => typeof ref === "string" && baseline.some((source) => source.slug === ref) ? ref : null);
      }
    } catch (_e) {
      /* Infer references for catalogs saved by older UI versions. */
    }
    return models.map((model) => {
      const exact = baseline.find((source) => source.slug === model.slug);
      if (exact) return exact.slug;
      const sameIdentity = baseline.find((source) => source.display_name === model.display_name && source.priority === model.priority);
      return sameIdentity ? sameIdentity.slug : null;
    });
  }

  function esc(s) {
    return String(s === undefined || s === null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cssEsc(s) {
    return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/["\\]/g, "\\$&");
  }

  function hasPath(obj, path) {
    let o = obj;
    for (const k of path.split(".")) {
      if (o === null || o === undefined || !(k in Object(o))) return false;
      o = o[k];
    }
    return true;
  }

  function getPath(obj, path) {
    return path.split(".").reduce((o, k) => (o === null || o === undefined ? undefined : o[k]), obj);
  }

  function setPath(obj, path, value) {
    const parts = path.split(".");
    const last = parts.pop();
    let o = obj;
    for (const k of parts) {
      if (o[k] === null || o[k] === undefined || typeof o[k] !== "object") o[k] = {};
      o = o[k];
    }
    o[last] = value;
  }

  function delPath(obj, path) {
    const parts = path.split(".");
    const last = parts.pop();
    let o = obj;
    for (const k of parts) {
      if (o === null || o === undefined) return;
      o = o[k];
    }
    delete o[last];
  }

  function getModel() {
    return selectedIndex >= 0 ? catalog[selectedIndex] || null : null;
  }

  function originalMap() {
    const map = new Map();
    original.forEach((m) => map.set(m.slug, m));
    return map;
  }

  function baselineForIndex(index) {
    const ref = modelRefs[index];
    return ref ? originalMap().get(ref) || null : null;
  }

  function isDirty(m, index = catalog.indexOf(m)) {
    const src = baselineForIndex(index);
    return !src || JSON.stringify(src) !== JSON.stringify(m);
  }

  function isFieldDirty(index, path) {
    const model = catalog[index];
    const source = baselineForIndex(index);
    if (!model) return false;
    if (!source) return hasPath(model, path);
    const present = hasPath(model, path);
    const sourcePresent = hasPath(source, path);
    if (present !== sourcePresent) return true;
    return present && JSON.stringify(getPath(model, path)) !== JSON.stringify(getPath(source, path));
  }

  function selectedIdentity() {
    const model = getModel();
    if (!model) return null;
    return {
      ref: modelRefs[selectedIndex] || null,
      slug: typeof model.slug === "string" ? model.slug : null,
      displayName: typeof model.display_name === "string" ? model.display_name : null,
      priority: model.priority,
      index: selectedIndex
    };
  }

  function serializeState() {
    return JSON.stringify({ models: catalog, refs: modelRefs, baseline: original });
  }

  function serializeHistoryState(dataSnapshot = serializeState()) {
    const state = JSON.parse(dataSnapshot);
    state.selected = selectedIdentity();
    return JSON.stringify(state);
  }

  function readState(snapshot) {
    const parsed = JSON.parse(snapshot);
    if (Array.isArray(parsed)) return { models: parsed, refs: parsed.map(() => null) };
    return {
      models: Array.isArray(parsed.models) ? parsed.models : [],
      refs: Array.isArray(parsed.refs) ? parsed.refs : [],
      baseline: Array.isArray(parsed.baseline) ? parsed.baseline : null,
      selected: parsed.selected && typeof parsed.selected === "object" ? parsed.selected : null
    };
  }

  function restoreSelectedIndex(selection) {
    if (!catalog.length) return -1;
    if (!selection) return Math.min(Math.max(0, selectedIndex), catalog.length - 1);
    if (selection.ref) {
      const byRef = modelRefs.indexOf(selection.ref);
      if (byRef >= 0) return byRef;
    }
    const byIdentity = catalog.findIndex((model) => model.display_name === selection.displayName && model.priority === selection.priority);
    if (byIdentity >= 0) return byIdentity;
    if (Number.isInteger(selection.index) && selection.index >= 0 && selection.index < catalog.length) return selection.index;
    if (selection.slug) {
      const bySlug = catalog.findIndex((model) => model.slug === selection.slug);
      if (bySlug >= 0) return bySlug;
    }
    return 0;
  }

  function jsonDraftMap(model, create = false) {
    if (!model) return null;
    if (!jsonDrafts.has(model) && create) jsonDrafts.set(model, new Map());
    return jsonDrafts.get(model) || null;
  }

  function setJsonDraft(model, path, raw) {
    jsonDraftMap(model, true).set(path, raw);
  }

  function clearJsonDraft(model, path) {
    const drafts = jsonDraftMap(model);
    if (!drafts) return;
    drafts.delete(path);
    if (!drafts.size) jsonDrafts.delete(model);
  }

  function clearJsonDraftTree(model, path) {
    const drafts = jsonDraftMap(model);
    if (!drafts) return;
    for (const draftPath of [...drafts.keys()]) {
      if (draftPath === path || draftPath.startsWith(path + ".")) drafts.delete(draftPath);
    }
    if (!drafts.size) jsonDrafts.delete(model);
  }

  function jsonEditorText(model, path, fallback) {
    const drafts = jsonDraftMap(model);
    return drafts && drafts.has(path) ? drafts.get(path) : fallback;
  }

  function hasJsonDraft(model, path) {
    return jsonDraftMap(model)?.has(path) === true;
  }

  function revealFirstJsonDraft() {
    for (let index = 0; index < catalog.length; index++) {
      const drafts = jsonDraftMap(catalog[index]);
      if (!drafts?.size) continue;
      const path = drafts.keys().next().value;
      selectedIndex = index;
      activeTab = "editor";
      showAllFields = true;
      onlyModifiedFields = false;
      fieldSearchQuery = "";
      renderAll();
      requestAnimationFrame(() => focusField(path));
      return true;
    }
    return false;
  }

  function familyOf(m) {
    const slug = typeof m.slug === "string" ? m.slug : "";
    if (slug.startsWith("gpt")) return "OpenAI GPT";
    if (slug.startsWith("grok")) return "xAI";
    if (slug.startsWith("deepseek")) return "DeepSeek";
    return "系统 / 其他";
  }

  function fmtInt(n) {
    const v = Number(n || 0);
    return v.toLocaleString("en-US");
  }

  function ctxBar(model) {
    const max = Math.max(1, model.max_context_window || model.context_window || 1);
    const cur = model.context_window || 0;
    return Math.min(100, Math.max(2, Math.round((cur / max) * 100)));
  }

  function dlId(key) {
    return "dl-" + key.replace(/[^a-z0-9_]/gi, "_");
  }

  function defaultFor(key, type) {
    switch (type) {
      case "text": return "";
      case "enumInput": return null;
      case "textarea": return "";
      case "number": case "nullableNumber": return 0;
      case "triBool": return true;
      case "chipList": case "modalityList": return [];
      case "reasoningList": return [{ effort: "medium", description: "" }];
      case "serviceList": return [{ id: "", name: "", description: "" }];
      case "truncation": return { mode: "tokens", limit: 10000 };
      case "nullableObject":
        if (key === "availability_nux") return { message: "" };
        if (key === "upgrade") return { model: "", migration_markdown: "" };
        return {};
      case "modelMessages": return defaultModelMessages();
      case "varMap": return { personality_default: "" };
      case "approvals": return { never: "", on_request: null, on_request_auto_review: null, unless_trusted: null };
      case "autoReview": return { policy: "", policy_template: "" };
      case "permissions": return { danger_full_access: "", workspace_write: "", read_only: "" };
      case "jsonObj": return null;
      default: return "";
    }
  }

  function defaultModelMessages() {
    return {
      instructions_template: "",
      instructions_variables: { personality_default: "", personality_friendly: "", personality_pragmatic: "" },
      approvals: null,
      collaboration_modes: null,
      auto_review: null,
      permissions: null
    };
  }

  function defaultNewModel() {
    let slug = "custom-model";
    let n = 2;
    while (catalog.some((m) => m.slug === slug)) {
      slug = "custom-model-" + n++;
    }
    const priority = Math.max(1000, ...catalog.map((m) => m.priority || 0)) + 1;
    return {
      slug,
      display_name: "自定义模型",
      description: "",
      default_reasoning_level: "medium",
      supported_reasoning_levels: [{ effort: "medium", description: "Balances speed and reasoning depth" }],
      shell_type: "shell_command",
      visibility: "list",
      supported_in_api: true,
      priority,
      additional_speed_tiers: [],
      service_tiers: [],
      availability_nux: null,
      upgrade: null,
      model_messages: defaultModelMessages(),
      include_skills_usage_instructions: true,
      include_plugin_usage_instructions: false,
      include_apps_usage_instructions: false,
      default_reasoning_summary: "none",
      support_verbosity: true,
      default_verbosity: "low",
      apply_patch_tool_type: "freeform",
      web_search_tool_type: "text_and_image",
      truncation_policy: { mode: "tokens", limit: 10000 },
      supports_parallel_tool_calls: true,
      supports_image_detail_original: true,
      context_window: 272000,
      max_context_window: 272000,
      effective_context_window_percent: 95,
      experimental_supported_tools: [],
      input_modalities: ["text", "image"],
      supports_search_tool: true,
      use_responses_lite: false,
      base_instructions: "You are Codex, a coding agent. You and the user share the same workspace and collaborate to achieve the user's goals."
    };
  }

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function validateCatalog(models) {
    const errors = [];
    const warnings = [];
    const seen = new Map();
    const duplicateSlugs = new Set();
    const priorities = new Set();
    const add = (severity, modelIndex, path, message) => {
      (severity === "error" ? errors : warnings).push({ modelIndex, path, message });
    };

    if (!Array.isArray(models)) {
      return { errors: [{ modelIndex: -1, path: "models", message: "models 必须是数组" }], warnings };
    }

    models.forEach((model, index) => {
      if (!isPlainObject(model)) {
        add("error", index, "", `第 ${index + 1} 项必须是对象`);
        return;
      }
      if (typeof model.slug !== "string" || !model.slug.trim()) {
        add("error", index, "slug", "slug 不能为空");
      } else {
        if (!/^[a-z0-9][a-z0-9._-]*$/i.test(model.slug)) add("error", index, "slug", "slug 只能包含字母、数字、点、下划线和连字符");
        if (seen.has(model.slug)) {
          const firstIndex = seen.get(model.slug);
          if (!duplicateSlugs.has(model.slug)) add("error", firstIndex, "slug", `slug 重复：${model.slug}`);
          add("error", index, "slug", `slug 重复：${model.slug}`);
          duplicateSlugs.add(model.slug);
        } else {
          seen.set(model.slug, index);
        }
      }

      for (const field of FIELDS.filter((f) => !f.parent)) {
        if (!hasPath(model, field.key)) continue;
        const value = getPath(model, field.key);
        const nullable = field.nullable || ["nullableNumber", "triBool", "nullableObject", "modelMessages"].includes(field.type);
        if (value === null && nullable) continue;
        let valid = true;
        if (["text", "textarea", "select", "enumInput"].includes(field.type)) valid = typeof value === "string";
        else if (["number", "nullableNumber"].includes(field.type)) valid = typeof value === "number" && Number.isFinite(value) && Number.isInteger(value);
        else if (field.type === "triBool") valid = typeof value === "boolean";
        else if (["chipList", "modalityList", "reasoningList", "serviceList"].includes(field.type)) valid = Array.isArray(value);
        else if (field.type === "truncation") valid = isPlainObject(value);
        else if (["nullableObject", "modelMessages"].includes(field.type)) valid = isPlainObject(value);
        if (!valid) add("error", index, field.key, `${field.label} 的类型应为 ${TYPE_LABELS[field.type] || field.type}`);
        if (field.type === "select" && typeof value === "string" && !field.options.includes(value)) {
          add("error", index, field.key, `${field.label} 的值无效：${value}`);
        }
        if (field.type === "enumInput" && typeof value === "string" && value && !field.options.includes(value)) {
          add("warning", index, field.key, `${field.label} 使用了目录未收录的新值：${value}`);
        }
      }

      if (typeof model.priority === "number") {
        if (priorities.has(model.priority)) add("warning", index, "priority", `优先级重复：${model.priority}`);
        priorities.add(model.priority);
      }
      for (const key of ["additional_speed_tiers", "input_modalities", "experimental_supported_tools"]) {
        if (Array.isArray(model[key]) && model[key].some((item) => typeof item !== "string" || !item.trim())) {
          add("error", index, key, `${key} 必须是非空字符串数组`);
        }
      }
      if (Array.isArray(model.supported_reasoning_levels)) {
        model.supported_reasoning_levels.forEach((row, rowIndex) => {
          if (!isPlainObject(row) || typeof row.effort !== "string" || !row.effort.trim()) {
            add("error", index, "supported_reasoning_levels", `第 ${rowIndex + 1} 个推理等级缺少 effort`);
          }
        });
      }
      if (Array.isArray(model.service_tiers)) {
        const ids = new Set();
        model.service_tiers.forEach((tier, tierIndex) => {
          if (!isPlainObject(tier) || typeof tier.id !== "string" || !tier.id.trim()) {
            add("error", index, "service_tiers", `第 ${tierIndex + 1} 个服务层级缺少 id`);
          } else if (ids.has(tier.id)) {
            add("error", index, "service_tiers", `服务层级 id 重复：${tier.id}`);
          } else {
            ids.add(tier.id);
          }
        });
      }
      if (isPlainObject(model.truncation_policy)) {
        if (typeof model.truncation_policy.mode !== "string" || !model.truncation_policy.mode) add("error", index, "truncation_policy", "截断策略缺少 mode");
        if (!Number.isInteger(model.truncation_policy.limit) || model.truncation_policy.limit < 0) add("error", index, "truncation_policy", "截断策略 limit 必须是非负整数");
      }
      if (isPlainObject(model.model_messages)) {
        if (model.model_messages.instructions_variables !== undefined && !isPlainObject(model.model_messages.instructions_variables)) {
          add("error", index, "model_messages.instructions_variables", "指令变量必须是对象");
        }
        for (const key of ["approvals", "collaboration_modes", "auto_review", "permissions"]) {
          const value = model.model_messages[key];
          if (value !== undefined && value !== null && !isPlainObject(value)) add("error", index, `model_messages.${key}`, `${key} 必须是对象或 null`);
        }
      }

      if (Array.isArray(model.supported_reasoning_levels)) {
        const efforts = model.supported_reasoning_levels.map((row) => row && row.effort).filter(Boolean);
        if (model.default_reasoning_level && !efforts.includes(model.default_reasoning_level)) {
          add("error", index, "default_reasoning_level", "默认推理等级不在支持列表中");
        }
      }
      if (typeof model.context_window === "number" && typeof model.max_context_window === "number" && model.context_window > model.max_context_window) {
        add("error", index, "context_window", "上下文窗口不能大于最大上下文窗口");
      }
      if (typeof model.effective_context_window_percent === "number" && (model.effective_context_window_percent < 0 || model.effective_context_window_percent > 100)) {
        add("error", index, "effective_context_window_percent", "生效上下文比例必须在 0 到 100 之间");
      }
      if (Array.isArray(model.service_tiers) && model.default_service_tier) {
        const tierIds = model.service_tiers.map((tier) => tier && tier.id);
        if (!tierIds.includes(model.default_service_tier)) add("warning", index, "default_service_tier", "默认服务层级不在服务层级列表中");
      }
      if (model.upgrade && model.upgrade.model && !models.some((candidate) => candidate && candidate.slug === model.upgrade.model)) {
        add("warning", index, "upgrade", `升级目标不存在：${model.upgrade.model}`);
      }
    });
    return { errors, warnings };
  }

  function renderValidation(result) {
    const panel = document.getElementById("validationPanel");
    if (!panel) return;
    applyValidationState(result);
    const issues = [...result.errors, ...result.warnings];
    if (!issues.length) {
      panel.hidden = true;
      panel.innerHTML = "";
      return;
    }
    panel.hidden = false;
    panel.className = `validation-panel ${result.errors.length ? "has-errors" : "has-warnings"}`;
    panel.innerHTML = `<div class="validation-title">${result.errors.length ? `配置有 ${result.errors.length} 个错误，导出已禁用` : "配置检查提示"}</div>
      <div class="validation-list">${issues.slice(0, 8).map((issue) => {
        const model = catalog[issue.modelIndex];
        return `<button data-action="jump-validation" data-model-index="${issue.modelIndex}" data-path="${esc(issue.path)}">
          <b>${issue.modelIndex >= 0 ? esc(model && (model.display_name || model.slug) || `模型 ${issue.modelIndex + 1}`) : "目录"}</b> · ${esc(issue.message)}
        </button>`;
      }).join("")}</div>`;
  }

  function applyValidationState(result) {
    const root = document.getElementById("editorRoot");
    if (!root) return;
    root.querySelectorAll(".validation-invalid").forEach((field) => field.classList.remove("validation-invalid"));
    root.querySelectorAll(".validation-error-text").forEach((message) => message.remove());
    root.querySelectorAll("[data-schema-invalid]").forEach((control) => {
      control.removeAttribute("data-schema-invalid");
      control.removeAttribute("aria-invalid");
      const describedBy = (control.getAttribute("aria-describedby") || "").split(/\s+/).filter((id) => id && !id.startsWith("validation-error-"));
      if (describedBy.length) control.setAttribute("aria-describedby", describedBy.join(" "));
      else control.removeAttribute("aria-describedby");
    });

    result.errors.filter((issue) => issue.modelIndex === selectedIndex && issue.path).forEach((issue, issueIndex) => {
      let candidate = issue.path;
      let field = null;
      while (candidate && !field) {
        field = root.querySelector(`[data-field-key="${cssEsc(candidate)}"]`);
        candidate = candidate.includes(".") ? candidate.slice(0, candidate.lastIndexOf(".")) : "";
      }
      if (!field) return;
      field.classList.add("validation-invalid");
      const messageId = `validation-error-${selectedIndex}-${issueIndex}`;
      const message = document.createElement("div");
      message.className = "validation-error-text";
      message.id = messageId;
      message.textContent = issue.message;
      field.appendChild(message);
      const control = field.querySelector("[data-bind], [data-bind-select], [data-list-bind], [data-var-bind], [data-chip-input], input, textarea, select");
      if (control) {
        control.setAttribute("aria-invalid", "true");
        control.setAttribute("data-schema-invalid", "true");
        const ids = new Set((control.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean));
        ids.add(messageId);
        control.setAttribute("aria-describedby", [...ids].join(" "));
      }
    });
  }

  function knownTopLevelKeys() {
    return new Set(FIELDS.filter((field) => !field.parent).map((field) => field.key));
  }

  function unknownEntries(model) {
    const known = knownTopLevelKeys();
    return Object.entries(model || {}).filter(([key]) => !known.has(key));
  }

  /* ---------------------------------------------------------------- */
  /* Persistence                                                      */
  /* ---------------------------------------------------------------- */

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.every(isPlainObject)) {
          recoveredSavedIssueCount = validateCatalog(arr).errors.length;
          return arr;
        }
        discardedSavedCatalog = true;
      }
    } catch (_e) {
      discardedSavedCatalog = true;
      /* fall through to embedded catalog */
    }
    return deepClone(window.CC_CATALOG ? window.CC_CATALOG.models : []);
  }

  function loadBaseline() {
    try {
      const raw = localStorage.getItem(BASELINE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && !validateCatalog(arr).errors.length) return arr;
      }
    } catch (_e) {
      /* fall through to embedded catalog */
    }
    return deepClone(window.CC_CATALOG ? window.CC_CATALOG.models : []);
  }

  function persist() {
    clearTimeout(saveTimer);
    setSaveStatus("saving");
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
        localStorage.setItem(MODEL_REFS_KEY, JSON.stringify(modelRefs));
        setSaveStatus("saved");
      } catch (_e) {
        setSaveStatus("error");
        toast("自动保存失败：浏览器本地存储不可用", "err");
      }
    }, 300);
  }

  function setSaveStatus(state) {
    const status = document.getElementById("saveStatus");
    if (!status) return;
    status.className = `save-status ${state}`;
    if (state === "saving") status.textContent = "保存中...";
    else if (state === "error") status.textContent = "保存失败";
    else status.textContent = `已保存 ${new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
  }

  function persistBaseline() {
    try {
      localStorage.setItem(BASELINE_KEY, JSON.stringify(original));
    } catch (_e) {
      toast("基线保存失败：刷新后将使用内置目录", "err");
    }
  }

  /* ---------------------------------------------------------------- */
  /* Rendering helpers                                                */
  /* ---------------------------------------------------------------- */

  function toast(msg, kind) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.className = "toast show " + (kind || "ok");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.className = "toast";
    }, 2600);
  }

  function fieldDef(key) {
    return FIELDS.find((f) => f.key === key);
  }

  function renderSidebar() {
    const list = document.getElementById("modelList");
    const q = searchQuery.trim().toLowerCase();
    const models = catalog.map((model, index) => ({ model, index })).filter(({ model: m }) => {
      if (filter !== "all" && m.visibility !== filter) return false;
      if (!q) return true;
      const slug = typeof m.slug === "string" ? m.slug : "";
      return (
        (m.display_name || "").toLowerCase().includes(q) ||
        slug.toLowerCase().includes(q) ||
        (m.description || "").toLowerCase().includes(q)
      );
    });
    const groups = {};
    models.forEach((entry) => {
      const f = familyOf(entry.model);
      (groups[f] = groups[f] || []).push(entry);
    });
    let html = "";
    let gi = 0;
    for (const [fam, arr] of Object.entries(groups)) {
      html += `<div class="family-label" style="animation-delay:${gi * 45}ms">${fam}</div>`;
      arr.forEach(({ model: m, index: modelIndex }, i) => {
        const slug = typeof m.slug === "string" ? m.slug : "";
        const active = modelIndex === selectedIndex ? " active" : "";
        const dirty = isDirty(m, modelIndex) ? " dirty" : "";
        const levels = (m.supported_reasoning_levels || []).length;
        const mods = (m.input_modalities || []).length;
        html += `
        <article class="model-card${active}${dirty}" style="animation-delay:${gi * 45 + i * 30}ms">
          <button class="model-select" data-action="select" data-model-index="${modelIndex}" aria-current="${active ? "true" : "false"}" aria-label="选择模型 ${esc(m.display_name || slug)}"></button>
          <div class="mc-top">
            <div>
              <div class="mc-name">${esc(m.display_name)}</div>
              <div class="mc-slug">${esc(slug)}</div>
            </div>
          </div>
          <div class="mc-meta"><span>优先级 ${esc(m.priority ?? "-")}</span><span>${fmtInt(m.context_window)} ctx</span></div>
          <div class="mc-bar"><span style="width:${ctxBar(m)}%"></span></div>
          <div class="mc-chips">
            <span class="mini-chip">${esc(m.default_reasoning_level || "?")}</span>
            <span class="mini-chip">${levels} 档推理</span>
            <span class="mini-chip">${mods} 模态</span>
          </div>
          <button class="vis-toggle card-visibility ${m.visibility === "hide" ? "off" : "on"}" data-action="toggle-visibility" data-model-index="${modelIndex}" aria-pressed="${m.visibility !== "hide"}" title="点击切换可见/隐藏">
            <span class="vis-dot"></span>${m.visibility === "hide" ? "隐藏" : "可见"}
          </button>
        </article>`;
      });
      gi++;
    }
    if (!models.length) html = `<div class="empty-state">没有匹配的模型</div>`;
    list.innerHTML = html;
  }

  function renderStats() {
    const el = document.getElementById("stats");
    const visible = catalog.filter((m) => m.visibility !== "hide").length;
    const hidden = catalog.length - visible;
    const dirty = catalog.filter(isDirty).length;
    const maxCtx = Math.max(0, ...catalog.map((m) => m.max_context_window || 0));
    el.innerHTML = `
      <span class="stat-chip"><b>${catalog.length}</b> 模型</span>
      <span class="stat-chip"><b class="ok">${visible}</b> 可见</span>
      <span class="stat-chip"><b class="hot">${hidden}</b> 隐藏</span>
      <span class="stat-chip"><b class="${dirty ? "hot" : ""}">${dirty}</b> 已修改</span>
      <span class="stat-chip">上限 <b>${fmtInt(maxCtx)}</b> tokens</span>`;
  }

  function bulkFieldDefinitions() {
    return BULK_FIELD_KEYS.map((key) => fieldDef(key)).filter(Boolean);
  }

  function bulkChoices(field) {
    if (!field) return [];
    if (field.type === "triBool") return [true, false, null];
    if (["select", "enumInput"].includes(field.type)) {
      const choices = [...field.options];
      if (field.nullable) choices.push(null);
      return choices;
    }
    return [];
  }

  function bulkChoiceLabel(value) {
    if (value === null) return "未设置";
    if (value === true) return "启用";
    if (value === false) return "关闭";
    return String(value);
  }

  function bulkValueForField(field) {
    const modelValue = catalog.find((model) => hasPath(model, field.key));
    if (modelValue) return deepClone(getPath(modelValue, field.key));
    const choices = bulkChoices(field);
    if (choices.length) return deepClone(choices[0]);
    return field.type === "nullableNumber" ? null : 0;
  }

  function bulkAffectedIndexes() {
    return catalog.reduce((indexes, model, index) => {
      if (!bulkIncludeMissing && !hasPath(model, bulkFieldKey)) return indexes;
      const same = hasPath(model, bulkFieldKey) && JSON.stringify(getPath(model, bulkFieldKey)) === JSON.stringify(bulkValue);
      if (!same) indexes.push(index);
      return indexes;
    }, []);
  }

  function renderBulkPreview() {
    const preview = document.getElementById("bulkPreview");
    const button = document.getElementById("btnBulkApply");
    if (!preview || !button) return;
    const affected = bulkAffectedIndexes().length;
    preview.textContent = affected ? `将修改 ${affected} 个模型` : "全部模型已经一致";
    button.disabled = affected === 0;
  }

  function renderBulkEditor() {
    const fieldSelect = document.getElementById("bulkField");
    const valueControl = document.getElementById("bulkValueControl");
    const includeMissing = document.getElementById("bulkIncludeMissing");
    const scope = document.getElementById("bulkScopeLabel");
    if (!fieldSelect || !valueControl) return;
    const fields = bulkFieldDefinitions();
    if (!fields.some((field) => field.key === bulkFieldKey)) bulkFieldKey = fields[0]?.key || "";
    const field = fieldDef(bulkFieldKey);
    fieldSelect.innerHTML = fields.map((item) => `<option value="${esc(item.key)}" ${item.key === bulkFieldKey ? "selected" : ""}>${esc(item.label)} · ${esc(item.key)}</option>`).join("");
    const choices = bulkChoices(field);
    if (choices.length) {
      valueControl.innerHTML = `<div class="bulk-segmented">${choices.map((value) => {
        const encoded = esc(JSON.stringify(value));
        const active = JSON.stringify(value) === JSON.stringify(bulkValue);
        return `<button type="button" class="bulk-choice ${active ? "active" : ""}" data-bulk-value="${encoded}" aria-pressed="${active}">${esc(bulkChoiceLabel(value))}</button>`;
      }).join("")}</div>`;
    } else {
      const nullable = field?.type === "nullableNumber";
      valueControl.innerHTML = `<input type="number" step="1" aria-label="统一值" data-bulk-input value="${bulkValue === null || bulkValue === undefined ? "" : esc(bulkValue)}" placeholder="${nullable ? "留空 = null" : "整数"}">`;
    }
    includeMissing.checked = bulkIncludeMissing;
    scope.textContent = `全部 ${catalog.length} 个模型`;
    renderBulkPreview();
  }

  function applyBulkCorrection() {
    const indexes = bulkAffectedIndexes();
    if (!indexes.length) return;
    const field = fieldDef(bulkFieldKey);
    const next = deepClone(catalog);
    indexes.forEach((index) => setPath(next[index], bulkFieldKey, deepClone(bulkValue)));
    const currentErrors = validateCatalog(catalog).errors;
    const nextValidation = validateCatalog(next);
    const currentErrorKeys = new Set(currentErrors.map((issue) => `${issue.modelIndex}|${issue.path}|${issue.message}`));
    const addedErrors = nextValidation.errors.filter((issue) => !currentErrorKeys.has(`${issue.modelIndex}|${issue.path}|${issue.message}`));
    if (addedErrors.length) {
      toast(`批量修正会新增 ${addedErrors.length} 个配置错误，已取消`, "err");
      return;
    }
    const valueLabel = bulkChoiceLabel(bulkValue);
    if (!confirm(`将「${field.label}」统一设为「${valueLabel}」，共修改 ${indexes.length} 个模型。确定继续吗？`)) return;
    mutate(() => {
      indexes.forEach((index) => setPath(catalog[index], bulkFieldKey, deepClone(bulkValue)));
    });
    toast(`已批量修正 ${indexes.length} 个模型`, "ok");
  }

  function fieldMatchesSearch(field) {
    const query = fieldSearchQuery.trim().toLowerCase();
    if (!query) return true;
    const related = [field, ...FIELDS.filter((candidate) => candidate.parent === field.key)];
    return related.some((candidate) => `${candidate.label} ${candidate.key}`.toLowerCase().includes(query));
  }

  function isWideField(field) {
    return [
      "slug", "description", "upgrade", "availability_nux", "supported_reasoning_levels",
      "service_tiers", "base_instructions", "model_messages", "truncation_policy"
    ].includes(field.key) || [
      "textarea", "reasoningList", "serviceList", "modelMessages", "truncation", "nullableObject"
    ].includes(field.type);
  }

  function revealModule(section) {
    if (!section) return;
    section.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    const firstField = section.querySelector(".field input, .field textarea, .field select, .field button");
    if (firstField) firstField.focus({ preventScroll: true });
  }

  function syncModuleNav(renderedModules) {
    const available = new Set(renderedModules);
    const buttons = [...document.querySelectorAll("[data-module-target]")];
    buttons.forEach((button) => {
      const shown = available.has(button.dataset.moduleTarget);
      button.hidden = !shown;
      button.disabled = !shown;
      button.classList.toggle("active", shown && button.dataset.moduleTarget === renderedModules[0]);
    });
  }

  function renderEditor() {
    const root = document.getElementById("editorRoot");
    const model = getModel();
    if (!model) {
      root.innerHTML = `<div class="empty-state">请选择一个模型，或点击左侧「新建模型」。</div>`;
      syncModuleNav([]);
      return;
    }
    const renderedModules = [];
    let html = `
      <div class="model-hero">
        <div class="hero-row">
          <div>
            <div class="hero-title">
              <h2>${esc(model.display_name)}</h2>
              <code>${esc(model.slug)}</code>
              <button class="vis-toggle ${model.visibility === "hide" ? "off" : "on"}" data-action="toggle-visibility" data-model-index="${selectedIndex}" aria-pressed="${model.visibility !== "hide"}" title="点击切换可见/隐藏">
                <span class="vis-dot"></span>${model.visibility === "hide" ? "隐藏" : "可见"}
              </button>
            </div>
            <p class="hero-desc">${esc(model.description) || "（暂无描述）"}</p>
          </div>
          <div class="hero-actions">
            <button class="btn ghost" data-action="duplicate-model" data-model-index="${selectedIndex}">复制模型</button>
            <button class="btn danger-text" data-action="delete-model" data-model-index="${selectedIndex}">删除模型</button>
          </div>
        </div>
      </div>`;

    for (const mod of MODULES) {
      const allFields = FIELDS.filter((f) => f.module === mod.id && !f.parent);
      const fields = allFields.filter((field) => {
        if (!fieldMatchesSearch(field)) return false;
        if (onlyModifiedFields && !isFieldDirty(selectedIndex, field.key)) return false;
        return showAllFields || hasPath(model, field.key);
      });
      if (!fields.length) continue;
      renderedModules.push(mod.id);
      const present = allFields.filter((f) => hasPath(model, f.key)).length;
      html += `
      <section class="module" data-module="${mod.id}">
        <div class="module-head" role="button" tabindex="0" aria-controls="module-body-${mod.id}" title="点击查看此模块的字段">
          <span class="mod-index">${mod.no}</span>
          <span class="mod-title">${mod.title}</span>
          <span class="mod-sub">${mod.sub}</span>
          <span class="mod-sub">${fields.length}/${allFields.length} 显示 · ${present} 已配置</span>
        </div>
        <div class="mod-body" id="module-body-${mod.id}">`;
      for (const f of fields) html += renderFieldCard(model, f);
      html += `</div></section>`;
    }
    const extensionHtml = renderExtensionModule(model);
    if (extensionHtml) {
      renderedModules.push("extensions");
      html += extensionHtml;
    }
    if (!renderedModules.length) html += `<div class="editor-no-results">当前筛选下没有字段</div>`;
    root.innerHTML = html;
    syncModuleNav(renderedModules);
  }

  function renderFieldCard(model, f) {
    const present = hasPath(model, f.key);
    if (!present && !showAllFields) return "";
    const dirty = isFieldDirty(selectedIndex, f.key);
    const canRestore = dirty && Boolean(baselineForIndex(selectedIndex));
    let body = "";
    const inputId = `field-${String(f.key).replace(/[^a-z0-9_-]/gi, "-")}`;
    if (present) {
      body = renderFieldBody(f, getPath(model, f.key), inputId);
    } else {
      body = `<div class="field-tools">
        <button class="mini-btn add" data-action="add-field" data-path="${esc(f.key)}" data-type="${f.type}">＋ 添加字段</button>
      </div><div class="null-tag">未配置 · 源文件中不存在此字段</div>`;
    }
    return `
    <div class="field ${present ? "" : "field-missing"} ${dirty ? "field-dirty" : ""} ${isWideField(f) ? "span-2" : ""}" data-field-key="${esc(f.key)}">
      <div class="field-head">
        <div>
          <label class="field-label" for="${inputId}">${f.label}${f.required ? '<span style="color:var(--red)"> *</span>' : ""}</label>
          <div class="field-key">${esc(f.key)}</div>
        </div>
        <div class="field-tools">
          ${dirty ? '<span class="dirty-mark">已修改</span>' : ""}
          ${canRestore ? `<button class="mini-btn restore" data-action="restore-field" data-path="${esc(f.key)}">恢复</button>` : ""}
          ${present && !f.required ? `<button class="mini-btn danger quiet remove-field-button" data-action="remove-field" data-path="${esc(f.key)}">移除字段</button>` : ""}
        </div>
      </div>
      ${body}
    </div>`;
  }

  function renderExtensionModule(model) {
    const query = fieldSearchQuery.trim().toLowerCase();
    const entries = unknownEntries(model).filter(([key]) => {
      if (query && !`${key} 扩展 JSON`.toLowerCase().includes(query)) return false;
      return !onlyModifiedFields || isFieldDirty(selectedIndex, key) || hasJsonDraft(model, key);
    });
    const showAdd = showAllFields && !query && !onlyModifiedFields;
    if (!entries.length && !showAdd) return "";
    return `
      <section class="module extension-module" data-module="extensions">
        <div class="module-head" role="button" tabindex="0" aria-controls="module-body-extensions" title="点击查看此模块的字段">
          <span class="mod-index">05</span>
          <span class="mod-title">扩展字段</span>
          <span class="mod-sub">导入目录中未被当前编辑器 schema 收录的顶层字段</span>
          <span class="mod-sub">${entries.length} 字段</span>
        </div>
        <div class="mod-body" id="module-body-extensions">
          ${entries.map(([key, value], entryIndex) => {
            const dirty = isFieldDirty(selectedIndex, key);
            const canRestore = dirty && Boolean(baselineForIndex(selectedIndex));
            const errorId = `extension-error-${selectedIndex}-${entryIndex}`;
            const invalidDraft = hasJsonDraft(model, key);
            const jsonText = jsonEditorText(model, key, JSON.stringify(value, null, 2));
            return `<div class="field span-2 ${dirty ? "field-dirty" : ""} ${invalidDraft ? "invalid" : ""}" data-field-key="${esc(key)}">
            <div class="field-head"><div><label class="field-label" for="extension-${esc(key)}">${esc(key)}</label><div class="field-key">扩展 JSON</div></div>
              <div class="field-tools">${dirty ? '<span class="dirty-mark">已修改</span>' : ""}${canRestore ? `<button class="mini-btn restore" data-action="restore-field" data-path="${esc(key)}">恢复</button>` : ""}<button class="mini-btn danger quiet remove-field-button" data-action="remove-field" data-path="${esc(key)}">移除字段</button></div></div>
            <textarea id="extension-${esc(key)}" rows="4" aria-label="扩展字段 ${esc(key)}" aria-describedby="${errorId}" ${invalidDraft ? 'aria-invalid="true"' : ""} data-bind="${esc(key)}" data-kind="json">${esc(jsonText)}</textarea>
            <div class="err-msg" id="${errorId}">JSON 格式无效</div>
          </div>`;
          }).join("")}
          ${showAdd ? `<div class="field span-2 custom-field-add">
            <div class="field-head"><div><div class="field-label">添加扩展字段</div><div class="field-key">名称必须为未使用的顶层键</div></div></div>
            <div class="chip-add"><input class="custom-field-key" aria-label="扩展字段名称" type="text" placeholder="字段名称">
              <input class="custom-field-value" aria-label="扩展字段 JSON 值" type="text" value="null" placeholder="JSON 值">
              <button class="mini-btn add" data-action="add-custom-field">添加</button></div>
          </div>` : ""}
        </div>
      </section>`;
  }

  function renderFieldBody(f, val, inputId) {
    switch (f.type) {
      case "text":
        return `<input id="${inputId}" aria-label="${esc(f.label)}" type="text" value="${esc(val)}" placeholder="${f.nullable ? "留空 = null" : ""}" data-bind="${esc(f.key)}" data-kind="text" data-nullable="${f.nullable ? "1" : "0"}">`;
      case "textarea":
        return `<textarea id="${inputId}" aria-label="${esc(f.label)}" rows="${f.rows || 3}" data-bind="${esc(f.key)}" data-kind="text">${esc(val)}</textarea>`;
      case "number":
      case "nullableNumber":
        return `<input id="${inputId}" aria-label="${esc(f.label)}" type="number" step="1" value="${val === null || val === undefined ? "" : esc(val)}" data-bind="${esc(f.key)}" data-kind="number" data-nullable="${f.type === "nullableNumber" ? "1" : "0"}">
          ${f.type === "nullableNumber" ? '<div class="field-note">留空 = null</div>' : ""}`;
      case "select":
        return `<select id="${inputId}" aria-label="${esc(f.label)}" data-bind-select="${esc(f.key)}">${f.options
          .map((o) => `<option value="${esc(o)}" ${val === o ? "selected" : ""}>${esc(o)}</option>`)
          .join("")}</select>`;
      case "enumInput":
        return `<input id="${inputId}" aria-label="${esc(f.label)}" type="text" list="${dlId(f.key)}" value="${esc(val)}" placeholder="${f.nullable ? "留空 = null" : ""}" data-bind="${esc(f.key)}" data-kind="text" data-nullable="${f.nullable ? "1" : "0"}">
          <datalist id="${dlId(f.key)}">${f.options.map((o) => `<option value="${esc(o)}">`).join("")}</datalist>`;
      case "triBool":
        return renderTriBool(f.key, val, f.label);
      case "chipList":
      case "modalityList":
        return renderChips(f, val);
      case "reasoningList":
        return renderReasoningList(f, val);
      case "serviceList":
        return renderServiceList(f, val);
      case "truncation":
        return `
        <div class="row-grid two">
          <label>模式 mode
            <input type="text" list="dl_trunc_mode" value="${esc(val.mode || "")}" data-bind="${esc(f.key)}.mode" data-kind="text" data-nullable="0">
            <datalist id="dl_trunc_mode"><option value="tokens"><option value="bytes"></datalist>
          </label>
          <label>上限 limit
            <input type="number" step="1" value="${val.limit === null || val.limit === undefined ? "" : esc(val.limit)}" data-bind="${esc(f.key)}.limit" data-kind="number" data-nullable="1">
          </label>
        </div>`;
      case "nullableObject":
        return renderNullableObject(f, val);
      case "modelMessages":
        return renderModelMessages(f, val);
      default:
        return `<div class="field-note">未知类型 ${esc(f.type)}</div>`;
    }
  }

  function renderTriBool(key, val, label) {
    const cur = val === true || val === "true" ? "true" : val === false || val === "false" ? "false" : "null";
    const opts = [
      ["true", "启用", "on"],
      ["false", "关闭", "off"],
      ["null", "未设置", "nul"]
    ];
    return `<div class="tri-select" role="group" aria-label="${esc(label)}">${opts
      .map(
        ([v, label, cls]) =>
          `<button class="tri-option ${cls} ${cur === v ? "active" : ""}" data-action="tri" data-path="${esc(key)}" data-val="${v}" aria-pressed="${cur === v}">${label}</button>`
      )
      .join("")}</div>`;
  }

  function renderChips(f, arr) {
    const list = Array.isArray(arr) ? arr : [];
    return `
      <div class="chips">
        ${list
          .map(
            (c, i) =>
              `<span class="chip">${esc(c)}<button data-action="remove-chip" data-path="${esc(f.key)}" data-index="${i}" title="移除">×</button></span>`
          )
          .join("")}
      </div>
      <div class="chip-add">
        <input type="text" data-chip-input="${esc(f.key)}" placeholder="输入新值后回车或点击添加">
        <button class="mini-btn add" data-action="add-chip" data-path="${esc(f.key)}">添加</button>
      </div>`;
  }

  function renderReasoningList(f, arr) {
    const list = Array.isArray(arr) ? arr : [];
    return `
      <div class="row-list">
        ${list
          .map(
            (row, i) => `
          <div class="row-item">
            <div class="row-head">
              <span class="row-title">#${i + 1} · effort / description</span>
              <button class="mini-btn danger quiet" data-action="remove-row" data-path="${esc(f.key)}" data-index="${i}">删除</button>
            </div>
            <div class="row-grid two">
              <label>等级 effort
                <input type="text" list="dl_reasoning_${i}" value="${esc(row.effort || "")}" data-list-bind="${esc(f.key)}" data-index="${i}" data-sub="effort" data-kind="text">
                <datalist id="dl_reasoning_${i}">${REASONING_LEVELS.map((o) => `<option value="${o}">`).join("")}</datalist>
              </label>
              <label>描述 description
                <textarea rows="2" data-list-bind="${esc(f.key)}" data-index="${i}" data-sub="description" data-kind="text">${esc(row.description || "")}</textarea>
              </label>
            </div>
          </div>`
          )
          .join("")}
      </div>
      <div class="field-tools" style="margin-top:8px">
        <button class="mini-btn add" data-action="add-row" data-path="${esc(f.key)}" data-row-type="reasoning">＋ 添加推理等级</button>
      </div>`;
  }

  function renderServiceList(f, arr) {
    const list = Array.isArray(arr) ? arr : [];
    return `
      <div class="row-list">
        ${list
          .map(
            (row, i) => `
          <div class="row-item">
            <div class="row-head">
              <span class="row-title">#${i + 1} · id / name / description</span>
              <button class="mini-btn danger quiet" data-action="remove-row" data-path="${esc(f.key)}" data-index="${i}">删除</button>
            </div>
            <div class="row-grid">
              <label>id <input type="text" value="${esc(row.id || "")}" data-list-bind="${esc(f.key)}" data-index="${i}" data-sub="id" data-kind="text"></label>
              <label>名称 name <input type="text" value="${esc(row.name || "")}" data-list-bind="${esc(f.key)}" data-index="${i}" data-sub="name" data-kind="text"></label>
              <label>描述 description <textarea rows="2" data-list-bind="${esc(f.key)}" data-index="${i}" data-sub="description" data-kind="text">${esc(row.description || "")}</textarea></label>
            </div>
          </div>`
          )
          .join("")}
      </div>
      <div class="field-tools" style="margin-top:8px">
        <button class="mini-btn add" data-action="add-row" data-path="${esc(f.key)}" data-row-type="service">＋ 添加服务层级</button>
      </div>`;
  }

  function renderNullableObject(f, val) {
    if (val === null || val === undefined) {
      return `<div class="field-tools">
        <button class="mini-btn add" data-action="enable-object" data-path="${esc(f.key)}" data-type="${f.type}">启用配置</button>
      </div><div class="null-tag">null</div>`;
    }
    return `
      <div class="row-grid">
        ${f.children
          .map(
            (c) => `
          <label>${c.label} ${esc(c.key)}
            ${c.type === "textarea"
              ? `<textarea rows="${c.rows || 3}" data-bind="${esc(f.key)}.${c.key}" data-kind="text">${esc(val[c.key] || "")}</textarea>`
              : `<input type="text" value="${esc(val[c.key] || "")}" data-bind="${esc(f.key)}.${c.key}" data-kind="text" data-nullable="0">`}
          </label>`
          )
          .join("")}
      </div>
      <div class="field-tools" style="margin-top:8px">
        <button class="mini-btn quiet" data-action="null-object" data-path="${esc(f.key)}">置空 null</button>
      </div>`;
  }

  function renderModelMessages(f, val) {
    if (val === null || val === undefined) {
      return `<div class="field-tools">
        <button class="mini-btn add" data-action="enable-object" data-path="${esc(f.key)}" data-type="modelMessages">启用配置</button>
      </div><div class="null-tag">null</div>`;
    }
    const mm = val || {};
    const showNested = (key) => showAllFields || Object.prototype.hasOwnProperty.call(mm, key);
    return `
      <div class="row-list">
        ${showNested("instructions_template") ? `<div class="row-item" data-field-key="model_messages.instructions_template">
          <div class="row-head"><span class="row-title">instructions_template · 指令模板</span></div>
          <textarea aria-label="指令模板" rows="6" data-bind="model_messages.instructions_template" data-kind="text">${esc(mm.instructions_template || "")}</textarea>
        </div>` : ""}
        ${showNested("instructions_variables") ? renderVarMap(mm.instructions_variables) : ""}
        ${showNested("approvals") ? renderApprovals(mm.approvals) : ""}
        ${showNested("collaboration_modes") ? renderJsonField("model_messages.collaboration_modes", "collaboration_modes · 协作模式", mm.collaboration_modes) : ""}
        ${showNested("auto_review") ? renderAutoReview(mm.auto_review) : ""}
        ${showNested("permissions") ? renderPermissions(mm.permissions) : ""}
      </div>
      <div class="field-tools" style="margin-top:8px">
        <button class="mini-btn quiet" data-action="null-object" data-path="model_messages">置空 null</button>
      </div>`;
  }

  function renderVarMap(vars) {
    const obj = vars && typeof vars === "object" ? vars : {};
    const rows = Object.entries(obj)
      .map(
        ([k, v]) => `
        <div class="row-item">
          <div class="row-head">
            <span class="row-title">${esc(k)}</span>
            <button class="mini-btn danger quiet" data-action="remove-var" data-path="model_messages.instructions_variables" data-key="${esc(k)}">移除</button>
          </div>
          <textarea rows="2" data-var-bind="model_messages.instructions_variables" data-var-key="${esc(k)}" data-kind="text">${esc(v || "")}</textarea>
        </div>`
      )
      .join("");
    return `
      <div class="row-item" data-field-key="model_messages.instructions_variables">
        <div class="row-head"><span class="row-title">instructions_variables · 指令变量</span></div>
        <div class="row-list">${rows}</div>
        <div class="chip-add">
          <input type="text" class="var-new-key" placeholder="新变量名">
          <input type="text" class="var-new-value" placeholder="默认值">
          <button class="mini-btn add" data-action="add-var" data-path="model_messages.instructions_variables">添加</button>
        </div>
      </div>`;
  }

  function renderApprovals(val) {
    const obj = val && typeof val === "object" ? val : {};
    let body;
    if (val === null || val === undefined) {
      body = `<div class="field-tools"><button class="mini-btn add" data-action="enable-sub" data-path="model_messages.approvals" data-type="approvals">启用配置</button></div><div class="null-tag">null</div>`;
    } else {
      body = `<div class="row-list">${APPROVAL_KEYS.map((k) => {
        const v = obj[k];
        if (v === null || v === undefined) {
          return `<div class="row-item">
            <div class="row-head"><span class="row-title">${esc(k)}</span><span class="null-tag">null</span>
              <button class="mini-btn add" data-action="set-string" data-path="model_messages.approvals.${k}">设为文本</button>
            </div>
          </div>`;
        }
        return `<div class="row-item">
          <div class="row-head"><span class="row-title">${esc(k)}</span>
            <button class="mini-btn quiet" data-action="null-string" data-path="model_messages.approvals.${k}">置空 null</button>
          </div>
          <textarea rows="3" data-bind="model_messages.approvals.${k}" data-kind="text">${esc(v)}</textarea>
        </div>`;
      }).join("")}</div>
      <div class="field-tools" style="margin-top:8px"><button class="mini-btn quiet" data-action="null-object" data-path="model_messages.approvals">置空 null</button></div>`;
    }
    return `<div class="row-item" data-field-key="model_messages.approvals">
      <div class="row-head"><span class="row-title">approvals · 审批策略</span></div>
      ${body}
    </div>`;
  }

  function renderJsonField(path, label, val) {
    const model = getModel();
    const fallback = val === null || val === undefined ? "" : JSON.stringify(val, null, 2);
    const text = jsonEditorText(model, path, fallback);
    const invalidDraft = hasJsonDraft(model, path);
    const errorId = `json-error-${String(path).replace(/[^a-z0-9_-]/gi, "-")}`;
    return `<div class="row-item ${invalidDraft ? "invalid" : ""}" data-field-key="${esc(path)}">
      <div class="row-head"><span class="row-title">${label}</span></div>
      <textarea rows="4" aria-label="${esc(label)}" aria-describedby="${errorId}" ${invalidDraft ? 'aria-invalid="true"' : ""} data-bind="${path}" data-kind="json">${esc(text)}</textarea>
      <div class="err-msg" id="${errorId}">JSON 格式无效</div>
      <div class="field-tools" style="margin-top:8px">
        <button class="mini-btn add" data-action="enable-json" data-path="${path}">设为对象</button>
        <button class="mini-btn quiet" data-action="null-object" data-path="${path}">置空 null</button>
      </div>
    </div>`;
  }

  function renderAutoReview(val) {
    let body;
    if (val === null || val === undefined) {
      body = `<div class="field-tools"><button class="mini-btn add" data-action="enable-sub" data-path="model_messages.auto_review" data-type="autoReview">启用配置</button></div><div class="null-tag">null</div>`;
    } else {
      body = `<div class="row-grid">
        <label>policy · 审批策略<textarea rows="5" data-bind="model_messages.auto_review.policy" data-kind="text">${esc(val.policy || "")}</textarea></label>
        <label>policy_template · 策略模板<textarea rows="5" data-bind="model_messages.auto_review.policy_template" data-kind="text">${esc(val.policy_template || "")}</textarea></label>
      </div>
      <div class="field-tools" style="margin-top:8px"><button class="mini-btn quiet" data-action="null-object" data-path="model_messages.auto_review">置空 null</button></div>`;
    }
    return `<div class="row-item" data-field-key="model_messages.auto_review">
      <div class="row-head"><span class="row-title">auto_review · 自动审批</span></div>
      ${body}
    </div>`;
  }

  function renderPermissions(val) {
    let body;
    if (val === null || val === undefined) {
      body = `<div class="field-tools"><button class="mini-btn add" data-action="enable-sub" data-path="model_messages.permissions" data-type="permissions">启用配置</button></div><div class="null-tag">null</div>`;
    } else {
      body = `<div class="row-grid">
        ${PERMISSION_KEYS.map(
          (k) => `<label>${esc(k)}<textarea rows="2" data-bind="model_messages.permissions.${k}" data-kind="text">${esc(val[k] || "")}</textarea></label>`
        ).join("")}
      </div>
      <div class="field-tools" style="margin-top:8px"><button class="mini-btn quiet" data-action="null-object" data-path="model_messages.permissions">置空 null</button></div>`;
    }
    return `<div class="row-item" data-field-key="model_messages.permissions">
      <div class="row-head"><span class="row-title">permissions · 权限配置</span></div>
      ${body}
    </div>`;
  }

  function renderOverview() {
    const wrap = document.getElementById("overviewWrap");
    wrap.setAttribute("role", "region");
    wrap.setAttribute("aria-label", "模型目录对比表");
    wrap.tabIndex = 0;
    const sorted = catalog.map((model, index) => ({ model, index })).sort((a, b) => {
      const av = sortValue(a.model, sortKey);
      const bv = sortValue(b.model, sortKey);
      if (av < bv) return -1 * sortDir;
      if (av > bv) return 1 * sortDir;
      return 0;
    });
    const cols = [
      ["display_name", "模型"], ["family", "家族"], ["visibility", "可见性"], ["priority", "优先级"],
      ["context_window", "上下文"], ["max_context_window", "最大上下文"], ["default_reasoning_level", "默认推理"],
      ["levels", "推理档数"], ["speed", "速度档"], ["tiers", "服务层级"], ["modalities", "输入模态"],
      ["search", "搜索"], ["status", "状态"]
    ];
    let html = `<table class="overview-table"><thead><tr>`;
    for (const [key, label] of cols) {
      const mark = sortKey === key ? `<span class="sort-mark">${sortDir === 1 ? "↑" : "↓"}</span>` : "";
      const ariaSort = sortKey === key ? (sortDir === 1 ? "ascending" : "descending") : "none";
      html += `<th aria-sort="${ariaSort}"><button class="sort-button" data-sort="${key}">${label}${mark}</button></th>`;
    }
    html += `</tr></thead><tbody>`;
    for (const { model: m, index: modelIndex } of sorted) {
      html += `
      <tr>
        <td><button class="overview-open" data-action="open-model" data-model-index="${modelIndex}" aria-label="打开模型 ${esc(m.display_name || m.slug)}"><span class="ov-model">${esc(m.display_name)}</span><span class="ov-slug">${esc(m.slug)}</span></button></td>
        <td>${familyOf(m)}</td>
        <td><span class="badge${m.visibility === "hide" ? " hide" : ""}">${m.visibility === "hide" ? "隐藏" : "可见"}</span></td>
        <td>${esc(m.priority ?? "-")}</td>
        <td><div class="ov-ctx">${fmtInt(m.context_window)}</div><div class="ov-bar"><span style="width:${ctxBar(m)}%"></span></div></td>
        <td class="ov-ctx">${fmtInt(m.max_context_window)}</td>
        <td>${esc(m.default_reasoning_level || "-")}</td>
        <td>${(m.supported_reasoning_levels || []).length}</td>
        <td>${esc((m.additional_speed_tiers || []).join(", ") || "-")}</td>
        <td>${esc((m.service_tiers || []).map((t) => t.id).join(", ") || "-")}</td>
        <td>${esc((m.input_modalities || []).join(" + ") || "-")}</td>
        <td>${m.supports_search_tool ? "是" : "否"}</td>
        <td>${isDirty(m, modelIndex) ? '<span class="badge dirty">已修改</span>' : '<span class="badge">原样</span>'}</td>
      </tr>`;
    }
    html += `</tbody></table>`;
    wrap.innerHTML = catalog.length ? html : `<div class="empty-state">目录为空</div>`;
  }

  function sortValue(m, key) {
    switch (key) {
      case "display_name": return (m.display_name || "").toLowerCase();
      case "family": return familyOf(m);
      case "visibility": return m.visibility || "";
      case "priority": return m.priority || 0;
      case "context_window": case "max_context_window": return m[key] || 0;
      case "default_reasoning_level": return m.default_reasoning_level || "";
      case "levels": return (m.supported_reasoning_levels || []).length;
      case "speed": return (m.additional_speed_tiers || []).join(",");
      case "tiers": return (m.service_tiers || []).map((t) => t.id).join(",");
      case "modalities": return (m.input_modalities || []).join(",");
      case "search": return m.supports_search_tool ? 1 : 0;
      case "status": return isDirty(m) ? 1 : 0;
      default: return m[key];
    }
  }

  function renderFieldMap() {
    const wrap = document.getElementById("fieldMap");
    let html = "";
    for (const mod of MODULES) {
      const fields = FIELDS.filter((f) => f.module === mod.id);
      html += `
      <div class="map-module">
        <div class="map-module-head">
          <span class="mod-index">${mod.no}</span>
          <h3>${mod.title}</h3>
          <span class="count">${fields.length} 个字段</span>
        </div>`;
      for (const f of fields) {
        const present = catalog.filter((m) => hasPath(m, f.key)).length;
        const nullable = f.type === "nullableObject" || f.type === "modelMessages" || f.type === "approvals" || f.type === "autoReview" || f.type === "permissions" || f.type === "jsonObj" || f.nullable;
        html += `
        <button class="map-field" data-action="jump-field" data-field="${esc(f.key)}">
          <span class="map-label">${f.label}</span>
          <span class="map-key">${esc(f.key)}</span>
          <span class="type-badge${nullable ? " nullable" : ""}">${TYPE_LABELS[f.type] || f.type}</span>
          <span class="presence">${present}/${catalog.length}</span>
        </button>`;
      }
      html += `</div>`;
    }
    const extensionKeys = [...new Set(catalog.flatMap((model) => unknownEntries(model).map(([key]) => key)))].sort();
    if (extensionKeys.length) {
      html += `<div class="map-module"><div class="map-module-head"><span class="mod-index">05</span><h3>扩展字段</h3><span class="count">${extensionKeys.length} 个字段</span></div>`;
      for (const key of extensionKeys) {
        const present = catalog.filter((model) => Object.prototype.hasOwnProperty.call(model, key)).length;
        html += `<button class="map-field" data-action="jump-field" data-field="${esc(key)}">
          <span class="map-label">${esc(key)}</span><span class="map-key">扩展顶层字段</span><span class="type-badge nullable">json</span><span class="presence">${present}/${catalog.length}</span></button>`;
      }
      html += `</div>`;
    }
    wrap.innerHTML = html;
  }

  /* ---------------------------------------------------------------- */
  /* Mutations                                                        */
  /* ---------------------------------------------------------------- */

  function mutate(fn) {
    commitPendingEdit();
    clearTimeout(commitTimer);
    const before = serializeState();
    const beforeHistory = serializeHistoryState(before);
    fn();
    const after = serializeState();
    if (before !== after) {
      history.push(beforeHistory);
      if (history.length > 100) history.shift();
      future = [];
      committedSnapshot = after;
    }
    persist();
    renderAll();
  }

  function commitPendingEdit() {
    clearTimeout(commitTimer);
    const current = serializeState();
    if (current !== committedSnapshot) {
      history.push(serializeHistoryState(committedSnapshot));
      if (history.length > 100) history.shift();
      future = [];
      committedSnapshot = current;
    }
    updateHistoryButtons();
  }

  function scheduleCommit() {
    clearTimeout(commitTimer);
    commitTimer = setTimeout(commitPendingEdit, 450);
  }

  function restoreSnapshot(snapshot) {
    const state = readState(snapshot);
    catalog = state.models;
    modelRefs = catalog.map((_model, index) => state.refs[index] || null);
    if (state.baseline) original = state.baseline;
    selectedIndex = restoreSelectedIndex(state.selected);
    jsonDrafts.clear();
    committedSnapshot = serializeState();
    persistBaseline();
    persist();
    renderAll();
  }

  function undo() {
    commitPendingEdit();
    if (!history.length) return;
    future.push(serializeHistoryState());
    restoreSnapshot(history.pop());
  }

  function redo() {
    commitPendingEdit();
    if (!future.length) return;
    history.push(serializeHistoryState());
    restoreSnapshot(future.pop());
  }

  function updateHistoryButtons() {
    const undoButton = document.getElementById("btnUndo");
    const redoButton = document.getElementById("btnRedo");
    if (undoButton) undoButton.disabled = !history.length;
    if (redoButton) redoButton.disabled = !future.length;
  }

  function addField(path, type) {
    const model = getModel();
    if (!model) return;
    const def = fieldDef(path);
    let value = defaultFor(path, type);
    if (type === "enumInput" && def && !def.nullable) value = def.options[0] || "";
    if (type === "number") value = 0;
    setPath(model, path, value);
  }

  function restoreField(path) {
    const model = getModel();
    const source = baselineForIndex(selectedIndex);
    if (!model || !source) return;
    if (hasPath(source, path)) setPath(model, path, deepClone(getPath(source, path)));
    else delPath(model, path);
  }

  function addRow(path, rowType) {
    const model = getModel();
    if (!model) return;
    const arr = getPath(model, path);
    if (!Array.isArray(arr)) setPath(model, path, []);
    const list = getPath(model, path);
    list.push(rowType === "service" ? { id: "", name: "", description: "" } : { effort: "medium", description: "" });
  }

  function addChip(path) {
    const model = getModel();
    if (!model) return;
    const input = document.querySelector(`[data-chip-input="${cssEsc(path)}"]`);
    const value = input ? input.value.trim() : "";
    if (!value) return;
    const arr = getPath(model, path);
    if (!Array.isArray(arr)) setPath(model, path, []);
    getPath(model, path).push(value);
    if (input) input.value = "";
  }

  function addVar(path) {
    const model = getModel();
    if (!model) return;
    const field = document.querySelector(`[data-field-key="model_messages"]`);
    const keyInput = field ? field.querySelector(".var-new-key") : null;
    const valueInput = field ? field.querySelector(".var-new-value") : null;
    const key = keyInput ? keyInput.value.trim() : "";
    if (!key) return;
    const obj = getPath(model, path);
    if (!obj || typeof obj !== "object") setPath(model, path, {});
    getPath(model, path)[key] = valueInput ? valueInput.value : "";
    if (keyInput) keyInput.value = "";
    if (valueInput) valueInput.value = "";
  }

  function addCustomField() {
    const model = getModel();
    if (!model) return;
    const keyInput = document.querySelector(".custom-field-key");
    const valueInput = document.querySelector(".custom-field-value");
    const key = keyInput ? keyInput.value.trim() : "";
    if (!key) throw new Error("请输入扩展字段名称");
    if (Object.prototype.hasOwnProperty.call(model, key)) throw new Error(`字段已存在：${key}`);
    let value;
    try {
      value = JSON.parse(valueInput ? valueInput.value : "null");
    } catch (_e) {
      throw new Error("扩展字段值必须是有效 JSON");
    }
    model[key] = value;
  }

  /* ---------------------------------------------------------------- */
  /* Events                                                           */
  /* ---------------------------------------------------------------- */

  function handleAction(el) {
    const action = el.dataset.action;
    const model = getModel();

    if (action === "select" || action === "open-model") {
      selectedIndex = Number(el.dataset.modelIndex);
      if (action === "open-model") {
        activeTab = "editor";
        updateTabUI();
      }
      renderAll();
      return;
    }
    if (action === "toggle-visibility") {
      const target = catalog[Number(el.dataset.modelIndex)];
      if (!target) return;
      mutate(() => {
        target.visibility = target.visibility === "hide" ? "list" : "hide";
      });
      toast(target.visibility === "hide" ? "已隐藏 " + target.slug : "已设为可见 " + target.slug, "ok");
      return;
    }
    if (action === "add-model") {
      let m;
      mutate(() => {
        m = defaultNewModel();
        catalog.push(m);
        modelRefs.push(null);
        selectedIndex = catalog.length - 1;
      });
      toast("已新建模型 " + m.slug, "ok");
      return;
    }
    if (action === "duplicate-model") {
      const src = catalog[Number(el.dataset.modelIndex)];
      if (!src) return;
      let slug;
      mutate(() => {
        const copy = deepClone(src);
        slug = src.slug + "-copy";
        let n = 2;
        while (catalog.some((m) => m.slug === slug)) slug = src.slug + "-copy-" + n++;
        copy.slug = slug;
        copy.display_name = src.display_name + " (副本)";
        copy.priority = Math.max(1000, ...catalog.map((m) => Number(m.priority) || 0)) + 1;
        catalog.push(copy);
        modelRefs.push(null);
        selectedIndex = catalog.length - 1;
      });
      toast("已复制为 " + slug, "ok");
      return;
    }
    if (action === "delete-model") {
      const idx = Number(el.dataset.modelIndex);
      const target = catalog[idx];
      if (!target) return;
      const slug = target.slug;
      if (!confirm("确定删除模型「" + slug + "」？删除后可使用顶部「撤销」恢复。")) return;
      if (idx >= 0) {
        mutate(() => {
          jsonDrafts.delete(target);
          catalog.splice(idx, 1);
          modelRefs.splice(idx, 1);
          if (!catalog.length) selectedIndex = -1;
          else if (selectedIndex === idx) selectedIndex = Math.min(idx, catalog.length - 1);
          else if (idx < selectedIndex) selectedIndex -= 1;
        });
        toast("已删除 " + slug, "ok");
      }
      return;
    }

    if (!model && !["jump-validation", "jump-field"].includes(action)) return;
    const path = el.dataset.path;

    switch (action) {
      case "add-field":
        mutate(() => addField(path, el.dataset.type));
        break;
      case "remove-field":
        mutate(() => {
          clearJsonDraftTree(model, path);
          delPath(model, path);
        });
        break;
      case "restore-field":
        mutate(() => {
          clearJsonDraftTree(model, path);
          restoreField(path);
        });
        toast("已恢复字段基线值", "ok");
        break;
      case "tri":
        mutate(() => {
          const v = el.dataset.val;
          setPath(model, path, v === "null" ? null : v === "true");
        });
        break;
      case "enable-object":
        mutate(() => {
          clearJsonDraftTree(model, path);
          if (getPath(model, path) === null || getPath(model, path) === undefined) {
            setPath(model, path, defaultFor(path, el.dataset.type || "nullableObject"));
          }
        });
        break;
      case "null-object":
        mutate(() => {
          clearJsonDraftTree(model, path);
          setPath(model, path, null);
        });
        break;
      case "enable-sub":
        mutate(() => {
          clearJsonDraftTree(model, path);
          setPath(model, path, defaultFor(path, el.dataset.type));
        });
        break;
      case "enable-json":
        mutate(() => {
          clearJsonDraftTree(model, path);
          const v = getPath(model, path);
          if (v === null || v === undefined) setPath(model, path, {});
        });
        break;
      case "set-string":
        mutate(() => setPath(model, path, ""));
        break;
      case "null-string":
        mutate(() => setPath(model, path, null));
        break;
      case "add-chip":
        mutate(() => addChip(path));
        break;
      case "remove-chip":
        mutate(() => {
          const arr = getPath(model, path);
          if (Array.isArray(arr)) arr.splice(Number(el.dataset.index), 1);
        });
        break;
      case "add-row":
        mutate(() => addRow(path, el.dataset.rowType));
        break;
      case "remove-row":
        mutate(() => {
          const arr = getPath(model, path);
          if (Array.isArray(arr)) arr.splice(Number(el.dataset.index), 1);
        });
        break;
      case "add-var":
        mutate(() => addVar(path));
        break;
      case "remove-var":
        mutate(() => {
          const obj = getPath(model, path);
          if (obj && typeof obj === "object") delete obj[el.dataset.key];
        });
        break;
      case "add-custom-field":
        try {
          mutate(addCustomField);
        } catch (err) {
          toast(err.message, "err");
        }
        break;
      case "jump-validation":
        if (Number(el.dataset.modelIndex) >= 0) selectedIndex = Number(el.dataset.modelIndex);
        activeTab = "editor";
        updateTabUI();
        renderAll();
        requestAnimationFrame(() => focusField(el.dataset.path));
        break;
      case "jump-field": {
        const key = el.dataset.field;
        activeTab = "editor";
        updateTabUI();
        const withField = catalog.find((m) => hasPath(m, key));
        if (withField) selectedIndex = catalog.indexOf(withField);
        showAllFields = true;
        onlyModifiedFields = false;
        fieldSearchQuery = "";
        document.getElementById("showAllFields").checked = true;
        document.getElementById("onlyModifiedFields").checked = false;
        document.getElementById("editorFieldSearch").value = "";
        renderAll();
        requestAnimationFrame(() => {
          focusField(key);
        });
        break;
      }
    }
  }

  function prefersReducedMotion() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  }

  function focusField(key) {
    if (!key) return;
    let candidate = key;
    let target = null;
    while (candidate && !target) {
      target = document.querySelector(`[data-field-key="${candidate.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"]`);
      candidate = candidate.includes(".") ? candidate.slice(0, candidate.lastIndexOf(".")) : "";
    }
    if (!target) return;
    target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
    target.classList.add("flash");
    const control = target.querySelector("[data-bind], [data-bind-select], [data-list-bind], [data-var-bind], [data-chip-input], input:not([type=hidden]), textarea, select");
    if (control) control.focus({ preventScroll: true });
    setTimeout(() => target.classList.remove("flash"), 1300);
  }

  function handleBindInput(el) {
    const model = getModel();
    if (!model) return;
    const path = el.dataset.bind;
    const kind = el.dataset.kind;
    if (kind === "json") {
      const raw = el.value.trim();
      const field = el.closest(".field, .row-item");
      const error = field?.querySelector(".err-msg");
      if (error && !error.id) error.id = `json-error-${selectedIndex}-${String(path).replace(/[^a-z0-9_-]/gi, "-")}`;
      if (!raw) {
        setPath(model, path, null);
        clearJsonDraft(model, path);
        field?.classList.remove("invalid");
        if (!el.hasAttribute("data-schema-invalid")) el.removeAttribute("aria-invalid");
      } else {
        try {
          setPath(model, path, JSON.parse(raw));
          clearJsonDraft(model, path);
          field?.classList.remove("invalid");
          if (!el.hasAttribute("data-schema-invalid")) el.removeAttribute("aria-invalid");
        } catch (_e) {
          setJsonDraft(model, path, el.value);
          field?.classList.add("invalid");
          el.setAttribute("aria-invalid", "true");
          if (error?.id) el.setAttribute("aria-describedby", error.id);
          return;
        }
      }
      syncEditedField(el);
      scheduleLight();
      return;
    }
    if (kind === "number") {
      const v = el.value.trim() === "" || Number.isNaN(Number(el.value)) ? null : Number(el.value);
      setPath(model, path, v);
    } else {
      const v = el.dataset.nullable === "1" && el.value.trim() === "" ? null : el.value;
      setPath(model, path, v);
    }
    syncEditedField(el);
    scheduleLight();
  }

  function handleListInput(el) {
    const model = getModel();
    if (!model) return;
    const arr = getPath(model, el.dataset.listBind);
    if (!Array.isArray(arr)) return;
    const row = arr[Number(el.dataset.index)];
    if (!row || typeof row !== "object") return;
    const v = el.dataset.kind === "number" ? (el.value.trim() === "" ? null : Number(el.value)) : el.value;
    row[el.dataset.sub] = v;
    syncEditedField(el);
    scheduleLight();
  }

  function handleVarInput(el) {
    const model = getModel();
    if (!model) return;
    const obj = getPath(model, el.dataset.varBind);
    if (!obj || typeof obj !== "object") return;
    obj[el.dataset.varKey] = el.value;
    syncEditedField(el);
    scheduleLight();
  }

  function syncEditedField(control) {
    const field = control.closest(".field[data-field-key]");
    if (!field) return;
    const path = field.dataset.fieldKey;
    const dirty = isFieldDirty(selectedIndex, path);
    field.classList.toggle("field-dirty", dirty);
    const tools = field.querySelector(":scope > .field-head > .field-tools");
    if (!tools) return;
    let mark = tools.querySelector(":scope > .dirty-mark");
    let restore = tools.querySelector(":scope > [data-action=restore-field]");
    if (dirty && !mark) {
      mark = document.createElement("span");
      mark.className = "dirty-mark";
      mark.textContent = "已修改";
      tools.prepend(mark);
    } else if (!dirty) {
      mark?.remove();
    }
    if (dirty && baselineForIndex(selectedIndex) && !restore) {
      restore = document.createElement("button");
      restore.className = "mini-btn restore";
      restore.dataset.action = "restore-field";
      restore.dataset.path = path;
      restore.textContent = "恢复";
      mark?.after(restore);
    } else if (!dirty) {
      restore?.remove();
    }
  }

  function scheduleLight() {
    persist();
    scheduleCommit();
    syncHero();
    clearTimeout(lightTimer);
    lightTimer = setTimeout(() => {
      renderStats();
      renderSidebar();
      renderValidation(validateCatalog(catalog));
      renderBulkPreview();
      updateHistoryButtons();
    }, 160);
  }

  function syncHero() {
    const model = getModel();
    const hero = document.querySelector(".model-hero");
    if (!model || !hero) return;
    const title = hero.querySelector("h2");
    const slug = hero.querySelector("code");
    const description = hero.querySelector(".hero-desc");
    if (title) title.textContent = model.display_name || model.slug || "未命名模型";
    if (slug) slug.textContent = model.slug || "";
    if (description) description.textContent = model.description || "（暂无描述）";
  }

  /* ---------------------------------------------------------------- */
  /* Import / Export / Reset                                          */
  /* ---------------------------------------------------------------- */

  function catalogJson() {
    return JSON.stringify({ models: catalog }, null, 2);
  }

  function catalogIsReady(actionLabel) {
    commitPendingEdit();
    const validation = validateCatalog(catalog);
    renderValidation(validation);
    if (jsonDrafts.size || validation.errors.length) {
      if (jsonDrafts.size) revealFirstJsonDraft();
      toast(jsonDrafts.size ? `无法${actionLabel}：请先修复无效 JSON` : `无法${actionLabel}：还有 ${validation.errors.length} 个配置错误`, "err");
      return false;
    }
    return true;
  }

  function exportJson() {
    if (!catalogIsReady("导出")) return false;
    const blob = new Blob([catalogJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cc-switch-model-catalog.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 800);
    toast("已导出 JSON 文件", "ok");
    return true;
  }

  function importFromText(text) {
    const data = JSON.parse(text);
    const models = Array.isArray(data) ? data : data && data.models;
    if (!Array.isArray(models)) throw new Error("文件中没有 models 数组");
    const next = models.map(deepClone);
    const validation = validateCatalog(next);
    if (validation.errors.length) throw new Error(validation.errors.slice(0, 3).map((issue) => issue.message).join("；"));
    commitPendingEdit();
    history.push(serializeHistoryState());
    future = [];
    catalog = next;
    original = deepClone(next);
    modelRefs = catalog.map((model) => model.slug);
    selectedIndex = catalog.length ? 0 : -1;
    jsonDrafts.clear();
    committedSnapshot = serializeState();
    persistBaseline();
    persist();
    renderAll();
    toast(`导入成功：${catalog.length} 个模型`, "ok");
  }

  function resetCatalog() {
    if (!confirm("确定放弃当前修改，恢复为最近一次导入或内置目录的基线吗？恢复后仍可使用「撤销」。")) return;
    mutate(() => {
      jsonDrafts.clear();
      catalog = deepClone(original);
      modelRefs = catalog.map((model) => model.slug);
      selectedIndex = catalog.length ? 0 : -1;
    });
    toast("已恢复目录基线", "ok");
  }

  /* ---------------------------------------------------------------- */
  /* UI wiring                                                        */
  /* ---------------------------------------------------------------- */

  function updateTabUI() {
    document.querySelectorAll(".tab").forEach((tab) => {
      const active = tab.dataset.tab === activeTab;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    document.querySelectorAll(".tab-panel").forEach((panel) => {
      const active = panel.id === "tab-" + activeTab;
      panel.classList.toggle("active", active);
      panel.hidden = !active;
    });
  }

  function closeOverflowActions() {
    const menu = document.getElementById("overflowActions");
    const button = document.getElementById("btnMoreActions");
    menu?.classList.remove("open");
    button?.setAttribute("aria-expanded", "false");
  }

  function updateActiveModuleNav() {
    if (activeTab !== "editor") return;
    const sections = [...document.querySelectorAll("#editorRoot .module")];
    if (!sections.length) return;
    const toolbar = document.querySelector(".editor-toolbar");
    const threshold = (toolbar?.getBoundingClientRect().bottom || 0) + 28;
    let current = sections[0];
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= threshold) current = section;
    });
    document.querySelectorAll("[data-module-target]").forEach((button) => {
      button.classList.toggle("active", button.dataset.moduleTarget === current.dataset.module);
    });
  }

  function renderAll() {
    updateTabUI();
    renderBulkEditor();
    renderSidebar();
    renderEditor();
    renderStats();
    renderOverview();
    renderFieldMap();
    renderValidation(validateCatalog(catalog));
    document.getElementById("showAllFields").checked = showAllFields;
    document.getElementById("editorFieldSearch").value = fieldSearchQuery;
    document.getElementById("onlyModifiedFields").checked = onlyModifiedFields;
    document.querySelectorAll(".filter-btn").forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    updateHistoryButtons();
  }

  function init() {
    if (!window.CC_CATALOG || !Array.isArray(window.CC_CATALOG.models)) {
      toast("未找到内置目录数据（catalog-data.js）", "err");
    }

    document.addEventListener("click", (e) => {
      const moreButton = e.target.closest("#btnMoreActions");
      if (moreButton) {
        const menu = document.getElementById("overflowActions");
        const open = !menu.classList.contains("open");
        menu.classList.toggle("open", open);
        moreButton.setAttribute("aria-expanded", String(open));
        return;
      }
      closeOverflowActions();

      const actionEl = e.target.closest("[data-action]");
      if (actionEl) {
        handleAction(actionEl);
        return;
      }
      const tab = e.target.closest(".tab");
      if (tab) {
        activeTab = tab.dataset.tab;
        renderAll();
        return;
      }
      const filterBtn = e.target.closest(".filter-btn");
      if (filterBtn) {
        filter = filterBtn.dataset.filter;
        renderSidebar();
        document.querySelectorAll(".filter-btn").forEach((button) => {
          const active = button.dataset.filter === filter;
          button.classList.toggle("active", active);
          button.setAttribute("aria-pressed", String(active));
        });
        return;
      }
      const sortButton = e.target.closest("[data-sort]");
      if (sortButton) {
        const key = sortButton.dataset.sort;
        if (sortKey === key) sortDir *= -1;
        else {
          sortKey = key;
          sortDir = 1;
        }
        renderOverview();
        return;
      }
      const moduleHead = e.target.closest(".module-head");
      if (moduleHead) {
        revealModule(moduleHead.closest(".module"));
        return;
      }
      const moduleButton = e.target.closest("[data-module-target]");
      if (moduleButton) {
        const section = document.querySelector(`[data-module="${cssEsc(moduleButton.dataset.moduleTarget)}"]`);
        revealModule(section);
        document.querySelectorAll("[data-module-target]").forEach((button) => button.classList.toggle("active", button === moduleButton));
        return;
      }
      const bulkChoice = e.target.closest("[data-bulk-value]");
      if (bulkChoice) {
        bulkValue = JSON.parse(bulkChoice.dataset.bulkValue);
        renderBulkEditor();
        return;
      }
      if (e.target.closest("#btnBulkApply")) {
        applyBulkCorrection();
        return;
      }
      if (e.target.closest("#btnImport")) {
        document.getElementById("fileImport").click();
        return;
      }
      if (e.target.closest("#btnExport")) {
        exportJson();
        return;
      }
      if (e.target.closest("#btnReset")) {
        resetCatalog();
        return;
      }
      if (e.target.closest("#btnUndo")) {
        undo();
        return;
      }
      if (e.target.closest("#btnRedo")) {
        redo();
        return;
      }
      if (e.target.closest("#btnAddModel")) {
        let m;
        mutate(() => {
          m = defaultNewModel();
          catalog.push(m);
          modelRefs.push(null);
          selectedIndex = catalog.length - 1;
        });
        toast("已新建模型 " + m.slug, "ok");
        return;
      }
    });

    document.addEventListener("input", (e) => {
      const t = e.target;
      if (t.id === "search") {
        searchQuery = t.value;
        renderSidebar();
        return;
      }
      if (t.id === "editorFieldSearch") {
        fieldSearchQuery = t.value;
        renderEditor();
        renderValidation(validateCatalog(catalog));
        return;
      }
      if (t.matches("[data-bulk-input]")) {
        bulkValue = t.value.trim() === "" ? null : Number(t.value);
        renderBulkPreview();
        return;
      }
      if (t.matches("[data-bind]")) {
        handleBindInput(t);
        return;
      }
      if (t.matches("[data-list-bind]")) {
        handleListInput(t);
        return;
      }
      if (t.matches("[data-var-bind]")) {
        handleVarInput(t);
        return;
      }
      if (t.matches("[data-chip-input]")) {
        if (e.key === "Enter") return;
        return;
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.getElementById("overflowActions").classList.contains("open")) {
        closeOverflowActions();
        document.getElementById("btnMoreActions").focus();
        return;
      }
      const moduleHead = e.target.closest(".module-head");
      if (moduleHead && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        revealModule(moduleHead.closest(".module"));
        return;
      }
      const activeTabButton = e.target.closest('[role="tab"]');
      if (activeTabButton && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
        e.preventDefault();
        const tabs = [...document.querySelectorAll('[role="tab"]')];
        const current = tabs.indexOf(activeTabButton);
        const next = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (current + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
        tabs[next].focus();
        tabs[next].click();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
        e.preventDefault();
        redo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        exportJson();
        return;
      }
      if (e.key === "Enter" && e.target.matches("[data-chip-input]")) {
        const path = e.target.dataset.chipInput;
        mutate(() => addChip(path));
      }
    });

    document.addEventListener("change", (e) => {
      const t = e.target;
      if (t.id === "showAllFields") {
        showAllFields = t.checked;
        renderEditor();
        renderFieldMap();
        renderValidation(validateCatalog(catalog));
        return;
      }
      if (t.id === "bulkField") {
        bulkFieldKey = t.value;
        bulkValue = bulkValueForField(fieldDef(bulkFieldKey));
        renderBulkEditor();
        return;
      }
      if (t.id === "bulkIncludeMissing") {
        bulkIncludeMissing = t.checked;
        renderBulkPreview();
        return;
      }
      if (t.id === "onlyModifiedFields") {
        onlyModifiedFields = t.checked;
        renderEditor();
        renderValidation(validateCatalog(catalog));
        return;
      }
      if (t.matches("[data-bind-select]")) {
        const model = getModel();
        if (model) {
          setPath(model, t.dataset.bindSelect, t.value);
          syncEditedField(t);
          scheduleLight();
        }
      }
    });

    document.getElementById("fileImport").addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          importFromText(String(reader.result));
        } catch (err) {
          toast("导入失败：" + err.message, "err");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    });

    window.addEventListener("pagehide", () => {
      clearTimeout(saveTimer);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
        localStorage.setItem(MODEL_REFS_KEY, JSON.stringify(modelRefs));
      } catch (_e) {
        /* The page is leaving, so there is no reliable UI surface for an error. */
      }
    });

    window.addEventListener("scroll", updateActiveModuleNav, { passive: true });
    renderAll();
    setSaveStatus("saved");
    if (recoveredSavedIssueCount) toast(`已恢复上次未完成的编辑，其中有 ${recoveredSavedIssueCount} 个配置错误`, "err");
    else if (discardedSavedCatalog) toast("本地保存的数据结构损坏，已改用内置目录", "err");
  }

  init();
})();
