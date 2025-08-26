import { createContext } from 'react';

type Theme = 'light' | 'dark' | 'system';
type EffectiveTheme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  effectiveTheme: EffectiveTheme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);