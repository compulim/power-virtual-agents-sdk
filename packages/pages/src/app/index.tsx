import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './ui/App';

declare global {
  const IS_DEVELOPMENT: boolean | undefined;
}

const rootElement = document.getElementById('root');

rootElement &&
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );

if (typeof IS_DEVELOPMENT === 'boolean' && IS_DEVELOPMENT) {
  new EventSource('/esbuild').addEventListener('change', () => window.location.reload());
}
