import type { 
  MermaidDiagramType, 
  ParsedDiagram
} from '../types/diagram';
import type { DiagramError } from '../types/error';
import { ErrorType as ErrorTypeEnum } from '../types/error';

/**
 * Dependency relationship between diagrams
 */
export interface DiagramDependency {
  id: string;
  dependencies: string[];
  dependents: string[];
}

/**
 * Topological sort result
 */
export interface TopologicalSortResult {
  success: boolean;
  sortedOrder: string[];
  error?: DiagramError;
}

/**
 * Dependency change event
 */
export interface DependencyChangeEvent {
  diagramId: string;
  changeType: 'added' | 'removed' | 'modified';
  affectedDiagrams: string[];
}

/**
 * Nesting depth warning
 */
export interface NestingDepthWarning {
  diagramId: string;
  currentDepth: number;
  maxDepth: number;
  path: string[];
}

/**
 * Result of parsing nested diagram syntax
 */
export interface ParseResult {
  success: boolean;
  parsedDiagram?: ParsedDiagram;
  error?: DiagramError;
  dependencies: DiagramDependency[];
  warnings: NestingDepthWarning[];
  topologicalOrder: string[];
}

/**
 * Core processor for handling nested diagram syntax parsing and management
 */
export class NestedDiagramProcessor {
  private static readonly MAX_NESTING_DEPTH = 10;
  private static readonly WARNING_NESTING_DEPTH = 7;

  private diagramRegistry: Map<string, string> = new Map();
  private dependencyGraph: Map<string, DiagramDependency> = new Map();
  private changeListeners: ((event: DependencyChangeEvent) => void)[] = [];
  private nestingWarnings: NestingDepthWarning[] = [];

  /**
   * Parse nested diagram syntax from code
   */
  public parseNestedSyntax(code: string): ParseResult {
    try {
      // Clear previous warnings
      this.nestingWarnings = [];
      
      // First, extract and register all diagram definitions
      this.extractDiagramDefinitions(code);

      // Then parse the main diagram content
      const mainDiagramContent = this.extractMainDiagramContent(code);
      const diagramType = this.detectDiagramType(mainDiagramContent);

      if (!diagramType) {
        return {
          success: false,
          error: {
            type: ErrorTypeEnum.SYNTAX_ERROR,
            message: 'Unable to detect diagram type from content'
          },
          dependencies: [],
          warnings: [],
          topologicalOrder: []
        };
      }

      // Parse nested references in the main content
      const nestedDiagrams = new Map<string, ParsedDiagram>();
      const parentReferences: string[] = [];
      
      const processedContent = this.processNestedReferences(
        mainDiagramContent, 
        nestedDiagrams, 
        parentReferences,
        0 // depth
      );

      // Build dependency graph
      this.buildDependencyGraph();

      // Check for circular references
      const circularRef = this.detectCircularReferences();
      if (circularRef) {
        return {
          success: false,
          error: {
            type: ErrorTypeEnum.NESTED_ERROR,
            message: `Circular reference detected: ${circularRef.join(' -> ')}`
          },
          dependencies: Array.from(this.dependencyGraph.values()),
          warnings: [...this.nestingWarnings],
          topologicalOrder: []
        };
      }

      const parsedDiagram: ParsedDiagram = {
        type: diagramType,
        content: processedContent,
        nestedDiagrams,
        parentReferences
      };

      // Get topological order
      const topologicalResult = this.getTopologicalOrder();
      
      return {
        success: true,
        parsedDiagram,
        dependencies: Array.from(this.dependencyGraph.values()),
        warnings: [...this.nestingWarnings],
        topologicalOrder: topologicalResult.success ? topologicalResult.sortedOrder : []
      };

    } catch (error) {
      // If it's already a DiagramError, use it directly
      if (error && typeof error === 'object' && 'type' in error && 'message' in error) {
        return {
          success: false,
          error: error as DiagramError,
          dependencies: Array.from(this.dependencyGraph.values()),
          warnings: [...this.nestingWarnings],
          topologicalOrder: []
        };
      }
      
      return {
        success: false,
        error: {
          type: ErrorTypeEnum.SYNTAX_ERROR,
          message: error instanceof Error ? error.message : 'Unknown parsing error'
        },
        dependencies: [],
        warnings: [...this.nestingWarnings],
        topologicalOrder: []
      };
    }
  }

  /**
   * Extract diagram definitions from code
   */
  private extractDiagramDefinitions(code: string): void {
    this.diagramRegistry.clear();
    const diagramDefinitionRegex = /---diagram:([^:]+):([\w-]+)---([\s\S]*?)---end---/g;
    let match;

    while ((match = diagramDefinitionRegex.exec(code)) !== null) {
      const [, type, id, content] = match;
      const cleanContent = content.trim();
      
      if (this.isValidDiagramType(type) && id && cleanContent) {
        this.diagramRegistry.set(id, cleanContent);
      }
    }
  }

