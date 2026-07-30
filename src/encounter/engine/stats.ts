/**
 * encounter/engine/stats.ts
 *
 * Battle-facing numbers derived from the character sheet. App stats run
 * roughly 1–15; these scale them into readable game quantities and fold in
 * whatever the persona is actually holding and wearing.
 */

import { PlayerCharacter } from '../../types/playerCharacter';

export interface BattleStats {
  maxHp: number;
  /** Physical threat: strength, plus the tool in hand. */
  attack: number;
  /** Toughness plus whatever is worn. */
  defense: number;
  speed: number;
  /** Quickness of mind — reading a stranger, landing a point. */
  wit: number;
  /** Warmth and persuasion. */
  charm: number;
  /** Light fingers and misdirection. */
  guile: number;
  /** Composure under pressure. */
  nerve: number;
  luck: number;
  /** What the attack number is holding, for the log. */
  weaponName: string | null;
}

const clampStat = (v: number | undefined, fallback = 6) =>
  Math.max(1, Math.min(18, Math.round(v ?? fallback)));

export function deriveBattleStats(c: PlayerCharacter): BattleStats {
  const s = c.stats || ({} as PlayerCharacter['stats']);
  const str = clampStat(s.strength);
  const dex = clampStat(s.dexterity);
  const con = clampStat(s.constitution);
  const sta = clampStat(s.stamina, con);
  const int = clampStat(s.intelligence);
  const wis = clampStat(s.wisdom);
  const cha = clampStat(s.charisma);
  const per = clampStat(s.perception, wis);
  const cft = clampStat(s.craftiness, dex);
  const psn = clampStat(s.persuasion, cha);
  const lck = clampStat(s.luck, 6);

  const weapon = c.equippedItems?.main_hand;
  const weaponAtk = Math.min(10, Math.max(0, weapon?.attack ?? 0));
  const armor = (c.equippedItems?.torso?.defense ?? 0) + (c.equippedItems?.head?.defense ?? 0);

  return {
    maxHp: 60 + con * 5 + sta * 3 + str * 2,
    attack: str * 2 + dex + weaponAtk * 2,
    defense: con + Math.min(8, armor),
    speed: dex * 2 + per,
    wit: int + cft,
    charm: cha + psn,
    guile: cft + dex,
    nerve: wis + Math.round(con / 2),
    luck: lck,
    weaponName: weaponAtk > 0 ? weapon!.name : null,
  };
}

export const WEALTH_RANK: Record<string, number> = {
  poor: 0, modest: 1, comfortable: 2, wealthy: 3, noble: 4,
};

export interface DisplayStat {
  label: string;
  icon: string;
  value: number;
}

/**
 * The four numbers on the persona cards, 0–100, each read off the sheet:
 * charm for diplomacy, the attack line for strength, Big-Five openness for
 * curiosity, and station (nudged by coin) for wealth.
 */
export function displayStats(c: PlayerCharacter, battle: BattleStats): DisplayStat[] {
  const clamp100 = (v: number) => Math.max(1, Math.min(99, Math.round(v)));
  return [
    { label: 'Diplomacy', icon: '🕊', value: clamp100((battle.charm / 32) * 100) },
    { label: 'Strength', icon: '✊', value: clamp100((battle.attack / 62) * 100) },
    { label: 'Curiosity', icon: '🌿', value: clamp100(c.personality?.openness ?? 50) },
    {
      label: 'Wealth', icon: '🪙',
      value: clamp100(WEALTH_RANK[c.wealthLevel] * 20 + 8 + Math.min(14, Math.sqrt(Math.max(0, c.currency ?? 0)))),
    },
  ];
}
