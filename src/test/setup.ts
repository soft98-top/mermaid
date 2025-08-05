import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(() => null),
    removeItem: vi.fn(() => null),
    clear: vi.fn(() => null),
  },
  writable: true,
});

// Mock document.documentElement for theme service
Object.defineProperty(document, 'documentElement', {
  value: {
    style: {
      setProperty: vi.fn(),
    },
    setAttribute: vi.fn(),
  },
  writable: true,
});

// Mock Monaco Range for autoCompletion tests
global.monaco = {
  Range: class MockRange {
    constructor(
      public startLineNumber: number,
      public startColumn: number,
      public endLineNumber: number,
      public endColumn: number
    ) {}
  },
  languages: {
    CompletionItemKind: {
      Keyword: 1,
      Snippet: 2,
      Operator: 3
    },
    CompletionItemInsertTextRule: {
      InsertAsSnippet: 4
    }
  }
} as any;

// Mock URL for export service
Object.defineProperty(globalThis, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn()
  },
  writable: true,
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