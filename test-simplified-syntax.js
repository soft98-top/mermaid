// 简单的测试脚本来验证简化语法
import { NestedDiagramProcessor } from './src/services/nestedDiagramProcessor.js';

const processor = new NestedDiagramProcessor();

// 测试简化语法
const testCode = `
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

console.log('测试简化嵌套图表语法...');

try {
    const result = processor.parseNestedSyntax(testCode);
    
    if (result.success) {
        console.log('✅ 解析成功！');
        console.log('主图表类型:', result.parsedDiagram.type);
        console.log('嵌套图表数量:', result.parsedDiagram.nestedDiagrams.size);
        
        result.parsedDiagram.nestedDiagrams.forEach((diagram, id) => {
            console.log(`  - ${id}: ${diagram.type}`);
        });
        
        console.log('依赖关系:', result.dependencies.length);
        result.dependencies.forEach(dep => {
            console.log(`  - ${dep.id} 依赖: [${dep.dependencies.join(', ')}]`);
        });
        
        console.log('拓扑排序:', result.topologicalOrder);
        
        if (result.warnings.length > 0) {
            console.log('警告:', result.warnings.length);
            result.warnings.forEach(warning => {
                console.log(`  - ${warning.diagramId}: 深度 ${warning.currentDepth}`);
            });
        }
    } else {
        console.log('❌ 解析失败:', result.error);
    }
} catch (error) {
    console.log('❌ 测试失败:', error.message);
}

// 测试混合语法
const mixedSyntaxCode = `
flowchart TD
    A --> {{diagram:sequence:old-style}}
    B --> {{diagram:new-style}}
    
---diagram:sequence:old-style---
sequenceDiagram
    User->>System: Old style
---end---

---diagram:new-style---
classDiagram
    class User {
        +String name
    }
---end---
`;

console.log('\n测试混合语法...');

try {
    const result = processor.parseNestedSyntax(mixedSyntaxCode);
    
    if (result.success) {
        console.log('✅ 混合语法解析成功！');
        result.parsedDiagram.nestedDiagrams.forEach((diagram, id) => {
            console.log(`  - ${id}: ${diagram.type}`);
        });
    } else {
        console.log('❌ 混合语法解析失败:', result.error);
    }
} catch (error) {
    console.log('❌ 混合语法测试失败:', error.message);
}