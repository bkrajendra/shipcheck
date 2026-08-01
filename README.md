# ShipCheck

A [Flue](https://flueframework.com/) agent that investigates whether a codebase is ready to ship.

Point it at a repository (by default, wherever you run it from) and it inspects the working tree, changelog/version state, leftover `TODO`/`FIXME` markers, and test/lint status — then ends with exactly one structured verdict instead of a free-text opinion.

## What it does

- **Sandbox**: `useSandbox(local({ cwd }))` attaches ShipCheck directly to the host filesystem and shell at the target repo, giving it the built-in `read`, `grep`, `glob`, and `bash` tools to gather real evidence. (`write`/`edit` are mounted by the sandbox too, but the agent's instructions forbid it from ever using them — ShipCheck is read-only by design.)
- **Skill**: `src/skills/release-checklist/SKILL.md` packages the actual investigation procedure as a reusable, inspectable skill, separate from the agent's wiring. The agent activates it and follows it step by step.
- **Tool**: `submit_readiness_report` (`src/tools/submit-readiness-report.ts`) is the only way the agent can end the task. It validates a `{ ready, blockers, warnings, summary }` verdict and rejects self-contradictory reports (`ready: true` with open blockers).

## Setup

```bash
npm install
cp .env.example .env
# then edit .env and fill in a model provider API key
```

Requires Node.js ≥ 22.19 (see `.node-version` / `engines` in `package.json`).

## How to run it against a repo

```bash
# Against the current directory (the default target):
npx flue run src/agents/ship-check.ts --message "Investigate this repo and report whether it's ready to ship."

# Against another repo, without cd'ing there:
SHIPCHECK_TARGET_DIR=/path/to/other/repo npx flue run src/agents/ship-check.ts -m "Investigate this repo and report whether it's ready to ship."

# Against ShipCheck itself, as a self-check demo:
npx flue run src/agents/ship-check.ts -m "Check yourself." --id shipcheck-self-demo

# Machine-readable output, and continuing a conversation by id:
npx flue run src/agents/ship-check.ts -m "..." --json
npx flue run src/agents/ship-check.ts -m "Anything else I should know?" --id shipcheck-self-demo
```

`npm run shipcheck` runs the same module, but since `flue run` requires `--message`, pass it through npm's argument separator: `npm run shipcheck -- -m "Investigate this repo."`.

### Switching models

`useModel()` defaults to `anthropic/claude-sonnet-4-6` (needs `ANTHROPIC_API_KEY`). Override the specifier with `SHIPCHECK_MODEL` to use any other [Pi-supported provider](https://flueframework.com/docs/guide/models/) — set the matching API key env var for whichever provider you pick:

```bash
SHIPCHECK_MODEL=moonshotai/kimi-k2-0905-preview MOONSHOT_API_KEY=sk-... \
  npx flue run src/agents/ship-check.ts -m "Check yourself."
```

## Example output

`flue run`'s `--json` envelope carries the model's final **text** reply, not the tool call's structured arguments directly — the agent is instructed to restate its verdict in one sentence after calling `submit_readiness_report`, so `message` stays human-readable:

```json
{
  "id": "shipcheck-self-demo",
  "agent": "ShipCheck",
  "outcome": "completed",
  "message": "Not ready to ship: 2 uncommitted changes and no CHANGELOG entry for the pending version bump.",
  "uid": "inst_..."
}
```

The authoritative structured result — `{ ready, blockers, warnings, summary }` — is the `submit_readiness_report` tool call itself, visible in the streamed activity on stderr (`tool_start` / `tool` events) or by reading the conversation history for a given `--id` through the [Flue Agent SDK](https://flueframework.com/docs/sdk/overview/) if you're building something on top of ShipCheck programmatically.

## Verifying without a live API key

```bash
npm install
npm run typecheck
npx flue run src/agents/ship-check.ts -m "Investigate this repo." --json
```

Without a configured provider credential, the third command is still expected to get all the way through module loading, the agent's render (`useModel`/`useSandbox`/`useTool`/`useSkill`), and `local()` sandbox initialization (the workspace scan: cwd, directory listing, `AGENTS.md`) — and only then fail, specifically at the outbound model request, with a provider-credential error (`outcome: "failed"`, exit code `1`). That's the expected boundary in a credential-less environment, not a defect: it proves the agent is wired correctly and only lacks a key.

This was verified directly during development, in an environment with no `ANTHROPIC_API_KEY` configured:

```
OperationFailedError [FlueError]: direct(sub_...) failed: Provider is not configured: anthropic
```

A second run, with `SHIPCHECK_MODEL=moonshotai/kimi-k2-0905-preview` and a real `MOONSHOT_API_KEY` set but from a network-restricted sandbox, got one step further — through provider resolution and request construction, failing only when the outbound HTTPS request actually left the box:

```
OperationFailedError [FlueError]: direct(sub_...) failed: 403 Host not in allowlist: api.moonshot.ai.
```

Both are the same class of result: everything Flue-side (module load, hooks, sandbox, tool/skill mounting, provider/model resolution, request construction) completed correctly; only the final network hop was blocked, by a missing key in the first case and an egress policy in the second. Neither indicates a bug in this project.

## Project layout

```
src/
├─ agents/
│  └─ ship-check.ts              # the agent: model, sandbox, tool, skill, instructions
├─ tools/
│  └─ submit-readiness-report.ts # the terminal structured-verdict tool
└─ skills/
   └─ release-checklist/
      └─ SKILL.md                # the investigation procedure
AGENTS.md                        # workspace context Flue surfaces when run against this repo
```
