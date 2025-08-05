// 完整测试简化嵌套图表语法
import { NestedDiagramProcessor } from './src/services/nestedDiagramProcessor.js';

const processor = new NestedDiagramProcessor();

// 测试简化语法的完整示例
const simplifiedSyntaxTest = `
flowchart TD
    A[用户登录] --> B{验证成功?}
    B -->|是| C[显示仪表板]
    B -->|否| D[登录详情]
    C --> E[用户操作]
    E --> F[用户模型]
    D --> A
    
    click D "{{diagram:login-flow}}"
    click F "{{diagram:user-model}}"

---diagram:login-flow---
sequenceDiagram
    participant U as 用户
    participant S as 系统
    participant D as 数据库
    U->>S: 输入用户名密码
    S->>D: 验证凭据
    D-->>S: 返回结果
    S-->>U: 显示错误信息
    U->>S: 重新输入
---end---

---diagram:user-model---
classDiagram
    class User {
        +String username
        +String email
        +Date loginTime
        +login()
        +logout()
    }
    class Session {
        +String sessionId
        +Date expireTime
        +isValid()
    }
    User --> Session : creates
---end---
`;

console.log('🧪 测试简化嵌套图表语法...\n');

try {
    const result = processor.parseNestedSyntax(simplifiedSyntaxTest);
    
    if (result.success) {
        console.log('✅ 解析成功！');
        console.log(`📊 主图表类型: ${result.parsedDiagram.type}`);
        console.log(`🔗 嵌套图表数量: ${result.parsedDiagram.nestedDiagrams.size}`);
        
        console.log('\n📋 嵌套图表详情:');
        result.parsedDiagram.nestedDiagrams.forEach((diagram, id) => {
            console.log(`  • ${id}: ${diagram.type} (自动检测)`);
        });
        
        console.log(`\n🔄 依赖关系: ${result.dependencies.length} 个`);
        result.dependencies.forEach(dep => {
            if (dep.dependencies.length > 0) {
                console.log(`  • ${dep.id} 依赖: [${dep.dependencies.join(', ')}]`);
            } else {
                console.log(`  • ${dep.id}: 无依赖`);
            }
        });
        
        console.log(`\n📐 拓扑排序: [${result.topologicalOrder.join(' -> ')}]`);
        
        if (result.warnings.length > 0) {
            console.log(`\n⚠️  警告: ${result.warnings.length} 个`);
            result.warnings.forEach(warning => {
                console.log(`  • ${warning.diagramId}: 嵌套深度 ${warning.currentDepth}/${warning.maxDepth}`);
            });
        } else {
            console.log('\n✅ 无警告');
        }
        
        console.log('\n🎯 测试结果: 简化语法工作正常！');
        
    } else {
        console.log('❌ 解析失败:');
        console.log(`   类型: ${result.error.type}`);
        console.log(`   消息: ${result.error.message}`);
        if (result.error.line) {
            console.log(`   位置: 第 ${result.error.line} 行，第 ${result.error.column} 列`);
        }
    }
} catch (error) {
    console.log('💥 测试异常:', error.message);
    console.log(error.stack);
}

// 测试混合语法
console.log('\n' + '='.repeat(50));
console.log('🔄 测试混合语法（新旧语法共存）...\n');

const mixedSyntaxTest = `
flowchart TD
    A --> {{diagram:sequence:old-style}}
    B --> {{diagram:new-style}}
    C --> {{diagram:flowchart:explicit-type}}
    
---diagram:sequence:old-style---
sequenceDiagram
    User->>System: 旧语法（明确类型）
---end---

---diagram:new-style---
classDiagram
    class User {
        +String name
    }
    note for User : 新语法（自动检测）
---end---

---diagram:flowchart:explicit-type---
flowchart LR
    X --> Y
    note: 明确指定类型
---end---
`;

try {
    const result = processor.parseNestedSyntax(mixedSyntaxTest);
    
    if (result.success) {
        console.log('✅ 混合语法解析成功！');
        console.log('\n📋 图表类型检测结果:');
        result.parsedDiagram.nestedDiagrams.forEach((diagram, id) => {
            const detectionMethod = id.includes('old-style') ? '引用指定' : 
                                  id.includes('explicit-type') ? '引用指定' : '自动检测';
            console.log(`  • ${id}: ${diagram.type} (${detectionMethod})`);
        });
        
        console.log('\n🎯 混合语法测试: 通过！');
    } else {
        console.log('❌ 混合语法解析失败:', result.error.message);
    }
} catch (error) {
    console.log('💥 混合语法测试异常:', error.message);
}

console.log('\n' + '='.repeat(50));
console.log('🏁 测试完成！');