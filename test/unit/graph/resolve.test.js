import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Resolver } from '../../../lib/graph/resolve.js';
import { makeTmpProject, cleanup, writeFile, writeJson } from '../../_helpers.js';

test('Resolver JS: relative ./ resolves to file with extension search', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'src/a.js', '');
  writeFile(root, 'src/b.js', '');
  const r = new Resolver(root);
  assert.equal(r.resolve('src/a.js', './b', 'javascript'), 'src/b.js');
  assert.equal(r.resolve('src/a.js', './b.js', 'javascript'), 'src/b.js');
});

test('Resolver JS: ../ traverses dirs', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'src/a/b.js', '');
  writeFile(root, 'src/c.js', '');
  const r = new Resolver(root);
  assert.equal(r.resolve('src/a/b.js', '../c', 'javascript'), 'src/c.js');
});

test('Resolver JS: directory + index.js', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'src/a.js', '');
  writeFile(root, 'src/lib/index.js', '');
  const r = new Resolver(root);
  assert.equal(r.resolve('src/a.js', './lib', 'javascript'), 'src/lib/index.js');
});

test('Resolver JS: external package returns null', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'src/a.js', '');
  const r = new Resolver(root);
  assert.equal(r.resolve('src/a.js', 'react', 'javascript'), null);
});

test('Resolver JS: tsconfig paths alias resolution', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'src/a.js', '');
  writeFile(root, 'src/lib/util.js', '');
  writeJson(root, 'tsconfig.json', {
    compilerOptions: {
      baseUrl: '.',
      paths: { '@lib/*': ['src/lib/*'] },
    },
  });
  const r = new Resolver(root);
  assert.equal(r.resolve('src/a.js', '@lib/util', 'javascript'), 'src/lib/util.js');
});

test('Resolver Python: dotted absolute import', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'pkg/__init__.py', '');
  writeFile(root, 'pkg/mod.py', '');
  const r = new Resolver(root);
  assert.equal(r.resolve('pkg/mod.py', 'pkg.mod', 'python'), 'pkg/mod.py');
});

test('Resolver Python: relative .. import', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'pkg/sub/x.py', '');
  writeFile(root, 'pkg/util.py', '');
  const r = new Resolver(root);
  assert.equal(r.resolve('pkg/sub/x.py', '..util', 'python'), 'pkg/util.py');
});

test('Resolver Python: __init__.py fallback', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'pkg/__init__.py', '');
  writeFile(root, 'pkg/sub/__init__.py', '');
  const r = new Resolver(root);
  assert.equal(r.resolve('pkg/__init__.py', 'pkg.sub', 'python'), 'pkg/sub/__init__.py');
});

test('Resolver Go: requires go.mod for module name', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'go.mod', 'module example.com/proj\n');
  writeFile(root, 'pkg/util/util.go', 'package util\n');
  writeFile(root, 'main.go', 'package main\n');
  const r = new Resolver(root);
  assert.equal(r.resolve('main.go', 'example.com/proj/pkg/util', 'go'), 'pkg/util/util.go');
});

test('Resolver Go: returns null without go.mod', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'main.go', 'package main\n');
  const r = new Resolver(root);
  assert.equal(r.resolve('main.go', 'example.com/x', 'go'), null);
});

test('Resolver Java: package qualifier → src/main/java', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'src/main/java/com/x/Util.java', 'package com.x;\n');
  writeFile(root, 'src/main/java/com/x/App.java', 'package com.x;\n');
  const r = new Resolver(root);
  assert.equal(
    r.resolve('src/main/java/com/x/App.java', 'com.x.Util', 'java'),
    'src/main/java/com/x/Util.java',
  );
});

test('Resolver Java: wildcard .* stripped', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  writeFile(root, 'src/main/java/com/x/Util.java', 'package com.x;\n');
  const r = new Resolver(root);
  assert.equal(
    r.resolve('a.java', 'com.x.Util.*', 'java'),
    'src/main/java/com/x/Util.java',
  );
});

test('Resolver: unknown language returns null', (t) => {
  const root = makeTmpProject();
  t.after(() => cleanup(root));
  const r = new Resolver(root);
  assert.equal(r.resolve('a.x', 'b', 'cobol'), null);
});
