import type { AppStore } from './useAppStore';

/**
 * Editor selectors
 */
export const editorSelectors = {
  // Get current editor state
  getEditorState: (state: AppStore) => state.editor,
  
  // Get current code
  getCurrentCode: (state: AppStore) => state.editor.code,
  
  // Get editor position
  getEditorPosition: (state: AppStore) => state.editor.position,
  
  // Check if editor is visible
  isEditorVisible: (state: AppStore) => state.editor.position !== 'hidden',
  
  // Check if undo is available
  canUndo: (state: AppStore) => state.editor.historyIndex > 0,
  
  // Check if redo is available
  canRedo: (state: AppStore) => 
    state.editor.historyIndex < state.editor.history.length - 1,
  
  // Get cursor position
  getCursorPosition: (state: AppStore) => state.editor.cursorPosition,
};

/**
 * Canvas selectors
 */
export const canvasSelectors = {
  // Get current canvas state
  getCanvasState: (state: AppStore) => state.canvas,
  
  // Get zoom level
  getZoomLevel: (state: AppStore) => state.canvas.zoomLevel,
  
  // Get pan offset
  getPanOffset: (state: AppStore) => state.canvas.panOffset,
  
  // Get selected elements
  getSelectedElements: (state: AppStore) => state.canvas.selectedElements,
  
  // Check if any elements are selected
  hasSelectedElements: (state: AppStore) => state.canvas.selectedElements.length > 0,
  
  // Get render error
  getRenderError: (state: AppStore) => state.canvas.renderError,
  
  // Check if there's a render error
  hasRenderError: (state: AppStore) => state.canvas.renderError !== null,
};

/**
 * Diagram selectors
 */
export const diagramSelectors = {
  // Get current diagram state
  getDiagramState: (state: AppStore) => state.diagram,
  
  // Get root node
  getRootNode: (state: AppStore) => state.diagram.rootNode,
  
  // Check if diagram has content
  hasDiagramContent: (state: AppStore) => state.diagram.rootNode !== null,
  
  // Get flattened nodes
  getFlattenedNodes: (state: AppStore) => state.diagram.flattenedNodes,
  
  // Get render cache
  getRenderCache: (state: AppStore) => state.diagram.renderCache,
  
  // Get cached element by ID
  getCachedElement: (state: AppStore, id: string) => 
    state.diagram.renderCache.get(id),
  
  // Check if element is cached
  isElementCached: (state: AppStore, id: string) => 
    state.diagram.renderCache.has(id),
  
  // Get cache size
  getCacheSize: (state: AppStore) => state.diagram.renderCache.size,
};

/**
 * General application selectors
 */
export const appSelectors = {
  // Check if app is loading
  isLoading: (state: AppStore) => state.isLoading,
  
  // Get last error
  getLastError: (state: AppStore) => state.lastError,
  
  // Check if there's an error
  hasError: (state: AppStore) => state.lastError !== null,
  
  // Get app ready state (not loading and no critical errors)
  isAppReady: (state: AppStore) => 
    !state.isLoading && state.lastError === null,
};

/**
 * Combined selectors for complex state queries
 */
export const combinedSelectors = {
  // Get editor layout info
  getEditorLayout: (state: AppStore) => ({
    position: state.editor.position,
    isVisible: state.editor.position !== 'hidden',
    canvasWidth: state.editor.position === 'hidden' ? '100%' : '70%',
  }),
  
  // Get canvas interaction state
  getCanvasInteractionState: (state: AppStore) => ({
    zoomLevel: state.canvas.zoomLevel,
    panOffset: state.canvas.panOffset,
    selectedElements: state.canvas.selectedElements,
    hasSelection: state.canvas.selectedElements.length > 0,
    isInteractive: !state.isLoading && state.canvas.renderError === null,
  }),
  
  // Get overall app status
  getAppStatus: (state: AppStore) => ({
    isLoading: state.isLoading,
    hasError: state.lastError !== null || state.canvas.renderError !== null,
    hasContent: state.editor.code.length > 0,
    hasDiagram: state.diagram.rootNode !== null,
    isReady: !state.isLoading && state.lastError === null,
  }),
};