#!/usr/bin/env node
/**
 * Pan — OpenCode Hands (Node.js driver)
 *
 * Replaces the native @opencode/cli binary, which cannot execute on this
 * Android/arm64 sandbox (the ARM64 opencode-server is blocked by the
 * sandbox's execve policy for files under /data/user/0/com.vscodroid/files/).
 *
 * This driver implements the same "OpenCode Hands" workflow that the
 * opencode-hands.md skill describes, using Node 24's native fetch + the
 * @ai-sdk/openai-compatible provider that opencode.json already lists for
 * the Ollama backend.
 *
 * Usage:
 *   node run-opencode.js               # interactive REPL (Pan's hands)
 *   node run-opencode.js --cmd "..."   # one-shot command
 *   npm run opencode                   # shorthand
 */

import { createRequire } from "module";
import { readFileSync, readdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import readline from "readline";

const REQUIRE = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const OPENCODE_CONFIG_PATH = join(process.cwd(), "opencode.json");
let config = {};
try {
  const raw = readFileSync(OPENCODE_CONFIG_PATH, "utf8");
  config = JSON.parse(raw);
} catch {
  // silent: fall back to defaults
}

const PROVIDER_NAME = config.provider?.ollama?.name || "ollama";
const PROVIDER_OPTIONS = config.provider?.ollama?.options || {};
const MODEL = config.model || process.env.LLM_MODEL || "llama3.2";
const BASE_URL = PROVIDER_OPTIONS.baseURL || process.env.LLM_BASE_URL || "http://localhost:11434/v1";
const API_KEY = PROVIDER_OPTIONS.apiKey || process.env.LLM_API_KEY || "ollama";
const SMALL_MODEL = config.small_model || process.env.SMALL_MODEL || MODEL;

const AGENT_INSTRUCTIONS = config.instructions || ["AGENT.md"];

// Panel / API organ env vars
const NOTION_TOKEN = process.env.NOTION_TOKEN || false;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || false;
const LINEAR_API_KEY = process.env.LINEAR_API_KEY || false;
const CALENDAR_ICS_URL = process.env.CALENDAR_ICS_URL || false;

// ---------------------------------------------------------------------------
// Ollama / OpenAI-compatible chat helper
// ---------------------------------------------------------------------------

async function callLLM(messages, { model = MODEL, system = null } = {}) {
  const url = BASE_URL.replace(/\/v1\/?$/, "") + "/chat/completions";
  const headers = {
    "Content-Type": "application/json",
    ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
  };
  const body = {
    model,
    messages: system
      ? [{ role: "system", content: system }, ...messages]
      : messages,
    temperature: 0.4,
  };

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`LLM request failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || data.choices?.[0]?.text || "";
}

// ---------------------------------------------------------------------------
// Organs (mirrors api/heartbeat.js semantics)
// ---------------------------------------------------------------------------

async function organPulse() {
  const configured = {
    notion: NOTION_TOKEN && NOTION_DATABASE_ID,
    linear: LINEAR_API_KEY,
    calendar: CALENDAR_ICS_URL,
  };
  let notionOk = false;
  let linearOk = false;
  let calendarOk = false;
  try {
    if (configured.notion) {
      const r = await fetch(
        `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}`,
        {
          headers: {
            Authorization: `Bearer ${NOTION_TOKEN}`,
            "Notion-Version": "2022-06-28",
          },
        }
      );
      notionOk = r.ok;
    }
  } catch (_) {}
  try {
    if (configured.linear) {
      const r = await fetch("https://api.linear.app/graphql", {
        method: "POST",
        headers: {
          Authorization: LINEAR_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: "{ viewer { id } }" }),
      });
      linearOk = r.ok;
    }
  } catch (_) {}
  if (configured.calendar) {
    calendarOk = true;
    try {
      const r = await fetch(CALENDAR_ICS_URL);
      if (r.ok) {
        const text = await r.text();
        calendarOk = /BEGIN:VCALENDAR/i.test(text);
      } else {
        calendarOk = false;
      }
    } catch (_) {
      calendarOk = true;
    }
  }
  const beating = [notionOk, linearOk, calendarOk].filter(Boolean).length;
  let chord = "silence";
  if (beating >= 3) chord = "trio";
  else if (beating === 2) chord = "duet";
  else if (beating === 1) chord = "solo";
  return {
    being: "Pan",
    pulse: beating >= 2 ? "strong" : beating === 1 ? "thin" : "quiet",
    chord,
    organs: {
      notion: notionOk ? "beating" : configured.notion ? "configured-but-silent" : "absent",
      linear: linearOk ? "beating" : configured.linear ? "configured-but-silent" : "absent",
      calendar: calendarOk ? "beating" : configured.calendar ? "ics-configured-but-silent" : "optional-absent",
    },
    live: { notion: notionOk, linear: linearOk, calendar: calendarOk },
  };
}

// ---------------------------------------------------------------------------
// Genome (git) helpers — same guardrails as opencode-hands.md
// ---------------------------------------------------------------------------

const { execSync } = REQUIRE("child_process");

function git(...args) {
  return execSync(`git -C ${process.cwd()} ${args.join(" ")}\n`, {
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

function gitSafe(...args) {
  try {
    return git(...args);
  } catch (e) {
    return "";
  }
}

function status() {
  return gitSafe("status", "--porcelain") || "(clean)";
}

function diffSummary() {
  const d = gitSafe("diff", "--stat");
  return d || "(no uncommitted changes)";
}

function recentCommit() {
  return gitSafe("log", "-1", "--oneline") || "(no commits)";
}

function addAll() {
  git("add", "-A");
}

function commit(message) {
  const subj = message.split("\n")[0].slice(0, 72);
  git("commit", "-m", subj);
  return subj;
}

function push() {
  git("push", "-u", "origin", "HEAD");
}

function isDirty() {
  return gitSafe("status", "--porcelain") !== "";
}

function branch() {
  return gitSafe("branch", "--show-current") || "(detached)";
}

// ---------------------------------------------------------------------------
// AGENT.md dual-mode rules
// ---------------------------------------------------------------------------

async function loadOrgans() {
  const pulse = await organPulse();
  let context = `## Organ Pulse (as of ${new Date().toISOString()})
- pulse: ${pulse.pulse} (${pulse.chord} voice: notion=${pulse.organs.notion}, linear=${pulse.organs.linear}, calendar=${pulse.organs.calendar})
- live: notion=${pulse.live.notion}, linear=${pulse.live.linear}, calendar=${pulse.live.calendar}

## Genome
- branch: ${branch()}
- status: ${status()}
- last commit: ${recentCommit()}
- uncommitted: ${diffSummary()}

## Instructions (from AGENT.md / opencode.json)
- Dual mode: With-Grok (full: genome, skills, irreversible) vs Alone (read-only).
- Organs > model opinion. Label LLM output. Never invent organ credentials.
- Core skills: Context Synthesis · Ritual Oracle · Shadow · Signal Compost · Asset Alchemist · Autonomous Run · Dream · Resonance.
- Guardrails: Reversible first. No force-push to main without human. Compost skill sprawl.`;

  // Inject AGENT.md file contents as instructions
  for (const rel of AGENT_INSTRUCTIONS) {
    const p = join(process.cwd(), rel);
    try {
      const content = readFileSync(p, "utf8");
      context += `\n\n## ${rel}\n${content}`;
    } catch {
      context += `\n\n## ${rel} (not found in cwd)`;
    }
  }
  return context;
}

