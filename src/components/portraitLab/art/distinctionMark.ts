/**
 * components/portraitLab/art/distinctionMark.ts
 *
 * A small mark in the corner of the portrait for the rarest standings.
 *
 * The card already says what a persona's standing is in words — Hidalgo,
 * Samurai, Kuraka — and `eliteStrataService` already knows what share of the
 * local population held it. What the words cannot do is tell you at a glance
 * that this draw was unusual, and most standings are not unusual: the
 * hidalguía of Castile was a tenth of the population and the Cantabrian fueros
 * made it more than half. A badge on every noble would mark the ordinary case.
 *
 * So the mark is keyed to the share and only two thresholds get one:
 *
 *   1 in 100 or rarer     a gold star
 *   1 in 1000 or rarer    a cut diamond, which catches the light
 *
 * Drawn onto the visible canvas rather than into the raster, deliberately. The
 * raster is shifted a pixel up and down for the breathing animation, and a
 * badge that bobbed with the persona's chest would read as part of the drawing
 * rather than as a note about it. It is drawn in backing-store coordinates, so
 * it scales with the portrait and stays hard-edged at any display size, and it
 * is inside the canvas so it survives into `toDataURL` exports and shares.
 */

/** Which mark, if any, a standing earns. */
export type DistinctionTier = 'star' | 'diamond' | null;

/**
 * Offices only one person held at a time, or a handful in a generation.
 *
 * The rarity has to be read from two places, because the app splits standing
 * across two of them. `eliteStrata` models the privileged *orders* — hidalguía,
 * szlachta, samurai — and nothing in it is rarer than about one in 125, since an
 * order with a thousandth of the population is not an order, it is a family.
 * The genuinely singular statuses are in the profession tables instead, where
 * `professionAvailabilityService` already weights them at 0.02 for the same
 * reason. A test that read only the stratum share would have made the diamond
 * unreachable — the feature would have looked implemented and never once fired.
 *
 * Kept deliberately in step with that weighting list: if a title is rare enough
 * to be damped there, it is rare enough to be marked here.
 */
const SINGULAR_OFFICE =
  new RegExp([
    // European and west Eurasian crowns and the offices that go with them
    'emperor', 'empress', 'king', 'queen', 'tsar', 'czar', 'kaiser',
    'pope', 'patriarch', 'doge', 'prince.bishop', 'grand master',
    'duke', 'duchess', 'prince', 'princess', 'grandee', 'caudillo',
    // Islamic and Persianate
    'sultan', 'caliph', 'shah', 'khedive', 'grand vizier', 'sharif of mecca',
    // South, east and inner Asian
    'maharaja', 'nawab', 'khan', 'great khan', 'shogun', 'daimyo', 'peshwa',
    'kanpaku', 'sessho', 'chakravartin',
    // African
    'mansa', 'asantehene', 'kabaka', 'negus', 'oba', 'alaafin', 'mwami',
    // American
    'sapa inca', 'coya', 'tlatoani', 'huey tlatoani', 'cihuacoatl',
    // Colonial and modern heads of state and their proxies
    'viceroy', 'governor.general', 'colonial governor', 'president',
    'prime minister', 'paramount chief', 'tribal chairman', 'independence leader',
    // The commercial equivalents the tables already treat as one-offs
    'oil baron', 'robber baron', 'bank president', 'chaebol chairman', 'tech ceo',
  ].map(t => `\\b(?:${t})\\b`).join('|'), 'i');

/**
 * Offices that were held by a thin layer rather than by one person.
 *
 * Needed because the two tiers otherwise sit either side of a hole in the data.
 * The strata table's shares cluster between a tenth and a fiftieth — a
 * Castilian hidalgo, a Polish szlachcic, an English gentleman — and the
 * singular titles above are rarer than one in ten thousand. Almost nothing
 * naturally lands in the one-in-a-hundred band the star is for, so without this
 * the star would have been as dead as the diamond was.
 */
