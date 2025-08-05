import type { DiagramError } from '../types/error';

/**
 * Validation result for syntax checking
 */
export interface ValidationResult {
  isValid: boolean;
  errors: DiagramError[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Syntax validation service for Mermaid diagrams with nested syntax support
 */
export class SyntaxValidationService {
  private static instance: SyntaxValidationService;
  
  public static getInstance(): SyntaxValidationService {
    if (!SyntaxValidationService.instance) {
      SyntaxValidationService.instance = new SyntaxValidationService();
    }
    return SyntaxValidationService.instance;
  }

  /**
   * Validate Mermaid code with detailed error reporting
   */
  public validateCode(code: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    if (!code.trim()) {
      return result;
    }

    // Basic syntax validation
    this.validateBasicSyntax(code, result);
    
    // Nested diagram validation
    this.validateNestedDiagrams(code, result);
    
    // Diagram-specific validation
    this.validateDiagramSpecificSyntax(code, result);

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate basic Mermaid syntax
   */
  private validateBasicSyntax(code: string, result: ValidationResult): void {
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();
      
      if (!trimmedLine || trimmedLine.startsWith('%%')) {
        return; // Skip empty lines and comments
      }

      // Check for unmatched brackets
      this.validateBrackets(line, lineNumber, result);
      
      // Check for invalid characters in node IDs
      this.validateNodeIds(line, result);
      
      // Check for proper arrow syntax
      this.validateArrowSyntax(line, lineNumber, result);
    });

    // Check for diagram type declaration
    this.validateDiagramType(code, result);
  }

  /**
   * Validate bracket matching
   */
  private validateBrackets(line: string, lineNumber: number, result: ValidationResult): void {
    // Skip nested diagram syntax lines
    if (line.includes('{{diagram:') || line.includes('---diagram:') || line.includes('---end---')) {
      return;
    }
    
    // Create a copy of the line with nested syntax removed for bracket validation
    const cleanLine = line.replace(/\{\{diagram:[^}]+\}\}/g, '"nested"');

    const brackets = [
      { open: '[', close: ']', name: '方括号' },
      { open: '(', close: ')', name: '圆括号' },
      { open: '{', close: '}', name: '花括号' }
    ];

    brackets.forEach(bracket => {
      // Skip brace validation entirely since it's handled by nested syntax
      if (bracket.open === '{') {
        return;
      }
      
      const openCount = (cleanLine.match(new RegExp('\\' + bracket.open, 'g')) || []).length;
      const closeCount = (cleanLine.match(new RegExp('\\' + bracket.close, 'g')) || []).length;
      
      if (openCount !== closeCount) {
        result.errors.push({
          type: 'syntax_error',
          message: `${bracket.name}不匹配 (${openCount} 个开括号, ${closeCount} 个闭括号)`,
          line: lineNumber,
          column: cleanLine.indexOf(bracket.open) + 1
        });
      }
    });
  }

  /**
   * Validate node IDs
   */
  private validateNodeIds(line: string, result: ValidationResult): void {
    // Check for invalid characters in node IDs
    const invalidIdPattern = /([0-9][A-Za-z0-9_]*)/g;
    
    let match;
    while ((match = invalidIdPattern.exec(line)) !== null) {
      if (!line.substring(match.index - 1, match.index).match(/[A-Za-z_]/)) {
        result.warnings.push(`节点ID "${match[1]}" 以数字开头，建议使用字母或下划线开头`);
      }
    }
  }

  /**
   * Validate arrow syntax
   */
  private validateArrowSyntax(line: string, lineNumber: number, result: ValidationResult): void {
    // Check for common arrow syntax errors - single arrows without double dashes
    const invalidSingleArrow = /\s->\s/g;
    
    let match;
    while ((match = invalidSingleArrow.exec(line)) !== null) {
      result.errors.push({
        type: 'syntax_error',
        message: `无效的箭头语法 "->"，应该使用 "-->"`,
        line: lineNumber,
        column: match.index + 1
      });
    }
    
    // Reset regex for next use
    invalidSingleArrow.lastIndex = 0;
    
    // Check for invalid equals arrow
    const invalidEqualsArrow = /\s=>\s/g;
    while ((match = invalidEqualsArrow.exec(line)) !== null) {
      result.errors.push({
        type: 'syntax_error',
        message: `无效的箭头语法 "=>"，应该使用 "==>"`,
        line: lineNumber,
        column: match.index + 1
      });
    }
  }

