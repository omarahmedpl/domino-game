import React from 'react';
import { motion } from 'framer-motion';
import { DominoTile as DominoTileType } from '../../types';
import DominoPip from './DominoPip';
import clsx from 'clsx';

interface DominoTileProps {
  tile: DominoTileType;
  orientation?: 'horizontal' | 'vertical';
  isPlayable?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

export default function DominoTile({
  tile,
  orientation = 'horizontal',
  isPlayable = false,
  isSelected = false,
  onClick,
  size = 'md',
  animate = false,
  className,
}: DominoTileProps) {
  const isHidden = tile.left === -1;

  const sizeMap = {
    sm: { w: 48, h: 24, half: 22, pip: 'sm' as const },
    md: { w: 72, h: 36, half: 34, pip: 'md' as const },
    lg: { w: 96, h: 48, half: 46, pip: 'lg' as const },
  };

  const s = sizeMap[size];
  const isHoriz = orientation === 'horizontal';

  const tileClasses = clsx(
    'domino-tile',
    isPlayable && 'domino-tile-playable',
    isSelected && 'domino-tile-selected',
    className
  );

  const style: React.CSSProperties = isHoriz
    ? { width: s.w, height: s.h, minWidth: s.w }
    : { width: s.h, height: s.w, minWidth: s.h };

  const dividerStyle: React.CSSProperties = isHoriz
    ? { width: 1, height: '80%', background: '#c9b99a', alignSelf: 'center' }
    : { height: 1, width: '80%', background: '#c9b99a', alignSelf: 'center' };

  const halfSize = s.half;

  const content = (
    <div
      className={tileClasses}
      style={style}
      onClick={isPlayable ? onClick : undefined}
      role={isPlayable ? 'button' : undefined}
      tabIndex={isPlayable ? 0 : undefined}
      onKeyDown={isPlayable && onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div
        className={clsx('flex h-full w-full', isHoriz ? 'flex-row items-center' : 'flex-col items-center')}
      >
        <div style={{ width: isHoriz ? halfSize : '100%', height: isHoriz ? '100%' : halfSize }}>
          {!isHidden ? (
            <DominoPip value={tile.left} size={s.pip} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-3 h-3 rounded-sm bg-stone-300/60" />
            </div>
          )}
        </div>
        <div style={dividerStyle} />
        <div style={{ width: isHoriz ? halfSize : '100%', height: isHoriz ? '100%' : halfSize }}>
          {!isHidden ? (
            <DominoPip value={tile.right} size={s.pip} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-3 h-3 rounded-sm bg-stone-300/60" />
            </div>
          )}
        </div>
      </div>

      {/* Gold highlight for playable tiles */}
      {isPlayable && !isSelected && (
        <div className="absolute inset-0 rounded-md ring-1 ring-yellow-400/30 pointer-events-none" />
      )}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}
