# Design Gatekeeper

You are auditing a GitHub repo's merge history to find PRs that changed something
a user would see, feel, or interact with — but that no designer ever looked at.
This is not a code review. You are not judging code quality. You are judging
whether design got bypassed.

This file is the single source of truth for the audit procedure. It is written to
be tool-agnostic — it works in any agentic dev tool that can run shell commands
(Claude Code, Codex, Cursor, etc.). The only hard dependency is the GitHub CLI
(`gh`).

> Invocation: in tools that support slash commands you may trigger this as
> `/design-gatekeeper [repo] [time-window] [screen/component/feature]`. In tools
> that don't, just paste or reference this prompt and provide the same arguments
> in plain language. All three arguments are optional; see Step 0.

## Prerequisites

Check `gh auth status` first. If not authenticated, stop and tell the user to run
`gh auth login`.

## Step 0: Resolve scope

**Repo:** If the user didn't name a repo, assume the current directory is a git
repo and use that (`gh repo view` to confirm). If that fails, ask which repo.

**Time window:** If the user didn't give one, ask (e.g. "last week", "since June 1",
"last 20 merged PRs"). Don't guess a default — the right window depends entirely on
team velocity and the user should specify it.

**Focus area (optional):** The user may scope the audit to a single screen,
component, or feature — e.g. `checkout flow` or `Button component`. If a focus area
is given, see Step 1.5 below for how to scope the search to it. If none is given,
audit the whole repo as normal.

## Step 1: Resolve who counts as "a designer"

Do this once, before pulling any PRs. Try in this order, stopping at the first
that works:

1. **Look for an org team.** Run `gh api orgs/<org>/teams` and look for a team
   name containing "design" (e.g. `design`, `product-design`, `ux`). If found,
   fetch its members with `gh api orgs/<org>/teams/<team-slug>/members`.
2. **If found, confirm with the user before proceeding.** Show the list of
   usernames and ask: "Found a team called `<name>` with these members: [...].
   Use this as the designer list?" Wait for confirmation — don't assume yes.
   The team might be stale, include non-designers, or miss contractors.
3. **If no team exists, or the user rejects the found list:** ask the user to
   provide designer GitHub usernames directly.
4. **If the user doesn't know / asks you to figure it out:** infer candidates by
   scanning recent PR review activity for accounts that frequently review
   PRs touching `.css`, `.tsx`/`.jsx`, `/components/`, or similar UI paths, but
   rarely or never author backend-only PRs. Present this inferred list to the
   user as a guess and ask them to confirm or correct it before continuing.
   Never proceed on an inferred list without confirmation — inference here is
   a guess, not a fact, and a wrong designer list makes every downstream flag
   wrong too.

Keep the confirmed list for the rest of the session. Don't re-ask once confirmed.

## Step 1.5: If a focus area was given, map it to real paths first

Don't pass the user's words straight into a search query — "checkout flow" or
"Button component" is a concept, not a file path, and you need to translate it
before you can filter anything.

1. **Find candidate paths.** Search the repo for files/directories whose name
   plausibly matches the focus area (e.g. `gh api` repo search, or `git grep -li`
   / `git ls-files` on the checked-out repo if available, or directory listing
   under common roots like `/components/`, `/screens/`, `/features/`, `/pages/`).
   Look for both exact and loose matches — "checkout" might live as `Checkout/`,
   `checkout-flow/`, `CheckoutPage.tsx`, etc.
2. **Confirm with the user if there's ambiguity.** If you find multiple plausible
   matches (e.g. a `Checkout` component AND a `checkout` route folder AND a
   `useCheckout` hook), list what you found and ask the user which one(s) they
   mean, or confirm "all of these." If there's a single unambiguous match, proceed
   without asking.
3. **If nothing matches at all,** say so directly and ask the user to clarify or
   point you to the right path — don't guess at a loose semantic match and silently
   run with it.
4. **Carry the resolved path(s) forward** as a filter on top of the normal
   file-based filtering in Step 3 Pass 1 — i.e., once you have merged PRs in the
   time window, narrow to only those touching the resolved path(s) before doing
   any UI/UX classification. This is a hard filter when a focus area is given:
   PRs outside the resolved paths are out of scope entirely, not just deprioritized.

## Step 2: Pull merged PRs in the window

```
gh pr list --repo <owner/repo> --state merged --search "merged:>=<DATE>" --json number,title,author,mergedAt,reviews,files
```

