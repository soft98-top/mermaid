# 嵌套图表修复测试

## 测试代码

```mermaid
flowchart TD
    A[开始] --> B{验证}
    B -->|成功| C[仪表板]
    B -->|失败| D[登录详情]
    
    {{diagram:sequence:login-flow}}
    {{diagram:class:user-model}}

---diagram:sequence:login-flow---
sequenceDiagram
    participant U as 用户
    participant S as 系统
    U->>S: 登录请求
    S-->>U: 返回结果
---end---

---diagram:class:user-model---
classDiagram
    class User {
        +String name
        +login()
    }
---end---
```

## 修复内容

1. **语法转换改进**: `{{diagram:type:id}}` 现在转换为 `click id "id"` 格式
2. **点击处理增强**: 添加了对 `data-click` 属性的处理
3. **验证简化**: 移除了嵌套图表的严格验证，让 Mermaid 自行处理
4. **错误处理优化**: 改进了渲染失败时的错误信息

## 预期效果

- 外层流程图正常渲染
- 嵌套图表引用显示为可点击的蓝色文本，带有📊图标
- 点击后应该能正确展开嵌套图表内容
- 嵌套图表应该能正常渲染，而不是显示错误占位符