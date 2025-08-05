import React, { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from './stores/useAppStore';
import { CodeEditor } from './components/CodeEditor';
import { DiagramCanvas } from './components/DiagramCanvas';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ExportButton } from './components/ExportButton';
import { PerformanceMonitor } from './components/PerformanceMonitor';
import { ThemeToggle } from './components/ThemeToggle';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import { themeService } from './services/themeService';
import { keyboardService } from './services/keyboardService';
import { accessibilityManager } from './utils/accessibility';
import type { EditorPosition } from './types/state';


/**
 * Position toggle button component
 */
interface PositionToggleButtonProps {
  currentPosition: EditorPosition;
  onToggle: (position: EditorPosition) => void;
}

const PositionToggleButton: React.FC<PositionToggleButtonProps> = ({ 
  currentPosition, 
  onToggle 
}) => {
  const handleToggle = () => {
    if (currentPosition === 'right') {
      onToggle('left');
    } else if (currentPosition === 'left') {
      onToggle('hidden');
    } else {
      onToggle('right');
    }
  };

  const getButtonText = () => {
    switch (currentPosition) {
      case 'right': return '← 左侧';
      case 'left': return '✕ 隐藏';
      case 'hidden': return '→ 右侧';
      default: return '→ 右侧';
    }
  };

  const getButtonIcon = () => {
    switch (currentPosition) {
      case 'right': return '⬅️';
      case 'left': return '❌';
      case 'hidden': return '➡️';
      default: return '➡️';
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
      title={`切换编辑器位置: ${getButtonText()}`}
    >
      <span className="text-base">{getButtonIcon()}</span>
      <span>{getButtonText()}</span>
    </button>
  );
};

/**
 * Error display component with enhanced information
 */
interface ErrorDisplayProps {
  error: string | null;
  onDismiss: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-5 mb-6 shadow-lg backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-red-800 font-bold text-base mb-2">🚨 实时预览错误</div>
            <div className="text-red-700 text-sm leading-relaxed mb-3 font-medium">{error}</div>
            <div className="text-red-600 text-xs bg-red-100 px-3 py-2 rounded-lg border border-red-200">
              💡 提示：错误会在您修复代码后自动消失
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 ml-4 p-2 rounded-full hover:bg-red-100 transition-all duration-200 transform hover:scale-110"
          title="关闭错误提示"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

/**
 * Main App component with three-column layout and editor position switching
 */
function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const {
    editor,
    canvas,
    ui,
    isLoading,
    setEditorPosition,
    updateCode,
    setRenderError,
    setLoading,
    setTheme,
    toggleTheme,
    setShowKeyboardHelp,
    setShowPerformanceMonitor,
    setAccessibilityMode,
  } = useAppStore();

  // Initialize theme and accessibility on mount
  useEffect(() => {
    // Apply initial theme
    const theme = themeService.getTheme(ui.theme);
    themeService.applyTheme(theme);
    
    // Load user preferences from localStorage
    const savedPosition = localStorage.getItem('mermaid-renderer-editor-position') as EditorPosition;
    if (savedPosition && ['left', 'right', 'hidden'].includes(savedPosition)) {
      setEditorPosition(savedPosition);
    }
    
    // Initialize accessibility features
    accessibilityManager.announce('Mermaid渲染器已加载完成');
    
    // Check for accessibility preferences
    if (accessibilityManager.prefersReducedMotion()) {
      setAccessibilityMode(true);
    }
    
    // Apply basic Monaco fix
    const observer = new MutationObserver(() => {
      document.querySelectorAll('.monaco-editor').forEach(editor => {
        const editorElement = editor as HTMLElement;
        editorElement.style.height = '100%';
        editorElement.style.maxHeight = '100%';
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, [setEditorPosition, ui.theme, setAccessibilityMode]);

  // Save user preferences to localStorage when position changes
  useEffect(() => {
    localStorage.setItem('mermaid-renderer-editor-position', editor.position);
  }, [editor.position]);

  // Setup keyboard shortcuts
  useEffect(() => {
    // Register keyboard shortcuts
    keyboardService.registerShortcut({
      key: 'e',
      ctrlKey: true,
      description: '切换编辑器位置',
      action: () => {
        const positions: EditorPosition[] = ['right', 'left', 'hidden'];
        const currentIndex = positions.indexOf(editor.position);
        const nextIndex = (currentIndex + 1) % positions.length;
        setEditorPosition(positions[nextIndex]);
        accessibilityManager.announce(`编辑器位置已切换到${positions[nextIndex] === 'left' ? '左侧' : positions[nextIndex] === 'right' ? '右侧' : '隐藏'}`);
      },
    });

    keyboardService.registerShortcut({
      key: 't',
      ctrlKey: true,
      description: '切换主题',
      action: () => {
        toggleTheme();
      },
    });

    keyboardService.registerShortcut({
      key: 'k',
      ctrlKey: true,
      description: '显示快捷键帮助',
      action: () => {
        setShowKeyboardHelp(true);
      },
    });

    keyboardService.registerShortcut({
      key: 'r',
      ctrlKey: true,
      description: '重置画布视图',
      action: () => {
        // This will be handled by the canvas component
        const event = new CustomEvent('reset-canvas');
        document.dispatchEvent(event);
      },
    });

    keyboardService.registerShortcut({
      key: 'Escape',
      description: '关闭弹窗',
      action: () => {
        if (ui.showKeyboardHelp) {
          setShowKeyboardHelp(false);
        }
      },
    });

    // Listen for custom events
    const handleShowShortcuts = () => setShowKeyboardHelp(true);
    document.addEventListener('show-shortcuts-help', handleShowShortcuts);

    return () => {
      document.removeEventListener('show-shortcuts-help', handleShowShortcuts);
    };
  }, [editor.position, setEditorPosition, toggleTheme, setShowKeyboardHelp, ui.showKeyboardHelp]);

  // Handle editor position toggle
  const handlePositionToggle = useCallback((position: EditorPosition) => {
    setEditorPosition(position);
  }, [setEditorPosition]);

  // Handle code changes from editor
  const handleCodeChange = useCallback((code: string) => {
    updateCode(code);
  }, [updateCode]);

  // Handle editor errors
  const handleEditorError = useCallback((error: string | null) => {
    setRenderError(error);
  }, [setRenderError]);

  // Handle diagram render completion
  const handleRenderComplete = useCallback(() => {
    setLoading(false);
    setRenderError(null);
  }, [setLoading, setRenderError]);

  // Handle diagram render errors
  const handleRenderError = useCallback((error: string) => {
    setLoading(false);
    setRenderError(error);
  }, [setLoading, setRenderError]);

  // Handle error dismissal
  const handleErrorDismiss = useCallback(() => {
    setRenderError(null);
  }, [setRenderError]);

  // Calculate layout classes based on editor position
  const getLayoutClasses = () => {
    switch (editor.position) {
      case 'left':
        return {
          container: 'grid grid-cols-12 gap-4',
          editor: 'col-span-4',
          canvas: 'col-span-8',
        };
      case 'right':
        return {
          container: 'grid grid-cols-12 gap-4',
          editor: 'col-span-4 order-2',
          canvas: 'col-span-8 order-1',
        };
      case 'hidden':
        return {
          container: 'grid grid-cols-1',
          editor: 'hidden',
          canvas: 'col-span-1',
        };
      default:
        return {
          container: 'grid grid-cols-12 gap-4',
          editor: 'col-span-4 order-2',
          canvas: 'col-span-8 order-1',
        };
    }
  };

  const layoutClasses = getLayoutClasses();

  return (
    <div className="min-h-screen bg-theme-secondary transition-colors duration-300">
      {/* Header */}
      <header className="bg-theme-primary/80 backdrop-blur-md shadow-theme-lg border-b border-theme-primary" role="banner">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-theme-primary">
                    Mermaid Renderer
                  </h1>
                  <div className="text-sm text-theme-secondary font-medium">
                    🚀 支持嵌套图表的智能渲染器
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800" role="status" aria-live="polite">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" aria-hidden="true"></div>
                  <span className="text-sm font-medium">渲染中...</span>
                </div>
              )}
              
              {/* Export button */}
              <ExportButton targetElementRef={canvasRef} />
              
              {/* Theme toggle */}
              <ThemeToggle
                currentTheme={ui.theme}
                onThemeChange={setTheme}
              />
              
              {/* Position toggle button */}
              <PositionToggleButton
                currentPosition={editor.position}
                onToggle={handlePositionToggle}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-1 p-6" role="main" id="main-content">
        {/* Error display */}
        <ErrorDisplay 
          error={canvas.renderError} 
          onDismiss={handleErrorDismiss} 
        />

        {/* Three-column layout */}
        <div 
          className={`${layoutClasses.container} h-[calc(100vh-10rem)] layout-transition layout-container md:grid mobile-stack gap-6`}
        >
          {/* Code Editor */}
          {editor.position !== 'hidden' && (
            <div 
              className={`${layoutClasses.editor} editor-transition`}
            >
              <div className="bg-theme-primary/90 backdrop-blur-sm rounded-2xl shadow-theme-xl border border-theme-primary h-full flex flex-col min-h-0 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-theme-primary bg-theme-secondary rounded-t-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-bold text-theme-primary">
                      代码编辑器
                    </h2>
                  </div>
                  <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                    {editor.position === 'left' ? '📍 左侧' : '📍 右侧'}
                  </div>
                </div>
                <div className="flex-1 overflow-hidden min-h-0 relative">
                  <CodeEditor
                    code={editor.code}
                    onChange={handleCodeChange}
                    onError={handleEditorError}
                    position={editor.position}
                    className="h-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Diagram Canvas */}
          <div 
            className={`${layoutClasses.canvas} canvas-transition`}
          >
            <div className="bg-theme-primary/90 backdrop-blur-sm rounded-2xl shadow-theme-xl border border-theme-primary h-full flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-theme-primary bg-theme-secondary rounded-t-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-theme-primary">
                    图表画布
                  </h2>
                </div>
                <div className="flex items-center space-x-3 text-xs text-theme-secondary no-export" role="status" aria-live="polite">
                  {editor.position === 'hidden' && (
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full font-semibold">🖥️ 全屏模式</span>
                  )}
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full font-semibold" aria-label={`缩放级别 ${Math.round(canvas.zoomLevel * 100)}%`}>🔍 {Math.round(canvas.zoomLevel * 100)}%</span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full font-semibold" aria-label={`画布位置 x: ${Math.round(canvas.panOffset.x)}, y: ${Math.round(canvas.panOffset.y)}`}>📍 ({Math.round(canvas.panOffset.x)}, {Math.round(canvas.panOffset.y)})</span>
                </div>
              </div>
              <div className="flex-1 overflow-hidden bg-theme-canvas" ref={canvasRef}>
                <ErrorBoundary>
                  <DiagramCanvas
                    code={editor.code}
                    onRenderComplete={handleRenderComplete}
                    onRenderError={handleRenderError}
                    className="h-full"
                  />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Performance Monitor */}
      <PerformanceMonitor
        isVisible={ui.showPerformanceMonitor}
        onToggle={() => setShowPerformanceMonitor(!ui.showPerformanceMonitor)}
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        isVisible={ui.showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />

      {/* Footer */}
      <footer className="bg-theme-primary/80 backdrop-blur-md border-t border-theme-primary px-6 py-3" role="contentinfo">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-theme-secondary">
            <span className="font-semibold">✨ Mermaid Renderer v1.0</span>
            <span className="text-theme-muted">|</span>
            <span>🎯 支持所有Mermaid图表类型及嵌套功能</span>
          </div>
          <div className="flex items-center space-x-4 text-theme-muted">
            <span className="px-2 py-1 bg-theme-secondary rounded-full text-xs font-medium">
              📍 编辑器: {
                editor.position === 'left' ? '左侧' : 
                editor.position === 'right' ? '右侧' : '隐藏'
              }
            </span>
            <span className="px-2 py-1 bg-theme-secondary rounded-full text-xs font-medium">
              📝 {editor.code.split('\n').length} 行代码
            </span>
            <span className="px-2 py-1 bg-theme-secondary rounded-full text-xs font-medium">
              🎨 {ui.theme === 'system' ? '跟随系统' : ui.theme === 'dark' ? '深色' : '浅色'}主题
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
