import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Writer } from '../../../lib/installer/writer.js';
import { makeTmpProject, cleanup, writeFile } from '../../_helpers.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');

test('Writer: tracks created files in createdFiles + manifestPaths', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const w = new Writer(root);
  // _writeNew is private but exercised via installEntryFile / similar.
  // Touch `_writeNew` indirectly by checking installSkill happy path with
  // a known agent that ships in the repo (aegis).
  return; // exercised in installSkill below
});

test('Writer.installSkill: copies skill dir and registers files', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const w = new Writer(root);
  await w.installSkill('aegis', 'aegis/skills');
  const dest = join(root, 'aegis/skills/aegis');
  assert.ok(existsSync(dest));
  assert.ok(existsSync(join(dest, 'SKILL.md')));
  // Manifest tracks individual files
  assert.ok(w.manifestPaths.length > 0);
  assert.ok(w.manifestPaths.some((p) => p.endsWith('SKILL.md')));
  // createdFiles tracks the dir
  assert.ok(w.createdFiles.includes('aegis/skills/aegis'));
});

test('Writer.installSkill: idempotent — second call is no-op', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const w = new Writer(root);
  await w.installSkill('aegis', 'aegis/skills');
  const before = w.manifestPaths.length;
  const w2 = new Writer(root);
  await w2.installSkill('aegis', 'aegis/skills');
  // dest already exists → second writer registers nothing
  assert.equal(w2.manifestPaths.length, 0);
});

test('Writer.installSkill: warns and returns when agent dir missing', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const w = new Writer(root);
  const orig = console.warn;
  let warned = '';
  console.warn = (m) => { warned += String(m); };
  try {
    await w.installSkill('not-a-real-agent', 'aegis/skills');
  } finally {
    console.warn = orig;
  }
  assert.match(warned, /não encontrado/);
  assert.equal(w.createdFiles.length, 0);
});

test('Writer.installEntryFile: writes engine entry file when missing', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const w = new Writer(root);
  await w.installEntryFile({
    entryFile: 'CLAUDE.md',
    entryTemplate: 'CLAUDE.md',
  });
  const path = join(root, 'CLAUDE.md');
  assert.ok(existsSync(path));
  assert.ok(w.createdFiles.includes('CLAUDE.md'));
});

test('Writer.installEntryFile: skips when entry config is null', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const w = new Writer(root);
  await w.installEntryFile({ entryFile: null, entryTemplate: null });
  assert.equal(w.createdFiles.length, 0);
});

test('Writer.installEntryFile: force=true overwrites existing file', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'CLAUDE.md', '# old user content\n');
  const w = new Writer(root);
  await w.installEntryFile({ entryFile: 'CLAUDE.md', entryTemplate: 'CLAUDE.md' }, { force: true });
  const content = readFileSync(join(root, 'CLAUDE.md'), 'utf8');
  assert.doesNotMatch(content, /old user content/);
});
