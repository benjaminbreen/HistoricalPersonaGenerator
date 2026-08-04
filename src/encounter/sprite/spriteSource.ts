/**
 * encounter/sprite/spriteSource.ts
 *
 * A sprite is a second projection of the same PortraitSpec the bust uses —
 * same skin, hair, garment ramps, headwear — plus the below-the-frame facts
 * the bust never needed: what is on the legs and feet, and what is in hand.
 */

import { buildPortraitSpec, PortraitSource } from '../../components/portraitLab/spec/buildSpec';
import { PortraitSpec } from '../../components/portraitLab/spec/types';
import { PlayerCharacter } from '../../types/playerCharacter';
import { unit } from '../../components/portraitLab/core/rng';

export type SpriteCharacter = PortraitSource & {
  equippedItems?: PlayerCharacter['equippedItems'];
  personality?: PlayerCharacter['personality'];
};

/** Something worn at the waist or over the shoulder, read off the inventory. */
export type WornKind = 'pouch' | 'satchel' | 'scrip' | 'purse' | 'horn' | 'tools' | 'none';

/** Worn on the arms rather than the belt: bangles, bracelets, armlets, cuffs. */
export type ArmWear = 'none' | 'bangles' | 'bracelet' | 'armlet';

/**
 * An object the persona carries that is neither a tool nor an ornament.
 *
 * The equipped `accessory` slot is empty on every generated persona — the
 * generator writes to `appearance.accessory` instead — so until this existed
 * the sprite saw none of it. What is there is not a rounding error: 256
 * distinct names over 3000 personas, and while most of them are beads and
 * pendants that the jewelry pass already handles, the remainder are *objects*.
 * A comb, a clay pipe, a pocket watch, a smartphone. None of the eight jewelry
 * types fits any of them, so they were being either forced into one or dropped.
 */
export type CarriedKind =
  | 'none'
  /** Worn in the hair, teeth outward: a wooden comb, a bamboo comb. */
  | 'comb'
  /** Through the knot at the back: jade, clay, bone, bronze. */
  | 'hairpin'
  /** Clay pipe, held at the mouth — the most characterful of the lot. */
  | 'pipe'
  /** At the wrist, or on a chain to the waist where it is a pocket watch. */
  | 'watch'
  /** In the free hand. The only twenty-first-century object in the set. */
  | 'phone'
  /** Held open at the chest: a folding fan, a palm-leaf fan. */
  | 'fan';

/**
 * What a held object is *made of*, kept separate from what shape it is.
 *
 * The same separation `construction.ts` makes between silhouette and culture,
 * and for the same reason: a stone knife and a steel knife are one form and two
 * materials, and folding the two questions together means either inventing a
 * `stone_knife` kind or painting flint like a sword. Read off the name, which
 * is where the generator already put it — "Stone Knife", "Ivory Tusk", "Reed
 * Pen", "Bronze Sickle" all say what they are.
 */
export type HeldMaterial =
  | 'wood' | 'metal' | 'iron' | 'stone' | 'bone' | 'fibre' | 'leather' | 'cloth' | 'clay';

/**
 * How a person stands when they are not doing anything.
 *
 * A crowd in which everyone rests their arms identically reads as a rank of
 * mannequins however well each one is drawn, and the variation is *free* —
 * the Big Five vector is already on every character. Low extraversion folds
 * the arms; high conscientiousness clasps them; high agreeableness lets them
 * hang open. It is a coarse mapping and deliberately so: at this size a stance
 * has to be legible in silhouette to be worth having.
 */
export type RestStance = 'hang' | 'clasp' | 'fold' | 'behind' | 'hip';

/**
 * What is in the hand, by silhouette.
 *
 * This used to be six values with `tool` as the catch-all, and the catch-all
 * took 103 of 165 held items in a 500-persona sample — every one of them drawn
 * as the same two-pixel vertical stick. A hoe, a fishing net, a hunting bow, a
 * spindle, a sling and a broom are not one object, and at 96px the difference
 * between them is the *only* thing telling a farmer from a fisherman from a
 * spinner, because nothing else in the figure says what the person does.
 *
 * The vocabulary is deliberately about how a thing hangs off a hand: a bow is
 * an arc under tension, a net is a draped mass, a hafted tool is a shaft with a
 * head set across the top. That is what a viewer reads at this size, and
 * keeping culture out of it is what stops the list becoming a museum catalogue.
 */
