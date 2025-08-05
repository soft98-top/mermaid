/**
 * Export format options
 */
export type ExportFormat = 'png' | 'svg' | 'pdf';

/**
 * Export configuration options
 */
export interface ExportOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  includeNestedDiagrams?: boolean;
  quality?: number; // For PNG export (0-1)
  scale?: number; // Scale factor for export
}

/**
 * Export result information
 */
export interface ExportResult {
  blob: Blob;
  filename: string;
  format: ExportFormat;
  size: number;
}

/**
 * Export service interface
 */
export interface ExportService {
  exportToPNG: (element: HTMLElement, options?: ExportOptions) => Promise<Blob>;
  exportToSVG: (element: HTMLElement, options?: ExportOptions) => Promise<Blob>;
  exportToPDF: (element: HTMLElement, options?: ExportOptions) => Promise<Blob>;
  downloadFile: (blob: Blob, filename: string) => void;
}