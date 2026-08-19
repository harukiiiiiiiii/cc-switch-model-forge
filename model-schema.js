(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.CC_MODEL_SCHEMA = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const ENUMS = Object.freeze({
    reasoningEffort: Object.freeze(["none", "minimal", "low", "medium", "high", "xhigh", "max", "ultra"]),
    visibility: Object.freeze(["list", "hide", "none"]),
    shellType: Object.freeze(["default", "local", "unified_exec", "disabled", "shell_command"]),
    reasoningSummary: Object.freeze(["auto", "concise", "detailed", "none"]),
    verbosity: Object.freeze(["low", "medium", "high"]),
    toolMode: Object.freeze(["direct", "code_mode", "code_mode_only"]),
    multiAgentVersion: Object.freeze(["disabled", "v1", "v2"]),
    inputModality: Object.freeze(["text", "image", "audio"]),
    truncationMode: Object.freeze(["bytes", "tokens"]),
    webSearchToolType: Object.freeze(["text", "text_and_image"]),
    applyPatchToolType: Object.freeze(["freeform"])
  });

  const REQUIRED_FIELDS = Object.freeze([
    "slug",
    "display_name",
    "supported_reasoning_levels",
    "shell_type",
    "visibility",
    "supported_in_api",
    "priority",
    "support_verbosity",
    "truncation_policy",
    "experimental_supported_tools"
  ]);

  const REQUIRED_BOOL_FIELDS = new Set(["supported_in_api", "support_verbosity"]);
  const DEFAULTABLE_BOOL_FIELDS = new Set([
    "include_skills_usage_instructions",
    "include_plugin_usage_instructions",
    "include_apps_usage_instructions",
    "supports_reasoning_summary_parameter",
    "supports_image_detail_original",
    "supports_search_tool",
    "use_responses_lite",
    "node_repl_auto_review_required",
    "node_repl_disabled"
  ]);

  const MODEL_MESSAGE_OBJECT_FIELDS = [
    "approvals",
    "collaboration_modes",
    "auto_review",
    "permissions",
    "multi_agent",
    "token_budget",
    "guardian_v2"
  ];

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function isInteger(value) {
    return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value);
  }

  function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  function nonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function optionalString(value) {
    return value === undefined || value === null || typeof value === "string";
  }

  function optionalInteger(value, minimum) {
    return value === undefined || value === null || (isInteger(value) && (minimum === undefined || value >= minimum));
  }

  function defaultFieldValue(key, type) {
    switch (type) {
      case "text":
      case "textarea":
        return "";
      case "enumInput":
        return null;
      case "number":
        return 0;
      case "nullableNumber":
        return null;
      case "triBool":
        return true;
      case "chipList":
      case "modalityList":
        return [];
      case "reasoningList":
        return [{ effort: "medium", description: "" }];
      case "serviceList":
        return [{ id: "", name: "", description: "" }];
      case "truncation":
        return { mode: "tokens", limit: 10000 };
      case "nullableObject":
        if (key === "availability_nux") return { message: "" };
        if (key === "upgrade") return { model: "", migration_markdown: "" };
        return {};
      case "modelMessages":
        return defaultModelMessages();
      case "jsonObj":
        return null;
      default:
        return "";
    }
  }

  function defaultModelMessages() {
    return {
      instructions_template: "",
      instructions_variables: {
        personality_default: "",
        personality_friendly: "",
        personality_pragmatic: ""
      },
      approvals: null,
      collaboration_modes: null,
      auto_review: null,
      permissions: null,
      multi_agent: null,
      token_budget: null,
      guardian_v2: null
    };
  }

  function validateInstructionVariables(value, add, index) {
    if (value === undefined || value === null) return;
    if (!isPlainObject(value)) {
      add("error", index, "model_messages.instructions_variables", "指令变量必须是对象或 null");
      return;
    }
    const allowed = ["personality_default", "personality_friendly", "personality_pragmatic"];
    for (const [key, item] of Object.entries(value)) {
      if (!allowed.includes(key)) {
        add("warning", index, "model_messages.instructions_variables", `未识别的指令变量：${key}`);
      }
      if (item !== null && typeof item !== "string") {
        add("error", index, "model_messages.instructions_variables", `${key} 必须是字符串或 null`);
      }
    }
  }

  function validateOptionalMessageObject(value, path, add, index, allowedKeys) {
    if (value === undefined || value === null) return;
    if (!isPlainObject(value)) {
      add("error", index, path, `${path} 必须是对象或 null`);
      return;
    }
    if (!allowedKeys) return;
    for (const [key, item] of Object.entries(value)) {
      if (!allowedKeys.includes(key)) add("warning", index, path, `${path} 含未识别字段：${key}`);
      if (item !== null && typeof item !== "string") add("error", index, path, `${path}.${key} 必须是字符串或 null`);
    }
  }

  function validateMultiAgent(value, add, index) {
    const path = "model_messages.multi_agent";
    if (value === undefined || value === null) return;
    if (!isPlainObject(value)) {
      add("error", index, path, "multi_agent 必须是对象或 null");
      return;
    }
    for (const key of ["role", "mode"]) {
      if (!hasOwn(value, key) || value[key] === null || value[key] === undefined) continue;
      if (!isPlainObject(value[key])) {
        add("error", index, path, `multi_agent.${key} 必须是对象或 null`);
        continue;
      }
      const allowed = key === "role" ? ["root", "subagent"] : ["explicit", "hint_text"];
      for (const [subKey, subValue] of Object.entries(value[key])) {
        if (!allowed.includes(subKey)) add("warning", index, path, `multi_agent.${key} 含未识别字段：${subKey}`);
        if (subValue !== null && typeof subValue !== "string") add("error", index, path, `multi_agent.${key}.${subKey} 必须是字符串或 null`);
      }
    }
  }

  function validateTokenBudget(value, add, index) {
    const path = "model_messages.token_budget";
    if (value === undefined || value === null) return;
    if (!isPlainObject(value)) {
      add("error", index, path, "token_budget 必须是对象或 null");
      return;
    }
    const integerKeys = ["reminder_threshold_tokens", "auto_compact_fallback_buffer_tokens"];
    const stringKeys = ["reminder_message_template", "guidance_message", "auto_compact_fallback_prompt"];
    for (const key of integerKeys) {
      if (!isInteger(value[key]) || value[key] < 0) add("error", index, path, `token_budget.${key} 必须是非负整数`);
    }
    for (const key of stringKeys) {
      if (typeof value[key] !== "string") add("error", index, path, `token_budget.${key} 必须是字符串`);
    }
  }

  function validateGuardianTranscript(value, add, index) {
    const path = "model_messages.guardian_v2";
    if (value === undefined || value === null) return;
    if (!isPlainObject(value)) {
      add("error", index, path, "guardian_v2.transcript 必须是对象或 null");
      return;
    }
    if (value.sources !== undefined && value.sources !== null) {
      if (!Array.isArray(value.sources) || value.sources.some((item) => !nonEmptyString(item))) {
        add("error", index, path, "guardian_v2.transcript.sources 必须是非空字符串数组");
      }
    }
    for (const key of [
      "max_message_entry_tokens",
      "max_tool_entry_tokens",
      "max_message_transcript_tokens",
      "max_tool_transcript_tokens",
      "max_recent_non_user_entries"
    ]) {
      if (!optionalInteger(value[key], 0)) add("error", index, path, `guardian_v2.transcript.${key} 必须是非负整数或 null`);
    }
  }

  function validateGuardianV2(value, add, index) {
    const path = "model_messages.guardian_v2";
    if (value === undefined || value === null) return;
    if (!isPlainObject(value)) {
      add("error", index, path, "guardian_v2 必须是对象或 null");
      return;
    }
    if (!optionalString(value.classifier_instructions)) add("error", index, path, "guardian_v2.classifier_instructions 必须是字符串或 null");
    if (!optionalInteger(value.review_threshold_basis_points, 0) || (isInteger(value.review_threshold_basis_points) && value.review_threshold_basis_points > 10000)) {
      add("error", index, path, "guardian_v2.review_threshold_basis_points 必须在 0 到 10000 之间");
    }
    if (value.reasoning_effort !== undefined && value.reasoning_effort !== null && !nonEmptyString(value.reasoning_effort)) {
      add("error", index, path, "guardian_v2.reasoning_effort 必须是非空字符串或 null");
    }
    for (const key of ["max_action_tokens", "max_classifier_instruction_tokens", "max_parent_compaction_tokens"]) {
      if (!optionalInteger(value[key], 0)) add("error", index, path, `guardian_v2.${key} 必须是非负整数或 null`);
    }
    validateGuardianTranscript(value.transcript, add, index);
  }

  function validateModelMessages(model, add, index) {
    const mm = model.model_messages;
    if (mm !== undefined && mm !== null && !isPlainObject(mm)) {
      add("error", index, "model_messages", "模型消息必须是对象或 null");
      return;
    }
    const canonical = isPlainObject(mm) && nonEmptyString(mm.instructions_template);
    const legacy = nonEmptyString(model.base_instructions);
    if (!canonical && !legacy) {
      add("error", index, "model_messages.instructions_template", "必须提供 model_messages.instructions_template 或 legacy base_instructions");
    }
    if (!isPlainObject(mm)) return;
    if (mm.instructions_template !== undefined && mm.instructions_template !== null && typeof mm.instructions_template !== "string") {
      add("error", index, "model_messages.instructions_template", "instructions_template 必须是字符串或 null");
    }
    validateInstructionVariables(mm.instructions_variables, add, index);
    validateOptionalMessageObject(mm.approvals, "model_messages.approvals", add, index, ["on_request", "on_request_auto_review", "never", "unless_trusted"]);
    validateOptionalMessageObject(mm.collaboration_modes, "model_messages.collaboration_modes", add, index, ["default", "plan"]);
    validateOptionalMessageObject(mm.auto_review, "model_messages.auto_review", add, index, ["policy", "policy_template"]);
    validateOptionalMessageObject(mm.permissions, "model_messages.permissions", add, index, ["danger_full_access", "workspace_write", "read_only"]);
    validateMultiAgent(mm.multi_agent, add, index);
    validateTokenBudget(mm.token_budget, add, index);
    validateGuardianV2(mm.guardian_v2, add, index);
  }

  function validateCatalog(models) {
    const errors = [];
    const warnings = [];
    const add = (severity, modelIndex, path, message) => {
      (severity === "error" ? errors : warnings).push({ modelIndex, path, message });
    };
    if (!Array.isArray(models)) {
      return { errors: [{ modelIndex: -1, path: "models", message: "models 必须是数组" }], warnings };
    }

    const seenSlugs = new Map();
    const seenPriorities = new Set();
    models.forEach((model, index) => {
      if (!isPlainObject(model)) {
        add("error", index, "", `第 ${index + 1} 项必须是对象`);
        return;
      }

      for (const key of REQUIRED_FIELDS) {
        if (!hasOwn(model, key)) add("error", index, key, `${key} 为 Codex ModelInfo 必填字段`);
      }

      if (!nonEmptyString(model.slug)) {
        add("error", index, "slug", "slug 不能为空");
      } else {
        if (!/^[a-z0-9][a-z0-9._-]*$/i.test(model.slug)) add("error", index, "slug", "slug 只能包含字母、数字、点、下划线和连字符");
        if (seenSlugs.has(model.slug)) {
          add("error", seenSlugs.get(model.slug), "slug", `slug 重复：${model.slug}`);
          add("error", index, "slug", `slug 重复：${model.slug}`);
        } else {
          seenSlugs.set(model.slug, index);
        }
      }

      if (hasOwn(model, "display_name") && typeof model.display_name !== "string") add("error", index, "display_name", "display_name 必须是字符串");
      if (model.description !== undefined && model.description !== null && typeof model.description !== "string") add("error", index, "description", "description 必须是字符串或 null");

      if (hasOwn(model, "shell_type") && !ENUMS.shellType.includes(model.shell_type)) add("error", index, "shell_type", `shell_type 无效：${model.shell_type}`);
      if (hasOwn(model, "visibility") && !ENUMS.visibility.includes(model.visibility)) add("error", index, "visibility", `visibility 无效：${model.visibility}`);
      if (hasOwn(model, "priority")) {
        if (!isInteger(model.priority)) add("error", index, "priority", "priority 必须是整数");
        else if (seenPriorities.has(model.priority)) add("warning", index, "priority", `优先级重复：${model.priority}`);
        else seenPriorities.add(model.priority);
      }

      for (const key of REQUIRED_BOOL_FIELDS) {
        if (hasOwn(model, key) && typeof model[key] !== "boolean") add("error", index, key, `${key} 必须是 true 或 false，不能显式为 null`);
      }
      for (const key of DEFAULTABLE_BOOL_FIELDS) {
        if (hasOwn(model, key) && typeof model[key] !== "boolean") add("error", index, key, `${key} 如存在必须是 true 或 false；使用默认值请删除字段而不是写 null`);
      }

      if (model.default_reasoning_level !== undefined && model.default_reasoning_level !== null && !nonEmptyString(model.default_reasoning_level)) {
        add("error", index, "default_reasoning_level", "default_reasoning_level 必须是非空字符串或 null");
      }
      if (hasOwn(model, "supported_reasoning_levels")) {
        if (!Array.isArray(model.supported_reasoning_levels)) {
          add("error", index, "supported_reasoning_levels", "supported_reasoning_levels 必须是数组");
        } else {
          const efforts = [];
          model.supported_reasoning_levels.forEach((row, rowIndex) => {
            if (!isPlainObject(row) || !nonEmptyString(row.effort) || typeof row.description !== "string") {
              add("error", index, "supported_reasoning_levels", `第 ${rowIndex + 1} 个推理等级必须包含非空 effort 和字符串 description`);
            } else {
              efforts.push(row.effort);
            }
          });
          if (model.default_reasoning_level && !efforts.includes(model.default_reasoning_level)) {
            add("error", index, "default_reasoning_level", "默认推理等级不在支持列表中");
          }
        }
      }

      if (model.default_reasoning_summary !== undefined && model.default_reasoning_summary !== null && !ENUMS.reasoningSummary.includes(model.default_reasoning_summary)) {
        add("error", index, "default_reasoning_summary", `default_reasoning_summary 无效：${model.default_reasoning_summary}`);
      }
      if (model.default_verbosity !== undefined && model.default_verbosity !== null && !ENUMS.verbosity.includes(model.default_verbosity)) {
        add("error", index, "default_verbosity", `default_verbosity 无效：${model.default_verbosity}`);
      }
      if (model.apply_patch_tool_type !== undefined && model.apply_patch_tool_type !== null && !ENUMS.applyPatchToolType.includes(model.apply_patch_tool_type)) {
        add("error", index, "apply_patch_tool_type", `apply_patch_tool_type 无效：${model.apply_patch_tool_type}`);
      }
      if (model.web_search_tool_type !== undefined && !ENUMS.webSearchToolType.includes(model.web_search_tool_type)) {
        add("error", index, "web_search_tool_type", `web_search_tool_type 无效：${model.web_search_tool_type}`);
      }
      if (model.tool_mode !== undefined && model.tool_mode !== null && !ENUMS.toolMode.includes(model.tool_mode)) {
        add("error", index, "tool_mode", `tool_mode 无效：${model.tool_mode}`);
      }
      if (model.multi_agent_version !== undefined && model.multi_agent_version !== null && !ENUMS.multiAgentVersion.includes(model.multi_agent_version)) {
        add("error", index, "multi_agent_version", `multi_agent_version 无效：${model.multi_agent_version}`);
      }

      for (const key of ["additional_speed_tiers", "experimental_supported_tools"]) {
        if (hasOwn(model, key) && (!Array.isArray(model[key]) || model[key].some((item) => !nonEmptyString(item)))) {
          add("error", index, key, `${key} 必须是非空字符串数组`);
        }
      }
      if (model.input_modalities !== undefined) {
        if (!Array.isArray(model.input_modalities) || model.input_modalities.some((item) => !ENUMS.inputModality.includes(item))) {
          add("error", index, "input_modalities", `input_modalities 只能包含 ${ENUMS.inputModality.join(" / ")}`);
        }
      }

      if (model.service_tiers !== undefined) {
        if (!Array.isArray(model.service_tiers)) {
          add("error", index, "service_tiers", "service_tiers 必须是数组");
        } else {
          const ids = new Set();
          model.service_tiers.forEach((tier, tierIndex) => {
            if (!isPlainObject(tier) || !nonEmptyString(tier.id) || typeof tier.name !== "string" || typeof tier.description !== "string") {
              add("error", index, "service_tiers", `第 ${tierIndex + 1} 个服务层级必须包含 id、name、description`);
            } else if (ids.has(tier.id)) {
              add("error", index, "service_tiers", `服务层级 id 重复：${tier.id}`);
            } else {
              ids.add(tier.id);
            }
          });
          if (model.default_service_tier && !ids.has(model.default_service_tier)) add("warning", index, "default_service_tier", "默认服务层级不在服务层级列表中");
        }
      }

      if (hasOwn(model, "truncation_policy")) {
        const policy = model.truncation_policy;
        if (!isPlainObject(policy) || !ENUMS.truncationMode.includes(policy.mode) || !isInteger(policy.limit) || policy.limit < 0) {
          add("error", index, "truncation_policy", `truncation_policy 必须使用 ${ENUMS.truncationMode.join(" / ")} 且 limit 为非负整数`);
        }
      }

      for (const key of ["context_window", "max_context_window", "auto_compact_token_limit"]) {
        if (model[key] !== undefined && model[key] !== null && (!isInteger(model[key]) || model[key] < 0)) add("error", index, key, `${key} 必须是非负整数或 null`);
      }
      if (isInteger(model.context_window) && isInteger(model.max_context_window) && model.context_window > model.max_context_window) {
        add("error", index, "context_window", "上下文窗口不能大于允许配置覆盖的最大上下文窗口");
      }
      if (model.effective_context_window_percent !== undefined && (!isInteger(model.effective_context_window_percent) || model.effective_context_window_percent < 0 || model.effective_context_window_percent > 100)) {
        add("error", index, "effective_context_window_percent", "effective_context_window_percent 必须是 0 到 100 的整数");
      }
      if (model.comp_hash !== undefined && model.comp_hash !== null && typeof model.comp_hash !== "string") add("error", index, "comp_hash", "comp_hash 必须是字符串或 null");
      if (model.auto_review_model_override !== undefined && model.auto_review_model_override !== null && typeof model.auto_review_model_override !== "string") add("error", index, "auto_review_model_override", "auto_review_model_override 必须是字符串或 null");
      if (model.model_specialty !== undefined && model.model_specialty !== null && typeof model.model_specialty !== "string") add("error", index, "model_specialty", "model_specialty 必须是字符串或 null");

      validateModelMessages(model, add, index);

      if (isPlainObject(model.upgrade) && model.upgrade.model && !models.some((candidate) => candidate && candidate.slug === model.upgrade.model)) {
        add("warning", index, "upgrade", `升级目标不存在：${model.upgrade.model}`);
      }
    });

    return { errors, warnings };
  }

  return {
    ENUMS,
    REQUIRED_FIELDS,
    REQUIRED_BOOL_FIELDS,
    DEFAULTABLE_BOOL_FIELDS,
    MODEL_MESSAGE_OBJECT_FIELDS,
    defaultFieldValue,
    defaultModelMessages,
    validateCatalog
  };
});
