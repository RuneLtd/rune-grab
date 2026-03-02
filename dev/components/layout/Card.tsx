import React from 'react';
import { card, border, fg } from '../theme.js';

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: card,
      border: `1px solid ${border}`,
      borderRadius: 10,
      padding: 14,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: fg }}>{title}</h3>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>{children}</div>
    </div>
  );
}
