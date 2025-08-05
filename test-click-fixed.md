# Click 事件修复测试

现在 click 事件应该可以正常工作了！

## 测试1：基础 click 事件
```mermaid
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
```

## 测试2：混合引用方式
```mermaid
flowchart TD
    A[用户登录] --> B{验证成功?}
    B -->|是| C[显示仪表板]
    B -->|否| D[{{diagram:login-details}}]
    C --> E[用户操作]
    
    click C "{{diagram:dashboard}}"
    click E "{{diagram:user-actions}}"

---diagram:login-details---
sequenceDiagram
    User->>System: 重新输入
    System-->>User: 错误提示
---end---

---diagram:dashboard---
flowchart LR
    X[主页] --> Y[数据]
    Y --> Z[报表]
---end---

---diagram:user-actions---
classDiagram
    class User {
        +String name
        +login()
        +logout()
    }
---end---
```

## 测试3：多个 click 事件
```mermaid
flowchart TD
    A --> B[功能1]
    A --> C[功能2]
    A --> D[功能3]
    
    click B "{{diagram:feature1}}"
    click C "{{diagram:feature2}}"
    click D "{{diagram:feature3}}"

---diagram:feature1---
sequenceDiagram
    User->>System: 功能1
---end---

---diagram:feature2---
classDiagram
    class Feature2
---end---

---diagram:feature3---
flowchart LR
    X --> Y
---end---
```

## 预期行为

1. **节点标签引用**：`D[{{diagram:login-details}}]` → `D["login-details"]` ✅
2. **Click 语句引用**：`click B "{{diagram:login-flow}}"` → `click B "login-flow"` ✅
3. **点击交互**：点击相应的节点应该能弹出嵌套图表 ✅
4. **自动类型检测**：系统根据图表内容自动检测类型 ✅