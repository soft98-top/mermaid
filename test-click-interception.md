# Click 事件拦截测试

测试 click 事件是否被正确拦截，不会导致页面跳转。

## 测试用例1：基础拦截测试
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

## 测试用例2：多个 click 事件拦截
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

## 测试用例3：混合外部链接（应该正常跳转）
```mermaid
flowchart TD
    A --> B[内部图表]
    A --> C[外部链接]
    
    click B "{{diagram:internal}}"
    click C "https://example.com"

---diagram:internal---
sequenceDiagram
    User->>System: 内部图表
---end---
```

## 预期行为

1. **内部嵌套图表**：点击应该在当前画布展开，不应该有任何页面跳转 ✅
2. **外部链接**：应该正常跳转到外部网站 ✅
3. **URL 不变**：点击内部图表时，浏览器地址栏不应该发生变化 ✅

## 拦截机制

1. **多层事件拦截**：
   - Capture 阶段拦截
   - Bubble 阶段拦截
   - mousedown 事件拦截

2. **属性清理**：
   - 移除 `href` 属性
   - 移除 `onclick` 属性

3. **全局拦截器**：
   - SVG 级别的 click 事件拦截作为后备

4. **Mermaid 配置**：
   - 禁用默认的 click 处理器