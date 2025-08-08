# QAQ引擎 - GLSL与可视化节点编辑器集成设计

## 📊 **现有架构分析**

### **材质编辑器组件结构**
```
components/editor/material/
├── QaqMaterialEditor.vue          # 主编辑器容器
├── QaqNodeEditor.vue              # 节点图编辑器（Vue Flow）
├── Qaq3DMaterialPreview.vue       # 3D材质预览
└── nodes/
    ├── QaqInputNode.vue           # 输入节点
    ├── QaqMathNode.vue            # 数学节点
    ├── QaqOutputNode.vue          # 输出节点
    ├── ParticleAgeNode.vue        # 粒子年龄节点（新增）
    ├── ParticleColorRampNode.vue  # 颜色渐变节点（新增）
    └── ParticleOutputNode.vue     # 粒子输出节点（新增）
```

### **现有数据结构**
- **节点数据**: `{ id, type, position, data }`
- **连接数据**: `{ id, source, target, sourceHandle, targetHandle }`
- **材质属性**: `{ albedo, metallic, roughness, normal, emission, alpha }`

## 🎯 **集成设计方案**

### **1. 核心架构**

#### **ParticleShaderCompiler.ts** - GLSL编译器
```typescript
export class ParticleShaderCompiler {
  // 将可视化节点图编译为GLSL着色器代码
  compileGraph(graph: MaterialGraph): CompiledShader
  
  // 获取节点定义
  getNodeDefinition(type: ParticleNodeType): NodeDefinition
  
  // 获取所有可用节点类型
  getAllNodeDefinitions(): Map<ParticleNodeType, NodeDefinition>
}
```

#### **数据结构定义**
```typescript
// 粒子专用节点类型
export enum ParticleNodeType {
  // 输入节点
  PARTICLE_AGE = 'particle_age',
  PARTICLE_LIFETIME = 'particle_lifetime',
  PARTICLE_VELOCITY = 'particle_velocity',
  PARTICLE_SIZE = 'particle_size',
  
  // 数学节点
  ADD = 'add',
  MULTIPLY = 'multiply',
  MIX = 'mix',
  CLAMP = 'clamp',
  
  // 颜色节点
  COLOR_RAMP = 'color_ramp',
  HSV_TO_RGB = 'hsv_to_rgb',
  
  // 输出节点
  PARTICLE_OUTPUT = 'particle_output'
}

// 节点数据类型
export enum NodeDataType {
  FLOAT = 'float',
  VEC2 = 'vec2',
  VEC3 = 'vec3',
  VEC4 = 'vec4',
  COLOR = 'color',
  TEXTURE = 'texture'
}

// 材质图数据结构
export interface MaterialGraph {
  nodes: ParticleNode[]
  connections: NodeConnection[]
  metadata: {
    version: string
    created: string
    modified: string
  }
}
```

### **2. GLSL与节点图转换流程**

#### **节点图 → GLSL编译流程**
```
1. 解析材质图数据结构
   ├── 验证节点连接有效性
   ├── 构建依赖关系图
   └── 检查循环依赖

2. 生成GLSL代码
   ├── 生成变量声明（uniforms, varyings, attributes）
   ├── 生成函数库（数学函数、颜色函数、噪声函数）
   ├── 生成主函数逻辑
   └── 优化代码（死代码消除、常量折叠）

3. 构建Three.js材质
   ├── 创建ShaderMaterial
   ├── 设置uniforms和attributes
   └── 配置渲染状态
```

#### **GLSL → 节点图解析流程（计划中）**
```
1. 词法分析
   ├── 解析GLSL语法结构
   ├── 识别函数调用
   └── 提取变量依赖

2. 语义分析
   ├── 构建抽象语法树
   ├── 识别节点类型
   └── 重建连接关系

3. 生成节点图
   ├── 创建节点实例
   ├── 建立连接关系
   └── 设置节点属性
```

### **3. 粒子专用节点组件**

#### **ParticleAgeNode.vue** - 粒子年龄节点
- **功能**: 输出粒子的归一化年龄（0.0 - 1.0）
- **输出**: `float age`
- **特性**: 实时年龄预览动画

#### **ParticleColorRampNode.vue** - 颜色渐变节点
- **功能**: 基于输入因子生成颜色渐变
- **输入**: `float factor`
- **输出**: `vec4 color`
- **特性**: 
  - 可视化渐变预览
  - 多个颜色停止点编辑
  - 实时颜色插值

#### **ParticleOutputNode.vue** - 粒子输出节点
- **功能**: 最终粒子材质输出
- **输入**: `baseColor`, `emissive`, `alpha`, `size`
- **特性**:
  - 实时粒子预览
  - GLSL代码预览
  - 动画控制

### **4. 与现有材质编辑器集成**

