import { Injectable, signal, effect, inject } from '@angular/core';
import { InterviewService } from './interview.service';

export interface Theme {
  name: string;
  palette: string[];
  properties: { [key: string]: string };
}

const THEMES: Theme[] = [
  {
    name: 'VertexMind Dark',
    palette: ['#010A1A', '#111c33', '#22D3EE', '#818CF8', '#FFFFFF'],
    properties: {
      '--color-bg': '#010A1A',
      '--color-surface': 'rgba(17, 28, 51, 0.5)',
      '--color-primary-accent': '#22D3EE',
      '--color-secondary-accent': '#818CF8',
      '--color-text-primary': '#FFFFFF',
      '--color-text-secondary': 'rgba(224, 231, 255, 0.8)',
      '--color-text-muted': 'rgba(199, 210, 254, 0.7)',
      '--color-border': 'rgba(6, 182, 212, 0.3)',
      '--color-input-bg': 'rgba(14, 27, 51, 0.5)',
      '--color-input-border': '#3730a3',
      '--mode': 'dark'
    }
  },
  {
    name: 'VertexMind Light',
    palette: ['#F9FAFB', '#FFFFFF', '#3B82F6', '#6366F1', '#111827'],
    properties: {
      '--color-bg': '#F9FAFB',
      '--color-surface': '#FFFFFF',
      '--color-primary-accent': '#3B82F6',
      '--color-secondary-accent': '#6366F1',
      '--color-text-primary': '#111827',
      '--color-text-secondary': '#4B5563',
      '--color-text-muted': '#6B7280',
      '--color-border': '#E5E7EB',
      '--color-input-bg': '#F3F4F6',
      '--color-input-border': '#D1D5DB',
      '--mode': 'light'
    }
  },
  {
    name: 'Corporate Cobalt',
    palette: ['#EAEFF2', '#FFFFFF', '#334E68', '#0057FF', '#102A43'],
    properties: {
        '--color-bg': '#EAEFF2',
        '--color-surface': '#FFFFFF',
        '--color-primary-accent': '#0057FF',
        '--color-secondary-accent': '#334E68',
        '--color-text-primary': '#102A43',
        '--color-text-secondary': '#334E68',
        '--color-text-muted': '#486581',
        '--color-border': '#BCCCDC',
        '--color-input-bg': '#DDE4E8',
        '--color-input-border': '#BCCCDC',
        '--mode': 'light'
    }
  },
  {
    name: 'Forest Reserve',
    palette: ['#F0F4F8', '#FFFFFF', '#5D7A68', '#2F4F4F', '#0D1B1E'],
    properties: {
        '--color-bg': '#F0F4F8',
        '--color-surface': '#FFFFFF',
        '--color-primary-accent': '#5D7A68',
        '--color-secondary-accent': '#2F4F4F',
        '--color-text-primary': '#0D1B1E',
        '--color-text-secondary': '#2F4F4F',
        '--color-text-muted': '#5D7A68',
        '--color-border': '#D0D8D4',
        '--color-input-bg': '#E5E9E7',
        '--color-input-border': '#D0D8D4',
        '--mode': 'light'
    }
  },
  {
    name: 'Cyberpunk Neon',
    palette: ['#0d0221', '#261447', '#ff3864', '#00f6ff', '#f5f5f5'],
    properties: {
      '--color-bg': '#0d0221',
      '--color-surface': 'rgba(38, 20, 71, 0.5)',
      '--color-primary-accent': '#00f6ff',
      '--color-secondary-accent': '#ff3864',
      '--color-text-primary': '#f5f5f5',
      '--color-text-secondary': 'rgba(245, 245, 245, 0.8)',
      '--color-text-muted': 'rgba(200, 180, 255, 0.7)',
      '--color-border': 'rgba(0, 246, 255, 0.3)',
      '--color-input-bg': 'rgba(20, 10, 40, 0.5)',
      '--color-input-border': '#ff3864',
      '--mode': 'dark'
    }
  },
  {
    name: 'Sunset Glow',
    palette: ['#fff8f0', '#ffffff', '#ff8c42', '#ff4d4d', '#402a2a'],
    properties: {
      '--color-bg': '#fff8f0',
      '--color-surface': 'rgba(255, 255, 255, 0.7)',
      '--color-primary-accent': '#ff8c42',
      '--color-secondary-accent': '#ff4d4d',
      '--color-text-primary': '#402a2a',
      '--color-text-secondary': '#664242',
      '--color-text-muted': '#8c5a5a',
      '--color-border': 'rgba(255, 140, 66, 0.4)',
      '--color-input-bg': 'rgba(255, 230, 210, 0.5)',
      '--color-input-border': '#ffb380',
      '--mode': 'light'
    }
  }
];

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private isBrowser = false;

  themes: Theme[] = THEMES;
  
  activeThemeName = signal<string>(THEMES[0].name);
  customColors = signal({ primary: THEMES[0].properties['--color-primary-accent'], secondary: THEMES[0].properties['--color-secondary-accent'] });
  mode = signal<'light' | 'dark'>('dark');

  constructor() {
    this.isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
    if (this.isBrowser) {
      try {
        this.loadInitialTheme();
      } catch (e) {
        console.error('Failed to load initial theme from localStorage. Applying default.', e);
        this.setTheme(THEMES[0].name); // Fallback to a safe default
      }
    }

    // Effect to manage light/dark mode class
    effect(() => {
      if (this.isBrowser) {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(this.mode());
      }
    });
  }

  private loadInitialTheme(): void {
    const savedThemeName = localStorage.getItem('themeName') || THEMES[0].name;
    const savedMode = localStorage.getItem('themeMode') as 'light' | 'dark' || 'dark';
    const savedPrimary = localStorage.getItem('customPrimary');
    const savedSecondary = localStorage.getItem('customSecondary');

    this.mode.set(savedMode);
    this.setTheme(savedThemeName);

    if (savedPrimary && savedSecondary) {
        this.customColors.set({ primary: savedPrimary, secondary: savedSecondary });
        this.applyCustomColors(savedPrimary, savedSecondary);
    }
  }

  private applyThemeProperties(theme: Theme): void {
    if (!this.isBrowser) return;

    Object.keys(theme.properties).forEach(key => {
        if (key !== '--mode') {
            document.documentElement.style.setProperty(key, theme.properties[key]);
        }
    });
    this.mode.set(theme.properties['--mode'] as 'light' | 'dark');
    this.customColors.set({ primary: theme.properties['--color-primary-accent'], secondary: theme.properties['--color-secondary-accent'] });
  }

  private applyCustomColors(primary: string, secondary: string): void {
     if (!this.isBrowser) return;
     document.documentElement.style.setProperty('--color-primary-accent', primary);
     document.documentElement.style.setProperty('--color-secondary-accent', secondary);
  }

  setTheme(themeName: string): void {
    const theme = this.themes.find(t => t.name === themeName);
    if (theme) {
      this.activeThemeName.set(themeName);
      this.applyThemeProperties(theme);
      if (this.isBrowser) {
        try {
          localStorage.setItem('themeName', themeName);
          localStorage.setItem('themeMode', this.mode());
          localStorage.removeItem('customPrimary');
          localStorage.removeItem('customSecondary');
        } catch (e) {
          console.error('Failed to save theme to localStorage.', e);
        }
      }
    }
  }

  setCustomColor(type: 'primary' | 'secondary', color: string): void {
    const newColors = { ...this.customColors() };
    if (type === 'primary') newColors.primary = color;
    if (type === 'secondary') newColors.secondary = color;
    
    this.customColors.set(newColors);
    this.applyCustomColors(newColors.primary, newColors.secondary);
    this.activeThemeName.set('Custom');

    if (this.isBrowser) {
      try {
        localStorage.setItem('themeName', 'Custom');
        localStorage.setItem('customPrimary', newColors.primary);
        localStorage.setItem('customSecondary', newColors.secondary);
      } catch (e) {
        console.error('Failed to save custom colors to localStorage.', e);
      }
    }
  }

  toggleMode(): void {
    const currentMode = this.mode();
    if (currentMode === 'dark') {
      // Switch to the default light theme
      const lightTheme = this.themes.find(t => t.name === 'VertexMind Light');
      if (lightTheme) {
        this.setTheme(lightTheme.name);
      }
    } else {
      // Switch to the default dark theme
      const darkTheme = this.themes.find(t => t.name === 'VertexMind Dark');
      if (darkTheme) {
        this.setTheme(darkTheme.name);
      }
    }
  }

  resetToDefault(): void {
    this.setTheme(THEMES[0].name);
  }
}
