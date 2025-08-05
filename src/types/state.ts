import type { DiagramNode, RenderedElement } from './diagram';
import type { DiagramError } from './error';
import type { ThemeMode } from './theme';

/**
 * Editor position options
 */
export type EditorPosition = 'left' | 'right' | 'hidden';

/**
 * Editor state interface
 */
export interface EditorState {
  position: EditorPosition;
  code: string;
  cursorPosition: number;
  history: string[];
  historyIndex: number;
}

/**
 * Canvas state interface
 */
export interface CanvasState {
  zoomLevel: number;
  panOffset: { x: number; y: number };
  selectedElements: string[];
  renderError: string | null;
}

/**
 * Diagram state interface
 */
export interface DiagramState {
  rootNode: DiagramNode | null;
  flattenedNodes: Map<string, DiagramNode>;
  renderCache: Map<string, RenderedElement>;
}

/**
 * UI state interface
 */
export interface UIState {
  theme: ThemeMode;
  showKeyboardHelp: boolean;
  showPerformanceMonitor: boolean;
  isAccessibilityMode: boolean;
}

/**
 * Main application state interface
 */
export interface ApplicationState {
  editor: EditorState;
  canvas: CanvasState;
  diagram: DiagramState;
  ui: UIState;
  isLoading: boolean;
  lastError: DiagramError | null;
}

/**
 * Application actions interface
 */
export interface ApplicationActions {
  // Editor actions
  setEditorPosition: (position: EditorPosition) => void;
  updateCode: (code: string) => void;
  setRenderError: (error: string | null) => void;
  undo: () => void;
  redo: () => void;
  resetEditor: () => void;
  
  // Canvas actions
  setZoomLevel: (level: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  setSelectedElements: (elements: string[]) => void;
  resetCanvas: () => void;
  
  // Diagram actions
  setRootNode: (node: DiagramNode | null) => void;
  updateRenderCache: (id: string, element: RenderedElement) => void;
  clearRenderCache: () => void;
  
  // UI actions
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setShowKeyboardHelp: (show: boolean) => void;
  setShowPerformanceMonitor: (show: boolean) => void;
  setAccessibilityMode: (enabled: boolean) => void;
  
  // General actions
  setLoading: (loading: boolean) => void;
  setLastError: (error: DiagramError | null) => void;
}