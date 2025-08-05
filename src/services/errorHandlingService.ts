import type { DiagramError, ErrorType, ErrorResult, ErrorRecoveryOptions } from '../types/error';
import { mermaidService } from './mermaidService';

/**
 * Enhanced error handling service for real-time preview and error recovery
 */
export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private retryAttempts = new Map<string, number>();
  private errorCache = new Map<string, DiagramError>();
  private recoveryOptions: ErrorRecoveryOptions = {
    autoRetry: true,
    maxRetries: 3,
    fallbackToCache: true,
    showPartialRender: true,
  };

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Parse and validate Mermaid code with detailed error information
   */
  public async validateCodeWithDetails(code: string): Promise<ErrorResult> {
    if (!code.trim()) {
      return { hasError: false, recoverable: true };
    }

    try {
      // Basic syntax validation
      const syntaxError = this.validateBasicSyntax(code);
      if (syntaxError) {
        return {
          hasError: true,
          error: syntaxError,
          recoverable: true,
        };
      }

      // Mermaid-specific validation
      try {
        const isValid = await mermaidService.validateSyntax(code);
        if (!isValid) {
          // Try to get more detailed error information
          const detailedError = await this.getDetailedMermaidError(code);
          return {
            hasError: true,
            error: detailedError,
            recoverable: true,
          };
        }
      } catch (mermaidError) {
        // Handle mermaid validation errors
        const detailedError = this.parseMermaidError(mermaidError, code);
        return {
          hasError: true,
          error: detailedError,
          recoverable: true,
        };
      }

      return { hasError: false, recoverable: true };
    } catch (error) {
      const diagramError = this.createErrorFromException(error, code);
      return {
        hasError: true,
        error: diagramError,
        recoverable: this.isRecoverableError(diagramError),
      };
    }
  }

  /**
   * Validate basic syntax and structure
   */
  private validateBasicSyntax(code: string): DiagramError | null {
    const lines = code.split('\n');
    
    // Check for empty code
    if (!code.trim()) {
      return null; // Empty code is valid
    }

    // Check first line for valid diagram type - but be more lenient
    const firstLine = lines[0].trim();
    if (firstLine && !firstLine.startsWith('%%')) {
      const validDiagramTypes = [
        'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 
        'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie', 'gitGraph'
      ];
      
      const hasValidStart = validDiagramTypes.some(type => 
        firstLine.startsWith(type)
      );
      
      // Only return error if it's clearly not a diagram type and not a simple node definition
      if (!hasValidStart && !firstLine.match(/^[A-Za-z0-9_]+\s*(-->|\[|\(|\{)/)) {
        return {
          type: 'syntax_error',
          message: `无效的图表类型。代码必须以以下关键字之一开头: ${validDiagramTypes.join(', ')}`,
          line: 1,
          column: 1,
        };
      }
    }

    // Check for balanced brackets
    const bracketError = this.checkBalancedBrackets(code);
    if (bracketError) {
      return bracketError;
    }

    // Check for common syntax issues
    const commonError = this.checkCommonSyntaxIssues(code);
    if (commonError) {
      return commonError;
    }

    return null;
  }

  /**
   * Check for balanced brackets and parentheses (only for node definitions)
   */
  private checkBalancedBrackets(code: string): DiagramError | null {
    const lines = code.split('\n');
    
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex].trim();
      const lineNumber = lineIndex + 1;
      
      // Skip empty lines and comments
      if (!line || line.startsWith('%%')) {
        continue;
      }
      
      // Skip lines with nested diagram syntax
      if (line.includes('{{diagram:') || line.includes('---diagram:') || line.includes('---end---')) {
        continue;
      }
      
      // Remove nested syntax from line before checking brackets (support both formats)
      const cleanLine = line.replace(/\{\{diagram:(?:[^:]+:)?[^}]+\}\}/g, '"nested"');
      
      // Only check brackets in node definitions and labels
      const nodeDefinitions = cleanLine.match(/[A-Za-z0-9_]+\s*[\[\(\{<][^\]\)\}>]*[\]\)\}>]/g);
      if (nodeDefinitions) {
        for (const nodeDef of nodeDefinitions) {
          const brackets = { '[': ']', '(': ')', '{': '}', '<': '>' };
          const stack: string[] = [];
          
          for (let i = 0; i < nodeDef.length; i++) {
            const char = nodeDef[i];
            
            if (Object.keys(brackets).includes(char)) {
              stack.push(char);
            } else if (Object.values(brackets).includes(char)) {
              const last = stack.pop();
              if (!last || brackets[last as keyof typeof brackets] !== char) {
                return {
                  type: 'syntax_error',
                  message: `不匹配的括号 '${char}' 在节点定义中`,
                  line: lineNumber,
                  column: cleanLine.indexOf(nodeDef) + i + 1,
                };
              }
            }
          }
          
          if (stack.length > 0) {
            return {
              type: 'syntax_error',
              message: `未闭合的括号 '${stack[stack.length - 1]}' 在节点定义中`,
              line: lineNumber,
              column: cleanLine.indexOf(nodeDef) + 1,
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Check for common syntax issues
   */
  private checkCommonSyntaxIssues(code: string): DiagramError | null {
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      // Skip empty lines and comments
      if (!line || line.startsWith('%%')) {
        continue;
      }

      // Relaxed validation - only check for obvious syntax errors
      // Allow simple node references without explicit definitions in flowcharts
      if (code.includes('flowchart') || code.includes('graph')) {
        // Only flag as error if there are obvious syntax issues like unmatched quotes
        if (line.includes('"') && (line.split('"').length - 1) % 2 !== 0) {
          return {
            type: 'syntax_error',
            message: `未闭合的引号`,
            line: lineNumber,
            column: line.indexOf('"') + 1,
          };
        }
      }

      // Check for invalid sequence diagram syntax
      if (code.includes('sequenceDiagram')) {
        if (line.includes('->>') || line.includes('-->>')) {
          const participantMatch = line.match(/^([A-Za-z0-9_]+)\s*-/);
          if (participantMatch) {
            const participant = participantMatch[1];
            // Check if participant is defined or used elsewhere
            const hasParticipantDef = code.includes(`participant ${participant}`) || 
                                     code.split('\n').some(l => l.includes(`${participant}->>`) || l.includes(`->>${participant}`));
            if (!hasParticipantDef) {
              return {
                type: 'syntax_error',
                message: `参与者 '${participant}' 未定义。请使用 'participant ${participant}' 定义参与者`,
                line: lineNumber,
                column: 1,
              };
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Get detailed error information from Mermaid parsing
   */
  private async getDetailedMermaidError(code: string): Promise<DiagramError> {
    try {
      // Try to parse with mermaid to get detailed error
      await mermaidService.renderDiagram('error-test', code);
      
      // If we reach here, there's no error (shouldn't happen)
      return {
        type: 'render_error',
        message: '未知的渲染错误',
        line: 1,
        column: 1,
      };
    } catch (error: any) {
      return this.parseMermaidError(error, code);
    }
  }

  /**
   * Parse Mermaid error to extract line and column information
   */
  private parseMermaidError(error: any, code: string): DiagramError {
    const errorMessage = error?.message || error?.toString() || '未知错误';
    
    // Try to extract line number from error message
    const lineMatch = errorMessage.match(/line (\d+)/i) || 
                     errorMessage.match(/at line (\d+)/i) ||
                     errorMessage.match(/第(\d+)行/);
    
    const line = lineMatch ? parseInt(lineMatch[1], 10) : 1;
    
    // Try to extract column number
    const columnMatch = errorMessage.match(/column (\d+)/i) ||
                       errorMessage.match(/at column (\d+)/i) ||
                       errorMessage.match(/第(\d+)列/);
    
    const column = columnMatch ? parseInt(columnMatch[1], 10) : 1;

    // Categorize error type based on message content
    let errorType: ErrorType = 'render_error';
    
    if (errorMessage.includes('syntax') || errorMessage.includes('parse')) {
      errorType = 'syntax_error';
    } else if (errorMessage.includes('nested') || errorMessage.includes('嵌套')) {
      errorType = 'nested_error';
    }

    // Provide user-friendly error messages
    const friendlyMessage = this.getFriendlyErrorMessage(errorMessage, code, line);

    return {
      type: errorType,
      message: friendlyMessage,
      line,
      column,
      stack: error?.stack,
    };
  }

  /**
   * Convert generic error messages to user-friendly ones
   */
  private getFriendlyErrorMessage(originalMessage: string, _code: string, line: number): string {
    const lowerMessage = originalMessage.toLowerCase();
    
    // Common error patterns and their friendly messages
    const errorPatterns = [
      {
        pattern: /unexpected token|syntax error|parse error/i,
        message: '语法错误：请检查代码格式是否正确',
      },
      {
        pattern: /unknown diagram type/i,
        message: '未知的图表类型：请使用支持的图表类型（flowchart、sequenceDiagram等）',
      },
      {
        pattern: /participant.*not found/i,
        message: '参与者未定义：请先使用 participant 关键字定义参与者',
      },
      {
        pattern: /node.*not found/i,
        message: '节点未定义：请确保所有引用的节点都已正确定义',
      },
      {
        pattern: /invalid arrow/i,
        message: '无效的箭头语法：请使用正确的箭头格式（如 -->, ->>）',
      },
      {
        pattern: /circular reference|循环引用/i,
        message: '检测到循环引用：请检查嵌套图表是否存在循环依赖',
      },
      {
        pattern: /maximum.*depth|最大.*深度/i,
        message: '嵌套深度过深：请减少图表嵌套层级',
      },
    ];

    // Find matching pattern
    for (const { pattern, message } of errorPatterns) {
      if (pattern.test(originalMessage)) {
        return `${message}（第${line}行）`;
      }
    }

    // If no pattern matches, try to extract useful information
    if (lowerMessage.includes('expected')) {
      return `语法错误：代码格式不正确（第${line}行）`;
    }

    if (lowerMessage.includes('undefined') || lowerMessage.includes('not defined')) {
      return `引用错误：使用了未定义的元素（第${line}行）`;
    }

    // Return original message with line number if no friendly version available
    return `${originalMessage}（第${line}行）`;
  }

  /**
   * Create error from exception
   */
  private createErrorFromException(error: any, code: string): DiagramError {
    const message = error?.message || error?.toString() || '未知错误';
    
    return {
      type: 'render_error',
      message: this.getFriendlyErrorMessage(message, code, 1),
      line: 1,
      column: 1,
      stack: error?.stack,
    };
  }

  /**
   * Check if error is recoverable
   */
  private isRecoverableError(error: DiagramError): boolean {
    // Syntax errors are usually recoverable by fixing the code
    if (error.type === 'syntax_error') {
      return true;
    }

    // Nested errors might be recoverable
    if (error.type === 'nested_error') {
      return true;
    }

    // Network errors are recoverable with retry
    if (error.type === 'network_error') {
      return true;
    }

    // Render errors might be recoverable
    if (error.type === 'render_error') {
      return !error.message.includes('fatal') && !error.message.includes('critical');
    }

    return false;
  }

  /**
   * Attempt to recover from error with retry mechanism
   */
  public async attemptRecovery(
    code: string,
    error: DiagramError,
    diagramId: string
  ): Promise<{ success: boolean; result?: any; error?: DiagramError }> {
    const currentRetries = this.retryAttempts.get(diagramId) || 0;
    
    if (currentRetries >= this.recoveryOptions.maxRetries) {
      return { success: false, error };
    }

    // Increment retry count
    this.retryAttempts.set(diagramId, currentRetries + 1);

    try {
      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, currentRetries), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));

      // Attempt to render again
      const result = await mermaidService.renderDiagram(diagramId, code);
      
      // Success - clear retry count
      this.retryAttempts.delete(diagramId);
      
      return { success: true, result };
    } catch (retryError) {
      const newError = this.createErrorFromException(retryError, code);
      
      // If we've exhausted retries, clear the count
      if (currentRetries + 1 >= this.recoveryOptions.maxRetries) {
        this.retryAttempts.delete(diagramId);
      }
      
      return { success: false, error: newError };
    }
  }

  /**
   * Clear retry attempts for a diagram
   */
  public clearRetryAttempts(diagramId: string): void {
    this.retryAttempts.delete(diagramId);
  }

  /**
   * Get error suggestions based on error type and content
   */
  public getErrorSuggestions(error: DiagramError, code: string): string[] {
    const suggestions: string[] = [];
    
    switch (error.type) {
      case 'syntax_error':
        suggestions.push('检查括号是否匹配');
        suggestions.push('确认图表类型关键字拼写正确');
        suggestions.push('检查箭头语法是否正确');
        
        if (code.includes('sequenceDiagram')) {
          suggestions.push('确保所有参与者都已定义');
        }
        
        if (code.includes('flowchart') || code.includes('graph')) {
          suggestions.push('确保所有节点都已正确定义');
        }
        break;
        
      case 'render_error':
        suggestions.push('尝试简化图表内容');
        suggestions.push('检查是否使用了不支持的语法');
        suggestions.push('确认所有引用的元素都存在');
        break;
        
      case 'nested_error':
        suggestions.push('检查嵌套图表的语法');
        suggestions.push('确认嵌套引用的图表ID存在');
        suggestions.push('避免循环引用');
        break;
        
      case 'network_error':
        suggestions.push('检查网络连接');
        suggestions.push('稍后重试');
        break;
    }
    
    return suggestions;
  }

  /**
   * Update recovery options
   */
  public updateRecoveryOptions(options: Partial<ErrorRecoveryOptions>): void {
    this.recoveryOptions = { ...this.recoveryOptions, ...options };
  }

  /**
   * Get current recovery options
   */
  public getRecoveryOptions(): ErrorRecoveryOptions {
    return { ...this.recoveryOptions };
  }

  /**
   * Clear all caches and retry attempts
   */
  public clearAll(): void {
    this.retryAttempts.clear();
    this.errorCache.clear();
  }
}

// Export singleton instance
export const errorHandlingService = ErrorHandlingService.getInstance();