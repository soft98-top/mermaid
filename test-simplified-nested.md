# 简化嵌套图表语法测试

测试新的简化嵌套图表语法，无需在引用时指定类型：

```mermaid
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
```

## 新语法特点

1. **简化引用**: `{{diagram:id}}` 而不是 `{{diagram:type:id}}`
2. **简化定义**: `---diagram:id---` 而不是 `---diagram:type:id---`
3. **自动类型检测**: 系统根据图表内容自动检测类型
4. **向后兼容**: 仍然支持原有的完整语法

## 测试用例

### 1. 简化引用语法
- `{{diagram:login-flow}}` - 自动检测为 sequence 类型
- `{{diagram:user-model}}` - 自动检测为 class 类型

### 2. 简化定义语法
- `---diagram:login-flow---` - 根据内容检测为 sequenceDiagram
- `---diagram:user-model---` - 根据内容检测为 classDiagram

### 3. 混合语法（向后兼容）
可以同时使用新旧语法：
- `{{diagram:sequence:old-style}}` - 明确指定类型
- `{{diagram:new-style}}` - 自动检测类型