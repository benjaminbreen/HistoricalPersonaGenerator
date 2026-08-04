/**
 * components/HoverPlate.tsx
 *
 * The little parchment card that opens beside something when you hover it.
 *
 * Written for the portrait's wax seals and then wanted immediately by two more
 * places — the rarity line and the mark in the corner of the portrait — which
 * is the usual sign that a thing should be a component. The alternative on
 * offer was the browser's own `title`, and a native tooltip is the wrong
 * instrument here twice over: it is a grey system chrome box on a page that is
 * otherwise pretending to be a printed document, and it takes a second to
 * appear, which for a mark whose entire job is to be asked about is a second
 * too long.
 *
 * The trigger is whatever is passed as children. The plate is a sibling of it,
 * inside the anchor, so a single `:hover` on the anchor drives both.
 */

import React from 'react';

export type PlatePlacement = 'right' | 'left' | 'below';

interface Props {
  /** The bold serif line. Usually a name or an epithet. */
  title: string;
  /** Everything under it, one per line. */
  lines?: string[];
  placement?: PlatePlacement;
  /** `caps` is the seals' treatment: one short line, set as small capitals. */
  variant?: 'default' | 'caps';
  /** Goes on the anchor, so callers can style the trigger. */
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export default function HoverPlate({
  title,
  lines = [],
  placement = 'right',
  variant = 'default',
  className = '',
  style,
  children,
}: Props): React.ReactElement {
  return (
    <span
      className={`plate-anchor ${className}`.trim()}
      style={style}
      // Reachable by keyboard, since the plate only exists on hover, and
      // labelled in full for anyone who will never see it open.
      tabIndex={0}
      role="note"
      aria-label={[title, ...lines].join(' — ')}
    >
      {children}
      <span
        className={`hover-plate hover-plate-${placement}${variant === 'caps' ? ' hover-plate-caps' : ''}`}
        aria-hidden="true"
      >
        <strong>{title}</strong>
        {lines.map(line => <em key={line}>{line}</em>)}
      </span>
    </span>
  );
}
