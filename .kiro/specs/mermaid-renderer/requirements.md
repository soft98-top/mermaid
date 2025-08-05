# Requirements Document

## Introduction

这是一个支持Mermaid图表渲染的网页应用程序。该程序不仅支持所有Mermaid原生图表类型的显示，还创新性地实现了不同类型图表的嵌套功能（这是Mermaid原生代码不支持的特性）。应用程序提供一个主画布用于图表显示，以及可在左右两侧切换的代码编辑器界面。

## Requirements

### Requirement 1

**User Story:** 作为用户，我希望能够在网页上渲染各种类型的Mermaid图表，以便可以可视化不同的图表内容

#### Acceptance Criteria

1. WHEN 用户输入有效的Mermaid代码 THEN 系统 SHALL 在主画布上正确渲染对应的图表
2. WHEN 用户输入流程图代码 THEN 系统 SHALL 显示完整的流程图
3. WHEN 用户输入序列图代码 THEN 系统 SHALL 显示完整的序列图
4. WHEN 用户输入甘特图代码 THEN 系统 SHALL 显示完整的甘特图
5. WHEN 用户输入类图代码 THEN 系统 SHALL 显示完整的类图
6. WHEN 用户输入状态图代码 THEN 系统 SHALL 显示完整的状态图
7. WHEN 用户输入饼图代码 THEN 系统 SHALL 显示完整的饼图
8. WHEN 用户输入Git图代码 THEN 系统 SHALL 显示完整的Git图
9. WHEN 用户输入ER图代码 THEN 系统 SHALL 显示完整的ER图
10. WHEN 用户输入用户旅程图代码 THEN 系统 SHALL 显示完整的用户旅程图

### Requirement 2

**User Story:** 作为用户，我希望能够嵌套不同类型的Mermaid图表，以便创建更复杂和层次化的可视化内容

#### Acceptance Criteria

1. WHEN 用户在一个图表中定义子图表引用 THEN 系统 SHALL 识别并解析嵌套结构
2. WHEN 用户点击包含嵌套图表的节点 THEN 系统 SHALL 展开显示子图表内容
3. WHEN 用户在流程图中嵌套序列图 THEN 系统 SHALL 正确渲染两种图表类型的组合
4. WHEN 用户在状态图中嵌套流程图 THEN 系统 SHALL 正确处理不同图表类型的嵌套
5. WHEN 嵌套图表超过3层深度 THEN 系统 SHALL 提供警告但仍支持渲染
6. WHEN 嵌套图表存在循环引用 THEN 系统 SHALL 检测并阻止无限递归
7. WHEN 用户修改嵌套图表的代码 THEN 系统 SHALL 实时更新所有相关的父图表

### Requirement 3

**User Story:** 作为用户，我希望有一个可切换位置的代码编辑器，以便根据个人偏好调整工作界面布局

#### Acceptance Criteria

1. WHEN 用户首次访问应用 THEN 系统 SHALL 默认在右侧显示代码编辑器
2. WHEN 用户点击位置切换按钮 THEN 系统 SHALL 将编辑器从右侧移动到左侧
3. WHEN 用户再次点击位置切换按钮 THEN 系统 SHALL 将编辑器从左侧移动到右侧
4. WHEN 用户切换编辑器位置 THEN 系统 SHALL 保持编辑器中的代码内容不变
5. WHEN 用户切换编辑器位置 THEN 系统 SHALL 自动调整主画布的大小和位置
6. WHEN 用户关闭编辑器 THEN 系统 SHALL 将主画布扩展到全屏
7. WHEN 用户重新打开编辑器 THEN 系统 SHALL 恢复到上次选择的位置

### Requirement 4

**User Story:** 作为用户，我希望有一个响应式的主画布，以便在不同屏幕尺寸下都能良好地显示图表

#### Acceptance Criteria

1. WHEN 用户调整浏览器窗口大小 THEN 系统 SHALL 自动调整画布尺寸以适应新的窗口大小
2. WHEN 图表内容超出画布边界 THEN 系统 SHALL 提供滚动功能
3. WHEN 图表内容较小 THEN 系统 SHALL 将图表居中显示在画布中
4. WHEN 用户使用移动设备访问 THEN 系统 SHALL 优化布局以适应小屏幕
5. WHEN 画布内容发生变化 THEN 系统 SHALL 平滑过渡到新的布局

### Requirement 5

**User Story:** 作为用户，我希望代码编辑器具有语法高亮和实时预览功能，以便更高效地编写和调试Mermaid代码

#### Acceptance Criteria

1. WHEN 用户在编辑器中输入Mermaid代码 THEN 系统 SHALL 提供语法高亮显示
2. WHEN 用户修改代码 THEN 系统 SHALL 在500毫秒内更新画布显示
3. WHEN 用户输入无效的Mermaid语法 THEN 系统 SHALL 在编辑器中显示错误提示
4. WHEN 用户输入代码时 THEN 系统 SHALL 提供自动补全功能
5. WHEN 用户按下Ctrl+Z THEN 系统 SHALL 撤销上一次编辑操作
6. WHEN 用户按下Ctrl+Y THEN 系统 SHALL 重做上一次撤销的操作

### Requirement 6

**User Story:** 作为用户，我希望能够导出渲染的图表，以便在其他地方使用这些图表

#### Acceptance Criteria

1. WHEN 用户点击导出按钮 THEN 系统 SHALL 提供PNG、SVG、PDF格式选项
2. WHEN 用户选择PNG格式 THEN 系统 SHALL 生成高质量的PNG图片文件
3. WHEN 用户选择SVG格式 THEN 系统 SHALL 生成可缩放的SVG矢量文件
4. WHEN 用户选择PDF格式 THEN 系统 SHALL 生成适合打印的PDF文件
5. WHEN 导出包含嵌套图表的内容 THEN 系统 SHALL 将所有层级的图表包含在导出文件中
6. WHEN 导出操作完成 THEN 系统 SHALL 自动下载文件到用户的默认下载目录