export type HeldKind =
  /** Shaft with a head set across the top: hoe, axe, sickle, hammer, pickaxe. */
  | 'hafted'
  /** Long, straight, symmetrical: spear, carrying pole, paddle, digging stick. */
  | 'pole'
  /** Taller than the shoulder, leaned on: staff, crook, cane. */
  | 'staff'
  /** An arc held under tension, string on the inside. */
  | 'bow'
  /** Hangs from the fist as a draped mass of mesh, gathered at the top. */
  | 'net'
  /** Two cords and a pouch, hanging slack. */
  | 'sling'
  /** A shaft with a whorl low on it. A broom and a distaff share the form. */
  | 'spindle'
  /** Held point-down beside the leg: sword, machete, sabre. */
  | 'blade'
  /** A long curved tusk, carried against the shoulder. */
  | 'tusk'
  /** Fits inside the fist and reads at the hand: knife, pen, seal, balance. */
  | 'small'
  /** Book, codex, scroll, ledger, tablet. */
  | 'book'
  /** Bag, basket, sack — carried by the mouth of it. */
  | 'bag'
  | null;

/** What is actually on the feet, read from the equipped item. */
export type FootwearKind = 'bare' | 'sandal' | 'boot' | 'clog' | 'wrap' | 'straw' | 'shoe';

export interface SpriteExtras {
  /** Barefoot is common and should read as such. */
  footwear: FootwearKind;
  held: { kind: HeldKind; material: HeldMaterial; name: string } | null;
  /** Worn at the belt or slung — drawn from the real item, never invented. */
  worn: { kind: WornKind; name: string } | null;
  /** Whether the character actually has a belt item, as opposed to a sash. */
  hasBelt: boolean;
  /** What is on the wrists — stacked bangles read very differently from a cuff. */
  armWear: { kind: ArmWear; name: string; metal: boolean };
  /** The object accessory, where it is an object rather than an ornament. */
  carried: { kind: CarriedKind; material: HeldMaterial; name: string } | null;
  /**
   * The accessory's raw name, whatever it turned out to be.
   *
   * Carried through unclassified because `construction.ts` reads it for the
   * over-layer — a shawl or a bandana in this slot is a garment decision, not
   * an accessory one, and routing it through a classifier that has no case for
   * cloth is how every shawl in the app went missing.
   */
  accessoryName: string;
  stance: RestStance;
}

/**
 * Bags and pouches, sorted into the shapes the sprite can actually draw. As
 * with footwear this reads the item's own name — the generator dresses people
 * in scrips, aumônières and tool-rolls and the sprite should show what they
 * are carrying rather than a generic square.
 */
/**
 * Arm ornament. Bangles are a *stack* of thin rings up the forearm and read
 * completely differently from a single broad cuff, which is why they are
 * separated here rather than lumped into one 'bracelet'.
 */
function classifyArmWear(name: string | undefined): ArmWear {
  if (!name) return 'none';
  const n = name.toLowerCase();
  if (/bangle|kada\b|chudi|churi|karra/.test(n)) return 'bangles';
  // "Arm Bands" is written with a space in the tables and `armband` could not
  // match it, so the commonest armlet name in the app scored `none`.
  if (/armlet|arm ?bands?|bazuband|torque.*arm|upper.?arm/.test(n)) return 'armlet';
  if (/bracelet|wristband|cuff|wrist/.test(n)) return 'bracelet';
  return 'none';
}

/**
 * The object accessories: things the persona carries that are not ornament.
 *
 * Tested before the jewelry reading rather than after, because several of these
 * are made of the same substances the ornaments are and would otherwise be
 * claimed by them — a jade hairpin is not a jade pendant, and a clay pipe is
 * not a clay bead.
 */
