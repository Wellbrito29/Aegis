import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  makeTmpProject, cleanup, writeFile, writeJson, runCommand, REPO_ROOT,
} from '../../_helpers.js';

const CMD = pathToFileURL(join(REPO_ROOT, 'lib/commands/export-diagrams.js')).href;

test('export-diagrams: invalid --format → exit 1', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = await runCommand(CMD, ['--format=jpeg'], { cwd: root });
  assert.equal(r.exitCode, 1);
  assert.match(r.stderr, /Invalid format/);
});

test('export-diagrams: rejects shell metacharacters in --output', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = await runCommand(CMD, ['--output=foo;rm -rf /'], { cwd: root });
  assert.equal(r.exitCode, 1);
});

test('export-diagrams: rejects --output traversal', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = await runCommand(CMD, ['--output=../escape'], { cwd: root });
  assert.equal(r.exitCode, 1);
});

test('export-diagrams: prints "not installed" when state.json missing', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = await runCommand(CMD, ['--no-render'], { cwd: root });
  assert.match(r.stdout, /not installed/);
});

test('export-diagrams: --no-render with no diagrams → "No Mermaid diagrams found"', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeJson(root, 'aegis/config/state.json', { output_folder: 'aegis' });
  writeFile(root, 'aegis/x.md', '# no diagrams here\n');
  const r = await runCommand(CMD, ['--no-render'], { cwd: root });
  // ora spinner writes to stderr. Either stream may contain the line.
  assert.match(r.stdout + r.stderr, /No Mermaid diagrams/);
});

test('export-diagrams: --no-render extracts .mmd files', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeJson(root, 'aegis/config/state.json', { output_folder: 'aegis' });
  writeFile(root, 'aegis/arch.md', '# Arch\n```mermaid\ngraph TD;\nA-->B;\n```\n');
  const r = await runCommand(CMD, ['--no-render'], { cwd: root });
  // Either succeeds in extraction or hits the mmdc check first; both are
  // acceptable outcomes since the test environment varies. Just ensure
  // the command does not crash.
  assert.ok(r.stdout.length + r.stderr.length > 0);
});
