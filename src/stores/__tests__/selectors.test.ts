import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../useAppStore';
import { 
  editorSelectors, 
  canvasSelectors, 
  diagramSelectors, 
  appSelectors,
  combinedSelectors 
} from '../selectors';
import { MermaidDiagramType } from '../../types/diagram';
import { ErrorType } from '../../types/error';
import type { DiagramNode, RenderedElement } from '../../types/diagram';
import type { DiagramError } from '../../types/error';

describe('Selectors', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAppStore.setState({
      editor: {
        position: 'right',
        code: '',
        cursorPosition: 0,
        history: [''],
        historyIndex: 0,
      },
      canvas: {
        zoomLevel: 1,
        panOffset: { x: 0, y: 0 },
        selectedElements: [],
        renderError: null,
      },
      diagram: {
        rootNode: null,
        flattenedNodes: new Map(),
        renderCache: new Map(),
      },
      isLoading: false,
      lastError: null,
    });
  });

  describe('Editor Selectors', () => {
    it('should get editor state', () => {
      const state = useAppStore.getState();
      const editorState = editorSelectors.getEditorState(state);
      
      expect(editorState).toEqual({
        position: 'right',
        code: '',
        cursorPosition: 0,
        history: [''],
        historyIndex: 0,
      });
    });

    it('should get current code', () => {
      const { updateCode } = useAppStore.getState();
      updateCode('graph TD\n  A --> B');
      
      const state = useAppStore.getState();
      expect(editorSelectors.getCurrentCode(state)).toBe('graph TD\n  A --> B');
    });

    it('should get editor position', () => {
      const { setEditorPosition } = useAppStore.getState();
      setEditorPosition('left');
      
      const state = useAppStore.getState();
      expect(editorSelectors.getEditorPosition(state)).toBe('left');
    });

    it('should check if editor is visible', () => {
      let state = useAppStore.getState();
      expect(editorSelectors.isEditorVisible(state)).toBe(true);
      
      const { setEditorPosition } = useAppStore.getState();
      setEditorPosition('hidden');
      
      state = useAppStore.getState();
      expect(editorSelectors.isEditorVisible(state)).toBe(false);
    });

    it('should check undo/redo availability', () => {
      const { updateCode, undo } = useAppStore.getState();
      
      let state = useAppStore.getState();
      expect(editorSelectors.canUndo(state)).toBe(false);
      expect(editorSelectors.canRedo(state)).toBe(false);
      
      updateCode('first');
      updateCode('second');
      
      state = useAppStore.getState();
      expect(editorSelectors.canUndo(state)).toBe(true);
      expect(editorSelectors.canRedo(state)).toBe(false);
      
      undo();
      
      state = useAppStore.getState();
      expect(editorSelectors.canUndo(state)).toBe(true);
      expect(editorSelectors.canRedo(state)).toBe(true);
    });
  });

  describe('Canvas Selectors', () => {
    it('should get canvas state', () => {
      const state = useAppStore.getState();
      const canvasState = canvasSelectors.getCanvasState(state);
      
      expect(canvasState).toEqual({
        zoomLevel: 1,
        panOffset: { x: 0, y: 0 },
        selectedElements: [],
        renderError: null,
      });
    });

    it('should get zoom level', () => {
      const { setZoomLevel } = useAppStore.getState();
      setZoomLevel(2.5);
      
      const state = useAppStore.getState();
      expect(canvasSelectors.getZoomLevel(state)).toBe(2.5);
    });

    it('should get pan offset', () => {
      const { setPanOffset } = useAppStore.getState();
      setPanOffset({ x: 100, y: 200 });
      
      const state = useAppStore.getState();
      expect(canvasSelectors.getPanOffset(state)).toEqual({ x: 100, y: 200 });
    });

    it('should check selected elements', () => {
      const { setSelectedElements } = useAppStore.getState();
      
      let state = useAppStore.getState();
      expect(canvasSelectors.hasSelectedElements(state)).toBe(false);
      
      setSelectedElements(['element1', 'element2']);
      
      state = useAppStore.getState();
      expect(canvasSelectors.getSelectedElements(state)).toEqual(['element1', 'element2']);
      expect(canvasSelectors.hasSelectedElements(state)).toBe(true);
    });

    it('should check render error', () => {
      const { setRenderError } = useAppStore.getState();
      
      let state = useAppStore.getState();
      expect(canvasSelectors.hasRenderError(state)).toBe(false);
      expect(canvasSelectors.getRenderError(state)).toBeNull();
      
      setRenderError('Syntax error');
      
      state = useAppStore.getState();
      expect(canvasSelectors.hasRenderError(state)).toBe(true);
      expect(canvasSelectors.getRenderError(state)).toBe('Syntax error');
    });
  });

  describe('Diagram Selectors', () => {
    it('should get diagram state', () => {
      const state = useAppStore.getState();
      const diagramState = diagramSelectors.getDiagramState(state);
      
      expect(diagramState.rootNode).toBeNull();
      expect(diagramState.flattenedNodes).toBeInstanceOf(Map);
      expect(diagramState.renderCache).toBeInstanceOf(Map);
    });

    it('should check diagram content', () => {
      const { setRootNode } = useAppStore.getState();
      
      let state = useAppStore.getState();
      expect(diagramSelectors.hasDiagramContent(state)).toBe(false);
      
      const mockNode: DiagramNode = {
        id: 'root',
        type: MermaidDiagramType.FLOWCHART,
        code: 'graph TD\n  A --> B',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        children: [],
      };
      
      setRootNode(mockNode);
      
      state = useAppStore.getState();
      expect(diagramSelectors.hasDiagramContent(state)).toBe(true);
      expect(diagramSelectors.getRootNode(state)).toEqual(mockNode);
    });

    it('should handle render cache operations', () => {
      const { updateRenderCache } = useAppStore.getState();
      
      const mockElement: RenderedElement = {
        id: 'element1',
        svgContent: '<svg>test</svg>',
        boundingBox: { width: 100, height: 100 },
        renderTime: Date.now(),
      };
      
      let state = useAppStore.getState();
      expect(diagramSelectors.isElementCached(state, 'element1')).toBe(false);
      expect(diagramSelectors.getCacheSize(state)).toBe(0);
      
      updateRenderCache('element1', mockElement);
      
      state = useAppStore.getState();
      expect(diagramSelectors.isElementCached(state, 'element1')).toBe(true);
      expect(diagramSelectors.getCachedElement(state, 'element1')).toEqual(mockElement);
      expect(diagramSelectors.getCacheSize(state)).toBe(1);
    });
  });

  describe('App Selectors', () => {
    it('should check loading state', () => {
      const { setLoading } = useAppStore.getState();
      
      let state = useAppStore.getState();
      expect(appSelectors.isLoading(state)).toBe(false);
      
      setLoading(true);
      
      state = useAppStore.getState();
      expect(appSelectors.isLoading(state)).toBe(true);
    });

    it('should check error state', () => {
      const { setLastError } = useAppStore.getState();
      
      let state = useAppStore.getState();
      expect(appSelectors.hasError(state)).toBe(false);
      expect(appSelectors.getLastError(state)).toBeNull();
      
      const mockError: DiagramError = {
        type: ErrorType.SYNTAX_ERROR,
        message: 'Invalid syntax',
      };
      
      setLastError(mockError);
      
      state = useAppStore.getState();
      expect(appSelectors.hasError(state)).toBe(true);
      expect(appSelectors.getLastError(state)).toEqual(mockError);
    });

    it('should check app ready state', () => {
      const { setLoading, setLastError } = useAppStore.getState();
      
      let state = useAppStore.getState();
      expect(appSelectors.isAppReady(state)).toBe(true);
      
      setLoading(true);
      state = useAppStore.getState();
      expect(appSelectors.isAppReady(state)).toBe(false);
      
      setLoading(false);
      const mockError: DiagramError = {
        type: ErrorType.SYNTAX_ERROR,
        message: 'Invalid syntax',
      };
      setLastError(mockError);
      
      state = useAppStore.getState();
      expect(appSelectors.isAppReady(state)).toBe(false);
    });
  });

  describe('Combined Selectors', () => {
    it('should get editor layout info', () => {
      const { setEditorPosition } = useAppStore.getState();
      
      let state = useAppStore.getState();
      let layout = combinedSelectors.getEditorLayout(state);
      expect(layout).toEqual({
        position: 'right',
        isVisible: true,
        canvasWidth: '70%',
      });
      
      setEditorPosition('hidden');
      
      state = useAppStore.getState();
      layout = combinedSelectors.getEditorLayout(state);
      expect(layout).toEqual({
        position: 'hidden',
        isVisible: false,
        canvasWidth: '100%',
      });
    });

    it('should get canvas interaction state', () => {
      const { setZoomLevel, setPanOffset, setSelectedElements, setLoading, setRenderError } = useAppStore.getState();
      
      setZoomLevel(1.5);
      setPanOffset({ x: 50, y: 100 });
      setSelectedElements(['element1']);
      
      let state = useAppStore.getState();
      let interactionState = combinedSelectors.getCanvasInteractionState(state);
      expect(interactionState).toEqual({
        zoomLevel: 1.5,
        panOffset: { x: 50, y: 100 },
        selectedElements: ['element1'],
        hasSelection: true,
        isInteractive: true,
      });
      
      setLoading(true);
      state = useAppStore.getState();
      interactionState = combinedSelectors.getCanvasInteractionState(state);
      expect(interactionState.isInteractive).toBe(false);
      
      setLoading(false);
      setRenderError('Error');
      state = useAppStore.getState();
      interactionState = combinedSelectors.getCanvasInteractionState(state);
      expect(interactionState.isInteractive).toBe(false);
    });

    it('should get overall app status', () => {
      const { updateCode, setRootNode, setLoading } = useAppStore.getState();
      
      let state = useAppStore.getState();
      let status = combinedSelectors.getAppStatus(state);
      expect(status).toEqual({
        isLoading: false,
        hasError: false,
        hasContent: false,
        hasDiagram: false,
        isReady: true,
      });
      
      updateCode('graph TD\n  A --> B');
      const mockNode: DiagramNode = {
        id: 'root',
        type: MermaidDiagramType.FLOWCHART,
        code: 'graph TD\n  A --> B',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        children: [],
      };
      setRootNode(mockNode);
      
      state = useAppStore.getState();
      status = combinedSelectors.getAppStatus(state);
      expect(status.hasContent).toBe(true);
      expect(status.hasDiagram).toBe(true);
      
      setLoading(true);
      state = useAppStore.getState();
      status = combinedSelectors.getAppStatus(state);
      expect(status.isLoading).toBe(true);
      expect(status.isReady).toBe(false);
    });
  });
});