import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './components/ThemeProvider'

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('SW registered: ', registration);
        }
      })
      .catch((registrationError) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('SW registration failed: ', registrationError);
        }
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system" storageKey="inventory-theme">
      <App />
    </ThemeProvider>
  </StrictMode>
);
