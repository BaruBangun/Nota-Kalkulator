import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from '@/App';
import '@/index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element tidak ditemukan');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerSW({ immediate: true });
