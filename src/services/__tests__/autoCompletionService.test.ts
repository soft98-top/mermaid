import { describe, it, expect } from 'vitest';
import { autoCompletionService } from '../autoCompletionService';
import { MermaidDiagramType } from '../../types/diagram';

// Mock Monaco editor
const mockMonaco = {
  languages: {
    CompletionItemKind: {
      Keyword: 1,
      Snippet: 2,
      Operator: 3
    },
    CompletionItemInsertTextRule: {
      InsertAsSnippet: 4
    }
  },
  Range: class MockRange {
    constructor(
      public startLineNumber: number,
      public startColumn: number,
      public endLineNumber: number,
      public endColumn: number
    ) {}
  }
} as any;

describe('AutoCompletionService', () => {
  describe('detectDiagramType', () => {
    it('should detect flowchart type', () => {
      const code = 'flowchart TD\n    A --> B';
      const result = autoCompletionService.detectDiagramType(code);
      expect(result).toBe(MermaidDiagramType.FLOWCHART);
    });

    it('should detect sequence diagram type', () => {
      const code = 'sequenceDiagram\n    A->>B: Message';
      const result = autoCompletionService.detectDiagramType(code);
      expect(result).toBe(MermaidDiagramType.SEQUENCE);
    });

    it('should detect class diagram type', () => {
      const code = 'classDiagram\n    class Animal';
      const result = autoCompletionService.detectDiagramType(code);
      expect(result).toBe(MermaidDiagramType.CLASS);
    });

    it('should return undefined for unknown type', () => {
      const code = 'unknown diagram type';
      const result = autoCompletionService.detectDiagramType(code);
      expect(result).toBeUndefined();
    });
  });

  describe('getCompletionItems', () => {
    it('should return diagram type completions for first line', () => {
      const context = {
        currentLine: '',
        lineNumber: 1,
        column: 1,
        previousLines: [],
        diagramType: undefined
      };

      const completions = autoCompletionService.getCompletionItems(mockMonaco, context);
      
      expect(completions.length).toBeGreaterThan(0);
      expect(completions.some(c => c.label === 'flowchart')).toBe(true);
      expect(completions.some(c => c.label === 'sequenceDiagram')).toBe(true);
    });

    it('should return flowchart-specific completions', () => {
      const context = {
        currentLine: 'A -->',
        lineNumber: 2,
        column: 5,
        previousLines: ['flowchart TD'],
        diagramType: MermaidDiagramType.FLOWCHART
      };

      const completions = autoCompletionService.getCompletionItems(mockMonaco, context);
      
      expect(completions.some(c => c.label === '-->')).toBe(true);
      expect(completions.some(c => c.label === '[]')).toBe(true);
    });

    it('should return sequence diagram completions', () => {
      const context = {
        currentLine: '',
        lineNumber: 2,
        column: 1,
        previousLines: ['sequenceDiagram'],
        diagramType: MermaidDiagramType.SEQUENCE
      };

      const completions = autoCompletionService.getCompletionItems(mockMonaco, context);
      
      expect(completions.some(c => c.label === 'participant')).toBe(true);
      expect(completions.some(c => c.label === '->>')).toBe(true);
    });

    it('should return nested diagram completions', () => {
      const context = {
        currentLine: '',
        lineNumber: 2,
        column: 1,
        previousLines: ['flowchart TD'],
        diagramType: MermaidDiagramType.FLOWCHART
      };

      const completions = autoCompletionService.getCompletionItems(mockMonaco, context);
      
      expect(completions.some(c => c.label === 'nested-diagram')).toBe(true);
      expect(completions.some(c => c.label === 'diagram-definition')).toBe(true);
    });
  });

  describe('getSyntaxValidationSuggestions', () => {
    it('should suggest completion for incomplete nested diagram syntax', () => {
      const code = 'A --> {{diagram:flowchart:test';
      const position = { line: 1, column: 30 };
      
      const suggestions = autoCompletionService.getSyntaxValidationSuggestions(code, position);
      
      expect(suggestions).toContain('嵌套图表语法不完整，缺少结束标记 }}');
    });

    it('should suggest completion for incomplete diagram definition', () => {
      const code = '---diagram:flowchart:test---\nA --> B';
      const position = { line: 1, column: 28 };
      
      const suggestions = autoCompletionService.getSyntaxValidationSuggestions(code, position);
      
      expect(suggestions).toContain('图表定义不完整，缺少 ---end--- 标记');
    });

    it('should detect unmatched brackets', () => {
      const code = 'A[Node --> B';
      const position = { line: 1, column: 12 };
      
      const suggestions = autoCompletionService.getSyntaxValidationSuggestions(code, position);
      
      expect(suggestions).toContain('方括号不匹配，请检查节点定义');
    });
  });
});