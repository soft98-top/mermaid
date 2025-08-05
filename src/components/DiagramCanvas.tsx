import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { DiagramCanvasProps } from '../types/components';
import { mermaidService } from '../services/mermaidService';
import { NestedDiagramProcessor } from '../services/nestedDiagramProcessor';
import { errorHandlingService } from '../services/errorHandlingService';
import type { ParsedDiagram, RenderedElement } from '../types/diagram';
import type { DiagramError } from '../types/error';
import { useAppStore } from '../stores/useAppStore';
import { useRenderCache, usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

/**
 * Nested diagram state for managing expanded/collapsed state
 */
interface NestedDiagramState {
  expandedDiagrams: Set<string>;
  diagramPositions: Map<string, { x: number; y: number }>;
  renderCache: Map<string, RenderedElement>;
}

/**
 * Canvas interaction state for zoom, pan, and touch gestures
 */
interface CanvasInteractionState {
  isDragging: boolean;
  dragStart: { x: number; y: number };
  lastPanOffset: { x: number; y: number };
  isZooming: boolean;
  touchStartDistance: number;
  lastTouchCenter: { x: number; y: number };
}

/**
 * Canvas bounds for boundary detection
 */
interface CanvasBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  contentWidth: number;
  contentHeight: number;
}

/**
 * DiagramCanvas component for rendering Mermaid diagrams
 * Supports all standard Mermaid diagram types with nested diagram functionality
 */
