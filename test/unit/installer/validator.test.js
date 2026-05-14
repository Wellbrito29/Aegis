import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkExistingInstallation, checkFileConflict } from '../../../lib/installer/validator.js';
import { makeTmpProject, cleanup, writeJson, writeFile } from '../../_helpers.js';
import { join } from 'node:path';

test('checkExistingInstallation: not installed when state.json missing', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = checkExistingInstallation(root);
  assert.equal(r.installed, false);
});

test('checkExistingInstallation: installed when state.json valid', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeJson(root, 'aegis/config/state.json', { version: '2.0.0', phase: 'discovery' });
  const r = checkExistingInstallation(root);
  assert.equal(r.installed, true);
  assert.equal(r.version, '2.0.0');
  assert.equal(r.state.phase, 'discovery');
});

test('checkExistingInstallation: version defaults to "?" when missing', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeJson(root, 'aegis/config/state.json', {});
  const r = checkExistingInstallation(root);
  assert.equal(r.version, '?');
});

test('checkExistingInstallation: malformed state.json → not installed', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'aegis/config/state.json', '{not json');
  const r = checkExistingInstallation(root);
  assert.equal(r.installed, false);
});

test('checkFileConflict: true when file exists', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'CLAUDE.md', '# x');
  assert.equal(checkFileConflict(join(root, 'CLAUDE.md')), true);
});

test('checkFileConflict: false when file missing', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  assert.equal(checkFileConflict(join(root, 'CLAUDE.md')), false);
});
