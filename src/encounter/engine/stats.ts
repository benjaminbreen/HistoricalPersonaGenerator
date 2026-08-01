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
  value: number;
}

/**
 * The four encounter-facing qualities shown in the compact side dossiers.
 * These are derived from the existing character sheet rather than rolled just
 * for the encounter.
 */
export function displayStats(_c: PlayerCharacter, battle: BattleStats): DisplayStat[] {
  const clamp100 = (v: number) => Math.max(1, Math.min(99, Math.round(v)));
  return [
    { label: 'Resolve', value: clamp100((battle.nerve / 27) * 100) },
    { label: 'Strength', value: clamp100((battle.attack / 62) * 100) },
    { label: 'Cunning', value: clamp100(((battle.wit + battle.guile) / 68) * 100) },
    { label: 'Fortune', value: clamp100((battle.luck / 18) * 100) },
  ];
}
