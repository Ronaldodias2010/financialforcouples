import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  type ReactNode,
} from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
  }
  return 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [forcedTheme, setForcedTheme] = useState<Theme | null>(null);

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return;

    const readForcedTheme = () => {
      const v = document.documentElement.dataset.forceTheme;
      setForcedTheme(v === 'dark' || v === 'light' ? v : null);
    };

    readForcedTheme();
    window.addEventListener('app:force-theme-change', readForcedTheme);
    return () => window.removeEventListener('app:force-theme-change', readForcedTheme);
  }, []);

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const themeToApply: Theme = forcedTheme ?? theme;

    root.classList.remove('light', 'dark');
    root.classList.add(themeToApply);

    // Do not overwrite the user's preference when a page is forcing a theme
    if (!forcedTheme && typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('theme', theme);
    }
  }, [theme, forcedTheme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
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
