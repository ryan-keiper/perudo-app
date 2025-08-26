import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from './button';
import { useTheme } from '@/hooks/useTheme';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

export function ThemeToggle() {
  const { theme, effectiveTheme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          {effectiveTheme === 'dark' ? (
            <Moon className="size-4" />
          ) : (
            <Sun className="size-4" />
          )}
          <span className="hidden sm:inline">Theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="gap-2"
        >
          <Sun className="size-4" />
          Light
          {theme === 'light' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="gap-2"
        >
          <Moon className="size-4" />
          Dark
          {theme === 'dark' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="gap-2"
        >
          <Monitor className="size-4" />
          System
          {theme === 'system' && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Inline theme toggle for use in other menus
export function ThemeToggleInline() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getIcon = () => {
    if (theme === 'light') return <Sun className="size-4" />;
    if (theme === 'dark') return <Moon className="size-4" />;
    return <Monitor className="size-4" />;
  };

  const getLabel = () => {
    if (theme === 'light') return 'Light Mode';
    if (theme === 'dark') return 'Dark Mode';
    return 'System Theme';
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
      className="w-full justify-start gap-2"
    >
      {getIcon()}
      {getLabel()}
    </Button>
  );
}