import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';
import { writePolicyIndex } from '../../../lib/policy/index-builder.js';
import { makeTmpProject, cleanup, writeFile, runCommand, REPO_ROOT } from '../../_helpers.js';

const CMD = pathToFileURL(join(REPO_ROOT, 'lib/commands/policy-check.js')).href;

function gitInit(root) {
  execSync('git init -q', { cwd: root });
  execSync('git config user.email t@t', { cwd: root });
  execSync('git config user.name t', { cwd: root });
  execSync('git commit -q --allow-empty -m base', { cwd: root });
}

test('policy-check: exit 2 when no policy index', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = await runCommand(CMD, ['--format=json'], { cwd: root });
  assert.equal(r.exitCode, 2);
  const parsed = JSON.parse(r.stdout);
  assert.equal(parsed.ok, false);
  assert.match(parsed.error, /no policy index/);
});

test('policy-check: exit 2 on git failure', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writePolicyIndex(root, {
    version: 1, built_at: '', specs: {}, protected_globs: [], protected_files: {},
  });
  const r = await runCommand(CMD, ['--format=json'], { cwd: root });
  assert.equal(r.exitCode, 2);
});

test('policy-check: exit 0 when no diff between identical refs', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  gitInit(root);
  writePolicyIndex(root, {
    version: 1, built_at: '', specs: {}, protected_globs: [], protected_files: {},
  });
  const r = await runCommand(CMD, ['--base=HEAD', '--head=HEAD', '--format=json'], { cwd: root });
  assert.equal(r.exitCode, 0);
  const parsed = JSON.parse(r.stdout);
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.decisions, []);
});

test('policy-check: blocks signature change at HEAD vs base', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  gitInit(root);
  writePolicyIndex(root, {
    version: 1, built_at: '',
    specs: {},
    protected_globs: [],
    protected_files: { 'src/api.js': { spec: 'sp.md', contract: 'f', reason: 'r' } },
  });
  writeFile(root, 'src/api.js', 'export function f(a) { return a; }\n');
  execSync('git add -A && git commit -q -m v1', { cwd: root });
  // Modify with signature change
  writeFile(root, 'src/api.js', 'export function f(a, b) { return a + b; }\n');
  execSync('git add -A && git commit -q -m v2', { cwd: root });
  const r = await runCommand(
    CMD,
    ['--base=HEAD~1', '--head=HEAD', '--format=json', '--severity=high'],
    { cwd: root },
  );
  assert.equal(r.exitCode, 1);
  const parsed = JSON.parse(r.stdout);
  assert.equal(parsed.ok, false);
  assert.ok(parsed.decisions.length >= 1);
});