  /**
   * Validate diagram type declaration
   */
  private validateDiagramType(code: string, result: ValidationResult): void {
    const lines = code.split('\n');
    const firstLine = lines[0]?.trim();
    
    if (!firstLine || firstLine.startsWith('%%')) {
      result.errors.push({
        type: 'syntax_error',
        message: '缺少图表类型声明',
        line: 1,
        column: 1
      });
      return;
    }

    const firstLineLower = firstLine.toLowerCase();
    const validTypes = [
      'flowchart', 'graph', 'sequencediagram', 'classdiagram', 
      'statediagram', 'statediagram-v2', 'gantt', 'pie', 'gitgraph', 
      'erdiagram', 'journey'
    ];

    const hasValidType = validTypes.some(type => firstLineLower.startsWith(type));
    
    if (!hasValidType) {
      result.errors.push({
        type: 'syntax_error',
        message: `无效的图表类型 "${firstLine.split(' ')[0]}"`,
        line: 1,
        column: 1
      });
      
      result.suggestions.push('支持的图表类型: ' + validTypes.join(', '));
    }
  }

  /**
   * Validate nested diagram syntax
   */
  private validateNestedDiagrams(code: string, result: ValidationResult): void {
    // Support both old format {{diagram:type:id}} and new simplified format {{diagram:id}}
    const nestedReferencePattern = /\{\{diagram:(?:([^:]+):)?([\w-]+)\}\}/g;
    const definitionPattern = /---diagram:(?:([^:]+):)?([\w-]+)---([\s\S]*?)---end---/g;
    
    const references = new Map<string, { type?: string; line: number }>();
    const definitions = new Map<string, { type?: string; line: number }>();
    
    // Find all references
    const lines = code.split('\n');
    lines.forEach((line, index) => {
      let match;
      while ((match = nestedReferencePattern.exec(line)) !== null) {
        const type = match[1]; // Optional type
        const id = match[2];
        references.set(id, { type, line: index + 1 });
      }
    });
    
    // Find all definitions
    let defMatch;
    while ((defMatch = definitionPattern.exec(code)) !== null) {
      const type = defMatch[1]; // Optional type
      const id = defMatch[2];
      const lineNumber = code.substring(0, defMatch.index).split('\n').length;
      definitions.set(id, { type, line: lineNumber });
    }
    
    // Check for missing definitions
    references.forEach((ref, id) => {
      if (!definitions.has(id)) {
        result.errors.push({
          type: 'nested_error',
          message: `找不到嵌套图表定义: ${id}`,
          line: ref.line,
          column: 1
        });
      } else {
        const def = definitions.get(id)!;
        // Only check type mismatch if both reference and definition have explicit types
        if (ref.type && def.type && ref.type !== def.type) {
          result.warnings.push(`嵌套图表类型不匹配: 引用为 ${ref.type}，定义为 ${def.type}`);
        }
      }
    });
    
    // Check for unused definitions
    definitions.forEach((_def, id) => {
      if (!references.has(id)) {
        result.warnings.push(`未使用的嵌套图表定义: ${id}`);
      }
    });
    
    // Check for circular references
    this.validateCircularReferences(code, result);
  }

  /**
   * Validate circular references in nested diagrams
   */
  private validateCircularReferences(code: string, result: ValidationResult): void {
    // Support both old format with type and new simplified format without type
    const definitionPattern = /---diagram:(?:([^:]+):)?([\w-]+)---([\s\S]*?)---end---/g;
    const referencePattern = /\{\{diagram:(?:([^:]+):)?([\w-]+)\}\}/g;
    
    const dependencies = new Map<string, string[]>();
    
    // Build dependency graph
    let match;
    while ((match = definitionPattern.exec(code)) !== null) {
      const id = match[2];
      const content = match[3];
      const refs: string[] = [];
      
      let refMatch;
      while ((refMatch = referencePattern.exec(content)) !== null) {
        const refId = refMatch[2]; // ID is always the second capture group
        refs.push(refId);
      }
      
      dependencies.set(id, refs);
    }
    
    // Check for cycles using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycle = (node: string): boolean => {
      if (recursionStack.has(node)) {
        return true;
      }
      if (visited.has(node)) {
        return false;
      }
      
      visited.add(node);
      recursionStack.add(node);
      
      const deps = dependencies.get(node) || [];
      for (const dep of deps) {
        if (hasCycle(dep)) {
          return true;
        }
      }
      
      recursionStack.delete(node);
      return false;
    };
    
