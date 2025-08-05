import type { RenderedElement } from '../types/diagram';

/**
 * Performance metrics for monitoring
 */
export interface PerformanceMetrics {
  renderTime: number;
  cacheHits: number;
  cacheMisses: number;
  totalRenders: number;
  averageRenderTime: number;
  memoryUsage: number;
}

/**
 * Cache entry with metadata
 */
interface CacheEntry {
  element: RenderedElement;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

/**
 * Performance service for monitoring and optimization
 */
export class PerformanceService {
  private static instance: PerformanceService;
  private renderCache = new Map<string, CacheEntry>();
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalRenders: 0,
    averageRenderTime: 0,
    memoryUsage: 0,
  };
  private readonly maxCacheSize = 50; // Maximum cache entries
  private readonly maxMemoryMB = 100; // Maximum memory usage in MB

  private constructor() {}

  public static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService();
    }
    return PerformanceService.instance;
  }

  /**
   * Get cached render result
   */
  public getCachedRender(cacheKey: string): RenderedElement | null {
    const entry = this.renderCache.get(cacheKey);
    if (entry) {
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      this.metrics.cacheHits++;
      return entry.element;
    }
    this.metrics.cacheMisses++;
    return null;
  }

  /**
   * Cache render result with LRU eviction
   */
  public cacheRender(cacheKey: string, element: RenderedElement): void {
    const size = this.estimateSize(element);
    
    // Check if we need to evict entries
    this.evictIfNeeded(size);
    
    const entry: CacheEntry = {
      element,
      accessCount: 1,
      lastAccessed: Date.now(),
      size,
    };
    
    this.renderCache.set(cacheKey, entry);
    this.updateMemoryUsage();
  }

  /**
   * Generate cache key for diagram
   */
  public generateCacheKey(code: string, type?: string): string {
    // Simple hash function for cache key
    let hash = 0;
    const str = `${type || 'unknown'}_${code}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `render_${Math.abs(hash)}`;
  }

  /**
   * Record render performance
   */
  public recordRender(renderTime: number): void {
    this.metrics.renderTime += renderTime;
    this.metrics.totalRenders++;
    this.metrics.averageRenderTime = this.metrics.renderTime / this.metrics.totalRenders;
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear cache and reset metrics
   */
  public clearCache(): void {
    this.renderCache.clear();
    this.metrics = {
      renderTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalRenders: 0,
      averageRenderTime: 0,
      memoryUsage: 0,
    };
  }

  /**
   * Estimate memory size of rendered element
   */
  private estimateSize(element: RenderedElement): number {
    // Rough estimation: SVG content length + metadata
    return element.svgContent.length * 2 + 1000; // bytes
  }

  /**
   * Evict cache entries if needed (LRU strategy)
   */
  private evictIfNeeded(newEntrySize: number): void {
    // Check cache size limit
    if (this.renderCache.size >= this.maxCacheSize) {
      this.evictLRU();
    }
    
    // Check memory limit
    const currentMemory = this.getCurrentMemoryUsage();
    const maxMemoryBytes = this.maxMemoryMB * 1024 * 1024;
    
    if (currentMemory + newEntrySize > maxMemoryBytes) {
      this.evictByMemory(newEntrySize);
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.renderCache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.renderCache.delete(oldestKey);
    }
  }

  /**
   * Evict entries to free memory
   */
  private evictByMemory(requiredSpace: number): void {
    const entries = Array.from(this.renderCache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    let freedSpace = 0;
    const maxMemoryBytes = this.maxMemoryMB * 1024 * 1024;
    const currentMemory = this.getCurrentMemoryUsage();
    const targetFree = Math.max(requiredSpace, (currentMemory - maxMemoryBytes) + requiredSpace);
    
    for (const [key, entry] of entries) {
      if (freedSpace >= targetFree) break;
      
      freedSpace += entry.size;
      this.renderCache.delete(key);
    }
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    let total = 0;
    for (const entry of this.renderCache.values()) {
      total += entry.size;
    }
    return total;
  }

  /**
   * Update memory usage metric
   */
  private updateMemoryUsage(): void {
    this.metrics.memoryUsage = this.getCurrentMemoryUsage();
  }

  /**
   * Check if diagram is large and needs optimization
   */
  public isLargeDiagram(code: string): boolean {
    const lines = code.split('\n').length;
    const characters = code.length;
    
    // Consider large if more than 100 lines or 10KB
    return lines > 100 || characters > 10000;
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): {
    size: number;
    hitRate: number;
    memoryUsageMB: number;
    entries: Array<{ key: string; accessCount: number; lastAccessed: number; sizeMB: number }>;
  } {
    const totalRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    const hitRate = totalRequests > 0 ? this.metrics.cacheHits / totalRequests : 0;
    
    const entries = Array.from(this.renderCache.entries()).map(([key, entry]) => ({
      key,
      accessCount: entry.accessCount,
      lastAccessed: entry.lastAccessed,
      sizeMB: entry.size / (1024 * 1024),
    }));
    
    return {
      size: this.renderCache.size,
      hitRate,
      memoryUsageMB: this.metrics.memoryUsage / (1024 * 1024),
      entries,
    };
  }
}

export const performanceService = PerformanceService.getInstance();