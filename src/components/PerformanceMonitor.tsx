import React, { useState, useEffect } from 'react';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

interface PerformanceMonitorProps {
  isVisible: boolean;
  onToggle: () => void;
}

/**
 * Performance monitoring component for debugging and optimization
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  isVisible,
  onToggle,
}) => {
  const {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getCacheStats,
    clearCache,
  } = usePerformanceMonitor();
  
  const [cacheStats, setCacheStats] = useState(getCacheStats());

  // Update cache stats periodically
  useEffect(() => {
    if (isVisible && isMonitoring) {
      const interval = setInterval(() => {
        setCacheStats(getCacheStats());
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isVisible, isMonitoring, getCacheStats]);

  // Auto-start monitoring when visible
  useEffect(() => {
    if (isVisible && !isMonitoring) {
      startMonitoring();
    } else if (!isVisible && isMonitoring) {
      stopMonitoring();
    }
  }, [isVisible, isMonitoring, startMonitoring, stopMonitoring]);

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 left-4 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="显示性能监控"
      >
        📊
      </button>
    );
  }

  const formatTime = (ms: number) => `${ms.toFixed(2)}ms`;
  const formatMemory = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
  const formatPercent = (ratio: number) => `${(ratio * 100).toFixed(1)}%`;

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-sm z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">性能监控</h3>
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-700 text-xl"
          title="隐藏性能监控"
        >
          ×
        </button>
      </div>

      {/* Render Performance */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">渲染性能</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>总渲染次数:</span>
            <span className="font-mono">{metrics.totalRenders}</span>
          </div>
          <div className="flex justify-between">
            <span>平均渲染时间:</span>
            <span className="font-mono">{formatTime(metrics.averageRenderTime)}</span>
          </div>
          <div className="flex justify-between">
            <span>总渲染时间:</span>
            <span className="font-mono">{formatTime(metrics.renderTime)}</span>
          </div>
        </div>
      </div>

      {/* Cache Performance */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">缓存性能</h4>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>缓存命中:</span>
            <span className="font-mono text-green-600">{metrics.cacheHits}</span>
          </div>
          <div className="flex justify-between">
            <span>缓存未命中:</span>
            <span className="font-mono text-red-600">{metrics.cacheMisses}</span>
          </div>
          <div className="flex justify-between">
            <span>命中率:</span>
            <span className="font-mono">{formatPercent(cacheStats.hitRate)}</span>
          </div>
          <div className="flex justify-between">
            <span>缓存条目:</span>
            <span className="font-mono">{cacheStats.size}</span>
          </div>
          <div className="flex justify-between">
            <span>内存使用:</span>
            <span className="font-mono">{formatMemory(metrics.memoryUsage)}</span>
          </div>
        </div>
      </div>

      {/* Cache Details */}
      {cacheStats.entries.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">缓存详情</h4>
          <div className="max-h-32 overflow-y-auto">
            {cacheStats.entries.slice(0, 5).map((entry) => (
              <div key={entry.key} className="text-xs py-1 border-b border-gray-100 last:border-b-0">
                <div className="flex justify-between">
                  <span className="truncate max-w-24" title={entry.key}>
                    {entry.key.substring(0, 12)}...
                  </span>
                  <span className="font-mono">{entry.accessCount}次</span>
                </div>
                <div className="text-gray-500">
                  {formatMemory(entry.sizeMB * 1024 * 1024)}
                </div>
              </div>
            ))}
            {cacheStats.entries.length > 5 && (
              <div className="text-xs text-gray-500 text-center py-1">
                还有 {cacheStats.entries.length - 5} 个条目...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex space-x-2">
        <button
          onClick={clearCache}
          className="flex-1 bg-red-600 text-white text-xs py-1 px-2 rounded hover:bg-red-700 transition-colors"
        >
          清除缓存
        </button>
        <button
          onClick={() => isMonitoring ? stopMonitoring() : startMonitoring()}
          className={`flex-1 text-xs py-1 px-2 rounded transition-colors ${
            isMonitoring
              ? 'bg-orange-600 text-white hover:bg-orange-700'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isMonitoring ? '停止监控' : '开始监控'}
        </button>
      </div>

      {/* Status Indicator */}
      <div className="mt-2 flex items-center justify-center">
        <div className={`w-2 h-2 rounded-full mr-2 ${
          isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        }`}></div>
        <span className="text-xs text-gray-600">
          {isMonitoring ? '监控中' : '已停止'}
        </span>
      </div>
    </div>
  );
};