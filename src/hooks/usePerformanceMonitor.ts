import { useState, useEffect, useCallback, useRef } from 'react';
import { performanceService } from '../services/performanceService';
import type { PerformanceMetrics } from '../services/performanceService';

/**
 * Performance monitoring hook
 */
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(performanceService.getMetrics());
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  /**
   * Start performance monitoring
   */
  const startMonitoring = useCallback((interval = 1000) => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    intervalRef.current = setInterval(() => {
      setMetrics(performanceService.getMetrics());
    }, interval);
  }, [isMonitoring]);

  /**
   * Stop performance monitoring
   */
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;
    
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, [isMonitoring]);

  /**
   * Measure render performance
   */
  const measureRender = useCallback(async <T>(
    renderFn: () => Promise<T>
  ): Promise<{ result: T; renderTime: number }> => {
    const startTime = performance.now();
    const result = await renderFn();
    const renderTime = performance.now() - startTime;
    
    performanceService.recordRender(renderTime);
    
    return { result, renderTime };
  }, []);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    return performanceService.getCacheStats();
  }, []);

  /**
   * Clear performance cache
   */
  const clearCache = useCallback(() => {
    performanceService.clearCache();
    setMetrics(performanceService.getMetrics());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    measureRender,
    getCacheStats,
    clearCache,
  };
};

/**
 * Hook for render caching
 */
export const useRenderCache = () => {
  /**
   * Get cached render or execute render function
   */
  const getCachedRender = useCallback(async <T>(
    cacheKey: string,
    renderFn: () => Promise<T>
  ): Promise<T> => {
    // Try to get from cache first
    const cached = performanceService.getCachedRender(cacheKey);
    if (cached) {
      return cached as T;
    }

    // Execute render function and cache result
    const result = await renderFn();
    
    // Only cache if result is a rendered element
    if (result && typeof result === 'object' && 'svgContent' in result) {
      performanceService.cacheRender(cacheKey, result as any);
    }
    
    return result;
  }, []);

  /**
   * Generate cache key for diagram
   */
  const generateCacheKey = useCallback((code: string, type?: string) => {
    return performanceService.generateCacheKey(code, type);
  }, []);

  /**
   * Check if diagram is large
   */
  const isLargeDiagram = useCallback((code: string) => {
    return performanceService.isLargeDiagram(code);
  }, []);

  return {
    getCachedRender,
    generateCacheKey,
    isLargeDiagram,
  };
};