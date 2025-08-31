import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Prevent mouse wheel from changing number input values
document.addEventListener('wheel', (event) => {
  const target = event.target;
  if (target.type === 'number') {
    target.blur();
  }
}, { capture: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);