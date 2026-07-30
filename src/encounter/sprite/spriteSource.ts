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

export type SpriteCharacter = PortraitSource & {
  equippedItems?: PlayerCharacter['equippedItems'];
};

export type HeldKind = 'pole' | 'blade' | 'tool' | 'book' | 'bag' | 'staff' | null;

/** What is actually on the feet, read from the equipped item. */
export type FootwearKind = 'bare' | 'sandal' | 'boot' | 'clog' | 'wrap' | 'straw' | 'shoe';

export interface SpriteExtras {
  /** Trousers/hose under a short garment; null under a floor-length one. */
  hasLegwear: boolean;
  /** Barefoot is common and should read as such. */
  footwear: FootwearKind;
  held: { kind: HeldKind; name: string } | null;
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
  const legs = c.equippedItems?.legs;
  const main = c.equippedItems?.main_hand;

  return {
    spec,
    extras: {
      hasLegwear: !!legs && !/bare/i.test(legs.name),
      footwear: classifyFootwear(feet?.name, (feet as { material?: string } | undefined)?.material),
      held: main && !/bare|empty|none/i.test(main.name)
        ? { kind: classifyHeld(main.name), name: main.name }
        : null,
    },
  };
}
