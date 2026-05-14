import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ENGINES, detectEngines } from '../../../lib/installer/detector.js';
import { makeTmpProject, cleanup, writeFile } from '../../_helpers.js';

test('ENGINES: includes the 14 supported engines', () => {
  const ids = ENGINES.map((e) => e.id);
  for (const id of [
    'claude-code', 'codex', 'cursor', 'gemini-cli', 'windsurf',
    'antigravity', 'kiro', 'opencode', 'cline', 'roo-code',
    'github-copilot', 'aider', 'amazon-q', 'kimi-cli',
  ]) {
    assert.ok(ids.includes(id), `missing engine: ${id}`);
  }
});

test('ENGINES: every entry has required shape', () => {
  for (const e of ENGINES) {
    assert.equal(typeof e.id, 'string');
    assert.equal(typeof e.name, 'string');
    assert.equal(typeof e.star, 'boolean');
    assert.equal(typeof e.skillsDir, 'string');
    // entryFile may be null (kiro)
  }
});

test('ENGINES: skills dir is the v2 single-folder layout', () => {
  for (const e of ENGINES) {
    assert.equal(e.skillsDir, 'aegis/skills');
  }
});

test('detectEngines: empty project detects nothing', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const list = detectEngines(root);
  // commandExists may detect global tools — assert that at least no false positives
  // for engines whose detector requires a project marker.
  const cursor = list.find((e) => e.id === 'cursor');
  assert.equal(cursor.detected, false);
  const cline = list.find((e) => e.id === 'cline');
  assert.equal(cline.detected, false);
  const roo = list.find((e) => e.id === 'roo-code');
  assert.equal(roo.detected, false);
});

test('detectEngines: detects Claude Code via .claude marker', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, '.claude/settings.json', '{}');
  const list = detectEngines(root);
  const claude = list.find((e) => e.id === 'claude-code');
  assert.equal(claude.detected, true);
});

test('detectEngines: detects Cursor via .cursorrules', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, '.cursorrules', 'rules');
  const list = detectEngines(root);
  assert.equal(list.find((e) => e.id === 'cursor').detected, true);
});

test('detectEngines: detects GitHub Copilot via .github/copilot-instructions.md', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, '.github/copilot-instructions.md', '#');
  const list = detectEngines(root);
  assert.equal(list.find((e) => e.id === 'github-copilot').detected, true);
});

test('detectEngines: returns same length as ENGINES', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const list = detectEngines(root);
  assert.equal(list.length, ENGINES.length);
});

test('detectEngines: detected entries preserve metadata', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, '.cursorrules', '');
  const cursor = detectEngines(root).find((e) => e.id === 'cursor');
  assert.equal(cursor.entryFile, '.cursorrules');
  assert.equal(cursor.skillsDir, 'aegis/skills');
});
