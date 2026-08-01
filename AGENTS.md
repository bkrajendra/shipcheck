# AGENTS.md

This is the ShipCheck project itself — a demo [Flue](https://flueframework.com/) agent for judging release readiness of a codebase.

## For agents working in this repository

- Source lives under `src/`: the agent module in `src/agents/`, the custom tool in `src/tools/`, and the release-readiness checklist skill in `src/skills/release-checklist/`.
- This is a demo/reference project, not a published package. There is no build step to run it locally — `flue run` loads the agent module directly.
- When editing the checklist skill, keep every step mechanically executable with `read`/`grep`/`glob`/`bash` — avoid steps that require judgment the checklist itself doesn't define.
- After any change, run `npm run typecheck` (`tsc --noEmit`). This sandboxed environment may have no model provider credential, so `flue run` can only be exercised structurally in that case — see the README's "Verifying without a live API key" section.
- The agent's own sandbox is a real `local()` shell against whatever directory it's pointed at (this repo, by default). Never widen its instructions to permit `write`/`edit`/destructive commands — ShipCheck is meant to stay strictly read-only against the codebase it inspects.
