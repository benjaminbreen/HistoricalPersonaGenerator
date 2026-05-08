```text
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║        H I S T O R I C A L   P E R S O N A   G E N E R A T O R       ║
║                                                                      ║
║             ┌──────────┐      evidence      ┌──────────┐             ║
║             │  source  │  ───────────────▶  │ persona  │             ║
║             │  text    │   inference        │ material │             ║
║             └────┬─────┘  ───────────────▶  └────┬─────┘             ║
║                  │          synthesis             │                   ║
║                  ▼                                ▼                   ║
║             archival fragments          portrait + life world         ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

# Historical Persona Generator

Historical Persona Generator is an experimental, source-first web app for turning historical documents, reference pages, and archival fragments into plausible historical personas rooted in a specific time and place.

The project began as a procedural character generator extracted from the Universal History Simulator. It is now moving toward a historical persona studio: the user supplies source material, the app extracts context and evidence, and the existing procedural system completes a character while preserving what came from the source, what was inferred, and what was plausibly synthesized.

## What It Does

- **Source-backed generation**: Paste source text, enter Wikipedia/readable URLs, or sample Old Bailey trial material.
- **Evidence-aware persona material**: Convert source material into compact JSON records with confidence and support labels.
- **Historical context extraction**: Track decade, region, polity, status, work, household economy, material life, concerns, worldview, and source bias.
- **Procedural completion**: Use the existing character generator to turn source constraints into names, family, backstory, possessions, beliefs, and daily-life details.
- **Procedural portraits**: Render seeded pixel-style SVG portraits with clothing, headgear, health cues, markings, and source-derived visual overrides.
- **Inspectable outputs**: Review source-supported fields, uncertainty labels, consistency warnings, and exportable JSON material.

## Source-First Workflow

1. Provide a source:
   - pasted text
   - Wikipedia URL
   - readable historical web page
   - Old Bailey trial sample
2. The app extracts source metadata and clean text.
3. Gemini can fill the persona annotation schema, or the app can fall back to heuristic source parsing.
4. The material record is validated and adapted into generation parameters.
5. The procedural generator creates a full persona from those constraints.
6. The UI labels source-supported, inferred, synthesized, and uncertain details.

The goal is not to claim that every generated detail is true. The goal is to make historical imagination more explicit about its evidence.

## Supported Contexts

The procedural layer currently supports broad regions and eras:

### Cultural Zones

- European
- East Asian
- South Asian
- Middle East and North Africa
- Sub-Saharan African
- Oceania
- North American, pre-Columbian
- North American, colonial
- South American

### Historical Eras

- Prehistory
- Antiquity
- Medieval
- Renaissance and Early Modern
- Industrial Era
- Modern Era

Source-backed generation is most useful for roughly 1500-1930 material, where the persona annotation schema is currently most tightly defined.

## Getting Started

### Install

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

The app will be available at:

```text
http://localhost:3001
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Gemini Setup

Source-backed persona generation can use Gemini to fill the historical persona annotation schema. For local development, add a Gemini key to `.env.local`:

```bash
GEMINI_API_KEY=your_key_here
```

The Vite dev server exposes a local `/api/gemini-persona` middleware and keeps this key server-side during development. The static browser bundle does not call Gemini directly.

For production-style local serving:

```bash
npm run build
GEMINI_API_KEY=your_key_here npm start
```

Current source-backed records use annotation schema `1.1.0`. The schema keeps `1.0.0` records valid, while new generation prefers compact cross-cultural fields for social position, constraint regimes, public world, religious practice, normative world, and interaction style.

## Developer Tools

### Portrait Gallery

A lightweight portrait QA gallery is available during development:

```text
http://localhost:3001/#portrait-gallery
```

It shows fixed seeded fixtures for checking clothing, headgear, source-derived visual cues, scars/weathering, and regional portrait behavior.

## How It Works

The source-first flow has two layers:

1. **Material record layer**
   - ingests text and metadata
   - identifies explicit source evidence
   - fills a compact persona annotation record
   - validates confidence, support labels, and schema shape

2. **Procedural persona layer**
   - maps source material into generation parameters
   - generates or adapts a character profile
   - overlays source-derived profession, status, clothing, possessions, concerns, worldview, family, and life events
   - renders a seeded portrait from procedural and source-derived visual constraints

The app treats sources as evidence, not decorative flavor. A probate inventory, trial transcript, ship log, or Wikipedia event page can inspire an ordinary person from the source world, not only the author or named subject.

## Technology Stack

- **React 19** for the UI
- **TypeScript** for application code and schema-facing types
- **Vite** for development and builds
- **AJV** for JSON Schema validation
- **Gemini** for optional schema filling from source text
- **SVG** for procedural pixel portraits

## Credits

Created by [Benjamin Breen](https://benjaminpbreen.com), Associate Professor of History at UC Santa Cruz.

Originally extracted from the Universal History Simulator, an educational history simulation project.

## License

MIT
