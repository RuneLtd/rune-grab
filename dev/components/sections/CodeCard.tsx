import React from 'react';
import { Card } from '../layout/Card.js';
import { mono, bg, fgDim, border } from '../theme.js';

export function CodeCard() {
  return (
    <Card title="Code">
      <pre style={{
        margin: 0, padding: 8, borderRadius: 6,
        background: bg, border: `1px solid ${border}`,
        color: fgDim, fontSize: 9, fontFamily: mono,
        lineHeight: 1.5, overflow: 'hidden', flex: 1,
      }}>
{`import { init } from 'rune-grab'

init({
  target: 'claude',
  shortcut: 'Meta+Shift+G',
  onGrab: (result) => {
    console.log(result.text)
  },
})`}
      </pre>
    </Card>
  );
}
