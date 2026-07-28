// Shared JSON extraction for the LLM persona routes. Imported by the Vercel
// route, the static server, and the Vite dev middleware so the three copies
// cannot drift apart.

export const stripCodeFence = text => {
  const trimmed = String(text || '').trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
};

/**
 * Return the first complete JSON object in `text`, ignoring anything after it.
 * Models filling the annotation schema sometimes append a stray closing brace
 * or a second object; slicing to the LAST brace keeps that garbage and fails,
 * so walk the braces and stop as soon as depth returns to zero.
 */
const firstBalancedObject = text => {
  const start = text.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index++) {
    const char = text[index];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      if (inString) escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === '{') depth++;
    else if (char === '}') {
      depth--;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }

  return null;
};

export const parseJsonObject = text => {
  const stripped = stripCodeFence(text);
  try {
    return JSON.parse(stripped);
  } catch {
    const balanced = firstBalancedObject(stripped);
    if (balanced) return JSON.parse(balanced);
    throw new Error('The model did not return parseable JSON.');
  }
};