const GREAT_OFFICE =
  new RegExp([
    // Church and the learned offices above the parish
    'bishop', 'archbishop', 'metropolitan', 'abbot', 'abbess', 'inquisitor',
    'high priest', 'chief priest', 'oracle', 'court brahmin', 'purohita',
    'ayatollah', 'mufti', 'qadi', 'islamic scholar', 'grand rabbi',
    'university professor', 'astronomer royal', 'court astronomer', 'amauta',
    // Command
    'general', 'admiral', 'marshal', 'constable', 'strategos', 'legate',
    'war chief', 'war leader', 'condottiere', 'hetman',
    // Provincial and household government
    'satrap', 'pasha', 'bey', 'wali', 'emir', 'vizier', 'diwan', 'subahdar',
    'faujdar', 'zamindar', 'jagirdar', 'mansabdar',
    'grand secretary', 'hanlin', 'mandarin', 'scholar.official', 'prefect',
    'boyar', 'voivode', 'margrave', 'landgrave', 'burgrave', 'seneschal',
    'chancellor', 'alcalde', 'corregidor', 'adelantado', 'oidor', 'encomendero',
    'consul', 'praetor', 'archon', 'tribune', 'censor',
    // NB: village chiefs, rain makers, griots, datus and curacas are *not*
    // here. They are the authority of a lineage or a settlement, and in a
    // small-scale society there is one of them per few hundred people — a bare
    // `chief` also swallowed "Village Chief". Marking them diamond made the top
    // tier four times commoner than the star. They sit in the band below.
    // The modern commanding heights
    'industrialist', 'factory owner', 'railway investor', 'magnate', 'tycoon',
    'mogul', 'party secretary', 'oil minister', 'zaibatsu executive',
    'mining executive', 'tech entrepreneur',
    'hollywood producer', 'bollywood producer',
    'master of the mint', 'hacienda owner', 'plantation owner',
  ].map(t => `\\b(?:${t})\\b`).join('|'), 'i');

/** The professions at the top of an ordinary town rather than of a realm. */
const HIGH_OFFICE =
  new RegExp([
    'ceo', 'magistrate', 'judge', 'senator', 'councillor', 'guild master',
    'ship owner', 'banker', 'court physician', 'merchant prince',
    'land owner', 'landowner', 'estate owner', 'colonial administrator',
    // Authority over a lineage, a village or a district rather than a realm.
    'aristocrat', 'knight', 'datu', 'curaca', 'kuraka', 'cacique', 'chief',
    'sheikh', 'griot', 'rain maker', 'big man', 'local governor', 'prefect',
    'ias officer', 'film director', 'casino owner', 'station owner',
    'portuguese factor', 'missionary', 'tax collector',
  ].map(t => `\\b(?:${t})\\b`).join('|'), 'i');

/**
 * Rough share of a population holding an office of each kind.
 *
 * Three bands rather than two because two produced a cliff: every high office
 * carried the same number, so sixty-odd personas in twenty thousand sat on
 * exactly one value and there was nowhere for a threshold to land between one
 * in 2857 and one in 323. A bishop and a town magistrate are not equally rare
 * and should not share a figure.
 */
const OFFICE_SHARE = { singular: 0.0002, great: 0.002, high: 0.008 };

/**
 * How rare a persona's position has to be to earn each mark.
 *
 * **This is the tuning knob.** Both numbers are shares of a population, so
 * smaller is rarer and raising a number makes that mark commoner. They are not
 * the frequency the marks appear at, and the two are not the same thing: a
 * threshold of one in a hundred does not produce a badge on one persona in a
 * hundred, because most personas have no standing and no office at all and sit
 * at a share of 1. The mapping runs through whatever the strata and profession
 * tables actually contain, so it moves in steps rather than smoothly, and the
 * only way to know where a threshold lands is to measure it.
 *
 * Calibrated by doing exactly that — see `effectiveStandingShare`, which is
 * exported so the frequencies can be counted over a large sample rather than
 * guessed at. The values below were chosen to put the star near one persona in
 * a hundred and the diamond near one in five hundred.
 */
export const MARK_THRESHOLDS = {
  star: 0.04,
  diamond: 0.0025,
};

/**
 * How rare this persona's social position is, as a share of the population.
 *
 * Standing reaches the app by two routes — the privileged orders in
 * `eliteStrata` and the offices in the profession tables — and a persona's real
 * position is the rarer of the two. A hidalgo is one man in ten; a hidalgo who
 * is also a bishop is not. Returns 1 for everybody else, which is most people.
 *
 * Exported so the marks can be calibrated against real output.
 */
export function effectiveStandingShare(
  share: number | undefined,
  profession?: string,
): number {
  const fromStanding = typeof share === 'number' && Number.isFinite(share) && share > 0
    ? share
    : 1;
  const fromOffice = !profession
    ? 1
    : SINGULAR_OFFICE.test(profession)
      ? OFFICE_SHARE.singular
      : GREAT_OFFICE.test(profession)
        ? OFFICE_SHARE.great
        : HIGH_OFFICE.test(profession)
          ? OFFICE_SHARE.high
          : 1;
  return Math.min(fromStanding, fromOffice);
}

