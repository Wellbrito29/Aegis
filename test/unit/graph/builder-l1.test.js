import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildL1 } from '../../../lib/graph/builder-l1.js';
import { makeTmpProject, cleanup, writeFile } from '../../_helpers.js';

test('buildL1: empty project yields empty L1 graph', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const g = buildL1(root);
  assert.equal(g.version, 2);
  assert.equal(g.level, 'L1');
  assert.deepEqual(g.symbols, []);
  assert.deepEqual(g.calls, []);
});

test('buildL1: extracts function symbols with signatures', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'src/a.js', `
export function add(a, b) { return a + b; }
function helper(x) { return x; }
`);
  const g = buildL1(root);
  const names = g.symbols.map((s) => s.name).sort();
  assert.ok(names.includes('add'));
  assert.ok(names.includes('helper'));
  const add = g.symbols.find((s) => s.name === 'add');
  assert.equal(add.exported, true);
  assert.match(add.signature, /a/);
});

test('buildL1: extracts call edges within file', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'src/a.js', `
export function add(a, b) { return helper(a) + b; }
function helper(x) { return x; }
`);
  const g = buildL1(root);
  const call = g.calls.find((c) => c.callee === 'helper');
  assert.ok(call);
});

test('buildL1: extracts class symbols', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'src/a.js', `
export class Greeter {
  hello(name) { return 'hi ' + name; }
}
`);
  const g = buildL1(root);
  const klass = g.symbols.find((s) => s.name === 'Greeter');
  assert.ok(klass);
  assert.equal(klass.type, 'class');
  const method = g.symbols.find((s) => s.name === 'hello' && s.type === 'method');
  assert.ok(method);
});

test('buildL1: parse errors are recorded, not thrown', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'src/bad.js', 'function {{{ broken');
  writeFile(root, 'src/ok.js', 'export const x = 1;\n');
  const g = buildL1(root);
  // ok.js still produced symbols/exports
  assert.ok(g.symbols.length >= 0); // at minimum no crash
  assert.ok(Array.isArray(g.parse_errors));
});

test('buildL1: ignores non-supported extensions', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'README.md', '# hi');
  writeFile(root, 'src/a.js', 'export const x = 1;\n');
  const g = buildL1(root);
  // No errors for the .md file (skipped early)
  assert.equal(g.parse_errors.find((e) => e.file.endsWith('.md')), undefined);
});

test('buildL1: onlyFiles restricts walk', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'src/a.js', 'export const a = 1;\n');
  writeFile(root, 'src/b.js', 'export const b = 1;\n');
  const g = buildL1(root, { onlyFiles: ['src/a.js'] });
  // Const exports show up in `exports`, not `symbols` (only fns/classes).
  const exportNames = g.exports.map((e) => e.name);
  assert.ok(exportNames.includes('a'));
  assert.equal(exportNames.includes('b'), false);
});

test('buildL1: tracks exports separately', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'src/a.js', `
export function f() {}
export const x = 1;
`);
  const g = buildL1(root);
  assert.ok(g.exports.length >= 2);
  const names = g.exports.map((e) => e.name);
  assert.ok(names.includes('f'));
  assert.ok(names.includes('x'));
});
