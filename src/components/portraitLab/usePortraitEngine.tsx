/**
 * portraitLab/usePortraitEngine.tsx
 *
 * The A/B switch. Cmd+` (Ctrl+` on Windows and Linux) flips every portrait on
 * the page between the original SVG renderer and the pixel lab, so the two can
 * be compared on the *same* persona rather than on two random ones — which is
 * the only comparison that tells you anything.
 *
 * The choice persists in localStorage so a reload keeps whichever engine you
 * were judging.
 */

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';

export type PortraitEngine = 'classic' | 'lab';

const STORAGE_KEY = 'portraitEngine';

interface PortraitEngineValue {
  engine: PortraitEngine;
  setEngine: (engine: PortraitEngine) => void;
  toggle: () => void;
  /** True for a moment after a toggle, so the UI can confirm what happened. */
  justToggled: boolean;
}

const PortraitEngineContext = createContext<PortraitEngineValue>({
  engine: 'classic',
  setEngine: () => {},
  toggle: () => {},
  justToggled: false,
});

function readInitialEngine(): PortraitEngine {
  if (typeof window === 'undefined') return 'classic';
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('portraitEngine');
  if (requested === 'lab' || requested === 'classic') return requested;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'lab' || stored === 'classic') return stored;
  } catch {
    // Private browsing, or storage disabled. The default is fine.
  }
  return 'classic';
}

export const PortraitEngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [engine, setEngineState] = useState<PortraitEngine>(readInitialEngine);
  const [justToggled, setJustToggled] = useState(false);

  const setEngine = useCallback((next: PortraitEngine) => {
    setEngineState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Non-fatal.
    }
  }, []);

  const toggle = useCallback(() => {
    setEngineState(current => {
      const next = current === 'lab' ? 'classic' : 'lab';
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Non-fatal.
      }
      return next;
    });
    setJustToggled(true);
  }, []);

  useEffect(() => {
    if (!justToggled) return undefined;
    const timer = window.setTimeout(() => setJustToggled(false), 1400);
    return () => window.clearTimeout(timer);
  }, [justToggled, engine]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Backquote, with either accelerator so the same muscle memory works on
      // any machine. `code` rather than `key` because the modifier changes what
      // `key` reports on some layouts.
      if (event.code !== 'Backquote') return;
      if (!event.metaKey && !event.ctrlKey) return;
      event.preventDefault();
      toggle();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  const value = useMemo(
    () => ({ engine, setEngine, toggle, justToggled }),
    [engine, setEngine, toggle, justToggled]
  );

  return (
    <PortraitEngineContext.Provider value={value}>
      {children}
      {justToggled && <EngineToast engine={engine} />}
    </PortraitEngineContext.Provider>
  );
};

const EngineToast: React.FC<{ engine: PortraitEngine }> = ({ engine }) => (
  <div
    role="status"
    aria-live="polite"
    style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      padding: '8px 18px',
      borderRadius: 999,
      background: engine === 'lab' ? '#1f2a33' : '#2b2622',
      color: '#f3ece1',
      font: '600 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace',
      letterSpacing: '0.09em',
      textTransform: 'uppercase',
      boxShadow: '0 6px 24px rgba(0,0,0,0.34)',
      pointerEvents: 'none',
    }}
  >
    {engine === 'lab' ? 'Pixel lab portraits' : 'Classic portraits'}
  </div>
);

export function usePortraitEngine(): PortraitEngineValue {
  return useContext(PortraitEngineContext);
}
