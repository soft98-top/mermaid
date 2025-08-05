# xlink:href 属性处理测试

测试对 Mermaid 生成的 `xlink:href` 属性的正确拦截。

## 发现的问题

Mermaid 生成的 SVG 元素使用的是 `xlink:href` 属性而不是 `href` 属性：

```xml
<a xlink:href="login-flow" data-node="true" data-id="D" transform="translate(184.5, 309.3984375)">
  <g class="node default clickable flowchart-label" id="flowchart-D-5">
    <rect class="basic label-container" style="" rx="0" ry="0" x="-39.5" y="-19.5" width="79" height="39"></rect>
    <g class="label" style="" transform="translate(-32, -12)">
      <rect></rect>
      <foreignObject width="64" height="24">
        <div xmlns="http://www.w3.org/1999/xhtml" style="display: inline-block; white-space: nowrap;">
          <span class="nodeLabel">登录详情</span>
        </div>
      </foreignObject>
    </g>
  </g>
</a>
```

## 修复内容

### 1. 扩展元素选择器
```typescript
// 之前只查找 [href]
const clickableElements = svgElement.querySelectorAll('[href]');

// 现在同时查找 href 和 xlink:href
const clickableElements = svgElement.querySelectorAll('[href], [xlink\\:href]');
```

### 2. 扩展属性获取
```typescript
// 之前只获取 href
const href = el.getAttribute('href');

// 现在同时检查两种属性
const href = el.getAttribute('href') || el.getAttribute('xlink:href');
```

### 3. 扩展属性清理
```typescript
// 之前只移除 href
el.removeAttribute('href');

// 现在同时移除两种属性
el.removeAttribute('href');
el.removeAttribute('xlink:href');
```

### 4. 扩展 MutationObserver 监控
```typescript
// 之前只监控 href
attributeFilter: ['href']

// 现在同时监控两种属性
attributeFilter: ['href', 'xlink:href']
```

## 测试用例

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

## 预期行为

1. **正确识别**：系统应该能识别带有 `xlink:href="login-flow"` 的元素 ✅
2. **事件拦截**：点击应该被正确拦截，不会跳转页面 ✅
3. **属性清理**：`xlink:href` 属性应该被移除 ✅
4. **嵌套展开**：应该正确展开嵌套图表 ✅

## 调试日志

现在应该能看到以下日志：
- `🔧 Intercepting click event for nested diagram: login-flow`
- `🔧 Global interceptor caught click for nested diagram: login-flow`
- `🔧 MutationObserver: Removing re-added href/xlink:href: login-flow`

## 兼容性

修复后的代码同时支持：
- **标准 href**：`<a href="diagram-id">`
- **SVG xlink:href**：`<a xlink:href="diagram-id">`
- **混合使用**：在同一个 SVG 中可能同时存在两种格式