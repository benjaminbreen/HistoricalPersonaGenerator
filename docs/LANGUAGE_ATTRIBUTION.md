# Language attribution and the scholarly sources layer

A plan for giving every generated persona a language — a real one where the
record supplies it, and an honest, cited, weighted guess where it does not — and
for exposing the reasoning behind the guess without cluttering the card.

Status: **built**. Sections 2–7 are implemented and measured; the rates in
section 1 are now all zero. Section 8 records traps found while scoping, which
still apply to anyone extending this.

Implementation: `constants/gameData/scholarlySources.ts` (registry),
`constants/gameData/languageDeepTime.ts` (53 windows),
`services/languageAttributionService.ts` (resolver), with the panel in the
language modal.

---

## 1. The problem, measured

Across 3,000 generated personas:

| Defect | Rate |
| --- | --- |
| No language assigned at all | **20.6%** |
| Language used outside its own declared `culturalZones` | **10.0%** |
| Language used outside its own declared `period` | **4.2%** |

84% of the missing-language cases were BCE, spread evenly across every cultural
zone. The zone violations are not subtle: *Ancient Egyptian in the Hindu Kush*,
*Scots in Rwanda in 1780*, *Middle Chinese in the East China Sea*, *Malagasy on
Rapa Nui*.

Two distinct causes:

1. **The selector does not enforce its own metadata.** `LanguageData` already
   declares `culturalZones`, `regions` and `period`. `getLanguageForCharacter`
   checks `period` only on the name-detection path and never checks zone at all.
   This is the same shape as the `eraWeights` bug in the life-event pool: the
   data states the constraint and the consumer ignores it.
2. **Name-based detection runs first, at highest priority.** A persona whose
   generated name matches a Scottish pattern gets Scots, wherever and whenever
   they live. Diaspora is a real phenomenon and should remain possible, but it
   should be rare and deliberate rather than 10% of the population.

Neither cause explains the missing fifth. That is a coverage problem: the
language tables stop where attestation stops, and the app reaches much further
back than attestation does.

---

## 2. Where to stop: the 10,000 BCE floor

**Implemented.** `ERA_BOUNDS[PREHISTORY]` moved from −40,000 to −10,000.

The floor is set by what can be said about language rather than by demography.
The comparative method returns usable signal for roughly six to eight thousand
years, and stretches to perhaps ten thousand under favourable conditions. Every
macro-family proposal that reaches deeper — Nostratic, Dene-Caucasian, Amerind —
is contested to the point where presenting one as this app's answer would be
misrepresenting the field, not pushing it.

Before the change, a persona could be generated for 19,411 BCE, given a trade, a
household, a religion and a set of life events, and then handed a blank where
their language should be. The app either names a tongue or it should not claim
to describe the life. 10,000 BCE is arbitrary in the way all thresholds are
arbitrary, but it is arbitrary *at the edge of the evidence* rather than in the
middle of it.

The cost is real and should be stated: roughly ninety percent of the time
anatomically modern humans have existed is now out of reach, and with it a
meaningful share of everyone ever born. `docs/DEMOGRAPHY.md` should be updated
to reflect the narrowed frame.

---

## 3. The attribution model

Every persona resolves to exactly one `LanguageAttribution`:

```ts
type Confidence =
  | 'attested'       // written records of this language, in this place, in this period
  | 'reconstructed'  // no records here, but the comparative method reaches it
  | 'inferred'       // family/branch known; the specific descendant is an inference
  | 'conjectural';   // family membership itself is a live scholarly question

interface LanguageHypothesis {
  label: string;            // "Late Proto-Indo-European", "Pre-Indo-European of the Aegean"
  family: string;           // "Indo-European", "unclassified"
  probability: number;      // share of the window, summing to 1 across the window
  confidence: Confidence;
  sourceIds: string[];      // into the citation registry
  note?: string;            // why this weight, in one sentence
}

interface AttributionWindow {
  id: string;
  yearRange: [number, number];
  zones?: CulturalZone[];
  places?: RegExp;          // for sub-zone precision (Rapa Nui inside OCEANIA)
  hypotheses: LanguageHypothesis[];
}

interface LanguageAttribution {
  chosen: LanguageHypothesis;     // what the card displays
  alternatives: LanguageHypothesis[];
  windowId: string;
  sources: ScholarlySource[];
}
```

