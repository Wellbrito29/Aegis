import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashFile,
  buildManifest,
  saveManifest,
  loadManifest,
  fileStatus,
  hasFileBeenModified,
} from '../../../lib/installer/manifest.js';
import { makeTmpProject, cleanup, writeFile } from '../../_helpers.js';
import { join } from 'node:path';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';

test('hashFile: returns null for non-existent path', () => {
  assert.equal(hashFile('/nonexistent/abc'), null);
});

test('hashFile: returns null for directory', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  mkdirSync(join(root, 'sub'));
  assert.equal(hashFile(join(root, 'sub')), null);
});

test('hashFile: returns sha256 hex digest for file', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const path = writeFile(root, 'a.txt', 'hello');
  const h = hashFile(path);
  assert.match(h, /^[0-9a-f]{64}$/);
  // sha256 of "hello"
  assert.equal(h, '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
});

test('hashFile: same content yields same hash; different content differs', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const a = writeFile(root, 'a.txt', 'x');
  const b = writeFile(root, 'b.txt', 'x');
  const c = writeFile(root, 'c.txt', 'y');
  assert.equal(hashFile(a), hashFile(b));
  assert.notEqual(hashFile(a), hashFile(c));
});

test('buildManifest: maps relative paths to hashes; skips missing', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'a.txt', 'one');
  writeFile(root, 'b.txt', 'two');
  const m = buildManifest(root, ['a.txt', 'b.txt', 'missing.txt']);
  assert.match(m['a.txt'], /^[0-9a-f]{64}$/);
  assert.match(m['b.txt'], /^[0-9a-f]{64}$/);
  assert.equal(m['missing.txt'], undefined);
});

test('saveManifest + loadManifest: round-trip', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  saveManifest(root, { 'x.txt': 'abc123' });
  assert.ok(existsSync(join(root, 'aegis/config/files-manifest.json')));
  const back = loadManifest(root);
  assert.deepEqual(back, { 'x.txt': 'abc123' });
});

test('loadManifest: returns {} when file missing', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  assert.deepEqual(loadManifest(root), {});
});

test('loadManifest: returns {} when malformed', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'aegis/config/files-manifest.json', '{not json');
  assert.deepEqual(loadManifest(root), {});
});

test('fileStatus: intact when hash matches', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'x.txt', 'body');
  const h = hashFile(join(root, 'x.txt'));
  assert.equal(fileStatus(root, 'x.txt', h), 'intact');
});

test('fileStatus: modified when content changed', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'x.txt', 'body');
  assert.equal(fileStatus(root, 'x.txt', 'wronghash'), 'modified');
});

test('fileStatus: missing when file absent', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  assert.equal(fileStatus(root, 'gone.txt', 'h'), 'missing');
});

test('hasFileBeenModified: false when matches, false when missing, true when differs', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const path = writeFile(root, 'x.txt', 'body');
  const h = hashFile(path);
  assert.equal(hasFileBeenModified(path, h), false);
  assert.equal(hasFileBeenModified('/nonexistent', h), false);
  assert.equal(hasFileBeenModified(path, 'wrong'), true);
});
