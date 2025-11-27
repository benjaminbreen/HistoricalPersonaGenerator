import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Hide loading screen once React mounts
const hideLoadingScreen = () => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
    // Remove from DOM after fade out animation completes
    setTimeout(() => {
      loadingScreen.remove();
    }, 400);
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Hide loading screen after a brief delay to ensure React has rendered
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    hideLoadingScreen();
  });
});
