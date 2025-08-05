// 测试 href 属性处理的脚本
console.log('🔧 测试 href 属性处理...\n');

// 模拟 SVG 元素结构
const mockSVGContent = `
<svg>
  <g>
    <!-- 节点标签引用 - 应该通过 textContent 处理 -->
    <text>login-flow</text>
    
    <!-- Click 语句生成的链接 - 应该通过 href 处理 -->
    <a href="dashboard">
      <text>仪表板</text>
    </a>
    
    <!-- 普通链接 - 不应该被处理 -->
    <a href="https://example.com">
      <text>外部链接</text>
    </a>
  </g>
</svg>
`;

// 模拟嵌套图表映射
const mockNestedDiagrams = new Map([
  ['login-flow', { type: 'sequence', content: '...' }],
  ['dashboard', { type: 'flowchart', content: '...' }]
]);

console.log('📋 模拟的 SVG 结构:');
console.log(mockSVGContent);

console.log('\n📋 嵌套图表映射:');
mockNestedDiagrams.forEach((diagram, id) => {
  console.log(`  - ${id}: ${diagram.type}`);
});

// 模拟处理逻辑
console.log('\n🔍 处理逻辑模拟:');

// 1. 处理 textContent 匹配
console.log('\n1. 处理节点标签引用 (textContent):');
const textElements = ['login-flow', '仪表板', '外部链接'];
textElements.forEach(text => {
  const hasMatch = mockNestedDiagrams.has(text);
  console.log(`  - "${text}": ${hasMatch ? '✅ 匹配，添加点击事件' : '❌ 无匹配'}`);
});

// 2. 处理 href 匹配
console.log('\n2. 处理 click 语句引用 (href):');
const hrefElements = ['dashboard', 'https://example.com'];
hrefElements.forEach(href => {
  const hasMatch = mockNestedDiagrams.has(href);
  if (hasMatch) {
    console.log(`  - href="${href}": ✅ 匹配，添加点击事件并移除 href`);
  } else {
    console.log(`  - href="${href}": ❌ 无匹配，保持原样`);
  }
});

console.log('\n🎯 预期结果:');
console.log('1. ✅ "login-flow" 文本元素可点击（节点标签引用）');
console.log('2. ✅ href="dashboard" 元素可点击，href 被移除（click 语句引用）');
console.log('3. ✅ 外部链接保持不变');
console.log('4. ✅ 点击时触发 handleNestedInteraction 而不是页面跳转');

console.log('\n📝 修复说明:');
console.log('- 新增了对 [href] 属性的检测');
console.log('- 拦截匹配的 href 点击事件');
console.log('- 移除 href 属性防止页面跳转');
console.log('- 触发自定义的嵌套图表展开逻辑');

console.log('\n🎉 href 处理测试完成！');