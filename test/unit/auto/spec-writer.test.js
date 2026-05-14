import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// Pre-populate the SDK in require.cache before spec-writer loads.
const req = createRequire(import.meta.url);
const sdkPath = req.resolve('@anthropic-ai/sdk');
const originalCache = req.cache[sdkPath];

let nextResponse = null;
let lastRequest = null;

class StubAnthropic {
  constructor(opts) {
    this.opts = opts;
    this.messages = {
      create: async (r) => {
        lastRequest = r;
        if (nextResponse instanceof Error) throw nextResponse;
        return nextResponse;
      },
    };
  }
}

req.cache[sdkPath] = {
  id: sdkPath,
  filename: sdkPath,
  loaded: true,
  exports: { default: StubAnthropic, Anthropic: StubAnthropic },
};

const { rewriteSpec } = await import('../../../lib/auto/spec-writer.js');

test('rewriteSpec: throws when no API key', async () => {
  const orig = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    await assert.rejects(
      () => rewriteSpec({ specPath: 's.md', specContent: '#', diff: 'd' }),
      /ANTHROPIC_API_KEY not set/,
    );
  } finally {
    if (orig) process.env.ANTHROPIC_API_KEY = orig;
  }
});

test('rewriteSpec: returns content + model + usage', async () => {
  nextResponse = {
    content: [{ type: 'text', text: '# Updated spec\n' }],
    usage: { input_tokens: 100, output_tokens: 30 },
  };
  const out = await rewriteSpec({
    apiKey: 'sk-test',
    specPath: 'aegis/specs/sdd/auth.md',
    specContent: '# Old',
    diff: '+ new behaviour',
  });
  assert.equal(out.content, '# Updated spec\n');
  assert.equal(out.model, 'claude-sonnet-4-6');
  assert.deepEqual(out.usage, { input_tokens: 100, output_tokens: 30 });
});

test('rewriteSpec: passes specPath + specContent to second system block (cached)', async () => {
  nextResponse = { content: [{ type: 'text', text: 'x' }] };
  await rewriteSpec({
    apiKey: 'sk-test',
    specPath: 'aegis/specs/sdd/auth.md',
    specContent: '# auth',
    diff: 'd',
  });
  assert.equal(lastRequest.system.length, 2);
  assert.match(lastRequest.system[1].text, /Spec file: aegis\/specs\/sdd\/auth\.md/);
  assert.match(lastRequest.system[1].text, /# auth/);
  assert.deepEqual(lastRequest.system[1].cache_control, { type: 'ephemeral' });
});

test('rewriteSpec: passes diff and graphContext in user message', async () => {
  nextResponse = { content: [{ type: 'text', text: 'x' }] };
  await rewriteSpec({
    apiKey: 'sk-test',
    specPath: 's.md',
    specContent: '#',
    diff: '+ added line',
    graphContext: '- caller: foo.js',
  });
  const userText = lastRequest.messages[0].content[0].text;
  assert.match(userText, /\+ added line/);
  assert.match(userText, /caller: foo\.js/);
});

test('rewriteSpec: uses custom model when provided', async () => {
  nextResponse = { content: [{ type: 'text', text: 'x' }] };
  const out = await rewriteSpec({
    apiKey: 'sk-test',
    specPath: 's.md',
    specContent: '#',
    diff: 'd',
    model: 'claude-opus-4-7',
  });
  assert.equal(out.model, 'claude-opus-4-7');
  assert.equal(lastRequest.model, 'claude-opus-4-7');
});

test('rewriteSpec: throws on response with no text block', async () => {
  nextResponse = { content: [] };
  await assert.rejects(
    () => rewriteSpec({ apiKey: 'sk-test', specPath: 's', specContent: '#', diff: 'd' }),
    /no text block/,
  );
});

test('rewriteSpec: max_tokens caps at 16000', async () => {
  nextResponse = { content: [{ type: 'text', text: 'x' }] };
  await rewriteSpec({ apiKey: 'sk-test', specPath: 's', specContent: '#', diff: 'd' });
  assert.equal(lastRequest.max_tokens, 16000);
});

test.after(() => {
  if (originalCache) req.cache[sdkPath] = originalCache;
  else delete req.cache[sdkPath];
});
