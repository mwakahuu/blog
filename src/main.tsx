import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (import.meta.env.DEV) {
  const reportDocumentExit = (event: Event) => {
    console.warn(`[navigation-debug] ${event.type}: document is leaving the current page.`);
  };
  window.addEventListener('beforeunload', reportDocumentExit);
  window.addEventListener('pagehide', reportDocumentExit);
}

createRoot(document.getElementById('root')!).render(<App />);