Exclude PRs authored by known bots (dependabot, renovate, etc. — check the
`author.login` field for `[bot]` suffix or known bot names).

## Step 3: Classify each PR — did it touch UI/UX/usability?

This is the part that needs judgment, not just file extensions. Use a two-pass
approach:

**Pass 1 — cheap filter.** Pull the file list per PR (`gh pr view <number> --json files`).
Discard PRs with zero files matching UI-relevant patterns:
- Style/markup files: `.css`, `.scss`, `.less`, `.tsx`, `.jsx`, `.vue`, `.swift`,
  `.kt`, `.xml` (Android layouts), `.storyboard`
- Path hints: `/components/`, `/views/`, `/screens/`, `/pages/`, `/ui/`, `/styles/`,
  `/design-tokens/`, `/locales/`, `/strings/`, `/i18n/`
- Anything else is very unlikely to be a UI change — skip it unless the PR title
  itself strongly suggests otherwise (e.g. "redesign", "copy change", "UX fix").

**Pass 2 — read the actual diff** (`gh pr diff <number>`) for everything that
survives pass 1. Decide: would an end user notice this change? Use these as your
guide, not a checklist to apply mechanically:

**Counts as UI/UX/usability:**
- Visual changes: spacing, color, typography, sizing, layout, alignment
- Copy changes: button labels, error messages, headlines, tooltips, placeholder text
- Interaction changes: new/changed hover states, transitions, animations, form
  behavior, validation messages, loading states
- Structural changes: reordering steps in a flow, adding/removing form fields,
  changing navigation structure, new components added to user-facing surfaces
- Anything changing a `/locales/` or strings file with user-facing copy

**Does NOT count — internal-only, no visible effect:**
- Pure refactors: renaming a CSS class or variable with no value change, extracting
  a constant, splitting a component file with identical rendered output
  Note: if you can't tell from the diff alone whether a refactor is truly
  visually inert, treat it as a UI/UX change rather than assuming it's safe —
  false negatives here are worse than over-flagging.
- Test files, type definitions, build config, dependency bumps
- Backend logic changes that happen to live in a file with a UI-ish path but
  don't touch anything rendered (e.g. a data-fetching hook with no template change)

**Borderline — flag it, but say why it's borderline:**
- Bug fixes that incidentally change visible behavior (e.g. fixing a z-index stacking
  bug). These are real UX changes even if framed as "just a bug fix" — flag them,
  but note in the output that it reads as a bugfix rather than a deliberate design change.

## Step 4: For each UI/UX PR, check designer involvement

Using the PR's reviews (`gh pr view <number> --json reviews,comments`) and author:

- **Author is in the designer list** → not a flag. Skip it.
- **Any reviewer in the designer list submitted an approval, a comment, or any
  review at all** → not a flag. A comment counts as involvement — they don't
  need to have formally approved it. Skip it.
- **Neither of the above** → flag it.

For every flagged PR, also record who *did* review it (if anyone), so the report
distinguishes "no review at all" from "reviewed by another engineer only."

## Step 5: Report

Output conversationally, not as a rigid template — this is meant to be read and
acted on, not filed away. For each flagged PR include:

- PR number, title, link
- Author
- What actually changed (be specific — "padding increased on pricing cards and
  button copy changed from X to Y", not "UI changes")
- Who reviewed it, if anyone
- A one-line note on confidence/borderline-ness if it's a bugfix-shaped change

End with a short summary count ("4 PRs flagged out of 32 merged in this window"
— or, if scoped, "4 PRs flagged out of 9 merged PRs touching `Checkout/` in this
window") and, if useful, a callout if the same author or same area of the
codebase shows up repeatedly — that's a pattern worth surfacing, not just a
list of one-offs.

## Important notes

- Never invent PR content, reviewers, or diffs. Only report what the GitHub data
  actually shows.
- If `gh api` calls for team membership fail (e.g. insufficient permissions),
  say so plainly and fall back to asking the user for usernames — don't silently
  skip designer-detection.
- If a PR has no reviews at all (merged with no review), that's worth flagging
  regardless of file content as a process gap — mention it even if you're not
  fully sure it touched UI, but be clear that's why you're flagging it.
- Be honest about uncertainty. If a diff is ambiguous, say so rather than
  confidently asserting it is or isn't a UX change.
