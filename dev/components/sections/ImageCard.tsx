import React from 'react';
import { Card } from '../layout/Card.js';
import { border, fgDim } from '../theme.js';

export function ImageCard() {
  return (
    <Card title="Image">
      <div style={{
        flex: 1, borderRadius: 6,
        background: `linear-gradient(135deg, ${border} 0%, #252525 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: fgDim, fontSize: 10,
      }}>
        Placeholder image
      </div>
    </Card>
  );
}
