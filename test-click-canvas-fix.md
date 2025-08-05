# Click 事件画布修复测试

测试 click 事件是否能在当前画布中正确渲染嵌套图表，而不是跳转到新页面。

## 测试用例1：基础 click 事件
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

## 测试用例2：对比节点标签引用（应该工作正常）
```mermaid
flowchart TD
    A[开始] --> B[登录页面]
    B --> C[{{diagram:login-details}}]

---diagram:login-details---
sequenceDiagram
    participant U as 用户
    participant S as 系统
    U->>S: 登录详情
    S-->>U: 返回信息
---end---
```

## 测试用例3：混合使用
```mermaid
flowchart TD
    A[开始] --> B[登录]
    B --> C[仪表板]
    B --> D[{{diagram:error-flow}}]
    
    click C "{{diagram:dashboard}}"

---diagram:error-flow---
sequenceDiagram
    User->>System: 错误处理
---end---

---diagram:dashboard---
flowchart LR
    X[主页] --> Y[数据]
    Y --> Z[报表]
---end---
```

## 预期行为

1. **节点标签点击**：点击 `C[{{diagram:login-details}}]` 应该在画布中展开嵌套图表 ✅
2. **Click 语句点击**：点击 `B` 节点（有 `click B "{{diagram:login-flow}}"` 语句）应该在画布中展开嵌套图表，而不是跳转到 `/login-flow` ✅
3. **混合使用**：两种方式应该都能正常工作 ✅

## 技术实现

修改了 `DiagramCanvas.tsx` 中的事件处理逻辑：
- 检测 Mermaid 生成的带有 `href` 属性的可点击元素
- 拦截点击事件并阻止默认的链接跳转行为
- 触发我们自己的嵌套图表展开逻辑