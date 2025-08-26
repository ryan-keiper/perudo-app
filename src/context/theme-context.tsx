import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from './auth-hooks';
import { updateUserProfile } from '@/lib/firebase-user';
import { ThemeContext } from './ThemeContext';

type Theme = 'light' | 'dark' | 'system';
type EffectiveTheme = 'light' | 'dark';

// Get the effective theme based on user preference and system settings
const getEffectiveTheme = (theme: Theme): EffectiveTheme => {
  if (theme !== 'system') return theme;
  
  // Check system preference
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  return 'light';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, user } = useAuth();
  
  // Initialize theme from profile or localStorage or default to system
  const [theme, setThemeState] = useState<Theme>(() => {
    // First check profile
    if (profile?.preferences?.theme) {
      return profile.preferences.theme;
    }
    // Then check localStorage
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
    // Default to system
    return 'system';
  });
  
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(
    getEffectiveTheme(theme)
  );
  
  // Apply theme to document
  useEffect(() => {
    const effective = getEffectiveTheme(theme);
    setEffectiveTheme(effective);
    
    // Apply or remove dark class
    if (effective === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const effective = e.matches ? 'dark' : 'light';
      setEffectiveTheme(effective);
      
      if (effective === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme]);
  
  // Sync theme from profile when it changes
  useEffect(() => {
    if (profile?.preferences?.theme && profile.preferences.theme !== theme) {
      setThemeState(profile.preferences.theme);
    }
  }, [profile?.preferences?.theme]);
  
  // Function to update theme
  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Save to localStorage immediately
    localStorage.setItem('theme', newTheme);
    
    // Save to Firebase if user is logged in
    if (user && profile) {
      try {
        await updateUserProfile(user.uid, {
          preferences: {
            ...profile.preferences,
            theme: newTheme
          }
        });
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    }
  }, [user, profile]);
  
  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Re-export for backwards compatibility/caching issues
export { useTheme } from '@/hooks/useTheme';

