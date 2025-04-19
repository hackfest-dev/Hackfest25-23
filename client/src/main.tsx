
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure theme is applied before rendering to avoid flash of wrong theme
const setInitialTheme = () => {
  // Check if theme exists in localStorage
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) {
    // Apply stored theme
    document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    return;
  }
  
  // If no stored preference, use system preference
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.classList.toggle('dark', isDark);
  // Store the initial theme preference
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

// Set theme before rendering to avoid flash of incorrect theme
setInitialTheme();

// Render the app
createRoot(document.getElementById("root")!).render(<App />);
