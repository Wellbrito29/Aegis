import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { appendAuditEntry, auditLogPath } from '../../../lib/audit/writer.js';
import { makeTmpProject, cleanup, writeJson } from '../../_helpers.js';

test('auditLogPath: encodes ISO date YYYY-MM-DD.jsonl', () => {
  const p = auditLogPath('/proj', new Date('2026-05-14T10:00:00Z'));
  assert.equal(p, join('/proj', 'aegis', 'runtime', 'audit', '2026-05-14.jsonl'));
});

test('auditLogPath: defaults to today', () => {
  const p = auditLogPath('/proj');
  assert.match(p, /aegis\/runtime\/audit\/\d{4}-\d{2}-\d{2}\.jsonl$/);
});

test('appendAuditEntry: creates audit dir + writes JSONL line', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  appendAuditEntry(root, { route: 'auto_resolve', file: 'src/x.js' });
  const path = auditLogPath(root);
  assert.ok(existsSync(path));
  const content = readFileSync(path, 'utf8');
  const parsed = JSON.parse(content.trim());
  assert.equal(parsed.route, 'auto_resolve');
  assert.equal(parsed.file, 'src/x.js');
});

test('appendAuditEntry: appends multiple lines without overwrite', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  appendAuditEntry(root, { id: 'one' });
  appendAuditEntry(root, { id: 'two' });
  const lines = readFileSync(auditLogPath(root), 'utf8').trim().split('\n');
  assert.equal(lines.length, 2);
  assert.equal(JSON.parse(lines[0]).id, 'one');
  assert.equal(JSON.parse(lines[1]).id, 'two');
});

test('appendAuditEntry: applies redaction when audit-policy.json present', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeJson(root, 'aegis/config/audit-policy.json', { redact: ['file', 'diff'] });
  // Use a fresh tmp root: the policy cache keys by projectRoot so each
  // test root re-loads its own policy.
  appendAuditEntry(root, { route: 'auto_resolve', file: 'sensitive.js', diff: 'body' });
  const line = readFileSync(auditLogPath(root), 'utf8').trim();
  const parsed = JSON.parse(line);
  assert.match(parsed.file, /^sha256:/);
  assert.match(parsed.diff, /^sha256:/);
  assert.deepEqual(parsed.redacted, ['file', 'diff']);
});

test('appendAuditEntry: malformed audit-policy.json is ignored gracefully', async (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const fs = await import('node:fs');
  fs.mkdirSync(join(root, 'aegis/config'), { recursive: true });
  fs.writeFileSync(join(root, 'aegis/config/audit-policy.json'), '{not json');
  appendAuditEntry(root, { id: 'survives' });
  const parsed = JSON.parse(readFileSync(auditLogPath(root), 'utf8').trim());
  assert.equal(parsed.id, 'survives');
  assert.equal(parsed.redacted, undefined);
});

test('appendAuditEntry: swallows fs errors silently', (t) => {
  // Make 'aegis' a regular file at the project root so mkdirSync of a
  // subpath fails with ENOTDIR. The writer must catch and swallow it.
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFileSync(join(root, 'aegis'), 'not-a-dir');
  assert.doesNotThrow(() => appendAuditEntry(root, { id: 'x' }));
});
