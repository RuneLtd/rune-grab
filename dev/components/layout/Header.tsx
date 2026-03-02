import React from 'react';
import { fgDim } from '../theme.js';

export function Header() {
  return (
    <div style={{ marginBottom: 12 }}>
      <h1 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>rune-grab</h1>
      <p style={{ margin: '2px 0 0', fontSize: 10, color: fgDim }}>
        Dev playground — try grabbing the elements below.
      </p>
    </div>
  );
}