#### **扩展QaqNodeEditor.vue**
```vue
<template>
  <div class="node-editor">
    <!-- 现有节点面板 -->
    <div class="node-palette">
      <!-- 标准材质节点 -->
      <div class="node-category">
        <h3>Standard Nodes</h3>
        <!-- 现有节点 -->
      </div>
      
      <!-- 粒子专用节点 -->
      <div class="node-category">
        <h3>Particle Nodes</h3>
        <ParticleAgeNode />
        <ParticleColorRampNode />
        <ParticleOutputNode />
      </div>
    </div>
    
    <!-- Vue Flow编辑器 -->
    <VueFlow v-model="elements" />
  </div>
</template>
```

#### **扩展数据结构**
```typescript
// 扩展现有节点类型
type ExtendedNodeType = 
  | 'input' | 'math' | 'output'  // 现有类型
  | ParticleNodeType             // 粒子节点类型

// 扩展节点数据
interface ExtendedNodeData {
  // 现有属性
  label?: string
  value?: any
  
  // 粒子专用属性
  particleProperties?: {
    colorStops?: Array<{ position: number, color: string }>
    previewMode?: boolean
  }
}
```

### **5. 实现计划**

#### **阶段1: 核心编译器实现** ✅
- [x] ParticleShaderCompiler.ts - GLSL编译器
- [x] 数据结构定义
- [x] 基础节点类型支持
- [x] GLSL代码生成

#### **阶段2: 粒子节点组件** ✅
- [x] ParticleAgeNode.vue
- [x] ParticleColorRampNode.vue  
- [x] ParticleOutputNode.vue
- [x] 节点预览和交互

#### **阶段3: 材质组件集成** ✅
- [x] ParticleMaterial.ts 更新
- [x] 预设系统实现
- [x] 实时编译支持

#### **阶段4: 编辑器集成**（下一步）
- [ ] 扩展QaqNodeEditor.vue
- [ ] 节点面板集成
- [ ] 拖拽创建节点
- [ ] 连接验证

#### **阶段5: 高级功能**（未来）
- [ ] GLSL代码反向解析
- [ ] 材质图优化器
- [ ] 性能分析工具
- [ ] 材质模板库

### **6. 使用示例**

#### **创建火焰粒子材质**
```typescript
// 1. 创建材质组件
const particleMaterial = new ParticleMaterial({
  preset: MaterialPreset.FIRE,
  autoCompile: true
})

// 2. 获取编译后的材质
const shaderMaterial = particleMaterial.getCompiledMaterial()

// 3. 应用到粒子系统
particleSystem.renderer.setMaterial(shaderMaterial)
```

#### **自定义节点图**
```typescript
// 1. 创建节点
const ageNode: ParticleNode = {
  id: 'age',
  type: ParticleNodeType.PARTICLE_AGE,
  name: '粒子年龄',
  position: { x: 0, y: 0 },
  inputs: [],
  outputs: [{ id: 'age', name: 'Age', type: 'float' }],
  data: {}
}

// 2. 添加到材质图
particleMaterial.addNode(ageNode)

// 3. 创建连接
particleMaterial.addConnection({
  id: 'age-to-output',
  sourceNode: 'age',
  sourcePort: 'age',
  targetNode: 'output',
  targetPort: 'alpha',
  dataType: 'float'
})
```

### **7. 性能优化**

#### **编译优化**
- **死代码消除**: 移除未使用的节点和函数
- **常量折叠**: 编译时计算常量表达式
- **函数内联**: 内联简单函数调用
- **缓存机制**: 缓存编译结果避免重复编译

#### **运行时优化**
- **Uniform缓存**: 避免重复设置相同的uniform值
- **材质实例化**: 相同材质图共享编译结果
- **LOD支持**: 根据距离使用简化版本

### **8. 调试和开发工具**

#### **GLSL代码查看器**
- 实时显示生成的GLSL代码
- 语法高亮和错误提示
- 性能分析信息

#### **节点图验证器**
- 检查连接有效性
- 类型兼容性验证
- 循环依赖检测

#### **材质预览器**
- 实时3D预览
- 多种预设场景
- 性能监控

## 🎉 **总结**

这个设计方案实现了GLSL与可视化节点编辑器的完整集成：

1. **双向转换**: 节点图 ↔ GLSL代码
2. **实时编译**: 支持热重载和实时预览
3. **扩展性**: 易于添加新的节点类型
4. **性能优化**: 编译时和运行时优化
5. **开发友好**: 完整的调试和开发工具

通过这个系统，开发者可以：
- 使用可视化界面创建复杂的粒子材质
- 实时预览效果
- 导出/导入材质图
- 与现有材质编辑器无缝集成

这为QAQ引擎提供了强大而灵活的粒子材质创建能力！
