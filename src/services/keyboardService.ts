/**
 * Keyboard shortcuts service for managing application hotkeys
 */

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
  preventDefault?: boolean;
}

export interface KeyboardShortcutGroup {
  name: string;
  shortcuts: KeyboardShortcut[];
}

class KeyboardService {
  private static instance: KeyboardService;
  private shortcuts: Map<string, KeyboardShortcut> = new Map();
  private isEnabled = true;

  private constructor() {
    this.bindGlobalKeyListener();
  }

  public static getInstance(): KeyboardService {
    if (!KeyboardService.instance) {
      KeyboardService.instance = new KeyboardService();
    }
    return KeyboardService.instance;
  }

  /**
   * Register a keyboard shortcut
   */
  public registerShortcut(shortcut: KeyboardShortcut): void {
    const key = this.generateShortcutKey(shortcut);
    this.shortcuts.set(key, shortcut);
  }

  /**
   * Unregister a keyboard shortcut
   */
  public unregisterShortcut(shortcut: Partial<KeyboardShortcut>): void {
    const key = this.generateShortcutKey(shortcut);
    this.shortcuts.delete(key);
  }

  /**
   * Enable/disable keyboard shortcuts
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Get all registered shortcuts grouped by category
   */
  public getShortcutGroups(): KeyboardShortcutGroup[] {
    return [
      {
        name: '编辑器操作',
        shortcuts: [
          {
            key: 'z',
            ctrlKey: true,
            description: '撤销',
            action: () => {},
          },
          {
            key: 'y',
            ctrlKey: true,
            description: '重做',
            action: () => {},
          },
          {
            key: 's',
            ctrlKey: true,
            description: '保存代码',
            action: () => {},
          },
          {
            key: 'a',
            ctrlKey: true,
            description: '全选',
            action: () => {},
          },
        ],
      },
      {
        name: '界面控制',
        shortcuts: [
          {
            key: 'e',
            ctrlKey: true,
            description: '切换编辑器位置',
            action: () => {},
          },
          {
            key: 'h',
            ctrlKey: true,
            description: '隐藏/显示编辑器',
            action: () => {},
          },
          {
            key: 't',
            ctrlKey: true,
            description: '切换主题',
            action: () => {},
          },
          {
            key: 'k',
            ctrlKey: true,
            description: '显示快捷键帮助',
            action: () => {},
          },
        ],
      },
      {
        name: '画布操作',
        shortcuts: [
          {
            key: 'r',
            ctrlKey: true,
            description: '重置画布视图',
            action: () => {},
          },
          {
            key: '0',
            ctrlKey: true,
            description: '重置缩放',
            action: () => {},
          },
          {
            key: '=',
            ctrlKey: true,
            description: '放大',
            action: () => {},
          },
          {
            key: '-',
            ctrlKey: true,
            description: '缩小',
            action: () => {},
          },
        ],
      },
      {
        name: '导出功能',
        shortcuts: [
          {
            key: 'p',
            ctrlKey: true,
            shiftKey: true,
            description: '导出为PNG',
            action: () => {},
          },
          {
            key: 's',
            ctrlKey: true,
            shiftKey: true,
            description: '导出为SVG',
            action: () => {},
          },
          {
            key: 'd',
            ctrlKey: true,
            shiftKey: true,
            description: '导出为PDF',
            action: () => {},
          },
        ],
      },
      {
        name: '无障碍功能',
        shortcuts: [
          {
            key: 'Tab',
            description: '下一个可聚焦元素',
            action: () => {},
          },
          {
            key: 'Tab',
            shiftKey: true,
            description: '上一个可聚焦元素',
            action: () => {},
          },
          {
            key: 'Enter',
            description: '激活当前元素',
            action: () => {},
          },
          {
            key: 'Escape',
            description: '关闭弹窗/取消操作',
            action: () => {},
          },
        ],
      },
    ];
  }

  /**
   * Generate unique key for shortcut
   */
  private generateShortcutKey(shortcut: Partial<KeyboardShortcut>): string {
    const parts = [];
    if (shortcut.ctrlKey) parts.push('ctrl');
    if (shortcut.shiftKey) parts.push('shift');
    if (shortcut.altKey) parts.push('alt');
    if (shortcut.metaKey) parts.push('meta');
    parts.push(shortcut.key?.toLowerCase() || '');
    return parts.join('+');
  }

  /**
   * Check if event matches shortcut
   */
  private matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
    return (
      event.key.toLowerCase() === shortcut.key.toLowerCase() &&
      !!event.ctrlKey === !!shortcut.ctrlKey &&
      !!event.shiftKey === !!shortcut.shiftKey &&
      !!event.altKey === !!shortcut.altKey &&
      !!event.metaKey === !!shortcut.metaKey
    );
  }

  /**
   * Handle global keyboard events
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.isEnabled) return;

    // Skip if user is typing in an input field (except for specific shortcuts)
    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || 
                        target.tagName === 'TEXTAREA' || 
                        target.contentEditable === 'true' ||
                        target.closest('.monaco-editor');

    // Allow certain shortcuts even in input fields
    const allowInInputFields = ['Tab', 'Escape', 'F1'];
    if (isInputField && !allowInInputFields.includes(event.key)) {
      // Only allow Ctrl/Cmd shortcuts in input fields
      if (!event.ctrlKey && !event.metaKey) return;
    }

    // Find matching shortcut
    for (const [, shortcut] of this.shortcuts) {
      if (this.matchesShortcut(event, shortcut)) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.action();
        break;
      }
    }
  };

  /**
   * Bind global keyboard event listener
   */
  private bindGlobalKeyListener(): void {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Unbind global keyboard event listener
   */
  public destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  /**
   * Format shortcut for display
   */
  public formatShortcut(shortcut: KeyboardShortcut): string {
    const parts = [];
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    
    if (shortcut.ctrlKey) {
      parts.push(isMac ? '⌘' : 'Ctrl');
    }
    if (shortcut.shiftKey) {
      parts.push(isMac ? '⇧' : 'Shift');
    }
    if (shortcut.altKey) {
      parts.push(isMac ? '⌥' : 'Alt');
    }
    if (shortcut.metaKey) {
      parts.push(isMac ? '⌘' : 'Meta');
    }
    
    // Format key name
    let keyName = shortcut.key;
    const keyMap: Record<string, string> = {
      ' ': 'Space',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'Enter': '↵',
      'Tab': '⇥',
      'Escape': 'Esc',
      'Backspace': '⌫',
      'Delete': 'Del',
    };
    
    if (keyMap[keyName]) {
      keyName = keyMap[keyName];
    } else {
      keyName = keyName.charAt(0).toUpperCase() + keyName.slice(1);
    }
    
    parts.push(keyName);
    
    return parts.join(isMac ? '' : '+');
  }

  /**
   * Show keyboard shortcuts help
   */
  public showShortcutsHelp(): void {
    // This will be implemented in the UI component
    const event = new CustomEvent('show-shortcuts-help');
    document.dispatchEvent(event);
  }
}

export const keyboardService = KeyboardService.getInstance();