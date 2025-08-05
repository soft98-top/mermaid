import type { IRange } from 'monaco-editor';
import { MermaidDiagramType } from '../types/diagram';

/**
 * Auto-completion item for Mermaid syntax
 */
export interface MermaidCompletionItem {
  label: string;
  kind: number;
  insertText: string;
  documentation: string;
  detail?: string;
  insertTextRules?: number;
  range: IRange;
}

/**
 * Context information for smart completions
 */
export interface CompletionContext {
  currentLine: string;
  lineNumber: number;
  column: number;
  previousLines: string[];
  diagramType?: MermaidDiagramType;
}

/**
 * Auto-completion service for Mermaid diagrams with nested syntax support
 */
export class AutoCompletionService {
  private static instance: AutoCompletionService;
  
  public static getInstance(): AutoCompletionService {
    if (!AutoCompletionService.instance) {
      AutoCompletionService.instance = new AutoCompletionService();
    }
    return AutoCompletionService.instance;
  }

  /**
   * Get completion items based on context
   */
  public getCompletionItems(
    monaco: typeof import('monaco-editor'),
    context: CompletionContext
  ): MermaidCompletionItem[] {
    const { diagramType, currentLine, lineNumber, column } = context;
    const word = this.getWordRange(monaco, { ...context, currentLine, lineNumber, column });
    
    let suggestions: MermaidCompletionItem[] = [];

    // Add diagram type completions if at start of document
    if (context.lineNumber === 1 && !diagramType) {
      suggestions.push(...this.getDiagramTypeCompletions(monaco, word));
    }

    // Add context-specific completions based on diagram type
    if (diagramType) {
      suggestions.push(...this.getContextSpecificCompletions(monaco, word, context));
    }

    // Add nested diagram completions
    suggestions.push(...this.getNestedDiagramCompletions(monaco, word));

    // Add common syntax completions
    suggestions.push(...this.getCommonSyntaxCompletions(monaco, word));

    return suggestions;
  }

  /**
   * Get diagram type completions
   */
  private getDiagramTypeCompletions(
    monaco: typeof import('monaco-editor'),
    word: IRange
  ): MermaidCompletionItem[] {
    return [
      {
        label: 'flowchart',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'flowchart TD\\n    A[开始] --> B[结束]',
        documentation: '创建流程图 - 用于显示流程和决策路径',
        detail: '流程图模板',
        range: word
      },
      {
        label: 'sequenceDiagram',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'sequenceDiagram\\n    participant A as 用户\\n    participant B as 系统\\n    A->>B: 请求\\n    B-->>A: 响应',
        documentation: '创建序列图 - 用于显示对象间的交互序列',
        detail: '序列图模板',
        range: word
      },
      {
        label: 'classDiagram',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'classDiagram\\n    class Animal {\\n        +String name\\n        +int age\\n        +getName()\\n    }',
        documentation: '创建类图 - 用于显示类的结构和关系',
        detail: '类图模板',
        range: word
      },
      {
        label: 'stateDiagram-v2',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'stateDiagram-v2\\n    [*] --> 初始状态\\n    初始状态 --> 结束状态\\n    结束状态 --> [*]',
        documentation: '创建状态图 - 用于显示状态转换',
        detail: '状态图模板',
        range: word
      },
      {
        label: 'gantt',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'gantt\\n    title 项目甘特图\\n    dateFormat YYYY-MM-DD\\n    section 阶段1\\n    任务1 :a1, 2024-01-01, 30d',
        documentation: '创建甘特图 - 用于项目时间管理',
        detail: '甘特图模板',
        range: word
      },
      {
        label: 'pie',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'pie title 数据分布\\n    "类别A" : 40\\n    "类别B" : 30\\n    "类别C" : 30',
        documentation: '创建饼图 - 用于显示数据分布',
        detail: '饼图模板',
        range: word
      }
    ];
  }

