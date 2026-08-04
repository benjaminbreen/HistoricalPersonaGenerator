/**
 * components/TraitSeals.tsx
 *
 * The wax seals in the corner of a portrait.
 *
 * Closed, a seal is a disc of wax with a device pressed into it and nothing
 * else — no text, no number, no explanation. That is the point: at 248 pixels
 * the portrait is the thing worth looking at, and a label pinned permanently
 * over it costs more than it pays. The claim unrolls on hover, and only then.
 *
 * The device is a Game Icons glyph rather than a monogram. A seal is a picture
 * by nature — the whole institution exists because most of the people who
 * handled one could not read — and `Cs` in a blob of wax reads as a chemical
 * symbol.
 *
 * See `traitSeals` for which of them a person earns, and how rarely.
 */

import React from 'react';
import { IconType } from 'react-icons';
import {
  GiBiceps, GiHandGrip, GiRun, GiHeartBeats, GiOpenBook, GiOwl, GiEagleEmblem,
  GiFoxHead, GiCharm, GiTalk, GiClover, GiCompass, GiHourglass, GiThreeFriends,
  GiShakingHands, GiPsychicWaves,
} from 'react-icons/gi';
import HoverPlate from './HoverPlate';
import { TraitSeal } from '../utils/traitSeals';

/**
 * One device per trait, not per direction. A seal says what it is about; the
 * label says which end of it the wearer is on, and the rim colour says so at a
 * glance — gold for the top of a scale, pewter for the bottom.
 */
const DEVICE: Record<string, IconType> = {
  'stat:strength': GiBiceps,
  'stat:dexterity': GiHandGrip,
  'stat:stamina': GiRun,
  'stat:constitution': GiHeartBeats,
  'stat:intelligence': GiOpenBook,
  'stat:wisdom': GiOwl,
  'stat:perception': GiEagleEmblem,
  'stat:craftiness': GiFoxHead,
  'stat:charisma': GiCharm,
  'stat:persuasion': GiTalk,
  'stat:luck': GiClover,
  'trait:openness': GiCompass,
  'trait:conscientiousness': GiHourglass,
  'trait:extraversion': GiThreeFriends,
  'trait:agreeableness': GiShakingHands,
  'trait:neuroticism': GiPsychicWaves,
};

interface Props {
  seals: TraitSeal[];
}

export default function TraitSeals({ seals }: Props): React.ReactElement | null {
  if (!seals.length) return null;

  return (
    <div className="trait-seals">
      {seals.map((seal, index) => {
        const Device = DEVICE[seal.id] || GiCharm;
        return (
          <HoverPlate
            key={seal.id}
            title={seal.epithet}
            lines={[seal.standing]}
            placement="right"
            variant="caps"
            className={`trait-seal trait-seal-${seal.family} trait-seal-${seal.direction}`}
            // Hand-stamped, so no two sit at quite the same angle. Alternating
            // rather than random: a seal that tilts differently on every render
            // is a seal that jitters when React re-renders the card.
            style={{ '--seal-tilt': index % 2 === 0 ? '-7deg' : '5deg' } as React.CSSProperties}
          >
            <span className="trait-seal-wax" aria-hidden="true">
              <Device />
            </span>
          </HoverPlate>
        );
      })}
    </div>
  );
}
