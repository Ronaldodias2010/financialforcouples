import React from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  console.log('🎨 SimpleThemeProvider: Initializing');
  
  // Use a simple approach without useState initially
  const [theme, setThemeState] = React.useState<Theme>('light');
  
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : newTheme
    );
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  React.useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme;
    if (saved && (saved === 'dark' || saved === 'light' || saved === 'system')) {
      setTheme(saved);
    } else {
      setTheme('light');
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};