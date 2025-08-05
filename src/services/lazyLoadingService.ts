/**
 * Lazy loading service for optimizing large diagram rendering
 */
export class LazyLoadingService {
  private static instance: LazyLoadingService;
  private intersectionObserver: IntersectionObserver | null = null;
  private pendingRenders = new Map<string, () => Promise<void>>();

  private constructor() {
    this.initializeIntersectionObserver();
  }

  public static getInstance(): LazyLoadingService {
    if (!LazyLoadingService.instance) {
      LazyLoadingService.instance = new LazyLoadingService();
    }
    return LazyLoadingService.instance;
  }

  /**
   * Initialize intersection observer for viewport detection
   */
  private initializeIntersectionObserver(): void {
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      return;
    }

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const elementId = entry.target.getAttribute('data-lazy-id');
            if (elementId && this.pendingRenders.has(elementId)) {
              const renderFn = this.pendingRenders.get(elementId);
              if (renderFn) {
                renderFn();
                this.pendingRenders.delete(elementId);
                this.intersectionObserver?.unobserve(entry.target);
              }
            }
          }
        });
      },
      {
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0.1,
      }
    );
  }

  /**
   * Register element for lazy loading
   */
  public registerLazyElement(
    element: HTMLElement,
    id: string,
    renderFn: () => Promise<void>
  ): void {
    if (!this.intersectionObserver) {
      // Fallback: render immediately if no intersection observer
      renderFn();
      return;
    }

    element.setAttribute('data-lazy-id', id);
    this.pendingRenders.set(id, renderFn);
    this.intersectionObserver.observe(element);
  }

  /**
   * Create placeholder for lazy-loaded content
   */
  public createPlaceholder(width: number, height: number): HTMLElement {
    const placeholder = document.createElement('div');
    placeholder.className = 'lazy-placeholder bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center';
    placeholder.style.width = `${width}px`;
    placeholder.style.height = `${height}px`;
    placeholder.style.minHeight = '200px';
    
    placeholder.innerHTML = `
      <div class="text-center text-gray-500">
        <div class="animate-pulse">
          <div class="w-8 h-8 bg-gray-300 rounded-full mx-auto mb-2"></div>
          <div class="text-sm">加载中...</div>
        </div>
      </div>
    `;
    
    return placeholder;
  }

  /**
   * Check if content should be lazy loaded
   */
  public shouldLazyLoad(code: string): boolean {
    // Lazy load if content is large or complex
    const lines = code.split('\n').length;
    const hasNestedDiagrams = code.includes('{{diagram:');
    const isComplexDiagram = code.length > 5000;
    
    return lines > 50 || hasNestedDiagrams || isComplexDiagram;
  }

  /**
   * Chunk large diagram code for progressive rendering
   */
  public chunkDiagramCode(code: string, maxChunkSize = 2000): string[] {
    if (code.length <= maxChunkSize) {
      return [code];
    }

    const lines = code.split('\n');
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const line of lines) {
      if (currentChunk.length + line.length > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = line;
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  /**
   * Create virtual scrolling container for large lists
   */
  public createVirtualScrollContainer(
    items: any[],
    itemHeight: number,
    containerHeight: number,
    renderItem: (item: any, index: number) => HTMLElement
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = 'virtual-scroll-container';
    container.style.height = `${containerHeight}px`;
    container.style.overflow = 'auto';
    container.style.position = 'relative';
    
    const totalHeight = items.length * itemHeight;
    const viewport = document.createElement('div');
    viewport.style.height = `${totalHeight}px`;
    viewport.style.position = 'relative';
    
    const visibleItems = Math.ceil(containerHeight / itemHeight) + 2; // Buffer
    let startIndex = 0;
    
    const updateVisibleItems = () => {
      const scrollTop = container.scrollTop;
      const newStartIndex = Math.floor(scrollTop / itemHeight);
      
      if (newStartIndex !== startIndex) {
        startIndex = newStartIndex;
        renderVisibleItems();
      }
    };
    
    const renderVisibleItems = () => {
      // Clear existing items
      viewport.innerHTML = '';
      
      const endIndex = Math.min(startIndex + visibleItems, items.length);
      
      for (let i = startIndex; i < endIndex; i++) {
        const item = items[i];
        const element = renderItem(item, i);
        element.style.position = 'absolute';
        element.style.top = `${i * itemHeight}px`;
        element.style.height = `${itemHeight}px`;
        viewport.appendChild(element);
      }
    };
    
    container.addEventListener('scroll', updateVisibleItems);
    container.appendChild(viewport);
    
    // Initial render
    renderVisibleItems();
    
    return container;
  }

  /**
   * Debounce function for performance optimization
   */
  public debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  /**
   * Throttle function for performance optimization
   */
  public throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    this.pendingRenders.clear();
  }
}

export const lazyLoadingService = LazyLoadingService.getInstance();