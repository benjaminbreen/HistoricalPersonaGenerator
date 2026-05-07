# AGENTS.md

## Project Orientation

Historical Persona Generator is moving from a mostly procedural character generator toward a source-first historical persona studio. The new goal is to let a user supply a historical document, upload extracted text, paste text, or link to a relevant URL such as Wikipedia, Wikisource, an archive page, or a museum/catalog entry. The application should then turn that source material into compact JSONL persona material records that can drive plausible historical characters rooted in a specific time and place.

The generator should treat sources as evidence, not flavor. Every generated persona should distinguish between:

- fields directly supported by the uploaded or scraped source
- fields inferred from the source context
- fields plausibly synthesized to complete the persona
- fields too uncertain to state confidently

Gemini `gemini-3.1-flash-lite-preview` is the intended low-cost completion model for schema filling and plausible gap completion. Use it after extraction and normalization, not as a substitute for source handling.

## Core Product Flow

1. The user provides one or more source inputs:
   - uploaded document
   - pasted text
   - Wikipedia page URL
   - other relevant historical URL
2. The app extracts clean text and source metadata:
   - title
   - URL or uploaded filename
   - author/creator if available
   - publication or event date if available
   - source type
   - language if detectable
   - extracted text spans
3. The app derives a historical context:
   - decade
   - region
   - polity
   - locale type
   - historical pressures
4. The app fills a strict compact persona material object matching the project schema:
   - setting
   - social position
   - work
   - household economy
   - material life
   - concerns
   - voice/worldview
   - evidence
5. The app validates the object against the JSON Schema before using it.
6. The existing procedural persona system consumes the material record as weighted constraints, then generates the character, portrait, backstory, and world details.

## Schema-First Contract

The source-to-persona pipeline should produce JSONL, one valid JSON object per line. Each line should conform to the historical persona material schema described by the user. Keep `schema_version` at `1.0.0` until the schema changes intentionally.

Important schema behavior:

- Required fields must always be present.
- Optional fields should be included only when useful.
- Arrays must honor `maxItems`.
- `additionalProperties: false` means agents should not invent extra keys.
- `setting.decade` must be a decade between 1500 and 1930.
- `evidence.confidence` must be one of `high`, `medium`, `low`, or `speculative`.
- The schema is compact by design. Avoid bloated prose inside fields.

Recommended file organization for implementation:

- `src/types/personaMaterial.ts`: TypeScript interfaces for the compact schema.
- `src/schemas/historicalPersonaMaterial.schema.json`: JSON Schema source of truth.
- `src/services/sourceIngestionService.ts`: upload, URL, and pasted-text ingestion.
- `src/services/sourceTextExtractionService.ts`: text cleanup, chunking, and metadata extraction.
- `src/services/personaMaterialService.ts`: source text to schema-filled material records.
- `src/services/personaMaterialValidationService.ts`: JSON Schema validation.
- `src/services/personaMaterialAdapter.ts`: converts material records into `GenerationParams` and richer character constraints.

## Source Ingestion Guidance

Support source types incrementally:

1. Pasted text: simplest and highest-control first pass.
2. Wikipedia URL: use official APIs where possible instead of scraping rendered HTML.
3. Generic URL: fetch readable HTML and extract article-like text.
4. Uploaded `.txt` and `.md`.
5. Uploaded PDF or image documents through OCR only after the text path works.

For Wikipedia, prefer an API path:

- parse the page title from the URL
- fetch page summary for quick context
- fetch page content or extracts for fuller evidence
- preserve the canonical URL in source metadata

For generic web URLs:

- reject obviously non-text or unsafe schemes
- cap downloaded size
- strip navigation, scripts, styles, ads, and boilerplate
- retain source URL and access timestamp
- show the user what text was extracted before generation when feasible

For uploads:

- never assume OCR is correct
- preserve filename and extraction method
- allow user correction of extracted text
- mark low confidence when text is fragmentary or garbled

## Extraction And Generation Strategy

Use a two-stage model call when possible.

Stage 1: evidence extraction

- Identify explicit dates, places, occupations, social ranks, legal statuses, institutions, objects, household clues, prices, foods, clothing, tools, diseases, religious terms, and conflict pressures.
- Return short quoted or paraphrased evidence snippets with source offsets when available.
- Do not complete the persona yet.

Stage 2: schema completion

- Fill the compact persona material schema.
- Prefer direct source facts.
- Infer only from the source's time, place, genre, and social context.
- Synthesize missing mundane details conservatively.
- Add uncertainty through `evidence.confidence` and `evidence.bias_flags`.
- Avoid famous-person defaults unless the source clearly centers a famous person.

