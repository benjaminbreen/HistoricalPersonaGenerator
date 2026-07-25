# Demographic methodology

How the generator decides *who* a persona is — and how far those decisions sit
from the demography of actual human lives.

This page exists because "generate a random historical persona" quietly contains
a claim: that the persona is drawn from some population. It is worth being
explicit about which population, because the naive answer (uniform over the
options in a dropdown) is off by more than an order of magnitude in places.

Everything below was measured by generating personas and tabulating the output
(`npm run portrait-audit` renders and reports on real generator output), then
compared against published demographic estimates. Numbers marked *estimate* are
my own derivation and are flagged as such.

---

## 1. The three sampling frames

"What fraction of people were over 50?" has three different correct answers.
Most confusion about historical demography comes from mixing them up.

| Frame | Question it answers | 50+ |
| --- | --- | --- |
| Per **birth** | Of everyone ever born, who reached 50? | ~35% |
| Per **person-year** | Pick a random moment in a random life | ~19% |
| Per **living adult** | Pick a random adult alive right now | **~27–30%** |

The generator produces adults, so the third row is the target.

*Derivation (estimate).* Pre-modern life expectancy at birth e₀ ≈ 30, with
l(50) ≈ 0.35 and e(50) ≈ 17, giving T₅₀ ≈ 5.6 and T₁₈ ≈ 19.7 person-years, so
50+ is 5.6/19.7 ≈ 28% of adults. Cross-checks against Wrigley & Schofield's
reconstruction of early modern England, where 60+ was ~10% of the whole
population and ~15% of those aged 15+, implying 50+ ≈ 27% of adults.

**Note the thing that is *not* wrong.** Pre-modern life expectancy of ~30 does
not mean people dropped dead at 30. It means roughly a quarter of babies died
before their first birthday and another quarter before adulthood. Conditional on
reaching 18, living into your fifties or sixties was ordinary. A generator that
produced only young adults would be *less* accurate, not more.

---

## 2. When did human lives happen?

Computed from the Population Reference Bureau's birth table (Haub 1995, updated
with Kaneda 2022), which publishes assumed population and crude birth rate at
each benchmark date — so births per period can be integrated rather than
guessed. Total: ~117 billion humans ever born.

| Era window | Share of all births |
| --- | --- |
| Before 4000 BCE | ~12% |
| 4000–3000 BCE | ~3.5% |
| 3000 BCE – 500 CE | **~40%** |
| 500–1450 | ~20% |
| 1450–1750 | ~7.7% |
| 1750–1900 | ~5.9% |
| 1900–2000 | ~8.1% |

The counterintuitive result, and the one worth internalising: **antiquity is
about 40% of all human lives.** A long window, populations already in the tens
to hundreds of millions, and birth rates at their historical maximum. The early
modern period *feels* like the centre of gravity because that is where the
archives are — it is under 8%.

Caveat: PRB assumes a crude birth rate of 80/1000 before 1 CE, which is high.
Lower assumptions compress antiquity's share somewhat but do not change the
ordering.

---

## 3. Where did human lives happen?

Person-year weighted, over the span the app covers. These are estimates
triangulated from McEvedy & Jones and standard regional series; treat them as
±30% and as ordering rather than precision.

| Region | Share of human lives |
| --- | --- |
| East Asia | ~26% |
| South Asia | ~22% |
| Europe (incl. European Russia) | ~14% |
| MENA | ~10% |
| Sub-Saharan Africa | ~10% |
| Southeast Asia | ~6% |
| Americas (N + S) | ~3% |
| **Oceania** | **~0.5%** |

Oceania is the number that surprises people. Even on generous estimates —
Aboriginal Australia up to ~750,000–1M before 1788, Hawai'i perhaps 800,000,
Tonga ~120,000, plus New Guinea — the whole region is single-digit millions
against a world of 450–500 million in 1500. Roughly one human life in two
hundred.

---

## 4. The design tension, and how this project resolves it

A sampler weighted strictly by person-years would return a Chinese or South
Asian farmer about half the time, and would surface this app's researched
Oceanic, Sahelian and pre-Columbian material roughly once in two hundred spins.
That is *more accurate and a worse tool*. The content would effectively become
unreachable.

So the project deliberately runs two sampling modes:

- **Explore** (default) — flattened across regions and eras so the whole world
  is reachable in a reasonable number of spins. Deliberately not representative.
- **True frequency** — weighted by person-years. What "pick a random human life"
  actually means.

**The rule: never let the flattening be silent.** In both modes the app states
the real odds of the combination it drew — "roughly 1 in 250 human lives" —
because the gap between what feels representative and what was representative is
the single most teachable thing here, and hiding it would waste it.

Where a distribution has been deliberately flattened for playability rather than
modelled, it is commented as such in the source.

