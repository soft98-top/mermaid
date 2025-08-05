import React, { useState } from 'react';
import { exportService } from '../services/exportService';
import type { ExportFormat, ExportOptions } from '../types/export';

interface ExportButtonProps {
  targetElementRef: React.RefObject<HTMLElement>;
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ 
  targetElementRef, 
  className = '' 
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    if (!targetElementRef.current) return;

    setIsExporting(true);
    setShowOptions(false);

    try {
      const options: ExportOptions = {
        backgroundColor: '#ffffff',
        scale: 2,
        quality: 1
      };

      let blob: Blob;
      let filename: string;

      switch (format) {
        case 'png':
          blob = await exportService.exportToPNG(targetElementRef.current, options);
          filename = `mermaid-diagram-${Date.now()}.png`;
          break;
        case 'svg':
          blob = await exportService.exportToSVG(targetElementRef.current, options);
          filename = `mermaid-diagram-${Date.now()}.svg`;
          break;
        case 'pdf':
          blob = await exportService.exportToPDF(targetElementRef.current, options);
          filename = `mermaid-diagram-${Date.now()}.pdf`;
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      exportService.downloadFile(blob, filename);
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={isExporting}
        className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors duration-200 text-sm font-medium shadow-sm"
        title="导出图表"
      >
        {isExporting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>导出中...</span>
          </>
        ) : (
          <>
            <span>📥</span>
            <span>导出</span>
          </>
        )}
      </button>

      {showOptions && !isExporting && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
          <button
            onClick={() => handleExport('png')}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 rounded-t-lg"
          >
            PNG 图片
          </button>
          <button
            onClick={() => handleExport('svg')}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
          >
            SVG 矢量
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 rounded-b-lg"
          >
            PDF 文档
          </button>
        </div>
      )}

      {showOptions && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowOptions(false)}
        />
      )}
    </div>
  );
};