/** The threshold test. */
export function distinctionTierFor(
  share: number | undefined,
  profession?: string,
): DistinctionTier {
  const effective = effectiveStandingShare(share, profession);
  if (effective <= MARK_THRESHOLDS.diamond) return 'diamond';
  if (effective <= MARK_THRESHOLDS.star) return 'star';
  return null;
}

/* ======================================================================== */
/*  THE ART                                                                 */
/* ======================================================================== */

/**
 * The marks are drawn from a silhouette and shaded in code rather than
 * hand-painted pixel by pixel.
 *
 * The first version was a literal 9×9 character grid with an outline colour and
 * a body colour, and it looked like what it was: a flat icon sitting on top of
 * a piece of pixel art rather than a piece of pixel art. What the rest of this
 * portrait system does — and what the SNES artists did — is shade a shape along
 * a ramp with a fixed light source, so the form reads as solid, and then move a
 * highlight across it rather than blinking anything on and off.
 *
 * Deriving the outline and the shading from a mask gets that for free and keeps
 * both marks consistent: change the silhouette and the lighting follows. It
 * also makes the animation a property of the surface rather than a flipbook, so
 * there are no frames to keep in sync.
 */

/** `#` is solid, anything else is empty. Eleven square: big enough to shade. */
const STAR_MASK = [
  '......#......',
  '.....###.....',
  '.....###.....',
  '.....###.....',
  '#############',
  '.###########.',
  '..#########..',
  '...#######...',
  '...#######...',
  '..####.####..',
  '..###...###..',
  '.###.....###.',
  '.##.......##.',
];

const DIAMOND_MASK = [
  '......#......',
  '.....###.....',
  '....#####....',
  '...#######...',
  '..#########..',
  '.###########.',
  '#############',
  '.###########.',
  '..#########..',
  '...#######...',
  '....#####....',
  '.....###.....',
  '......#......',
];

/**
 * Five steps, dark to light. Enough to model a curved surface; few enough that
 * it still reads as pixel art rather than as a smooth gradient.
 */
interface Ramp {
  outline: string;
  shades: [string, string, string];
  sheen: string;
  spark: string;
}

const RAMPS: Record<Exclude<DistinctionTier, null>, Ramp> = {
  // Warm gold, kept slightly desaturated at the dark end so it sits on a
  // portrait rather than glowing off it.
  star: {
    outline: '#3a2708',
    shades: ['#a8761c', '#e0ab35', '#ffd76a'],
    sheen: '#fff6cf',
    spark: '#fffbe8',
  },
  // Cool and paler, so the two are told apart by hue at a glance and not only
  // by shape — at eleven pixels the silhouettes are close.
  diamond: {
    outline: '#0f2a38',
    shades: ['#3f9fc0', '#79d6ef', '#bdf1ff'],
    sheen: '#ffffff',
    spark: '#ffffff',
  },
};

interface Compiled {
  width: number;
  height: number;
  /** -1 empty, 0 outline, 1..3 shade index. */
  cells: Int8Array;
  /** Diagonal position, used to run the sheen across the shape. */
  diagonal: Int8Array;
  maxDiagonal: number;
}

function compileMask(mask: string[]): Compiled {
  const height = mask.length;
  const width = mask[0].length;
  const solid = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < width && y < height && mask[y][x] === '#';

  const cells = new Int8Array(width * height).fill(-1);
  const diagonal = new Int8Array(width * height);
  const maxDiagonal = width + height - 2;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!solid(x, y)) continue;
      const at = y * width + x;
      diagonal[at] = x + y;

      // Outline is any solid pixel touching the outside. Doing it this way
      // rather than by hand means the shape can be edited freely.
      const edge = !solid(x - 1, y) || !solid(x + 1, y) || !solid(x, y - 1) || !solid(x, y + 1);
      if (edge) { cells[at] = 0; continue; }

      // Light from the upper left, which is where every other light in this
      // portrait system comes from.
      const lit = (x + y) / maxDiagonal;
      cells[at] = lit < 0.34 ? 3 : lit < 0.62 ? 2 : 1;
    }
  }

  return { width, height, cells, diagonal, maxDiagonal };
}

const COMPILED: Record<Exclude<DistinctionTier, null>, Compiled> = {
  star: compileMask(STAR_MASK),
  diamond: compileMask(DIAMOND_MASK),
};

/** Inset from the top-right corner, in art pixels. */
const INSET = 3;

