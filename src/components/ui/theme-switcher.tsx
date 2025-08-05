import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useLanguage } from "@/hooks/useLanguage";
import { Moon, Sun } from "lucide-react";

export const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="gap-2 min-w-[80px]"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-4 w-4" />
          {t('theme.light')}
        </>
      ) : (
        <>
          <Moon className="h-4 w-4" />
          {t('theme.dark')}
        </>
      )}
    </Button>
  );
};