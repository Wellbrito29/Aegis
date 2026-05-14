import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { graphPath, readGraph, writeGraph } from '../../../lib/graph/store.js';
import { makeTmpProject, cleanup, writeFile } from '../../_helpers.js';

test('graphPath: returns aegis/runtime/context/graph.json', () => {
  const p = graphPath('/proj');
  assert.match(p, /aegis\/runtime\/context\/graph\.json$/);
});

test('readGraph: returns null when missing', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  assert.equal(readGraph(root), null);
});

test('writeGraph + readGraph: round-trip', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const g = { version: 1, level: 'L0', nodes: [], edges: [] };
  const path = writeGraph(root, g);
  assert.ok(existsSync(path));
  const back = readGraph(root);
  assert.deepEqual(back, g);
});

test('readGraph: throws on malformed JSON', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'aegis/runtime/context/graph.json', '{not json');
  assert.throws(() => readGraph(root), /malformed/);
});

test('writeGraph: atomic write — no .tmp left after success', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeGraph(root, { v: 1 });
  assert.equal(existsSync(graphPath(root) + '.tmp'), false);
});
