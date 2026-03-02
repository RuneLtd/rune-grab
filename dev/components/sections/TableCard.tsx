import React from 'react';
import { Card } from '../layout/Card.js';
import { Badge } from '../ui/Badge.js';
import { font, fg, fgDim, border } from '../theme.js';

const files = [
  { name: 'index.ts', size: '2.4 KB', status: 'Modified' },
  { name: 'state.ts', size: '1.1 KB', status: 'Clean' },
  { name: 'engine.ts', size: '3.8 KB', status: 'Modified' },
  { name: 'extract.ts', size: '4.2 KB', status: 'Clean' },
];

export function TableCard() {
  return (
    <Card title="Table">
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9, fontFamily: font }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${border}` }}>
            {['File', 'Size', 'Status'].map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '3px 5px', color: fgDim, fontWeight: 500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {files.map((r) => (
            <tr key={r.name} style={{ borderBottom: `1px solid ${border}` }}>
              <td style={{ padding: '3px 5px', color: fg }}>{r.name}</td>
              <td style={{ padding: '3px 5px', color: fgDim }}>{r.size}</td>
              <td style={{ padding: '3px 5px' }}>
                <Badge text={r.status} color={r.status === 'Modified' ? '#854d0e' : border} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