    for (const [id] of dependencies) {
      if (hasCycle(id)) {
        result.errors.push({
          type: 'nested_error',
          message: `检测到循环引用，涉及图表: ${id}`,
          line: 1,
          column: 1
        });
        break;
      }
    }
  }

  /**
   * Validate diagram-specific syntax
   */
  private validateDiagramSpecificSyntax(code: string, result: ValidationResult): void {
    const lines = code.split('\n');
    const firstLine = lines[0]?.trim().toLowerCase();
    
    if (firstLine?.startsWith('flowchart') || firstLine?.startsWith('graph')) {
      this.validateFlowchartSyntax(code, result);
    } else if (firstLine?.startsWith('sequencediagram')) {
      this.validateSequenceDiagramSyntax(code, result);
    } else if (firstLine?.startsWith('classdiagram')) {
      this.validateClassDiagramSyntax(code, result);
    }
  }

  /**
   * Validate flowchart-specific syntax
   */
  private validateFlowchartSyntax(code: string, result: ValidationResult): void {
    const lines = code.split('\n');
    const firstLine = lines[0]?.trim();
    
    // Check for direction specification
    if (firstLine?.startsWith('flowchart') || firstLine?.startsWith('graph')) {
      const parts = firstLine.split(' ');
      if (parts.length > 1) {
        const direction = parts[1].toUpperCase();
        const validDirections = ['TD', 'TB', 'BT', 'RL', 'LR'];
        if (!validDirections.includes(direction)) {
          result.warnings.push(`无效的流程图方向 "${direction}"，有效选项: ${validDirections.join(', ')}`);
        }
      }
    }
  }

  /**
   * Validate sequence diagram syntax
   */
  private validateSequenceDiagramSyntax(code: string, result: ValidationResult): void {
    const lines = code.split('\n');
    const participants = new Set<string>();
    
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      // Check participant declarations
      if (trimmedLine.startsWith('participant ')) {
        const match = trimmedLine.match(/participant\s+(\w+)/);
        if (match) {
          participants.add(match[1]);
        }
      }
      
      // Check message syntax
      const messagePattern = /(\w+)\s*(->>|-->>|->>?|\+|-\+)\s*(\w+)\s*:\s*(.+)/;
      if (messagePattern.test(trimmedLine)) {
        const match = trimmedLine.match(messagePattern);
        if (match) {
          const [, from, , to] = match;
          if (!participants.has(from) && !trimmedLine.includes('participant')) {
            result.warnings.push(`参与者 "${from}" 未声明`);
          }
          if (!participants.has(to) && !trimmedLine.includes('participant')) {
            result.warnings.push(`参与者 "${to}" 未声明`);
          }
        }
      }
    });
  }

  /**
   * Validate class diagram syntax
   */
  private validateClassDiagramSyntax(code: string, result: ValidationResult): void {
    const lines = code.split('\n');
    
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      
      // Check class definition syntax
      if (trimmedLine.startsWith('class ')) {
        const classPattern = /class\s+(\w+)\s*\{/;
        if (!classPattern.test(trimmedLine) && !trimmedLine.endsWith('{')) {
          result.warnings.push(`类定义语法可能不正确，建议使用 "class ClassName {"`);
        }
      }
    });
  }

  /**
   * Get quick fix suggestions for common errors
   */
  public getQuickFixSuggestions(error: DiagramError): string[] {
    const suggestions: string[] = [];
    
    switch (error.type) {
      case 'syntax_error':
        if (error.message.includes('方括号不匹配')) {
          suggestions.push('检查节点定义中的方括号是否成对出现');
          suggestions.push('示例: A[节点文本] --> B[另一个节点]');
        }
        if (error.message.includes('无效的箭头语法')) {
          suggestions.push('使用正确的箭头语法: --> 或 ==> 或 -.->');
        }
        break;
        
      case 'nested_error':
        if (error.message.includes('找不到嵌套图表定义')) {
          suggestions.push('添加对应的图表定义: ---diagram:id--- 或 ---diagram:type:id---');
          suggestions.push('或者检查图表ID是否拼写正确');
        }
        if (error.message.includes('循环引用')) {
          suggestions.push('检查嵌套图表的引用关系，避免循环依赖');
        }
        break;
    }
    
    return suggestions;
  }
}

export const syntaxValidationService = SyntaxValidationService.getInstance();