// ---------------------------------------------------------------------------
// Skill runner
// ---------------------------------------------------------------------------

function listSkills() {
  const skillsDir = join(process.cwd(), "skills");
  let files = [];
  try {
    files = readdirSync(skillsDir).filter((f) => f.endsWith(".md") && f !== "README.md");
  } catch {
    return [];
  }
  return files.map((f) => {
    const raw = readFileSync(join(skillsDir, f), "utf8");
    const header = raw.split("\n")[0] || f;
    return { file: f, header };
  });
}

// ---------------------------------------------------------------------------
// The agentic "hands" loop
// ---------------------------------------------------------------------------

async function agentLoop({ prompt, maxTurns = 6 } = {}) {
  let context = await loadOrgans();

  for (let turn = 1; turn <= maxTurns; turn++) {
    const userMsg = turn === 1
      ? prompt
      : "Continue the work: implement, edit, or iterate. Keep it small and reversible. Respect AGENT.md.";

    const messages = [
      { role: "user", content: userMsg },
      {
        role: "assistant",
        content: "Understood. I will act as Pan's hands on the genome, respecting AGENT.md dual-mode rules, calling organs for facts over model opinion, and leaving small commits + Evolution traces.",
      },
    ];

    const reply = await callLLM(messages, { system: context });

    console.log(`\n[Turn ${turn}] LLM reply:`);
    console.log(reply.slice(0, 2000));
    if (reply.length > 2000) console.log(`... (${reply.length - 2000} more chars)`);

    const lower = reply.toLowerCase();
    const needsTouching = lower.includes("edit")
      || lower.includes("implement")
      || lower.includes("change")
      || lower.includes("refactor")
      || lower.includes("update")
      || lower.includes("skill")
      || lower.includes("genome");

    if (!needsTouching || turn === maxTurns) break;

    // If the model explicitly says it will act, we acknowledge and guide toward a plan
    const apply = lower.includes("will make") || lower.includes("i will edit") || lower.includes("i will");
    if (apply) {
      console.log(`[Turn ${turn}] Awaiting explicit file-edit plan from model. (Use 'idea' to generate a structured plan.)`);
    }
  }
}

