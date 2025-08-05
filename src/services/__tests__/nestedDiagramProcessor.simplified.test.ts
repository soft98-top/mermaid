import { describe, it, expect, beforeEach } from 'vitest';
import { NestedDiagramProcessor } from '../nestedDiagramProcessor';

describe('NestedDiagramProcessor - Simplified Syntax', () => {
  let processor: NestedDiagramProcessor;

  beforeEach(() => {
    processor = new NestedDiagramProcessor();
  });

  describe('parseNestedSyntax with simplified format', () => {
    it('should parse simplified nested reference syntax', () => {
      const code = `
        flowchart TD
          A --> {{diagram:test}}
          
        ---diagram:test---
        sequenceDiagram
          User->>System: Login
        ---end---
      `;

      const result = processor.parseNestedSyntax(code);
      
      expect(result.success).toBe(true);
      expect(result.parsedDiagram).toBeDefined();
      expect(result.parsedDiagram!.nestedDiagrams.has('test')).toBe(true);
      
      const nestedDiagram = result.parsedDiagram!.nestedDiagrams.get('test')!;
      expect(nestedDiagram.type).toBe('sequence');
    });

    it('should auto-detect diagram type from content', () => {
      const testCases = [
        {
          content: 'flowchart TD\n  A --> B',
          expectedType: 'flowchart'
        },
        {
          content: 'sequenceDiagram\n  User->>System: Login',
          expectedType: 'sequence'
        },
        {
          content: 'classDiagram\n  class User',
          expectedType: 'class'
        },
        {
          content: 'gantt\n  title Project',
          expectedType: 'gantt'
        }
      ];

      testCases.forEach(({ content, expectedType }) => {
        const code = `
          flowchart TD
            A --> {{diagram:test}}
            
          ---diagram:test---
          ${content}
          ---end---
        `;

        const result = processor.parseNestedSyntax(code);
        
        expect(result.success).toBe(true);
        const nestedDiagram = result.parsedDiagram!.nestedDiagrams.get('test')!;
        expect(nestedDiagram.type).toBe(expectedType);
      });
    });

    it('should support mixed old and new syntax', () => {
      const code = `
        flowchart TD
          A --> {{diagram:sequence:old-style}}
          B --> {{diagram:new-style}}
          
        ---diagram:sequence:old-style---
        sequenceDiagram
          User->>System: Old
        ---end---
        
        ---diagram:new-style---
        classDiagram
          class User
        ---end---
      `;

      const result = processor.parseNestedSyntax(code);
      
      expect(result.success).toBe(true);
      expect(result.parsedDiagram!.nestedDiagrams.has('old-style')).toBe(true);
      expect(result.parsedDiagram!.nestedDiagrams.has('new-style')).toBe(true);
      
      const oldStyleDiagram = result.parsedDiagram!.nestedDiagrams.get('old-style')!;
      const newStyleDiagram = result.parsedDiagram!.nestedDiagrams.get('new-style')!;
      
      expect(oldStyleDiagram.type).toBe('sequence');
      expect(newStyleDiagram.type).toBe('class');
    });

    it('should handle circular references with simplified syntax', () => {
      const code = `
        flowchart TD
          A --> {{diagram:b}}
          
        ---diagram:b---
        sequenceDiagram
          User->>{{diagram:a}}: Message
        ---end---
        
        ---diagram:a---
        flowchart TD
          X --> {{diagram:b}}
        ---end---
      `;

      const result = processor.parseNestedSyntax(code);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Circular reference detected');
    });

    it('should fail when diagram type cannot be detected', () => {
      const code = `
        flowchart TD
          A --> {{diagram:test}}
          
        ---diagram:test---
        invalid diagram content
        ---end---
      `;

      const result = processor.parseNestedSyntax(code);
      
      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Unable to detect diagram type for: test');
    });

    it('should use reference type when specified, regardless of content', () => {
      const code = `
        flowchart TD
          A --> {{diagram:sequence:test}}
          
        ---diagram:test---
        classDiagram
          class User
        ---end---
      `;

      // Should use the type from reference (sequence) even though content is class
      const result = processor.parseNestedSyntax(code);
      
      expect(result.success).toBe(true);
      const nestedDiagram = result.parsedDiagram!.nestedDiagrams.get('test')!;
      expect(nestedDiagram.type).toBe('sequence'); // Should use the type from reference
    });

    it('should handle nested references in simplified format', () => {
      const code = `
        flowchart TD
          A --> {{diagram:level1}}
          
        ---diagram:level1---
        sequenceDiagram
          User->>{{diagram:level2}}: Message
        ---end---
        
        ---diagram:level2---
        classDiagram
          class User
        ---end---
      `;

      const result = processor.parseNestedSyntax(code);
      
      expect(result.success).toBe(true);
      expect(result.parsedDiagram!.nestedDiagrams.has('level1')).toBe(true);
      
      const level1Diagram = result.parsedDiagram!.nestedDiagrams.get('level1')!;
      expect(level1Diagram.nestedDiagrams.has('level2')).toBe(true);
      
      const level2Diagram = level1Diagram.nestedDiagrams.get('level2')!;
      expect(level2Diagram.type).toBe('class');
    });

    it('should build correct dependency graph with simplified syntax', () => {
      const code = `
        flowchart TD
          A --> {{diagram:seq}}
          B --> {{diagram:cls}}
          
        ---diagram:seq---
        sequenceDiagram
          User->>{{diagram:cls}}: Message
        ---end---
        
        ---diagram:cls---
        classDiagram
          class User
        ---end---
      `;

      const result = processor.parseNestedSyntax(code);
      
      if (!result.success) {
        console.log('Parse failed:', result.error);
      }
      
      expect(result.success).toBe(true);
      expect(result.dependencies).toHaveLength(2);
      
      const seqDep = result.dependencies.find(d => d.id === 'seq');
      const clsDep = result.dependencies.find(d => d.id === 'cls');
      
      expect(seqDep?.dependencies).toContain('cls');
      expect(clsDep?.dependents).toContain('seq');
    });
  });

  describe('extractDependencies with simplified syntax', () => {
    it('should extract dependencies from simplified syntax', () => {
      const code = `
        flowchart TD
          A --> {{diagram:test1}}
          B --> {{diagram:sequence:test2}}
          C --> {{diagram:test3}}
      `;

      const dependencies = (processor as any).extractDependencies(code);
      
      expect(dependencies).toContain('test1');
      expect(dependencies).toContain('test2');
      expect(dependencies).toContain('test3');
      expect(dependencies).toHaveLength(3);
    });
  });

  describe('hasContentChanged with simplified syntax', () => {
    it('should detect changes in simplified diagram definitions', () => {
      const initialCode = `
        flowchart TD
          A --> {{diagram:test}}
          
        ---diagram:test---
        sequenceDiagram
          User->>System: Login
        ---end---
      `;

      processor.parseNestedSyntax(initialCode);

      const changedCode = `
        flowchart TD
          A --> {{diagram:test}}
          
        ---diagram:test---
        sequenceDiagram
          User->>System: Changed
        ---end---
      `;

      expect(processor.hasContentChanged(changedCode)).toBe(true);
    });

    it('should not detect changes when content is the same', () => {
      const code = `
        flowchart TD
          A --> {{diagram:test}}
          
        ---diagram:test---
        sequenceDiagram
          User->>System: Login
        ---end---
      `;

      processor.parseNestedSyntax(code);
      expect(processor.hasContentChanged(code)).toBe(false);
    });
  });
});