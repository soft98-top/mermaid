# 基础简化语法测试

```mermaid
flowchart TD
    A --> B
    B --> {{diagram:test}}

---diagram:test---
sequenceDiagram
    User->>System: Hello
---end---
```