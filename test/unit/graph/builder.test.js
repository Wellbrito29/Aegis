import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildGraph } from '../../../lib/graph/builder.js';
import { makeTmpProject, cleanup, writeFile, seedJsProject } from '../../_helpers.js';

test('buildGraph: empty project yields empty graph with version + level', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const g = buildGraph(root);
  assert.equal(g.version, 1);
  assert.equal(g.level, 'L0');
  assert.deepEqual(g.nodes, []);
  assert.deepEqual(g.edges, []);
  assert.deepEqual(g.languages_detected, []);
});

test('buildGraph: js project yields nodes for each file', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  seedJsProject(root);
  const g = buildGraph(root);
  const ids = g.nodes.map((n) => n.id).sort();
  assert.ok(ids.includes('src/a.js'));
  assert.ok(ids.includes('src/b.js'));
});

test('buildGraph: emits imports edge between resolved files', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  seedJsProject(root);
  const g = buildGraph(root);
  const edge = g.edges.find((e) => e.from === 'src/a.js' && e.to === 'src/b.js');
  assert.ok(edge);
  assert.equal(edge.kind, 'imports');
});

test('buildGraph: ignores node_modules and aegis dirs by default', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'src/a.js', "import './b.js';\n");
  writeFile(root, 'src/b.js', '');
  writeFile(root, 'node_modules/lib/x.js', 'export {};\n');
  writeFile(root, 'aegis/runtime/y.js', 'export {};\n');
  const g = buildGraph(root);
  assert.equal(g.nodes.find((n) => n.id.startsWith('node_modules')), undefined);
  assert.equal(g.nodes.find((n) => n.id.startsWith('aegis/')), undefined);
});

test('buildGraph: dedups duplicate edges', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'src/a.js', "import './b.js';\nimport './b.js';\n");
  writeFile(root, 'src/b.js', 'export const x = 1;\n');
  const g = buildGraph(root);
  const edges = g.edges.filter((e) => e.from === 'src/a.js' && e.to === 'src/b.js');
  assert.equal(edges.length, 1);
});

test('buildGraph: drops edges to unresolved external imports', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'src/a.js', "import 'react';\nimport './b.js';\n");
  writeFile(root, 'src/b.js', '');
  const g = buildGraph(root);
  const reactEdge = g.edges.find((e) => e.to === 'react');
  assert.equal(reactEdge, undefined);
});

test('buildGraph: onlyFiles option restricts walk', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'src/a.js', "import './b.js';\n");
  writeFile(root, 'src/b.js', '');
  writeFile(root, 'src/c.js', '');
  const g = buildGraph(root, { onlyFiles: ['src/a.js'] });
  // a.js parsed, b.js added by import resolution, c.js never visited.
  assert.equal(g.nodes.find((n) => n.id === 'src/c.js'), undefined);
});

test('buildGraph: custom ignores honored', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'src/a.js', '');
  writeFile(root, 'fixtures/x.js', '');
  const g = buildGraph(root, { ignores: ['fixtures'] });
  assert.equal(g.nodes.find((n) => n.id.startsWith('fixtures/')), undefined);
});

test('buildGraph: parse errors do not crash the walk', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'src/a.js', 'syntax !! ((( error');
  writeFile(root, 'src/b.js', 'export const x = 1;\n');
  const g = buildGraph(root);
  // a.js may or may not get a node depending on how recovery treats it,
  // b.js should always be present.
  assert.ok(g.nodes.find((n) => n.id === 'src/b.js'));
});
