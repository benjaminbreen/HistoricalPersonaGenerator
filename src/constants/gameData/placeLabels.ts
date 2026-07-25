/**
 * constants/gameData/placeLabels.ts
 *
 * Display names for places, by period.
 *
 * Most of the app's 561 area names are physical geography — "Yellow River
 * Valley", "Sierra Madre Oriental", "Lake Texcoco Basin" — and are already
 * era-neutral. A short list are modern administrative units that read wrong in
 * antiquity: nobody in 753 BCE lived in Languedoc.
 *
 * This layer is display-only. `persona.location` keeps the canonical name,
 * because the climate tables, the capability overrides and the language windows
 * all key on it. Only the label a reader sees changes.
 *
 * There is no way to name a place without some anachronism — the label locates
 * the place for a modern reader rather than reporting what its inhabitants
 * called it. Where the substitution still leaves a name the period would not
 * have used, `note` carries a tooltip. It is never printed as prose.
 */

export interface PlaceLabel {
  label: string;
  /** Tooltip only. */
  note?: string;
}

interface LabelRule {
  /** Canonical area name, matched case-insensitively. */
  area: RegExp;
  /** Applies to years strictly before this. */
  before: number;
  label: string;
  note: string;
}

const RULES: LabelRule[] = [
  {
    area: /^languedoc$/i,
    before: 1200,
    label: 'Lower Rhône',
    note: 'Called Languedoc only from the thirteenth century.',
  },
  {
    area: /^normandy$/i,
    before: 911,
    label: 'Lower Seine',
    note: 'Named for the Northmen granted the region in 911.',
  },
  {
    area: /^baja california$/i,
    before: 1533,
    label: 'Western Peninsula',
    note: 'Named by Spanish navigators in the sixteenth century.',
  },
  {
    area: /^newfoundland grand banks$/i,
    before: 1497,
    label: 'Northern Banks',
    note: 'Named after the Cabot voyages of the 1490s.',
  },
  {
    area: /^ontario shield$/i,
    before: 1600,
    label: 'Northern Shield',
    note: 'Ontario is a colonial-era name.',
  },
  {
    area: /^gulf coast texas$/i,
    before: 1690,
    label: 'Gulf Coast',
    note: 'Texas takes its name from a Caddo word recorded by Spanish missions in the 1690s.',
  },
  {
    area: /^texas hill country$/i,
    before: 1690,
    label: 'Central Hill Country',
    note: 'Texas takes its name from a Caddo word recorded by Spanish missions in the 1690s.',
  },
  {
    area: /^florida keys$/i,
    before: 1513,
    label: 'Southern Keys',
    note: 'Named by Ponce de León in 1513.',
  },
  {
    area: /^virginia\s*$/i,
    before: 1607,
    label: 'Chesapeake Tidewater',
    note: 'Named for Elizabeth I; the English colony dates from 1607.',
  },
  {
    area: /^sinaloa coast$/i,
    before: 1531,
    label: 'Northwest Coast',
    note: 'Sinaloa is a post-conquest provincial name.',
  },
  {
    area: /^hokkaido$/i,
    before: 1869,
    label: 'Ezo',
    note: 'Called Ezo until it was renamed Hokkaidō in 1869.',
  },
  {
    area: /^jeolla highlands$/i,
    before: 995,
    label: 'Southwestern Highlands',
    note: 'The Jeolla circuit was established under Goryeo.',
  },
  {
    area: /^khuzestan plain$/i,
    before: 650,
    label: 'Susiana',
    note: 'Known to antiquity as Elam and then Susiana.',
  },
  {
    area: /^assam plains$/i,
    before: 1826,
    label: 'Brahmaputra Plains',
    note: 'Assam entered English usage under the East India Company.',
  },
  {
    area: /^guangxi highlands$/i,
    before: 1363,
    label: 'Lingnan Highlands',
    note: 'Guangxi dates from the Yuan provincial reorganisation.',
  },
];

/**
 * Names that stay as they are but were coined long after most of the period
 * they get applied to. They earn a tooltip, not a substitution, because no
 * better short label exists.
 */
const LATE_COINAGES: Array<{ area: RegExp; before: number; note: string }> = [
  { area: /^(?:bengal delta|punjab plains|sindh river delta)$/i, before: -500, note: 'A much later name for a region occupied far earlier.' },
  { area: /^(?:sichuan basin|shandong peninsula|yunnan plateau)$/i, before: -200, note: 'A much later name for a region occupied far earlier.' },
  { area: /^oaxaca highlands$/i, before: 1000, note: 'From the Nahuatl Huāxyacac, recorded late in the pre-conquest period.' },
  { area: /^ancestral puebloan lands$/i, before: 2100, note: 'A modern archaeological term, not a name its inhabitants used.' },
  { area: /^(?:mayan lowlands|mosquito coast|darien swamp)$/i, before: 1500, note: 'A later name for a region occupied far earlier.' },
];

/** The name to show for this place in this year. */
export function historicalPlaceLabel(area: string | undefined, year: number): PlaceLabel {
  if (!area) return { label: '' };
  const trimmed = area.trim();

  for (const rule of RULES) {
    if (rule.area.test(trimmed) && year < rule.before) {
      return { label: rule.label, note: rule.note };
    }
  }

  for (const late of LATE_COINAGES) {
    if (late.area.test(trimmed) && year < late.before) {
      return { label: trimmed, note: late.note };
    }
  }

  return { label: trimmed };
}
