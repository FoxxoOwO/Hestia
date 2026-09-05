import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';
export type DesignStyle = 'classic' | 'nordic' | 'cyber' | 'glass' | 'sunset';

export interface DesignStyleOption {
  id: DesignStyle;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  badge: string;
  badgeEn: string;
  primaryColor: string;
  previewColors: string[];
}

export const DESIGN_STYLES: DesignStyleOption[] = [
  {
    id: 'classic',
    name: 'Klasický krb (Classic Hearth)',
    nameEn: 'Classic Hearth',
    description: 'Tradiční hřejivý oranžový styl Hestie s domáckou atmosférou',
    descriptionEn: 'Traditional warm orange Hestia style with cozy home atmosphere',
    badge: 'Výchozí',
    badgeEn: 'Default',
    primaryColor: '#f97316',
    previewColors: ['#f97316', '#ea580c', '#fdba74', '#fff7ed'],
  },
  {
    id: 'nordic',
    name: 'Severský les (Nordic Sage)',
    nameEn: 'Nordic Sage & Forest',
    description: 'Zklidňující skandinávská šalvějová a smaragdová zeleň pro harmonický domov',
    descriptionEn: 'Calming Scandinavian sage & emerald greenery for a serene home',
    badge: 'Přírodní',
    badgeEn: 'Organic',
    primaryColor: '#10b981',
    previewColors: ['#10b981', '#059669', '#6ee7b7', '#ecfdf5'],
  },
  {
    id: 'cyber',
    name: 'Midnight Cyber',
    nameEn: 'Midnight Cyber',
    description: 'Futuristický temný neon s elektrickou azurovou a pulzující fialovou',
    descriptionEn: 'Futuristic neon noir with electric cyan & glowing violet',
    badge: 'High-Tech',
    badgeEn: 'High-Tech',
    primaryColor: '#06b6d4',
    previewColors: ['#06b6d4', '#8b5cf6', '#22d3ee', '#0c101c'],
  },
  {
    id: 'glass',
    name: 'Mléčné sklo (Glassmorphism)',
    nameEn: 'Frosted Glassmorphism',
    description: 'Translucentní skleněné karty s hloubkou, jemným rozostřením a indigem',
    descriptionEn: 'Translucent frosted glass cards with depth, blur and sapphire indigo',
    badge: 'Moderní sklo',
    badgeEn: 'Modern Glass',
    primaryColor: '#6366f1',
    previewColors: ['#6366f1', '#3b82f6', '#a5b4fc', '#eef2ff'],
  },
  {
    id: 'sunset',
    name: 'Útulný západ slunce (Cozy Sunset)',
    nameEn: 'Cozy Sunset & Rose',
    description: 'Hřejivé pastelové odstíny terakoty, korálové růže a broskve',
    descriptionEn: 'Warm pastel terracotta, coral rose and cozy peach shades',
    badge: 'Útulný',
    badgeEn: 'Cozy',
    primaryColor: '#f43f5e',
    previewColors: ['#f43f5e', '#fb923c', '#fda4af', '#fff1f2'],
  },
];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  designStyle: DesignStyle;
  setDesignStyle: (style: DesignStyle) => void;
  designOptions: DesignStyleOption[];
  activeDesign: DesignStyleOption;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('hestia_theme') as Theme) || 'system';
  });

  const [designStyle, setDesignStyleState] = useState<DesignStyle>(() => {
    const saved = localStorage.getItem('hestia_design_style') as DesignStyle;
    if (DESIGN_STYLES.some((s) => s.id === saved)) return saved;
    return 'classic';
  });

  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      let activeIsDark = false;
      if (theme === 'system') {
        activeIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        activeIsDark = theme === 'dark';
      }

      setIsDark(activeIsDark);
      if (activeIsDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (theme === 'system') applyTheme();
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-design', designStyle);
    DESIGN_STYLES.forEach((s) => root.classList.remove(`design-${s.id}`));
    root.classList.add(`design-${designStyle}`);
  }, [designStyle]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('hestia_theme', newTheme);
  };

  const setDesignStyle = (newStyle: DesignStyle) => {
    setDesignStyleState(newStyle);
    localStorage.setItem('hestia_design_style', newStyle);
  };

  const activeDesign = DESIGN_STYLES.find((s) => s.id === designStyle) || DESIGN_STYLES[0];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        isDark,
        designStyle,
        setDesignStyle,
        designOptions: DESIGN_STYLES,
        activeDesign,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
