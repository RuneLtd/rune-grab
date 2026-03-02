import React from 'react';
import { Card } from '../layout/Card.js';
import { font, bg, fg, fgDim, border } from '../theme.js';

const targets = ['Claude', 'Cursor', 'Codex', 'Claude Code'];

export function FormCard() {
  return (
    <Card title="Form">
      {[
        { label: 'Name', placeholder: 'Enter your name...' },
        { label: 'Email', placeholder: 'you@example.com' },
      ].map((f) => (
        <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <label style={{ fontSize: 9, color: fgDim }}>{f.label}</label>
          <input
            type="text"
            placeholder={f.placeholder}
            style={{
              padding: '4px 8px', borderRadius: 5,
              border: `1px solid ${border}`, background: bg,
              color: fg, fontSize: 10, fontFamily: font,
              outline: 'none', width: '100%', boxSizing: 'border-box',
            }}
          />
        </div>
      ))}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <label style={{ fontSize: 9, color: fgDim }}>Target</label>
        <select style={{
          padding: '4px 8px', borderRadius: 5,
          border: `1px solid ${border}`, background: bg,
          color: fg, fontSize: 10, fontFamily: font, outline: 'none',
        }}>
          {targets.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
    </Card>
  );
}
