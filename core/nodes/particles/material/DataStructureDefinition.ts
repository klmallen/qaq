// ============================================================================
// QAQ Engine - 统一数据结构定义 (GLSL编译器 + 可视化节点编辑器)
// ============================================================================

/**
 * 基础数据类型枚举
 */
export enum DataType {
  // 标量类型
  FLOAT = 'float',
  INT = 'int',
  BOOL = 'bool',
  
  // 向量类型
  VEC2 = 'vec2',
  VEC3 = 'vec3',
  VEC4 = 'vec4',
  
  // 矩阵类型
  MAT2 = 'mat2',
  MAT3 = 'mat3',
  MAT4 = 'mat4',
  
  // 特殊类型
  COLOR = 'color',        // vec4的别名，用于颜色
  TEXTURE = 'texture',    // sampler2D
  CUBEMAP = 'cubemap',    // samplerCube
  
  // 粒子专用类型
  PARTICLE_DATA = 'particle_data'  // 粒子数据结构
}

/**
 * 节点类别枚举
 */
export enum NodeCategory {
  // 标准节点类别
  INPUT = 'input',
  MATH = 'math',
  VECTOR = 'vector',
  COLOR = 'color',
  TEXTURE = 'texture',
  UTILITY = 'utility',
  OUTPUT = 'output',
  
  // 粒子专用类别
  PARTICLE_INPUT = 'particle_input',
  PARTICLE_PHYSICS = 'particle_physics',
  PARTICLE_ANIMATION = 'particle_animation',
  PARTICLE_OUTPUT = 'particle_output'
}

/**
 * 节点类型枚举 - 统一现有和粒子节点
 */
export enum NodeType {
  // === 现有标准节点类型 ===
  // 输入节点
  INPUT_FLOAT = 'input_float',
  INPUT_VECTOR3 = 'input_vector3',
  INPUT_COLOR = 'input_color',
  INPUT_TEXTURE = 'input_texture',
  
  // 数学节点
  MATH_ADD = 'math_add',
  MATH_MULTIPLY = 'math_multiply',
  MATH_LERP = 'math_lerp',
  MATH_SUBTRACT = 'math_subtract',
  MATH_DIVIDE = 'math_divide',
  MATH_POWER = 'math_power',
  MATH_CLAMP = 'math_clamp',
  MATH_SMOOTHSTEP = 'math_smoothstep',
  
  // 向量节点
  VECTOR_COMBINE = 'vector_combine',
  VECTOR_SEPARATE = 'vector_separate',
  VECTOR_DOT = 'vector_dot',
  VECTOR_CROSS = 'vector_cross',
  VECTOR_NORMALIZE = 'vector_normalize',
  VECTOR_LENGTH = 'vector_length',
  
  // 颜色节点
  COLOR_MIX = 'color_mix',
  COLOR_RAMP = 'color_ramp',
  COLOR_HSV = 'color_hsv',
  COLOR_RGB = 'color_rgb',
  
  // 纹理节点
  TEXTURE_SAMPLE = 'texture_sample',
  TEXTURE_COORDINATE = 'texture_coordinate',
  
  // 输出节点
  OUTPUT_MATERIAL = 'output_material',
  
  // === 粒子专用节点类型 ===
  // 粒子输入节点
  PARTICLE_AGE = 'particle_age',
  PARTICLE_LIFETIME = 'particle_lifetime',
  PARTICLE_VELOCITY = 'particle_velocity',
  PARTICLE_POSITION = 'particle_position',
  PARTICLE_SIZE = 'particle_size',
  PARTICLE_ROTATION = 'particle_rotation',
  PARTICLE_MASS = 'particle_mass',
  PARTICLE_INDEX = 'particle_index',
  
  // 粒子动画节点
  PARTICLE_CURVE_SAMPLE = 'particle_curve_sample',
  PARTICLE_NOISE = 'particle_noise',
  PARTICLE_OSCILLATOR = 'particle_oscillator',
  
  // 粒子物理节点
  PARTICLE_GRAVITY = 'particle_gravity',
  PARTICLE_FORCE = 'particle_force',
  PARTICLE_COLLISION = 'particle_collision',
  
  // 粒子输出节点
  PARTICLE_OUTPUT = 'particle_output'
}

/**
 * 端口定义接口
 */
