#!/usr/bin/env node
// Claude Code PreToolUse hook. Blocks file edits outside the allowlist of CONTRIB_ROLE.
// Exit code 2 = block the tool call and show stderr to the agent.
const { toRepoRelative, isAllowed, loadMap } = require("./scope-lib");

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0); // not a tool payload; do not block
  }

  const target = input?.tool_input?.file_path || input?.tool_input?.notebook_path;
  if (!target) process.exit(0);

  const role = (process.env.CONTRIB_ROLE || "").toLowerCase();
  const roles = loadMap();

  if (!roles[role]) {
    console.error(
      `SCOPE GUARD: CONTRIB_ROLE is "${role || "unset"}". Set it to one of: ${Object.keys(roles).join(", ")}. ` +
        `Edits are blocked until the role is known. Do not work around this; ask the human.`
    );
    process.exit(2);
  }

  const rel = toRepoRelative(target);
  if (rel.startsWith("..")) {
    console.error(`SCOPE GUARD: "${target}" is outside the repository. Edit blocked.`);
    process.exit(2);
  }

  if (!isAllowed(role, rel)) {
    console.error(
      `SCOPE GUARD: role "${role}" may not modify "${rel}". Allowed: ${roles[role].allow.join(", ")}. ` +
        `Stop. Tell your human this needs Ramansh (open an issue or ask in the PR). Do not edit it another way.`
    );
    process.exit(2);
  }
  process.exit(0);
});
