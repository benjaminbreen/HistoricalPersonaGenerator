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

export type HeldKind = 'pole' | 'blade' | 'tool' | 'book' | 'bag' | 'staff' | null;

/** What is actually on the feet, read from the equipped item. */
export type FootwearKind = 'bare' | 'sandal' | 'boot' | 'clog' | 'wrap' | 'straw' | 'shoe';

export interface SpriteExtras {
  /** Barefoot is common and should read as such. */
  footwear: FootwearKind;
  held: { kind: HeldKind; name: string } | null;
  /** Worn at the belt or slung — drawn from the real item, never invented. */
  worn: { kind: WornKind; name: string } | null;
  /** Whether the character actually has a belt item, as opposed to a sash. */
  hasBelt: boolean;
  /** What is on the wrists — stacked bangles read very differently from a cuff. */
  armWear: { kind: ArmWear; name: string; metal: boolean };
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
  if (/bangle|kada|chudi|churi/.test(n)) return 'bangles';
  if (/armlet|armband|bazuband|torque.*arm|upper.?arm/.test(n)) return 'armlet';
  if (/bracelet|wristband|cuff|wrist/.test(n)) return 'bracelet';
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

/** Big Five → a resting stance, with a seeded tie-break. */
function readStance(c: SpriteCharacter, seed: number): RestStance {
  const p = c.personality;
  if (!p) return 'hang';
  const roll = unit(seed, 'stance');
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

function classifyHeld(name: string | undefined): HeldKind {
  if (!name) return null;
  if (/staff|crook|cane/i.test(name)) return 'staff';
  if (/spear|hoe|pike|scythe|pole|oar|pitchfork|rake|halberd/i.test(name)) return 'pole';
  if (/sword|knife|dagger|blade|machete|saber|scimitar/i.test(name)) return 'blade';
  if (/book|codex|scroll|ledger|tablet/i.test(name)) return 'book';
  if (/bag|sack|pouch|basket|satchel/i.test(name)) return 'bag';
  if (/hammer|axe|adze|chisel|tong|awl|shears|sickle|trowel|net/i.test(name)) return 'tool';
  return 'tool';
}

export function buildSpriteSource(c: SpriteCharacter): SpriteSource {
  const spec = buildPortraitSpec(c);

  const feet = c.equippedItems?.feet;
  const main = c.equippedItems?.main_hand;
  const belt = c.equippedItems?.belt;
  const acc = c.equippedItems?.accessory;
  const off = c.equippedItems?.off_hand;
  // A worn bag can arrive in any of three slots depending on what the
  // generator decided it was; take the first that classifies.
  const wornItem = [acc, belt, off].find(it => it && classifyWorn(it.name) !== 'none');
  const armItem = [acc, c.equippedItems?.ring1, off].find(
    it => it && classifyArmWear(it.name) !== 'none');
  const armName = armItem?.name ?? '';

  return {
    spec,
    extras: {
      footwear: classifyFootwear(feet?.name, (feet as { material?: string } | undefined)?.material),
      held: main && !/bare|empty|none/i.test(main.name)
        ? { kind: classifyHeld(main.name), name: main.name }
        : null,
      worn: wornItem ? { kind: classifyWorn(wornItem.name), name: wornItem.name } : null,
      hasBelt: !!belt && !/none|bare/i.test(belt.name),
      armWear: {
        kind: classifyArmWear(armName),
        name: armName,
        // Glass and clay bangles are as common as metal ones and should not
        // all come out looking like gold.
        metal: /gold|silver|bronze|brass|copper|iron|metal/i.test(armName),
      },
      stance: readStance(c, spec.seed),
    },
  };
}
