import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { makeTmpProject, cleanup, writeJson, runCommand, REPO_ROOT } from '../../_helpers.js';

const CMD = pathToFileURL(join(REPO_ROOT, 'lib/commands/status.js')).href;

test('status: prints "not installed" hint when state.json missing', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = await runCommand(CMD, [], { cwd: root });
  assert.equal(r.exitCode, 0);
  assert.match(r.stdout, /not installed/);
});

test('status: prints state fields when state.json present', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeJson(root, 'aegis/config/state.json', {
    project: 'demo',
    user_name: 'tester',
    version: '2.0.0',
    phase: 'discovery',
    chat_language: 'en',
    doc_language: 'en',
    completed: ['scout'],
    pending: ['archaeologist'],
  });
  const r = await runCommand(CMD, [], { cwd: root });
  assert.match(r.stdout, /demo/);
  assert.match(r.stdout, /tester/);
  assert.match(r.stdout, /2\.0\.0/);
  assert.match(r.stdout, /discovery/);
  assert.match(r.stdout, /scout/);
  assert.match(r.stdout, /archaeologist/);
});

test('status: handles state with empty completed/pending arrays', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeJson(root, 'aegis/config/state.json', { project: 'x' });
  const r = await runCommand(CMD, [], { cwd: root });
  assert.match(r.stdout, /x/);
});
