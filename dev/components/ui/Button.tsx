import React from 'react';
import { font } from '../theme.js';

interface ButtonProps {
  label: string;
  bg: string;
  color: string;
  border?: string;
  onClick?: () => void;
}

export function Button({ label, bg, color, border = 'none', onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        borderRadius: 6,
        fontSize: 10,
        fontWeight: 500,
        fontFamily: font,
        cursor: 'pointer',
        background: bg,
        color,
        border,
      }}
    >
      {label}
    </button>
  );
}
