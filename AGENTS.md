# AGENTS.md

This repository packages **design-gatekeeper**, a reusable, tool-agnostic prompt
that audits a GitHub repo's merge history for UI/UX/usability changes that shipped
without any designer reviewing them.

## Source of truth

[`prompt.md`](prompt.md) holds the complete audit procedure. Everything else in
this repo is a thin adapter that delegates to it:

- [`SKILL.md`](SKILL.md) — Claude Code / Claude apps skill wrapper.
- [`install.sh`](install.sh) — bash installer; copies `prompt.md` into each tool's config dir.
- [`bin/cli.js`](bin/cli.js) — dependency-free Node installer for `npx`; same behavior as `install.sh`.

If you change the audit behavior, edit `prompt.md` only, then re-run `install.sh`
so the installed copies stay in sync. Do not fork the instructions into the
adapters.

## Running the audit

The audit itself needs the GitHub CLI (`gh`) installed and authenticated. It is
read-only against GitHub — it lists PRs, reads diffs and reviews, and reads org
team membership. It never writes to the repo or to GitHub.
