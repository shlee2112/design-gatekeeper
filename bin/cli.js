#!/usr/bin/env node
'use strict';

// design-gatekeeper installer.
//
// Copies the canonical prompt.md into the config directory of each agentic dev
// tool you use, under the name that tool expects. Dependency-free so it runs
// fast via npx.
//
// Usage:
//   npx github:shlee2112/design-gatekeeper            # install for all tools
//   npx github:shlee2112/design-gatekeeper claude     # only named tools
//   npx github:shlee2112/design-gatekeeper --help

const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PROMPT = path.join(ROOT, 'prompt.md');
const SKILL = path.join(ROOT, 'SKILL.md');
const HOME = os.homedir();

const TOOLS = {
  claude: {
    label: 'Claude Code',
    install() {
      // A Claude skill is a directory containing SKILL.md (+ its referenced files).
      const dest = path.join(HOME, '.claude', 'skills', 'design-gatekeeper');
      fs.mkdirSync(dest, { recursive: true });
      fs.copyFileSync(SKILL, path.join(dest, 'SKILL.md'));
      fs.copyFileSync(PROMPT, path.join(dest, 'prompt.md'));
      return `${dest}/`;
    },
  },
  codex: {
    label: 'Codex CLI',
    install() {
      const dest = path.join(HOME, '.codex', 'prompts');
      fs.mkdirSync(dest, { recursive: true });
      const file = path.join(dest, 'design-gatekeeper.md');
      fs.copyFileSync(PROMPT, file);
      return file;
    },
  },
  cursor: {
    label: 'Cursor',
    install() {
      const dest = path.join(HOME, '.cursor', 'commands');
      fs.mkdirSync(dest, { recursive: true });
      const file = path.join(dest, 'design-gatekeeper.md');
      fs.copyFileSync(PROMPT, file);
      return file;
    },
  },
};

function usage() {
  console.log(`design-gatekeeper installer

Copies the design-gatekeeper prompt into each tool's config directory.
Invoke the audit afterwards with /design-gatekeeper.

Usage:
  npx github:shlee2112/design-gatekeeper [tools...]

Tools (default: all):
  claude   Claude Code   -> ~/.claude/skills/design-gatekeeper/
  codex    Codex CLI     -> ~/.codex/prompts/design-gatekeeper.md
  cursor   Cursor        -> ~/.cursor/commands/design-gatekeeper.md

Options:
  -h, --help   Show this help

Requires the GitHub CLI (gh) authenticated to run the audit: gh auth login`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('-h') || args.includes('--help')) {
    usage();
    return;
  }

  if (!fs.existsSync(PROMPT)) {
    console.error('error: prompt.md not found alongside the CLI. Reinstall the package.');
    process.exit(1);
  }

  const names = args.filter((a) => !a.startsWith('-'));
  const selected = names.length ? names : Object.keys(TOOLS);

  let installed = 0;
  for (const name of selected) {
    const tool = TOOLS[name];
    if (!tool) {
      console.error(`warning: unknown tool '${name}' (expected: ${Object.keys(TOOLS).join(', ')})`);
      continue;
    }
    try {
      const where = tool.install();
      console.log(`✓ ${tool.label.padEnd(12)} → ${where}  (invoke: /design-gatekeeper)`);
      installed++;
    } catch (err) {
      console.error(`✗ ${tool.label}: ${err.message}`);
    }
  }

  if (installed === 0) {
    console.log('Nothing installed.');
    process.exit(1);
  }
  console.log('\nDone. Requires the GitHub CLI (gh) authenticated: gh auth login');
}

main();
