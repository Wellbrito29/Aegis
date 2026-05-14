import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasOverride } from '../../../lib/policy/overrides.js';
import { makeTmpProject, cleanup, writeFile, writeJson } from '../../_helpers.js';

test('overrides: returns inactive when no sources match', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = hasOverride(root, { file: 'src/x.js' });
  assert.equal(r.active, false);
});

test('overrides: ADR file mentioning the file path activates override', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'aegis/adrs/0001-allow.md', '# Allow\nWe accept changes to src/api.js for now.\n');
  const r = hasOverride(root, { file: 'src/api.js' });
  assert.equal(r.active, true);
  assert.equal(r.kind, 'adr');
  assert.equal(r.adr, '0001-allow.md');
});

test('overrides: ADR mentioning contract name activates', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'aegis/adrs/x.md', 'createUser is allowed');
  const r = hasOverride(root, { contract: 'createUser' });
  assert.equal(r.active, true);
  assert.equal(r.kind, 'adr');
});

test('overrides: ADR not mentioning target → no override', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'aegis/adrs/x.md', '# unrelated');
  const r = hasOverride(root, { file: 'src/api.js' });
  assert.equal(r.active, false);
});

test('overrides: commit message ctx with [aegis-override:reason] activates', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = hasOverride(root, { file: 'src/api.js' }, {
    commitMessage: 'fix: bug [aegis-override: legal cleared this]',
  });
  assert.equal(r.active, true);
  assert.equal(r.kind, 'commit-flag');
  assert.equal(r.reason, 'legal cleared this');
});

test('overrides: commit flag without reason still activates with null reason', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = hasOverride(root, { file: 'x.js' }, {
    commitMessage: '[aegis-override]',
  });
  assert.equal(r.active, true);
  assert.equal(r.reason, null);
});

test('overrides: env REVERSA_COMMIT_MSG also activates', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const orig = process.env.REVERSA_COMMIT_MSG;
  process.env.REVERSA_COMMIT_MSG = 'something [aegis-override: x]';
  try {
    const r = hasOverride(root, { file: 'a' });
    assert.equal(r.active, true);
  } finally {
    if (orig != null) process.env.REVERSA_COMMIT_MSG = orig;
    else delete process.env.REVERSA_COMMIT_MSG;
  }
});

test('overrides: .git/COMMIT_EDITMSG path is read', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, '.git/COMMIT_EDITMSG', 'wip [aegis-override: y]');
  const r = hasOverride(root, { file: 'a' });
  assert.equal(r.active, true);
});

test('overrides: cliUnprotect activates when state.json policy_overrides has entry', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const future = new Date(Date.now() + 86400000).toISOString();
  writeJson(root, 'aegis/config/state.json', {
    policy_overrides: { 'src/api.js': { until: future, reason: 'manual unprotect' } },
  });
  const r = hasOverride(root, { file: 'src/api.js' });
  assert.equal(r.active, true);
  assert.equal(r.kind, 'cli-unprotect');
  assert.equal(r.reason, 'manual unprotect');
});

test('overrides: cliUnprotect ignores expired entries', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const past = new Date(Date.now() - 86400000).toISOString();
  writeJson(root, 'aegis/config/state.json', {
    policy_overrides: { 'src/api.js': { until: past, reason: 'old' } },
  });
  const r = hasOverride(root, { file: 'src/api.js' });
  assert.equal(r.active, false);
});

test('overrides: malformed state.json is ignored', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'aegis/config/state.json', '{not valid');
  const r = hasOverride(root, { file: 'a' });
  assert.equal(r.active, false);
});

test('overrides: only .md files in adrs are scanned', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'aegis/adrs/notes.txt', 'src/api.js mentioned');
  const r = hasOverride(root, { file: 'src/api.js' });
  assert.equal(r.active, false);
});
