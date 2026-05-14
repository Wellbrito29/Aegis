import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MIGRATION_AGENT_IDS,
  TRANSLATOR_AGENT_IDS,
  FORWARD_AGENT_IDS,
} from '../../../lib/installer/prompts.js';

test('prompts: MIGRATION_AGENT_IDS is the migration roster', () => {
  assert.ok(Array.isArray(MIGRATION_AGENT_IDS));
  for (const id of [
    'aegis-migrate', 'aegis-paradigm-advisor', 'aegis-curator',
    'aegis-strategist', 'aegis-designer', 'aegis-inspector',
  ]) {
    assert.ok(MIGRATION_AGENT_IDS.includes(id), `missing ${id}`);
  }
});

test('prompts: TRANSLATOR_AGENT_IDS includes n8n', () => {
  assert.ok(TRANSLATOR_AGENT_IDS.includes('aegis-n8n'));
});

test('prompts: FORWARD_AGENT_IDS includes core forward roles', () => {
  for (const id of [
    'aegis-requirements', 'aegis-tech-brief', 'aegis-doubt', 'aegis-plan',
    'aegis-to-do', 'aegis-audit', 'aegis-quality', 'aegis-coding',
    'aegis-principles', 'aegis-resume',
  ]) {
    assert.ok(FORWARD_AGENT_IDS.includes(id), `missing ${id}`);
  }
});

test('prompts: agent ids are aegis-* prefixed (or "aegis")', () => {
  for (const id of [...MIGRATION_AGENT_IDS, ...TRANSLATOR_AGENT_IDS, ...FORWARD_AGENT_IDS]) {
    assert.match(id, /^aegis(-[\w-]+)?$/);
  }
});
