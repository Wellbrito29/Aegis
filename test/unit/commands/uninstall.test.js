import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  makeTmpProject, cleanup, writeJson, writeFile, runCommand, mockInquirer, REPO_ROOT,
} from '../../_helpers.js';

const CMD = pathToFileURL(join(REPO_ROOT, 'lib/commands/uninstall.js')).href;

test('uninstall: bails when not installed', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = await runCommand(CMD, [], { cwd: root });
  assert.match(r.stdout, /not installed/);
});

test('uninstall: removes tracked files when user confirms', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeJson(root, 'aegis/config/state.json', {
    version: '2.0.0',
    output_folder: 'aegis',
    created_files: ['CLAUDE.md'],
  });
  writeFile(root, 'CLAUDE.md', '# entry');
  const restore = await mockInquirer([{ confirm: true }]);
  t.after(restore);
  const r = await runCommand(CMD, [], { cwd: root });
  assert.equal(r.exitCode, 0);
});

test('uninstall: aborts when user declines', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeJson(root, 'aegis/config/state.json', {
    version: '2.0.0', output_folder: 'aegis', created_files: ['CLAUDE.md'],
  });
  writeFile(root, 'CLAUDE.md', '# entry');
  const restore = await mockInquirer([{ confirm: false }]);
  t.after(restore);
  await runCommand(CMD, [], { cwd: root });
  // CLAUDE.md preserved
  assert.ok(existsSync(join(root, 'CLAUDE.md')));
});
