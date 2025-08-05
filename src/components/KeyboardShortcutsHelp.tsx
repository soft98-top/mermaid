import React, { useState, useEffect, useRef } from 'react';
import { keyboardService } from '../services/keyboardService';
import { accessibilityManager } from '../utils/accessibility';
import type { KeyboardShortcutGroup } from '../services/keyboardService';

interface KeyboardShortcutsHelpProps {
  isVisible: boolean;
  onClose: () => void;
}

/**
 * Keyboard shortcuts help modal
 */
export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isVisible,
  onClose,
}) => {
  const [shortcutGroups, setShortcutGroups] = useState<KeyboardShortcutGroup[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isVisible) {
      setShortcutGroups(keyboardService.getShortcutGroups());
      
      // Focus management
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);

      // Trap focus within modal
      const cleanup = modalRef.current ? 
        accessibilityManager.trapFocus(modalRef.current) : 
        () => {};

      // Announce modal opening
      accessibilityManager.announce('快捷键帮助对话框已打开');

      return cleanup;
    }
  }, [isVisible]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, onClose]);

  const handleClose = () => {
    accessibilityManager.announce('快捷键帮助对话框已关闭');
    onClose();
    accessibilityManager.returnFocus();
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      aria-describedby="shortcuts-description"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div>
            <h2 
              id="shortcuts-title"
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              ⌨️ 键盘快捷键
            </h2>
            <p 
              id="shortcuts-description"
              className="text-gray-600 dark:text-gray-300 mt-1"
            >
              使用这些快捷键提高工作效率
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="关闭快捷键帮助"
            title="关闭 (Esc)"
          >
            <svg
              className="w-6 h-6 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {shortcutGroups.map((group, groupIndex) => (
              <div key={group.name} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  {group.name}
                </h3>
                <div className="space-y-3">
                  {group.shortcuts.map((shortcut, shortcutIndex) => (
                    <div
                      key={`${groupIndex}-${shortcutIndex}`}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <span className="text-gray-700 dark:text-gray-300 text-sm">
                        {shortcut.description}
                      </span>
                      <kbd className="inline-flex items-center px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-sm font-mono text-gray-800 dark:text-gray-200 shadow-sm">
                        {keyboardService.formatShortcut(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Additional tips */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 使用提示
            </h4>
            <ul className="text-blue-800 dark:text-blue-200 text-sm space-y-2">
              <li>• 在代码编辑器中，大部分快捷键都可以正常使用</li>
              <li>• 使用 Tab 键在界面元素间导航</li>
              <li>• 按 Escape 键可以关闭弹窗或取消当前操作</li>
              <li>• 在画布上使用鼠标滚轮可以缩放图表</li>
              <li>• 拖拽画布可以平移视图</li>
            </ul>
          </div>

          {/* Accessibility note */}
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <h4 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
              ♿ 无障碍功能
            </h4>
            <ul className="text-green-800 dark:text-green-200 text-sm space-y-2">
              <li>• 支持屏幕阅读器，会自动朗读重要状态变化</li>
              <li>• 所有功能都可以通过键盘操作</li>
              <li>• 支持高对比度模式和减少动画偏好</li>
              <li>• 提供跳转链接快速导航到主要内容</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            按 <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs">Esc</kbd> 关闭此对话框
          </div>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};