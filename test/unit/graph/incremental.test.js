import { test } from 'node:test';
import assert from 'node:assert/strict';
import { incrementalUpdate } from '../../../lib/graph/incremental.js';
import { buildGraph } from '../../../lib/graph/builder.js';
import { makeTmpProject, cleanup, writeFile, seedJsProject } from '../../_helpers.js';
import { unlinkSync } from 'node:fs';
import { join } from 'node:path';

test('incrementalUpdate: re-parses dirty file and merges into graph', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  seedJsProject(root);
  const g0 = buildGraph(root);

  // Add a new file, declare it dirty
  writeFile(root, 'src/c.js', "import './b.js';\n");
  const g1 = incrementalUpdate(root, g0, ['src/c.js']);
  assert.ok(g1.nodes.find((n) => n.id === 'src/c.js'));
  assert.ok(g1.edges.find((e) => e.from === 'src/c.js' && e.to === 'src/b.js'));
});

test('incrementalUpdate: dropped file removed from nodes', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  seedJsProject(root);
  const g0 = buildGraph(root);

  unlinkSync(join(root, 'src/b.js'));
  const g1 = incrementalUpdate(root, g0, ['src/b.js']);
  // b.js gets removed from nodes (src/a.js still present, edges from a.js dropped)
  assert.equal(g1.nodes.find((n) => n.id === 'src/b.js'), undefined);
});

test('incrementalUpdate: removes outgoing edges of dirty file', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'src/a.js', "import './b.js';\n");
  writeFile(root, 'src/b.js', '');
  writeFile(root, 'src/c.js', '');
  const g0 = buildGraph(root);

  // Re-write a.js to import c instead
  writeFile(root, 'src/a.js', "import './c.js';\n");
  const g1 = incrementalUpdate(root, g0, ['src/a.js']);
  const oldEdge = g1.edges.find((e) => e.from === 'src/a.js' && e.to === 'src/b.js');
  const newEdge = g1.edges.find((e) => e.from === 'src/a.js' && e.to === 'src/c.js');
  assert.equal(oldEdge, undefined);
  assert.ok(newEdge);
});

test('incrementalUpdate: preserves untouched nodes', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'src/a.js', '');
  writeFile(root, 'src/b.js', '');
  const g0 = buildGraph(root);

  writeFile(root, 'src/c.js', '');
  const g1 = incrementalUpdate(root, g0, ['src/c.js']);
  assert.ok(g1.nodes.find((n) => n.id === 'src/a.js'));
  assert.ok(g1.nodes.find((n) => n.id === 'src/b.js'));
  assert.ok(g1.nodes.find((n) => n.id === 'src/c.js'));
});

test('incrementalUpdate: empty dirty list returns near-identical graph', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  seedJsProject(root);
  const g0 = buildGraph(root);
  const g1 = incrementalUpdate(root, g0, []);
  assert.equal(g1.nodes.length, g0.nodes.length);
  assert.equal(g1.edges.length, g0.edges.length);
});
