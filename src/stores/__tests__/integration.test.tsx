import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useAppStore } from '../useAppStore';
import { editorSelectors, canvasSelectors } from '../selectors';

// Test component that uses the store
function TestComponent() {
  const { 
    editor, 
    canvas, 
    updateCode, 
    setEditorPosition, 
    setZoomLevel 
  } = useAppStore();
  
  const canUndo = editorSelectors.canUndo(useAppStore.getState());
  const hasSelection = canvasSelectors.hasSelectedElements(useAppStore.getState());

  return (
    <div>
      <div data-testid="editor-position">{editor.position}</div>
      <div data-testid="current-code">{editor.code}</div>
      <div data-testid="zoom-level">{canvas.zoomLevel}</div>
      <div data-testid="can-undo">{canUndo.toString()}</div>
      <div data-testid="has-selection">{hasSelection.toString()}</div>
      
      <button 
        data-testid="update-code" 
        onClick={() => updateCode('graph TD\n  A --> B')}
      >
        Update Code
      </button>
      
      <button 
        data-testid="toggle-position" 
        onClick={() => setEditorPosition(editor.position === 'left' ? 'right' : 'left')}
      >
        Toggle Position
      </button>
      
      <button 
        data-testid="zoom-in" 
        onClick={() => setZoomLevel(canvas.zoomLevel + 0.5)}
      >
        Zoom In
      </button>
    </div>
  );
}

describe('Store Integration with React', () => {
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

  it('should render initial state correctly', () => {
    render(<TestComponent />);
    
    expect(screen.getByTestId('editor-position')).toHaveTextContent('right');
    expect(screen.getByTestId('current-code')).toHaveTextContent('');
    expect(screen.getByTestId('zoom-level')).toHaveTextContent('1');
    expect(screen.getByTestId('can-undo')).toHaveTextContent('false');
    expect(screen.getByTestId('has-selection')).toHaveTextContent('false');
  });

  it('should update state when actions are called', () => {
    render(<TestComponent />);
    
    // Update code
    fireEvent.click(screen.getByTestId('update-code'));
    expect(screen.getByTestId('current-code')).toHaveTextContent('graph TD A --> B');
    expect(screen.getByTestId('can-undo')).toHaveTextContent('true');
    
    // Toggle position
    fireEvent.click(screen.getByTestId('toggle-position'));
    expect(screen.getByTestId('editor-position')).toHaveTextContent('left');
    
    // Zoom in
    fireEvent.click(screen.getByTestId('zoom-in'));
    expect(screen.getByTestId('zoom-level')).toHaveTextContent('1.5');
  });

  it('should maintain state consistency across multiple updates', () => {
    render(<TestComponent />);
    
    // Perform multiple actions
    fireEvent.click(screen.getByTestId('update-code'));
    fireEvent.click(screen.getByTestId('toggle-position'));
    fireEvent.click(screen.getByTestId('zoom-in'));
    fireEvent.click(screen.getByTestId('zoom-in'));
    
    // Verify all state changes are reflected
    expect(screen.getByTestId('current-code')).toHaveTextContent('graph TD A --> B');
    expect(screen.getByTestId('editor-position')).toHaveTextContent('left');
    expect(screen.getByTestId('zoom-level')).toHaveTextContent('2');
    expect(screen.getByTestId('can-undo')).toHaveTextContent('true');
  });

  it('should work with selectors', () => {
    const { rerender } = render(<TestComponent />);
    
    // Initially no selection and can't undo
    expect(screen.getByTestId('can-undo')).toHaveTextContent('false');
    expect(screen.getByTestId('has-selection')).toHaveTextContent('false');
    
    // Update code to enable undo
    fireEvent.click(screen.getByTestId('update-code'));
    expect(screen.getByTestId('can-undo')).toHaveTextContent('true');
    
    // Add selection programmatically
    useAppStore.getState().setSelectedElements(['element1']);
    
    // Re-render to get updated selector values
    rerender(<TestComponent />);
    expect(screen.getByTestId('has-selection')).toHaveTextContent('true');
  });
});