export interface PortDefinition {
  id: string                    // 端口唯一标识
  name: string                  // 端口显示名称
  type: DataType               // 数据类型
  required?: boolean           // 是否必需连接
  defaultValue?: any           // 默认值
  description?: string         // 端口描述
  
  // UI相关
  color?: string              // 端口颜色
  position?: 'left' | 'right' | 'top' | 'bottom'  // 端口位置
  
  // 验证相关
  acceptTypes?: DataType[]     // 可接受的连接类型
  maxConnections?: number      // 最大连接数（输入端口通常为1）
}

/**
 * 节点定义接口
 */
export interface NodeDefinition {
  type: NodeType              // 节点类型
  category: NodeCategory      // 节点类别
  name: string               // 节点显示名称
  description?: string       // 节点描述
  
  // 端口定义
  inputs: PortDefinition[]   // 输入端口
  outputs: PortDefinition[]  // 输出端口
  
  // GLSL相关
  glslFunction?: string      // 对应的GLSL函数名
  glslCode?: string         // 自定义GLSL代码
  dependencies?: string[]    // 依赖的其他函数
  
  // UI相关
  icon?: string             // 节点图标
  color?: string           // 节点颜色
  size?: { width: number, height: number }  // 节点大小
  
  // 行为相关
  canDelete?: boolean       // 是否可删除
  canDuplicate?: boolean    // 是否可复制
  isUnique?: boolean        // 是否唯一（如输出节点）
  
  // 自定义属性
  properties?: { [key: string]: any }
}

/**
 * 节点实例接口 - 与Vue Flow兼容
 */
export interface NodeInstance {
  // Vue Flow标准属性
  id: string                           // 节点唯一ID
  type: string                         // 节点类型（对应Vue Flow的节点组件）
  position: { x: number, y: number }   // 节点位置
  data: NodeInstanceData               // 节点数据
  
  // 可选属性
  selected?: boolean                   // 是否选中
  dragging?: boolean                   // 是否正在拖拽
  width?: number                       // 节点宽度
  height?: number                      // 节点高度
  zIndex?: number                      // 层级
  
  // 自定义属性
  nodeType?: NodeType                  // QAQ节点类型
  category?: NodeCategory              // 节点类别
}

/**
 * 节点实例数据接口
 */
export interface NodeInstanceData {
  // 基础属性
  label: string                        // 节点标签
  nodeType: NodeType                   // QAQ节点类型
  
  // 端口数据
  inputValues: { [portId: string]: any }   // 输入端口的值
  outputValues: { [portId: string]: any }  // 输出端口的值
  
  // 连接状态
  inputConnections: { [portId: string]: boolean }  // 输入端口连接状态
  outputConnections: { [portId: string]: number }  // 输出端口连接数
  
  // 节点特有属性
  properties: { [key: string]: any }   // 节点自定义属性
  
  // UI状态
  collapsed?: boolean                  // 是否折叠
  preview?: boolean                    // 是否显示预览
  
  // 验证状态
  hasError?: boolean                   // 是否有错误
  errorMessage?: string                // 错误信息
  warnings?: string[]                  // 警告信息
}

/**
 * 连接实例接口 - 与Vue Flow兼容
 */
export interface ConnectionInstance {
  // Vue Flow标准属性
  id: string                          // 连接唯一ID
  source: string                      // 源节点ID
  target: string                      // 目标节点ID
  sourceHandle: string                // 源端口ID
  targetHandle: string                // 目标端口ID
  
  // 可选属性
  type?: string                       // 连接类型
  animated?: boolean                  // 是否动画
  style?: any                         // 连接样式
  markerEnd?: any                     // 箭头标记
  
  // 自定义属性
  dataType?: DataType                 // 传输的数据类型
  valid?: boolean                     // 连接是否有效
  
  // 调试信息
  debugInfo?: {
    sourceType: DataType
    targetType: DataType
    compatible: boolean
    conversionNeeded: boolean
  }
}

/**
 * 材质图接口 - 统一数据结构
 */
export interface MaterialGraph {
  // 基础信息
  id: string                          // 图的唯一ID
  name: string                        // 图的名称
  description?: string                // 图的描述
  
  // 图数据
  nodes: NodeInstance[]               // 节点列表
  connections: ConnectionInstance[]   // 连接列表
  
