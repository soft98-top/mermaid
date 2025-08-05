# 嵌套图表简化语法

## 概述

我们已经简化了嵌套图表的语法，现在支持两种格式：

1. **简化语法**（推荐）：自动检测图表类型
2. **完整语法**（向后兼容）：明确指定图表类型

## 语法对比

### 引用语法

| 格式 | 语法 | 说明 |
|------|------|------|
| 简化语法 | `{{diagram:id}}` | 自动检测图表类型 |
| 完整语法 | `{{diagram:type:id}}` | 明确指定图表类型 |

### 定义语法

| 格式 | 语法 | 说明 |
|------|------|------|
| 简化语法 | `---diagram:id---` | 根据内容自动检测类型 |
| 完整语法 | `---diagram:type:id---` | 明确指定图表类型 |

## 使用示例

### 简化语法示例

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

### 混合语法示例

可以在同一个文档中混合使用两种语法：

```mermaid
flowchart TD
    A --> {{diagram:sequence:old-style}}
    B --> {{diagram:new-style}}
    
---diagram:sequence:old-style---
sequenceDiagram
    User->>System: Old style with explicit type
---end---

---diagram:new-style---
classDiagram
    class User {
        +String name
    }
---end---
```

## 自动类型检测

系统会根据图表内容的开头关键字自动检测类型：

| 内容开头 | 检测类型 |
|----------|----------|
| `flowchart` 或 `graph` | flowchart |
| `sequenceDiagram` | sequence |
| `classDiagram` | class |
| `gantt` | gantt |
| `stateDiagram` | state |
| `pie` | pie |
| `gitgraph` | git |
| `erDiagram` | er |
| `journey` | journey |

## 类型优先级

当引用和定义都指定了类型时：

1. **引用中指定类型**：使用引用中的类型
2. **仅定义中指定类型**：使用定义中的类型
3. **都未指定类型**：自动检测内容类型

## 自动补全支持

IDE 现在提供四种补全选项：

1. `nested-diagram-simple` - 简化引用语法
2. `nested-diagram-typed` - 完整引用语法
3. `diagram-definition-simple` - 简化定义语法
4. `diagram-definition-typed` - 完整定义语法

## 错误处理

### 类型检测失败

如果系统无法自动检测图表类型，会显示错误：
```
Unable to detect diagram type for: diagram-id
```

**解决方案**：
- 使用完整语法明确指定类型
- 确保图表内容以正确的关键字开头

### 循环引用

系统会检测并报告循环引用：
```
Circular reference detected: a -> b -> a
```

## 迁移指南

### 从完整语法迁移到简化语法

1. **引用迁移**：
   ```
   // 旧语法
   {{diagram:sequence:login}}
   
   // 新语法
   {{diagram:login}}
   ```

2. **定义迁移**：
   ```
   // 旧语法
   ---diagram:sequence:login---
   
   // 新语法
   ---diagram:login---
   ```

3. **渐进式迁移**：
   - 可以逐步迁移，新旧语法可以共存
   - 建议新图表使用简化语法
   - 现有图表可以保持不变

## 最佳实践

1. **优先使用简化语法**：更简洁，减少冗余
2. **保持一致性**：在同一文档中尽量使用相同的语法风格
3. **明确命名**：使用有意义的图表ID
4. **避免深层嵌套**：建议嵌套深度不超过3层
5. **文档化依赖**：复杂的依赖关系应该有文档说明

## 性能优化

简化语法带来的性能优化：

1. **减少解析开销**：更简单的正则表达式
2. **智能类型检测**：只在需要时进行类型检测
3. **缓存优化**：类型检测结果会被缓存
4. **向后兼容**：不影响现有图表的性能

## 技术实现

### 正则表达式更新

```javascript
// 支持两种格式的正则表达式
const nestedSyntaxRegex = /\{\{diagram:(?:([^:}]+):)?([^}]+)\}\}/g;
const definitionRegex = /---diagram:(?:([^:]+):)?([\w-]+)---([\s\S]*?)---end---/g;
```

### 类型检测逻辑

```javascript
function detectDiagramType(content) {
  const trimmed = content.trim().toLowerCase();
  if (trimmed.startsWith('flowchart') || trimmed.startsWith('graph')) return 'flowchart';
  if (trimmed.startsWith('sequencediagram')) return 'sequence';
  // ... 其他类型检测
  return null;
}
```

这个简化语法让嵌套图表的使用更加直观和简洁，同时保持了完整的功能和向后兼容性。