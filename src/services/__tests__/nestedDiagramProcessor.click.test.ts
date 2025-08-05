import { describe, it, expect, beforeEach } from 'vitest';
import { NestedDiagramProcessor } from '../nestedDiagramProcessor';

describe('NestedDiagramProcessor - Click Event Handling', () => {
  let processor: NestedDiagramProcessor;

  beforeEach(() => {
    processor = new NestedDiagramProcessor();
  });

  describe('click statement processing', () => {
    it('should handle click statements with simplified syntax', () => {
      const code = `
        flowchart TD
          A --> B
          B --> D[登录详情]
          
          click D "{{diagram:login-flow}}"

        ---diagram:login-flow---
        sequenceDiagram
          User->>System: Login
        ---end---
      `;

      const result = processor.parseNestedSyntax(code);
      
      expect(result.success).toBe(true);
      expect(result.parsedDiagram).toBeDefined();
      
      // Check that the nested diagram is registered
      expect(result.parsedDiagram!.nestedDiagrams.has('login-flow')).toBe(true);
      
      // Check that the click statement is properly processed
      expect(result.parsedDiagram!.content).toContain('click D "login-flow"');
      
      // Ensure no duplicate click statements
      const clickMatches = result.parsedDiagram!.content.match(/click.*login-flow/g);
      expect(clickMatches).toHaveLength(1);
    });

    it('should handle node label references', () => {
      const code = `
        flowchart TD
          A --> B
          B -->|否| D[{{diagram:login-flow}}]

        ---diagram:login-flow---
        sequenceDiagram
          User->>System: Login
        ---end---
      `;

      const result = processor.parseNestedSyntax(code);
      
      expect(result.success).toBe(true);
      expect(result.parsedDiagram).toBeDefined();
      
      // Check that the nested diagram is registered
      expect(result.parsedDiagram!.nestedDiagrams.has('login-flow')).toBe(true);
      
      // Check that the node label is properly processed
      expect(result.parsedDiagram!.content).toContain('D["login-flow"]');
    });

    it('should handle mixed click statements and node labels', () => {
      const code = `
        flowchart TD
          A --> B
          B -->|节点引用| C[{{diagram:node-ref}}]
          B -->|点击引用| D[登录详情]
          
          click D "{{diagram:click-ref}}"

        ---diagram:node-ref---
        sequenceDiagram
          User->>System: Node Reference
        ---end---

        ---diagram:click-ref---
        classDiagram
          class User {
            +login()
          }
        ---end---
      `;

      const result = processor.parseNestedSyntax(code);
      
      expect(result.success).toBe(true);
      expect(result.parsedDiagram).toBeDefined();
      
      // Check that both nested diagrams are registered
      expect(result.parsedDiagram!.nestedDiagrams.has('node-ref')).toBe(true);
      expect(result.parsedDiagram!.nestedDiagrams.has('click-ref')).toBe(true);
      
      // Check that both references are properly processed
      expect(result.parsedDiagram!.content).toContain('C["node-ref"]');
      expect(result.parsedDiagram!.content).toContain('click D "click-ref"');
      
      // Ensure no duplicate statements
      const nodeRefMatches = result.parsedDiagram!.content.match(/node-ref/g);
      const clickRefMatches = result.parsedDiagram!.content.match(/click-ref/g);
      expect(nodeRefMatches).toHaveLength(1);
      expect(clickRefMatches).toHaveLength(1);
    });

    it('should handle multiple click statements', () => {
      const code = `
        flowchart TD
          A --> B
          B --> C[详情1]
          B --> D[详情2]
          
          click C "{{diagram:detail1}}"
          click D "{{diagram:detail2}}"

        ---diagram:detail1---
        sequenceDiagram
          User->>System: Detail 1
        ---end---

        ---diagram:detail2---
        classDiagram
          class Detail2
        ---end---
      `;

      const result = processor.parseNestedSyntax(code);
      
      expect(result.success).toBe(true);
      expect(result.parsedDiagram).toBeDefined();
      
      // Check that both nested diagrams are registered
      expect(result.parsedDiagram!.nestedDiagrams.has('detail1')).toBe(true);
      expect(result.parsedDiagram!.nestedDiagrams.has('detail2')).toBe(true);
      
      // Check that both click statements are properly processed
      expect(result.parsedDiagram!.content).toContain('click C "detail1"');
      expect(result.parsedDiagram!.content).toContain('click D "detail2"');
    });

    it('should handle click statements with old syntax', () => {
      const code = `
        flowchart TD
          A --> B
          B --> D[登录详情]
          
          click D "{{diagram:sequence:login-flow}}"

        ---diagram:login-flow---
        sequenceDiagram
          User->>System: Login
        ---end---
      `;

      const result = processor.parseNestedSyntax(code);
      
      expect(result.success).toBe(true);
      expect(result.parsedDiagram).toBeDefined();
      
      // Check that the nested diagram is registered with correct type
      expect(result.parsedDiagram!.nestedDiagrams.has('login-flow')).toBe(true);
      const nestedDiagram = result.parsedDiagram!.nestedDiagrams.get('login-flow')!;
      expect(nestedDiagram.type).toBe('sequence'); // Should use the type from reference
      
      // Check that the click statement is properly processed
      expect(result.parsedDiagram!.content).toContain('click D "login-flow"');
    });
  });

  describe('content processing edge cases', () => {
    it('should not add duplicate click statements for existing ones', () => {
      const code = `
        flowchart TD
          A --> B[{{diagram:test}}]
          
          click B "{{diagram:test}}"

        ---diagram:test---
        sequenceDiagram
          User->>System: Test
        ---end---
      `;

      const result = processor.parseNestedSyntax(code);
      
      expect(result.success).toBe(true);
      
      // Should only have one reference to 'test' in click statements
      const clickMatches = result.parsedDiagram!.content.match(/click.*test/g);
      expect(clickMatches).toHaveLength(1);
    });

    it('should handle complex flowchart with multiple reference types', () => {
      const code = `
        flowchart TD
          A --> B
          B --> C[Dashboard]
          B --> D[{{diagram:login-details}}]
          
          click C "{{diagram:dashboard}}"

        ---diagram:login-details---
        sequenceDiagram
          User->>System: Login
        ---end---

        ---diagram:dashboard---
        flowchart LR
          X --> Y
        ---end---
      `;

      const result = processor.parseNestedSyntax(code);
      
      if (!result.success) {
        console.log('Parse error:', result.error);
      }
      
      expect(result.success).toBe(true);
      expect(result.parsedDiagram!.nestedDiagrams.size).toBe(2);
      
      // Check all references are processed correctly
      expect(result.parsedDiagram!.content).toContain('D["login-details"]');
      expect(result.parsedDiagram!.content).toContain('click C "dashboard"');
    });
  });
});