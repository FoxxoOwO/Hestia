import React, { createContext, useContext, useEffect, useState } from 'react';
import '@m3e/web/theme';

export type Theme = 'light' | 'dark' | 'system';
export type DesignStyle = 'classic' | 'm3e' | 'neobrutalism' | 'terminal' | 'editorial' | 'nordic' | 'cyber' | 'glass' | 'sunset';

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
  fontCategory?: string;
  fontCategoryEn?: string;
  shapeStyle?: string;
  shapeStyleEn?: string;
  layoutStyle?: string;
  layoutStyleEn?: string;
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
    fontCategory: 'Inter / System Sans',
    fontCategoryEn: 'Inter / System Sans',
    shapeStyle: 'Měkké zaoblené rohy (rounded-2xl)',
    shapeStyleEn: 'Soft rounded corners',
    layoutStyle: 'Standardní přehledný dashboard',
    layoutStyleEn: 'Standard clean dashboard',
  },
  {
    id: 'm3e',
    name: 'Material 3 Expressive (M3E)',
    nameEn: 'Material 3 Expressive (M3E)',
    description: 'Expresivní design podle Google Material Design 3 s tónovými vrstvami a zaoblenými tvary (matraic/m3e)',
    descriptionEn: 'Modern expressive design following Google Material Design 3 with tonal surfaces and fluid rounded shapes (matraic/m3e)',
    badge: 'M3E / Material 3',
    badgeEn: 'M3E / Material 3',
    primaryColor: '#6750a4',
    previewColors: ['#6750a4', '#7f67be', '#d0bcff', '#eaddff'],
    fontCategory: 'Roboto / M3 Sans',
    fontCategoryEn: 'Roboto / M3 Sans',
    shapeStyle: 'M3 tónové vrstvy & 28px zaoblení',
    shapeStyleEn: 'M3 tonal surfaces & 28px radius',
    layoutStyle: 'M3 pilulková navigace & pružinový pohyb',
    layoutStyleEn: 'M3 pill navigation & spring motion',
  },
  {
    id: 'neobrutalism',
    name: 'Neo-Brutalist Pop (Neo-Brutalism)',
    nameEn: 'Neo-Brutalist Pop',
    description: 'Úderný pop-art s tlustými černými rámečky, 3D hmatovými tlačítky, ostrými stíny a fontem Space Grotesk',
    descriptionEn: 'Bold pop-art with thick black borders, 3D tactile buttons, hard offset shadows and Space Grotesk typography',
    badge: '3D Pop-Art',
    badgeEn: '3D Pop-Art',
    primaryColor: '#FFE600',
    previewColors: ['#FFE600', '#FF5C5C', '#52D172', '#000000'],
    fontCategory: 'Space Grotesk (Bold Sans)',
    fontCategoryEn: 'Space Grotesk (Bold Sans)',
    shapeStyle: 'Ostré 3D rámečky (2.5px černé) & tvrdý stín',
    shapeStyleEn: 'Sharp 3D frames (2.5px black) & offset shadow',
    layoutStyle: 'Sticker nálepky, hmatová tlačítka & pop-art grid',
    layoutStyleEn: 'Stickers, tactile 3D buttons & pop-art grid',
  },
  {
    id: 'terminal',
    name: 'Retro Terminal CRT (ASCII Console)',
    nameEn: 'Retro Terminal CRT',
    description: 'Kyberpunková zelená konzole s monospace fontem, scanlines efektem, hranatými rámy a terminálovým layoutem',
    descriptionEn: 'Cyberpunk green CRT console with monospaced typography, scanlines, blocky geometry and dense CLI layout',
    badge: 'Hacker CLI',
    badgeEn: 'Hacker CLI',
    primaryColor: '#22c55e',
    previewColors: ['#22c55e', '#15803d', '#4ade80', '#050805'],
    fontCategory: 'JetBrains Mono (Monospace)',
    fontCategoryEn: 'JetBrains Mono (Monospace)',
    shapeStyle: 'Přísně hranaté (0px radius) & zelený drátěný rám',
    shapeStyleEn: 'Strictly rectangular (0px radius) & green wireframe',
    layoutStyle: 'Kompaktní CRT konzole, scanlines & CLI navigace',
    layoutStyleEn: 'Dense CRT console, scanlines & CLI navigation',
  },
  {
    id: 'editorial',
    name: 'Editorial Gazette (Knižní & Magazínový)',
    nameEn: 'Editorial Gazette',
    description: 'Vznešená novinová a knižní typografie s patkovým fontem Playfair, pergamenovým papírem a dvojitými linkami',
    descriptionEn: 'Refined newspaper & book typography with Playfair serif, warm parchment paper and classical double rules',
    badge: 'Knižní tisk',
    badgeEn: 'Editorial Serif',
    primaryColor: '#881337',
    previewColors: ['#881337', '#b45309', '#fcf8f2', '#1c1917'],
    fontCategory: 'Playfair Display (Serif)',
    fontCategoryEn: 'Playfair Display (Serif)',
    shapeStyle: 'Jemné knižní linie & dvojité linky záhlaví',
    shapeStyleEn: 'Fine bookbind lines & double-ruled mastheads',
    layoutStyle: 'Magazínový sloupcový layout & pergamenový papír',
    layoutStyleEn: 'Editorial magazine columns & warm parchment',
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
    fontCategory: 'Skandinávský čistý sans',
    fontCategoryEn: 'Nordic Clean Sans',
    shapeStyle: 'Přírodní organické křivky',
    shapeStyleEn: 'Organic natural curves',
    layoutStyle: 'Vzdušný minimalistický prostor',
    layoutStyleEn: 'Airy minimalist spacing',
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
    fontCategory: 'Futuristický high-tech sans',
    fontCategoryEn: 'Futuristic High-Tech Sans',
    shapeStyle: 'Neonové zářící linky (Cyan & Glow)',
    shapeStyleEn: 'Neon glowing outlines (Cyan & Glow)',
    layoutStyle: 'Dark cyber noir konzole',
    layoutStyleEn: 'Dark cyber noir console',
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
    fontCategory: 'Moderní čistý sans',
    fontCategoryEn: 'Modern Clean Sans',
    shapeStyle: 'Translucentní mléčné sklo (Backdrop-Blur)',
    shapeStyleEn: 'Translucent frosted glass (Backdrop-Blur)',
    layoutStyle: 'Hloubkový vrstvený prostor',
    layoutStyleEn: 'Layered depth space',
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
    fontCategory: 'Hřejivý humanistický sans',
    fontCategoryEn: 'Warm Humanist Sans',
    shapeStyle: 'Měkké terakotové kontury',
    shapeStyleEn: 'Soft terracotta contours',
    layoutStyle: 'Útulná rodinná atmosféra',
    layoutStyleEn: 'Cozy domestic atmosphere',
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

  useEffect(() => {
    let el = document.querySelector('m3e-theme') as HTMLElement | null;
    if (designStyle === 'm3e') {
      if (!el) {
        el = document.createElement('m3e-theme');
        document.body.appendChild(el);
      }
      el.setAttribute('color', '#6750A4');
      el.setAttribute('variant', 'expressive');
      el.setAttribute('motion', 'expressive');
      el.setAttribute('scheme', isDark ? 'dark' : 'light');
    } else if (el) {
      el.remove();
    }
  }, [designStyle, isDark]);

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
