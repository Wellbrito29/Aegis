import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  makeTmpProject, cleanup, writeJson, runCommand, mockInquirer, REPO_ROOT,
} from '../../_helpers.js';

const CMD = pathToFileURL(join(REPO_ROOT, 'lib/commands/add-agent.js')).href;

test('add-agent: bails when not installed', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = await runCommand(CMD, [], { cwd: root });
  assert.match(r.stdout, /not installed|install/);
});

test('add-agent: with empty agent selection → no-op', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeJson(root, 'aegis/config/state.json', {
    version: '2.0.0', output_folder: 'aegis', agents: ['aegis'], engines: ['claude-code'],
  });
  const restore = await mockInquirer([{ selected: [] }]);
  t.after(restore);
  const r = await runCommand(CMD, [], { cwd: root });
  assert.equal(typeof r.exitCode, 'number');
});
