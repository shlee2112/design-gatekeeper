# design-gatekeeper

A reusable, **tool-agnostic** prompt that audits a GitHub repo's merge history to
find PRs that changed **UI, UX, or usability** — but that **no designer ever
reviewed**.

It's not a code review. It doesn't judge code quality. It answers one question:
*did a user-facing change ship without design ever looking at it?*

Works in **Claude Code, Codex, Cursor**, and any other agentic dev tool that can
run shell commands. The full procedure lives in one file — [`prompt.md`](prompt.md)
— and every per-tool integration just points at it.

## What it does

- Pulls merged PRs in a time window you specify
- Classifies each one for real user-facing impact (a two-pass filter: cheap file-path
  filter, then an actual diff read)
- Resolves who counts as "a designer" — from a GitHub org team, a list you provide,
  or an inferred-then-confirmed guess
- Flags every UI/UX PR with no designer involvement (author or reviewer), and tells
  you who *did* review it
- Optionally scopes the whole audit to a single screen, component, or feature

## Requirements

- The [GitHub CLI](https://cli.github.com/) (`gh`) installed and authenticated
  (`gh auth login`)
- Read access to the repo and, ideally, the org's teams (used to auto-detect the
  designer list)

The audit is **read-only** — it never writes to your repo or to GitHub.

## Install

Clone the repo, then install for whichever tools you use:

```bash
git clone git@github.com:shlee2112/design-gatekeeper.git
cd design-gatekeeper
./install.sh             # install for every supported tool
./install.sh claude      # or name specific tools: claude | codex | cursor
```

The installer copies [`prompt.md`](prompt.md) into each tool's config directory
under the name that tool expects. Re-run it any time you pull updates.

### Where it lands (and manual install)

If you'd rather not run the script, drop `prompt.md` in the right place yourself:

| Tool | Location | Invoke with |
|------|----------|-------------|
| **Claude Code** | `~/.claude/skills/design-gatekeeper/` (the folder with `SKILL.md` + `prompt.md`) | `/design-gatekeeper` |
| **Codex CLI** | `~/.codex/prompts/design-gatekeeper.md` | `/design-gatekeeper` |
| **Cursor** | `~/.cursor/commands/design-gatekeeper.md` (global) or `.cursor/commands/` in a project | `/design-gatekeeper` |
| **Any other tool** | Paste or `@`-reference [`prompt.md`](prompt.md) | n/a |

Tool config conventions change over time — if a path above has moved, check that
tool's docs for where reusable prompts / custom slash commands live, and drop
`prompt.md` there.

## Usage

Once installed, invoke it (slash command on tools that support one, or just point
the agent at the prompt) with up to three optional arguments:

```
design-gatekeeper [repo] [time-window] [screen/component/feature]
```

Examples:

```
/design-gatekeeper
/design-gatekeeper acme/web "last 2 weeks"
/design-gatekeeper acme/web "since June 1" checkout flow
```

If you omit arguments, it asks for what it needs (the time window is never
guessed — it depends on your team's velocity).

## How it's structured

[`prompt.md`](prompt.md) is the single source of truth. `SKILL.md`, the installer,
and `AGENTS.md` are thin wrappers around it — so the behavior stays identical no
matter which tool runs it. To change the audit, edit `prompt.md` and re-run
`install.sh`.

## License

MIT — see [LICENSE](LICENSE).
