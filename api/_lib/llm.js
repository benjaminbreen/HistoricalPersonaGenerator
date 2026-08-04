// The one place that decides which model runs, how hard it is allowed to
// think, and how much it is allowed to write.
//
// This exists for the same reason `personaPrompts.js` does. Three hosts serve
// the persona routes — the Vercel function, `server.js`, and the Vite dev
// middleware — and until now each carried its own copy of the two fetch calls
// and its own pair of default-model constants. Prompts were extracted; the
// transport was not, so every knob that governs cost had to be set in three
// files and drifted between them. Everything below is imported by all three.
//
// Two things are deliberately not configurable from the browser. The client
// names a *variant* — "luna", "nano" — and this file maps it to a model id, so
// nobody can bill the project for a frontier model by editing one fetch in
// devtools. And every call carries an output ceiling, because a request with
// no `max_output_tokens` has no upper bound on what it can cost.

/** What the client gets when it asks for nothing, or for something unknown. */
export const DEFAULT_VARIANT = 'luna';

/** Marks the one failure the reader can be told something useful about. */
export const TRUNCATED_CODE = 'MODEL_OUTPUT_TRUNCATED';

/**
 * The models the client is allowed to ask for, by short name.
 *
 * Ids come from the environment first so a rename upstream is a config change
 * rather than a deploy, and `LLM_PROVIDER`/`OPENAI_MODEL`/`GEMINI_MODEL` still
 * work as a whole-deployment override for anyone who was already setting them.
 */
export const MODEL_VARIANTS = {
  luna: {
    provider: 'openai',
    envKey: 'LUNA_MODEL',
    fallback: 'gpt-5.6-luna',
    label: 'Luna',
    reasoningEffort: 'none',
  },
  nano: {
    provider: 'openai',
    envKey: 'NANO_MODEL',
    fallback: 'gpt-5-nano',
    label: 'Nano',
    reasoningEffort: 'minimal',
  },
  gemini: {
    provider: 'gemini',
    envKey: 'GEMINI_MODEL',
    fallback: 'gemini-3.1-flash-lite',
    label: 'Flash-Lite',
  },
};

/**
 * Per-task limits.
 *
 * `maxOutput` is a ceiling, not a target. The compact sketch asks for 150–180
 * words and uses no reasoning tokens, so 260 tokens leaves modest room without
 * paying for a runaway answer. The persona record is compact but structured
 * and needs enough room for concrete daily-life detail; a truncated one is invalid JSON, so
 * `callModel` reports the truncation rather than letting the parser fail on it.
 *
 * Reasoning effort is set per model variant above. Left unset, a
 * reasoning-capable model uses its own default, and those tokens are billed as
 * output while never appearing in the response body — paid for and never seen.
 */
export const TASK_BUDGETS = {
  generate_sketch: { maxOutput: 260, temperature: 0.55 },
  generate_annotation: { maxOutput: 2200, temperature: 0.35 },
};

const DEFAULT_BUDGET = { maxOutput: 1000, temperature: 0.35 };

/**
 * Bumped by hand when a prompt in `personaPrompts.js` changes materially.
 *
 * It rides along in the usage log so "did that edit help?" is answerable
 * against real traffic later, rather than from memory.
 */
export const PROMPT_VERSION = '5';

/**
 * A client-supplied name, reduced to one this file knows and one this
 * deployment can actually reach.
 *
 * The second half matters on the day this ships. The old default provider was
 * Gemini, so an install that never set `OPENAI_API_KEY` was correct and
 * working; moving the default to an OpenAI model would take its AI features
 * down at deploy time with "Missing OPENAI_API_KEY". Rather than fail, fall
 * back to the provider that is configured and say so in the log — loudly
 * enough to notice, quietly enough that nobody's biography button breaks.
 */
export function resolveVariant(name, env = process.env) {
  const asked = String(name || '').toLowerCase();
  const pinned = String(env.LLM_PROVIDER || '').toLowerCase();
  let variant = MODEL_VARIANTS[asked] ? asked : (pinned === 'gemini' ? 'gemini' : DEFAULT_VARIANT);

  const provider = MODEL_VARIANTS[variant].provider;
  const hasOpenAI = Boolean(env.OPENAI_API_KEY);
  const hasGemini = Boolean(env.GEMINI_API_KEY || env.GOOGLE_AI_API_KEY);
  if (provider === 'openai' && !hasOpenAI && hasGemini) {
    console.warn(`[llm] no OPENAI_API_KEY, so "${variant}" fell back to Gemini. Set OPENAI_API_KEY to use it.`);
    variant = 'gemini';
  } else if (provider === 'gemini' && !hasGemini && hasOpenAI) {
    console.warn('[llm] no Gemini key, so this call fell back to the default OpenAI variant.');
    variant = DEFAULT_VARIANT;
  }
  return variant;
}

/**
 * Deliberately *not* falling back to a global `OPENAI_MODEL`.
 *
 * A deployment with `OPENAI_MODEL` set — which is what docs/SETUP.md used to
 * ask for — would otherwise resolve both OpenAI variants to the same id, and
 * the toggle would silently compare a model against itself. Each variant reads
 * only its own key.
 */
function modelIdFor(variant, env) {
  const spec = MODEL_VARIANTS[variant];
  return env[spec.envKey] || spec.fallback;
}

