import React from 'react';
import { Card } from '../layout/Card.js';
import { font, bg, fg, fgDim, activeBg, activeFg, border } from '../theme.js';

export function TextareaCard() {
  return (
    <Card title="Textarea">
      <textarea
        placeholder="Add context to your next grab..."
        style={{
          flex: 1, padding: 8, borderRadius: 6,
          border: `1px solid ${border}`, background: bg,
          color: fg, fontSize: 10, fontFamily: font,
          outline: 'none', resize: 'none', minHeight: 0,
        }}
      />
      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
        <button style={{
          padding: '4px 10px', borderRadius: 6,
          border: `1px solid ${border}`, background: 'transparent',
          color: fgDim, fontSize: 10, fontFamily: font, cursor: 'pointer',
        }}>
          Clear
        </button>
        <button style={{
          padding: '4px 10px', borderRadius: 6, border: 'none',
          background: activeBg, color: activeFg,
          fontSize: 10, fontWeight: 600, fontFamily: font, cursor: 'pointer',
        }}>
          Send
        </button>
      </div>
    </Card>
  );
}