  /**
   * Extract main diagram content (excluding definitions)
   */
  private extractMainDiagramContent(code: string): string {
    const diagramDefinitionRegex = /---diagram:([^:]+):([\w-]+)---([\s\S]*?)---end---/g;
    return code.replace(diagramDefinitionRegex, '').trim();
  }

  /**
   * Process nested references in diagram content
   */
  private processNestedReferences(
    content: string, 
    nestedDiagrams: Map<string, ParsedDiagram>,
    parentReferences: string[],
    depth: number
  ): string {
    if (depth > NestedDiagramProcessor.MAX_NESTING_DEPTH) {
      throw new Error(`Maximum nesting depth (${NestedDiagramProcessor.MAX_NESTING_DEPTH}) exceeded`);
    }

    // Add warning for deep nesting
    if (depth >= NestedDiagramProcessor.WARNING_NESTING_DEPTH && parentReferences.length > 0) {
      const currentDiagramId = parentReferences[parentReferences.length - 1];
      this.nestingWarnings.push({
        diagramId: currentDiagramId,
        currentDepth: depth,
        maxDepth: NestedDiagramProcessor.MAX_NESTING_DEPTH,
        path: [...parentReferences]
      });
    }

    const nestedSyntaxRegex = /\{\{diagram:([^:]+):([\w-]+)\}\}/g;
    const referencesToProcess = [];
    let match;

    // First, find all references to process
    while ((match = nestedSyntaxRegex.exec(content)) !== null) {
      referencesToProcess.push({
        fullMatch: match[0],
        type: match[1],
        id: match[2],
      });
    }

    // Process each reference recursively to populate the nestedDiagrams map
    for (const ref of referencesToProcess) {
      if (!this.isValidDiagramType(ref.type)) {
        throw new Error(`Invalid diagram type: ${ref.type}`);
      }

      const diagramCode = this.diagramRegistry.get(ref.id);
      if (!diagramCode) {
        throw new Error(`Referenced diagram not found: ${ref.id}`);
      }

      if (parentReferences.includes(ref.id)) {
        const cycle = [...parentReferences, ref.id];
        throw {
          type: ErrorTypeEnum.NESTED_ERROR,
          message: `Circular reference detected: ${cycle.join(' -> ')}`,
        } as DiagramError;
      }

      const nestedParentRefs = [...parentReferences, ref.id];
      const nestedMapForRecusion = new Map<string, ParsedDiagram>();
      const nestedContent = this.processNestedReferences(
        diagramCode,
        nestedMapForRecusion,
        nestedParentRefs,
        depth + 1
      );

      nestedDiagrams.set(ref.id, {
        type: ref.type as MermaidDiagramType,
        content: nestedContent,
        nestedDiagrams: nestedMapForRecusion,
        parentReferences: nestedParentRefs,
      });
    }
    
    // After all references are processed and populated, perform a single global replacement
    // Replace nested syntax with placeholder text to avoid bracket issues
    const clickStatements: string[] = [];
    const processedContent = content.replace(nestedSyntaxRegex, (_fullMatch, _type, id) => {
      clickStatements.push(`    click ${id} "${id}"`);
      return `"${id}"`; // Return quoted ID to avoid bracket syntax issues
    });

    // Append click statements at the end
    const finalContent = clickStatements.length > 0 
      ? processedContent + '\n' + clickStatements.join('\n')
      : processedContent;

    return finalContent;
  }

  /**
   * Detect diagram type from content
   */
  private detectDiagramType(content: string): MermaidDiagramType | null {
    const trimmedContent = content.trim().toLowerCase();
    
    if (trimmedContent.startsWith('flowchart') || trimmedContent.startsWith('graph')) {
      return 'flowchart';
    }
    if (trimmedContent.startsWith('sequencediagram')) {
      return 'sequence';
    }
    if (trimmedContent.startsWith('gantt')) {
      return 'gantt';
    }
    if (trimmedContent.startsWith('classdiagram')) {
      return 'class';
    }
    if (trimmedContent.startsWith('statediagram')) {
      return 'state';
    }
    if (trimmedContent.startsWith('pie')) {
      return 'pie';
    }
    if (trimmedContent.startsWith('gitgraph')) {
      return 'git';
    }
    if (trimmedContent.startsWith('erdiagram')) {
      return 'er';
    }
    if (trimmedContent.startsWith('journey')) {
      return 'journey';
    }

    return null;
  }

  /**
   * Check if diagram type is valid
   */
  private isValidDiagramType(type: string): boolean {
    const validTypes = ['flowchart', 'sequence', 'gantt', 'class', 'state', 'pie', 'git', 'er', 'journey'];
    return validTypes.includes(type.toLowerCase());
  }

