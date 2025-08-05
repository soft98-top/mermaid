import React, { useState, useRef, useEffect } from 'react';
import { themeService } from '../services/themeService';
import { accessibilityManager } from '../utils/accessibility';
import type { ThemeMode } from '../types/theme';

interface ThemeToggleProps {
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  className?: string;
}

/**
 * Theme toggle component with dropdown menu
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  currentTheme,
  onThemeChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const themes: ThemeMode[] = ['light', 'dark', 'system'];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          const firstOption = dropdownRef.current?.querySelector('button');
          firstOption?.focus();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          const options = dropdownRef.current?.querySelectorAll('button');
          const lastOption = options?.[options.length - 1] as HTMLButtonElement;
          lastOption?.focus();
        }
        break;
    }
  };

  const handleOptionKeyDown = (event: React.KeyboardEvent, theme: ThemeMode, index: number) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (index + 1) % themes.length;
        const nextOption = dropdownRef.current?.querySelectorAll('button')[nextIndex] as HTMLButtonElement;
        nextOption?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = index === 0 ? themes.length - 1 : index - 1;
        const prevOption = dropdownRef.current?.querySelectorAll('button')[prevIndex] as HTMLButtonElement;
        prevOption?.focus();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleThemeSelect(theme);
        break;
      case 'Escape':
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
    }
  };

  const handleThemeSelect = (theme: ThemeMode) => {
    onThemeChange(theme);
    setIsOpen(false);
    buttonRef.current?.focus();
    
    // Announce theme change
    accessibilityManager.announce(`主题已切换为${themeService.getThemeLabel(theme)}`);
  };

  const getCurrentThemeIcon = () => {
    return themeService.getThemeIcon(currentTheme);
  };

  const getCurrentThemeLabel = () => {
    return themeService.getThemeLabel(currentTheme);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="flex items-center justify-center w-10 h-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={`当前主题: ${getCurrentThemeLabel()}, 点击切换主题`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title={`切换主题 - ${getCurrentThemeLabel()}`}
      >
        <span className="text-lg" aria-hidden="true">
          {getCurrentThemeIcon()}
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl z-50 py-2 backdrop-blur-sm"
          role="menu"
          aria-label="主题选择菜单"
        >
          {themes.map((theme, index) => (
            <button
              key={theme}
              onClick={() => handleThemeSelect(theme)}
              onKeyDown={(e) => handleOptionKeyDown(e, theme, index)}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700 ${
                currentTheme === theme 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' 
                  : 'text-gray-700 dark:text-gray-200'
              }`}
              role="menuitem"
              aria-current={currentTheme === theme ? 'true' : 'false'}
            >
              <span className="text-lg" aria-hidden="true">
                {themeService.getThemeIcon(theme)}
              </span>
              <div className="flex-1">
                <div className="font-medium">
                  {themeService.getThemeLabel(theme)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {theme === 'light' && '明亮的界面主题'}
                  {theme === 'dark' && '深色的界面主题'}
                  {theme === 'system' && '跟随系统设置'}
                </div>
              </div>
              {currentTheme === theme && (
                <svg
                  className="w-4 h-4 text-blue-600 dark:text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};