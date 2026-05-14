import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  decide,
  ROUTE_AUTO,
  ROUTE_REVIEW,
  ROUTE_ESCALATE,
} from '../../../lib/auto/decision-tree.js';
import { DEFAULT_POLICY } from '../../../lib/auto/policy-schema.js';

function policy(overrides = {}) {
  // DEFAULT_POLICY is frozen — clone for mutation.
  const base = JSON.parse(JSON.stringify(DEFAULT_POLICY));
  return { ...base, ...overrides };
}

test('decide: disabled policy → needs_review', async () => {
  const r = await decide(policy({ enabled: false }), { file: 'x.js' });
  assert.equal(r.route, ROUTE_REVIEW);
  assert.equal(r.source, 'policy');
});

test('decide: blacklist path match → escalate', async () => {
  const r = await decide(
    policy({
      enabled: true,
      blacklist: { paths: ['**/contracts/**'], change_types: [] },
    }),
    { file: 'src/contracts/auth.js' },
  );
  assert.equal(r.route, ROUTE_ESCALATE);
  assert.match(r.reason, /blacklist: path/);
});

test('decide: blacklist change_type match → escalate', async () => {
  const r = await decide(
    policy({
      enabled: true,
      blacklist: { paths: [], change_types: ['public_api_change'] },
    }),
    { file: 'src/x.js', change_type: 'public_api_change' },
  );
  assert.equal(r.route, ROUTE_ESCALATE);
});

test('decide: whitelist path match → auto_resolve', async () => {
  const r = await decide(
    policy({
      enabled: true,
      whitelist: { paths: ['docs/**'], change_types: [] },
    }),
    { file: 'docs/x.md' },
  );
  assert.equal(r.route, ROUTE_AUTO);
});

test('decide: blacklist takes precedence over whitelist', async () => {
  const r = await decide(
    policy({
      enabled: true,
      whitelist: { paths: ['**/*.js'], change_types: [] },
      blacklist: { paths: ['src/critical.js'], change_types: [] },
    }),
    { file: 'src/critical.js' },
  );
  assert.equal(r.route, ROUTE_ESCALATE);
});

test('decide: escalate_on by change_type', async () => {
  const r = await decide(
    policy({ enabled: true, escalate_on: ['spec_deletion'] }),
    { file: 'x.js', change_type: 'spec_deletion' },
  );
  assert.equal(r.route, ROUTE_ESCALATE);
  assert.match(r.reason, /spec_deletion/);
});

test('decide: escalate_on by severity', async () => {
  const r = await decide(
    policy({ enabled: true, escalate_on: ['high'] }),
    { file: 'x.js', severity: 'high' },
  );
  assert.equal(r.route, ROUTE_ESCALATE);
});

test('decide: escalate_on by tag', async () => {
  const r = await decide(
    policy({ enabled: true, escalate_on: ['security'] }),
    { file: 'x.js', tags: ['security', 'audit'] },
  );
  assert.equal(r.route, ROUTE_ESCALATE);
});

test('decide: escalate_on transition arrows', async () => {
  const r = await decide(
    policy({ enabled: true, escalate_on: ['🟢 → 🔴'] }),
    { file: 'x.js', transition: '🟢 → 🔴' },
  );
  assert.equal(r.route, ROUTE_ESCALATE);
});

test('decide: no classifier → needs_review', async () => {
  const r = await decide(policy({ enabled: true }), { file: 'x.js' });
  assert.equal(r.route, ROUTE_REVIEW);
  assert.equal(r.reason, 'no classifier provided');
});

test('decide: classifier high confidence + non-high severity → auto', async () => {
  const r = await decide(
    policy({ enabled: true, confidence_threshold: 0.8 }),
    { file: 'x.js' },
    async () => ({ severity: 'low', confidence: 0.95, change_type: 'test_only' }),
  );
  assert.equal(r.route, ROUTE_AUTO);
  assert.equal(r.confidence, 0.95);
  assert.equal(r.classification.change_type, 'test_only');
});

test('decide: classifier high severity even with high confidence → review', async () => {
  const r = await decide(
    policy({ enabled: true, confidence_threshold: 0.8 }),
    { file: 'x.js' },
    async () => ({ severity: 'high', confidence: 0.99 }),
  );
  assert.equal(r.route, ROUTE_REVIEW);
  assert.match(r.reason, /severity=high/);
});

test('decide: classifier low confidence → review', async () => {
  const r = await decide(
    policy({ enabled: true, confidence_threshold: 0.8 }),
    { file: 'x.js' },
    async () => ({ severity: 'low', confidence: 0.5 }),
  );
  assert.equal(r.route, ROUTE_REVIEW);
});

test('decide: classifier throws → review with failure reason', async () => {
  const r = await decide(
    policy({ enabled: true }),
    { file: 'x.js' },
    async () => { throw new Error('boom'); },
  );
  assert.equal(r.route, ROUTE_REVIEW);
  assert.match(r.reason, /classifier failed: boom/);
});
