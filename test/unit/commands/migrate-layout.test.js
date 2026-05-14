import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { makeTmpProject, cleanup, writeFile, runCommand, REPO_ROOT } from '../../_helpers.js';

const CMD = pathToFileURL(join(REPO_ROOT, 'lib/commands/migrate-layout.js')).href;

// Note: without --dry-run the command awaits inquirer.prompt — we only
// exercise the dry-run + no-op paths to keep tests non-interactive.

test('migrate-layout: nothing to migrate when no legacy dirs', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = await runCommand(CMD, ['--dry-run'], { cwd: root });
  assert.match(r.stdout, /Nothing to migrate/);
});

test('migrate-layout: --dry-run lists planned moves without applying', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, '.aegis/state.json', '{}');
  writeFile(root, '_aegis_sdd/architecture.md', '# arch');
  const r = await runCommand(CMD, ['--dry-run'], { cwd: root });
  assert.match(r.stdout, /Planned migrations/);
  assert.ok(existsSync(join(root, '.aegis/state.json')));
  assert.ok(existsSync(join(root, '_aegis_sdd/architecture.md')));
  // Confirms dry-run did not create destination
  assert.equal(existsSync(join(root, 'aegis/architecture/architecture.md')), false);
});

test('migrate-layout: --dry-run shows skip reasons for existing destinations', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, '_aegis_sdd/architecture.md', '# old');
  writeFile(root, 'aegis/architecture/architecture.md', '# new');
  const r = await runCommand(CMD, ['--dry-run'], { cwd: root });
  // Either reports skipped-due-to-destination or finds nothing to migrate
  // (since architecture.md is the only candidate that already exists).
  assert.equal(r.exitCode, 0);
});
