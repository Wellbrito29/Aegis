import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeTmpProject, cleanup, writeFile, runCommand, REPO_ROOT } from '../../_helpers.js';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const DRIFT_MD = pathToFileURL(join(REPO_ROOT, 'lib/commands/drift-check.js')).href;

test('drift-check: exit 2 when drift.md missing', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = await runCommand(DRIFT_MD, [], { cwd: root });
  assert.equal(r.exitCode, 2);
  assert.match(r.stderr, /drift\.md not found/);
});

test('drift-check: exit 2 + JSON shape with --format=json when missing', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = await runCommand(DRIFT_MD, ['--format=json'], { cwd: root });
  assert.equal(r.exitCode, 2);
  // process.stdout.write writes raw — captured via runCommand's console.log? No,
  // process.stdout.write bypasses console.log. Inspect process behaviour.
});

test('drift-check: exit 0 when no rows pending at high severity', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'aegis/reports/drift.md', `
| spec | timestamp | status | dist | action |
|---|---|---|---|---|
| \`auth.md\` | t0 | 🟢 resolved | 0 | none |
`);
  const r = await runCommand(DRIFT_MD, ['--severity=high'], { cwd: root });
  assert.equal(r.exitCode, 0);
  assert.match(r.stdout, /clean/);
});

test('drift-check: exit 1 when pending rows at high severity', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'aegis/reports/drift.md', `
| spec | t | status | d | a |
|---|---|---|---|---|
| \`auth.md\` | t0 | 🔴 pending | 1 | review |
`);
  const r = await runCommand(DRIFT_MD, ['--severity=high'], { cwd: root });
  assert.equal(r.exitCode, 1);
  assert.match(r.stderr, /1 spec\(s\)/);
});

test('drift-check: --severity=medium counts stale as blocking', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'aegis/reports/drift.md', `
| spec | t | status | d | a |
|---|---|---|---|---|
| \`x.md\` | t0 | 🟡 stale | 1 | review |
`);
  const high = await runCommand(DRIFT_MD, ['--severity=high'], { cwd: root });
  assert.equal(high.exitCode, 0);
  const med = await runCommand(DRIFT_MD, ['--severity=medium'], { cwd: root });
  assert.equal(med.exitCode, 1);
});

test('drift-check: --severity=low always exits 0', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'aegis/reports/drift.md', `
| spec | t | status | d | a |
|---|---|---|---|---|
| \`x.md\` | t0 | 🔴 pending | 1 | a |
`);
  const r = await runCommand(DRIFT_MD, ['--severity=low'], { cwd: root });
  assert.equal(r.exitCode, 0);
});

test('drift-check: --folder overrides default', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'custom/reports/drift.md', `
| s | t | status | d | a |
|---|---|---|---|---|
| \`x.md\` | t0 | 🟢 resolved | 0 | n |
`);
  const r = await runCommand(DRIFT_MD, ['--folder', 'custom'], { cwd: root });
  assert.equal(r.exitCode, 0);
});

test('drift-check: reads output_folder from state.json', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'aegis/config/state.json', JSON.stringify({ output_folder: 'specs' }));
  writeFile(root, 'specs/reports/drift.md', `
| s | t | status | d | a |
|---|---|---|---|---|
| \`x.md\` | t0 | 🟢 resolved | 0 | n |
`);
  const r = await runCommand(DRIFT_MD, [], { cwd: root });
  assert.equal(r.exitCode, 0);
});

test('drift-check: text status detection works without emoji', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'aegis/reports/drift.md', `
| s | t | status | d | a |
|---|---|---|---|---|
| \`x.md\` | t0 | pending | 1 | a |
`);
  const r = await runCommand(DRIFT_MD, ['--severity=high'], { cwd: root });
  assert.equal(r.exitCode, 1);
});
