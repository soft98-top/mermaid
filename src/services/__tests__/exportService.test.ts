import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportService } from '../exportService';

// Mock URL methods
Object.defineProperty(globalThis, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn()
  }
});

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve({
    toBlob: vi.fn((callback) => callback(new Blob(['fake-png'], { type: 'image/png' }))),
    toDataURL: vi.fn(() => 'data:image/png;base64,fake-data'),
    width: 800,
    height: 600
  }))
}));

// Mock jsPDF
vi.mock('jspdf', () => ({
  default: vi.fn(() => ({
    addImage: vi.fn(),
    output: vi.fn(() => new Blob(['fake-pdf'], { type: 'application/pdf' }))
  }))
}));

describe('ExportService', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = document.createElement('div');
    mockElement.innerHTML = '<svg><rect width="100" height="100" fill="blue"/></svg>';
  });

  it('should export to PNG format', async () => {
    const blob = await exportService.exportToPNG(mockElement);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/png');
  });

  it('should export to SVG format', async () => {
    // Create element with proper structure for SVG export
    const elementWithTransform = document.createElement('div');
    elementWithTransform.style.transform = 'scale(1)';
    elementWithTransform.innerHTML = '<svg><rect width="100" height="100" fill="blue"/></svg>';
    
    const blob = await exportService.exportToSVG(elementWithTransform);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('image/svg+xml');
  });

  it('should export to PDF format', async () => {
    const blob = await exportService.exportToPDF(mockElement);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/pdf');
  }, 10000); // Increase timeout to 10 seconds

  it('should throw error when no SVG found for SVG export', async () => {
    const emptyElement = document.createElement('div');
    await expect(exportService.exportToSVG(emptyElement)).rejects.toThrow('No diagram content found');
  });

  it('should create download link for file download', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');
    
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn()
    } as any;
    
    createElementSpy.mockReturnValue(mockLink);
    appendChildSpy.mockImplementation(() => mockLink);
    removeChildSpy.mockImplementation(() => mockLink);

    const blob = new Blob(['test'], { type: 'text/plain' });
    exportService.downloadFile(blob, 'test.txt');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(mockLink.download).toBe('test.txt');
    expect(mockLink.click).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
    expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
  });
});