function classifyCarried(name: string | undefined): CarriedKind {
  if (!name) return 'none';
  const n = name.toLowerCase();
  if (/\bcomb\b/.test(n)) return 'comb';
  if (/hairpin|hair pin|kanzashi|\bbodkin\b/.test(n)) return 'hairpin';
  if (/\bpipe\b|chillum|kiseru|calumet/.test(n)) return 'pipe';
  if (/watch\b|timepiece|chronometer/.test(n)) return 'watch';
  if (/phone|mobile|smartphone|handset/.test(n)) return 'phone';
  if (/\bfan\b|uchiwa|sensu/.test(n)) return 'fan';
  return 'none';
}

function classifyWorn(name: string | undefined): WornKind {
  if (!name) return 'none';
  const n = name.toLowerCase();
  if (/satchel|shoulder bag|haversack|knapsack|sling bag/.test(n)) return 'satchel';
  if (/scrip|pilgrim|wallet/.test(n)) return 'scrip';
  if (/purse|aumôni|aumoni|coin|money/.test(n)) return 'purse';
  if (/horn|flask|canteen|gourd|waterskin/.test(n)) return 'horn';
  if (/tool|awl|chisel|kit|roll|case/.test(n)) return 'tools';
  if (/pouch|bag|sack|pocket|bursa/.test(n)) return 'pouch';
  return 'none';
}

/**
 * Big Five → a resting stance, with a seeded tie-break.
 *
 * `holding` overrides temperament, and has to. Three of the five stances put
 * the hands in front of the body or behind it — folded, clasped at the waist,
 * hands behind the back — and every one of them is a stance you cannot adopt
 * while carrying a spear. Drawn anyway, the object was placed at a hand that
 * had moved to the centre of the chest, so the shaft ran straight down the
 * middle of the figure and cut it in half. A person holding a tool holds it at
 * their side; that is not a stylistic choice, it is the only thing their arm
 * can be doing.
 */
function readStance(c: SpriteCharacter, seed: number, holding: boolean): RestStance {
  const p = c.personality;
  if (!p) return 'hang';
  const roll = unit(seed, 'stance');
  // No variation is offered here on purpose. `hip` puts the hand on the waist,
  // which is inside the figure's own outline, so the shaft rose out of the hip
  // and split the body down the middle — the same failure as folding the arms,
  // reached by a different route.
  if (holding) return 'hang';
  // Guarded people close themselves off; the arms are the first thing to go.
  if (p.extraversion < 0.32 && p.neuroticism > 0.45) return 'fold';
  if (p.conscientiousness > 0.66 && p.extraversion < 0.55) return 'clasp';
  // Confident and formal: hands behind the back.
  if (p.extraversion > 0.62 && p.conscientiousness > 0.55) return roll < 0.6 ? 'behind' : 'hip';
  if (p.extraversion > 0.70) return 'hip';
  if (p.agreeableness > 0.66) return 'hang';
  return roll < 0.22 ? 'clasp' : 'hang';
}

export interface SpriteSource {
  spec: PortraitSpec;
  extras: SpriteExtras;
}

/**
 * The generator dresses feet in period footwear by name — waraji, pattens,
 * buskins, huaraches. Reading the name (and material, when present) sorts
 * them into the handful of constructions the sprite can actually draw.
 */
function classifyFootwear(name: string | undefined, material?: string): FootwearKind {
  if (!name || /barefoot|\bbare\b|none/i.test(name)) return 'bare';
  const n = `${name} ${material ?? ''}`.toLowerCase();
  if (/sandal|thong|waraji|zori|zōri|caliga|huarache|chappal|paduka|flip/.test(n)) return 'sandal';
  if (/boot|buskin|valenki|mukluk|jackboot/.test(n)) return 'boot';
  if (/clog|patten|geta|sabot|wooden/.test(n)) return 'clog';
  if (/straw|rush|rope|bast|espadrille|woven|fiber|fibre|grass|reed/.test(n)) return 'straw';
  if (/wrap|tabi|sock|felt|binding|puttee|cloth shoe|hose/.test(n)) return 'wrap';
  return 'shoe';
}