/**
 * How the two marks move.
 *
 * `sweep` is the full cycle in milliseconds; `band` is the fraction of it the
 * highlight is crossing the shape, so a small band means the mark is at rest
 * most of the time. That restraint is the whole difference between charming and
 * garish: the star spends four fifths of every cycle perfectly still.
 */
const MOTION: Record<
  Exclude<DistinctionTier, null>,
  { sweep: number; band: number; twinkle: number; lift: number }
> = {
  // Gold needs two steps of lift before a highlight is visible on it at all.
  star: { sweep: 2600, band: 0.34, twinkle: 0, lift: 2 },
  // Cyan does not: two steps turned the whole gem white for a third of every
  // cycle, which is precisely the garishness to avoid. One step, and the stone
  // keeps its shape while the light crosses it. The gem gets a faster sweep and
  // a twinkle the star does not, so the rarer mark is the livelier one without
  // being the louder one.
  diamond: { sweep: 1900, band: 0.34, twinkle: 3400, lift: 1 },
};

/**
 * A four-point sparkle, as arms that grow outward from a centre pixel.
 *
 * Ordered inner-to-outer so drawing the first N entries gives a sparkle that
 * opens and closes. Drawn as a taper — the outermost ring is a single pixel per
 * arm — because a plain cross of equal-weight pixels reads as a plus sign, which
 * is what the first pass looked like.
 */
const TWINKLE_ARMS: Array<[number, number]> = [
  [0, 0],
  [0, -1], [0, 1], [-1, 0], [1, 0],
  [0, -2], [0, 2], [-2, 0], [2, 0],
  [0, -3], [0, 3], [-3, 0], [3, 0],
];

/**
 * Paint the mark into the top-right corner.
 *
 * `phase` is a monotonically increasing time in milliseconds; pass 0 for a
 * still frame, which lands both marks at rest.
 */
export function drawDistinctionMark(
  ctx: CanvasRenderingContext2D,
  canvasSize: number,
  tier: DistinctionTier,
  phase = 0,
): void {
  if (!tier) return;

  const art = COMPILED[tier];
  const ramp = RAMPS[tier];
  const motion = MOTION[tier];
  const originX = canvasSize - art.width - INSET;
  const originY = INSET;

  // The sheen is a band travelling down the diagonal. Starting it off the top
  // corner and ending past the bottom one means it enters and leaves cleanly
  // instead of appearing in the middle of the shape.
  const cycle = (phase % motion.sweep) / motion.sweep;
  const bandCentre = (cycle / motion.band) * (art.maxDiagonal + 4) - 2;
  const sweeping = cycle < motion.band;

  for (let y = 0; y < art.height; y += 1) {
    for (let x = 0; x < art.width; x += 1) {
      const at = y * art.width + x;
      const cell = art.cells[at];
      if (cell < 0) continue;

      let color: string;
      if (cell === 0) {
        color = ramp.outline;
      } else {
        // Two steps at the centre of the band and one at its edges, so the
        // highlight has a soft shoulder instead of a hard stripe. A single step
        // was almost invisible against gold, which is the failure the first
        // pass had: the animation was running and could not be seen.
        const distance = sweeping ? Math.abs(art.diagonal[at] - bandCentre) : 99;
        const lift = distance <= 0.75 ? motion.lift : distance <= 2 ? motion.lift - 1 : 0;
        const lifted = cell + Math.max(0, lift);
        color = lifted > 3 ? ramp.sheen : ramp.shades[lifted - 1];
      }

      ctx.fillStyle = color;
      ctx.fillRect(originX + x, originY + y, 1, 1);
    }
  }

  if (!motion.twinkle) return;

  // One spark on the gem's upper-right shoulder — on the stone rather than
  // floating beside it, so it reads as light coming off a facet. Short: a tenth
  // of the cycle, opening and closing again.
  const twinkle = (phase % motion.twinkle) / motion.twinkle;
  if (twinkle > 0.1) return;
  const reach = twinkle < 0.05 ? twinkle / 0.05 : (0.1 - twinkle) / 0.05;
  const arms = reach > 0.7 ? 13 : reach > 0.4 ? 9 : reach > 0.15 ? 5 : 1;

  ctx.fillStyle = ramp.spark;
  for (let i = 0; i < arms; i += 1) {
    const [dx, dy] = TWINKLE_ARMS[i];
    const px = originX + art.width - 4 + dx;
    const py = originY + 3 + dy;
    if (px < 0 || py < 0 || px >= canvasSize || py >= canvasSize) continue;
    ctx.fillRect(px, py, 1, 1);
  }
}
