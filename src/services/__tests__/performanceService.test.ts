import { describe, it, expect, beforeEach } from 'vitest';
import { performanceService } from '../performanceService';
import type { RenderedElement } from '../../types/diagram';

describe('PerformanceService', () => {
  beforeEach(() => {
    performanceService.clearCache();
  });

  describe('Cache Management', () => {
    it('should cache and retrieve rendered elements', () => {
      const mockElement: RenderedElement = {
        id: 'test-1',
        svgContent: '<svg>test</svg>',
        boundingBox: { width: 100, height: 100 },
        renderTime: Date.now(),
      };

      const cacheKey = 'test-key';
      performanceService.cacheRender(cacheKey, mockElement);

      const cached = performanceService.getCachedRender(cacheKey);
      expect(cached).toEqual(mockElement);
    });

    it('should return null for non-existent cache keys', () => {
      const cached = performanceService.getCachedRender('non-existent');
      expect(cached).toBeNull();
    });

    it('should generate consistent cache keys', () => {
      const code = 'flowchart TD\n  A --> B';
      const type = 'flowchart';
      
      const key1 = performanceService.generateCacheKey(code, type);
      const key2 = performanceService.generateCacheKey(code, type);
      
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different content', () => {
      const code1 = 'flowchart TD\n  A --> B';
      const code2 = 'flowchart TD\n  A --> C';
      
      const key1 = performanceService.generateCacheKey(code1, 'flowchart');
      const key2 = performanceService.generateCacheKey(code2, 'flowchart');
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('Performance Metrics', () => {
    it('should record render performance', () => {
      const renderTime = 150;
      performanceService.recordRender(renderTime);

      const metrics = performanceService.getMetrics();
      expect(metrics.totalRenders).toBe(1);
      expect(metrics.renderTime).toBe(renderTime);
      expect(metrics.averageRenderTime).toBe(renderTime);
    });

    it('should calculate average render time correctly', () => {
      performanceService.recordRender(100);
      performanceService.recordRender(200);
      performanceService.recordRender(300);

      const metrics = performanceService.getMetrics();
      expect(metrics.totalRenders).toBe(3);
      expect(metrics.averageRenderTime).toBe(200);
    });

    it('should track cache hits and misses', () => {
      const mockElement: RenderedElement = {
        id: 'test-1',
        svgContent: '<svg>test</svg>',
        boundingBox: { width: 100, height: 100 },
        renderTime: Date.now(),
      };

      // Cache miss
      performanceService.getCachedRender('test-key');
      
      // Cache element
      performanceService.cacheRender('test-key', mockElement);
      
      // Cache hit
      performanceService.getCachedRender('test-key');

      const metrics = performanceService.getMetrics();
      expect(metrics.cacheMisses).toBe(1);
      expect(metrics.cacheHits).toBe(1);
    });
  });

  describe('Large Diagram Detection', () => {
    it('should detect large diagrams by line count', () => {
      const smallDiagram = 'flowchart TD\n  A --> B';
      const largeDiagram = 'flowchart TD\n' + 'A --> B\n'.repeat(150);

      expect(performanceService.isLargeDiagram(smallDiagram)).toBe(false);
      expect(performanceService.isLargeDiagram(largeDiagram)).toBe(true);
    });

    it('should detect large diagrams by character count', () => {
      const smallDiagram = 'flowchart TD\n  A --> B';
      const largeDiagram = 'flowchart TD\n  ' + 'A'.repeat(15000);

      expect(performanceService.isLargeDiagram(smallDiagram)).toBe(false);
      expect(performanceService.isLargeDiagram(largeDiagram)).toBe(true);
    });
  });

  describe('Cache Statistics', () => {
    it('should provide accurate cache statistics', () => {
      const mockElement: RenderedElement = {
        id: 'test-1',
        svgContent: '<svg>test content</svg>',
        boundingBox: { width: 100, height: 100 },
        renderTime: Date.now(),
      };

      performanceService.cacheRender('test-key', mockElement);
      performanceService.getCachedRender('test-key'); // Hit
      performanceService.getCachedRender('non-existent'); // Miss

      const stats = performanceService.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.hitRate).toBe(0.5); // 1 hit out of 2 requests
      expect(stats.entries).toHaveLength(1);
      expect(stats.entries[0].key).toBe('test-key');
      expect(stats.entries[0].accessCount).toBe(2); // Initial cache + 1 access
    });
  });
});