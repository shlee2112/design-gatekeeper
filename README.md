# design-gatekeeper

A Claude skill that audits a GitHub repo's merge history to find PRs that changed
**UI, UX, or usability** — but that **no designer ever reviewed**.

It's not a code review. It doesn't judge code quality. It answers one question:
*did a user-facing change ship without design ever looking at it?*

## What it does

- Pulls merged PRs in a time window you specify
- Classifies each one for real user-facing impact (a two-pass filter: cheap file-path
  filter, then an actual diff read)
- Resolves who counts as "a designer" — from a GitHub org team, a list you provide,
  or an inferred-then-confirmed guess
- Flags every UI/UX PR with no designer involvement (author or reviewer), and tells
  you who *did* review it
- Optionally scopes the whole audit to a single screen, component, or feature

## Usage

```
/design-gatekeeper [repo] [time-window] [screen/component/feature]
```

Examples:

```
/design-gatekeeper
/design-gatekeeper acme/web "last 2 weeks"
/design-gatekeeper acme/web "since June 1" checkout flow
```

If you omit arguments, the skill asks for what it needs (the time window is never
guessed — it depends on your team's velocity).

## Requirements

- The [GitHub CLI](https://cli.github.com/) (`gh`) installed and authenticated
  (`gh auth login`)
- Read access to the repo and, ideally, the org's teams (used to auto-detect the
  designer list)

## Install

Clone into your skills directory (the exact path depends on your Claude setup):

```bash
git clone git@github.com:shlee2112/design-gatekeeper.git
```

Then point your Claude environment at the folder containing `SKILL.md`.

## License

MIT — see [LICENSE](LICENSE).
