# QAQ引擎 - 数据结构对比与集成方案

## 📊 **现有Vue Flow编辑器数据结构分析**

### **1. 现有节点数据结构**
```typescript
// 现有Vue Flow节点格式
interface VueFlowNode {
  id: string
  type: string  // Vue组件类型: 'input', 'math', 'output'
  position: { x: number, y: number }
  data: {
    label: string
    outputType?: string  // 'float', 'vector3', 'color', 'texture'
    value?: number
    color?: string
    vector?: { x: number, y: number, z: number }
    textureName?: string
  }
  selected?: boolean
  dragging?: boolean
}
```

### **2. 现有连接数据结构**
```typescript
// 现有Vue Flow连接格式
interface VueFlowConnection {
  id: string
  source: string
  target: string
  sourceHandle: string
  targetHandle: string
  type?: string
  animated?: boolean
  style?: any
}
```

### **3. 现有端口命名规则**
- **输入端口**: `${nodeId}-input` 或 `${nodeId}-input-${portName}`
- **输出端口**: `${nodeId}-output` 或 `${nodeId}-output-${portName}`

## 🎯 **QAQ统一数据结构设计**

### **1. 统一节点数据结构**
```typescript
// QAQ统一节点格式
interface NodeInstance {
  // Vue Flow兼容属性
  id: string
  type: string  // Vue组件类型
  position: { x: number, y: number }
  data: NodeInstanceData
  selected?: boolean
  dragging?: boolean
  
  // QAQ扩展属性
  nodeType?: NodeType  // QAQ节点类型枚举
  category?: NodeCategory
}

interface NodeInstanceData {
  // 基础属性
  label: string
  nodeType: NodeType  // 统一的节点类型枚举
  
  // 端口数据
  inputValues: { [portId: string]: any }
  outputValues: { [portId: string]: any }
  inputConnections: { [portId: string]: boolean }
  outputConnections: { [portId: string]: number }
  
  // 节点属性
  properties: { [key: string]: any }
  
  // 状态信息
  hasError?: boolean
  errorMessage?: string
  warnings?: string[]
}
```

### **2. 统一连接数据结构**
```typescript
// QAQ统一连接格式
interface ConnectionInstance {
  // Vue Flow兼容属性
  id: string
  source: string
  target: string
  sourceHandle: string
  targetHandle: string
  type?: string
  animated?: boolean
  style?: any
  
  // QAQ扩展属性
  dataType?: DataType  // 传输的数据类型
  valid?: boolean      // 连接是否有效
  debugInfo?: {        // 调试信息
    sourceType: DataType
    targetType: DataType
    compatible: boolean
    conversionNeeded: boolean
  }
}
```

### **3. 统一端口命名规则**
- **输入端口**: `${nodeId}-input-${portId}`
- **输出端口**: `${nodeId}-output-${portId}`
- **向后兼容**: 支持现有的简化命名格式

## 🔄 **数据结构转换映射**

### **1. 节点类型映射**
```typescript
// Vue组件类型 -> QAQ节点类型
const NODE_TYPE_MAPPING = {
  // 现有类型
  'input': {
    'float': NodeType.INPUT_FLOAT,
    'vector3': NodeType.INPUT_VECTOR3,
    'color': NodeType.INPUT_COLOR,
    'texture': NodeType.INPUT_TEXTURE
  },
  'math': NodeType.MATH_ADD,  // 默认，需要更细分
  'output': NodeType.OUTPUT_MATERIAL,
  
  // 粒子专用类型
  'particle-age': NodeType.PARTICLE_AGE,
  'particle-color-ramp': NodeType.COLOR_RAMP,
  'particle-output': NodeType.PARTICLE_OUTPUT
}
```

### **2. 数据类型映射**
```typescript
// 现有outputType -> QAQ DataType
const DATA_TYPE_MAPPING = {
  'float': DataType.FLOAT,
  'vector3': DataType.VEC3,
  'color': DataType.COLOR,
  'texture': DataType.TEXTURE
}
```

### **3. 端口颜色映射**
```typescript
// DataType -> 端口颜色
const PORT_COLOR_MAPPING = {
  [DataType.FLOAT]: '#4ade80',    // 绿色
  [DataType.VEC2]: '#3b82f6',     // 蓝色
  [DataType.VEC3]: '#3b82f6',     // 蓝色
  [DataType.VEC4]: '#1d4ed8',     // 深蓝色
  [DataType.COLOR]: '#f472b6',    // 粉色
  [DataType.TEXTURE]: '#a78bfa',  // 紫色
  [DataType.BOOL]: '#ef4444',     // 红色
  [DataType.INT]: '#22c55e'       // 深绿色
}
```

## 🔧 **VueFlowAdapter转换器**

### **1. 转换器功能**
```typescript
export class VueFlowAdapter {
  // QAQ -> Vue Flow
  static toVueFlow(graph: MaterialGraph): {
    nodes: VueFlowNode[], 
    edges: VueFlowConnection[]
  }
  
  // Vue Flow -> QAQ
  static fromVueFlow(
    nodes: VueFlowNode[], 
    edges: VueFlowConnection[]
  ): MaterialGraph
  
  // 验证并转换
  static validateAndConvert(
    nodes: VueFlowNode[], 
    edges: VueFlowConnection[]
  ): { graph: MaterialGraph, errors: string[] }
  
  // 更新连接类型信息
  static updateConnectionTypes(graph: MaterialGraph): void
}
```