---

## 5. What was corrected, and what it was corrected to

Measured over 1,000 generated personas before and after.

| Assumption | Was | Now targets | Basis |
| --- | --- | --- | --- |
| Sex ratio | 67% F / 33% M / 0% NB | ~50/50 | `Non-binary` was generated then silently collapsed to Female — a bug, not a choice |
| Third-gender roles | uniform 33%, then erased | low, culture-conditioned | Institutionalised in specific societies, not a third of humanity |
| Adult age | uniform 18–70 | life-table shaped, tail past 70 | §1 |
| 50+ among adults | 38% | ~28% | §1 |
| Wealth: comfortable or better | 42% | ~12% | Agrarian societies ran 75–85% at or near subsistence |
| Food-producing work | 25% | ~80% pre-1750 | Standard estimate for pre-industrial economies |
| Earliest reachable year | 4000 BCE | 40,000 BCE | ~12% of all births were before 4000 BCE |
| Era mix | uniform | births per era | §2 |
| Region mix | uniform | person-years per region | §3 |
| Illness composition | uniform over the table | prevalence weighted | §6 |

### On third-gender roles

Recognised third-gender and gender-crossing social roles are well attested in
many societies — hijra in South Asia, fa'afafine in Samoa, māhū in Hawai'i and
Tahiti, khanith in Oman, mukhannathun in early Islamic Arabia, bissu among the
Bugis, burrnesha in northern Albania, and named roles in many Indigenous North
American nations. The generator models these as **social roles held by people of
a given birth sex**, which is how they generally worked, rather than as a third
biological category.

Two deliberate constraints:

- **No projecting modern labels backwards.** "Two-spirit" is a pan-Indigenous
  umbrella term coined in 1990; it is not a name any pre-contact person would
  have used for themselves. Where a specific well-attested local term exists it
  is used; otherwise the role is described neutrally.
- **Frequencies are not known.** No reliable population-level rates exist for
  any of these roles. The rate used is a low placeholder, defined as a single
  named constant, and should be read as "rare but present" rather than as a
  measurement.

---

## 6. Illness

**A correction, recorded because the mistake is instructive.** The first pass at
this audit reported that the generator produced *zero* sick personas out of a
thousand. That was an artefact of the measuring harness, not a property of the
app: the disease module loads asynchronously and the headless script raced it,
so every persona came back healthy. The app was in fact giving about a third of
personas a condition all along. The audit harness now awaits the module before
measuring, and the lesson — check whether a startling result is a property of
the thing or of the instrument — was worth more than the original finding.

The real defect was *which* conditions, not how many. Diseases were drawn
uniformly from every entry available for the era and region, which meant a
one-in-forty chance of anthrax being weighted the same as a common cold. The
measured result: anthrax was the second most common human ailment, rabies ran at
1.7%, bubonic plague appeared at a flat rate in every century regardless of
whether an outbreak was underway, and intestinal worms — which infected most of
the population in most pre-modern societies — turned up less often than
dislocated shoulders.

The correction rests on one idea:

> point prevalence ≈ incidence × duration

A condition you are unlikely to catch and which kills you in ten days is almost
never what you find when you stop a random person. A condition that is mildly
unpleasant and lasts for years is what you find constantly. Uniform sampling
ignores both terms. Selection is now weighted by an incidence estimate, a
duration factor, and a penalty for rapid lethality; epidemic diseases are
suppressed between outbreaks and amplified during them.

The overall rate is also no longer flat across time — 42% before 1750 falling to
18% after 1950, which is roughly what sanitation, antibiotics and dentistry did.

One caveat, honestly held: the duration term has to be **capped**. Left
unbounded it is arithmetically correct and practically useless — a decade-long
condition outweighs a week-long one by two orders of magnitude, and the first
attempt pushed the common cold, which most people catch more than once a year,
down to a third of a percent.

---

## 7. Anachronism gating, and why `year` beat `era`

Widening prehistory to 40,000 BCE broke things that had been fine for years, in
a way worth recording because the failure is general.

`PREHISTORY` used to span a single millennium, so "era = PREHISTORY" was a
perfectly good proxy for "roughly 3500 BCE". After the change it spans **37,000
years**, and every subsystem keyed on era silently lost that resolution. The
starting-equipment assembler took an era and no year, so it could not tell a
Palaeolithic forager from a Chalcolithic villager and issued both a bronze torc.

**The rule now: `era` is for labels; `year` is for availability.** Anything
deciding whether a thing could exist takes a year.

Four gates enforce it, each documented where it lives:

