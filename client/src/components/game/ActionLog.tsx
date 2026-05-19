import React, { useRef, useEffect } from 'react';
import { LastAction } from '../../types';

interface ActionLogProps {
  actions: (LastAction & { timestamp: number })[];
}

const actionLabel = (action: LastAction): string => {
  switch (action.type) {
    case 'play': return `${action.username} played a tile`;
    case 'draw': return `${action.username} drew a tile`;
    case 'pass': return `${action.username} passed`;
    default: return '';
  }
};

const actionIcon = (type: string): string => {
  switch (type) {
    case 'play': return '🁢';
    case 'draw': return '🎴';
    case 'pass': return '⏭';
    default: return '•';
  }
};

export default function ActionLog({ actions }: ActionLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [actions.length]);

  return (
    <div className="h-full flex flex-col">
      <div className="text-xs text-white/40 uppercase tracking-widest font-body mb-2 px-3 pt-3">
        Game Log
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
        {actions.length === 0 && (
          <p className="text-white/25 text-xs font-body italic">Game events will appear here...</p>
        )}
        {actions.map((action, i) => (
          <div
            key={i}
            className="text-xs font-body text-white/70 flex items-center gap-2 animate-fade-in"
          >
            <span className="text-sm">{actionIcon(action.type)}</span>
            <span>{actionLabel(action)}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
