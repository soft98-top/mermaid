/**
 * Theme types and interfaces for the application
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Background colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    canvas: string;
    editor: string;
  };
  
  // Text colors
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  
  // Border colors
  border: {
    primary: string;
    secondary: string;
    focus: string;
    error: string;
  };
  
  // Interactive colors
  interactive: {
    primary: string;
    primaryHover: string;
    secondary: string;
    secondaryHover: string;
    danger: string;
    dangerHover: string;
    success: string;
    warning: string;
  };
  
  // Status colors
  status: {
    error: string;
    warning: string;
    success: string;
    info: string;
  };
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
}

export interface ThemeState {
  currentTheme: ThemeMode;
  systemPreference: 'light' | 'dark';
  isSystemTheme: boolean;
}

export interface ThemeActions {
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  detectSystemTheme: () => void;
}