import { createRoot } from 'react-dom/client';
import { init } from '../src/index.js';
import App from './App.js';

init();

createRoot(document.getElementById('root')!).render(<App />);
