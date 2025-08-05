/**
 * Global error suppression for SES-related errors
 */

// Store original console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Override console.error to suppress SES errors
console.error = (...args: any[]) => {
  const message = args.join(' ');
  
  // Suppress SES-related errors
  if (message.includes('SES_UNCAUGHT_EXCEPTION') || 
      message.includes('lockdown-install.js') ||
      message.includes('Uncaught null')) {
    return; // Suppress the error
  }
  
  // Call original console.error for other errors
  originalConsoleError.apply(console, args);
};

// Override console.warn to suppress SES warnings
console.warn = (...args: any[]) => {
  const message = args.join(' ');
  
  // Suppress SES-related warnings
  if (message.includes('SES_UNCAUGHT_EXCEPTION') || 
      message.includes('lockdown-install.js')) {
    return; // Suppress the warning
  }
  
  // Call original console.warn for other warnings
  originalConsoleWarn.apply(console, args);
};

// Global error handler
window.addEventListener('error', (event) => {
  if (event.filename?.includes('lockdown-install.js') || 
      event.message?.includes('SES_UNCAUGHT_EXCEPTION') ||
      event.message === 'null') {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('SES_UNCAUGHT_EXCEPTION') ||
      event.reason === null) {
    event.preventDefault();
  }
});

// Monkey patch setTimeout and setInterval to catch SES errors
const originalSetTimeout = window.setTimeout;
const originalSetInterval = window.setInterval;

window.setTimeout = ((callback: Function, delay?: number, ...args: any[]) => {
  const wrappedCallback = () => {
    try {
      callback.apply(null, args);
    } catch (error: any) {
      if (error?.message?.includes('SES_UNCAUGHT_EXCEPTION') || error === null) {
        // Suppress SES errors
        return;
      }
      throw error;
    }
  };
  return originalSetTimeout(wrappedCallback, delay);
}) as typeof setTimeout;

window.setInterval = ((callback: Function, delay?: number, ...args: any[]) => {
  const wrappedCallback = () => {
    try {
      callback.apply(null, args);
    } catch (error: any) {
      if (error?.message?.includes('SES_UNCAUGHT_EXCEPTION') || error === null) {
        // Suppress SES errors
        return;
      }
      throw error;
    }
  };
  return originalSetInterval(wrappedCallback, delay);
}) as typeof setInterval;

export const suppressSESErrors = () => {
  console.log('SES error suppression initialized');
};