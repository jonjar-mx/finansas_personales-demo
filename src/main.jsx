import { StrictMode } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import theme from './theme';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('No se pudo registrar el service worker', error);
    });
  });
}
