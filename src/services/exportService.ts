import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { ExportOptions, ExportService } from '../types/export';

/**
 * Export service implementation for diagram export functionality
 */
class ExportServiceImpl implements ExportService {
  /**
   * Export diagram to PNG format using html2canvas
   */
  async exportToPNG(element: HTMLElement, options: ExportOptions = {}): Promise<Blob> {
    const {
      backgroundColor = '#ffffff',
      quality = 1
    } = options;

    const canvas = await html2canvas(element, {
      background: backgroundColor,
      useCORS: true,
      allowTaint: true,
      logging: false
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png', quality);
    });
  }

  /**
   * Export diagram to SVG format by extracting SVG content
   */
  async exportToSVG(element: HTMLElement, options: ExportOptions = {}): Promise<Blob> {
    const { backgroundColor = '#ffffff' } = options;
    
    // Find the content div that contains all diagrams
    const contentDiv = element.querySelector('[style*="transform"]');
    if (!contentDiv) {
      throw new Error('No diagram content found');
    }

    // Get main SVG and nested containers
    const mainSvg = contentDiv.querySelector('svg');
    const nestedContainers = contentDiv.querySelectorAll('.nested-diagram-container, foreignObject');
    
    if (!mainSvg) {
      throw new Error('No SVG element found');
    }

    // Calculate total bounds including nested diagrams
    const svgWidth = parseFloat(mainSvg.getAttribute('width') || '800');
    const svgHeight = parseFloat(mainSvg.getAttribute('height') || '600');
    
    let totalWidth = svgWidth;
    let totalHeight = svgHeight;
    
    nestedContainers.forEach(container => {
      const htmlContainer = container as HTMLElement;
      const left = parseFloat(htmlContainer.style.left || '0');
      const top = parseFloat(htmlContainer.style.top || '0');
      const width = parseFloat(htmlContainer.style.width || '0');
      const height = parseFloat(htmlContainer.style.height || '0');
      
      totalWidth = Math.max(totalWidth, left + width);
      totalHeight = Math.max(totalHeight, top + height);
    });

    // Clone the main SVG and extend its size
    const clonedSvg = mainSvg.cloneNode(true) as SVGElement;
    clonedSvg.setAttribute('width', totalWidth.toString());
    clonedSvg.setAttribute('height', totalHeight.toString());
    
    // Add background
    if (backgroundColor !== 'transparent') {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '100%');
      rect.setAttribute('height', '100%');
      rect.setAttribute('fill', backgroundColor);
      clonedSvg.insertBefore(rect, clonedSvg.firstChild);
    }

    // Add nested diagrams
    nestedContainers.forEach(container => {
      const nestedSvg = container.querySelector('svg');
      if (nestedSvg) {
        const htmlContainer = container as HTMLElement;
        const left = parseFloat(htmlContainer.style.left || '0');
        const top = parseFloat(htmlContainer.style.top || '0');
        
        const nestedGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        nestedGroup.setAttribute('transform', `translate(${left}, ${top})`);
        
        // Copy all child elements from nested SVG
        Array.from(nestedSvg.children).forEach(child => {
          const clonedChild = child.cloneNode(true);
          nestedGroup.appendChild(clonedChild);
        });
        
        clonedSvg.appendChild(nestedGroup);
      }
    });

    const containerSvg = clonedSvg;

    const svgString = new XMLSerializer().serializeToString(containerSvg);
    return new Blob([svgString], { type: 'image/svg+xml' });
  }

  /**
   * Export diagram to PDF format using jsPDF
   */
  async exportToPDF(element: HTMLElement, options: ExportOptions = {}): Promise<Blob> {
    // Use the PNG export method to get the original size image
    const pngBlob = await this.exportToPNG(element, options);
    
    // Convert blob to image data and get dimensions
    const imgDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(pngBlob);
    });

    const imgDimensions = await new Promise<{width: number, height: number}>((resolve) => {
      const img = new Image();
      img.onload = () => resolve({width: img.width, height: img.height});
      img.src = imgDataUrl;
    });
    
    const imgWidth = imgDimensions.width;
    const imgHeight = imgDimensions.height;
    const imgData = imgDataUrl;

    // Calculate PDF dimensions (A4 ratio consideration)
    const pdfWidth = Math.min(imgWidth * 0.75, 210); // Max A4 width in mm
    const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    
    return new Promise((resolve) => {
      const pdfBlob = pdf.output('blob');
      resolve(pdfBlob);
    });
  }

  /**
   * Download file to user's device
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const exportService = new ExportServiceImpl();