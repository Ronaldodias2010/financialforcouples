import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useLanguage } from "@/hooks/useLanguage";
import { Moon, Sun } from "lucide-react";

export const ThemeSwitcher = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { t } = useLanguage();

  const isDark = (resolvedTheme ?? theme) === 'dark';

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="gap-2 sm:min-w-[100px]"
      title={isDark ? (t('theme.light') || 'Claro') : (t('theme.dark') || 'Escuro')}
    >
      {isDark ? (
        <>
          <Sun className="h-6 w-6" />
          <span className="hidden sm:inline">{t('theme.light') || 'Claro'}</span>
        </>
      ) : (
        <>
          <Moon className="h-6 w-6" />
          <span className="hidden sm:inline">{t('theme.dark') || 'Escuro'}</span>
        </>
      )}
    </Button>
  );
};