/**
 * components/polityEmblems.tsx
 *
 * The drawn devices behind `polityService`'s `emblem` field.
 *
 * Every one of these is a reconstruction of an attested flag or banner from its
 * documented description — a blazon, a decree, a naval register. None is
 * invented, and a polity with no attested device has no entry here and gets a
 * name-only chip instead, which is the honest result for the Inca Empire and
 * Srivijaya alike.
 *
 * They are drawn rather than fetched for three reasons: the badge renders at
 * about 20px, where a downloaded raster is mush; the page has no external
 * asset budget; and Wikimedia's historical flag files are frequently editor
 * reconstructions of exactly the kind this table is trying to avoid inheriting
 * uncritically.
 *
 * Simplification at this size is deliberate and bounded: proportions are
 * normalised to 3:2, and charges too fine to read below 24px — the Union
 * Flag's fimbriation, the exact star count of the US canton — are simplified
 * rather than rendered as noise. Nothing is simplified in a way that changes
 * what the device *is*.
 */

import React from 'react';

/** All emblems share this viewBox so the badge can size them uniformly. */
const VB = '0 0 30 20';

const emblems: Record<string, React.ReactElement> = {
  'st-george': (
    <svg viewBox={VB} role="presentation">
      <rect width="30" height="20" fill="#fff" />
      <rect x="12" width="6" height="20" fill="#ce1124" />
      <rect y="7" width="30" height="6" fill="#ce1124" />
    </svg>
  ),

  saltire: (
    <svg viewBox={VB} role="presentation">
      <rect width="30" height="20" fill="#005eb8" />
      <path d="M0 0 L30 20 M30 0 L0 20" stroke="#fff" strokeWidth="4" />
    </svg>
  ),

  // 1707: the crosses of St George and St Andrew, before St Patrick's saltire.
  'union-1707': (
    <svg viewBox={VB} role="presentation">
      <rect width="30" height="20" fill="#00247d" />
      <path d="M0 0 L30 20 M30 0 L0 20" stroke="#fff" strokeWidth="4" />
      <rect x="11.5" width="7" height="20" fill="#fff" />
      <rect y="6.5" width="30" height="7" fill="#fff" />
      <rect x="13" width="4" height="20" fill="#cf142b" />
      <rect y="8" width="30" height="4" fill="#cf142b" />
    </svg>
  ),

  // 1801: St Patrick's red saltire added, counterchanged against the white.
  'union-1801': (
    <svg viewBox={VB} role="presentation">
      <rect width="30" height="20" fill="#00247d" />
      <path d="M0 0 L30 20 M30 0 L0 20" stroke="#fff" strokeWidth="5" />
      <path d="M0 0 L30 20 M30 0 L0 20" stroke="#cf142b" strokeWidth="2" />
      <rect x="11.5" width="7" height="20" fill="#fff" />
      <rect y="6.5" width="30" height="7" fill="#fff" />
      <rect x="13" width="4" height="20" fill="#cf142b" />
      <rect y="8" width="30" height="4" fill="#cf142b" />
    </svg>
  ),

  // France moderne: three fleurs-de-lis on azure, as borne from 1376.
  'france-ancien': (
    <svg viewBox={VB} role="presentation">
      <rect width="30" height="20" fill="#0055a4" />
      <g fill="#ffd34d">
        {[[10, 6], [20, 6], [15, 13]].map(([x, y]) => (
          <path
            key={`${x}-${y}`}
            d={`M${x} ${y - 3} C${x - 1.4} ${y - 1} ${x - 1.4} ${y} ${x} ${y + 1.4}
                C${x + 1.4} ${y} ${x + 1.4} ${y - 1} ${x} ${y - 3}Z
                M${x - 2.6} ${y - 0.4} C${x - 2.2} ${y + 1.4} ${x - 1} ${y + 1.8} ${x - 0.7} ${y + 1.9}
                L${x - 0.7} ${y + 0.4}Z
                M${x + 2.6} ${y - 0.4} C${x + 2.2} ${y + 1.4} ${x + 1} ${y + 1.8} ${x + 0.7} ${y + 1.9}
                L${x + 0.7} ${y + 0.4}Z`}
          />
        ))}
      </g>
    </svg>
  ),

  tricolore: (
    <svg viewBox={VB} role="presentation">
      <rect width="10" height="20" fill="#0055a4" />
      <rect x="10" width="10" height="20" fill="#fff" />
      <rect x="20" width="10" height="20" fill="#ef4135" />
    </svg>
  ),

  // The statenvlag: red over white over blue, which displaced the orange of
  // the prinsenvlag over the course of the seventeenth century.
  netherlands: (
    <svg viewBox={VB} role="presentation">
      <rect width="30" height="20" fill="#ae1c28" />
      <rect y="6.67" width="30" height="6.67" fill="#fff" />
      <rect y="13.33" width="30" height="6.67" fill="#21468b" />
    </svg>
  ),

  russia: (
    <svg viewBox={VB} role="presentation">
      <rect width="30" height="20" fill="#fff" />
      <rect y="6.67" width="30" height="6.67" fill="#0039a6" />
      <rect y="13.33" width="30" height="6.67" fill="#d52b1e" />
    </svg>
  ),

  ussr: (
    <svg viewBox={VB} role="presentation">
      <rect width="30" height="20" fill="#cc0000" />
      <g fill="#ffd700" transform="translate(6.5 6) scale(0.85)">
        {/* Hammer, laid across the sickle's arc. */}
        <path d="M0.4 4.6 L4.4 0.6 L5.4 1.6 L1.4 5.6 Z" />
        <path d="M4.1 0.2 L6.1 0.2 L6.1 1.6 L4.6 1.6 Z" />
        {/* Sickle: a crescent blade with a short handle. */}
        <path d="M1.2 1.0 A5 5 0 0 1 6.2 6.0 L5.0 6.0 A3.8 3.8 0 0 0 1.2 2.2 Z" />
        <path d="M5.6 5.8 L6.6 5.8 L6.6 7.0 L5.6 7.0 Z" />
      </g>
      <path d="M4.2 3.4 L5.2 3.4 L5.5 2.5 L5.8 3.4 L6.8 3.4 L6.0 4.0 L6.3 4.9 L5.5 4.35 L4.7 4.9 L5.0 4.0 Z"
        fill="#ffd700" transform="translate(-0.5 -1.6) scale(0.9)" />
    </svg>
  ),

  'german-empire': (
    <svg viewBox={VB} role="presentation">
      <rect width="30" height="20" fill="#000" />
      <rect y="6.67" width="30" height="6.67" fill="#fff" />
      <rect y="13.33" width="30" height="6.67" fill="#d00" />
    </svg>
  ),

  germany: (
    <svg viewBox={VB} role="presentation">
      <rect width="30" height="20" fill="#000" />
      <rect y="6.67" width="30" height="6.67" fill="#d00" />
      <rect y="13.33" width="30" height="6.67" fill="#ffce00" />
    </svg>
  ),

  ottoman: (
    <svg viewBox={VB} role="presentation">
      <rect width="30" height="20" fill="#e30a17" />
      <circle cx="13" cy="10" r="5" fill="#fff" />
      <circle cx="14.8" cy="10" r="4" fill="#e30a17" />
      <path d="M19.4 7.6 L20.3 9.4 L22.3 9.6 L20.8 10.9 L21.3 12.9 L19.4 11.9 L17.6 12.9 L18.1 10.9 L16.6 9.6 L18.6 9.4 Z"
        fill="#fff" />
    </svg>
  ),

  turkey: (
    <svg viewBox={VB} role="presentation">
      <rect width="30" height="20" fill="#e30a17" />
      <circle cx="12" cy="10" r="4.6" fill="#fff" />
      <circle cx="13.7" cy="10" r="3.7" fill="#e30a17" />
      <path d="M18.2 7.8 L19.0 9.5 L20.9 9.7 L19.5 10.9 L19.9 12.8 L18.2 11.8 L16.5 12.8 L16.9 10.9 L15.5 9.7 L17.4 9.5 Z"
        fill="#fff" />
    </svg>
  ),

  greece: (
    <svg viewBox={VB} role="presentation">
      <rect width="30" height="20" fill="#0d5eaf" />
      {[1, 3, 5, 7].map(i => (
        <rect key={i} y={i * 2.22} width="30" height="2.22" fill="#fff" />
      ))}
      <rect width="11.1" height="11.1" fill="#0d5eaf" />
      <rect x="4.44" width="2.22" height="11.1" fill="#fff" />
      <rect y="4.44" width="11.1" height="2.22" fill="#fff" />
    </svg>
  ),

  hinomaru: (
    <svg viewBox={VB} role="presentation">
      <rect width="30" height="20" fill="#fff" />
      <circle cx="15" cy="10" r="6" fill="#bc002d" />
    </svg>
  ),

  // Thirteen stripes and a starred canton. The star count is suggested rather
  // than counted out; at 20px an accurate fifty would be a grey smear.
  'stars-and-stripes': (
    <svg viewBox={VB} role="presentation">
      <rect width="30" height="20" fill="#fff" />
      {[0, 2, 4, 6].map(i => (
        <rect key={i} y={i * 3.08 + 1.54} width="30" height="1.54" fill="#b22234" />
      ))}
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <rect key={`s${i}`} y={i * 3.08} width="30" height="1.54" fill="#b22234" />
      ))}
      <rect width="13" height="10.8" fill="#3c3b6e" />
      <g fill="#fff">
        {[2, 5, 8, 11].map(x =>
          [2, 5.4, 8.8].map(y => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.7" />))}
      </g>
    </svg>
  ),

  prc: (
    <svg viewBox={VB} role="presentation">
      <rect width="30" height="20" fill="#de2910" />
      <g fill="#ffde00">
        <path d="M5 2.4 L6.1 5.7 L9.5 5.7 L6.8 7.8 L7.8 11.1 L5 9.1 L2.2 11.1 L3.2 7.8 L0.5 5.7 L3.9 5.7 Z" />
        {[[10.6, 2.2], [12.4, 4.3], [12.4, 7.2], [10.6, 9.2]].map(([x, y]) => (
          <path key={`${x}-${y}`}
            d={`M${x} ${y - 1.1} L${x + 0.5} ${y - 0.1} L${x + 1.6} ${y - 0.1} L${x + 0.7} ${y + 0.6}
                L${x + 1.1} ${y + 1.7} L${x} ${y + 1} L${x - 1.1} ${y + 1.7} L${x - 0.7} ${y + 0.6}
                L${x - 1.6} ${y - 0.1} L${x - 0.5} ${y - 0.1} Z`} />
        ))}
      </g>
    </svg>
  ),

  // The 1785 naval ensign, chosen by Charles III to be legible at sea, which is
  // also why it survives as the basis of the modern flag.
  spain: (
    <svg viewBox={VB} role="presentation">
      <rect width="30" height="20" fill="#aa151b" />
      <rect y="5" width="30" height="10" fill="#f1bf00" />
    </svg>
  ),
};

/** The drawn device for an emblem id, or null if none is held. */
export function polityEmblem(id: string): React.ReactElement | null {
  return emblems[id] ?? null;
}
