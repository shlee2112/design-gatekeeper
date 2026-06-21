---
name: design-gatekeeper
description: Find merged PRs that changed UI, UX, or usability without any designer involvement. Optionally scope to a specific screen, component, or feature. Use with /design-gatekeeper [repo] [time-window] [screen/component/feature].
allowed-tools: Bash(gh pr list:*), Bash(gh pr view:*), Bash(gh pr diff:*), Bash(gh api:*), Bash(gh auth status:*), Bash(gh repo view:*), Bash(git grep:*), Bash(git ls-files:*), Bash(ls:*), Bash(find:*)
effort: high
---

# Design Gatekeeper Skill

Audit a GitHub repo's merge history to find PRs that changed UI, UX, or usability
but that no designer ever reviewed.

The full, tool-agnostic procedure lives in [prompt.md](prompt.md) — read it and
follow it exactly. It is the single source of truth so that this skill stays in
sync with the Codex, Cursor, and other adapters in this repo.
