/**
 * Mermaid diagram types supported by the application
 */
export const MermaidDiagramType = {
  FLOWCHART: 'flowchart',
  SEQUENCE: 'sequence',
  GANTT: 'gantt',
  CLASS: 'class',
  STATE: 'state',
  PIE: 'pie',
  GIT: 'git',
  ER: 'er',
  JOURNEY: 'journey'
} as const;

export type MermaidDiagramType = typeof MermaidDiagramType[keyof typeof MermaidDiagramType];

/**
 * Position coordinates for diagram elements
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Size dimensions for diagram elements
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Diagram node representing a single diagram or nested diagram
 */
export interface DiagramNode {
  id: string;
  type: MermaidDiagramType;
  code: string;
  position: Position;
  size: Size;
  children: DiagramNode[];
  parent?: string;
}

/**
 * Parsed diagram structure with nested diagram information
 */
export interface ParsedDiagram {
  type: MermaidDiagramType;
  content: string;
  nestedDiagrams: Map<string, ParsedDiagram>;
  parentReferences: string[];
}

/**
 * Rendered diagram element information
 */
export interface RenderedElement {
  id: string;
  svgContent: string;
  boundingBox: Size;
  renderTime: number;
}

/**
 * Nested syntax extension configuration
 */
export interface NestedSyntaxExtension {
  nestedMarker: RegExp;
  diagramRegistry: Map<string, string>;
}