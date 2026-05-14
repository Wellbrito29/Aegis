import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { makeTmpProject, cleanup, writeFile, runCommand, REPO_ROOT } from '../../_helpers.js';

const CMD = pathToFileURL(join(REPO_ROOT, 'lib/commands/policy-index.js')).href;

test('policy-index --help: prints usage', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = await runCommand(CMD, ['--help'], { cwd: root });
  assert.match(r.stdout, /Subcommands/);
});

test('policy-index: empty args prints usage', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = await runCommand(CMD, [], { cwd: root });
  assert.match(r.stdout, /Subcommands/);
});

test('policy-index build: creates aegis/runtime/context/policy-index.json', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'aegis/specs/sdd/x.md', `---
contracts:
  - name: foo
    file: src/foo.js
    protected: true
---
`);
  const r = await runCommand(CMD, ['build'], { cwd: root });
  assert.equal(r.exitCode, 0);
  assert.ok(existsSync(join(root, 'aegis/runtime/context/policy-index.json')));
  assert.match(r.stdout, /policy-index written/);
});

test('policy-index show: reports missing index', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = await runCommand(CMD, ['show'], { cwd: root });
  assert.equal(r.exitCode, 1);
  assert.match(r.stderr, /No policy index/);
});

test('policy-index show: prints JSON when present', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  await runCommand(CMD, ['build'], { cwd: root });
  const r = await runCommand(CMD, ['show'], { cwd: root });
  assert.equal(r.exitCode, 0);
  const parsed = JSON.parse(r.stdout);
  assert.equal(parsed.version, 1);
});

test('policy-index: unknown subcommand → exit 1', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = await runCommand(CMD, ['flarp'], { cwd: root });
  assert.equal(r.exitCode, 1);
  assert.match(r.stderr, /Unknown subcommand/);
});
