// 调试 click 事件拦截的脚本
console.log('🔧 Click 事件拦截调试指南\n');

console.log('📋 拦截机制层次:');
console.log('1. ✅ 多层事件监听器 (capture + bubble 阶段)');
console.log('2. ✅ mousedown 事件拦截');
console.log('3. ✅ href 属性移除');
console.log('4. ✅ onclick 属性移除');
console.log('5. ✅ 全局 SVG 点击拦截器');
console.log('6. ✅ MutationObserver 监控 href 重新添加');
console.log('7. ✅ Mermaid 配置禁用默认 click 处理器');

console.log('\n🔍 调试步骤:');
console.log('1. 打开浏览器开发者工具');
console.log('2. 查看控制台日志');
console.log('3. 点击嵌套图表引用的节点');
console.log('4. 观察以下日志:');
console.log('   - "🔧 Intercepting click event for nested diagram: [id]"');
console.log('   - "🔧 Global interceptor caught click for nested diagram: [id]"');
console.log('   - "🔧 MutationObserver: Removing re-added href: [id]"');

console.log('\n🎯 预期行为:');
console.log('✅ 控制台显示拦截日志');
console.log('✅ 嵌套图表在当前画布展开');
console.log('✅ 浏览器地址栏不发生变化');
console.log('✅ 没有页面跳转或刷新');

console.log('\n❌ 如果仍然跳转，可能的原因:');
console.log('1. 事件监听器添加时机太晚');
console.log('2. Mermaid 使用了不同的事件机制');
console.log('3. 存在其他的事件处理器覆盖了我们的拦截');
console.log('4. href 属性在我们处理后被重新设置');

console.log('\n🔧 进一步调试建议:');
console.log('1. 检查 SVG 元素结构: document.querySelector("svg")');
console.log('2. 查看所有带 href 的元素: document.querySelectorAll("[href]")');
console.log('3. 检查事件监听器: getEventListeners(element) (Chrome DevTools)');
console.log('4. 监控网络请求面板，看是否有意外的导航请求');

console.log('\n🎉 拦截增强完成！');