import React, { useState } from 'react';
import { Card } from '../layout/Card.js';
import { Badge } from '../ui/Badge.js';
import { font, activeBg, activeFg, fgDim, accent } from '../theme.js';

export function NavigationCard() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const tabs = ['Dashboard', 'Settings', 'Help'];

  return (
    <Card title="Navigation">
      <nav style={{ display: 'flex', gap: 3 }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '4px 10px', borderRadius: 6, border: 'none',
              fontSize: 10, fontFamily: font, cursor: 'pointer',
              background: activeTab === tab ? activeBg : 'transparent',
              color: activeTab === tab ? activeFg : fgDim,
              fontWeight: activeTab === tab ? 600 : 400,
            }}
          >
            {tab}
          </button>
        ))}
      </nav>
      <p style={{ margin: 0, fontSize: 9, color: fgDim }}>
        {activeTab === 'Dashboard' && 'Overview of your recent grabs and activity.'}
        {activeTab === 'Settings' && 'Configure shortcuts, targets, and preferences.'}
        {activeTab === 'Help' && 'Learn how to use rune-grab in your project.'}
      </p>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 'auto' }}>
        <Badge text="v0.1.0" />
        <Badge text="React" color={accent} />
        <Badge text="TypeScript" color="#1e40af" />
      </div>
    </Card>
  );
}