async function callGemini({ model, prompt, json, schema, temperature, maxOutput, env }) {
  // VITE_* variables are compiled into the browser bundle; never read secrets from them.
  const key = env.GEMINI_API_KEY || env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error('Missing Gemini API key. Set GEMINI_API_KEY in the environment.');

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  const effectivePrompt = schema
    ? `${prompt}\n\nJSON Schema:\n${JSON.stringify(schema)}`
    : prompt;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: effectivePrompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxOutput,
        ...(json ? { response_mime_type: 'application/json' } : {}),
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Gemini returned ${response.status}${body ? `: ${body.slice(0, 240)}` : ''}`);
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0];
  const meta = data?.usageMetadata || {};
  return {
    text: candidate?.content?.parts?.map(part => part.text).join('\n') || '',
    truncated: candidate?.finishReason === 'MAX_TOKENS',
    usage: {
      input: meta.promptTokenCount ?? null,
      output: meta.candidatesTokenCount ?? null,
      reasoning: meta.thoughtsTokenCount ?? null,
    },
  };
}

/**
 * Extract text from either an SDK-shaped response or the raw Responses REST
 * payload returned by `fetch`. The SDK adds `output_text` as a convenience;
 * raw HTTP responses keep text in message content items.
 */
export function extractOpenAIResponseText(data) {
  if (typeof data?.output_text === 'string') return data.output_text;
  if (!Array.isArray(data?.output)) return '';

  return data.output
    .flatMap(item => Array.isArray(item?.content) ? item.content : [])
    .filter(part => part?.type === 'output_text' && typeof part.text === 'string')
    .map(part => part.text)
    .join('\n');
}

async function callOpenAI({ model, prompt, json, schema, maxOutput, effort, env }) {
  const key = env.OPENAI_API_KEY;
  if (!key) throw new Error('Missing OPENAI_API_KEY.');

  const send = body => fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });

  // No temperature. These models reject it outright, and register is set by the
  // prompt anyway. `TASK_BUDGETS.temperature` applies to Gemini only.
  const base = {
    model,
    input: prompt,
    max_output_tokens: maxOutput,
    reasoning: { effort },
    ...(json ? {
      text: {
        format: schema
          ? {
            type: 'json_schema',
            name: 'historical_persona_orientation',
            schema,
            // The app schema deliberately has optional fields. Strict mode
            // requires every property to be required, so the client still
            // normalizes and validates after this best-effort constraint.
            strict: false,
          }
          : { type: 'json_object' },
      },
    } : {}),
  };

  let response = await send(base);

  // Which knobs a given model takes is not knowable ahead of time.
  if (response.status === 400) {
    const complaint = await response.text().catch(() => '');
    if (/reasoning|effort/i.test(complaint)) {
      console.warn('[llm] retrying without reasoning.effort');
      const { reasoning, ...withoutEffort } = base;
      response = await send(withoutEffort);
    } else {
      response = { ok: false, status: 400, text: async () => complaint };
    }
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    const error = new Error(`OpenAI returned ${response.status}${body ? `: ${body.slice(0, 240)}` : ''}`);
    // Tagged so the route shows it. These are API errors, not secrets, and
    // hiding them costs a redeploy every time we need to read one.
    error.code = 'MODEL_CALL_FAILED';
    error.statusCode = 502;
    throw error;
  }

  const data = await response.json();
  const usage = data?.usage || {};
  return {
    text: extractOpenAIResponseText(data),
    // `incomplete` with a max-tokens reason is the only case worth reporting
    // separately: the text came back, it just stops mid-sentence, and for the
    // annotation route that means the JSON will not parse.
    truncated: data?.status === 'incomplete' && data?.incomplete_details?.reason === 'max_output_tokens',
    usage: {
      input: usage.input_tokens ?? null,
      output: usage.output_tokens ?? null,
      reasoning: usage.output_tokens_details?.reasoning_tokens ?? null,
    },
  };
}

/**
 * Run one persona task.
 *
 * Returns the usage alongside the text rather than discarding it, which is
 * what makes a model comparison a measurement instead of an impression. Both
 * providers report token counts and both were throwing them away.
 */
export async function callModel({ variant, action, prompt, json = false, schema, env = process.env }) {
  const chosen = resolveVariant(variant, env);
  const spec = MODEL_VARIANTS[chosen];
  const budget = TASK_BUDGETS[action] || DEFAULT_BUDGET;
  const model = modelIdFor(chosen, env);
  const startedAt = Date.now();

  const args = {
    model,
    prompt,
    json,
    schema,
    temperature: budget.temperature,
    maxOutput: budget.maxOutput,
    effort: spec.reasoningEffort,
    env,
  };
  const result = spec.provider === 'gemini' ? await callGemini(args) : await callOpenAI(args);

  const usage = {
    ...result.usage,
    variant: chosen,
    model,
    action,
    promptVersion: PROMPT_VERSION,
    promptChars: prompt.length,
    schemaChars: schema ? JSON.stringify(schema).length : 0,
    ms: Date.now() - startedAt,
    truncated: result.truncated || false,
  };
  // One line per call. A week of these in the platform logs answers which
  // model is actually cheaper on this workload, which no price table can.
  console.log(`[llm] ${JSON.stringify(usage)}`);

  if (result.truncated && json) {
    // `code` marks it as ours, so the routes know the message is safe to show.
    const error = new Error(
      `The ${spec.label} response hit the ${budget.maxOutput}-token ceiling before finishing its JSON record.`
    );
    error.code = TRUNCATED_CODE;
    error.statusCode = 502;
    throw error;
  }

  return { text: result.text, usage };
}
