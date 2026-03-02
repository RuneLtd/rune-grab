import { Header } from './components/layout/Header.js';
import { NavigationCard } from './components/sections/NavigationCard.js';
import { ButtonsCard } from './components/sections/ButtonsCard.js';
import { TargetsCard } from './components/sections/TargetsCard.js';
import { FormCard } from './components/sections/FormCard.js';
import { OptionsCard } from './components/sections/OptionsCard.js';
import { TableCard } from './components/sections/TableCard.js';
import { CodeCard } from './components/sections/CodeCard.js';
import { TextareaCard } from './components/sections/TextareaCard.js';
import { ImageCard } from './components/sections/ImageCard.js';
import { bg, font, fg, fgDim } from './components/theme.js';

export default function App() {
  return (
    <div style={{
      height: '100vh',
      background: bg,
      fontFamily: font,
      color: fg,
      padding: 20,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      overflow: 'hidden',
    }}>
      <div style={{ width: '100%', maxWidth: 900, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <Header />

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gridAutoRows: '1fr',
          gap: 10,
          flex: 1,
          minHeight: 0,
        }}>
          <NavigationCard />
          <ButtonsCard />
          <TargetsCard />
          <FormCard />
          <OptionsCard />
          <TableCard />
          <CodeCard />
          <TextareaCard />
          <ImageCard />
        </div>

        <p style={{ margin: '8px 0 0', fontSize: 9, color: fgDim, textAlign: 'center', flexShrink: 0 }}>
          Press Cmd+Shift+G or use the floating menu to grab elements.
        </p>
      </div>
    </div>
  );
}
