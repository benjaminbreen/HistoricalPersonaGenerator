import assert from 'node:assert/strict';
import { callModel, extractOpenAIResponseText } from '../api/_lib/llm.js';

const rawResponse = {
  id: 'resp_test',
  status: 'completed',
  output: [
    {
      id: 'reasoning_test',
      type: 'reasoning',
      summary: [],
    },
    {
      id: 'message_test',
      type: 'message',
      status: 'completed',
      role: 'assistant',
      content: [
        {
          type: 'output_text',
          text: 'A source-grounded biography returned by Luna.',
          annotations: [],
        },
      ],
    },
  ],
  usage: {
    input_tokens: 120,
    output_tokens: 18,
    output_tokens_details: { reasoning_tokens: 0 },
  },
};

assert.equal(
  extractOpenAIResponseText(rawResponse),
  'A source-grounded biography returned by Luna.'
);
assert.equal(
  extractOpenAIResponseText({ output_text: 'SDK convenience text', output: [] }),
  'SDK convenience text'
);
assert.equal(extractOpenAIResponseText({ output: [] }), '');

const originalFetch = globalThis.fetch;
let requestBody = null;

try {
  globalThis.fetch = async (url, init) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal(init.headers.Authorization, 'Bearer test-key');
    requestBody = JSON.parse(init.body);
    return new Response(JSON.stringify(rawResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const result = await callModel({
    variant: 'luna',
    action: 'generate_sketch',
    prompt: 'Write a short historical persona biography.',
    env: { OPENAI_API_KEY: 'test-key' },
  });

  assert.equal(result.text, 'A source-grounded biography returned by Luna.');
  assert.equal(result.usage.model, 'gpt-5.6-luna');
  assert.equal(result.usage.variant, 'luna');
  assert.equal(result.usage.input, 120);
  assert.equal(result.usage.output, 18);
  assert.equal(requestBody.model, 'gpt-5.6-luna');
  assert.deepEqual(requestBody.reasoning, { effort: 'none' });
  assert.equal(requestBody.max_output_tokens, 260);
  assert.equal('temperature' in requestBody, false);
  assert.equal(result.transparency.request.provider, 'openai');
  assert.equal(result.transparency.request.prompt, 'Write a short historical persona biography.');
  assert.equal(result.transparency.request.settings.reasoning_effort, 'none');
  assert.equal(result.transparency.response.raw_output, 'A source-grounded biography returned by Luna.');
  assert.equal(JSON.stringify(result.transparency).includes('test-key'), false);

  const annotation = await callModel({
    action: 'generate_annotation',
    prompt: 'Return a JSON annotation record.',
    json: true,
    schema: {
      type: 'object',
      properties: { status: { type: 'string', enum: ['valid'] } },
      required: ['status'],
      additionalProperties: false,
    },
    env: { OPENAI_API_KEY: 'test-key' },
  });

  assert.equal(annotation.usage.variant, 'luna');
  assert.equal(annotation.usage.model, 'gpt-5.6-luna');
  assert.equal(requestBody.model, 'gpt-5.6-luna');
  assert.deepEqual(requestBody.reasoning, { effort: 'none' });
  assert.equal(requestBody.max_output_tokens, 2200);
  assert.equal(requestBody.text.format.type, 'json_schema');
  assert.equal(requestBody.text.format.name, 'historical_persona_orientation');
  assert.equal(requestBody.text.format.strict, false);
  assert.deepEqual(requestBody.text.format.schema.properties.status.enum, ['valid']);
  assert.deepEqual(annotation.transparency.request.schema.properties.status.enum, ['valid']);
  assert.equal(annotation.transparency.request.output_format, 'json_schema');

  console.log('LLM transport tests passed.');
} finally {
  globalThis.fetch = originalFetch;
}
