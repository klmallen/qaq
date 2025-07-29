# QAQ游戏引擎节点编辑器使用指南

## 🎯 **概述**

QAQ游戏引擎的节点编辑器是一个基于Vue Flow的通用可视化编程工具，支持材质编辑器和蓝图功能。它提供了直观的拖拽式节点连接界面，让用户可以通过可视化方式创建复杂的材质和逻辑。

## 🚀 **快速开始**

### **打开材质编辑器**
1. 在QAQ编辑器中，点击顶部菜单栏的"+"按钮
2. 选择"Material Editor"
3. 材质编辑器将在新标签页中打开

### **基本操作**
- **添加节点**：点击工具栏的"添加节点"按钮，选择节点类型
- **连接节点**：拖拽节点右侧的输出端口到其他节点的输入端口
- **移动节点**：直接拖拽节点即可移动
- **选择节点**：点击节点选中，按住Ctrl多选
- **删除节点**：选中节点后点击"删除"按钮或按Delete键

## 📦 **节点类型**

### **输入节点 (Input Nodes)**

#### **Float节点**
- **功能**：提供浮点数值输入
- **输出**：Float类型数据
- **用途**：材质参数、数学运算输入
- **颜色**：绿色端口 (#4ade80)

#### **Vector3节点**
- **功能**：提供三维向量输入 (X, Y, Z)
- **输出**：Vector3类型数据
- **用途**：位置、方向、法线贴图
- **颜色**：蓝色端口 (#60a5fa)

#### **Color节点**
- **功能**：提供颜色选择器
- **输出**：Color类型数据
- **用途**：材质颜色、发光颜色
- **颜色**：粉色端口 (#f472b6)

#### **Texture节点**
- **功能**：纹理资源引用
- **输出**：Texture类型数据
- **用途**：贴图、法线贴图、遮罩
- **颜色**：紫色端口 (#a78bfa)

### **数学节点 (Math Nodes)**

#### **Add节点**
- **功能**：两个数值相加
- **输入**：A (Float), B (Float)
- **输出**：Result (Float)

#### **Multiply节点**
- **功能**：两个数值相乘
- **输入**：A (Float), B (Float)
- **输出**：Result (Float)

#### **Lerp节点**
- **功能**：线性插值
- **输入**：A (Float), B (Float), T (Float)
- **输出**：Result (Float)
- **公式**：Result = A + (B - A) * T

### **输出节点 (Output Nodes)**

#### **Material Output节点**
- **功能**：材质最终输出
- **输入**：
  - Albedo (Color) - 基础颜色
  - Metallic (Float) - 金属度
  - Roughness (Float) - 粗糙度
  - Normal (Vector3) - 法线
  - Emission (Color) - 发光
  - Alpha (Float) - 透明度

## 🎨 **材质编辑器功能**

### **实时预览**
- **预览形状**：支持立方体、球体、平面三种预览形状
- **材质属性**：实时显示材质的视觉效果
- **复杂度指示**：显示材质的计算复杂度

### **材质管理**
- **保存材质**：将节点图保存为.qaq_material文件
- **加载材质**：从文件加载已保存的材质
- **导出功能**：导出材质配置和着色器代码

### **属性面板**
- **节点属性**：选中节点时显示详细属性
- **实时编辑**：修改属性时实时更新预览
- **类型安全**：确保连接的数据类型匹配

## 🔧 **高级功能**

### **连接验证**
- **类型检查**：只允许兼容类型的端口连接
- **循环检测**：防止创建循环依赖
- **重复连接**：防止创建重复的连接

### **快捷键**
- **Ctrl+A**：全选节点
- **Delete**：删除选中节点
- **Ctrl+C**：复制节点（计划中）
- **Ctrl+V**：粘贴节点（计划中）
- **Ctrl+Z**：撤销操作（计划中）

### **导出格式**
```json
{
  "name": "材质名称",
  "nodes": [...],
  "edges": [...],
  "metadata": {
    "version": "1.0",
    "created": "2024-12-19T...",
    "complexity": 15.5
  }
}
```

## 🎯 **使用示例**

### **创建基础材质**
1. 添加一个Color节点，设置为红色
2. 添加一个Float节点，设置粗糙度为0.3
3. 添加Material Output节点
4. 连接Color节点到Material Output的Albedo输入
5. 连接Float节点到Material Output的Roughness输入
6. 查看右侧预览面板的效果

### **创建金属材质**
1. 添加Color节点（基础颜色）
2. 添加Float节点（金属度=1.0）
3. 添加Float节点（粗糙度=0.1）
4. 连接到Material Output对应输入
5. 预览金属效果

### **使用数学节点**
1. 添加两个Float节点
2. 添加Multiply节点
3. 连接Float节点到Multiply的A和B输入
4. 连接Multiply输出到Material Output

## 🔍 **故障排除**

### **常见问题**

#### **节点无法连接**
- 检查端口类型是否匹配
- 确保不是连接到自身
- 检查是否已存在相同连接

#### **预览不更新**
- 检查Material Output节点是否存在
- 确保所有必要的输入都已连接
- 尝试重新选择预览形状

#### **性能问题**
- 减少节点数量
- 避免过深的节点层次
- 检查复杂度指示器

### **调试技巧**
- 使用浏览器开发者工具查看控制台日志
- 检查节点的data属性是否正确
- 验证连接的sourceHandle和targetHandle

## 🚀 **扩展开发**

### **创建自定义节点**
1. 在`components/editor/nodes/`目录创建新组件
2. 实现Props接口和Emits事件
3. 在QaqNodeEditor中注册节点类型
4. 添加到节点菜单中

### **节点组件结构**
```vue
<template>
  <div class="qaq-custom-node">
    <!-- 节点内容 -->
    <Handle type="target" :position="Position.Left" />
    <Handle type="source" :position="Position.Right" />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

interface Props {
  id: string
  data: any
  selected?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  update: [nodeId: string, data: any]
}>()
</script>
```

## 📚 **API参考**

### **QaqNodeEditor组件**
```typescript
interface Props {
  mode?: 'material' | 'blueprint'
  initialNodes?: any[]
  initialEdges?: any[]
}

interface Emits {
  'graph-change': [{ nodes: any[], edges: any[] }]
  'node-select': [node: any]
  'export': [data: any]
}
```

### **节点数据结构**
```typescript
interface NodeData {
  label: string
  outputType?: string
  inputTypes?: string[]
  value?: any
  [key: string]: any
}
```

## 🎉 **总结**

QAQ节点编辑器提供了强大而直观的可视化编程体验，支持：

✅ **完整的节点系统** - 输入、数学、输出节点  
✅ **实时预览** - 材质效果即时可见  
✅ **类型安全** - 智能连接验证  
✅ **可扩展架构** - 易于添加新节点类型  
✅ **现代UI** - 基于Vue Flow的流畅体验  

开始创建您的第一个材质吧！🚀
