# 简单嵌套测试

```mermaid
flowchart TD
    A[开始] --> B[处理]
    B --> C[结束]
```

测试自动补全：
1. 输入 `flow` 应该提示 `flowchart`
2. 输入 `seq` 应该提示 `sequenceDiagram`
3. 输入 `{{dia` 应该提示嵌套语法