/**
 * Order matters and runs specific → general, the same way the garment
 * constructions do. The pairs that need care:
 *
 * - `net` before everything, because "Fishing Net" also contains nothing else
 *   but a "Fishing Spear" must not be caught by it.
 * - `bow` before `pole`: a crossbow has a stock, but its silhouette is the bow.
 * - `sickle` and `scythe` are hafted, not bladed. They were under `pole` and
 *   `blade` respectively, which is two different wrong answers for one tool.
 * - `small` before `blade`, so a paring knife is not drawn as a sword. Length
 *   is the whole distinction: both are a piece of edged metal.
 */
function classifyHeld(name: string | undefined): HeldKind {
  if (!name) return null;
  const n = name.toLowerCase();
  if (/\bnets?\b|seine|trawl/.test(n)) return 'net';
  if (/sling(?!\s*bag)/.test(n)) return 'sling';
  if (/\bbow\b|crossbow/.test(n)) return 'bow';
  if (/spindle|distaff|\bbroom\b|besom|whisk|flail/.test(n)) return 'spindle';
  if (/tusk|ivory|antler|horn\b/.test(n)) return 'tusk';
  if (/staff|crook|cane\b|walking stick|crozier|sceptre|scepter/.test(n)) return 'staff';
  if (/hoe|axe\b|adze|hammer|mallet|sickle|scythe|pickaxe|pick\b|mattock|hatchet|tomahawk|maul|shears|spade|shovel/.test(n))
    return 'hafted';
  if (/spear|pike|\bpole\b|oar|paddle|pitchfork|rake|halberd|lance|harpoon|punt|goad|digging stick|musket|flintlock|matchlock|rifle/.test(n))
    return 'pole';
  if (/book|codex|scroll|ledger|tablet|slate\b/.test(n)) return 'book';
  if (/\bbags?\b|sack|pouch|basket|satchel|creel|gourd|jug|\bpot\b|bowl/.test(n)) return 'bag';
  // Anything edged that is short enough to close a hand round.
  if (/knife|dagger|awl|chisel|\bpen\b|stylus|seal\b|scale\b|balance|trowel|razor|needle|shuttle|comb\b/.test(n))
    return 'small';
  if (/sword|blade|machete|saber|sabre|scimitar|cutlass|katana|cleaver/.test(n)) return 'blade';
  // A plain "Stick" and everything unrecognised. `pole` rather than `small`:
  // an object nobody named precisely is more often a length of something than a
  // thing in a fist, and a shaft is the least wrong guess at this size.
  return 'pole';
}

/**
 * What the thing is made of, read off the name.
 *
 * The name and *only* the name, plus the item's `material` field when that
 * field says something. It usually does not: measured over 4000 personas, every
 * main-hand item in the app carries `material: "cloth"` except the hafted spear,
 * which carries "Flint and Wood". That default is not a claim about the object
 * — a carrying pole is not made of cloth — but it was being believed, and the
 * consequence was that nearly every tool in the game was painted in the
 * wearer's *accent cloth colour*: blue poles, red spear shafts, a green rake.
 *
 * The order is a precedence, not a preference: "Stone Knife" has to reach stone
 * before the fallback decides that an unqualified knife is metal, and "Ivory
 * Tusk" has to reach bone before "iron" can match inside nothing at all.
 */
function classifyHeldMaterial(
  name: string | undefined, material: string | undefined, kind: HeldKind
): HeldMaterial {
  // A material that is exactly the generic default carries no information.
  const said = /^\s*(cloth|misc|none|material)?\s*$/i.test(material ?? '') ? '' : material;
  const n = `${name ?? ''} ${said ?? ''}`.toLowerCase();
  if (/ivory|tusk|antler|\bbone\b|horn\b|shell/.test(n)) return 'bone';
  if (/stone|flint|obsidian|chert|granite|slate|jade/.test(n)) return 'stone';
  if (/clay|terracotta|earthenware|ceramic|porcelain/.test(n)) return 'clay';
  if (/leather|\bhide\b|rawhide|tanned|skin\b/.test(n)) return 'leather';
  // Canvas belongs with the cordage, not the cloth: it is undyed sailcloth and
  // painting it in the persona's accent turned every sack in the app the colour
  // of their trim.
  if (/rope|cord|twine|hemp|sinew|fibre|fiber|reed|straw|rush|grass|woven|canvas|sail|jute|\bnet\b/.test(n))
    return 'fibre';
  if (/cloth|linen|cotton|wool|silk/.test(n)) return 'cloth';
  if (/iron|steel|bronze|copper|brass|silver|gold|tin\b|metal|blade/.test(n)) return 'metal';
  // Nothing said. Fall to what the form is usually made of, which is a better
  // guess than one default for everything: a net is cordage, a sword is steel,
  // and a haft is wood whatever its head is.
  switch (kind) {
    case 'net': case 'sling': return 'fibre';
    case 'blade': case 'small': return 'metal';
    case 'tusk': return 'bone';
    // A sack is sacking and a book is bound in hide. Both used to fall to
    // `cloth`, which is the *garment's accent ramp* — so an unnamed bag came
    // out the colour of its owner's trim, and a teal one at that.
    case 'bag': return 'fibre';
    case 'book': return 'leather';
    default: return 'wood';
  }
}

