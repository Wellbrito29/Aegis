import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// Pre-populate the SDK in require.cache BEFORE the classifier module loads.
// classifier.js calls createRequire(import.meta.url) and then require_(sdk),
// which hits this cache.
const req = createRequire(import.meta.url);
const sdkPath = req.resolve('@anthropic-ai/sdk');
const originalCache = req.cache[sdkPath];

// Mutable response slot the stub reads from.
let nextResponse = null;
let lastRequest = null;

class StubAnthropic {
  constructor(opts) {
    this.opts = opts;
    this.messages = {
      create: async (req) => {
        lastRequest = req;
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

const { classify, isAvailable } = await import('../../../lib/auto/classifier.js');

test('classifier: throws when no API key in env or opts', async () => {
  const orig = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    await assert.rejects(
      () => classify({ file: 'x.js', diff: '+a' }, {}),
      /ANTHROPIC_API_KEY not set/,
    );
  } finally {
    if (orig) process.env.ANTHROPIC_API_KEY = orig;
  }
});

test('classifier: isAvailable returns true with stub SDK present', () => {
  assert.equal(isAvailable(), true);
});

test('classifier: returns parsed shape from JSON response', async () => {
  nextResponse = {
    content: [{ type: 'text', text: '{"severity":"low","confidence":0.91,"change_type":"test_only","rationale":"only tests changed"}' }],
    usage: { input_tokens: 10, output_tokens: 5 },
  };
  const out = await classify(
    { file: 'src/x.test.js', diff: '+ assert.ok(true);' },
    { apiKey: 'sk-test', model: 'claude-haiku-4-5' },
  );
  assert.equal(out.severity, 'low');
  assert.equal(out.confidence, 0.91);
  assert.equal(out.change_type, 'test_only');
  assert.equal(out.model, 'claude-haiku-4-5');
  assert.equal(out.usage.input_tokens, 10);
});

test('classifier: tolerates fenced JSON output', async () => {
  nextResponse = {
    content: [{ type: 'text', text: '```json\n{"severity":"medium","confidence":0.7}\n```' }],
  };
  const out = await classify({ file: 'a.js', diff: 'd' }, { apiKey: 'sk-test' });
  assert.equal(out.severity, 'medium');
  assert.equal(out.confidence, 0.7);
});

test('classifier: throws on invalid JSON in response', async () => {
  nextResponse = { content: [{ type: 'text', text: 'not json at all' }] };
  await assert.rejects(
    () => classify({ file: 'a.js', diff: 'd' }, { apiKey: 'sk-test' }),
    /classifier returned invalid JSON/,
  );
});

test('classifier: throws when response has no text block', async () => {
  nextResponse = { content: [] };
  await assert.rejects(
    () => classify({ file: 'a.js', diff: 'd' }, { apiKey: 'sk-test' }),
    /no text block/,
  );
});

test('classifier: defaults change_type from entry when LLM omits it', async () => {
  nextResponse = { content: [{ type: 'text', text: '{"severity":"low","confidence":0.9}' }] };
  const out = await classify(
    { file: 'a.js', diff: 'd', change_type: 'format_only' },
    { apiKey: 'sk-test' },
  );
  assert.equal(out.change_type, 'format_only');
});

test('classifier: rationale defaults to empty string', async () => {
  nextResponse = { content: [{ type: 'text', text: '{"severity":"low","confidence":0.9}' }] };
  const out = await classify({ file: 'a.js', diff: 'd' }, { apiKey: 'sk-test' });
  assert.equal(out.rationale, '');
});

test('classifier: passes spec context as second system block with cache breakpoint', async () => {
  nextResponse = { content: [{ type: 'text', text: '{"severity":"low","confidence":0.9}' }] };
  await classify(
    { file: 'a.js', diff: 'd' },
    { apiKey: 'sk-test', specContext: '# spec body' },
  );
  assert.equal(lastRequest.system.length, 2);
  assert.deepEqual(lastRequest.system[1].cache_control, { type: 'ephemeral' });
  assert.match(lastRequest.system[1].text, /# spec body/);
});

test('classifier: uses default haiku model when not specified', async () => {
  nextResponse = { content: [{ type: 'text', text: '{"severity":"low","confidence":0.9}' }] };
  await classify({ file: 'a.js', diff: 'd' }, { apiKey: 'sk-test' });
  assert.equal(lastRequest.model, 'claude-haiku-4-5');
});

test.after(() => {
  if (originalCache) req.cache[sdkPath] = originalCache;
  else delete req.cache[sdkPath];
});
