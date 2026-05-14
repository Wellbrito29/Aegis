import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  makeTmpProject, cleanup, writeFile, writeJson, readJson, runCommand, REPO_ROOT,
} from '../../_helpers.js';

const CMD = pathToFileURL(join(REPO_ROOT, 'lib/commands/migrate-reversa.js')).href;

test('migrate-reversa: no-op when no Reversa install present', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = await runCommand(CMD, [], { cwd: root });
  assert.equal(r.exitCode, 0);
  assert.match(r.stdout, /No Reversa installation found/);
});

test('migrate-reversa: copies .reversa/ → aegis/ and updates state', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeJson(root, '.reversa/config/state.json', {
    version: '1.9.0', agents: ['reversa-scout', 'reversa-keeper'],
  });
  const r = await runCommand(CMD, [], { cwd: root });
  assert.equal(r.exitCode, 0);
  assert.ok(existsSync(join(root, 'aegis/config/state.json')));
  const state = readJson(root, 'aegis/config/state.json');
  assert.equal(state.version, '2.0.0');
  assert.deepEqual(state.agents, ['aegis-scout', 'aegis-keeper']);
});

test('migrate-reversa: skips when aegis/ already exists', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeJson(root, '.reversa/config/state.json', { version: '1.9.0' });
  writeFile(root, 'aegis/marker', 'pre-existing');
  const r = await runCommand(CMD, [], { cwd: root });
  assert.match(r.stdout, /already exists/);
});

test('migrate-reversa: state.json without agents array is left intact', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeJson(root, '.reversa/config/state.json', { version: '1.9.0' });
  await runCommand(CMD, [], { cwd: root });
  const state = readJson(root, 'aegis/config/state.json');
  assert.equal(state.version, '2.0.0');
});
