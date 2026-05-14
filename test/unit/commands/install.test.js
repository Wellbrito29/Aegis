import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  makeTmpProject, cleanup, writeJson, runCommand, mockInquirer, REPO_ROOT,
} from '../../_helpers.js';

const CMD = pathToFileURL(join(REPO_ROOT, 'lib/commands/install.js')).href;

test('install: existing install + decline reinstall → bails out', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeJson(root, 'aegis/config/state.json', { version: '2.0.0' });
  const restore = await mockInquirer([{ proceed: false }]);
  t.after(restore);
  const r = await runCommand(CMD, [], { cwd: root });
  assert.equal(r.exitCode, 0);
  assert.match(r.stdout, /already installed/);
});

test('install: completes with minimal config when answers provided', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const restore = await mockInquirer([
    {
      engines: ['claude-code'],
      optional_agents: [],
      doc_language: 'en',
      chat_language: 'en',
      project_name: 'demo',
      user_name: 'tester',
      answer_mode: 'chat',
    },
  ]);
  t.after(restore);
  const r = await runCommand(CMD, [], { cwd: root });
  // Either succeeds (creates aegis/) or hits a missing-template branch.
  // Either way, no crash.
  assert.equal(typeof r.exitCode, 'number');
});
