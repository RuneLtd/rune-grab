import React from 'react';
import { Card } from '../layout/Card.js';
import { Button } from '../ui/Button.js';
import { Toggle } from '../ui/Toggle.js';
import { card, fg, activeBg, activeFg, accent, border } from '../theme.js';

export function ButtonsCard() {
  return (
    <Card title="Buttons">
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <Button label="Default" bg={card} color={fg} border={`1px solid ${border}`} />
        <Button label="Primary" bg={activeBg} color={activeFg} />
        <Button label="Accent" bg={accent} color="#fff" />
        <Button label="Danger" bg="#dc2626" color="#fff" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 'auto' }}>
        <Toggle label="Auto-paste" defaultOn />
        <Toggle label="Screenshots" />
        <Toggle label="Overlay" defaultOn />
      </div>
    </Card>
  );
}
