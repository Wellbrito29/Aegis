import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emit as emitClaude } from '../../../lib/policy/adapters/claude.js';
import { emit as emitCodex } from '../../../lib/policy/adapters/codex.js';
import { emit as emitCursor } from '../../../lib/policy/adapters/cursor.js';
import { emit as emitKimi } from '../../../lib/policy/adapters/kimi.js';
import { emit as emitOpencode } from '../../../lib/policy/adapters/opencode.js';
import { APPROVE, ADVISORY, BLOCK } from '../../../lib/policy/decisions.js';

function fakeStreams() {
  const stdout = { buf: '', write(s) { this.buf += s; } };
  const stderr = { buf: '', write(s) { this.buf += s; } };
  return { stdout, stderr };
}

const adapters = [
  ['claude', emitClaude],
  ['codex', emitCodex],
  ['kimi', emitKimi],
];

for (const [name, emit] of adapters) {
  test(`adapter ${name}: APPROVE → exit 0, no output`, () => {
    const s = fakeStreams();
    assert.equal(emit({ decision: APPROVE }, s), 0);
    assert.equal(s.stdout.buf, '');
    assert.equal(s.stderr.buf, '');
  });

  test(`adapter ${name}: ADVISORY → exit 0, stderr prefix`, () => {
    const s = fakeStreams();
    assert.equal(emit({ decision: ADVISORY, reason: 'soft warn' }, s), 0);
    assert.match(s.stderr.buf, /\[aegis-policy\] advisory: soft warn/);
  });

  test(`adapter ${name}: BLOCK → exit 2, JSON on stdout`, () => {
    const s = fakeStreams();
    assert.equal(
      emit({ decision: BLOCK, reason: 'protected', spec: 'aegis/specs/sdd/x.md' }, s),
      2,
    );
    const obj = JSON.parse(s.stdout.buf.trim());
    assert.equal(obj.decision, 'block');
    assert.equal(obj.reason, 'protected');
    assert.equal(obj.spec, 'aegis/specs/sdd/x.md');
  });

  test(`adapter ${name}: unknown decision → exit 0 silently`, () => {
    const s = fakeStreams();
    assert.equal(emit({ decision: 'mystery' }, s), 0);
    assert.equal(s.stdout.buf, '');
    assert.equal(s.stderr.buf, '');
  });

  test(`adapter ${name}: BLOCK without spec emits null`, () => {
    const s = fakeStreams();
    emit({ decision: BLOCK, reason: 'r' }, s);
    assert.equal(JSON.parse(s.stdout.buf.trim()).spec, null);
  });
}

test('adapter cursor: BLOCK exits 0 (does not interrupt) and writes JSON+stderr', () => {
  const s = fakeStreams();
  assert.equal(
    emitCursor({ decision: BLOCK, reason: 'r', spec: 'sp' }, s),
    0,
  );
  assert.match(s.stderr.buf, /BLOCK: r/);
  const obj = JSON.parse(s.stdout.buf.trim());
  assert.equal(obj.decision, 'block');
  assert.match(obj.note, /Cursor cannot pre-block/);
});

test('adapter cursor: APPROVE silent', () => {
  const s = fakeStreams();
  assert.equal(emitCursor({ decision: APPROVE }, s), 0);
  assert.equal(s.stdout.buf, '');
});

test('adapter cursor: ADVISORY → stderr', () => {
  const s = fakeStreams();
  emitCursor({ decision: ADVISORY, reason: 'a' }, s);
  assert.match(s.stderr.buf, /advisory/);
});

test('adapter opencode: BLOCK without env var → exit 2 + JSON', () => {
  const orig = process.env.REVERSA_OPENCODE_PLUGIN;
  delete process.env.REVERSA_OPENCODE_PLUGIN;
  try {
    const s = fakeStreams();
    assert.equal(emitOpencode({ decision: BLOCK, reason: 'r' }, s), 2);
    const obj = JSON.parse(s.stdout.buf.trim());
    assert.equal(obj.decision, 'block');
  } finally {
    if (orig != null) process.env.REVERSA_OPENCODE_PLUGIN = orig;
  }
});

test('adapter opencode: BLOCK with env var → throws', () => {
  const orig = process.env.REVERSA_OPENCODE_PLUGIN;
  process.env.REVERSA_OPENCODE_PLUGIN = '1';
  try {
    const s = fakeStreams();
    assert.throws(
      () => emitOpencode({ decision: BLOCK, reason: 'protected' }, s),
      /aegis policy block: protected/,
    );
  } finally {
    if (orig != null) process.env.REVERSA_OPENCODE_PLUGIN = orig;
    else delete process.env.REVERSA_OPENCODE_PLUGIN;
  }
});

test('adapter opencode: APPROVE silent', () => {
  const s = fakeStreams();
  assert.equal(emitOpencode({ decision: APPROVE }, s), 0);
  assert.equal(s.stdout.buf, '');
});

test('adapter opencode: ADVISORY → stderr only', () => {
  const s = fakeStreams();
  assert.equal(emitOpencode({ decision: ADVISORY, reason: 'a' }, s), 0);
  assert.match(s.stderr.buf, /advisory: a/);
});
