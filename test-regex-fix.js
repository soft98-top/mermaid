// 测试修复后的正则表达式
const testRegex = /\{\{diagram:(?:([^:}]+):)?([\w-]+)\}\}/g;

const testCases = [
  '{{diagram:login-flow}}',
  '{{diagram:sequence:login-flow}}',
  '{{diagram:user-model}}',
  '{{diagram:class:user-model}}',
  'A --> {{diagram:test}} B --> C',
  'click D "{{diagram:login-flow}}"',
  'click F "{{diagram:user-model}}"'
];

console.log('测试修复后的正则表达式...\n');

testCases.forEach((testCase, index) => {
  console.log(`测试用例 ${index + 1}: ${testCase}`);
  
  const matches = [];
  let match;
  
  // 重置正则表达式
  testRegex.lastIndex = 0;
  
  while ((match = testRegex.exec(testCase)) !== null) {
    matches.push({
      fullMatch: match[0],
      type: match[1] || 'auto-detect',
      id: match[2]
    });
  }
  
  if (matches.length > 0) {
    matches.forEach(m => {
      console.log(`  ✅ 匹配: ${m.fullMatch} -> 类型: ${m.type}, ID: ${m.id}`);
    });
  } else {
    console.log('  ❌ 无匹配');
  }
  
  console.log('');
});

// 测试多行内容
const multilineTest = `
flowchart TD
    A --> {{diagram:login-flow}}
    B --> {{diagram:sequence:user-flow}}
    
    click D "{{diagram:login-flow}}"
    click F "{{diagram:user-model}}"
`;

console.log('测试多行内容...');
console.log(multilineTest);

const multilineMatches = [];
let match;

testRegex.lastIndex = 0;
while ((match = testRegex.exec(multilineTest)) !== null) {
  multilineMatches.push({
    fullMatch: match[0],
    type: match[1] || 'auto-detect',
    id: match[2]
  });
}

console.log(`找到 ${multilineMatches.length} 个匹配:`);
multilineMatches.forEach((m, i) => {
  console.log(`  ${i + 1}. ${m.fullMatch} -> 类型: ${m.type}, ID: ${m.id}`);
});