import { describe, it, expect } from 'vitest';
import { syntaxValidationService } from '../syntaxValidationService';

describe('SyntaxValidationService', () => {
  describe('validateCode', () => {
    it('should validate empty code as valid', () => {
      const result = syntaxValidationService.validateCode('');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate simple flowchart as valid', () => {
      const code = 'flowchart TD\n    A --> B';
      const result = syntaxValidationService.validateCode(code);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing diagram type', () => {
      const code = 'A --> B';
      const result = syntaxValidationService.validateCode(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('无效的图表类型') || e.message.includes('缺少图表类型声明'))).toBe(true);
    });

    it('should detect invalid diagram type', () => {
      const code = 'invalidtype TD\n    A --> B';
      const result = syntaxValidationService.validateCode(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('无效的图表类型'))).toBe(true);
    });

    it('should detect unmatched brackets', () => {
      const code = 'flowchart TD\n    A[Node --> B';
      const result = syntaxValidationService.validateCode(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('方括号不匹配'))).toBe(true);
    });

    it('should detect invalid arrow syntax', () => {
      const code = 'flowchart TD\n    A -> B';
      const result = syntaxValidationService.validateCode(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('无效的箭头语法'))).toBe(true);
    });
  });

  describe('nested diagram validation', () => {
    it('should detect missing nested diagram definition (old format)', () => {
      const code = `flowchart TD
        A --> {{diagram:sequence:login}}
        B --> C`;
      
      const result = syntaxValidationService.validateCode(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('找不到嵌套图表定义: login'))).toBe(true);
    });

    it('should detect missing nested diagram definition (new format)', () => {
      const code = `flowchart TD
        A --> {{diagram:login}}
        B --> C`;
      
      const result = syntaxValidationService.validateCode(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('找不到嵌套图表定义: login'))).toBe(true);
    });

    it('should validate complete nested diagram structure (old format)', () => {
      const code = `flowchart TD
        A --> {{diagram:sequence:login}}
        B --> C
        
        ---diagram:sequence:login---
        sequenceDiagram
            User->>System: Login
        ---end---`;
      
      const result = syntaxValidationService.validateCode(code);
      expect(result.isValid).toBe(true);
    });

    it('should validate complete nested diagram structure (new format)', () => {
      const code = `flowchart TD
        A --> {{diagram:login}}
        B --> C
        
        ---diagram:login---
        sequenceDiagram
            User->>System: Login
        ---end---`;
      
      const result = syntaxValidationService.validateCode(code);
      expect(result.isValid).toBe(true);
    });

    it('should detect circular references (old format)', () => {
      const code = `flowchart TD
        A --> {{diagram:sequence:b}}
        
        ---diagram:sequence:b---
        sequenceDiagram
            User->>{{diagram:flowchart:a}}: Message
        ---end---
        
        ---diagram:flowchart:a---
        flowchart TD
            X --> {{diagram:sequence:b}}
        ---end---`;
      
      const result = syntaxValidationService.validateCode(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('检测到循环引用'))).toBe(true);
    });

    it('should detect circular references (new format)', () => {
      const code = `flowchart TD
        A --> {{diagram:b}}
        
        ---diagram:b---
        sequenceDiagram
            User->>{{diagram:a}}: Message
        ---end---
        
        ---diagram:a---
        flowchart TD
            X --> {{diagram:b}}
        ---end---`;
      
      const result = syntaxValidationService.validateCode(code);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.message.includes('检测到循环引用'))).toBe(true);
    });

    it('should warn about type mismatches', () => {
      const code = `flowchart TD
        A --> {{diagram:flowchart:test}}
        
        ---diagram:sequence:test---
        sequenceDiagram
            A->>B: Message
        ---end---`;
      
      const result = syntaxValidationService.validateCode(code);
      expect(result.warnings.some(w => w.includes('嵌套图表类型不匹配'))).toBe(true);
    });

    it('should warn about unused definitions', () => {
      const code = `flowchart TD
        A --> B
        
        ---diagram:sequence:unused---
        sequenceDiagram
            A->>B: Message
        ---end---`;
      
      const result = syntaxValidationService.validateCode(code);
      expect(result.warnings.some(w => w.includes('未使用的嵌套图表定义'))).toBe(true);
    });
  });

  describe('diagram-specific validation', () => {
    it('should validate flowchart direction', () => {
      const code = 'flowchart INVALID\n    A --> B';
      const result = syntaxValidationService.validateCode(code);
      expect(result.warnings.some(w => w.includes('无效的流程图方向'))).toBe(true);
    });

    it('should warn about undeclared participants in sequence diagrams', () => {
      const code = `sequenceDiagram
        A->>B: Message`;
      
      const result = syntaxValidationService.validateCode(code);
      expect(result.warnings.some(w => w.includes('参与者') && w.includes('未声明'))).toBe(true);
    });
  });

  describe('getQuickFixSuggestions', () => {
    it('should provide suggestions for bracket mismatch errors', () => {
      const error = {
        type: 'syntax_error' as const,
        message: '方括号不匹配',
        line: 1,
        column: 1
      };
      
      const suggestions = syntaxValidationService.getQuickFixSuggestions(error);
      expect(suggestions.some(s => s.includes('检查节点定义中的方括号'))).toBe(true);
    });

    it('should provide suggestions for arrow syntax errors', () => {
      const error = {
        type: 'syntax_error' as const,
        message: '无效的箭头语法',
        line: 1,
        column: 1
      };
      
      const suggestions = syntaxValidationService.getQuickFixSuggestions(error);
      expect(suggestions.some(s => s.includes('使用正确的箭头语法'))).toBe(true);
    });

    it('should provide suggestions for nested diagram errors', () => {
      const error = {
        type: 'nested_error' as const,
        message: '找不到嵌套图表定义: test',
        line: 1,
        column: 1
      };
      
      const suggestions = syntaxValidationService.getQuickFixSuggestions(error);
      expect(suggestions.some(s => s.includes('添加对应的图表定义'))).toBe(true);
    });

    it('should provide suggestions for circular reference errors', () => {
      const error = {
        type: 'nested_error' as const,
        message: '检测到循环引用',
        line: 1,
        column: 1
      };
      
      const suggestions = syntaxValidationService.getQuickFixSuggestions(error);
      expect(suggestions.some(s => s.includes('检查嵌套图表的引用关系'))).toBe(true);
    });
  });
});