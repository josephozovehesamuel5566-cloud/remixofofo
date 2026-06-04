'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  isLight: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark'); // Default to dark desk as pre-configured
  const [mounted, setMounted] = useState(false);

  // Safely retrieve the saved preference after client-side hydration
  useEffect(() => {
    const savedTheme = localStorage.getItem('ofofo_theme') as Theme | null;
    let initialTheme: Theme = 'dark';
    if (savedTheme) {
      initialTheme = savedTheme;
    } else if (typeof window !== 'undefined') {
      // Check system preference if no manual choice is found
      const systemPreference = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      initialTheme = systemPreference;
    }
    
    // Defer standard state updates to avoid synchronous cascading renders on mounting
    Promise.resolve().then(() => {
      setTheme(initialTheme);
      setMounted(true);
    });
  }, []);

  // Synchronize CSS class modifiers when theme state alters
  useEffect(() => {
    if (!mounted) return;
    
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.add('light-mode');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      root.classList.remove('light-mode');
    }
    
    localStorage.setItem('ofofo_theme', theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };

  // Prevent flash or hydration mismatch by rendering a clean shell until client mount is complete
  return (
    <ThemeContext.Provider value={value}>
      <div className={`transition-colors duration-300 min-h-full ${theme === 'light' ? 'light-mode' : ''}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