  // 元数据
  metadata: {
    version: string                   // 数据结构版本
    created: string                   // 创建时间
    modified: string                  // 修改时间
    author?: string                   // 作者
    tags?: string[]                   // 标签
    
    // 统计信息
    nodeCount: number                 // 节点数量
    connectionCount: number           // 连接数量
    
    // 编辑器状态
    viewport?: {                      // 视口状态
      x: number
      y: number
      zoom: number
    }
    
    // 编译信息
    lastCompiled?: string             // 最后编译时间
    compilationErrors?: string[]      // 编译错误
    compilationWarnings?: string[]    // 编译警告
  }
  
  // 配置
  settings: {
    autoCompile: boolean              // 自动编译
    enableOptimization: boolean       // 启用优化
    targetShaderModel: string         // 目标着色器模型
    enableDebugging: boolean          // 启用调试
  }
}

/**
 * 类型转换规则接口
 */
export interface TypeConversionRule {
  from: DataType                      // 源类型
  to: DataType                        // 目标类型
  glslCode: string                    // 转换的GLSL代码
  cost: number                        // 转换成本（用于选择最优路径）
  lossy: boolean                      // 是否有损转换
}

/**
 * 端口兼容性检查结果
 */
export interface PortCompatibility {
  compatible: boolean                 // 是否兼容
  directMatch: boolean               // 是否直接匹配
  conversionNeeded: boolean          // 是否需要类型转换
  conversionRule?: TypeConversionRule // 转换规则
  errorMessage?: string              // 错误信息
}

/**
 * 节点验证结果
 */
export interface NodeValidationResult {
  valid: boolean                     // 节点是否有效
  errors: string[]                   // 错误列表
  warnings: string[]                 // 警告列表
  missingInputs: string[]           // 缺失的必需输入
  unusedOutputs: string[]           // 未使用的输出
}

/**
 * 图验证结果
 */
export interface GraphValidationResult {
  valid: boolean                     // 图是否有效
  nodeResults: Map<string, NodeValidationResult>  // 每个节点的验证结果
  connectionErrors: string[]         // 连接错误
  cyclicDependencies: string[][]     // 循环依赖
  unreachableNodes: string[]         // 不可达节点
  missingOutputNode: boolean         // 是否缺少输出节点
}

/**
 * 编译配置接口
 */
export interface CompilationConfig {
  target: 'webgl' | 'webgl2'         // 目标平台
  optimization: boolean              // 是否优化
  debugging: boolean                 // 是否包含调试信息
  precision: 'lowp' | 'mediump' | 'highp'  // 精度
  
  // 特性开关
  features: {
    derivatives: boolean             // 是否支持导数
    textureGrad: boolean            // 是否支持纹理梯度
    fragDepth: boolean              // 是否支持片段深度
  }
}

/**
 * 编译结果接口
 */
export interface CompilationResult {
  success: boolean                   // 编译是否成功
  
  // 生成的代码
  vertexShader: string              // 顶点着色器
  fragmentShader: string            // 片段着色器
  
  // 资源信息
  uniforms: { [name: string]: any } // Uniform变量
  attributes: string[]              // 属性变量
  varyings: string[]               // Varying变量
  textures: string[]               // 纹理
  
  // 编译信息
  errors: string[]                  // 编译错误
  warnings: string[]                // 编译警告
  statistics: {                     // 统计信息
    nodeCount: number
    instructionCount: number
    textureReads: number
    uniformCount: number
  }
  
  // 调试信息
  debugInfo?: {
    nodeMapping: Map<string, string> // 节点到GLSL代码的映射
    dependencyGraph: string[][]      // 依赖图
    optimizations: string[]          // 应用的优化
  }
}

/**
 * 导出格式枚举
 */
export enum ExportFormat {
  QAQ_JSON = 'qaq_json',            // QAQ原生JSON格式
  GLSL_SEPARATE = 'glsl_separate',   // 分离的GLSL文件
  GLSL_COMBINED = 'glsl_combined',   // 合并的GLSL文件
  THREE_MATERIAL = 'three_material', // Three.js材质JSON
  UNITY_SHADER = 'unity_shader',     // Unity着色器
  UNREAL_MATERIAL = 'unreal_material' // Unreal材质
}

/**
 * 导入格式枚举
 */
export enum ImportFormat {
  QAQ_JSON = 'qaq_json',            // QAQ原生JSON格式
  GLSL_FRAGMENT = 'glsl_fragment',   // GLSL片段着色器
  THREE_MATERIAL = 'three_material', // Three.js材质JSON
  SHADERTOY = 'shadertoy'           // Shadertoy格式
}
