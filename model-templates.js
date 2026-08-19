(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.CC_MODEL_TEMPLATES = api;
    if (root.CC_CATALOG && Array.isArray(root.CC_CATALOG.models)) api.applyBuiltInDefaults(root.CC_CATALOG.models);
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const TEMPLATE_DEFS = Object.freeze([
    { id: "blank", label: "空白模型", source: "builtin" },
    { id: "openai-compatible", label: "通用 OpenAI-Compatible", source: "builtin" },
    { id: "gpt-5.6-sol", label: "GPT-5.6 Sol", source: "catalog" },
    { id: "gpt-5.6-terra", label: "GPT-5.6 Terra", source: "catalog" },
    { id: "gpt-5.6-luna", label: "GPT-5.6 Luna", source: "catalog" },
    { id: "grok-4.6", label: "Grok 4.6", source: "builtin" },
    { id: "deepseek-v4-flash", label: "DeepSeek V4 Flash", source: "catalog" },
    { id: "deepseek-v4-pro", label: "DeepSeek V4 Pro", source: "catalog" }
  ]);

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function baseInstructions() {
    return "You are Codex, a coding agent. You and the user share the same workspace and collaborate to achieve the user's goals.";
  }

  function modelMessages() {
    return {
      instructions_template: baseInstructions(),
      instructions_variables: null,
      approvals: null,
      collaboration_modes: null,
      auto_review: null,
      permissions: null,
      multi_agent: null,
      token_budget: null,
      guardian_v2: null
    };
  }

  function blankTemplate() {
    return {
      slug: "custom-model",
      display_name: "自定义模型",
      description: "",
      default_reasoning_level: null,
      supported_reasoning_levels: [],
      shell_type: "shell_command",
      visibility: "list",
      supported_in_api: true,
      priority: 0,
      additional_speed_tiers: [],
      service_tiers: [],
      default_service_tier: null,
      availability_nux: null,
      upgrade: null,
      model_messages: modelMessages(),
      include_skills_usage_instructions: true,
      include_plugin_usage_instructions: false,
      include_apps_usage_instructions: false,
      supports_reasoning_summary_parameter: true,
      default_reasoning_summary: "auto",
      support_verbosity: false,
      default_verbosity: null,
      apply_patch_tool_type: "freeform",
      web_search_tool_type: "text",
      truncation_policy: { mode: "tokens", limit: 10000 },
      supports_image_detail_original: false,
      context_window: 272000,
      max_context_window: 272000,
      auto_compact_token_limit: null,
      comp_hash: null,
      effective_context_window_percent: 95,
      experimental_supported_tools: [],
      input_modalities: ["text"],
      supports_search_tool: false,
      use_responses_lite: false,
      node_repl_auto_review_required: false,
      node_repl_disabled: false,
      auto_review_model_override: null,
      model_specialty: null,
      tool_mode: null,
      multi_agent_version: null
    };
  }

  function openAICompatibleTemplate() {
    const model = blankTemplate();
    model.slug = "openai-compatible-model";
    model.display_name = "OpenAI-Compatible 模型";
    model.description = "Conservative starting point for a Responses-compatible third-party model.";
    model.default_reasoning_level = "medium";
    model.supported_reasoning_levels = [
      { effort: "low", description: "Faster responses with lighter reasoning" },
      { effort: "medium", description: "Balanced reasoning for general tasks" },
      { effort: "high", description: "Deeper reasoning for complex tasks" }
    ];
    model.support_verbosity = true;
    model.default_verbosity = "medium";
    model.input_modalities = ["text", "image"];
    return model;
  }

  function grok46Template() {
    const model = blankTemplate();
    model.slug = "grok-4.6";
    model.display_name = "Grok 4.6";
    model.description = "xAI Grok Build default frontier model for coding, agentic tasks, and knowledge work.";
    model.default_reasoning_level = "high";
    model.supported_reasoning_levels = [
      { effort: "low", description: "Quick implementations and latency-sensitive tool use" },
      { effort: "medium", description: "Balanced reasoning for complex analysis and implementation" },
      { effort: "high", description: "Default deep reasoning for challenging tasks" },
      { effort: "xhigh", description: "Highest reasoning effort exposed by Grok Build" }
    ];
    model.service_tiers = [
      { id: "priority", name: "Priority", description: "Higher scheduling priority via xAI Priority Processing" }
    ];
    model.default_service_tier = null;
    model.context_window = 500000;
    model.max_context_window = 500000;
    model.auto_compact_token_limit = 400000;
    model.input_modalities = ["text", "image"];
    model.supports_search_tool = true;
    model.web_search_tool_type = "text";
    model.supports_reasoning_summary_parameter = true;
    model.default_reasoning_summary = "auto";
    model.support_verbosity = false;
    model.default_verbosity = null;
    model.supports_image_detail_original = false;
    model.use_responses_lite = false;
    model.comp_hash = null;
    model.tool_mode = null;
    model.multi_agent_version = null;
    return model;
  }

  function listTemplates() {
    return TEMPLATE_DEFS.map(deepClone);
  }

  function findCatalogModel(catalog, slug) {
    return Array.isArray(catalog) ? catalog.find((model) => model && model.slug === slug) : null;
  }

  function createTemplate(id, catalog) {
    if (id === "blank") return blankTemplate();
    if (id === "openai-compatible") return openAICompatibleTemplate();
    if (id === "grok-4.6") return grok46Template();

    const source = findCatalogModel(catalog, id);
    if (!source) throw new Error(`模板来源模型不存在：${id}`);
    return deepClone(source);
  }

  function applyBuiltInDefaults(catalog) {
    const current = findCatalogModel(catalog, "grok-4.6");
    if (!current) return catalog;

    const defaults = grok46Template();
    const preserved = {
      priority: current.priority,
      model_messages: current.model_messages,
      base_instructions: current.base_instructions,
      availability_nux: current.availability_nux,
      upgrade: current.upgrade
    };
    Object.assign(current, defaults);
    for (const [key, value] of Object.entries(preserved)) {
      if (value !== undefined) current[key] = value;
    }
    return catalog;
  }

  return {
    listTemplates,
    createTemplate,
    applyBuiltInDefaults
  };
});
