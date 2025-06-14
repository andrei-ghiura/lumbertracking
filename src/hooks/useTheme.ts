import { useState, useEffect, useCallback } from 'react';
import { PaletteMode } from '@mui/material';

export const useAppTheme = (): [PaletteMode, () => void] => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('themeMode') as PaletteMode | null;
      if (savedTheme) {
        return savedTheme;
      }
      // Also apply initial class to HTML element for Ionic/Tailwind
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
      return prefersDark ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (mode === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('themeMode', mode);
    }
  }, [mode]);

  const toggleTheme = useCallback(() => {
    setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  }, []);

  return [mode, toggleTheme];
};