  /**
   * Build dependency graph for all diagrams
   */
  private buildDependencyGraph(): void {
    this.dependencyGraph.clear();

    // Initialize all diagrams in the graph
    for (const [id] of this.diagramRegistry) {
      this.dependencyGraph.set(id, {
        id,
        dependencies: [],
        dependents: []
      });
    }

    // Build dependencies
    for (const [id, code] of this.diagramRegistry) {
      const dependencies = this.extractDependencies(code);
      const node = this.dependencyGraph.get(id);
      
      if (node) {
        node.dependencies = dependencies;
        
        // Update dependents
        for (const depId of dependencies) {
          const depNode = this.dependencyGraph.get(depId);
          if (depNode && !depNode.dependents.includes(id)) {
            depNode.dependents.push(id);
          }
        }
      }
    }
  }

  /**
   * Extract dependencies from diagram code
   */
  private extractDependencies(code: string): string[] {
    const dependencies: string[] = [];
    const nestedSyntaxRegex = /\{\{diagram:([^:]+):([\w-]+)\}\}/g;
    let match;

    while ((match = nestedSyntaxRegex.exec(code)) !== null) {
      const [, , id] = match;
      if (!dependencies.includes(id)) {
        dependencies.push(id);
      }
    }

    return dependencies;
  }

  /**
   * Detect circular references using DFS
   */
  private detectCircularReferences(): string[] | null {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const [id] of this.dependencyGraph) {
      if (!visited.has(id)) {
        const cycle = this.dfsCircularCheck(id, visited, recursionStack, []);
        if (cycle) {
          return cycle;
        }
      }
    }

