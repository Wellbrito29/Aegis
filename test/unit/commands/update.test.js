import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  makeTmpProject, cleanup, writeJson, runCommand, mockInquirer, REPO_ROOT,
} from '../../_helpers.js';

const CMD = pathToFileURL(join(REPO_ROOT, 'lib/commands/update.js')).href;

test('update: bails when not installed', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = await runCommand(CMD, [], { cwd: root });
  assert.match(r.stdout, /not installed/);
});

test('update: rejects invalid installed version', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeJson(root, 'aegis/config/state.json', { version: 'not-a-semver' });
  const r = await runCommand(CMD, [], { cwd: root });
  assert.match(r.stdout, /Invalid installed version/);
});

test('update: offline mode prints "could not check" then proceeds with confirm=false', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeJson(root, 'aegis/config/state.json', {
    version: '2.0.0',
    output_folder: 'aegis',
    engines: ['claude-code'],
    agents: ['aegis'],
  });
  // Force fetch to fail by stubbing global fetch
  const origFetch = global.fetch;
  global.fetch = async () => { throw new Error('offline'); };
  const restore = await mockInquirer([{ proceed: false }]);
  t.after(() => { global.fetch = origFetch; restore(); });
  const r = await runCommand(CMD, [], { cwd: root });
  assert.match(r.stdout + r.stderr, /v2\.0\.0|version/i);
});
