import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import {
  buildPolicyIndex,
  writePolicyIndex,
  readPolicyIndex,
  policyIndexPath,
} from '../../../lib/policy/index-builder.js';
import { makeTmpProject, cleanup, writeFile } from '../../_helpers.js';

test('policyIndexPath: returns aegis/runtime/context/policy-index.json', () => {
  const p = policyIndexPath('/proj');
  assert.match(p, /aegis\/runtime\/context\/policy-index\.json$/);
});

test('buildPolicyIndex: empty when sdd dir missing', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const idx = buildPolicyIndex(root);
  assert.equal(idx.version, 1);
  assert.deepEqual(idx.specs, {});
  assert.deepEqual(idx.protected_globs, []);
  assert.deepEqual(idx.protected_files, {});
});

test('buildPolicyIndex: parses protected_files glob list', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'aegis/specs/sdd/auth.md', `---
protected_files:
  - "src/auth/**"
  - "src/login.js"
protected_reason: "login flow is regulated"
---
# Auth spec
`);
  const idx = buildPolicyIndex(root);
  assert.equal(idx.protected_globs.length, 2);
  assert.equal(idx.protected_globs[0].pattern, 'src/auth/**');
  assert.equal(idx.protected_globs[0].spec, 'aegis/specs/sdd/auth.md');
  assert.equal(idx.protected_globs[0].reason, 'login flow is regulated');
});

test('buildPolicyIndex: parses contracts with file/protected', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'aegis/specs/sdd/api.md', `---
contracts:
  - name: createUser
    file: src/api/users.js
    protected: true
    reason: "stable since 1.0"
---
`);
  const idx = buildPolicyIndex(root);
  assert.equal(idx.protected_files['src/api/users.js'].contract, 'createUser');
  assert.equal(idx.protected_files['src/api/users.js'].spec, 'aegis/specs/sdd/api.md');
  assert.equal(idx.protected_files['src/api/users.js'].reason, 'stable since 1.0');
});

test('buildPolicyIndex: contract without protected:true does not enter protected_files', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'aegis/specs/sdd/api.md', `---
contracts:
  - name: foo
    file: src/foo.js
    protected: false
---
`);
  const idx = buildPolicyIndex(root);
  assert.equal(idx.protected_files['src/foo.js'], undefined);
});

test('buildPolicyIndex: skips file without frontmatter', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'aegis/specs/sdd/no-fm.md', '# no frontmatter\nbody only\n');
  const idx = buildPolicyIndex(root);
  assert.deepEqual(idx.specs, {});
});

test('buildPolicyIndex: walks nested subdirs', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'aegis/specs/sdd/sub/dir/x.md', `---
protected_files:
  - "any.js"
---
`);
  const idx = buildPolicyIndex(root);
  assert.equal(idx.protected_globs.length, 1);
  assert.match(idx.protected_globs[0].spec, /sub\/dir\/x\.md$/);
});

test('writePolicyIndex + readPolicyIndex: round-trip', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const idx = buildPolicyIndex(root);
  const path = writePolicyIndex(root, idx);
  assert.ok(existsSync(path));
  const back = readPolicyIndex(root);
  assert.equal(back.version, 1);
});

test('readPolicyIndex: returns null when missing', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  assert.equal(readPolicyIndex(root), null);
});

test('readPolicyIndex: throws on malformed JSON', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'aegis/runtime/context/policy-index.json', '{not valid');
  assert.throws(() => readPolicyIndex(root), /malformed/);
});

test('buildPolicyIndex: spec entry recorded in idx.specs when contracts present', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'aegis/specs/sdd/x.md', `---
contracts:
  - name: foo
    file: bar.js
    protected: true
---
`);
  const idx = buildPolicyIndex(root);
  assert.ok(idx.specs['aegis/specs/sdd/x.md']);
  assert.equal(idx.specs['aegis/specs/sdd/x.md'].contracts.length, 1);
});

test('buildPolicyIndex: handles inline-object contract syntax', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'aegis/specs/sdd/x.md', `---
contracts:
  - { name: foo, file: bar.js, protected: true }
---
`);
  const idx = buildPolicyIndex(root);
  assert.ok(idx.protected_files['bar.js']);
});
