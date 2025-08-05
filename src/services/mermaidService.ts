import mermaid from 'mermaid';
import type { MermaidDiagramType } from '../types/diagram';
import { performanceService } from './performanceService';

/**
 * Mermaid service for handling diagram rendering and configuration
 */
export class MermaidService {
  private static instance: MermaidService;
  private isInitialized = false;

  private constructor() {}

  /**
   * Get singleton instance of MermaidService
   */
  public static getInstance(): MermaidService {
    if (!MermaidService.instance) {
      MermaidService.instance = new MermaidService();
    }
    return MermaidService.instance;
  }

  /**
   * Initialize Mermaid with default configuration
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Arial, sans-serif',
      fontSize: 14,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        // Disable default click behavior to allow custom handling
        clickHandler: null,
      },
      sequence: {
        useMaxWidth: true,
        wrap: true,
      },
      gantt: {
        useMaxWidth: true,
      },
      class: {
        useMaxWidth: true,
      },
      state: {
        useMaxWidth: true,
      },
      pie: {
        useMaxWidth: true,
      },
      gitGraph: {
        useMaxWidth: true,
      },
      er: {
        useMaxWidth: true,
      },
      journey: {
        useMaxWidth: true,
      },
    });

    this.isInitialized = true;
  }

  /**
   * Detect diagram type from code
   */
  public detectDiagramType(code: string): MermaidDiagramType | null {
    const trimmedCode = code.trim();
    
    if (trimmedCode.startsWith('flowchart') || trimmedCode.startsWith('graph')) {
      return 'flowchart';
    }
    if (trimmedCode.startsWith('sequenceDiagram')) {
      return 'sequence';
    }
    if (trimmedCode.startsWith('gantt')) {
      return 'gantt';
    }
    if (trimmedCode.startsWith('classDiagram')) {
      return 'class';
    }
    if (trimmedCode.startsWith('stateDiagram')) {
      return 'state';
    }
    if (trimmedCode.startsWith('pie')) {
      return 'pie';
    }
    if (trimmedCode.startsWith('gitGraph')) {
      return 'git';
    }
    if (trimmedCode.startsWith('erDiagram')) {
      return 'er';
    }
    if (trimmedCode.startsWith('journey')) {
      return 'journey';
    }
    
    return null;
  }

  /**
   * Validate Mermaid syntax with performance optimization
   */
  public async validateSyntax(code: string): Promise<boolean> {
    // Skip validation for large diagrams to improve performance
    if (performanceService.isLargeDiagram(code)) {
      return true; // Assume valid, let render handle errors
    }
    
    try {
      await mermaid.parse(code);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Render Mermaid diagram with caching
   */
  public async renderDiagram(id: string, code: string): Promise<{ svg: string }> {
    const cacheKey = performanceService.generateCacheKey(code, this.detectDiagramType(code) || 'unknown');
    
    // Try cache first
    const cached = performanceService.getCachedRender(cacheKey);
    if (cached) {
      return { svg: cached.svgContent };
    }
    
    // Measure render performance
    const startTime = performance.now();
    const { svg } = await mermaid.render(id, code);
    const renderTime = performance.now() - startTime;
    
    // Record performance and cache result
    performanceService.recordRender(renderTime);
    performanceService.cacheRender(cacheKey, {
      id: cacheKey,
      svgContent: svg,
      boundingBox: { width: 0, height: 0 },
      renderTime: Date.now(),
    });
    
    return { svg };
  }

  /**
   * Generate unique diagram ID
   */
  public generateDiagramId(): string {
    return `mermaid-diagram-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }



  /**
   * Get supported diagram types
   */
  public getSupportedDiagramTypes(): MermaidDiagramType[] {
    return [
      'flowchart',
      'sequence',
      'gantt',
      'class',
      'state',
      'pie',
      'git',
      'er',
      'journey'
    ];
  }

  /**
   * Get diagram type display name
   */
  public getDiagramTypeDisplayName(type: MermaidDiagramType): string {
    const displayNames: Record<MermaidDiagramType, string> = {
      flowchart: '流程图',
      sequence: '序列图',
      gantt: '甘特图',
      class: '类图',
      state: '状态图',
      pie: '饼图',
      git: 'Git图',
      er: 'ER图',
      journey: '用户旅程图'
    };

    return displayNames[type] || type;
  }

  /**
   * Get example code for diagram type
   */
  public getExampleCode(type: MermaidDiagramType): string {
    const examples: Record<MermaidDiagramType, string> = {
      flowchart: `flowchart TD
    A[开始] --> B{决策}
    B -->|是| C[执行]
    B -->|否| D[结束]`,
      sequence: `sequenceDiagram
    participant A as 用户
    participant B as 系统
    A->>B: 请求
    B-->>A: 响应`,
      gantt: `gantt
    title 项目计划
    dateFormat YYYY-MM-DD
    section 开发
    任务1 :2024-01-01, 30d
    任务2 :2024-02-01, 20d`,
      class: `classDiagram
    class Animal {
        +String name
        +makeSound()
    }
    class Dog {
        +bark()
    }
    Animal <|-- Dog`,
      state: `stateDiagram
    [*] --> 空闲
    空闲 --> 运行
    运行 --> 空闲
    运行 --> [*]`,
      pie: `pie title 数据分布
    "A" : 386
    "B" : 85
    "C" : 15`,
      git: `gitGraph
    commit
    branch develop
    checkout develop
    commit
    checkout main
    merge develop`,
      er: `erDiagram
    CUSTOMER {
        string name
        string email
    }
    ORDER {
        int id
        date created
    }
    CUSTOMER ||--o{ ORDER : places`,
      journey: `journey
    title 用户购物流程
    section 浏览
        访问网站: 5: 用户
        查看商品: 4: 用户
    section 购买
        添加到购物车: 3: 用户
        结账: 2: 用户`
    };

    return examples[type] || '';
  }
}

// Export singleton instance
export const mermaidService = MermaidService.getInstance();