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

### Quickest — `npx` (no clone)

```bash
npx github:shlee2112/design-gatekeeper            # install for every supported tool
npx github:shlee2112/design-gatekeeper claude     # or name tools: claude | codex | cursor
```

This runs straight from GitHub — nothing to publish, nothing to clone. It copies
[`prompt.md`](prompt.md) into each tool's config directory under the name that
tool expects. Re-run it any time to pull updates.

### Alternative — clone + script

```bash
git clone git@github.com:shlee2112/design-gatekeeper.git
cd design-gatekeeper
./install.sh             # install for every supported tool
./install.sh claude      # or name specific tools: claude | codex | cursor
```

`install.sh` (bash) and the `npx` CLI do the same thing — use whichever you prefer.

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

## Example output

The audit is conversational, not a rigid template. A typical run looks like this.

**1. It resolves who counts as a designer first:**

> Found a team called **`product-design`** in the `acme` org with these members:
> `@jdoe`, `@priya-design`, `@marco.ux`. Use this as the designer list? (You can
> also add contractors or remove anyone who's no longer on the team.)
>
> — *you:* yes, but drop @marco.ux, he moved to engineering
>
> Got it. Designer list for this audit: `@jdoe`, `@priya-design`.

**2. Then it reports the flagged PRs:**

> Audited **32 merged PRs** in `acme/web` from the last 2 weeks. After filtering
> out non-UI changes (backend, tests, deps, pure refactors), **9 touched
> something user-facing**. Of those, **3 shipped with no designer involvement** —
> flagging them below.
>
> ---
>
> **🚩 [#1487 — Tighten spacing on pricing cards](https://github.com/acme/web/pull/1487)**
> *Author: @sam-eng · merged Jun 18*
> Reduced card padding from `24px` to `12px` and changed the CTA label from
> "Get started" to "Start free trial" across all three pricing tiers. Reviewed
> and approved by **@another-eng** — no designer looked at it. This is a
> deliberate visual + copy change to a high-traffic conversion surface.
>
> **🚩 [#1492 — Fix checkout button alignment](https://github.com/acme/web/pull/1492)**
> *Author: @sam-eng · merged Jun 19*
> Framed as a bug fix, but it re-centers the primary checkout button and bumps
> its height by `8px`, which visibly changes the button's prominence. **Borderline**
> — reads as a bugfix, but the result is a real UX change. No reviews at all
> (merged unreviewed).
>
> **🚩 [#1501 — Update empty-state copy](https://github.com/acme/web/pull/1501)**
> *Author: @riley-eng · merged Jun 20*
> Rewrote the empty-state message on the dashboard from "No data yet" to "Nothing
> here — connect a source to get started" and added a secondary link. User-facing
> copy change, reviewed by **@another-eng** only.
>
> ---
>
> **Summary:** 3 of 9 user-facing PRs shipped without design review.
> Two of the three were authored by **@sam-eng** and both touch conversion
> surfaces (pricing, checkout) — worth a conversation about looping design in on
> that area, rather than treating these as one-offs. #1492 in particular merged
> with no review of any kind.

When scoped to a focus area (e.g. `checkout flow`), the counts narrow to just
that area: *"3 flagged out of 5 merged PRs touching `Checkout/` in this window."*

> **Note:** the PRs, usernames, and numbers above are illustrative. The skill only
> ever reports what the GitHub data actually shows, and is explicit about
> uncertainty on borderline calls.

## How it's structured

[`prompt.md`](prompt.md) is the single source of truth. `SKILL.md`, the installer,
and `AGENTS.md` are thin wrappers around it — so the behavior stays identical no
matter which tool runs it. To change the audit, edit `prompt.md` and re-run
`install.sh`.

## License

MIT — see [LICENSE](LICENSE).
