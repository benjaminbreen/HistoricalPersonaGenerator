/**
 * portraitLab/PortraitSwitch.tsx
 *
 * A drop-in replacement for `<ProceduralPortrait>` that renders whichever
 * engine is currently selected. Every call site in the app uses this, so the
 * Cmd+` toggle reaches all of them at once and neither renderer has to know the
 * other exists.
 */

import React from 'react';
import ProceduralPortrait from '../portraits/ProceduralPortrait';
import PixelPortrait from './PixelPortrait';
import { usePortraitEngine } from './usePortraitEngine';

export interface PortraitSwitchProps {
  character: any;
  size?: number;
  className?: string;
  temporaryExpression?: any;
  onExpressionComplete?: () => void;
  useEquippedItems?: boolean;
  animated?: boolean;
  /** Force one engine regardless of the global toggle — used by the lab. */
  engine?: 'classic' | 'lab';
}

const PortraitSwitch: React.FC<PortraitSwitchProps> = ({
  character,
  size = 192,
  className = '',
  temporaryExpression = null,
  onExpressionComplete,
  useEquippedItems = true,
  animated = true,
  engine,
}) => {
  const { engine: globalEngine } = usePortraitEngine();
  const active = engine ?? globalEngine;

  if (active === 'lab') {
    return (
      <PixelPortrait
        character={character}
        size={size}
        className={className}
        temporaryExpression={temporaryExpression}
        onExpressionComplete={onExpressionComplete}
        useEquippedItems={useEquippedItems}
        animated={animated}
      />
    );
  }

  return (
    <ProceduralPortrait
      character={character}
      size={size}
      className={className}
      temporaryExpression={temporaryExpression}
      onExpressionComplete={onExpressionComplete}
      useEquippedItems={useEquippedItems}
      animated={animated}
    />
  );
};

export default PortraitSwitch;