/**
 * The item in a slot, taking the equipped item first and the procedural
 * appearance behind it.
 *
 * Exactly the precedence `buildSpec` uses for the garment, the legwear and the
 * headgear, and it had never been applied to anything the sprite reads on its
 * own. The consequence was not subtle: `equippedItems.accessory` is empty on
 * *every* generated persona — the generator writes `appearance.accessory`
 * instead — so the sprite's accessory handling had been running against an
 * always-null value since it was written. Feet are the same story to a smaller
 * degree: the equipped slot covers 79% and `appearance.footwear` the rest.
 */
function pieceIn(
  c: SpriteCharacter, slot: string, appearanceKey?: string
): { name: string; material?: string } | null {
  const equipped = c.equippedItems?.[slot] as { name?: string; material?: string } | undefined;
  const fallback = appearanceKey
    ? (c.appearance?.[appearanceKey] as { name?: string; material?: string } | undefined)
    : undefined;
  for (const piece of [equipped, fallback]) {
    const name = piece?.name?.trim();
    if (name && !/^(none|nothing|bare|empty|n\/a)$/i.test(name)) {
      return { name, material: piece?.material };
    }
  }
  return null;
}

export function buildSpriteSource(c: SpriteCharacter): SpriteSource {
  const spec = buildPortraitSpec(c);

  const feet = pieceIn(c, 'feet', 'footwear');
  const main = pieceIn(c, 'main_hand');
  const belt = pieceIn(c, 'belt', 'belt');
  const acc = pieceIn(c, 'accessory', 'accessory');
  const off = pieceIn(c, 'off_hand');
  const neck = pieceIn(c, 'necklace');
  // The accessory is read as three separate questions, because one slot holds
  // three unrelated kinds of thing: a bag, an arm ornament and an object. A
  // "Leather Purse" is worn, "Glass Bangles" are on the wrist and a "Clay Pipe"
  // is in the hand, and each has to reach its own classifier or be dropped.
  const wornItem = [acc, belt, off, neck].find(it => it && classifyWorn(it.name) !== 'none');
  const armItem = [acc, pieceIn(c, 'ring1'), off].find(
    it => it && classifyArmWear(it.name) !== 'none');
  const armName = armItem?.name ?? '';
  const carriedKind = classifyCarried(acc?.name);
  const heldKind = main ? classifyHeld(main.name) : null;

  return {
    spec,
    extras: {
      footwear: classifyFootwear(feet?.name, feet?.material),
      held: main
        ? {
          kind: heldKind,
          material: classifyHeldMaterial(main.name, main.material, heldKind),
          name: main.name,
        }
        : null,
      worn: wornItem ? { kind: classifyWorn(wornItem.name), name: wornItem.name } : null,
      hasBelt: !!belt,
      armWear: {
        kind: classifyArmWear(armName),
        name: armName,
        // Glass and clay bangles are as common as metal ones and should not
        // all come out looking like gold.
        metal: /gold|silver|bronze|brass|copper|iron|metal/i.test(armName),
      },
      carried: carriedKind !== 'none' && acc
        ? {
          kind: carriedKind,
          material: classifyHeldMaterial(acc.name, acc.material, null),
          name: acc.name,
        }
        : null,
      accessoryName: acc?.name ?? '',
      stance: readStance(c, spec.seed, !!main),
    },
  };
}
