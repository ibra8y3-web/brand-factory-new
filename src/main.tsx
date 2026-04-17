import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';
import { initErrorInterceptor } from './utils/errorStore';

// Initialize global error tracking for Auto-Healer
initErrorInterceptor();

const updateSW = registerSW({
  onNeedRefresh() {
    // Auto-update to avoid confirm dialog in iFrame
    updateSW(true);
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
