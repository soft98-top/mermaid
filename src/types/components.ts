import type { EditorPosition } from './state';

/**
 * Code editor component props
 */
export interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onError: (error: string | null) => void;
  position: EditorPosition;
  className?: string;
}

/**
 * Editor features configuration
 */
export interface EditorFeatures {
  syntaxHighlighting: boolean;
  autoCompletion: boolean;
  errorDetection: boolean;
  undoRedo: boolean;
}

/**
 * Diagram canvas component props
 */
export interface DiagramCanvasProps {
  code: string;
  onRenderComplete: () => void;
  onRenderError: (error: string) => void;
  className?: string;
}

/**
 * Canvas state for internal component management
 */
export interface CanvasComponentState {
  zoomLevel: number;
  panOffset: { x: number; y: number };
  selectedElement: string | null;
}



/**
 * Nested diagram processor interface
 */
export interface NestedDiagramProcessorProps {
  parseNestedSyntax: (code: string) => any;
  renderNestedDiagram: (diagram: any) => Promise<any>;
  handleNestedInteraction: (elementId: string) => void;
}

/**
 * App component state interface
 */
export interface AppState {
  editorPosition: EditorPosition;
  currentCode: string;
  renderError: string | null;
  isLoading: boolean;
}

/**
 * Position toggle button props
 */
export interface PositionToggleProps {
  currentPosition: EditorPosition;
  onToggle: (position: EditorPosition) => void;
  className?: string;
}

/**
 * Error display component props
 */
export interface ErrorDisplayProps {
  error: string | null;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Loading indicator props
 */
export interface LoadingIndicatorProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}