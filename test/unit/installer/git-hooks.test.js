import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { installGitHook, removeGitHook } from '../../../lib/installer/git-hooks.js';
import { makeTmpProject, cleanup, writeFile } from '../../_helpers.js';

test('installGitHook: throws when not a git repo', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  assert.throws(() => installGitHook(root), /not a git repository/);
});

test('installGitHook: creates pre-commit with markers and exec bit', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  mkdirSync(join(root, '.git'), { recursive: true });
  const path = installGitHook(root);
  assert.ok(existsSync(path));
  const content = readFileSync(path, 'utf8');
  assert.match(content, /aegis policy-check/);
  assert.match(content, />>> aegis policy-check/);
  assert.match(content, /<<< aegis policy-check/);
  // Exec bit (owner exec)
  assert.equal(statSync(path).mode & 0o100, 0o100);
});

test('installGitHook: idempotent — second install replaces block', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  mkdirSync(join(root, '.git'));
  installGitHook(root);
  installGitHook(root);
  const content = readFileSync(join(root, '.git/hooks/pre-commit'), 'utf8');
  const occurrences = (content.match(/>>> aegis policy-check/g) || []).length;
  assert.equal(occurrences, 1);
});

test('installGitHook: preserves user content outside markers', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, '.git/hooks/pre-commit', '#!/bin/sh\n# user lint\necho lint\n');
  installGitHook(root);
  const content = readFileSync(join(root, '.git/hooks/pre-commit'), 'utf8');
  assert.match(content, /# user lint/);
  assert.match(content, /aegis policy-check/);
});

test('removeGitHook: returns false when no hook installed', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  mkdirSync(join(root, '.git'));
  assert.equal(removeGitHook(root), false);
});

test('removeGitHook: returns false when hook lacks marker', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, '.git/hooks/pre-commit', '#!/bin/sh\necho lint\n');
  assert.equal(removeGitHook(root), false);
});

test('removeGitHook: strips block but keeps user content', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, '.git/hooks/pre-commit', '#!/bin/sh\n# user lint\n');
  installGitHook(root);
  assert.equal(removeGitHook(root), true);
  const content = readFileSync(join(root, '.git/hooks/pre-commit'), 'utf8');
  assert.match(content, /# user lint/);
  assert.doesNotMatch(content, /aegis policy-check/);
});
