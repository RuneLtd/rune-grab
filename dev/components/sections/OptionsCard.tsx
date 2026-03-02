import React, { useState } from 'react';
import { Card } from '../layout/Card.js';
import { mono, bg, fg, fgDim, border, accent } from '../theme.js';

const checkboxes = [
  { id: 'stack', label: 'Component stack' },
  { id: 'screenshot', label: 'Screenshot' },
  { id: 'styles', label: 'Computed styles' },
  { id: 'clipboard', label: 'Auto-copy' },
];

export function OptionsCard() {
  const [selected, setSelected] = useState<string[]>(['stack', 'styles', 'clipboard']);

  return (
    <Card title="Options">
      {checkboxes.map((cb) => (
        <label
          key={cb.id}
          onClick={() => setSelected((s) => s.includes(cb.id) ? s.filter((x) => x !== cb.id) : [...s, cb.id])}
          style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 10, color: fg }}
        >
          <div style={{
            width: 12, height: 12, borderRadius: 3,
            border: `1px solid ${selected.includes(cb.id) ? accent : border}`,
            background: selected.includes(cb.id) ? accent : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 8, color: '#fff', flexShrink: 0,
          }}>
            {selected.includes(cb.id) && '✓'}
          </div>
          {cb.label}
        </label>
      ))}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <label style={{ fontSize: 9, color: fgDim }}>Shortcut</label>
        <input
          type="text"
          defaultValue="Meta+Shift+G"
          style={{
            padding: '4px 8px', borderRadius: 5,
            border: `1px solid ${border}`, background: bg,
            color: fg, fontSize: 10, fontFamily: mono,
            outline: 'none', width: '100%', boxSizing: 'border-box',
          }}
        />
      </div>
    </Card>
  );
}
