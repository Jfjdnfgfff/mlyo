import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard against third-party Chrome extension script injection errors
window.addEventListener('error', (event) => {
  if (
    event.filename &&
    (event.filename.startsWith('chrome-extension://') || event.message?.includes('fetch'))
  ) {
    event.preventDefault();
    console.warn('Handled external extension script notice:', event.message);
  }
});

createRoot(document.getElementById('root')!).render(<App />);