| Gate | Location | Catches |
| --- | --- | --- |
| Materials | `demographyService.isMaterialAvailable` | linen at 28,000 BCE, woven sandals in the Palaeolithic, bronze fittings before bronze |
| Professions | `professionAvailabilityService` | weavers before looms, farmers before agriculture, scribes before writing |
| Naming traditions | `nameSetEras.resolveNameKey` | an Achaemenid prince hunting in the Tarim Basin in 22,094 BCE |
| Equipment | `assembleStartingPackage` | anything the wardrobe gate would have caught, arriving by the other path |

Two traps found while building these, both worth remembering:

- **Exemptions must beat short-circuits.** The material gate first tried a list
  of always-available materials checked *before* the rules. A woven sandal made
  of plant fibre passed, because "fibre" is ancient — the *construction* was the
  anachronism, not the material. Barkcloth now exempts itself from the woven
  rule rather than the whole check being skipped.
- **A gate is only as good as its fallback.** Routing every deep-prehistory
  persona to the `PREHISTORIC_*` name sets was pointless while those sets ended
  in Arabic, Ptolemaic and New Kingdom names, and while `PREHISTORIC_AFRICAN`
  consisted of modern Akan and Swahili names, a state founded in 1701, a textile
  and a twentieth-century statesman. They have been trimmed to what is
  defensible.

**Honestly held caveat.** For genuinely deep prehistory *every* attested name is
an anachronism — no personal name survives from the Palaeolithic anywhere. Using
the earliest-attested regional names is the least-bad compromise available while
the app insists on naming everyone. The alternative, and the better idea, is to
let the card decline to name people it cannot name. Oceania is the one case
handled properly: Remote Oceania was settled within the last three thousand
years, so before 1500 BCE the fallback is Aboriginal Australian, the only
Oceanic naming tradition with deep-time standing.

`npm run portrait-audit` reports region rules that reach past their tradition —
118 have no lower bound at all. `resolveNameKey` stops them reaching a persona,
so this is a latent-trap warning rather than a live bug.

---

## 8. Climate

Seasons were computed from the calendar month alone, so every persona south of
the equator had them inverted — a Mapuche or Māori persona on 26 December was
described as being in "the depths of winter" during high summer. That was about
a sixth of all output.

Nothing connected climate to clothing either, so a hunter in the Tarim Basin — a
cold desert where January means −10°C — was generated bare-chested in December.
`climateService` now derives hemisphere and season from the region, and biases
the wardrobe by thermal need. It is a preference rather than a prohibition:
people wore the wrong thing, and the poor wore whatever they had. Equatorial
regions get wet and dry seasons rather than four temperate ones.

---

## 9. Naming conventions

A name has a *shape* as well as a vocabulary, and the generator only modelled
the vocabulary. Every name came out as a given name followed by something from a
surname list, which quietly asserts that hereditary family names are the human
default.

They are not. They are recent and unusual. England had no general system of
inherited surnames before roughly the twelfth century; Wales was still
patronymic in the sixteenth, Sweden and Norway into the nineteenth, and Iceland
has never adopted them. Across the Arabic-speaking world a person was placed by
descent (*ibn*, *bint*) and by parenthood (*Abu*, *Umm*) rather than by a family
name until the twentieth century. China is the great exception — hereditary
surnames there are genuinely ancient.

Eight conventions are now modelled and chosen by culture and period: a bare
personal name, patronymic, teknonym, epithet, clan, toponymic, occupational and
inherited. "X of Y" is one of the eight rather than the shape of all human
naming.

Two things follow that matter more than the variety:

- **The family agrees with the name.** If the persona is "Yeshimebet daughter of
  Kebede", the father is Kebede. If the persona carries a hereditary name, the
  father and siblings carry it too. A patronymic whose father panel disagrees is
  worse than no patronymic.
- **Before agriculture, a name is a name.** No inheritance, no estates to be
  "of", no trades to be named for — personal names and earned bynames only.

---

## 10. Foraging lives

The general life-event pools assume markets, guilds, inheritance, and marriages
that improve a family's standing. Applying them to the Palaeolithic produced a
persona in 22,000 BCE who had "arranged a sibling's marriage carefully to
strengthen the family's position in society" — a sentence containing at least
three concepts that had not been invented.

Lives beginning before 8000 BCE now draw on a separate pool describing what the
archaeology and the ethnography of foraging societies actually record: the
seasons, the herds, the weather, initiation, toolstone, the long walk, the dead.
Work that is not food-getting changes too — a forager band has toolmakers, hide
workers, firekeepers and healers, not labourers and servants, both of which
presuppose someone to labour for.

Equipment follows: a spear and a hide thong, flint, a scraper, sinew cordage and
a fire drill. Bows are gated to 15,000 BCE — the unambiguous evidence is early
Holocene, and while stone points from Sibudu are argued to imply archery some
60,000 years ago, the date here errs toward the spear-and-atlatl kit that is not
in doubt.

---

## 11. What is still knowingly wrong

