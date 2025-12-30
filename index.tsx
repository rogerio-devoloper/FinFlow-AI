import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Registro robusto do Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Usando ./sw.js para garantir que ele procure na mesma pasta do index
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(registration => {
        console.log('FinFlow PWA: Ativo no escopo:', registration.scope);
      })
      .catch(err => {
        console.error('FinFlow PWA: Erro no registro:', err);
      });
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);