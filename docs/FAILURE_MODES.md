# Failure modes in the procedural system

Written after a long stretch of fixing defects that a reader found by looking at
generated cards. Nearly every one of them turned out to be an instance of a
small number of recurring patterns rather than a one-off mistake. This document
names the patterns, because the generalisable fix is almost always cheaper than
the specific one, and because the same pattern keeps producing new defects in
whichever subsystem is touched next.

Each pattern is stated with the actual defects it produced.

---

## 1. The data declares a constraint; the consumer ignores it

The most common failure by a wide margin.

| Declared | Ignored by | What reached the screen |
|---|---|---|
| `LanguageData.culturalZones`, `.period` | the language selector | Proto-Indo-European on Bronze Age Crete; Pama-Nyungan (Reconstructed) spoken in 1967 |
| `eraWeights` on life-history templates | the template sampler | era-inappropriate life events at uniform rates |
| `culturalZone` parameter of `generateParentProfession` | its own body | parents' trades unrelated to the region |
| `era` parameter of `getSocialGroup` | its own body | social groups anachronistic to the period |
| `Ideology.eras` — enforced, but too coarse to bind | — | Capitalist Entrepreneur in 1468 |
| `SOUTH_AMERICAN_COLONIAL` name tables | nothing at all | 100% mononyms in 1980s South America |

**Why it recurs.** The tables are large and hand-authored, and every consumer
reaches into them directly — `TABLE.filter(...)` or `TABLE[key]` — so each new
consumer must independently remember every declared field. Nothing fails when
one is forgotten; the output is merely wrong in a way only a historian notices.

**Generalisable fix.** One gatekeeper per table, and no direct indexing outside
it: `selectLanguage(ctx)`, `selectIdeology(ctx)`, `selectOrnament(ctx)`. The
gatekeeper applies every declared field, and adding a field to the type forces
one edit in one place. Then one audit invariant per table asserting that the
*output* satisfies the constraints the *input* declared — which is what
`language-coverage`, `capability-gating`, `ideology-fit` and `ornament` now do.
An invariant of this shape is cheap to write and catches the whole class,
including future rows added by hand.

---

## 2. The constraint was never declared anywhere

Distinct from (1): here the data has no field to ignore.

- Ideologies had `eras` but nothing expressing that "Capitalist Entrepreneur"
  presupposes holding capital — hence 38% of them being destitute herders.
- Ornament traditions did not exist, so nothing expressed that a society must
  smelt before anyone wears bronze.
- Trades did not express that fishing looks different on an ocean, a river and
  an oasis — see (7).

**Generalisable fix.** When adding any table, ask what must be true of the world
for a row to be possible, and encode it on three axes that now have shared
vocabulary in the codebase:

- **time** — an absolute `yearRange`, not an era bucket (see 3)
- **capability** — `societyCapabilities.ts` (`writing`, `metallurgy`, `coinage`, …)
- **station** — `minPrivilege` against `socialContext.privilege`

Resist adding a fourth axis before checking these three don't already cover it.

---

## 3. Era buckets are too coarse to be a constraint

`RENAISSANCE_EARLY_MODERN` spans roughly 1400–1750; `PREHISTORY` spans 10,000 to
3,000 BCE. An ideology, profession or garment gated only on an era bucket is
effectively ungated: it can surface at either end of a span across which almost
nothing was constant.

**Generalisable fix.** Eras are fine for *prose register* and for coarse
fallbacks. They are not fine as the sole gate on anything a historian would date.
Anything datable gets an absolute `yearRange` alongside its era list, and the
selector checks both. Applied to 26 ideologies; the same treatment is owed to
professions, garments and life-event templates.

---

## 4. A consumer with no producer

`appearance.jewelry` was read in three places — the equipment list, the
appearance panel, and the portrait renderer, which drew necklaces, earrings and
circlets in pixels — and written by nothing. Every persona took the
empty-array early return for as long as the feature had existed.