Kept honest rather than quietly fixed:

- **No children.** Personas are adults by design. A true random human life would
  be a child roughly 40% of the time, and would end before adulthood about half
  the time.
- **Regional granularity.** The cultural zones are coarse; Southeast Asia and
  Central Asia have no zone of their own and are folded into their neighbours.
- **Within-region weighting is uniform.** Locations inside a zone are drawn
  evenly, so a persona is as likely to come from a sparsely settled region as
  from a densely settled one.
- **Estimates are estimates.** Pre-modern population figures carry real
  disagreement — world population at 1 CE is variously put at 170M (McEvedy),
  226M (Maddison) and 300M (PRB). The shares above inherit that uncertainty.
- **Deep prehistory is thinly supported.** Opening the generator back to 40,000
  BCE immediately exposed content written for later periods: linen dresses in
  28,000 BCE, weavers in the Palaeolithic. Materials and professions are now
  gated by earliest evidence, but the naming, religion and region tables were
  not built with the Upper Palaeolithic in mind and will be coarse there.
- **Everyone still works.** The generator assigns an occupation to every adult.
  Real populations contain the disabled, the retired, the destitute and the
  institutionalised.
- **Place names are not gated.** A persona in 22,000 BCE is still labelled as
  being in "Xinjiang", a Qing administrative name from 1884. Toponyms need the
  same treatment the naming traditions just received.
- **Dates claim more precision than exists.** "Born in 22,139 BCE, 26 December"
  is a category error at that range.
- **Roughly two personas in five carry nothing.** The profession-to-package
  table covers about 410 of 700 roles, and the gap is almost entirely modern —
  a factory hand or a telephone operator gets no kit. It reads as an absence of
  possessions rather than an absence of data.

---

## 12. What the persona is carrying

The `STARTING_PACKAGES` table — five hundred professions, each with a tool, some
clothing and a few carried goods — was dead. `src/constants/index.ts` re-declared
`STARTING_PACKAGES` as `{}` *after* re-exporting the real table, and a local
export always beats `export *`, so every persona assembled an empty package in
silence. The item constructor behind it, `generateItem`, was a stub returning
null besides. What appeared in the equipment panel was clothing and nothing else.

Both are live now, with three constraints on what the table is allowed to say:

- **The wardrobe keeps its slots.** Packages carry clothing too, but they are
  keyed on profession alone, while the clothing tables are keyed on culture,
  period, wealth and climate. Since the package is assembled first and the
  clothing only fills what is left empty, letting a package claim `head` or
  `torso` would have replaced the better system with the worse one. Packages
  contribute tools, weapons and carried goods; the wardrobe dresses the persona.
- **The year still decides.** Carried goods go through the same availability gate
  as everything else, so a package written with a settled profession in mind does
  not hand a coin to someone born before coinage.
- **Repeats mean quantity.** Three `SLING_STONE` entries are one line reading
  ×3, not three lines.

About a third of the packages asked for `'*CONTEXTUAL*'` in the main hand — a
call into a weapon generator that was removed with the rest of the game's item
layer, so those hands came out empty. Most of the professions marked that way are
not soldiers; they are farmers and carpenters whose "contextual weapon" was
really a hoe or an adze, and the marker now resolves to the tool the profession
implies.

The display is capped at two carried items and four inventory lines, with the
remainder counted rather than listed. A slinger's full kit is eleven items and
the first two say more about him than all eleven do.

---

## Sources

- [Population Reference Bureau, *How Many People Have Ever Lived on Earth?*](https://www.prb.org/news/how-many-people-have-ever-lived-on-earth/) — the birth-by-period table underlying §2
- [McEvedy & Jones, *Atlas of World Population History*](https://dmo.econ.msu.ru/Teaching/Histpop/Reading/Atlas%20of%20World%20Pop%20History%20McEvedy&Jones.pdf) — regional series underlying §3
- [Australian Bureau of Statistics, Year Book Australia 2002](https://www.abs.gov.au/ausstats/abs@.nsf/94713ad45ff1425ca25682000192af2/bfc28642d31c215cca256b350010b3f4!OpenDocument) — pre-1788 population estimates
- [ANU, *New data reveals impact of contact with Pacific nations*](https://www.anu.edu.au/news/all-news/new-data-reveals-impact-of-contact-with-pacific-nations) — Pacific pre-contact populations
- Wrigley & Schofield, *The Population History of England 1541–1871* — age structure cross-check in §1
- Coale & Demeny, *Regional Model Life Tables and Stable Populations* — the life-table shape used in §1

---

## Reproducing these measurements

```bash
npm run portrait-audit -- 300 7
```

Generates personas through the real pipeline and reports the distributions above
alongside rendering defects. Re-run after changing any generation assumption;
the distribution tables at the top of the report are the regression test.
