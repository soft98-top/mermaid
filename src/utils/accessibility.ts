/**
 * Accessibility utilities for improved user experience
 */

export interface AccessibilityOptions {
  announceChanges?: boolean;
  focusManagement?: boolean;
  keyboardNavigation?: boolean;
  screenReaderSupport?: boolean;
}

class AccessibilityManager {
  private static instance: AccessibilityManager;
  private announcer: HTMLElement | null = null;
  private focusHistory: HTMLElement[] = [];
  private options: AccessibilityOptions;

  private constructor(options: AccessibilityOptions = {}) {
    this.options = {
      announceChanges: true,
      focusManagement: true,
      keyboardNavigation: true,
      screenReaderSupport: true,
      ...options,
    };
    
    this.initialize();
  }

  public static getInstance(options?: AccessibilityOptions): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager(options);
    }
    return AccessibilityManager.instance;
  }

  /**
   * Initialize accessibility features
   */
  private initialize(): void {
    if (this.options.announceChanges) {
      this.createAnnouncer();
    }
    
    if (this.options.keyboardNavigation) {
      this.setupKeyboardNavigation();
    }
    
    if (this.options.screenReaderSupport) {
      this.setupScreenReaderSupport();
    }
  }

  /**
   * Create live region for screen reader announcements
   */
  private createAnnouncer(): void {
    this.announcer = document.createElement('div');
    this.announcer.setAttribute('aria-live', 'polite');
    this.announcer.setAttribute('aria-atomic', 'true');
    this.announcer.setAttribute('aria-relevant', 'text');
    this.announcer.className = 'sr-only';
    this.announcer.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    document.body.appendChild(this.announcer);
  }

  /**
   * Announce message to screen readers
   */
  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.announcer || !this.options.announceChanges) return;

    this.announcer.setAttribute('aria-live', priority);
    this.announcer.textContent = message;
    
    // Clear after announcement to allow repeated messages
    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = '';
      }
    }, 1000);
  }

  /**
   * Setup keyboard navigation
   */
  private setupKeyboardNavigation(): void {
    // Add focus indicators
    const style = document.createElement('style');
    style.textContent = `
      .focus-visible {
        outline: 2px solid var(--color-border-focus, #3b82f6) !important;
        outline-offset: 2px !important;
      }
      
      .focus-visible:not(:focus-visible) {
        outline: none !important;
      }
      
      /* Skip link for keyboard users */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: var(--color-bg-primary, #ffffff);
        color: var(--color-text-primary, #000000);
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        border: 2px solid var(--color-border-focus, #3b82f6);
        z-index: 1000;
        transition: top 0.3s;
      }
      
      .skip-link:focus {
        top: 6px;
      }
    `;
    document.head.appendChild(style);

    // Add skip link
    this.addSkipLink();
  }

  /**
   * Add skip link for keyboard navigation
   */
  private addSkipLink(): void {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link';
    skipLink.textContent = '跳转到主要内容';
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const mainContent = document.getElementById('main-content') || 
                         document.querySelector('main') ||
                         document.querySelector('[role="main"]');
      if (mainContent) {
        this.focusElement(mainContent as HTMLElement);
      }
    });
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  /**
   * Setup screen reader support
   */
  private setupScreenReaderSupport(): void {
    // Add ARIA landmarks if missing
    this.addAriaLandmarks();
    
    // Enhance form labels
    this.enhanceFormLabels();
    
    // Add ARIA descriptions for complex elements
    this.addAriaDescriptions();
  }

  /**
   * Add ARIA landmarks to improve navigation
   */
  private addAriaLandmarks(): void {
    // Add main landmark
    const main = document.querySelector('main');
    if (main && !main.getAttribute('role')) {
      main.setAttribute('role', 'main');
      main.setAttribute('aria-label', '主要内容区域');
    }

    // Add navigation landmarks
    const navs = document.querySelectorAll('nav');
    navs.forEach((nav, index) => {
      if (!nav.getAttribute('aria-label')) {
        nav.setAttribute('aria-label', `导航菜单 ${index + 1}`);
      }
    });

    // Add banner landmark
    const header = document.querySelector('header');
    if (header && !header.getAttribute('role')) {
      header.setAttribute('role', 'banner');
      header.setAttribute('aria-label', '页面头部');
    }

    // Add contentinfo landmark
    const footer = document.querySelector('footer');
    if (footer && !footer.getAttribute('role')) {
      footer.setAttribute('role', 'contentinfo');
      footer.setAttribute('aria-label', '页面底部信息');
    }
  }

  /**
   * Enhance form labels and descriptions
   */
  private enhanceFormLabels(): void {
    // Associate labels with form controls
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((input) => {
      const id = input.id || `input-${Date.now()}-${Math.random()}`;
      input.id = id;

      // Find associated label
      let label = document.querySelector(`label[for="${id}"]`);
      if (!label) {
        label = input.closest('label');
      }

      if (label && !input.getAttribute('aria-labelledby')) {
        const labelId = label.id || `label-${id}`;
        label.id = labelId;
        input.setAttribute('aria-labelledby', labelId);
      }
    });
  }

  /**
   * Add ARIA descriptions for complex elements
   */
  private addAriaDescriptions(): void {
    // Add descriptions for canvas elements
    const canvases = document.querySelectorAll('canvas, svg');
    canvases.forEach((canvas) => {
      if (!canvas.getAttribute('aria-label') && !canvas.getAttribute('aria-labelledby')) {
        canvas.setAttribute('aria-label', '图表画布');
        canvas.setAttribute('role', 'img');
      }
    });

    // Add descriptions for interactive elements
    const buttons = document.querySelectorAll('button');
    buttons.forEach((button) => {
      if (!button.getAttribute('aria-label') && !button.textContent?.trim()) {
        const icon = button.querySelector('svg, i, [class*="icon"]');
        if (icon) {
          button.setAttribute('aria-label', '按钮');
        }
      }
    });
  }

  /**
   * Focus management utilities
   */
  public focusElement(element: HTMLElement, options?: FocusOptions): void {
    if (!this.options.focusManagement) return;

    // Store current focus for history
    const currentFocus = document.activeElement as HTMLElement;
    if (currentFocus && currentFocus !== element) {
      this.focusHistory.push(currentFocus);
    }

    // Focus the element
    element.focus(options);
    
    // Announce focus change
    const label = this.getElementLabel(element);
    if (label) {
      this.announce(`已聚焦到 ${label}`);
    }
  }

  /**
   * Return focus to previous element
   */
  public returnFocus(): void {
    if (!this.options.focusManagement) return;

    const previousElement = this.focusHistory.pop();
    if (previousElement && document.contains(previousElement)) {
      previousElement.focus();
    }
  }

  /**
   * Get accessible label for element
   */
  private getElementLabel(element: HTMLElement): string {
    return (
      element.getAttribute('aria-label') ||
      element.getAttribute('title') ||
      element.textContent?.trim() ||
      element.tagName.toLowerCase()
    );
  }

  /**
   * Trap focus within container
   */
  public trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  /**
   * Check if user prefers reduced motion
   */
  public prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Check if user prefers high contrast
   */
  public prefersHighContrast(): boolean {
    return window.matchMedia('(prefers-contrast: high)').matches;
  }

  /**
   * Get user's preferred color scheme
   */
  public getPreferredColorScheme(): 'light' | 'dark' {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * Add ARIA live region for dynamic content
   */
  public createLiveRegion(
    id: string, 
    level: 'polite' | 'assertive' = 'polite'
  ): HTMLElement {
    let region = document.getElementById(id);
    if (!region) {
      region = document.createElement('div');
      region.id = id;
      region.setAttribute('aria-live', level);
      region.setAttribute('aria-atomic', 'true');
      region.className = 'sr-only';
      region.style.cssText = `
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      `;
      document.body.appendChild(region);
    }
    return region;
  }

  /**
   * Update live region content
   */
  public updateLiveRegion(id: string, content: string): void {
    const region = document.getElementById(id);
    if (region) {
      region.textContent = content;
    }
  }

  /**
   * Cleanup accessibility features
   */
  public destroy(): void {
    if (this.announcer) {
      document.body.removeChild(this.announcer);
      this.announcer = null;
    }
    this.focusHistory = [];
  }
}

export const accessibilityManager = AccessibilityManager.getInstance();