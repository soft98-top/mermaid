import React, { useRef, useEffect, useCallback, useState } from 'react';
import Editor, { type OnMount, type OnChange } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import type { CodeEditorProps } from '../types/components';
import type { DiagramError } from '../types/error';
import { errorHandlingService } from '../services/errorHandlingService';
import { autoCompletionService } from '../services/autoCompletionService';
import { syntaxValidationService } from '../services/syntaxValidationService';
import { lazyLoadingService } from '../services/lazyLoadingService';
import { EditorScrollFix } from '../utils/editorFix';
import { MonacoAlignmentFix } from '../utils/monacoAlignmentFix';
import { debugMonacoStructure } from '../utils/monacoDebug';
import { useRenderCache } from '../hooks/usePerformanceMonitor';

/**
 * CodeEditor component with Monaco editor integration
 * Supports Mermaid syntax highlighting, debounced changes, real-time error detection, and undo/redo
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  onError,
  position: _position,
  className = ''
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentError, setCurrentError] = useState<DiagramError | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isLargeFile, setIsLargeFile] = useState(false);
  
  // Performance optimization hooks
  const { isLargeDiagram } = useRenderCache();

  // Debounced onChange handler with fixed delay
  const debouncedOnChange = useCallback(
    lazyLoadingService.debounce((code: string) => {
      onChange(code);
    }, isLargeFile ? 1000 : 500),
    [onChange, isLargeFile]
  );
  
  /**
   * Clear error markers from the editor
   */
  const clearErrorMarkers = useCallback(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    monacoRef.current.editor.setModelMarkers(model, 'mermaid-validator', []);
  }, []);

  // Enhanced debounced validation with performance optimization
  const debouncedValidation = useCallback(
    lazyLoadingService.debounce(async (codeToValidate: string) => {
      if (!codeToValidate.trim()) {
        setCurrentError(null);
        onError(null);
        clearErrorMarkers();
        return;
      }

      // Skip validation for very large files to improve performance
      if (isLargeDiagram(codeToValidate)) {
        setCurrentError(null);
        onError(null);
        clearErrorMarkers();
        return;
      }

      setIsValidating(true);
      
      try {
        // Skip all validation, only show errors when actual rendering fails
        setCurrentError(null);
        onError(null);
        clearErrorMarkers();
      } catch (error) {
        console.error('Validation error:', error);
        // Skip validation errors, only show rendering errors
      } finally {
        setIsValidating(false);
      }
    }, isLargeFile ? 1000 : 300),
    [isLargeFile, isLargeDiagram, onError, clearErrorMarkers]
  );

  /**
   * Configure Monaco editor for Mermaid syntax highlighting and enhanced auto-completion
   */
  const configureMonacoForMermaid = useCallback((monaco: typeof import('monaco-editor')) => {
    // Register Mermaid language
    monaco.languages.register({ id: 'mermaid' });

    // Define enhanced Mermaid syntax highlighting rules
    monaco.languages.setMonarchTokensProvider('mermaid', {
      tokenizer: {
        root: [
          // Comments
          [/%%.*$/, 'comment'],
          
          // Diagram types
          [/\b(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|stateDiagram-v2|erDiagram|journey|gantt|pie|gitgraph)\b/, 'keyword'],
          
          // Direction keywords
          [/\b(TD|TB|BT|RL|LR)\b/, 'keyword'],
          
          // Sequence diagram keywords
          [/\b(participant|activate|deactivate|note|loop|alt|else|opt|par|and|critical|break|rect|autonumber)\b/, 'keyword'],
          
          // Class diagram keywords
          [/\b(class|interface|enum|abstract)\b/, 'keyword'],
          
          // State diagram keywords
          [/\b(state|choice|fork|join|end)\b/, 'keyword'],
          
          // Flowchart arrows and connections
          [/-->|---|-\.-|==>|===|-.->|===>|--o|--\*|<\|--|\|>/, 'operator'],
          
          // Sequence diagram arrows
          [/->>|-->>|->>?|\+|-\+|->|<-/, 'operator'],
          
          // Node shapes and delimiters
          [/\[|\]|\(|\)|\{|\}|>|\||<|\[\[|\]\]|\(\(|\)\)|\{\{|\}\}/, 'delimiter'],
          
          // Strings in quotes
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, 'string', '@string'],
          [/'([^'\\]|\\.)*$/, 'string.invalid'],
          [/'/, 'string', '@string_single'],
          
          // Numbers and dates
          [/\d{4}-\d{2}-\d{2}/, 'number.date'],
          [/\d+/, 'number'],
          
          // Identifiers
          [/[a-zA-Z_][a-zA-Z0-9_]*/, 'identifier'],
          
          // Nested diagram syntax (custom extension)
          [/\{\{diagram:[^}]+\}\}/, 'type.nested'],
          [/---diagram:[^-]+---/, 'type.definition'],
          [/---end---/, 'type.definition'],
          
          // Special characters
          [/[\[\]{}().,:;]/, 'delimiter'],
          
          // Whitespace
          [/[ \t\r\n]+/, 'white'],
        ],
        
        string: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape'],
          [/"/, 'string', '@pop']
        ],
        
        string_single: [
          [/[^\\']+/, 'string'],
          [/\\./, 'string.escape'],
          [/'/, 'string', '@pop']
        ]
      }
    });

    // Define enhanced theme for Mermaid
    monaco.editor.defineTheme('mermaid-theme', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
        { token: 'operator', foreground: 'D73A49' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'string.invalid', foreground: 'FF0000', fontStyle: 'underline' },
        { token: 'number', foreground: '098658' },
        { token: 'number.date', foreground: '267F99' },
        { token: 'type.nested', foreground: '795E26', fontStyle: 'bold', background: 'FFF3CD' },
        { token: 'type.definition', foreground: '6F42C1', fontStyle: 'bold' },
        { token: 'identifier', foreground: '001080' },
        { token: 'delimiter', foreground: '000000' }
      ],
      colors: {
        'editor.background': '#FFFFFF',
        'editor.foreground': '#000000',
        'editorLineNumber.foreground': '#237893',
        'editor.selectionBackground': '#ADD6FF',
        'editor.inactiveSelectionBackground': '#E5EBF1'
      }
    });

    // Configure enhanced auto-completion for Mermaid
    monaco.languages.registerCompletionItemProvider('mermaid', {
      provideCompletionItems: (model, position) => {
        const wordInfo = model.getWordUntilPosition(position);
        const word = wordInfo.word.toLowerCase();
        
        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        });
        
        const currentLine = model.getLineContent(position.lineNumber);
        const previousLines = textUntilPosition.split('\n').slice(0, -1);
        const diagramType = autoCompletionService.detectDiagramType(textUntilPosition);
        
        const context = {
          currentLine,
          lineNumber: position.lineNumber,
          column: position.column,
          previousLines,
          diagramType
        };
        
        const completionItems = autoCompletionService.getCompletionItems(monaco, context);
        
        // Filter based on current word
        const filteredItems = word ? 
          completionItems.filter(item => item.label.toLowerCase().startsWith(word)) :
          completionItems;
        
        return {
          suggestions: filteredItems.map(item => ({
            ...item,
            insertText: item.insertText.replace(/\\n/g, '\n'),
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: wordInfo.startColumn,
              endColumn: wordInfo.endColumn
            }
          }))
        };
      },
      triggerCharacters: ['{', ':', '-', '>', '=', '[', '(', ' ']
    });

    // Register hover provider for documentation
    monaco.languages.registerHoverProvider('mermaid', {
      provideHover: (model, position) => {
        const word = model.getWordAtPosition(position);
        if (!word) return null;
        
        const hoverContent = getHoverContent(word.word);
        if (!hoverContent) return null;
        
        return {
          range: new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          ),
          contents: [{ value: hoverContent }]
        };
      }
    });

    // Local hover content function
    function getHoverContent(word: string): string | null {
      const documentation: Record<string, string> = {
        'flowchart': '**流程图** - 用于显示流程和决策路径',
        'sequenceDiagram': '**序列图** - 用于显示对象间的交互序列',
        'classDiagram': '**类图** - 用于显示类的结构和关系',
        'stateDiagram': '**状态图** - 用于显示状态转换',
        'gantt': '**甘特图** - 用于项目时间管理',
        'pie': '**饼图** - 用于显示数据分布',
        'participant': '**参与者** - 定义序列图中的参与者',
        'activate': '**激活** - 激活序列图中的参与者',
        'deactivate': '**停用** - 停用序列图中的参与者',
        'class': '**类** - 定义类图中的类',
        'state': '**状态** - 定义状态图中的状态'
      };
      
      return documentation[word] || null;
    }
  }, []);



  /**
   * Handle editor mount
   */
  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Configure Monaco for Mermaid
    configureMonacoForMermaid(monaco);
    
    // Set up error detection
    monaco.editor.setModelMarkers(editor.getModel()!, 'mermaid', []);
    
    // Add keyboard shortcuts for undo/redo
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {
      editor.trigger('keyboard', 'undo', null);
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY, () => {
      editor.trigger('keyboard', 'redo', null);
    });
    
    // Add Ctrl+Shift+Z for redo (alternative)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ, () => {
      editor.trigger('keyboard', 'redo', null);
    });
    
    // Apply scroll fix and alignment fix
    if (containerRef.current) {
      const scrollFix = EditorScrollFix.getInstance();
      scrollFix.applyEditorFix(containerRef.current);
      
      // 调试Monaco结构
      setTimeout(() => {
        debugMonacoStructure(containerRef.current!);
      }, 1000);
      
      // 修复背景高度问题
      const alignmentFix = MonacoAlignmentFix.getInstance();
      alignmentFix.applyAlignmentFix(containerRef.current);
    }
    
    // Focus the editor
    editor.focus();
  }, [configureMonacoForMermaid]);



  /**
   * Handle editor content change with performance optimization
   */
  const handleEditorChange: OnChange = useCallback((value) => {
    if (value !== undefined) {
      // Update large file status
      const isLarge = isLargeDiagram(value);
      if (isLarge !== isLargeFile) {
        setIsLargeFile(isLarge);
      }
      
      // Call debounced onChange for diagram rendering
      debouncedOnChange(value);
      
      // Call debounced validation for real-time error checking
      debouncedValidation(value);
    }
  }, [debouncedOnChange, debouncedValidation, isLargeDiagram, isLargeFile]);

  /**
   * Get enhanced error suggestions for display
   */
  const getErrorSuggestions = useCallback(() => {
    if (!currentError) return [];
    
    // Get suggestions from both services
    const originalSuggestions = errorHandlingService.getErrorSuggestions(currentError, code);
    const quickFixSuggestions = syntaxValidationService.getQuickFixSuggestions(currentError);
    
    // Combine and deduplicate suggestions
    const allSuggestions = [...originalSuggestions, ...quickFixSuggestions];
    return Array.from(new Set(allSuggestions));
  }, [currentError, code]);

  // Clean up timeouts and scroll fix on unmount
  useEffect(() => {
    return () => {
      const changeTimeoutRef = (debouncedOnChange as any).timeoutRef;
      if (changeTimeoutRef?.current) {
        clearTimeout(changeTimeoutRef.current);
      }
      
      const validationTimeoutRef = (debouncedValidation as any).timeoutRef;
      if (validationTimeoutRef?.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      
      // Clean up scroll fix and alignment fix
      if (containerRef.current) {
        const scrollFix = EditorScrollFix.getInstance();
        scrollFix.removeContainerFix(containerRef.current);
      }
      
      const alignmentFix = MonacoAlignmentFix.getInstance();
      alignmentFix.cleanup();
    };
  }, [debouncedOnChange, debouncedValidation]);
  


  return (
    <div ref={containerRef} className={`h-full flex flex-col editor-container ${className}`}>
      {/* Error information panel */}
      {currentError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-2 text-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center">
                <div className="text-red-800 font-medium">
                  语法错误 (第{currentError.line}行)
                </div>
                {isValidating && (
                  <div className="ml-2 animate-spin rounded-full h-3 w-3 border-b border-red-600"></div>
                )}
              </div>
              <div className="text-red-700 mt-1">{currentError.message}</div>
              
              {/* Error suggestions */}
              {getErrorSuggestions().length > 0 && (
                <div className="mt-2">
                  <div className="text-red-800 font-medium text-xs mb-1">建议:</div>
                  <ul className="text-red-700 text-xs space-y-1">
                    {getErrorSuggestions().map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-1">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setCurrentError(null);
                onError(null);
                clearErrorMarkers();
              }}
              className="text-red-400 hover:text-red-600 ml-2 flex-shrink-0"
              title="关闭错误提示"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden min-h-0">
        <Editor
          height="100%"
          language="mermaid"
          theme="mermaid-theme"
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: !isLargeFile }, // Disable minimap for large files
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: isLargeFile ? 'on' : 'off', // Enable word wrap for large files
            automaticLayout: true,
            glyphMargin: true,
            renderWhitespace: 'none',
            renderControlCharacters: false,
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10
            },
            suggest: {
              showKeywords: !isLargeFile, // Disable suggestions for large files
              showSnippets: !isLargeFile,
              showFunctions: !isLargeFile
            },
            // Performance optimizations for large files
            renderValidationDecorations: isLargeFile ? 'off' : 'on',
            occurrencesHighlight: isLargeFile ? 'off' : 'singleFile',
            selectionHighlight: !isLargeFile,
            codeLens: !isLargeFile,
            folding: true,
            foldingStrategy: isLargeFile ? 'indentation' : 'auto'
          }}
        />
      </div>

      {/* Status bar with performance indicators */}
      <div className="bg-gray-50 border-t border-gray-200 px-3 py-1 text-xs text-gray-600 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>行: {code.split('\n').length}</span>
          <span>字符: {code.length}</span>
          {isLargeFile && (
            <span className="text-orange-600 flex items-center">
              <span className="mr-1">⚡</span>
              大文件模式
            </span>
          )}
          {isValidating && (
            <div className="flex items-center space-x-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-600"></div>
              <span>验证中...</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {currentError ? (
            <span className="text-red-600 flex items-center">
              <span className="mr-1">⚠️</span>
              错误
            </span>
          ) : (
            <span className="text-green-600 flex items-center">
              <span className="mr-1">✓</span>
              正常
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;