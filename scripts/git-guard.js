#!/usr/bin/env node
// Claude Code PreToolUse hook for Bash. Stops agents other than Ramansh from pushing directly to main.
// Ramansh (CONTRIB_ROLE=ramansh) is unrestricted. Pushing feature branches is allowed for everyone.
// Exit code 2 = block and show stderr to the agent.
const { execSync } = require("child_process");

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let cmd = "";
  try {
    cmd = JSON.parse(raw)?.tool_input?.command || "";
  } catch {
    process.exit(0);
  }

  if ((process.env.CONTRIB_ROLE || "").toLowerCase() === "ramansh") process.exit(0);

  // Look at each shell segment that is a `git push`.
  const segments = cmd.split(/&&|\|\||;|\n|\|/);
  for (const seg of segments) {
    const m = seg.match(/\bgit\b(?:\s+-\S+(?:\s+\S+)?)*\s+push\b(.*)/);
    if (!m) continue;
    const args = m[1].trim().split(/\s+/).filter(Boolean);
    const positional = args.filter((a) => !a.startsWith("-"));
    const refs = positional.slice(1); // first positional is the remote
    let current = "";
    try {
      current = execSync("git rev-parse --abbrev-ref HEAD", { stdio: ["ignore", "pipe", "ignore"] })
        .toString()
        .trim();
    } catch {
      /* not a repo */
    }

    const isMain = (r) => /(^|:|\/)(main|master|dev)$/.test(r);
    const pushesAll = args.includes("--all") || args.includes("--mirror");
    const hitsMain = refs.length ? refs.some(isMain) : isMain(current) || current === "";

    if (hitsMain || pushesAll) {
      console.error(
        "GIT GUARD: pushing directly to main or dev is not allowed for your role. " +
          "Create a branch (feat/<name>-<topic>), push that branch, and open a PR. Target the PR at dev. Ramansh merges."
      );
      process.exit(2);
    }
  }
  process.exit(0);
});