export const DiagramCanvas: React.FC<DiagramCanvasProps> = ({
  code,
  onRenderComplete,
  onRenderError,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [currentDiagramId, setCurrentDiagramId] = useState<string>('');
  const [renderError, setRenderError] = useState<DiagramError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [nestedProcessor] = useState(() => new NestedDiagramProcessor());
  const [nestedState, setNestedState] = useState<NestedDiagramState>({
    expandedDiagrams: new Set(),
    diagramPositions: new Map(),
    renderCache: new Map(),
  });
  
  // Performance optimization hooks
  const { getCachedRender, generateCacheKey, isLargeDiagram } = useRenderCache();
  const { measureRender } = usePerformanceMonitor();
  
  // Use refs to avoid dependency issues
  const nestedStateRef = useRef(nestedState);
  nestedStateRef.current = nestedState;

  // Get canvas state and actions from store
  const { 
    canvas, 
    setZoomLevel, 
    setPanOffset
  } = useAppStore();

  // Local interaction state
  const [interactionState, setInteractionState] = useState<CanvasInteractionState>({
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    lastPanOffset: { x: 0, y: 0 },
    isZooming: false,
    touchStartDistance: 0,
    lastTouchCenter: { x: 0, y: 0 },
  });

  // Canvas bounds for boundary detection
  const [canvasBounds, setCanvasBounds] = useState<CanvasBounds>({
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,
    contentWidth: 0,
    contentHeight: 0,
  });

  // Initialize Mermaid configuration
  useEffect(() => {
    mermaidService.initialize();
  }, []);



  // Utility function to calculate distance between two points (for touch gestures)
  const calculateDistance = useCallback((touch1: React.Touch, touch2: React.Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Utility function to calculate center point between two touches
  const calculateTouchCenter = useCallback((touch1: React.Touch, touch2: React.Touch): { x: number; y: number } => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }, []);

  // Update canvas bounds based on content size
  const updateCanvasBounds = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();

    const contentWidth = contentRect.width;
    const contentHeight = contentRect.height;
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Calculate bounds considering zoom level
    const scaledContentWidth = contentWidth * canvas.zoomLevel;
    const scaledContentHeight = contentHeight * canvas.zoomLevel;

    const minX = Math.min(0, containerWidth - scaledContentWidth);
    const maxX = Math.max(0, scaledContentWidth - containerWidth);
    const minY = Math.min(0, containerHeight - scaledContentHeight);
    const maxY = Math.max(0, scaledContentHeight - containerHeight);

    setCanvasBounds({
      minX,
      maxX,
      minY,
      maxY,
      contentWidth: scaledContentWidth,
      contentHeight: scaledContentHeight,
    });
  }, [canvas.zoomLevel]);

  // Constrain pan offset to canvas bounds (allow free movement for small content)
  const constrainPanOffset = useCallback((offset: { x: number; y: number }): { x: number; y: number } => {
    // If content is smaller than canvas, allow free movement
    if (!containerRef.current || !contentRef.current) return offset;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const svgElement = contentRef.current.querySelector('svg');
    if (!svgElement) return offset;
    
    const svgRect = svgElement.getBoundingClientRect();
    const contentWidth = svgRect.width * canvas.zoomLevel;
    const contentHeight = svgRect.height * canvas.zoomLevel;
    
    // If content is smaller than container, don't constrain
    if (contentWidth <= containerRect.width && contentHeight <= containerRect.height) {
      return offset;
    }
    
    // Otherwise apply normal constraints
    return {
      x: Math.max(canvasBounds.minX, Math.min(canvasBounds.maxX, offset.x)),
      y: Math.max(canvasBounds.minY, Math.min(canvasBounds.maxY, offset.y)),
    };
  }, [canvasBounds, canvas.zoomLevel]);

  // Auto-center content in canvas
  const centerContent = useCallback(() => {
    if (!containerRef.current || !contentRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    // Wait for content to be rendered
    setTimeout(() => {
      const svgElement = contentRef.current?.querySelector('svg');
      if (!svgElement) return;
      
      const svgRect = svgElement.getBoundingClientRect();
      const contentWidth = svgRect.width;
      const contentHeight = svgRect.height;

      // Calculate center position
      const centerX = (containerWidth - contentWidth) / 2;
      const centerY = (containerHeight - contentHeight) / 2;

      setPanOffset({ x: centerX, y: centerY });
    }, 100);
  }, [setPanOffset]);

  // Mouse event handlers for pan functionality
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button !== 0) return; // Only handle left mouse button

    event.preventDefault();
    setInteractionState(prev => ({
      ...prev,
      isDragging: true,
      dragStart: { x: event.clientX, y: event.clientY },
      lastPanOffset: canvas.panOffset,
    }));
  }, [canvas.panOffset]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!interactionState.isDragging) return;

    event.preventDefault();
    const deltaX = event.clientX - interactionState.dragStart.x;
    const deltaY = event.clientY - interactionState.dragStart.y;

    const newOffset = {
      x: interactionState.lastPanOffset.x + deltaX,
      y: interactionState.lastPanOffset.y + deltaY,
    };

    setPanOffset(newOffset);
  }, [interactionState, constrainPanOffset, setPanOffset]);

  const handleMouseUp = useCallback(() => {
    setInteractionState(prev => {
      if (prev.isDragging) {
        setUserHasMoved(true); // Mark that user has moved the canvas
      }
      return {
        ...prev,
        isDragging: false,
      };
    });
  }, []);

  // Wheel event handler for zoom functionality
  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoomLevel = canvas.zoomLevel * zoomFactor;
    
    // Clamp zoom level between 0.1 and 5
    const clampedZoomLevel = Math.max(0.1, Math.min(5, newZoomLevel));
    
    if (clampedZoomLevel !== canvas.zoomLevel) {
      setZoomLevel(clampedZoomLevel);
      
      // Adjust pan offset to zoom towards mouse position
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        const zoomRatio = clampedZoomLevel / canvas.zoomLevel;
        const newPanOffset = {
          x: mouseX - (mouseX - canvas.panOffset.x) * zoomRatio,
          y: mouseY - (mouseY - canvas.panOffset.y) * zoomRatio,
        };
        
        setPanOffset(newPanOffset);
      }
    }
  }, [canvas.zoomLevel, canvas.panOffset, setZoomLevel, setPanOffset, constrainPanOffset]);

  // Effect to manage wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  // Touch event handlers for mobile support
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    
    if (event.touches.length === 1) {
      // Single touch - start panning
      const touch = event.touches[0];
      setInteractionState(prev => ({
        ...prev,
        isDragging: true,
        dragStart: { x: touch.clientX, y: touch.clientY },
        lastPanOffset: canvas.panOffset,
      }));
    } else if (event.touches.length === 2) {
      // Two touches - start zooming
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const distance = calculateDistance(touch1, touch2);
      const center = calculateTouchCenter(touch1, touch2);
      
      setInteractionState(prev => ({
        ...prev,
        isDragging: false,
        isZooming: true,
        touchStartDistance: distance,
        lastTouchCenter: center,
      }));
    }
  }, [canvas.panOffset, calculateDistance, calculateTouchCenter]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    
    if (event.touches.length === 1 && interactionState.isDragging) {
      // Single touch - panning
      const touch = event.touches[0];
      const deltaX = touch.clientX - interactionState.dragStart.x;
      const deltaY = touch.clientY - interactionState.dragStart.y;

      const newOffset = {
        x: interactionState.lastPanOffset.x + deltaX,
        y: interactionState.lastPanOffset.y + deltaY,
      };

      setPanOffset(newOffset);
    } else if (event.touches.length === 2 && interactionState.isZooming) {
      // Two touches - zooming
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const distance = calculateDistance(touch1, touch2);
      const center = calculateTouchCenter(touch1, touch2);
      
      if (interactionState.touchStartDistance > 0) {
        const zoomFactor = distance / interactionState.touchStartDistance;
        const newZoomLevel = canvas.zoomLevel * zoomFactor;
        const clampedZoomLevel = Math.max(0.1, Math.min(5, newZoomLevel));
        
        if (clampedZoomLevel !== canvas.zoomLevel) {
          setZoomLevel(clampedZoomLevel);
          
          // Adjust pan offset to zoom towards touch center
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            const touchX = center.x - rect.left;
            const touchY = center.y - rect.top;
            
            const zoomRatio = clampedZoomLevel / canvas.zoomLevel;
            const newPanOffset = {
              x: touchX - (touchX - canvas.panOffset.x) * zoomRatio,
              y: touchY - (touchY - canvas.panOffset.y) * zoomRatio,
            };
            
            setPanOffset(newPanOffset);
          }
        }
        
        // Update touch state for next iteration
        setInteractionState(prev => ({
          ...prev,
          touchStartDistance: distance,
          lastTouchCenter: center,
        }));
      }
    }
  }, [interactionState, canvas.zoomLevel, canvas.panOffset, constrainPanOffset, setPanOffset, setZoomLevel, calculateDistance, calculateTouchCenter]);

  const handleTouchEnd = useCallback(() => {
    setInteractionState(prev => ({
      ...prev,
      isDragging: false,
      isZooming: false,
      touchStartDistance: 0,
    }));
  }, []);

  // Handle nested diagram interaction (expand/collapse)
  const handleNestedInteraction = useCallback((diagramId: string, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    setNestedState(prev => {
      const newExpandedDiagrams = new Set(prev.expandedDiagrams);
      
      if (newExpandedDiagrams.has(diagramId)) {
        newExpandedDiagrams.delete(diagramId);
      } else {
        newExpandedDiagrams.add(diagramId);
      }

      return {
        ...prev,
        expandedDiagrams: newExpandedDiagrams,
      };
    });
  }, []);

  // Calculate position and size for nested diagram based on main diagram orientation
  const calculateNestedPositionAndSize = useCallback((
    parentElement: Element,
    nestedId: string,
    _index: number
  ): { x: number; y: number; width: number; height: number; isVertical: boolean } => {
    if (!parentElement || !contentRef.current) {
      return { x: 100, y: 100, width: 400, height: 300, isVertical: false };
    }

    const svgElement = contentRef.current.querySelector('svg');
    if (!svgElement) {
      return { x: 100, y: 100, width: 400, height: 300, isVertical: false };
    }

    // Get actual SVG dimensions from width/height attributes or viewBox
    let svgWidth = parseFloat(svgElement.getAttribute('width') || '0');
    let svgHeight = parseFloat(svgElement.getAttribute('height') || '0');
    
    // If no width/height attributes, use viewBox
    if (!svgWidth || !svgHeight) {
      const viewBox = svgElement.viewBox.baseVal;
      svgWidth = viewBox.width;
      svgHeight = viewBox.height;
    }
    
    // If still no dimensions, fallback to computed size without zoom
    if (!svgWidth || !svgHeight) {
      const rect = svgElement.getBoundingClientRect();
      svgWidth = rect.width / canvas.zoomLevel;
      svgHeight = rect.height / canvas.zoomLevel;
    }
    
    // Determine orientation: vertical if height > width
    const isVertical = svgHeight > svgWidth;
    const currentIndex = Array.from(nestedStateRef.current.expandedDiagrams).indexOf(nestedId);
    
    if (isVertical) {
      // Height-based: height = main diagram actual height
      const result = {
        x: svgWidth + 50 + (currentIndex * 400),
        y: 0,
        width: 400,
        height: svgHeight, // Use actual SVG height
        isVertical: true
      };
      return result;
    } else {
      // Width-based: width = main diagram actual width
      const result = {
        x: 0,
        y: svgHeight + 50 + (currentIndex * 300),
        width: svgWidth, // Use actual SVG width
        height: 300,
        isVertical: false
      };
      return result;
    }
  }, []);

  // Render nested diagram with caching
  const renderNestedDiagram = useCallback(async (
    parsedDiagram: ParsedDiagram,
    diagramId: string,
    _position: { x: number; y: number }
  ): Promise<RenderedElement | null> => {
    try {
      // Generate cache key for nested diagram
      const cacheKey = generateCacheKey(parsedDiagram.content, parsedDiagram.type);
      
      // Use cached render with performance measurement
      const renderResult = await getCachedRender(cacheKey, async () => {
        const nestedDiagramId = `nested-${diagramId}-${Date.now()}`;
        
        // Measure render performance
        const { result } = await measureRender(async () => {
          return await mermaidService.renderDiagram(nestedDiagramId, parsedDiagram.content);
        });
        
        if (!result || !result.svg) {
          throw new Error('渲染结果为空');
        }
        
        const renderedElement: RenderedElement = {
          id: diagramId,
          svgContent: result.svg,
          boundingBox: { width: 0, height: 0 },
          renderTime: Date.now(),
        };
        
        return renderedElement;
      });

      // Update local cache for nested state
      setNestedState(prev => {
        const newCache = new Map(prev.renderCache);
        newCache.set(diagramId, renderResult as RenderedElement);
        return {
          ...prev,
          renderCache: newCache,
        };
      });

      return renderResult as RenderedElement;
    } catch (error) {
      console.error(`Error rendering nested diagram ${diagramId}:`, error);
      
      // Return error placeholder
      const errorSvg = `
        <svg width="300" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#fef2f2" stroke="#fecaca" stroke-width="2" rx="8"/>
          <text x="50%" y="30%" text-anchor="middle" fill="#dc2626" font-size="14" font-weight="bold">
            嵌套图表渲染错误
          </text>
          <text x="50%" y="60%" text-anchor="middle" fill="#991b1b" font-size="12">
            ${diagramId}: ${error instanceof Error ? error.message : '未知错误'}
          </text>
        </svg>
      `;

      return {
        id: diagramId,
        svgContent: errorSvg,
        boundingBox: { width: 300, height: 100 },
        renderTime: Date.now(),
      };
    }
  }, [getCachedRender, generateCacheKey, measureRender]);

  // Retry mechanism for failed renders
  const retryRender = useCallback(async (code: string, diagramId: string) => {
    if (!renderError) return;

    setIsRetrying(true);
    
    try {
      let recoveryResult;
      try {
        recoveryResult = await errorHandlingService.attemptRecovery(
          code,
          renderError,
          diagramId
        );
      } catch (recoveryError) {
        console.error('Recovery service error:', recoveryError);
        recoveryResult = { success: false, error: renderError };
      }

      if (recoveryResult.success && recoveryResult.result) {
        // Success - clear error and render
        setRenderError(null);
        setRetryCount(0);
        onRenderComplete();
        
        // Update content with successful result
        if (contentRef.current && recoveryResult.result?.svg) {
          const mainContainer = document.createElement('div');
          mainContainer.className = 'relative w-full h-full';
          mainContainer.innerHTML = recoveryResult.result.svg;
          const currentRef = contentRef.current;
          currentRef.innerHTML = '';
          currentRef.appendChild(mainContainer);
        }
      } else {
        // Retry failed
        setRenderError(recoveryResult.error || renderError);
        setRetryCount(prev => prev + 1);
        onRenderError(recoveryResult.error?.message || renderError.message);
      }
    } catch (error) {
      console.error('Retry failed:', error);
      setRetryCount(prev => prev + 1);
    } finally {
      setIsRetrying(false);
    }
  }, [renderError, onRenderComplete, onRenderError]);

  // Render diagram with nested support and performance optimization
  const renderDiagram = useCallback(async (code: string) => {
    if (!contentRef.current || !code.trim()) {
      return;
    }

    setIsRendering(true);
    setRenderError(null);
    setRetryCount(0);
    const newDiagramId = mermaidService.generateDiagramId();
    setCurrentDiagramId(newDiagramId);
    
    // Check if this is a large diagram that needs optimization
    const isLarge = isLargeDiagram(code);
    if (isLarge) {
      console.log('Large diagram detected, applying optimizations');
    }

    try {
      // Clear previous content
      if (contentRef.current) {
        contentRef.current.innerHTML = '';
      }

      // Skip validation for simple cases, let Mermaid handle it
      // Only validate if it's clearly malformed
      if (!code.trim()) {
        return;
      }

      // Parse nested syntax
      let parseResult;
      try {
        if (nestedProcessor && typeof nestedProcessor.parseNestedSyntax === 'function') {
          parseResult = nestedProcessor.parseNestedSyntax(code);
        } else {
          throw new Error('Nested processor not available');
        }
      } catch (parseError) {
        console.error('Nested processor error:', parseError);
        const message = parseError instanceof Error ? parseError.message : '嵌套语法解析失败';
        const nestedError: DiagramError = {
          type: 'nested_error',
          message: `Processor Error: ${message}`,
          line: 1,
          column: 1,
        };
        throw nestedError;
      }
      
      if (!parseResult.success) {
        const nestedError: DiagramError = {
          type: 'nested_error',
          message: parseResult.error?.message || '嵌套语法解析失败',
          line: 1,
          column: 1,
        };
        throw nestedError;
      }

      const parsedDiagram = parseResult.parsedDiagram;
      if (!parsedDiagram) {
        throw new Error('解析结果为空');
      }

      // Render the main diagram with caching and performance measurement
      const cacheKey = generateCacheKey(parsedDiagram.content, parsedDiagram.type);
      let renderResult;
      
      try {
        // Use cached render with performance measurement
        const cachedResult = await getCachedRender(cacheKey, async () => {
          const { result } = await measureRender(async () => {
            return await mermaidService.renderDiagram(newDiagramId, parsedDiagram.content);
          });
          
          return {
            id: newDiagramId,
            svgContent: result.svg,
            boundingBox: { width: 0, height: 0 },
            renderTime: Date.now(),
          };
        });
        
        renderResult = { svg: (cachedResult as RenderedElement).svgContent };
      } catch (renderError) {
        console.error('Mermaid render error:', renderError);
        throw new Error(`图表渲染失败: ${renderError instanceof Error ? renderError.message : '未知错误'}`);
      }
      
      if (!renderResult || !renderResult.svg) {
        throw new Error('渲染结果为空');
      }
      
      const { svg } = renderResult;
      
      // Create main container
      const mainContainer = document.createElement('div');
      mainContainer.className = 'relative w-full h-full';
      mainContainer.innerHTML = svg;

      // Add responsive styling to the main SVG
      const svgElement = mainContainer.querySelector('svg');
      if (svgElement) {
        try {
          svgElement.style.maxWidth = 'none'; // Remove max-width to allow scaling
          svgElement.style.height = 'auto';
          svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          
          // Find and setup clickable elements for nested diagrams
          const allElements = svgElement.querySelectorAll('*');
          allElements.forEach((el) => {
            const textContent = el.textContent?.trim();
            if (textContent && parsedDiagram.nestedDiagrams.has(textContent)) {
              el.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                handleNestedInteraction(textContent, event as MouseEvent);
              });
              
              if (el instanceof SVGElement || el instanceof HTMLElement) {
                el.style.cursor = 'pointer';
                el.style.color = '#2563eb';
              }
            }
          });
        } catch (svgError) {
          console.error('SVG processing error:', svgError);
        }
      }

      // Insert the main diagram
      if (contentRef.current) {
        contentRef.current.appendChild(mainContainer);
      }

      // Render expanded nested diagrams
      if (parsedDiagram.nestedDiagrams && parsedDiagram.nestedDiagrams.size > 0) {
        let nestedIndex = 0;
        
        for (const [nestedId, nestedDiagram] of parsedDiagram.nestedDiagrams) {
          try {
            if (nestedStateRef.current?.expandedDiagrams?.has(nestedId)) {
              // Find the clicked element for positioning
              const clickedElement = Array.from(svgElement?.querySelectorAll('*') || []).find(el => 
                el.textContent?.trim() === nestedId
              );
              
              const positionAndSize = calculateNestedPositionAndSize(clickedElement || document.createElement('div'), nestedId, nestedIndex);
                
              // Update position in state
              setNestedState(prev => {
                const newPositions = new Map(prev.diagramPositions);
                newPositions.set(nestedId, { x: positionAndSize.x, y: positionAndSize.y });
                return {
                  ...prev,
                  diagramPositions: newPositions,
                };
              });

              // Render nested diagram
              const renderedNested = await renderNestedDiagram(nestedDiagram, nestedId, { x: positionAndSize.x, y: positionAndSize.y });
                
              if (renderedNested && renderedNested.svgContent) {
                // Create nested diagram container (positioned within the SVG coordinate space)
                const nestedContainer = document.createElement('div');
                nestedContainer.className = 'nested-diagram-container absolute bg-white border-2 border-blue-200 rounded-lg shadow-lg p-4 z-10';
                nestedContainer.style.left = `${positionAndSize.x}px`;
                nestedContainer.style.top = `${positionAndSize.y}px`;
                nestedContainer.style.width = `${positionAndSize.width}px`;
                nestedContainer.style.height = `${positionAndSize.height}px`;
                  
                  // Add close button
                  const closeButton = document.createElement('button');
                  closeButton.className = 'absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center';
                  closeButton.innerHTML = '×';
                  closeButton.onclick = (event) => {
                    try {
                      handleNestedInteraction(nestedId, event as MouseEvent);
                    } catch (closeError) {
                      console.error('Close button error:', closeError);
                    }
                  };
                  
                  // Add nested diagram content
                  const nestedContent = document.createElement('div');
                  nestedContent.className = 'mt-6';
                  nestedContent.innerHTML = renderedNested.svgContent;
                  
                  // Add responsive styling to nested SVG
                  const nestedSvg = nestedContent.querySelector('svg');
                  if (nestedSvg) {
                    try {
                      // Remove original dimensions
                      nestedSvg.removeAttribute('width');
                      nestedSvg.removeAttribute('height');
                      
                      if (positionAndSize.isVertical) {
                        // Vertical: fix height, scale width proportionally
                        nestedSvg.style.height = '100%';
                        nestedSvg.style.width = 'auto';
                        nestedSvg.style.maxWidth = 'none';
                      } else {
                        // Horizontal: fix width, scale height proportionally
                        nestedSvg.style.width = '100%';
                        nestedSvg.style.height = 'auto';
                        nestedSvg.style.maxHeight = 'none';
                      }
                      nestedSvg.style.fontSize = '14px';
                      nestedSvg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                    } catch (nestedSvgError) {
                      console.error('Nested SVG styling error:', nestedSvgError);
                    }
                  }

                nestedContainer.appendChild(closeButton);
                nestedContainer.appendChild(nestedContent);
                mainContainer.appendChild(nestedContainer);
                
                // Store container reference for later adjustment
                nestedContainer.setAttribute('data-nested-id', nestedId);
                nestedContainer.setAttribute('data-is-vertical', positionAndSize.isVertical.toString());
                
                nestedIndex++;
              }
            }
          } catch (nestedRenderError) {
            console.error(`Error rendering nested diagram ${nestedId}:`, nestedRenderError);
            // Continue with other nested diagrams
          }
        }
      }

      // Auto-adjust all nested containers and reposition
      setTimeout(() => {
        const nestedContainers = mainContainer.querySelectorAll('.nested-diagram-container');
        const adjustedSizes = new Map<string, { width: number; height: number }>();
        
        // Get main SVG dimensions from original attributes/viewBox
        const mainSvg = svgElement;
        let svgWidth = parseFloat(mainSvg?.getAttribute('width') || '0');
        let svgHeight = parseFloat(mainSvg?.getAttribute('height') || '0');
        
        if (!svgWidth || !svgHeight) {
          const viewBox = mainSvg?.viewBox.baseVal;
          svgWidth = viewBox?.width || 800;
          svgHeight = viewBox?.height || 600;
        }
        
        // First pass: adjust sizes based on main SVG dimensions
        nestedContainers.forEach((container) => {
          const nestedId = container.getAttribute('data-nested-id');
          const isVertical = container.getAttribute('data-is-vertical') === 'true';
          const nestedSvg = container.querySelector('svg');
          
          if (nestedSvg && nestedId) {
            // Get nested SVG original dimensions
            let nestedWidth = parseFloat(nestedSvg.getAttribute('width') || '0');
            let nestedHeight = parseFloat(nestedSvg.getAttribute('height') || '0');
            
            if (!nestedWidth || !nestedHeight) {
              const viewBox = nestedSvg.viewBox.baseVal;
              nestedWidth = viewBox.width || 400;
              nestedHeight = viewBox.height || 300;
            }
            
            if (isVertical) {
              // Use main SVG height as reference
              const targetHeight = svgHeight;
              const scale = targetHeight / nestedHeight;
              const adjustedWidth = nestedWidth * scale + 32;
              adjustedSizes.set(nestedId, { width: adjustedWidth, height: targetHeight + 32 });
            } else {
              // Use main SVG width as reference
              const targetWidth = svgWidth;
              const scale = targetWidth / nestedWidth;
              const adjustedHeight = nestedHeight * scale + 32;
              adjustedSizes.set(nestedId, { width: targetWidth + 32, height: adjustedHeight });
            }
          }
        });
        
        console.log('Final adjusted sizes:', adjustedSizes);
        
        // Second pass: apply sizes and reposition
        const expandedIds = Array.from(nestedStateRef.current.expandedDiagrams);
        expandedIds.forEach((nestedId, index) => {
          const container = mainContainer.querySelector(`[data-nested-id="${nestedId}"]`) as HTMLElement;
          const adjustedSize = adjustedSizes.get(nestedId);
          const isVertical = container?.getAttribute('data-is-vertical') === 'true';
          
          if (container && adjustedSize) {
            // Apply adjusted size
            container.style.width = `${adjustedSize.width}px`;
            container.style.height = `${adjustedSize.height}px`;
            
            // Recalculate position based on adjusted sizes
            if (isVertical) {
              let totalWidth = 0;
              for (let i = 0; i < index; i++) {
                const prevId = expandedIds[i];
                const prevSize = adjustedSizes.get(prevId);
                if (prevSize) totalWidth += prevSize.width + 50;
              }
              container.style.left = `${svgWidth + 50 + totalWidth}px`;
            } else {
              let totalHeight = 0;
              for (let i = 0; i < index; i++) {
                const prevId = expandedIds[i];
                const prevSize = adjustedSizes.get(prevId);
                if (prevSize) totalHeight += prevSize.height + 50;
              }
              container.style.top = `${svgHeight + 50 + totalHeight}px`;
            }
          }
        });
      }, 150);
      
      // Show warnings if any
      if (parseResult.warnings.length > 0) {
        console.warn('Nesting depth warnings:', parseResult.warnings);
        
        // Display warning in UI
        const warningContainer = document.createElement('div');
        warningContainer.className = 'absolute top-2 right-2 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded text-sm max-w-xs';
        warningContainer.innerHTML = `
          <div class="font-semibold">嵌套深度警告</div>
          <div class="text-xs mt-1">检测到深层嵌套 (深度: ${parseResult.warnings[0]?.currentDepth})</div>
        `;
        mainContainer.appendChild(warningContainer);
      }

      onRenderComplete();
    } catch (error) {
      console.error('Diagram rendering error:', error);
      
      // Convert error to DiagramError format
      let diagramError: DiagramError;
      
      if (error && typeof error === 'object' && 'type' in error) {
        diagramError = error as DiagramError;
      } else {
        diagramError = {
          type: 'render_error',
          message: error instanceof Error ? error.message : '图表渲染失败',
          line: 1,
          column: 1,
        };
      }
      
      setRenderError(diagramError);
      
      // Display enhanced error message in the container
      if (contentRef.current) {
        const currentRef = contentRef.current;
        const suggestions = errorHandlingService.getErrorSuggestions(diagramError, code);
        const recoveryOptions = errorHandlingService.getRecoveryOptions();
        
        currentRef.innerHTML = `
          <div class="flex items-center justify-center min-h-64 bg-red-50 border-2 border-red-200 rounded-lg p-6">
            <div class="text-center max-w-md">
              <div class="text-red-600 text-xl font-semibold mb-3 flex items-center justify-center">
                <svg class="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                图表渲染错误
              </div>
              
              <div class="text-red-700 text-sm mb-4 p-3 bg-red-100 rounded border-l-4 border-red-400">
                ${diagramError.message}
              </div>
              
              ${suggestions.length > 0 ? `
                <div class="text-left mb-4">
                  <div class="text-red-800 font-medium text-sm mb-2">💡 建议解决方案:</div>
                  <ul class="text-red-700 text-sm space-y-1">
                    ${suggestions.map(suggestion => `
                      <li class="flex items-start">
                        <span class="text-red-500 mr-2">•</span>
                        <span>${suggestion}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}
              
              ${recoveryOptions.autoRetry ? `
                <div class="flex justify-center space-x-3">
                  <button 
                    onclick="window.retryRender && window.retryRender()"
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    🔄 重试渲染
                  </button>
                  <button 
                    onclick="window.clearError && window.clearError()"
                    class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    ✕ 清除错误
                  </button>
                </div>
              ` : ''}
            </div>
          </div>
        `;
        
        // Add retry functionality to window for button access
        (window as any).retryRender = () => retryRender(code, newDiagramId);
        (window as any).clearError = () => {
          setRenderError(null);
          errorHandlingService.clearRetryAttempts(newDiagramId);
          if (contentRef.current) {
            contentRef.current.innerHTML = `
              <div class="flex items-center justify-center h-64 bg-gray-50 border-2 border-gray-200 rounded-lg">
                <div class="text-gray-500 text-lg">请修复代码错误后重新渲染</div>
              </div>
            `;
          }
        };
      }

      onRenderError(diagramError.message);
    } finally {
      setIsRendering(false);
    }
  }, [onRenderComplete, onRenderError, getCachedRender, generateCacheKey, measureRender, isLargeDiagram]);





  // Effect to update canvas bounds when zoom level changes
  useEffect(() => {
    updateCanvasBounds();
  }, [canvas.zoomLevel, updateCanvasBounds]);

  // Track if user has manually moved the canvas
  const [userHasMoved, setUserHasMoved] = useState(false);
  const [lastCode, setLastCode] = useState('');
  
  // Effect to center content only when code changes and user hasn't moved
  useEffect(() => {
    if (code.trim() && code !== lastCode) {
      const timeoutId = setTimeout(() => {
        centerContent();
        setLastCode(code);
        setUserHasMoved(false); // Reset move flag for new content
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }
  }, [code, lastCode, centerContent]);

  // Effect to handle global mouse events for dragging
  useEffect(() => {
    if (interactionState.isDragging) {
      const handleGlobalMouseMove = (event: MouseEvent) => {
        const deltaX = event.clientX - interactionState.dragStart.x;
        const deltaY = event.clientY - interactionState.dragStart.y;

        const newOffset = {
          x: interactionState.lastPanOffset.x + deltaX,
          y: interactionState.lastPanOffset.y + deltaY,
        };

        setPanOffset(newOffset);
      };

      const handleGlobalMouseUp = () => {
        setInteractionState(prev => ({
          ...prev,
          isDragging: false,
        }));
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [interactionState, constrainPanOffset, setPanOffset]);

  // Effect to render diagram when code changes
  useEffect(() => {
    const doRender = async () => {
      if (code.trim()) {
        // Clear render cache if nested content has changed
        if (nestedProcessor.hasContentChanged(code)) {
          setNestedState(prev => ({
            ...prev,
            renderCache: new Map(),
          }));
        }
        await renderDiagram(code);
      } else {
        // Clear canvas when code is empty
        if (contentRef.current) {
          contentRef.current.innerHTML = `
            <div class="flex items-center justify-center h-64 bg-gray-50 border-2 border-gray-200 rounded-lg">
              <div class="text-gray-500 text-lg">请在编辑器中输入Mermaid代码</div>
            </div>
          `;
        }
        
        // Clear nested state when code is empty
        setNestedState({
          expandedDiagrams: new Set(),
          diagramPositions: new Map(),
          renderCache: new Map(),
        });
        
        setLastCode(''); // Allow re-centering on new content
        setUserHasMoved(false); // Reset move flag
      }
    };
    
    doRender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Effect to re-render when nested state changes (expand/collapse)
  useEffect(() => {
    const doRender = async () => {
      if (code.trim()) {
        const currentOffset = canvas.panOffset;
        await renderDiagram(code);
        // Restore position if user has moved the canvas
        if (userHasMoved) {
          setPanOffset(currentOffset);
        }
      }
    };
    
    doRender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nestedState.expandedDiagrams]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Clear nested processor state
      nestedProcessor.clear();
    };
  }, [nestedProcessor]);

  return (
    <div className={`diagram-canvas relative w-full h-full ${className}`} style={{ position: 'relative' }}>
      {/* Rendering indicator */}
      {isRendering && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-blue-600">渲染中...</span>
          </div>
        </div>
      )}

      {/* Retry indicator */}
      {isRetrying && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
            <span className="text-orange-600">重试中... (第{retryCount + 1}次)</span>
          </div>
        </div>
      )}

      {/* Error recovery panel */}
      {renderError && !isRendering && !isRetrying && (
        <div className="absolute top-4 left-4 right-4 z-10 bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center">
                <div className="text-red-800 font-medium text-sm">
                  渲染失败 {renderError.line && `(第${renderError.line}行)`}
                </div>
                <div className="ml-2 text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                  {renderError.type.replace('_', ' ').toUpperCase()}
                </div>
              </div>
              <div className="text-red-700 text-sm mt-1">{renderError.message}</div>
              
              <div className="flex items-center space-x-2 mt-2">
                <button
                  onClick={() => retryRender(code, currentDiagramId)}
                  disabled={isRetrying}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  🔄 重试
                </button>
                <button
                  onClick={() => {
                    setRenderError(null);
                    errorHandlingService.clearRetryAttempts(currentDiagramId);
                  }}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700 transition-colors"
                >
                  ✕ 关闭
                </button>
                {retryCount > 0 && (
                  <span className="text-xs text-red-600">
                    已重试 {retryCount} 次
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
        data-testid="diagram-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          touchAction: 'none',
          contain: 'layout style paint',
        }}
      >
        {/* Canvas controls */}
        <div 
          className="no-export"
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 px-4 py-3">
            <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>🔍 {Math.round(canvas.zoomLevel * 100)}%</span>
            </div>
          </div>
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-2">
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => setZoomLevel(Math.min(5, canvas.zoomLevel * 1.2))}
                className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-110 shadow-lg flex items-center justify-center font-bold text-lg"
                title="放大"
              >
                +
              </button>
              <button
                onClick={() => setZoomLevel(Math.max(0.1, canvas.zoomLevel * 0.8))}
                className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-110 shadow-lg flex items-center justify-center font-bold text-lg"
                title="缩小"
              >
                −
              </button>
              <button
                onClick={() => {
                  setZoomLevel(1);
                  setTimeout(() => centerContent(), 100);
                }}
                className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 transform hover:scale-110 shadow-lg flex items-center justify-center text-lg"
                title="重置"
              >
                🏠
              </button>
            </div>
          </div>
        </div>
        <div
          ref={contentRef}
          className="absolute inset-0"
          style={{
            transform: `translate(${canvas.panOffset.x}px, ${canvas.panOffset.y}px) scale(${canvas.zoomLevel})`,
            transformOrigin: '0 0',
            transition: interactionState.isDragging || interactionState.isZooming ? 'none' : 'transform 0.2s ease-out',
            willChange: 'transform',
          }}
        />
      </div>
    </div>
  );
};

export default DiagramCanvas;