import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchGlob } from '../../../lib/policy/check.js';

test('matchGlob: literal match', () => {
  assert.equal(matchGlob('src/x.js', 'src/x.js'), true);
  assert.equal(matchGlob('src/x.js', 'src/y.js'), false);
});

test('matchGlob: * matches any chars except /', () => {
  assert.equal(matchGlob('src/*.js', 'src/x.js'), true);
  assert.equal(matchGlob('src/*.js', 'src/y/x.js'), false);
});

test('matchGlob: trailing /** matches anything below', () => {
  assert.equal(matchGlob('src/**', 'src'), true);
  assert.equal(matchGlob('src/**', 'src/x.js'), true);
  assert.equal(matchGlob('src/**', 'src/a/b/c.js'), true);
  assert.equal(matchGlob('src/**', 'other/x.js'), false);
});

test('matchGlob: leading **/ matches zero or more dirs', () => {
  assert.equal(matchGlob('**/x.js', 'x.js'), true);
  assert.equal(matchGlob('**/x.js', 'a/x.js'), true);
  assert.equal(matchGlob('**/x.js', 'a/b/x.js'), true);
});

test('matchGlob: middle /**/ matches any number of dirs', () => {
  assert.equal(matchGlob('src/**/x.js', 'src/x.js'), true);
  assert.equal(matchGlob('src/**/x.js', 'src/a/x.js'), true);
  assert.equal(matchGlob('src/**/x.js', 'src/a/b/x.js'), true);
  assert.equal(matchGlob('src/**/x.js', 'other/x.js'), false);
});

test('matchGlob: combined ** with extension star', () => {
  assert.equal(matchGlob('**/*.test.js', 'a/b.test.js'), true);
  assert.equal(matchGlob('**/*.test.js', 'a/b/c.test.js'), true);
  assert.equal(matchGlob('**/*.test.js', 'a/b.js'), false);
});

test('matchGlob: regex special chars are escaped', () => {
  assert.equal(matchGlob('a.b', 'aXb'), false);
  assert.equal(matchGlob('a.b', 'a.b'), true);
});

test('matchGlob: anchored both ends', () => {
  assert.equal(matchGlob('foo', 'foobar'), false);
  assert.equal(matchGlob('foo', 'barfoo'), false);
});
