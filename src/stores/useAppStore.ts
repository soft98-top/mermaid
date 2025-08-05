import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { 
  ApplicationState, 
  ApplicationActions, 
  EditorPosition 
} from '../types/state';
import type { DiagramNode, RenderedElement } from '../types/diagram';
import type { DiagramError } from '../types/error';
import type { ThemeMode } from '../types/theme';
import { themeService } from '../services/themeService';

/**
 * Combined store interface including state and actions
 */
export interface AppStore extends ApplicationState, ApplicationActions {}

/**
 * Initial state for the application
 */
const initialState: ApplicationState = {
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
  ui: {
    theme: themeService.loadThemePreference(),
    showKeyboardHelp: false,
    showPerformanceMonitor: false,
    isAccessibilityMode: false,
  },
  isLoading: false,
  lastError: null,
};

/**
 * Main application store using Zustand
 */
export const useAppStore = create<AppStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // Editor actions
      setEditorPosition: (position: EditorPosition) =>
        set(
          (state) => ({
            editor: {
              ...state.editor,
              position,
            },
          }),
          false,
          'setEditorPosition'
        ),

      updateCode: (code: string) =>
        set(
          (state) => {
            const newHistory = [...state.editor.history];
            const newIndex = state.editor.historyIndex + 1;
            
            // Remove any history after current index (for redo functionality)
            newHistory.splice(newIndex);
            newHistory.push(code);
            
            // Limit history to 50 entries
            if (newHistory.length > 50) {
              newHistory.shift();
            }

            return {
              editor: {
                ...state.editor,
                code,
                history: newHistory,
                historyIndex: newHistory.length - 1,
              },
            };
          },
          false,
          'updateCode'
        ),

      setRenderError: (error: string | null) =>
        set(
          (state) => ({
            canvas: {
              ...state.canvas,
              renderError: error,
            },
          }),
          false,
          'setRenderError'
        ),

      // Canvas actions
      setZoomLevel: (level: number) =>
        set(
          (state) => ({
            canvas: {
              ...state.canvas,
              zoomLevel: Math.max(0.1, Math.min(5, level)), // Clamp between 0.1 and 5
            },
          }),
          false,
          'setZoomLevel'
        ),

      setPanOffset: (offset: { x: number; y: number }) =>
        set(
          (state) => ({
            canvas: {
              ...state.canvas,
              panOffset: offset,
            },
          }),
          false,
          'setPanOffset'
        ),

      setSelectedElements: (elements: string[]) =>
        set(
          (state) => ({
            canvas: {
              ...state.canvas,
              selectedElements: elements,
            },
          }),
          false,
          'setSelectedElements'
        ),

      // Diagram actions
      setRootNode: (node: DiagramNode | null) =>
        set(
          (state) => ({
            diagram: {
              ...state.diagram,
              rootNode: node,
            },
          }),
          false,
          'setRootNode'
        ),

      updateRenderCache: (id: string, element: RenderedElement) =>
        set(
          (state) => {
            const newCache = new Map(state.diagram.renderCache);
            newCache.set(id, element);
            return {
              diagram: {
                ...state.diagram,
                renderCache: newCache,
              },
            };
          },
          false,
          'updateRenderCache'
        ),

      // General actions
      setLoading: (loading: boolean) =>
        set(
          { isLoading: loading },
          false,
          'setLoading'
        ),

      setLastError: (error: DiagramError | null) =>
        set(
          { lastError: error },
          false,
          'setLastError'
        ),

      // Additional utility actions
      undo: () =>
        set(
          (state) => {
            if (state.editor.historyIndex > 0) {
              const newIndex = state.editor.historyIndex - 1;
              return {
                editor: {
                  ...state.editor,
                  code: state.editor.history[newIndex],
                  historyIndex: newIndex,
                },
              };
            }
            return state;
          },
          false,
          'undo'
        ),

      redo: () =>
        set(
          (state) => {
            if (state.editor.historyIndex < state.editor.history.length - 1) {
              const newIndex = state.editor.historyIndex + 1;
              return {
                editor: {
                  ...state.editor,
                  code: state.editor.history[newIndex],
                  historyIndex: newIndex,
                },
              };
            }
            return state;
          },
          false,
          'redo'
        ),

      clearRenderCache: () =>
        set(
          (state) => ({
            diagram: {
              ...state.diagram,
              renderCache: new Map(),
            },
          }),
          false,
          'clearRenderCache'
        ),

      resetCanvas: () =>
        set(
          (state) => ({
            canvas: {
              ...state.canvas,
              zoomLevel: 1,
              panOffset: { x: 0, y: 0 },
              selectedElements: [],
            },
          }),
          false,
          'resetCanvas'
        ),

      resetEditor: () =>
        set(
          (state) => ({
            editor: {
              ...state.editor,
              code: '',
              cursorPosition: 0,
              history: [''],
              historyIndex: 0,
            },
          }),
          false,
          'resetEditor'
        ),

      // UI actions
      setTheme: (theme: ThemeMode) =>
        set(
          (state) => {
            themeService.saveThemePreference(theme);
            const themeObj = themeService.getTheme(theme);
            themeService.applyTheme(themeObj);
            
            return {
              ui: {
                ...state.ui,
                theme,
              },
            };
          },
          false,
          'setTheme'
        ),

      toggleTheme: () =>
        set(
          (state) => {
            const currentTheme = state.ui.theme;
            const nextTheme: ThemeMode = 
              currentTheme === 'light' ? 'dark' : 
              currentTheme === 'dark' ? 'system' : 'light';
            
            themeService.saveThemePreference(nextTheme);
            const themeObj = themeService.getTheme(nextTheme);
            themeService.applyTheme(themeObj);
            
            return {
              ui: {
                ...state.ui,
                theme: nextTheme,
              },
            };
          },
          false,
          'toggleTheme'
        ),

      setShowKeyboardHelp: (show: boolean) =>
        set(
          (state) => ({
            ui: {
              ...state.ui,
              showKeyboardHelp: show,
            },
          }),
          false,
          'setShowKeyboardHelp'
        ),

      setShowPerformanceMonitor: (show: boolean) =>
        set(
          (state) => ({
            ui: {
              ...state.ui,
              showPerformanceMonitor: show,
            },
          }),
          false,
          'setShowPerformanceMonitor'
        ),

      setAccessibilityMode: (enabled: boolean) =>
        set(
          (state) => ({
            ui: {
              ...state.ui,
              isAccessibilityMode: enabled,
            },
          }),
          false,
          'setAccessibilityMode'
        ),
    }),
    {
      name: 'mermaid-renderer-store',
    }
  )
);