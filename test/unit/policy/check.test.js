import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkFile } from '../../../lib/policy/check.js';
import { APPROVE, ADVISORY, BLOCK } from '../../../lib/policy/decisions.js';
import { writePolicyIndex } from '../../../lib/policy/index-builder.js';
import { makeTmpProject, cleanup, writeFile, writeJson } from '../../_helpers.js';

function withIndex(root, idx) {
  writePolicyIndex(root, {
    version: 1,
    built_at: new Date().toISOString(),
    specs: {},
    protected_globs: [],
    protected_files: {},
    ...idx,
  });
}

test('checkFile: no policy index → APPROVE', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const d = checkFile(root, 'src/x.js');
  assert.equal(d.decision, APPROVE);
  assert.equal(d.reason, 'no policy index');
});

test('checkFile: protected_files exact match without diff context → BLOCK', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  withIndex(root, {
    protected_files: {
      'src/api.js': { spec: 'aegis/specs/sdd/api.md', contract: 'createUser', reason: 'public API' },
    },
  });
  const d = checkFile(root, 'src/api.js');
  assert.equal(d.decision, BLOCK);
  assert.equal(d.spec, 'aegis/specs/sdd/api.md');
  assert.equal(d.reason, 'public API');
});

test('checkFile: protected_files with body-only edit → APPROVE', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  withIndex(root, {
    protected_files: { 'src/api.js': { spec: 'sp.md', contract: null, reason: 'r' } },
  });
  const d = checkFile(root, 'src/api.js', {
    before: 'export function f(a) { return a; }\n',
    after: 'export function f(a) { return a + 0; }\n',
  });
  assert.equal(d.decision, APPROVE);
});

test('checkFile: protected_files with signature change → BLOCK', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  withIndex(root, {
    protected_files: {
      'src/api.js': { spec: 'sp.md', contract: 'f', reason: 'r' },
    },
  });
  const d = checkFile(root, 'src/api.js', {
    before: 'export function f(a) { return a; }\n',
    after: 'export function f(a, b) { return a + b; }\n',
  });
  assert.equal(d.decision, BLOCK);
  assert.match(d.reason, /Signature change/);
});

test('checkFile: protected_globs match → BLOCK', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  withIndex(root, {
    protected_globs: [
      { pattern: 'src/auth/**', spec: 'aegis/specs/sdd/auth.md', reason: 'auth flow' },
    ],
  });
  const d = checkFile(root, 'src/auth/login.js');
  assert.equal(d.decision, BLOCK);
  assert.match(d.reason, /auth flow/);
});

test('checkFile: protected_globs no match → APPROVE', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  withIndex(root, {
    protected_globs: [{ pattern: 'src/auth/**', spec: 's', reason: 'r' }],
  });
  const d = checkFile(root, 'src/util/x.js');
  assert.equal(d.decision, APPROVE);
});

test('checkFile: auto-policy.yaml blacklist match → BLOCK', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  withIndex(root, {});
  writeFile(root, 'aegis/config/auto-policy.yaml', `auto_resolve:
  blacklist:
    paths:
      - "src/critical/**"
`);
  const d = checkFile(root, 'src/critical/x.js');
  assert.equal(d.decision, BLOCK);
  assert.match(d.reason, /blacklist/);
});

test('checkFile: BLOCK demoted to ADVISORY when override active', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  withIndex(root, {
    protected_files: { 'src/api.js': { spec: 's', contract: null, reason: 'r' } },
  });
  // ADR mentions the file → override active
  writeFile(root, 'aegis/adrs/0001.md', 'Approved override for src/api.js');
  const d = checkFile(root, 'src/api.js');
  assert.equal(d.decision, ADVISORY);
  assert.equal(d.override.kind, 'adr');
});

test('checkFile: protected without parser still BLOCKs (parse failed branch)', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  withIndex(root, {
    protected_files: { 'docs/api.md': { spec: 's', contract: null, reason: 'r' } },
  });
  const d = checkFile(root, 'docs/api.md', { before: 'a', after: 'b' });
  assert.equal(d.decision, BLOCK);
  assert.match(d.reason, /diff unavailable/);
});

test('checkFile: returns category metadata', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  withIndex(root, {
    protected_files: { 'src/api.js': { spec: 's', contract: null, reason: 'r' } },
  });
  const d = checkFile(root, 'src/api.js', {
    before: 'export function a() {}\n',
    after: 'export function a(x) {}\n',
  });
  assert.equal(d.category, 'signature_change');
});
