import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diffSignatures } from '../../../lib/policy/diff-detector.js';

test('diffSignatures: returns parsed=false for unsupported extensions', () => {
  const r = diffSignatures('readme.md', 'a', 'b');
  assert.equal(r.parsed, false);
  assert.match(r.reason, /no L1 parser/);
});

test('diffSignatures: detects added export', () => {
  const before = `export function a() {}\n`;
  const after = `export function a() {}\nexport function b() {}\n`;
  const r = diffSignatures('src/x.js', before, after);
  assert.equal(r.parsed, true);
  assert.equal(r.added.length, 1);
  assert.equal(r.added[0].name, 'b');
});

test('diffSignatures: detects removed export', () => {
  const before = `export function a() {}\nexport function b() {}\n`;
  const after = `export function a() {}\n`;
  const r = diffSignatures('src/x.js', before, after);
  assert.equal(r.parsed, true);
  assert.equal(r.removed.length, 1);
  assert.equal(r.removed[0].name, 'b');
});

test('diffSignatures: detects signature change (arity)', () => {
  const before = `export function f(a) { return a; }\n`;
  const after = `export function f(a, b) { return a + b; }\n`;
  const r = diffSignatures('src/x.js', before, after);
  assert.equal(r.parsed, true);
  assert.equal(r.changed.length, 1);
  assert.ok(r.changed[0].reasons.includes('signature'));
});

test('diffSignatures: body-only edit yields zero changed', () => {
  const before = `export function f(a) { return a; }\n`;
  const after = `export function f(a) { return a + 0; }\n`;
  const r = diffSignatures('src/x.js', before, after);
  assert.equal(r.parsed, true);
  assert.equal(r.changed.length, 0);
  assert.equal(r.unchanged, 1);
});

test('diffSignatures: detects exported→unexported', () => {
  const before = `export function f() {}\n`;
  const after = `function f() {}\n`;
  const r = diffSignatures('src/x.js', before, after);
  assert.equal(r.parsed, true);
  // The symbol id may differ between exported/non-exported; either added/removed or changed.
  const totalDiffs = r.added.length + r.removed.length + r.changed.length;
  assert.ok(totalDiffs >= 1);
});

test('diffSignatures: handles parse error gracefully', () => {
  const before = `export function a() {}\n`;
  const after = `export function a(`;  // unterminated
  const r = diffSignatures('src/x.js', before, after);
  // Babel uses errorRecovery: true, so it may still parse — either parsed or not, no crash.
  assert.equal(typeof r.parsed, 'boolean');
});

test('diffSignatures: non-string before/after yields empty symbols', () => {
  const r = diffSignatures('src/x.js', null, null);
  assert.equal(r.parsed, true);
  assert.equal(r.added.length, 0);
  assert.equal(r.removed.length, 0);
});
