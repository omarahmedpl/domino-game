import React from 'react';

interface DominoPipProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
}

// Each entry: array of [cx%, cy%] positions as fractions of the SVG viewBox
const PIP_POSITIONS: Record<number, [number, number][]> = {
  0: [],
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 20], [75, 20], [25, 50], [75, 50], [25, 80], [75, 80]],
};

export default function DominoPip({ value, size = 'md' }: DominoPipProps) {
  if (value === -1) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(120,113,108,0.4)' }} />
      </div>
    );
  }

  const positions = PIP_POSITIONS[value] ?? [];
  const pipR = size === 'sm' ? 8 : size === 'lg' ? 11 : 9;

  return (
    <svg
      viewBox="0 0 100 100"
      style={{ width: '100%', height: '100%', display: 'block' }}
      aria-label={`${value} pips`}
    >
      {positions.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={pipR} fill="#1c1917" />
      ))}
    </svg>
  );
}
