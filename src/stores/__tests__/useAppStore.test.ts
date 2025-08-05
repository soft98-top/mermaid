import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../useAppStore';
import { MermaidDiagramType } from '../../types/diagram';
import { ErrorType } from '../../types/error';
import type { DiagramNode, RenderedElement } from '../../types/diagram';
import type { DiagramError } from '../../types/error';

describe('useAppStore', () => {
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

  describe('Editor Actions', () => {
    it('should set editor position', () => {
      const { setEditorPosition } = useAppStore.getState();
      
      setEditorPosition('left');
      expect(useAppStore.getState().editor.position).toBe('left');
      
      setEditorPosition('hidden');
      expect(useAppStore.getState().editor.position).toBe('hidden');
    });

    it('should update code and maintain history', () => {
      const { updateCode } = useAppStore.getState();
      
      updateCode('graph TD\n  A --> B');
      const state1 = useAppStore.getState();
      expect(state1.editor.code).toBe('graph TD\n  A --> B');
      expect(state1.editor.history).toHaveLength(2);
      expect(state1.editor.historyIndex).toBe(1);
      
      updateCode('graph TD\n  A --> B\n  B --> C');
      const state2 = useAppStore.getState();
      expect(state2.editor.code).toBe('graph TD\n  A --> B\n  B --> C');
      expect(state2.editor.history).toHaveLength(3);
      expect(state2.editor.historyIndex).toBe(2);
    });

    it('should limit history to 50 entries', () => {
      const { updateCode } = useAppStore.getState();
      
      // Add 52 entries to test limit
      for (let i = 0; i < 52; i++) {
        updateCode(`code ${i}`);
      }
      
      const state = useAppStore.getState();
      expect(state.editor.history).toHaveLength(50);
      expect(state.editor.code).toBe('code 51');
    });

    it('should handle undo functionality', () => {
      const { updateCode, undo } = useAppStore.getState();
      
      updateCode('first');
      updateCode('second');
      updateCode('third');
      
      undo();
      expect(useAppStore.getState().editor.code).toBe('second');
      
      undo();
      expect(useAppStore.getState().editor.code).toBe('first');
      
      undo();
      expect(useAppStore.getState().editor.code).toBe('');
      
      // Should not undo beyond first entry
      undo();
      expect(useAppStore.getState().editor.code).toBe('');
    });

    it('should handle redo functionality', () => {
      const { updateCode, undo, redo } = useAppStore.getState();
      
      updateCode('first');
      updateCode('second');
      undo();
      undo();
      
      redo();
      expect(useAppStore.getState().editor.code).toBe('first');
      
      redo();
      expect(useAppStore.getState().editor.code).toBe('second');
      
      // Should not redo beyond last entry
      redo();
      expect(useAppStore.getState().editor.code).toBe('second');
    });

    it('should reset editor state', () => {
      const { updateCode, setEditorPosition, resetEditor } = useAppStore.getState();
      
      updateCode('some code');
      setEditorPosition('left');
      
      resetEditor();
      const state = useAppStore.getState();
      expect(state.editor.code).toBe('');
      expect(state.editor.cursorPosition).toBe(0);
      expect(state.editor.history).toEqual(['']);
      expect(state.editor.historyIndex).toBe(0);
      // Position should not be reset
      expect(state.editor.position).toBe('left');
    });
  });

  describe('Canvas Actions', () => {
    it('should set zoom level with bounds', () => {
      const { setZoomLevel } = useAppStore.getState();
      
      setZoomLevel(2.5);
      expect(useAppStore.getState().canvas.zoomLevel).toBe(2.5);
      
      // Test upper bound
      setZoomLevel(10);
      expect(useAppStore.getState().canvas.zoomLevel).toBe(5);
      
      // Test lower bound
      setZoomLevel(0.05);
      expect(useAppStore.getState().canvas.zoomLevel).toBe(0.1);
    });

    it('should set pan offset', () => {
      const { setPanOffset } = useAppStore.getState();
      
      setPanOffset({ x: 100, y: 200 });
      expect(useAppStore.getState().canvas.panOffset).toEqual({ x: 100, y: 200 });
    });

    it('should set selected elements', () => {
      const { setSelectedElements } = useAppStore.getState();
      
      setSelectedElements(['element1', 'element2']);
      expect(useAppStore.getState().canvas.selectedElements).toEqual(['element1', 'element2']);
    });

    it('should set render error', () => {
      const { setRenderError } = useAppStore.getState();
      
      setRenderError('Syntax error');
      expect(useAppStore.getState().canvas.renderError).toBe('Syntax error');
      
      setRenderError(null);
      expect(useAppStore.getState().canvas.renderError).toBeNull();
    });

    it('should reset canvas state', () => {
      const { setZoomLevel, setPanOffset, setSelectedElements, resetCanvas } = useAppStore.getState();
      
      setZoomLevel(2);
      setPanOffset({ x: 100, y: 200 });
      setSelectedElements(['element1']);
      
      resetCanvas();
      const state = useAppStore.getState();
      expect(state.canvas.zoomLevel).toBe(1);
      expect(state.canvas.panOffset).toEqual({ x: 0, y: 0 });
      expect(state.canvas.selectedElements).toEqual([]);
    });
  });

  describe('Diagram Actions', () => {
    it('should set root node', () => {
      const { setRootNode } = useAppStore.getState();
      
      const mockNode: DiagramNode = {
        id: 'root',
        type: MermaidDiagramType.FLOWCHART,
        code: 'graph TD\n  A --> B',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        children: [],
      };
      
      setRootNode(mockNode);
      expect(useAppStore.getState().diagram.rootNode).toEqual(mockNode);
      
      setRootNode(null);
      expect(useAppStore.getState().diagram.rootNode).toBeNull();
    });

    it('should update render cache', () => {
      const { updateRenderCache } = useAppStore.getState();
      
      const mockElement: RenderedElement = {
        id: 'element1',
        svgContent: '<svg>test</svg>',
        boundingBox: { width: 100, height: 100 },
        renderTime: Date.now(),
      };
      
      updateRenderCache('element1', mockElement);
      expect(useAppStore.getState().diagram.renderCache.get('element1')).toEqual(mockElement);
    });

    it('should clear render cache', () => {
      const { updateRenderCache, clearRenderCache } = useAppStore.getState();
      
      const mockElement: RenderedElement = {
        id: 'element1',
        svgContent: '<svg>test</svg>',
        boundingBox: { width: 100, height: 100 },
        renderTime: Date.now(),
      };
      
      updateRenderCache('element1', mockElement);
      expect(useAppStore.getState().diagram.renderCache.size).toBe(1);
      
      clearRenderCache();
      expect(useAppStore.getState().diagram.renderCache.size).toBe(0);
    });
  });

  describe('General Actions', () => {
    it('should set loading state', () => {
      const { setLoading } = useAppStore.getState();
      
      setLoading(true);
      expect(useAppStore.getState().isLoading).toBe(true);
      
      setLoading(false);
      expect(useAppStore.getState().isLoading).toBe(false);
    });

    it('should set last error', () => {
      const { setLastError } = useAppStore.getState();
      
      const mockError: DiagramError = {
        type: ErrorType.SYNTAX_ERROR,
        message: 'Invalid syntax',
        line: 5,
        column: 10,
      };
      
      setLastError(mockError);
      expect(useAppStore.getState().lastError).toEqual(mockError);
      
      setLastError(null);
      expect(useAppStore.getState().lastError).toBeNull();
    });
  });

  describe('State Integration', () => {
    it('should maintain state consistency across multiple actions', () => {
      const { 
        updateCode, 
        setEditorPosition, 
        setZoomLevel, 
        setLoading 
      } = useAppStore.getState();
      
      updateCode('graph TD\n  A --> B');
      setEditorPosition('left');
      setZoomLevel(1.5);
      setLoading(true);
      
      const state = useAppStore.getState();
      expect(state.editor.code).toBe('graph TD\n  A --> B');
      expect(state.editor.position).toBe('left');
      expect(state.canvas.zoomLevel).toBe(1.5);
      expect(state.isLoading).toBe(true);
    });

    it('should handle complex undo/redo scenarios', () => {
      const { updateCode, undo, redo } = useAppStore.getState();
      
      updateCode('first');
      updateCode('second');
      updateCode('third');
      
      undo(); // back to 'second'
      updateCode('new third'); // should clear redo history
      
      redo(); // should not change anything
      expect(useAppStore.getState().editor.code).toBe('new third');
      
      undo();
      expect(useAppStore.getState().editor.code).toBe('second');
    });
  });
});