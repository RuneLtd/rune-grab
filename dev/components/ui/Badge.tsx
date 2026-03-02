import React from 'react';
import { border, fg } from '../theme.js';

export function Badge({ text, color = border }: { text: string; color?: string }) {
  return (
    <span style={{
      padding: '2px 7px',
      borderRadius: 8,
      background: color,
      color: fg,
      fontSize: 9,
      fontWeight: 500,
    }}>
      {text}
    </span>
  );
}
