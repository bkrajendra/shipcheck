---
name: release-checklist
description: Checklist procedure for judging whether a codebase is ready to ship a release. Use when asked to evaluate release readiness, whether it's safe to tag/publish, or to run a pre-release check on a repository.
---

Work through every step below against the codebase at your current working directory. Gather evidence with `read`, `grep`, `glob`, and `bash` — do not guess. If something cannot be checked (no git repo, no manifest file, etc.), say so as a warning rather than skipping it silently.

1. **Working tree cleanliness.** Confirm this is a git repo (`git rev-parse --is-inside-work-tree`), then run `git status --porcelain`. Uncommitted changes to tracked source files, or a detached HEAD, are blockers. Stray untracked scratch/IDE/build files are at most a warning.

2. **Changelog / version bump.** Look for `CHANGELOG.md` (or `CHANGES.md`/`HISTORY.md`) and check whether it has an entry that reads as unreleased/pending (an `## [Unreleased]` heading, or a top entry with no release date). Compare the manifest version (`package.json` `version`, or the ecosystem's equivalent — `pyproject.toml`, `Cargo.toml`, etc.) against the latest git tag (`git tag --sort=-creatordate | head -1`) to see whether the version was bumped since that tag. A missing changelog entry for real user-facing changes, or an unbumped version, is a blocker. A project that simply keeps no changelog at all is at most a warning.

3. **Leftover TODO/FIXME markers.** Search tracked files for `TODO`, `FIXME`, `XXX` — `git grep -nE 'TODO|FIXME|XXX'` in a git repo, otherwise `grep -rnE 'TODO|FIXME|XXX'` over the tree excluding `.git`, `node_modules`, `dist`, `build`. Markers that look load-bearing for what's about to ship (e.g. `FIXME: breaks in prod`) are blockers; routine long-standing TODOs unrelated to this release are warnings.

4. **Tests and lint.** Find how this project runs tests and lint — `package.json` `scripts.test`/`scripts.lint`, a `Makefile` target, a `pyproject.toml` test config, a CI workflow under `.github/workflows/`. If you find a runnable command, run it with a reasonable bound: if a `timeout` command is available, wrap the run with one (e.g. `timeout 120 npm test`); if not, run it as-is and note in a warning if it runs unexpectedly long. A failing test or lint run is a blocker. If no test/lint command can be found at all, report that explicitly as a warning — never skip this step silently.

5. **Other repo signals.** Use your judgment to check anything else you notice that's relevant: a missing `LICENSE`, an obviously broken README, a secrets file (`.env`, private keys) accidentally tracked by git, a lockfile visibly out of sync with the manifest. Only report things you found concrete evidence for.

6. **Verdict.** Set `ready: true` only if you found zero blockers — warnings alone never block. Write `summary` as 2-4 sentences a release manager could read standalone: the verdict, and the top reasons. List every blocker and warning as a short, specific, one-line string (e.g. `"3 uncommitted changes: src/index.ts, src/utils.ts, README.md"`, not `"dirty working tree"`). Call `submit_readiness_report` exactly once with the result — this is the only way to finish the task.