**Resolution order.** (1) The existing `LANGUAGES` table, if it yields a match
that satisfies its own `period` *and* `culturalZones`. (2) The deep-time window
matching place and year, sampled by probability from the persona's seed.
(3) A zone-level fallback window, which must exist for every zone across the
whole −10,000 → 2100 range so that step 3 can never return nothing.

**Determinism.** The choice is drawn from the persona seed, so the same persona
always yields the same language and the same citation list.

**What the main card shows.** The chosen label only. No percentages, no hedging
adverbs. The uncertainty lives entirely in the sources layer. A persona in
8000 BCE Anatolia simply speaks "an early Anatolian farming language"; the fact
that this was a 45/30/25 draw is available on click and invisible otherwise.

---

## 4. Weighting: how the guesses get their numbers

Probabilities are editorial judgements and must be defensible, not decorative.
Three inputs, in priority order:

1. **Where the family is agreed to have been at that date.** For windows inside
   a well-studied dispersal (Austronesian across Remote Oceania, Bantu across
   Central Africa, Indo-European across Bronze Age Europe) the dominant
   hypothesis takes 50–75% and the residue goes to substrate and neighbouring
   families.
2. **Known substrate and pre-expansion populations.** Europe before ~4500 BCE,
   the Indus before Indo-Aryan, Japan before Yayoi: the incoming family should
   not take the whole window at its early edge. Substrate hypotheses are
   labelled honestly as unrecorded ("the pre-Indo-European languages of the
   Aegean, unrecorded") rather than given invented names.
3. **Diversity priors where nothing expanded.** Aboriginal Australia before
   Pama-Nyungan, pre-contact California, highland New Guinea and Amazonia were
   linguistically very diverse with no single dominant family. Those windows get
   a flat-ish distribution across several families plus a large "local family,
   unrecorded" share, because that is what the evidence supports.

**Rule: no hypothesis below 5%.** Anything rarer is noise dressed as precision.

**Rule: contested proposals are labelled, not laundered.** If a window leans on
Transeurasian, Dene-Yeniseian, Altaic or Nostratic, the hypothesis carries
`confidence: 'conjectural'` and its note says who disputes it. The sources panel
should cite the critique alongside the claim.

---

## 5. The scholarly sources layer

### Data

```ts
interface ScholarlySource {
  id: string;
  authors: string;
  year: number;
  title: string;
  venue?: string;           // journal, publisher, or series
  kind: 'book' | 'article' | 'chapter' | 'database';
  supports: string;         // one line: what this source is being cited for
  contested?: string;       // one line: who disagrees, where relevant
}
```

Editorial standards:

- **Real citations only.** Author, year, title and venue must be verifiable. No
  DOIs or URLs unless certain — a correct citation is findable without one, and
  a fabricated link is worse than no link.
- **Cite what the source actually says.** A source establishing the date of
  Proto-Austronesian dispersal is not a source for Rapa Nui settlement.
- **Cite the disagreement.** Where a claim is live, the panel names the
  opposing position.

An initial corpus of roughly 50 works is drafted and covers Indo-European
(Renfrew; Mallory & Adams; Anthony; Gray & Atkinson; Bouckaert et al.; Haak et
al.; Heggarty et al. 2023), Austronesian and the Pacific (Blust; Gray, Drummond
& Greenhill; Kirch), Africa (Ehret; Blench; Güldemann; Vansina; Grollemund et
al.; Bostoen), the Americas (Campbell; Goddard; Golla; Vajda; Fortescue;
Adelaar; Heggarty & Beresford-Jones; Kaufman), Asia (Sagart et al.; van Driem;
Vovin; Whitman; Southworth; Witzel; Janhunen), Australia and New Guinea (Dixon;
Evans; Bowern & Atkinson; Bouckaert, Bowern & Atkinson; Pawley & Hammarström),
plus methodological cautions (Nichols; Bergsland & Vogt; Campbell on Nostratic).

### Surface

A small superscript marker beside the Native Language field — a `†` or a
書-style glyph, at reduced opacity, growing to full on hover. Clicking opens a
panel, styled like the existing Wikipedia panel, containing:

1. The chosen attribution and its confidence tier, in plain words
   ("Reconstructed. No records of this language exist; it is recovered by
   comparing its descendants.").
2. The alternatives that were weighed, with their weights.
3. The citation list, grouped by what each source supports.
4. A short note on method and its limits, written once and shared.

The marker should be present for *every* persona, including modern ones, so that
it reads as "here is the reasoning" rather than "this one is shaky".

### Reuse

The registry should not be language-specific. `societyCapabilities.ts` already
carries date claims (metallurgy, writing, contact) that deserve the same
treatment, and the demographic model has published sources behind it. Build the
citation registry as a general facility with a `topic` field from the start; the
language layer is its first consumer, not its only one.

---

## 6. Coverage plan

Roughly 55–70 windows. Each zone needs unbroken coverage from −10,000 to the
point where the attested `LANGUAGES` table takes over, plus windows for regions
that remain unattested long after that date (Amazonia, interior New Guinea,
Aboriginal Australia).

| Zone | Windows | Notes |
| --- | --- | --- |
| MENA | 7 | Earliest attestation anywhere (−3200); deep-time window is short |
| European | 8 | Pre-IE substrate; Neolithic Anatolian farmers; PIE dispersal; branch level |
| South Asian | 6 | Pre-Harappan; Dravidian; Indo-Aryan arrival; Munda |
| East Asian | 8 | Sino-Tibetan; Austroasiatic; Japonic/Jomon; Koreanic; Tungusic |
| Sub-Saharan African | 8 | Nilo-Saharan; Niger-Congo; Bantu expansion; Khoe-Kwadi; Afroasiatic in the Horn |
| Oceania | 8 | Papuan deep time; Austronesian/Lapita; Polynesian settlement; Aboriginal Australia |
| N. American pre-Columbian | 8 | Mesoamerica separately; Na-Dene; Eskimo-Aleut; regional diversity |
| South American | 7 | Andes; Amazonia; Chonan in the far south |
| N. American colonial | 3 | Mostly defers to the attested table |

The single highest-value window to build first is **Remote Oceania**, because it
is where the current failure is most visible (Malagasy on Rapa Nui) and where
the scholarship is unusually crisp — Polynesian settlement dates are among the
best-constrained in prehistory.

---

## 7. Phasing (all four phases complete)

1. **Enforcement.** Make `getLanguageForCharacter` honour `period` and
   `culturalZones` on every path; restrict the name-based override to plausible
   diaspora. Add the three rates from section 1 to the audit as defended
   invariants. *No new data required; fixes 14% of personas on its own.*
2. **Registry.** `scholarlySources.ts` plus the panel component, wired to a
   hand-written attribution for a single zone as a walking skeleton.
3. **Coverage.** The windows, zone by zone, starting with Remote Oceania.
   Each zone lands with its citations.
4. **Backfill.** Point `societyCapabilities.ts` at the same registry.

Phase 1 is worth doing regardless of whether 2–4 ever happen.

---

## 8. Findings from scoping (read before starting)

- **`HistoricalPersona.culturalZone` is a display label, not the enum.** It is
  set to `culturalZone.replace(/_/g, ' ')`, so every table keyed by the enum
  silently returns `undefined` when handed it. This produced a false 23%
  reading in one audit and had silently disabled climate and hemisphere
  detection in the biography. The field is now documented; `character.culturalZone`
  and `historicalContext.culturalZone` carry the real value. **Any language work
  must use one of those two.**
- **The existing `LANGUAGES` table is large and good** — 762 entries with
  periods, scripts, families, native names and greetings. The deep-time layer
  should sit *behind* it, not replace it.
- **`isReconstructed` already exists** on `LanguageData` and proto-languages are
  currently skipped for years after −3000. That rule becomes wrong once the
  attribution model has confidence tiers, and should move into the tiering.
- **Profession/society coherence is 2.7%**, not the 20% first measured. Wiring
  capabilities into profession assignment is *not* urgent.
