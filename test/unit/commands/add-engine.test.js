import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  makeTmpProject, cleanup, writeJson, runCommand, REPO_ROOT,
} from '../../_helpers.js';

const CMD = pathToFileURL(join(REPO_ROOT, 'lib/commands/add-engine.js')).href;

test('add-engine: bails when not installed', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = await runCommand(CMD, [], { cwd: root });
  assert.match(r.stdout, /not installed|install/);
});

test('add-engine: refuses when state has no registered agents', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeJson(root, 'aegis/config/state.json', { version: '2.0.0', agents: [] });
  const r = await runCommand(CMD, [], { cwd: root });
  assert.match(r.stdout, /no registered agents/);
});
