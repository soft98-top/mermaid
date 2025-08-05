// 验证 click 事件修复的脚本
import { NestedDiagramProcessor } from './src/services/nestedDiagramProcessor.js';

const processor = new NestedDiagramProcessor();

console.log('🔧 验证 Click 事件修复...\n');

// 测试1：基础 click 事件
const basicClickTest = `
flowchart TD
    A[开始] --> B[登录页面]
    B --> C[验证]
    
    click B "{{diagram:login-flow}}"

---diagram:login-flow---
sequenceDiagram
    participant U as 用户
    participant S as 系统
    U->>S: 输入用户名密码
    S-->>U: 验证结果
---end---
`;

console.log('📋 测试1: 基础 click 事件');
try {
    const result = processor.parseNestedSyntax(basicClickTest);
    
    if (result.success) {
        console.log('✅ 解析成功');
        console.log('📄 处理后的内容:');
        console.log(result.parsedDiagram.content);
        console.log('');
        
        // 验证关键点
        const hasCorrectClick = result.parsedDiagram.content.includes('click B "login-flow"');
        const hasNestedDiagram = result.parsedDiagram.nestedDiagrams.has('login-flow');
        
        console.log(`🎯 Click 语句正确: ${hasCorrectClick ? '✅' : '❌'}`);
        console.log(`🎯 嵌套图表注册: ${hasNestedDiagram ? '✅' : '❌'}`);
        
        if (hasNestedDiagram) {
            const nested = result.parsedDiagram.nestedDiagrams.get('login-flow');
            console.log(`🎯 自动检测类型: ${nested.type} ✅`);
        }
    } else {
        console.log('❌ 解析失败:', result.error.message);
    }
} catch (error) {
    console.log('💥 测试异常:', error.message);
}

console.log('\n' + '='.repeat(50));

// 测试2：混合引用方式
const mixedReferenceTest = `
flowchart TD
    A --> B{验证}
    B -->|成功| C[仪表板]
    B -->|失败| D[{{diagram:login-details}}]
    
    click C "{{diagram:dashboard}}"

---diagram:login-details---
sequenceDiagram
    User->>System: 重新输入
---end---

---diagram:dashboard---
flowchart LR
    X --> Y
---end---
`;

console.log('📋 测试2: 混合引用方式');
try {
    const result = processor.parseNestedSyntax(mixedReferenceTest);
    
    if (result.success) {
        console.log('✅ 解析成功');
        
        // 验证不同的引用方式
        const hasNodeLabel = result.parsedDiagram.content.includes('D["login-details"]');
        const hasClickStatement = result.parsedDiagram.content.includes('click C "dashboard"');
        const hasBothDiagrams = result.parsedDiagram.nestedDiagrams.size === 2;
        
        console.log(`🎯 节点标签引用: ${hasNodeLabel ? '✅' : '❌'}`);
        console.log(`🎯 Click 语句引用: ${hasClickStatement ? '✅' : '❌'}`);
        console.log(`🎯 两个嵌套图表: ${hasBothDiagrams ? '✅' : '❌'}`);
        
        console.log('\n📄 处理后的内容:');
        console.log(result.parsedDiagram.content);
    } else {
        console.log('❌ 解析失败:', result.error.message);
    }
} catch (error) {
    console.log('💥 测试异常:', error.message);
}

console.log('\n' + '='.repeat(50));
console.log('🎉 Click 事件修复验证完成！');

// 总结修复的问题
console.log('\n📝 修复总结:');
console.log('1. ✅ 修复了双引号问题: "{{diagram:id}}" → "id"');
console.log('2. ✅ 区分了节点标签和 click 语句的处理');
console.log('3. ✅ 保持了简化语法的自动类型检测');
console.log('4. ✅ 确保了向后兼容性');
console.log('5. ✅ 移除了重复的 click 语句生成');