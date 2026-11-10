import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { AppProvider } from './lib/store';
import { SyncProvider } from './lib/sync';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <SyncProvider>
          <App />
        </SyncProvider>
      </AppProvider>
    </ErrorBoundary>
  </StrictMode>,
);