The generated persona should usually be a plausible ordinary person in the source world, not necessarily the author or named subject. Examples:

- A probate inventory can inspire a widow, servant, appraiser, creditor, apprentice, or neighbor.
- A Wikipedia page about a revolt can inspire a market seller, soldier, clerk, artisan, refugee, or minor official living through the event.
- A ship log can inspire a sailor, passenger, dock worker, enslaved captive, interpreter, or coastal trader.

## Grounding Rules

Agents should preserve historical plausibility over vividness.

- Do not give the persona modern political vocabulary unless the source period supports it.
- Keep `voice_worldview.knowledge_horizon` narrow and period-specific.
- Use `anachronism_guards` to name concrete things the persona should not know or say.
- Treat legal condition, gender role, class/caste/status, race/ethnicity, slavery, colonial rule, and religious identity as historically situated constraints, not cosmetic traits.
- Material life should include objects and bodily conditions only when plausible for the time, place, and social position.
- If the source is elite, administrative, colonial, hostile, translated, or retrospective, include that in `evidence.bias_flags`.

## Integration With Existing Code

The current app already has useful pieces:

- `src/services/personaGenerator.ts` generates complete personas from `GenerationParams`.
- `src/services/characterGenerator.ts` handles character construction.
- `src/services/wikipediaService.ts` already fetches and caches Wikipedia summary data.
- `src/types/primarySource.ts` has a starting point for submitted source state.
- `src/constants/gameData/*` provides regional, language, profession, belief, clothing, and material culture data.

The new source-first flow should not replace the procedural generator immediately. Instead, add an adapter layer:

1. Convert `setting.decade`, `setting.region`, `social_position`, and `work.primary_occupation` into `GenerationParams`.
2. Generate the existing persona.
3. Overlay source-derived fields onto backstory, profession, social class, religion, possessions, concerns, and voice.
4. Preserve the original material JSON beside the generated character so the UI can expose evidence and uncertainty.

## Proposed Milestones

Milestone 1: local schema and manual JSONL

- Add the schema file and TypeScript types.
- Add validation for JSONL persona material.
- Add a developer-only import path that accepts a JSONL record and generates a persona from it.

Milestone 2: pasted text to material record

- Add a pasted-text input mode.
- Send cleaned text to Gemini with the two-stage extraction/completion prompt.
- Validate output and display validation errors.
- Let the user regenerate or edit the material record.

Milestone 3: Wikipedia URL ingestion

- Extend `wikipediaService.ts` or add a new source ingestion service.
- Accept a Wikipedia URL, resolve the page, fetch text, and create source metadata.
- Generate one or more persona material records from the page.

Milestone 4: generic URL ingestion

- Add safe URL fetching and readability extraction.
- Add source previews and extraction confidence.
- Handle failure states explicitly.

Milestone 5: uploads

- Add `.txt` and `.md` uploads first.
- Add PDF extraction and OCR later.
- Keep the extraction result editable before generation.

Milestone 6: evidence-aware UI

- Show persona material fields alongside generated persona details.
- Label grounded, inferred, and synthesized details.
- Surface confidence and bias flags.
- Allow export as JSONL.

## Prompting Requirements

Prompts for Gemini should include:

- the exact JSON Schema or a compact TypeScript-like field contract
- strict instruction to return only JSON
- source metadata
- source text chunks
- a rule that missing evidence should become conservative synthesis, not fabricated specificity
- a rule that `evidence.source_basis` names the actual kind of source
- a rule that uncertainty is represented through confidence and bias flags

Prompt outputs must be parsed and validated. Never trust raw model JSON directly.

## Testing Expectations

For this flow, tests should cover:

- JSONL parsing with one and multiple records
- schema validation failures for missing required fields and extra properties
- URL classification for Wikipedia vs generic URLs
- extraction cleanup for pasted text and simple HTML
- adapter behavior from material record to `GenerationParams`
- preservation of evidence/confidence metadata after persona generation

Use small fixture sources:

- a short probate inventory
- a Wikipedia-like event summary
- a parish or census-style snippet
- a court testimony excerpt

## Definition Of Done

A source-first persona feature is not done until:

- the app can ingest at least one source type end to end
- the material record validates against the schema
- the generated persona visibly reflects source-derived constraints
- uncertainty and bias are preserved
- failures are clear and recoverable
- the user can export or inspect the JSONL material used to generate the persona

