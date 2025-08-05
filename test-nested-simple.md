# 简化嵌套图表测试

```mermaid
flowchart TD
    A[开始] --> B[处理]
    B --> C[结束]
    B --> login-flow
    B --> user-model

---diagram:sequence:login-flow---
sequenceDiagram
    participant U as 用户
    participant S as 系统
    U->>S: 请求
    S-->>U: 响应
---end---

---diagram:class:user-model---
classDiagram
    class User {
        +String name
        +login()
    }
---end---
```

这个测试应该生成：
```
flowchart TD
    A[开始] --> B[处理]
    B --> C[结束]
    B --> login-flow
    B --> user-model
    click login-flow "login-flow"
    click user-model "user-model"
```