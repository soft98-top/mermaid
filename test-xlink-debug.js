// 调试 xlink:href 处理的脚本
console.log('🔧 xlink:href 处理调试指南\n');

console.log('📋 发现的问题:');
console.log('Mermaid 生成的 SVG 使用 xlink:href 而不是 href 属性');

console.log('\n🔍 示例 SVG 结构:');
const exampleSVG = `
<a xlink:href="login-flow" data-node="true" data-id="D">
  <g class="node default clickable flowchart-label">
    <rect class="basic label-container"></rect>
    <g class="label">
      <span class="nodeLabel">登录详情</span>
    </g>
  </g>
</a>
`;
console.log(exampleSVG);

console.log('📋 修复内容:');
console.log('1. ✅ 扩展选择器: [href], [xlink\\:href]');
console.log('2. ✅ 扩展属性获取: getAttribute("href") || getAttribute("xlink:href")');
console.log('3. ✅ 扩展属性清理: removeAttribute("href") + removeAttribute("xlink:href")');
console.log('4. ✅ 扩展 MutationObserver: 监控两种属性');

console.log('\n🎯 测试步骤:');
console.log('1. 创建包含 click 语句的图表');
console.log('2. 检查生成的 SVG 元素');
console.log('3. 点击相应的节点');
console.log('4. 观察控制台日志和行为');

console.log('\n🔍 浏览器调试命令:');
console.log('// 查找所有带 xlink:href 的元素');
console.log('document.querySelectorAll("[xlink\\\\:href]")');
console.log('');
console.log('// 查找所有带 href 的元素');
console.log('document.querySelectorAll("[href]")');
console.log('');
console.log('// 查看特定元素的属性');
console.log('element.getAttribute("xlink:href")');
console.log('element.getAttribute("href")');

console.log('\n✅ 预期结果:');
console.log('1. 系统能识别 xlink:href 元素');
console.log('2. 点击事件被正确拦截');
console.log('3. 不会发生页面跳转');
console.log('4. 嵌套图表正确展开');

console.log('\n🎉 xlink:href 支持已添加！');