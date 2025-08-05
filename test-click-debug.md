# 点击事件调试测试

测试两种不同的嵌套图表引用方式：

## 方式1：在节点标签中引用（应该可以工作）
```mermaid
flowchart TD
    A --> B
    B -->|否| D[{{diagram:login-flow}}]

---diagram:login-flow---
sequenceDiagram
    User->>System: Login
---end---
```

## 方式2：使用 click 语句引用（需要修复）
```mermaid
flowchart TD
    A --> B
    B --> D[登录详情]
    
    click D "{{diagram:login-flow}}"

---diagram:login-flow---
sequenceDiagram
    User->>System: Login
---end---
```

## 方式3：混合使用
```mermaid
flowchart TD
    A --> B
    B -->|节点引用| C[{{diagram:node-ref}}]
    B -->|点击引用| D[登录详情]
    
    click D "{{diagram:click-ref}}"

---diagram:node-ref---
sequenceDiagram
    User->>System: Node Reference
---end---

---diagram:click-ref---
classDiagram
    class User {
        +login()
    }
---end---
```