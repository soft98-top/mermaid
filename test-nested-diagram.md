# 嵌套图表测试代码

将以下代码复制到编辑器中测试嵌套渲染功能：

```mermaid
flowchart TD
    A[用户登录] --> B{验证成功?}
    B -->|是| C[显示仪表板]
    B -->|否| D[登录详情]
    C --> E[用户操作]
    E --> F[用户模型]
    D --> A
    
    click D "{{diagram:sequence:login-flow}}"
    click F "{{diagram:class:user-model}}"

---diagram:sequence:login-flow---
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

---diagram:class:user-model---
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

## 测试要点

1. **嵌套引用**: `{{diagram:sequence:login-flow}}` 和 `{{diagram:class:user-model}}`
2. **图表定义**: `---diagram:type:id---` 到 `---end---` 块
3. **多层嵌套**: 流程图中嵌入序列图和类图
4. **自动补全**: 输入 `{{dia` 应该提示嵌套语法
5. **语法验证**: 修改图表ID测试错误检测