### **2. 向后兼容性保证**
- **现有节点**: 完全兼容现有的input/math/output节点
- **现有连接**: 支持现有的连接格式
- **现有端口**: 支持简化的端口命名
- **渐进升级**: 可以逐步迁移到新格式

## 📋 **类型系统设计**

### **1. 数据类型枚举**
```typescript
export enum DataType {
  // 标量类型
  FLOAT = 'float',
  INT = 'int',
  BOOL = 'bool',
  
  // 向量类型
  VEC2 = 'vec2',
  VEC3 = 'vec3',
  VEC4 = 'vec4',
  
  // 特殊类型
  COLOR = 'color',
  TEXTURE = 'texture',
  PARTICLE_DATA = 'particle_data'
}
```

### **2. 类型转换规则**
```typescript
// 自动类型转换规则
const TYPE_CONVERSIONS = [
  { from: FLOAT, to: VEC3, glsl: 'vec3($input)', cost: 1 },
  { from: VEC3, to: COLOR, glsl: 'vec4($input, 1.0)', cost: 1 },
  { from: COLOR, to: VEC3, glsl: '$input.rgb', cost: 1, lossy: true }
]
```

### **3. 端口兼容性检查**
```typescript
interface PortCompatibility {
  compatible: boolean
  directMatch: boolean
  conversionNeeded: boolean
  conversionRule?: TypeConversionRule
  errorMessage?: string
}
```

## 🔗 **连接验证系统**

### **1. 连接验证流程**
```
1. 检查节点存在性
2. 检查端口存在性
3. 检查数据类型兼容性
4. 应用类型转换规则
5. 生成验证结果
```

### **2. 验证结果类型**
```typescript
interface ConnectionValidation {
  valid: boolean
  errorMessage?: string
  warningMessage?: string
  conversionNeeded: boolean
  conversionCode?: string
}
```

## 🎨 **节点定义注册表**

### **1. 节点定义结构**
```typescript
interface NodeDefinition {
  type: NodeType
  category: NodeCategory
  name: string
  description?: string
  
  // 端口定义
  inputs: PortDefinition[]
  outputs: PortDefinition[]
  
  // GLSL相关
  glslFunction?: string
  glslCode?: string
  
  // UI相关
  icon?: string
  color?: string
  canDelete?: boolean
  isUnique?: boolean
}
```

### **2. 端口定义结构**
```typescript
interface PortDefinition {
  id: string
  name: string
  type: DataType
  required?: boolean
  defaultValue?: any
  color?: string
  acceptTypes?: DataType[]
}
```

## 🚀 **集成实施计划**

### **阶段1: 数据结构统一** ✅
- [x] 定义统一的数据结构接口
- [x] 创建类型系统和验证器
- [x] 实现VueFlowAdapter转换器
- [x] 确保向后兼容性

### **阶段2: 节点组件扩展**
- [ ] 扩展现有节点组件支持新数据结构
- [ ] 创建粒子专用节点组件
- [ ] 实现端口类型可视化
- [ ] 添加连接验证UI反馈

### **阶段3: 编辑器集成**
- [ ] 修改QaqNodeEditor.vue支持新数据结构
- [ ] 添加节点面板和分类
- [ ] 实现拖拽创建功能
- [ ] 集成类型检查和错误提示

### **阶段4: GLSL编译器集成**
- [ ] 连接材质图数据到GLSL编译器
- [ ] 实现实时编译和预览
- [ ] 添加编译错误提示
- [ ] 优化编译性能

## 📝 **使用示例**

### **1. 创建兼容的节点数据**
```typescript
// 现有格式（继续支持）
const oldNode: VueFlowNode = {
  id: 'node1',
  type: 'input',
  position: { x: 0, y: 0 },
  data: {
    label: 'Float Input',
    outputType: 'float',
    value: 1.0
  }
}

// 新格式（推荐）
const newNode: NodeInstance = {
  id: 'node1',
  type: 'input',
  position: { x: 0, y: 0 },
  data: {
    label: 'Float Input',
    nodeType: NodeType.INPUT_FLOAT,
    inputValues: { value: 1.0 },
    outputValues: {},
    inputConnections: {},
    outputConnections: { value: 0 },
    properties: {}
  },
  nodeType: NodeType.INPUT_FLOAT,
  category: NodeCategory.INPUT
}
```

### **2. 数据转换示例**
```typescript
// Vue Flow -> QAQ
const { graph, errors } = VueFlowAdapter.validateAndConvert(
  vueFlowNodes, 
  vueFlowEdges
)

// QAQ -> Vue Flow
const { nodes, edges } = VueFlowAdapter.toVueFlow(materialGraph)
```

### **3. 类型检查示例**
```typescript
// 检查端口兼容性
const compatibility = typeConverter.checkPortCompatibility(
  DataType.FLOAT, 
  DataType.VEC3
)

if (compatibility.compatible) {
  const glslCode = typeConverter.getConversionCode(
    DataType.FLOAT, 
    DataType.VEC3, 
    'inputValue'
  )
  // 结果: "vec3(inputValue)"
}
```

## 🎯 **核心优势**

1. **完全向后兼容**: 现有节点和连接继续工作
2. **渐进式升级**: 可以逐步迁移到新格式
3. **类型安全**: 强类型检查和自动转换
4. **扩展性强**: 易于添加新节点类型
5. **调试友好**: 详细的错误信息和验证结果
6. **性能优化**: 高效的数据转换和验证

这个设计确保了GLSL编译器和可视化节点编辑器之间的完美集成，同时保持了与现有系统的兼容性！
