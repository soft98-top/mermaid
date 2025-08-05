/**
 * Monaco Editor 对齐问题修复工具
 * 专门解决 monaco-editor-background 和 lines-content 不对齐的问题
 */

export class MonacoAlignmentFix {
  private static instance: MonacoAlignmentFix;
  private observers: MutationObserver[] = [];
  private intervalIds: number[] = [];

  static getInstance(): MonacoAlignmentFix {
    if (!MonacoAlignmentFix.instance) {
      MonacoAlignmentFix.instance = new MonacoAlignmentFix();
    }
    return MonacoAlignmentFix.instance;
  }

  /**
   * 应用对齐修复
   */
  applyAlignmentFix(editorContainer: HTMLElement): void {
    // 等待Monaco编辑器完全加载
    setTimeout(() => {
      this.fixAlignment(editorContainer);
      this.setupAlignmentMonitoring(editorContainer);
    }, 100);
  }

  /**
   * 修复对齐问题
   */
  private fixAlignment(container: HTMLElement): void {
    const monacoEditor = container.querySelector('.monaco-editor') as HTMLElement;
    if (!monacoEditor) return;

    const background = monacoEditor.querySelector('.monaco-editor-background') as HTMLElement;
    const linesContent = monacoEditor.querySelector('.lines-content') as HTMLElement;
    const viewLines = monacoEditor.querySelector('.view-lines') as HTMLElement;

    if (background && linesContent && viewLines) {
      // 移除高度限制，让内容自然扩展
      background.style.maxHeight = 'none';
      background.style.minHeight = 'auto';
      linesContent.style.maxHeight = 'none';
      linesContent.style.minHeight = 'auto';
      viewLines.style.maxHeight = 'none';
      viewLines.style.minHeight = 'auto';
    }
  }

  /**
   * 设置对齐监控
   */
  private setupAlignmentMonitoring(container: HTMLElement): void {
    // 监控内容变化
    const observer = new MutationObserver(() => {
      setTimeout(() => this.fixAlignment(container), 10);
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    });

    this.observers.push(observer);

    // 监控滚动和尺寸变化
    const monacoEditor = container.querySelector('.monaco-editor');
    if (monacoEditor) {
      const scrollableElement = monacoEditor.querySelector('.monaco-scrollable-element');
      if (scrollableElement) {
        scrollableElement.addEventListener('scroll', () => {
          this.fixAlignment(container);
        });
      }
      
      // 监控窗口尺寸变化
      const resizeObserver = new ResizeObserver(() => {
        setTimeout(() => this.fixAlignment(container), 10);
      });
      resizeObserver.observe(monacoEditor);
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    
    this.intervalIds.forEach(id => clearInterval(id));
    this.intervalIds = [];
  }

  /**
   * 检查对齐状态
   */
  checkAlignment(container: HTMLElement): { isAligned: boolean; details: any } {
    const monacoEditor = container.querySelector('.monaco-editor') as HTMLElement;
    if (!monacoEditor) {
      return { isAligned: false, details: { error: 'Monaco editor not found' } };
    }

    const background = monacoEditor.querySelector('.monaco-editor-background') as HTMLElement;
    const linesContent = monacoEditor.querySelector('.lines-content') as HTMLElement;

    if (!background || !linesContent) {
      return { isAligned: false, details: { error: 'Required elements not found' } };
    }

    const bgRect = background.getBoundingClientRect();
    const contentRect = linesContent.getBoundingClientRect();
    
    const topDiff = Math.abs(bgRect.top - contentRect.top);
    const leftDiff = Math.abs(bgRect.left - contentRect.left);
    
    const isAligned = topDiff <= 2 && leftDiff <= 2;

    return {
      isAligned,
      details: {
        topDiff,
        leftDiff,
        background: {
          top: bgRect.top,
          left: bgRect.left,
          width: bgRect.width,
          height: bgRect.height
        },
        content: {
          top: contentRect.top,
          left: contentRect.left,
          width: contentRect.width,
          height: contentRect.height
        }
      }
    };
  }
}

/**
 * 全局应用对齐修复
 */
export const applyGlobalAlignmentFix = (): void => {
  const fix = MonacoAlignmentFix.getInstance();
  
  // 查找所有编辑器容器
  const editorContainers = document.querySelectorAll('.editor-container');
  editorContainers.forEach(container => {
    fix.applyAlignmentFix(container as HTMLElement);
  });
};