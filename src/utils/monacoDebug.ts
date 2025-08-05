export function debugMonacoStructure(container: HTMLElement) {
  const monacoEditor = container.querySelector('.monaco-editor');
  if (!monacoEditor) return;

  console.log('=== Monaco Editor DOM Structure ===');
  
  // 查找所有关键元素
  const elements = {
    editor: monacoEditor,
    overflowGuard: monacoEditor.querySelector('.overflow-guard'),
    background: monacoEditor.querySelector('.monaco-editor-background'),
    scrollableElement: monacoEditor.querySelector('.monaco-scrollable-element'),
    linesContent: monacoEditor.querySelector('.lines-content'),
    viewLines: monacoEditor.querySelector('.view-lines'),
    scrollbar: monacoEditor.querySelector('.scrollbar'),
    verticalScrollbar: monacoEditor.querySelector('.slider')
  };

  Object.entries(elements).forEach(([name, element]) => {
    if (element) {
      const rect = element.getBoundingClientRect();
      const styles = window.getComputedStyle(element);
      console.log(`${name}:`, {
        offsetHeight: (element as HTMLElement).offsetHeight,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
        position: styles.position,
        height: styles.height,
        minHeight: styles.minHeight,
        maxHeight: styles.maxHeight,
        overflow: styles.overflow,
        rect: { width: rect.width, height: rect.height }
      });
    } else {
      console.log(`${name}: NOT FOUND`);
    }
  });

  // 检查滚动状态
  const scrollableElement = elements.scrollableElement as HTMLElement;
  if (scrollableElement) {
    console.log('Scroll Info:', {
      scrollTop: scrollableElement.scrollTop,
      scrollHeight: scrollableElement.scrollHeight,
      clientHeight: scrollableElement.clientHeight,
      canScroll: scrollableElement.scrollHeight > scrollableElement.clientHeight
    });
  }
}