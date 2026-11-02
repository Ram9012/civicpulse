#!/usr/bin/env node
// CI check: fail if a PR changes files outside its author's allowlist.
// Usage: node scripts/check-scope.js <github-username> <file1> <file2> ...
//   or:  PR_AUTHOR=name CHANGED_FILES="a\nb" node scripts/check-scope.js
const { loadMap, matches } = require("./scope-lib");
const isOk = (def, f) => !(def.deny || []).some((p) => matches(p, f)) && def.allow.some((p) => matches(p, f));

const author = (process.argv[2] || process.env.PR_AUTHOR || "").toLowerCase();
const files = process.argv.length > 3
  ? process.argv.slice(3)
  : (process.env.CHANGED_FILES || "").split("\n").map((f) => f.trim()).filter(Boolean);

if (!author) {
  console.error("No PR author given.");
  process.exit(1);
}

const roles = loadMap();
const roleName = Object.keys(roles).find((r) =>
  roles[r].github.some((g) => g.toLowerCase() === author)
);

if (!roleName) {
  console.error(
    `"${author}" is not listed in .github/scope-map.json. Ask the Architect to add you before opening PRs.`
  );
  process.exit(1);
}

const allow = roles[roleName].allow;
const violations = files.filter((f) => !isOk(roles[roleName], f));

if (violations.length) {
  console.error(`Scope violation: ${author} (${roleName}) changed files outside ${allow.join(", ")}:`);
  violations.forEach((v) => console.error(`  - ${v}`));
  process.exit(1);
}
console.log(`OK: ${files.length} file(s) within ${roleName} scope.`);
