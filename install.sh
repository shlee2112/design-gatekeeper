#!/usr/bin/env bash
#
# Install the design-gatekeeper prompt into whatever agentic dev tools you use.
#
# It writes the same canonical instructions (prompt.md) into each tool's
# global config directory, under the name that tool expects. Re-run it any time
# prompt.md changes to keep every tool in sync.
#
# Usage:
#   ./install.sh                 # install for every tool found on this machine
#   ./install.sh claude codex    # install only for the named tools
#
# Supported tool names: claude, codex, cursor

set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROMPT="$SRC_DIR/prompt.md"

if [[ ! -f "$PROMPT" ]]; then
  echo "error: prompt.md not found next to install.sh" >&2
  exit 1
fi

# Which tools to install for. Default: all.
TOOLS=("$@")
if [[ ${#TOOLS[@]} -eq 0 ]]; then
  TOOLS=(claude codex cursor)
fi

installed=0

install_claude() {
  # Claude Code / Claude apps: a skill is a directory containing SKILL.md.
  local dest="$HOME/.claude/skills/design-gatekeeper"
  mkdir -p "$dest"
  cp "$SRC_DIR/SKILL.md" "$dest/SKILL.md"
  cp "$PROMPT" "$dest/prompt.md"
  echo "✓ Claude Code   → $dest/  (invoke: /design-gatekeeper)"
  installed=$((installed + 1))
}

install_codex() {
  # Codex CLI: custom prompts live in ~/.codex/prompts/<name>.md,
  # invoked as /<name>.
  local dest="$HOME/.codex/prompts"
  mkdir -p "$dest"
  cp "$PROMPT" "$dest/design-gatekeeper.md"
  echo "✓ Codex CLI     → $dest/design-gatekeeper.md  (invoke: /design-gatekeeper)"
  installed=$((installed + 1))
}

install_cursor() {
  # Cursor: global custom slash commands live in ~/.cursor/commands/<name>.md,
  # invoked as /<name>.
  local dest="$HOME/.cursor/commands"
  mkdir -p "$dest"
  cp "$PROMPT" "$dest/design-gatekeeper.md"
  echo "✓ Cursor        → $dest/design-gatekeeper.md  (invoke: /design-gatekeeper)"
  installed=$((installed + 1))
}

for tool in "${TOOLS[@]}"; do
  case "$tool" in
    claude) install_claude ;;
    codex)  install_codex ;;
    cursor) install_cursor ;;
    *) echo "warning: unknown tool '$tool' (expected: claude, codex, cursor)" >&2 ;;
  esac
done

if [[ $installed -eq 0 ]]; then
  echo "Nothing installed."
else
  echo
  echo "Done. Requires the GitHub CLI (gh) authenticated: gh auth login"
fi