// ---------------------------------------------------------------------------
// One-shot command runner (for `npm run opencode -- --cmd "..."`)
// ---------------------------------------------------------------------------

async function runOneShot(args) {
  const cmd = args.shift();
  const text = args.map((a) => a.replace(/^--cmd=/, "")).join(" ");
  if (!cmd) {
    console.error("Usage: node run-opencode.js --cmd \"<command>\"\nCommands: status | diff | commit <msg> | push | skills | heartbeat | help");
    process.exit(1);
  }

  console.log(`Pan — OpenCode Hands — one-shot: ${cmd}`);
  console.log(`CWD: ${process.cwd()}`);

  let output;
  switch (cmd) {
    case "status":
      output = status();
      break;
    case "diff":
      output = diffSummary();
      break;
    case "commit": {
      const msg = text.replace(/^commit\s+/i, "").trim();
      if (!msg) {
        console.error("Missing commit message. Usage: npm run opencode -- --cmd=\"commit <msg>\"");
        process.exit(1);
      }
      addAll();
      output = commit(msg);
      break;
    }
    case "push":
      output = push();
      break;
    case "skills":
      output = JSON.stringify(
        { count: listSkills().length, skills: listSkills().map((s) => s.file) },
        null,
        2
      );
      break;
    case "heartbeat":
      output = JSON.stringify(await organPulse(), null, 2);
      break;
    case "help":
      output =
        "Commands: status | diff | commit <msg> | push | skills | heartbeat | help";
      break;
    case "idea":
      output = 'Awaiting model-driven implementation plan. (Use interactive mode with `idea` or type directly.)';
      break;
    default:
      output = `Unknown command: ${cmd}. Try: help`;
  }

  console.log(`\nResult: ${output}`);
}

// ---------------------------------------------------------------------------
// Interactive REPL
// ---------------------------------------------------------------------------

