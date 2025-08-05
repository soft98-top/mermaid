import type { Theme, ThemeColors, ThemeMode } from '../types/theme';

/**
 * Theme service for managing application themes
 */
class ThemeService {
  private static instance: ThemeService;
  private mediaQuery: MediaQueryList;
  private listeners: Set<(theme: ThemeMode) => void> = new Set();

  private constructor() {
    // Handle test environment where window.matchMedia might not be available
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', this.handleSystemThemeChange.bind(this));
    } else {
      // Mock for test environment
      this.mediaQuery = {
        matches: false,
        media: '',
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      } as MediaQueryList;
    }
  }

  public static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }

  /**
   * Get light theme colors
   */
  private getLightTheme(): ThemeColors {
    return {
      background: {
        primary: '#ffffff',
        secondary: '#f8fafc',
        tertiary: '#f1f5f9',
        canvas: '#ffffff',
        editor: '#ffffff',
      },
      text: {
        primary: '#1e293b',
        secondary: '#475569',
        muted: '#64748b',
        inverse: '#ffffff',
      },
      border: {
        primary: '#e2e8f0',
        secondary: '#cbd5e1',
        focus: '#3b82f6',
        error: '#ef4444',
      },
      interactive: {
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        secondary: '#6b7280',
        secondaryHover: '#4b5563',
        danger: '#ef4444',
        dangerHover: '#dc2626',
        success: '#10b981',
        warning: '#f59e0b',
      },
      status: {
        error: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
        info: '#3b82f6',
      },
    };
  }

  /**
   * Get dark theme colors
   */
  private getDarkTheme(): ThemeColors {
    return {
      background: {
        primary: '#0f172a',
        secondary: '#1e293b',
        tertiary: '#334155',
        canvas: '#1e293b',
        editor: '#0f172a',
      },
      text: {
        primary: '#f8fafc',
        secondary: '#cbd5e1',
        muted: '#94a3b8',
        inverse: '#1e293b',
      },
      border: {
        primary: '#334155',
        secondary: '#475569',
        focus: '#60a5fa',
        error: '#f87171',
      },
      interactive: {
        primary: '#60a5fa',
        primaryHover: '#3b82f6',
        secondary: '#94a3b8',
        secondaryHover: '#cbd5e1',
        danger: '#f87171',
        dangerHover: '#ef4444',
        success: '#34d399',
        warning: '#fbbf24',
      },
      status: {
        error: '#f87171',
        warning: '#fbbf24',
        success: '#34d399',
        info: '#60a5fa',
      },
    };
  }

  /**
   * Get theme object for given mode
   */
  public getTheme(mode: ThemeMode): Theme {
    const actualMode = mode === 'system' ? this.getSystemTheme() : mode;
    const colors = actualMode === 'dark' ? this.getDarkTheme() : this.getLightTheme();

    return {
      mode: actualMode,
      colors,
      shadows: {
        sm: actualMode === 'dark' 
          ? '0 1px 2px 0 rgba(0, 0, 0, 0.3)' 
          : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: actualMode === 'dark' 
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)' 
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: actualMode === 'dark' 
          ? '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)' 
          : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: actualMode === 'dark' 
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' 
          : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      transitions: {
        fast: 'all 0.15s ease-in-out',
        normal: 'all 0.3s ease-in-out',
        slow: 'all 0.5s ease-in-out',
      },
    };
  }

  /**
   * Get system theme preference
   */
  public getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return 'light'; // Default for test environment
    }
    return this.mediaQuery.matches ? 'dark' : 'light';
  }

  /**
   * Apply theme to document
   */
  public applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') {
      return; // Skip in test environment
    }
    
    const root = document.documentElement;
    
    // Apply CSS custom properties
    Object.entries(theme.colors.background).forEach(([key, value]) => {
      root.style.setProperty(`--color-bg-${key}`, value);
    });
    
    Object.entries(theme.colors.text).forEach(([key, value]) => {
      root.style.setProperty(`--color-text-${key}`, value);
    });
    
    Object.entries(theme.colors.border).forEach(([key, value]) => {
      root.style.setProperty(`--color-border-${key}`, value);
    });
    
    Object.entries(theme.colors.interactive).forEach(([key, value]) => {
      root.style.setProperty(`--color-interactive-${key}`, value);
    });
    
    Object.entries(theme.colors.status).forEach(([key, value]) => {
      root.style.setProperty(`--color-status-${key}`, value);
    });
    
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });
    
    Object.entries(theme.transitions).forEach(([key, value]) => {
      root.style.setProperty(`--transition-${key}`, value);
    });

    // Set data attribute for theme-specific styling
    root.setAttribute('data-theme', theme.mode);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.colors.background.primary);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = theme.colors.background.primary;
      document.head.appendChild(meta);
    }
  }

  /**
   * Save theme preference to localStorage
   */
  public saveThemePreference(mode: ThemeMode): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('mermaid-renderer-theme', mode);
    }
  }

  /**
   * Load theme preference from localStorage
   */
  public loadThemePreference(): ThemeMode {
    if (typeof localStorage === 'undefined') {
      return 'system'; // Default for test environment
    }
    
    const saved = localStorage.getItem('mermaid-renderer-theme') as ThemeMode;
    return saved && ['light', 'dark', 'system'].includes(saved) ? saved : 'system';
  }

  /**
   * Handle system theme change
   */
  private handleSystemThemeChange(): void {
    this.listeners.forEach(listener => listener('system'));
  }

  /**
   * Add theme change listener
   */
  public addThemeChangeListener(listener: (theme: ThemeMode) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove theme change listener
   */
  public removeThemeChangeListener(listener: (theme: ThemeMode) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Get theme icon for UI
   */
  public getThemeIcon(mode: ThemeMode): string {
    switch (mode) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'system': return '💻';
      default: return '💻';
    }
  }

  /**
   * Get theme label for UI
   */
  public getThemeLabel(mode: ThemeMode): string {
    switch (mode) {
      case 'light': return '浅色主题';
      case 'dark': return '深色主题';
      case 'system': return '跟随系统';
      default: return '跟随系统';
    }
  }
}

export const themeService = ThemeService.getInstance();