import React from 'react';
import { Card } from '../layout/Card.js';
import { bg, fg, border, accent } from '../theme.js';

const targets = ['Claude', 'Cursor', 'Codex', 'Claude Code'];

export function TargetsCard() {
  return (
    <Card title="Targets">
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {targets.map((t) => (
          <li
            key={t}
            style={{
              padding: '4px 8px', borderRadius: 5,
              background: bg, border: `1px solid ${border}`,
              fontSize: 10, color: fg,
            }}
          >
            {t}
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: 4, marginTop: 'auto' }}>
        <a href="#docs" onClick={(e) => e.preventDefault()} style={{ fontSize: 9, color: accent, textDecoration: 'none' }}>Docs</a>
        <a href="#repo" onClick={(e) => e.preventDefault()} style={{ fontSize: 9, color: accent, textDecoration: 'none' }}>GitHub</a>
        <a href="#issues" onClick={(e) => e.preventDefault()} style={{ fontSize: 9, color: accent, textDecoration: 'none' }}>Issues</a>
      </div>
    </Card>
  );
}
