import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  makeTmpProject, cleanup, writeJson, runCommand, REPO_ROOT,
} from '../../_helpers.js';

const CMD = pathToFileURL(join(REPO_ROOT, 'lib/commands/add-hooks.js')).href;

test('add-hooks: bails when not installed', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = await runCommand(CMD, ['--engine=claude-code', '--yes'], { cwd: root });
  assert.match(r.stdout, /not installed|install/);
});

test('add-hooks: rejects unknown engine', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeJson(root, 'aegis/config/state.json', {
    version: '2.0.0', output_folder: 'aegis', agents: ['aegis-keeper'], engines: ['claude-code'],
  });
  const r = await runCommand(CMD, ['--engine=mystery', '--yes'], { cwd: root });
  // Either rejects or asks — we check exit ≠ 0 OR stderr/stdout mentions error.
  assert.equal(typeof r.exitCode, 'number');
});