  /**
   * Get context-specific completions based on diagram type
   */
  private getContextSpecificCompletions(
    monaco: typeof import('monaco-editor'),
    word: IRange,
    context: CompletionContext
  ): MermaidCompletionItem[] {
    const { diagramType, currentLine } = context;
    
    switch (diagramType) {
      case MermaidDiagramType.FLOWCHART:
        return this.getFlowchartCompletions(monaco, word, currentLine);
      case MermaidDiagramType.SEQUENCE:
        return this.getSequenceCompletions(monaco, word);
      case MermaidDiagramType.CLASS:
        return this.getClassCompletions(monaco, word);
      case MermaidDiagramType.STATE:
        return this.getStateCompletions(monaco, word);
      default:
        return [];
    }
  }

  /**
   * Get flowchart-specific completions
   */
  private getFlowchartCompletions(
    monaco: typeof import('monaco-editor'),
    word: IRange,
    currentLine: string
  ): MermaidCompletionItem[] {
    const completions: MermaidCompletionItem[] = [
      {
        label: '-->',
        kind: monaco.languages.CompletionItemKind.Operator,
        insertText: '-->',
        documentation: '实线箭头连接',
        range: word
      },
      {
        label: '-.->',
        kind: monaco.languages.CompletionItemKind.Operator,
        insertText: '-.->',
        documentation: '虚线箭头连接',
        range: word
      },
      {
        label: '==>',
        kind: monaco.languages.CompletionItemKind.Operator,
        insertText: '==>',
        documentation: '粗线箭头连接',
        range: word
      }
    ];

    // Add node shape completions
    if (currentLine.includes('-->') || currentLine.includes('-.->') || currentLine.includes('==>')) {
      completions.push(
        {
          label: '[]',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '[${1:文本}]',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '矩形节点',
          range: word
        },
        {
          label: '()',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '(${1:文本})',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '圆角矩形节点',
          range: word
        },
        {
          label: '{}',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '{${1:文本}}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: '菱形节点',
          range: word
        }
      );
    }

    return completions;
  }

  /**
   * Get sequence diagram completions
   */
  private getSequenceCompletions(
    monaco: typeof import('monaco-editor'),
    word: IRange
  ): MermaidCompletionItem[] {
    return [
      {
        label: 'participant',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'participant ${1:A} as ${2:参与者}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: '定义参与者',
        range: word
      },
      {
        label: '->>',
        kind: monaco.languages.CompletionItemKind.Operator,
        insertText: '->>',
        documentation: '同步消息',
        range: word
      },
      {
        label: '-->>',
        kind: monaco.languages.CompletionItemKind.Operator,
        insertText: '-->>',
        documentation: '异步响应',
        range: word
      },
      {
        label: 'activate',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'activate ${1:参与者}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: '激活参与者',
        range: word
      },
      {
        label: 'deactivate',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'deactivate ${1:参与者}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: '停用参与者',
        range: word
      }
    ];
  }

  /**
   * Get class diagram completions
   */
  private getClassCompletions(
    monaco: typeof import('monaco-editor'),
    word: IRange
  ): MermaidCompletionItem[] {
    return [
      {
        label: 'class',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'class ${1:ClassName} {\\n    +${2:String} ${3:property}\\n    +${4:method}()\\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: '定义类',
        range: word
      },
      {
        label: '--|>',
        kind: monaco.languages.CompletionItemKind.Operator,
        insertText: '--|>',
        documentation: '继承关系',
        range: word
      },
      {
        label: '--*',
        kind: monaco.languages.CompletionItemKind.Operator,
        insertText: '--*',
        documentation: '组合关系',
        range: word
      },
      {
        label: '--o',
        kind: monaco.languages.CompletionItemKind.Operator,
        insertText: '--o',
        documentation: '聚合关系',
        range: word
      }
    ];
  }

  /**
   * Get state diagram completions
   */
  private getStateCompletions(
    monaco: typeof import('monaco-editor'),
    word: IRange
  ): MermaidCompletionItem[] {
    return [
      {
        label: '[*]',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: '[*]',
        documentation: '开始/结束状态',
        range: word
      },
      {
        label: 'state',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'state ${1:状态名} {\\n    ${2:子状态}\\n}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: '复合状态',
        range: word
      }
    ];
  }

