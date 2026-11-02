// Shared helpers for scope enforcement. No dependencies.
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MAP_PATH = path.join(ROOT, ".github", "scope-map.json");

function loadMap() {
  return JSON.parse(fs.readFileSync(MAP_PATH, "utf8")).roles;
}

// Supports "**" (everything), "dir/**" (anything under dir) and exact paths.
function matches(pattern, file) {
  if (pattern === "**") return true;
  if (pattern.endsWith("/**")) {
    const prefix = pattern.slice(0, -3);
    return file === prefix || file.startsWith(prefix + "/");
  }
  return file === pattern;
}

function toRepoRelative(p) {
  const abs = path.resolve(ROOT, p);
  return path.relative(ROOT, abs).split(path.sep).join("/");
}

function isAllowed(role, file) {
  const roles = loadMap();
  const def = roles[role];
  if (!def) return false;
  if ((def.deny || []).some((p) => matches(p, file))) return false;
  return def.allow.some((p) => matches(p, file));
}

module.exports = { loadMap, matches, toRepoRelative, isAllowed, ROOT };