    return null;
  }

  /**
   * DFS helper for circular reference detection
   */
  private dfsCircularCheck(
    nodeId: string, 
    visited: Set<string>, 
    recursionStack: Set<string>,
    path: string[]
  ): string[] | null {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const node = this.dependencyGraph.get(nodeId);
    if (node) {
      for (const depId of node.dependencies) {
        if (!visited.has(depId)) {
          const cycle = this.dfsCircularCheck(depId, visited, recursionStack, [...path]);
          if (cycle) {
            return cycle;
          }
        } else if (recursionStack.has(depId)) {
          // Found cycle
          const cycleStart = path.indexOf(depId);
          return path.slice(cycleStart).concat([depId]);
        }
      }
    }

    recursionStack.delete(nodeId);
    return null;
  }

  /**
   * Get diagram registry (for testing and debugging)
   */
  public getDiagramRegistry(): Map<string, string> {
    return new Map(this.diagramRegistry);
  }

  /**
   * Get dependency graph (for testing and debugging)
   */
  public getDependencyGraph(): Map<string, DiagramDependency> {
    return new Map(this.dependencyGraph);
  }

  /**
   * Get topological order of diagrams based on dependencies
   */
  public getTopologicalOrder(): TopologicalSortResult {
    const visited = new Set<string>();
    const tempMark = new Set<string>();
    const sortedOrder: string[] = [];

    const visit = (nodeId: string): boolean => {
      if (tempMark.has(nodeId)) {
        // Circular dependency detected
        return false;
      }
      if (visited.has(nodeId)) {
        return true;
      }

      tempMark.add(nodeId);
      const node = this.dependencyGraph.get(nodeId);
      
      if (node) {
        for (const depId of node.dependencies) {
          if (!visit(depId)) {
            return false;
          }
        }
      }

      tempMark.delete(nodeId);
      visited.add(nodeId);
      sortedOrder.push(nodeId); // Add to end - dependencies come first
      
      return true;
    };

    // Visit all nodes
    for (const [nodeId] of this.dependencyGraph) {
      if (!visited.has(nodeId)) {
        if (!visit(nodeId)) {
          return {
            success: false,
            sortedOrder: [],
            error: {
              type: ErrorTypeEnum.NESTED_ERROR,
              message: 'Circular dependency detected during topological sort'
            }
          };
        }
      }
    }

    return {
      success: true,
      sortedOrder,
    };
  }

  /**
   * Add listener for dependency changes
   */
  public addDependencyChangeListener(listener: (event: DependencyChangeEvent) => void): void {
    this.changeListeners.push(listener);
  }

  /**
   * Remove dependency change listener
   */
  public removeDependencyChangeListener(listener: (event: DependencyChangeEvent) => void): void {
    const index = this.changeListeners.indexOf(listener);
    if (index > -1) {
      this.changeListeners.splice(index, 1);
    }
  }

  /**
   * Notify listeners of dependency changes
   */
  private notifyDependencyChange(event: DependencyChangeEvent): void {
    this.changeListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in dependency change listener:', error);
      }
    });
  }

  /**
   * Update diagram code and handle dependency changes
   */
  public updateDiagram(diagramId: string, newCode: string): void {
    const oldCode = this.diagramRegistry.get(diagramId);
    const oldDependencies = oldCode ? this.extractDependencies(oldCode) : [];
    const newDependencies = this.extractDependencies(newCode);

    // Update registry
    this.diagramRegistry.set(diagramId, newCode);

    // Rebuild dependency graph
    this.buildDependencyGraph();

    // Determine affected diagrams
    const affectedDiagrams = new Set<string>();
    
    // Add diagrams that depend on this one
    const node = this.dependencyGraph.get(diagramId);
    if (node) {
      node.dependents.forEach(dep => affectedDiagrams.add(dep));
    }

    // Add diagrams that this one depends on
    newDependencies.forEach(dep => affectedDiagrams.add(dep));
    oldDependencies.forEach(dep => affectedDiagrams.add(dep));

    // Notify listeners
    const changeType = oldCode ? 'modified' : 'added';
    this.notifyDependencyChange({
      diagramId,
      changeType,
      affectedDiagrams: Array.from(affectedDiagrams)
    });
  }

  /**
   * Clear render cache (for external cache management)
   */
  public clearRenderCache(): void {
    // This method allows external components to signal cache clearing
    this.notifyDependencyChange({
      diagramId: 'all',
      changeType: 'modified',
      affectedDiagrams: Array.from(this.diagramRegistry.keys())
    });
  }

  /**
   * Remove diagram and handle dependency changes
   */
  public removeDiagram(diagramId: string): void {
    const oldCode = this.diagramRegistry.get(diagramId);
    if (!oldCode) {
      return;
    }

    const oldDependencies = this.extractDependencies(oldCode);
    
    // Get affected diagrams before removal
    const affectedDiagrams = new Set<string>();
    const node = this.dependencyGraph.get(diagramId);
    if (node) {
      node.dependents.forEach(dep => affectedDiagrams.add(dep));
    }
    oldDependencies.forEach(dep => affectedDiagrams.add(dep));

    // Remove from registry
    this.diagramRegistry.delete(diagramId);

    // Rebuild dependency graph
    this.buildDependencyGraph();

    // Notify listeners
    this.notifyDependencyChange({
      diagramId,
      changeType: 'removed',
      affectedDiagrams: Array.from(affectedDiagrams)
    });
  }

  /**
   * Get all diagrams that depend on the given diagram
   */
  public getDependents(diagramId: string): string[] {
    const node = this.dependencyGraph.get(diagramId);
    return node ? [...node.dependents] : [];
  }

  /**
   * Get all diagrams that the given diagram depends on
   */
  public getDependencies(diagramId: string): string[] {
    const node = this.dependencyGraph.get(diagramId);
    return node ? [...node.dependencies] : [];
  }

  /**
   * Check if diagram A depends on diagram B (directly or indirectly)
   */
  public hasDependency(diagramA: string, diagramB: string): boolean {
    const visited = new Set<string>();
    const stack = [diagramA];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);

      if (current === diagramB) {
        return true;
      }

      const node = this.dependencyGraph.get(current);
      if (node) {
        stack.push(...node.dependencies);
      }
    }

    return false;
  }

  /**
   * Get nesting depth warnings
   */
  public getNestingWarnings(): NestingDepthWarning[] {
    return [...this.nestingWarnings];
  }

  /**
   * Get maximum allowed nesting depth
   */
  public static getMaxNestingDepth(): number {
    return NestedDiagramProcessor.MAX_NESTING_DEPTH;
  }

  /**
   * Get warning threshold for nesting depth
   */
  public static getWarningNestingDepth(): number {
    return NestedDiagramProcessor.WARNING_NESTING_DEPTH;
  }

  /**
   * Clear all internal state
   */
  public clear(): void {
    this.diagramRegistry.clear();
    this.dependencyGraph.clear();
    this.changeListeners.length = 0;
    this.nestingWarnings.length = 0;
  }

  /**
   * Check if diagram content has changed
   */
  public hasContentChanged(code: string): boolean {
    const currentDefinitions = new Map<string, string>();
    const diagramDefinitionRegex = /---diagram:([^:]+):([\w-]+)---([\s\S]*?)---end---/g;
    let match;

    while ((match = diagramDefinitionRegex.exec(code)) !== null) {
      const [, type, id, content] = match;
      const cleanContent = content.trim();
      if (this.isValidDiagramType(type) && id && cleanContent) {
        currentDefinitions.set(id, cleanContent);
      }
    }

    // Check if any definitions changed
    for (const [id, content] of currentDefinitions) {
      if (this.diagramRegistry.get(id) !== content) {
        return true;
      }
    }

    // Check if any definitions were removed
    for (const [id] of this.diagramRegistry) {
      if (!currentDefinitions.has(id)) {
        return true;
      }
    }

    return false;
  }
}