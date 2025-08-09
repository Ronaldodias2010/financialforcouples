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
      className="gap-2 min-w-[100px]"
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4" />
          {t('theme.light') || 'Claro'}
        </>
      ) : (
        <>
          <Moon className="h-4 w-4" />
          {t('theme.dark') || 'Escuro'}
        </>
      )}
    </Button>
  );
};