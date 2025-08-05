/**
 * Monaco Editor 滚动条修复工具
 * 解决Monaco Editor在某些情况下导致的无限滚动条问题
 */

export class EditorScrollFix {
  private static instance: EditorScrollFix;
  private observers: ResizeObserver[] = [];
  private fixedElements: Set<HTMLElement> = new Set();

  static getInstance(): EditorScrollFix {
    if (!EditorScrollFix.instance) {
      EditorScrollFix.instance = new EditorScrollFix();
    }
    return EditorScrollFix.instance;
  }

  /**
   * 应用Monaco Editor滚动条修复
   */
  applyEditorFix(editorContainer: HTMLElement): void {
    if (this.fixedElements.has(editorContainer)) {
      return; // 已经修复过了
    }

    // 设置容器样式
    this.setContainerStyles(editorContainer);

    // 监听Monaco Editor的DOM变化
    this.observeEditorChanges(editorContainer);

    // 修复现有的Monaco Editor元素
    this.fixExistingMonacoElements(editorContainer);

    this.fixedElements.add(editorContainer);
  }

  /**
   * 设置容器样式
   */
  private setContainerStyles(container: HTMLElement): void {
    container.style.height = '100%';
    container.style.maxHeight = '100%';
    container.style.overflow = 'hidden';
    container.style.position = 'relative';
  }

  /**
   * 修复现有的Monaco Editor元素
   */
  private fixExistingMonacoElements(container: HTMLElement): void {
    // 查找Monaco Editor相关元素
    const monacoElements = [
      ...container.querySelectorAll('.monaco-editor'),
      ...container.querySelectorAll('.overflow-guard'),
      ...container.querySelectorAll('.monaco-scrollable-element'),
      ...container.querySelectorAll('.monaco-editor-background'),
      ...container.querySelectorAll('.lines-content'),
      ...container.querySelectorAll('.view-lines'),
      ...container.querySelectorAll('.decorationsOverviewRuler')
    ];

    monacoElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      this.applyElementFix(htmlElement);
    });
    
    // 特殊处理lines-content和monaco-editor-background的对齐问题
    this.fixContentAlignment(container);
  }

  /**
   * 应用元素修复
   */
  private applyElementFix(element: HTMLElement): void {
    // 防止元素超出容器
    element.style.maxHeight = '100%';
    element.style.maxWidth = '100%';
    
    // 特殊处理overview ruler
    if (element.classList.contains('decorationsOverviewRuler')) {
      element.style.display = 'none'; // 隐藏可能导致问题的overview ruler
    }
  }

  /**
   * 监听编辑器变化
   */
  private observeEditorChanges(container: HTMLElement): void {
    // 使用MutationObserver监听DOM变化
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;
            
            // 检查是否是Monaco Editor相关元素
            if (this.isMonacoElement(element)) {
              this.applyElementFix(element);
            }

            // 递归检查子元素
            const monacoChildren = element.querySelectorAll('.monaco-editor, .overflow-guard, .monaco-scrollable-element');
            monacoChildren.forEach(child => {
              this.applyElementFix(child as HTMLElement);
            });
          }
        });
      });
    });

    mutationObserver.observe(container, {
      childList: true,
      subtree: true
    });

    // 使用ResizeObserver监听尺寸变化
    const resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target as HTMLElement;
        if (this.isMonacoElement(element)) {
          this.handleResize(element);
        }
      });
    });

    resizeObserver.observe(container);
    this.observers.push(resizeObserver);
  }

  /**
   * 修复内容对齐问题 - 温和版本
   */
  private fixContentAlignment(_container: HTMLElement): void {
    // 暂时禁用过度修复，保持编辑器基本功能
    // 只做最小必要的修复
  }
  
  /**
   * 检查是否是Monaco Editor相关元素
   */
  private isMonacoElement(element: HTMLElement): boolean {
    return element.classList.contains('monaco-editor') ||
           element.classList.contains('overflow-guard') ||
           element.classList.contains('monaco-scrollable-element') ||
           element.classList.contains('monaco-editor-background') ||
           element.classList.contains('lines-content') ||
           element.classList.contains('view-lines');
  }

  /**
   * 处理尺寸变化
   */
  private handleResize(element: HTMLElement): void {
    // 确保元素不会超出容器
    const container = element.closest('.editor-container') as HTMLElement;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      const maxHeight = containerRect.height;
      
      if (element.offsetHeight > maxHeight) {
        element.style.height = `${maxHeight}px`;
        element.style.maxHeight = `${maxHeight}px`;
      }
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.fixedElements.clear();
  }

  /**
   * 移除特定容器的修复
   */
  removeContainerFix(container: HTMLElement): void {
    this.fixedElements.delete(container);
  }
}

/**
 * 全局修复函数
 */
export const applyGlobalEditorFix = (): void => {
  const fix = EditorScrollFix.getInstance();
  
  // 查找所有编辑器容器
  const editorContainers = document.querySelectorAll('.editor-container');
  editorContainers.forEach(container => {
    fix.applyEditorFix(container as HTMLElement);
  });

  // 添加全局样式修复
  const style = document.createElement('style');
  style.textContent = `
    /* 全局Monaco Editor修复 */
    .monaco-editor {
      max-height: 100% !important;
      overflow: hidden !important;
      position: relative !important;
    }
    
    .monaco-editor .overflow-guard {
      max-height: 100% !important;
      overflow: hidden !important;
    }
    
    .monaco-editor .monaco-scrollable-element {
      max-height: 100% !important;
    }
    
    .monaco-editor .decorationsOverviewRuler {
      display: none !important;
    }
    
    /* 修复monaco-editor-background和lines-content对齐问题 */
    .monaco-editor .monaco-editor-background {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      z-index: 1 !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    .monaco-editor .lines-content {
      position: relative !important;
      z-index: 2 !important;
      width: 100% !important;
      min-height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    .monaco-editor .view-lines {
      position: relative !important;
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    /* 防止编辑器容器无限增长 */
    .editor-container {
      contain: layout style paint size !important;
      max-height: 100% !important;
      overflow: hidden !important;
    }
  `;
  
  document.head.appendChild(style);
};