  /**
   * Get nested diagram completions
   */
  private getNestedDiagramCompletions(
    monaco: typeof import('monaco-editor'),
    word: IRange
  ): MermaidCompletionItem[] {
    const diagramTypes = Object.values(MermaidDiagramType);
    
    return [
      {
        label: 'nested-diagram-simple',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '{{diagram:${1:diagram-id}}}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: '插入嵌套图表引用（简化语法，自动检测类型）',
        detail: '嵌套图表简化语法',
        range: word
      },
      {
        label: 'nested-diagram-typed',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '{{diagram:${1|' + diagramTypes.join(',') + '|}:${2:diagram-id}}}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: '插入嵌套图表引用（指定类型）',
        detail: '嵌套图表完整语法',
        range: word
      },
      {
        label: 'diagram-definition-simple',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '---diagram:${1:diagram-id}---\\n${2:图表内容}\\n---end---',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: '定义嵌套图表（简化语法，自动检测类型）',
        detail: '嵌套图表定义简化语法',
        range: word
      },
      {
        label: 'diagram-definition-typed',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '---diagram:${1|' + diagramTypes.join(',') + '|}:${2:diagram-id}---\\n${3:图表内容}\\n---end---',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: '定义嵌套图表（指定类型）',
        detail: '嵌套图表定义完整语法',
        range: word
      }
    ];
  }

  /**
   * Get common syntax completions
   */
  private getCommonSyntaxCompletions(
    monaco: typeof import('monaco-editor'),
    word: IRange
  ): MermaidCompletionItem[] {
    return [
      {
        label: '%%',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: '%% ${1:注释内容}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: '添加注释',
        range: word
      },
      {
        label: 'title',
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: 'title ${1:图表标题}',
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: '设置图表标题',
        range: word
      }
    ];
  }

  /**
   * Get word range for completion
   */
  private getWordRange(
    monaco: typeof import('monaco-editor'),
    context: CompletionContext
  ): IRange {
    const { currentLine, column, lineNumber } = context;
    const word = currentLine.substring(0, column);
    const match = word.match(/\S+$/);
    const startColumn = match ? column - match[0].length : column;
    
    return new monaco.Range(lineNumber, startColumn, lineNumber, column);
  }

  /**
   * Detect diagram type from code
   */
  public detectDiagramType(code: string): MermaidDiagramType | undefined {
    const lines = code.split('\n');
    const firstLine = lines[0]?.trim().toLowerCase();
    
    if (firstLine?.startsWith('flowchart') || firstLine?.startsWith('graph')) {
      return MermaidDiagramType.FLOWCHART;
    }
    if (firstLine?.startsWith('sequencediagram')) {
      return MermaidDiagramType.SEQUENCE;
    }
    if (firstLine?.startsWith('classdiagram')) {
      return MermaidDiagramType.CLASS;
    }
    if (firstLine?.startsWith('statediagram')) {
      return MermaidDiagramType.STATE;
    }
    if (firstLine?.startsWith('gantt')) {
      return MermaidDiagramType.GANTT;
    }
    if (firstLine?.startsWith('pie')) {
      return MermaidDiagramType.PIE;
    }
    
    return undefined;
  }

  /**
   * Get syntax validation suggestions
   */
  public getSyntaxValidationSuggestions(
    code: string,
    position: { line: number; column: number }
  ): string[] {
    const suggestions: string[] = [];
    const lines = code.split('\n');
    const currentLine = lines[position.line - 1] || '';
    
    // Check for common syntax issues
    if (currentLine.includes('{{diagram:') && !currentLine.includes('}}')) {
      suggestions.push('嵌套图表语法不完整，缺少结束标记 }}');
    }
    
    if (currentLine.includes('---diagram:') && !code.includes('---end---')) {
      suggestions.push('图表定义不完整，缺少 ---end--- 标记');
    }
    
    // Check for unmatched brackets
    const openBrackets = (currentLine.match(/\[/g) || []).length;
    const closeBrackets = (currentLine.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      suggestions.push('方括号不匹配，请检查节点定义');
    }
    
    return suggestions;
  }
}

export const autoCompletionService = AutoCompletionService.getInstance();