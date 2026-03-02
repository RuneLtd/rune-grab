import React, { useState } from 'react';
import { fg, activeBg, activeFg, border, fgDim } from '../theme.js';

export function Toggle({ label, defaultOn = false }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div
      onClick={() => setOn(!on)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
    >
      <span style={{ fontSize: 10, color: fg }}>{label}</span>
      <div style={{
        width: 26, height: 14, borderRadius: 7,
        background: on ? activeBg : border,
        position: 'relative', flexShrink: 0,
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: 5,
          background: on ? activeFg : fgDim,
          position: 'absolute', top: 2,
          left: on ? 14 : 2,
          transition: 'left 0.15s',
        }} />
      </div>
    </div>
  );
}
