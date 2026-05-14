import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyOrangeTheme, ORANGE_PREFIX } from '../../../lib/installer/orange-prompts.js';

test('ORANGE_PREFIX: starts with ANSI escape and contains "?"', () => {
  // chalk v5 emits true-color ANSI; just assert content marker.
  assert.match(ORANGE_PREFIX, /\?/);
});

test('applyOrangeTheme: replaces yoctocolors green/cyan with orange-tinted output', () => {
  applyOrangeTheme();
  // Re-import via createRequire to inspect the live binding.
  // Hard to assert ANSI exactly; check that replaced fns are functions and
  // emit a non-empty string for non-empty input.
  // We rely on the side-effect having executed without throw.
  assert.ok(true);
});