**Generalisable fix.** A rendered optional field with no producer is a silent
no-op, indistinguishable from a feature that is merely rare. Any optional field
the UI renders should either be populated at a measurable rate or be explicitly
recorded as unused. The `ornament` invariant now asserts a rate ("under 40% of
personas wear nothing"), which would have failed loudly from the day the
renderer was written.

---

## 5. Two code paths, one fix — and one of them was dead

`characterGenerator.ts` carried two near-identical builders:
`generateCharacterWithSpec` (~330 substantive lines) and `generateCharacter`
(~220), of which **114 lines were verbatim identical**. Every behavioural fix
had to be written twice — ethnicity detection, attribute-driven appearance,
ornament — and at least one was applied to only one copy and reported as done
until a reader caught it.

Tracing the callers showed the second path had no callers at all: the persona
generator always passes a specification object, so `generateCharacter` was only
reachable through `generateCharacterWithSpec(context, null)`, which nothing
calls. It was 550 lines of code that never ran — and had already rotted, since
it referenced a `spec` variable it had no parameter for, a guaranteed
`ReferenceError` on the branch nobody took.

**Resolved by deletion, not by merging.** Every field of the specification is
read defensively, so the no-spec branch now passes an empty specification into
the live path and produces the same fully-rolled character. 550 lines removed;
the class of half-applied fixes goes with them.

**Generalisable lesson.** Before unifying two similar implementations, check
whether one of them is reachable. Duplication that survives a long time is
often duplication nobody executes, and dead code rots invisibly — it cannot fail
a test, so the only evidence it is broken is a typechecker, which is why (6)
matters. When both paths *are* live, extract the shared tail into a single
`finalizeCharacter()` rather than maintaining two copies.

---

## 6. The build proves almost nothing

`vite build` does not typecheck. Three real defects shipped green this session:
an out-of-scope variable in the portrait renderer, a missing import for a colour
helper, and a `spec` variable referenced in a function that has no such
parameter. Two of the three were mine, caught within minutes of the ratchet
existing; the third had sat in unreachable code for however long, where nothing
but a typechecker could ever have found it.

**Fix, now in place.** `npm run typecheck:ratchet` records every existing `tsc`
error in `scripts/typecheck-baseline.json` and fails on anything new. Zero-errors
was never going to be switched on; "no new errors" is, and it caught two of my
own mistakes within minutes of existing. Fixing an old error only tightens it.

---

## 7. Prose keyed on one dimension, ignoring the others

Trade textures are selected by matching the profession name alone, so a fisher in
the **Samarkand oases in 4511 BCE** gets "nets mended on the beach between tides".
The same shape produced "the district" for personas living in mobile bands, which
is what `SettlementRegister` was introduced to fix.

**Generalisable fix.** A prose clause is data like any other and needs the same
declared preconditions: which register, which climate, which water. The selector
then filters on them and falls back to a clause that assumes nothing. This is
pattern (1) again, applied to text rather than to facts.

---

## 8. Display labels and lookup keys sharing a name

`persona.culturalZone` holds a display label ("SOUTH ASIAN");
`persona.historicalContext.culturalZone` holds the key (`SOUTH_ASIAN`). An audit
that read the former reported a 23% profession-mismatch rate that did not exist,
and the same confusion had silently disabled climate and hemisphere detection in
the biography for however long it had been there.

**Generalisable fix.** Never give a label and a key the same name. Rename display
fields to `…Label`, or brand the key type so a label cannot be passed where a key
is expected. A wrong-but-plausible string is worse than a crash.

---

## 9. One unseeded draw churns the entire persona

`characterGenerator.ts:1711` picks a disease with `Math.random`. It is the last
unseeded call in the generation path, and it is enough to make the golden harness
report 3 or 4 changed personas on one run and different ones on the next —
because the branch it selects changes how many draws later code makes from the
seeded stream, which changes names, clothing and family.

**Generalisable fix.** Every draw in generation takes an injected `random`. One
exception is not a small exception: it is the difference between a reproducible
persona and a snapshot suite that cannot distinguish a regression from noise.

---

## 10. Adding a draw mid-stream is a breaking change

Ornament generation consumes from the shared `noise` stream, so introducing it
shifted every subsequent draw and changed the name, clothing and family of
personas generated from the same seed — including any already shared by link.

**Generalisable fix.** Anything that adds draws should read from its own stream
derived from the persona seed (`new ValueNoise(seed * 31 + salt)`), so new
features are additive rather than perturbing. This was *not* applied here,
deliberately: the golden baseline had already been captured with the shared
stream, and re-accepting 68 of 69 snapshots to fix 4 was the worse trade. It
should be done as part of a single deliberate re-baselining.

---

## What I would fix next, in order

1. **The last `Math.random` in generation** (§9). One line. It converts the
   golden harness from a flaky signal into a real gate, which every other item
   here depends on. Three consecutive runs of `npm run golden:verify` against an
   unchanged tree reported 1, then 2, then 3 changed personas. Commit `tests/golden/personas.json` at the same time — it is
   currently untracked, so the baseline exists in exactly one copy on one disk.

2. ~~Unify the two generation paths~~ (§5). **Done** — the second path turned
   out to be unreachable and was deleted rather than merged.

3. **Geography-aware prose selection** (§7). The visible defects are already
   there: beaches in landlocked Samarkand, a "cottage" in 4511 BCE, "merchant
   consortium" in a Neolithic oasis. Trade texture, dwelling and childhood clauses
   all need declared preconditions.

4. **Extend `yearRange` beyond ideologies** (§3) to professions, garments and
   life-event templates, which are still gated on era buckets alone.

5. **Split the four 6,000-line files.** `PersonaGeneratorSimple.tsx` (6,909),
   `ProceduralPortrait.tsx` (6,406), `professions.ts` (6,283),
   `npcUtils.ts` (2,512). The component is where the display/key confusion (§8)
   and the duplicated render sites (§4) both live; extracting the card sections
   would make both classes structurally harder.

6. **Commit.** The working tree carries 35+ modified files and a dozen new
   services. The audit invariants and the ratchet are only worth what a bisect
   can use them for.