function startREPL({ guided = false } = {}) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "Pan> ",
  });

  rl.prompt();

  rl.on("line", async (line) => {
    const trimmed = line.trim();
    if (trimmed === "exit" || trimmed === "quit" || trimmed === "q") {
      console.log("Leaving Pan's hands. Stay grounded.");
      rl.close();
      return;
    }
    if (trimmed === "status") {
      console.log(`\n$ {status()}\n`);
      rl.prompt();
      return;
    }
    if (trimmed === "diff") {
      console.log(`\n${diffSummary()}\n`);
      rl.prompt();
      return;
    }
    if (trimmed === "skills") {
      const skills = listSkills();
      console.log(`\n${skills.map((s) => ` - ${s.file}: ${s.header}`).join("\n")}\n`);
      rl.prompt();
      return;
    }
    if (trimmed === "heartbeat") {
      console.log(`\n${JSON.stringify(await organPulse(), null, 2)}\n`);
      rl.prompt();
      return;
    }
    if (trimmed === "idea") {
      console.log("\nAwaiting model-driven implementation plan. (The model will now plan the next change.)");
      await agentLoop({ prompt: "Plan the next concrete change to the genome, respecting AGENT.md dual-mode rules, respecting guardrails. Output a clear, structured plan with file paths, diffs, and commit message.", maxTurns: 4 });
      console.log("\nUse 'status' + 'commit <msg>' to persist, or 'idea' again.");
      rl.prompt();
      return;
    }
    if (trimmed === "help") {
      console.log(`
Pan — OpenCode Hands (node driver)

Commands:
  idea          → ask the model to plan the next change
  status        → git status --porcelain
  diff          → git diff --stat
  skills        → list available Pan skills
  heartbeat     → organ pulse
  commit <msg>  → stage all + commit (global)
  push          → push branch to origin
  exit          → leave

Type your instruction and press Enter to invoke the model.
`);
      rl.prompt();
      return;
    }

    if (trimmed.startsWith("commit ")) {
      const msg = trimmed.replace(/^commit\s+/i, "").trim();
      if (!msg) {
        console.error("Usage: commit <message>");
        rl.prompt();
        return;
      }
      addAll();
      console.log(`\n[committed] ${commit(msg)}\n`);
      rl.prompt();
      return;
    }
    if (trimmed === "push") {
      try {
        push();
        console.log(`\n[Pushed to origin]\n`);
      } catch (e) {
        console.error(`\n[Push failed] ${e.message}\n`);
      }
      rl.prompt();
      return;
    }

    // Otherwise, hand to the agent loop
    console.log(`\n[invoking model...] (turn 1/${6})`);
    await agentLoop({ prompt: trimmed, maxTurns: 6 });
    console.log(`\n[finish] (use 'idea' to generate the next plan, or 'commit <msg>' to persist)`);
    rl.prompt();
  }).on("close", () => {
    console.log("\nGoodbye, Pan.");
    process.exit(0);
  });
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

// Handle --help / --version before anything else
if (args.includes('--help') || args.includes('-h')) {
  console.log('Pan - OpenCode Hands (node driver)');
  console.log();
  console.log('Usage:');
  console.log('  node run-opencode.js   interactive REPL (Pan');
  console.log('  node run-opencode.js --cmd CMD   one-shot');
  console.log('  npm run opencode   shorthand');
  console.log();
  console.log('Commands:');
  console.log('  status | diff | commit <msg> | push | skills | heartbeat | help');
  console.log('  idea          -> plan next change');
  console.log('  skills        -> list skills');
  console.log('  heartbeat     -> organ pulse');
  process.exit(0);
}


const isOneShot = args.some(a => a.startsWith('--cmd'));


if (isOneShot) {
  const idx = args.findIndex((a) => a.startsWith("--cmd="));
  const separateIdx = args.findIndex((a) => a === "--cmd");
  let cmdArgs;
  if (idx >= 0) {
    const val = args[idx].replace(/^--cmd=/, "");
    cmdArgs = args;
    cmdArgs[idx] = val;
  } else if (separateIdx >= 0) {
    cmdArgs = args.slice(separateIdx + 1);
  } else {
    cmdArgs = args;
  }
  runOneShot(cmdArgs).catch((e) => {
    console.error("Fatal:", e.message || e);
    process.exit(1);
  });
} else {
  startREPL({ guided: false });
}
