/**
 * components/PolityBadge.tsx
 *
 * The state a persona lived under, in the card header.
 *
 * Two shapes, and which one appears is itself information. Where a device is
 * attested for the polity *and* for the persona's year, the badge shows it and
 * the hover card names what kind of thing it is and when it was adopted. Where
 * none is — the Inca Empire, Srivijaya, the Chagatai Khanate, and most states
 * before about 1700 — the badge is the name alone. The gap is the honest
 * answer, not a missing asset, so nothing stands in for it.
 *
 * The hover card is a small component rather than a native `title` because the
 * app's 22 other tooltips are plain text and this one carries an emblem, a
 * date, a Wikipedia extract and a link.
 */

import React, { useEffect, useRef, useState } from 'react';
import type { ResolvedPolity } from '../services/polityService';
import { describeYear, withPolityArticle } from '../services/polityService';
import { polityEmblem } from './polityEmblems';
import { getArticleSummary, type ArticleSummary } from '../services/wikipediaService';

const EMBLEM_NOUN: Record<string, string> = {
  flag: 'flag',
  banner: 'banner',
  arms: 'coat of arms',
};

/**
 * The name as a label rather than as prose. The table stores "the Ilkhanate"
 * and "the Samanid Empire" because most uses are mid-sentence, but a chip
 * reading "the Samanid Empire" has an article dangling off the front of it.
 */
const asLabel = (name: string): string => name.replace(/^the\s+/i, '');

interface PolityBadgeProps {
  polity: ResolvedPolity;
  /** The persona's year, for phrasing how long the state had been in place. */
  year: number;
}

export const PolityBadge: React.FC<PolityBadgeProps> = ({ polity, year }) => {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<ArticleSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** The article a fetch has already been started for, so opening twice does not refetch. */
  const requested = useRef<string | null>(null);

  // Fetched when the persona appears rather than on hover. The badge itself
  // needs the flag — waiting for a hover would mean the emblem popped in under
  // the reader's cursor — and one summary serves both the flag and the card, so
  // the hover is instant. Repeat polities come from the 30-day localStorage
  // cache without a request.
  //
  // The guard lives in a ref rather than the dependency array on purpose. With
  // `loading` as a dependency, setting it re-ran the effect, whose cleanup then
  // cancelled the very fetch it had just started — the card sat on "Looking it
  // up…" indefinitely and never issued a second request.
  useEffect(() => {
    if (requested.current === polity.wikipedia) return;
    requested.current = polity.wikipedia;
    let cancelled = false;
    setSummary(null);
    setLoading(true);
    getArticleSummary(polity.wikipedia)
      .then(result => { if (!cancelled) setSummary(result); })
      .finally(() => setLoading(false));
    return () => { cancelled = true; };
  }, [polity.wikipedia]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  // A short grace period, so crossing the gap between badge and card on the way
  // to the Wikipedia link does not dismiss the thing you are reaching for.
  const hide = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };

  const drawn = polity.emblem ? polityEmblem(polity.emblem.id) : null;

  // Three sources, cheapest first. A drawn emblem needs no network at all; a
  // Commons file named in the polity table needs no lookup, only the image; and
  // the article's lead image is the automatic fallback, kept only where its
  // filename says it is a flag and its years cover this persona. A Qing subject
  // in 1700 gets nothing rather than the 1889 dragon.
  const leadFlag = summary?.flagUrl
    && (summary.flagFrom === undefined || year >= summary.flagFrom)
    && (summary.flagUntil === undefined || year <= summary.flagUntil)
    ? summary.flagUrl
    : null;
  const flagUrl = polity.flagUrl ?? leadFlag;

  const emblem = drawn ?? (flagUrl
    ? <img src={flagUrl} alt="" loading="lazy" />
    : null);
  const heldFor = year - polity.since;

  return (
    <div
      className="polity-badge-wrap"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <button
        type="button"
        className={`polity-badge${emblem ? ' has-emblem' : ''}`}
        aria-expanded={open}
        aria-label={`${asLabel(polity.name)}. Show details.`}
        onClick={() => setOpen(value => !value)}
      >
        {emblem && <span className="polity-emblem">{emblem}</span>}
        <span className="polity-name">{asLabel(polity.name)}</span>
      </button>

      {open && (
        <div className="polity-card" role="tooltip">
          <div className="polity-card-head">
            {emblem && <span className="polity-card-emblem">{emblem}</span>}
            <div>
              <strong>{asLabel(polity.name)}</strong>
              <span className="polity-card-since">
                {heldFor >= 1
                  ? `Held here since ${describeYear(polity.since)} — ${heldFor} years by now`
                  : `Took the place in ${describeYear(polity.since)}`}
              </span>
            </div>
          </div>

          {polity.emblem ? (
            <p className="polity-card-emblem-note">
              The {EMBLEM_NOUN[polity.emblem.kind] ?? polity.emblem.kind}, attested from{' '}
              {describeYear(polity.emblem.from)}. Drawn from its description, not photographed.
            </p>
          ) : flagUrl ? (
            <p className="polity-card-emblem-note">
              Flag as given on Wikimedia
              {summary?.flagFrom !== undefined
                && `, in use ${describeYear(summary.flagFrom)}–${describeYear(summary.flagUntil ?? year)}`}.
            </p>
          ) : (
            <p className="polity-card-emblem-note muted">
              No flag is shown for {withPolityArticle(polity.name)} in this period.
            </p>
          )}

          {loading && <p className="polity-card-extract muted">Looking it up…</p>}
          {summary?.extract && <p className="polity-card-extract">{summary.extract}</p>}
          {summary && (
            <a
              className="polity-card-link"
              href={summary.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Read on Wikipedia
            </a>
          )}
          {!loading && !summary && (
            <p className="polity-card-extract muted">No article summary available.</p>
          )}
        </div>
      )}
    </div>
  );
};
