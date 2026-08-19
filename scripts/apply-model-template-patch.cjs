const fs = require('node:fs');

function replaceOnce(source, before, after, label) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`patch target not found: ${label}`);
  if (source.indexOf(before, first + before.length) >= 0) throw new Error(`patch target is ambiguous: ${label}`);
  return source.slice(0, first) + after + source.slice(first + before.length);
}

function replaceBetween(source, startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`patch start not found: ${label}`);
  const end = source.indexOf(endMarker, start);
  if (end < 0) throw new Error(`patch end not found: ${label}`);
  return source.slice(0, start) + replacement + source.slice(end);
}

let app = fs.readFileSync('app.js', 'utf8');

app = replaceOnce(
  app,
  '  const SCHEMA = window.CC_MODEL_SCHEMA;\n  if (!SCHEMA) throw new Error("model-schema.js 未加载");\n  const REASONING_LEVELS = SCHEMA.ENUMS.reasoningEffort;',
  '  const SCHEMA = window.CC_MODEL_SCHEMA;\n  if (!SCHEMA) throw new Error("model-schema.js 未加载");\n  const TEMPLATES = window.CC_MODEL_TEMPLATES;\n  if (!TEMPLATES) throw new Error("model-templates.js 未加载");\n  const REASONING_LEVELS = SCHEMA.ENUMS.reasoningEffort;',
  'template bootstrap'
);

app = replaceBetween(
  app,
  '  function defaultNewModel() {',
  '  function isPlainObject(value) {',
  `  function defaultNewModel() {
    const templateId = document.getElementById("modelTemplateSelect")?.value || "blank";
    const sourceCatalog = window.CC_CATALOG && Array.isArray(window.CC_CATALOG.models) ? window.CC_CATALOG.models : catalog;
    const model = TEMPLATES.createTemplate(templateId, sourceCatalog);
    const baseSlug = model.slug || "custom-model";
    let slug = baseSlug;
    let copyNo = 2;
    if (catalog.some((item) => item.slug === slug)) {
      slug = baseSlug + "-copy";
      while (catalog.some((item) => item.slug === slug)) slug = baseSlug + "-copy-" + copyNo++;
      model.display_name = (model.display_name || baseSlug) + " (模板)";
    }
    model.slug = slug;
    model.priority = Math.max(1000, ...catalog.map((item) => Number(item.priority) || 0)) + 1;
    return model;
  }

`,
  'defaultNewModel template integration'
);

fs.writeFileSync('app.js', app);
