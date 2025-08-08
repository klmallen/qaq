// ============================================================================
// QAQ Engine - 类型系统和验证 (Type System & Validation)
// ============================================================================

import {
  DataType,
  NodeType,
  NodeCategory
} from './DataStructureDefinition'
import type {
  PortDefinition,
  NodeDefinition,
  TypeConversionRule,
  PortCompatibility,
  NodeValidationResult,
  GraphValidationResult,
  MaterialGraph,
  NodeInstance,
  ConnectionInstance
} from './DataStructureDefinition'

/**
 * 类型转换管理器
 */
export class TypeConversionManager {
  private conversionRules: Map<string, TypeConversionRule> = new Map()

  constructor() {
    this.initializeConversionRules()
  }

  /**
   * 初始化类型转换规则
   */
  private initializeConversionRules(): void {
    const rules: TypeConversionRule[] = [
      // Float转换
      {
        from: DataType.FLOAT,
        to: DataType.VEC2,
        glslCode: 'vec2($input)',
        cost: 1,
        lossy: false
      },
      {
        from: DataType.FLOAT,
        to: DataType.VEC3,
        glslCode: 'vec3($input)',
        cost: 1,
        lossy: false
      },
      {
        from: DataType.FLOAT,
        to: DataType.VEC4,
        glslCode: 'vec4($input)',
        cost: 1,
        lossy: false
      },
      {
        from: DataType.FLOAT,
        to: DataType.COLOR,
        glslCode: 'vec4(vec3($input), 1.0)',
        cost: 2,
        lossy: false
      },

      // Vector降维转换
      {
        from: DataType.VEC2,
        to: DataType.FLOAT,
        glslCode: '$input.x',
        cost: 1,
        lossy: true
      },
      {
        from: DataType.VEC3,
        to: DataType.FLOAT,
        glslCode: '$input.x',
        cost: 1,
        lossy: true
      },
      {
        from: DataType.VEC3,
        to: DataType.VEC2,
        glslCode: '$input.xy',
        cost: 1,
        lossy: true
      },
      {
        from: DataType.VEC4,
        to: DataType.VEC3,
        glslCode: '$input.xyz',
        cost: 1,
        lossy: true
      },
      {
        from: DataType.VEC4,
        to: DataType.VEC2,
        glslCode: '$input.xy',
        cost: 1,
        lossy: true
      },
      {
        from: DataType.VEC4,
        to: DataType.FLOAT,
        glslCode: '$input.x',
        cost: 1,
        lossy: true
      },

      // Vector升维转换
      {
        from: DataType.VEC2,
        to: DataType.VEC3,
        glslCode: 'vec3($input, 0.0)',
        cost: 1,
        lossy: false
      },
      {
        from: DataType.VEC2,
        to: DataType.VEC4,
        glslCode: 'vec4($input, 0.0, 1.0)',
        cost: 1,
        lossy: false
      },
      {
        from: DataType.VEC3,
        to: DataType.VEC4,
        glslCode: 'vec4($input, 1.0)',
        cost: 1,
        lossy: false
      },

      // Color转换
      {
        from: DataType.COLOR,
        to: DataType.VEC4,
        glslCode: '$input',
        cost: 0,
        lossy: false
      },
      {
        from: DataType.COLOR,
        to: DataType.VEC3,
        glslCode: '$input.rgb',
        cost: 1,
        lossy: true
      },
      {
        from: DataType.VEC4,
        to: DataType.COLOR,
        glslCode: '$input',
        cost: 0,
        lossy: false
      },
      {
        from: DataType.VEC3,
        to: DataType.COLOR,
        glslCode: 'vec4($input, 1.0)',
        cost: 1,
        lossy: false
      },

      // Int转换
      {
        from: DataType.INT,
        to: DataType.FLOAT,
        glslCode: 'float($input)',
        cost: 1,
        lossy: false
      },
      {
        from: DataType.FLOAT,
        to: DataType.INT,
        glslCode: 'int($input)',
        cost: 1,
        lossy: true
      },

      // Bool转换
      {
        from: DataType.BOOL,
        to: DataType.FLOAT,
        glslCode: '$input ? 1.0 : 0.0',
        cost: 2,
        lossy: false
      },
      {
        from: DataType.FLOAT,
        to: DataType.BOOL,
        glslCode: '$input > 0.5',
        cost: 2,
        lossy: true
      }
    ]

    // 注册转换规则
    rules.forEach(rule => {
      const key = `${rule.from}->${rule.to}`
      this.conversionRules.set(key, rule)
    })
  }

  /**
   * 检查端口兼容性
   */
  checkPortCompatibility(sourceType: DataType, targetType: DataType): PortCompatibility {
    // 直接匹配
    if (sourceType === targetType) {
      return {
        compatible: true,
        directMatch: true,
        conversionNeeded: false
      }
    }

    // 查找转换规则
    const conversionKey = `${sourceType}->${targetType}`
    const conversionRule = this.conversionRules.get(conversionKey)

    if (conversionRule) {
      return {
        compatible: true,
        directMatch: false,
        conversionNeeded: true,
        conversionRule
      }
    }

    // 不兼容
    return {
      compatible: false,
      directMatch: false,
      conversionNeeded: false,
      errorMessage: `无法从 ${sourceType} 转换到 ${targetType}`
    }
  }

  /**
   * 获取转换代码
   */
  getConversionCode(sourceType: DataType, targetType: DataType, inputExpression: string): string {
    const compatibility = this.checkPortCompatibility(sourceType, targetType)
    
    if (!compatibility.compatible) {
      throw new Error(`类型不兼容: ${sourceType} -> ${targetType}`)
    }

    if (compatibility.directMatch) {
      return inputExpression
    }

    if (compatibility.conversionRule) {
      return compatibility.conversionRule.glslCode.replace('$input', inputExpression)
    }

    throw new Error(`未找到转换规则: ${sourceType} -> ${targetType}`)
  }

  /**
   * 获取所有可能的转换目标类型
   */
  getCompatibleTypes(sourceType: DataType): DataType[] {
    const compatibleTypes: DataType[] = [sourceType] // 包含自身

    for (const [key, rule] of this.conversionRules) {
      if (rule.from === sourceType) {
        compatibleTypes.push(rule.to)
      }
    }

    return compatibleTypes
  }
}

/**
 * 节点定义注册表
 */
export class NodeDefinitionRegistry {
  private definitions: Map<NodeType, NodeDefinition> = new Map()

  constructor() {
    this.initializeStandardNodes()
    this.initializeParticleNodes()
  }

  /**
   * 初始化标准节点定义
   */
  private initializeStandardNodes(): void {
    // Float输入节点
    this.register({
      type: NodeType.INPUT_FLOAT,
      category: NodeCategory.INPUT,
      name: 'Float',
      description: '浮点数输入',
      inputs: [],
      outputs: [
        {
          id: 'value',
          name: 'Value',
          type: DataType.FLOAT,
          color: '#4ade80'
        }
      ],
      glslFunction: 'inputFloat',
      icon: 'i-heroicons-hashtag',
      color: '#4ade80',
      canDelete: true,
      canDuplicate: true
    })

    // Vector3输入节点
    this.register({
      type: NodeType.INPUT_VECTOR3,
      category: NodeCategory.INPUT,
      name: 'Vector3',
      description: '三维向量输入',
      inputs: [],
      outputs: [
        {
          id: 'vector',
          name: 'Vector',
          type: DataType.VEC3,
          color: '#3b82f6'
        }
      ],
      glslFunction: 'inputVector3',
      icon: 'i-heroicons-cube',
      color: '#3b82f6',
      canDelete: true,
      canDuplicate: true
    })

    // 颜色输入节点
    this.register({
      type: NodeType.INPUT_COLOR,
      category: NodeCategory.INPUT,
      name: 'Color',
      description: '颜色输入',
      inputs: [],
      outputs: [
        {
          id: 'color',
          name: 'Color',
          type: DataType.COLOR,
          color: '#f472b6'
        }
      ],
      glslFunction: 'inputColor',
      icon: 'i-heroicons-swatch',
      color: '#f472b6',
      canDelete: true,
      canDuplicate: true
    })

    // 加法节点
    this.register({
      type: NodeType.MATH_ADD,
      category: NodeCategory.MATH,
      name: 'Add',
      description: '加法运算',
      inputs: [
        {
          id: 'a',
          name: 'A',
          type: DataType.FLOAT,
          defaultValue: 0,
          color: '#4ade80'
        },
        {
          id: 'b',
          name: 'B',
          type: DataType.FLOAT,
          defaultValue: 0,
          color: '#4ade80'
        }
      ],
      outputs: [
        {
          id: 'result',
          name: 'Result',
          type: DataType.FLOAT,
          color: '#4ade80'
        }
      ],
      glslFunction: 'add',
      icon: 'i-heroicons-plus',
      color: '#fbbf24',
      canDelete: true,
      canDuplicate: true
    })

    // 材质输出节点
    this.register({
      type: NodeType.OUTPUT_MATERIAL,
      category: NodeCategory.OUTPUT,
      name: 'Material Output',
      description: '材质输出',
      inputs: [
        {
          id: 'baseColor',
          name: 'Base Color',
          type: DataType.COLOR,
          defaultValue: [1, 1, 1, 1],
          color: '#f472b6'
        },
        {
          id: 'metallic',
          name: 'Metallic',
          type: DataType.FLOAT,
          defaultValue: 0,
          color: '#4ade80'
        },
        {
          id: 'roughness',
          name: 'Roughness',
          type: DataType.FLOAT,
          defaultValue: 0.5,
          color: '#4ade80'
        },
        {
          id: 'normal',
          name: 'Normal',
          type: DataType.VEC3,
          defaultValue: [0, 0, 1],
          color: '#3b82f6'
        },
        {
          id: 'emission',
          name: 'Emission',
          type: DataType.COLOR,
          defaultValue: [0, 0, 0, 1],
          color: '#f472b6'
        },
        {
          id: 'alpha',
          name: 'Alpha',
          type: DataType.FLOAT,
          defaultValue: 1,
          color: '#4ade80'
        }
      ],
      outputs: [],
      icon: 'i-heroicons-sparkles',
      color: '#00DC82',
      canDelete: false,
      canDuplicate: false,
      isUnique: true
    })
  }

  /**
   * 初始化粒子节点定义
   */
  private initializeParticleNodes(): void {
    // 粒子年龄节点
    this.register({
      type: NodeType.PARTICLE_AGE,
      category: NodeCategory.PARTICLE_INPUT,
      name: 'Particle Age',
      description: '粒子年龄（0.0 - 1.0）',
      inputs: [],
      outputs: [
        {
          id: 'age',
          name: 'Age',
          type: DataType.FLOAT,
          color: '#4ade80'
        }
      ],
      glslFunction: 'getParticleAge',
      icon: 'i-heroicons-clock',
      color: '#4ade80',
      canDelete: true,
      canDuplicate: true
    })

    // 粒子速度节点
    this.register({
      type: NodeType.PARTICLE_VELOCITY,
      category: NodeCategory.PARTICLE_INPUT,
      name: 'Particle Velocity',
      description: '粒子速度向量',
      inputs: [],
      outputs: [
        {
          id: 'velocity',
          name: 'Velocity',
          type: DataType.VEC3,
          color: '#3b82f6'
        }
      ],
      glslFunction: 'getParticleVelocity',
      icon: 'i-heroicons-arrow-right',
      color: '#3b82f6',
      canDelete: true,
      canDuplicate: true
    })

    // 颜色渐变节点
    this.register({
      type: NodeType.COLOR_RAMP,
      category: NodeCategory.COLOR,
      name: 'Color Ramp',
      description: '颜色渐变',
      inputs: [
        {
          id: 'factor',
          name: 'Factor',
          type: DataType.FLOAT,
          defaultValue: 0.5,
          color: '#4ade80'
        }
      ],
      outputs: [
        {
          id: 'color',
          name: 'Color',
          type: DataType.COLOR,
          color: '#f472b6'
        }
      ],
      glslFunction: 'colorRamp',
      icon: 'i-heroicons-swatch',
      color: '#f472b6',
      canDelete: true,
      canDuplicate: true,
      properties: {
        colorStops: [
          { position: 0.0, color: [1, 0, 0, 1] },
          { position: 0.5, color: [1, 1, 0, 1] },
          { position: 1.0, color: [0, 0, 0, 1] }
        ]
      }
    })

    // 粒子输出节点
    this.register({
      type: NodeType.PARTICLE_OUTPUT,
      category: NodeCategory.PARTICLE_OUTPUT,
      name: 'Particle Output',
      description: '粒子输出',
      inputs: [
        {
          id: 'baseColor',
          name: 'Base Color',
          type: DataType.COLOR,
          defaultValue: [1, 1, 1, 1],
          color: '#f472b6'
        },
        {
          id: 'emissive',
          name: 'Emissive',
          type: DataType.COLOR,
          defaultValue: [0, 0, 0, 1],
          color: '#f472b6'
        },
        {
          id: 'alpha',
          name: 'Alpha',
          type: DataType.FLOAT,
          defaultValue: 1,
          color: '#4ade80'
        },
        {
          id: 'size',
          name: 'Size',
          type: DataType.FLOAT,
          defaultValue: 1,
          color: '#4ade80'
        }
      ],
      outputs: [],
      icon: 'i-heroicons-sparkles',
      color: '#00DC82',
      canDelete: false,
      canDuplicate: false,
      isUnique: true
    })
  }

  /**
   * 注册节点定义
   */
  register(definition: NodeDefinition): void {
    this.definitions.set(definition.type, definition)
  }

  /**
   * 获取节点定义
   */
  get(type: NodeType): NodeDefinition | undefined {
    return this.definitions.get(type)
  }

  /**
   * 获取所有节点定义
   */
  getAll(): Map<NodeType, NodeDefinition> {
    return new Map(this.definitions)
  }

  /**
   * 按类别获取节点定义
   */
  getByCategory(category: NodeCategory): NodeDefinition[] {
    return Array.from(this.definitions.values()).filter(def => def.category === category)
  }

  /**
   * 搜索节点定义
   */
  search(query: string): NodeDefinition[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.definitions.values()).filter(def =>
      def.name.toLowerCase().includes(lowerQuery) ||
      def.description?.toLowerCase().includes(lowerQuery)
    )
  }
}

/**
 * 图验证器
 */
export class GraphValidator {
  private typeConverter: TypeConversionManager
  private nodeRegistry: NodeDefinitionRegistry

  constructor() {
    this.typeConverter = new TypeConversionManager()
    this.nodeRegistry = new NodeDefinitionRegistry()
  }

  /**
   * 验证整个图
   */
  validateGraph(graph: MaterialGraph): GraphValidationResult {
    const result: GraphValidationResult = {
      valid: true,
      nodeResults: new Map(),
      connectionErrors: [],
      cyclicDependencies: [],
      unreachableNodes: [],
      missingOutputNode: false
    }

    // 验证每个节点
    for (const node of graph.nodes) {
      const nodeResult = this.validateNode(node, graph)
      result.nodeResults.set(node.id, nodeResult)
      
      if (!nodeResult.valid) {
        result.valid = false
      }
    }

    // 验证连接
    for (const connection of graph.connections) {
      const connectionError = this.validateConnection(connection, graph)
      if (connectionError) {
        result.connectionErrors.push(connectionError)
        result.valid = false
      }
    }

    // 检查循环依赖
    const cycles = this.detectCycles(graph)
    if (cycles.length > 0) {
      result.cyclicDependencies = cycles
      result.valid = false
    }

    // 检查输出节点
    const hasOutputNode = graph.nodes.some(node => {
      const definition = this.nodeRegistry.get(node.data.nodeType)
      return definition?.isUnique && definition.category === NodeCategory.OUTPUT
    })
    
    if (!hasOutputNode) {
      result.missingOutputNode = true
      result.valid = false
    }

    return result
  }

  /**
   * 验证单个节点
   */
  validateNode(node: NodeInstance, graph: MaterialGraph): NodeValidationResult {
    const definition = this.nodeRegistry.get(node.data.nodeType)
    
    if (!definition) {
      return {
        valid: false,
        errors: [`未知节点类型: ${node.data.nodeType}`],
        warnings: [],
        missingInputs: [],
        unusedOutputs: []
      }
    }

    const result: NodeValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      missingInputs: [],
      unusedOutputs: []
    }

    // 检查必需输入
    for (const inputDef of definition.inputs) {
      if (inputDef.required) {
        const hasConnection = graph.connections.some(conn => 
          conn.target === node.id && conn.targetHandle === inputDef.id
        )
        
        const hasDefaultValue = node.data.inputValues[inputDef.id] !== undefined
        
        if (!hasConnection && !hasDefaultValue) {
          result.missingInputs.push(inputDef.name)
          result.valid = false
        }
      }
    }

    // 检查未使用的输出
    for (const outputDef of definition.outputs) {
      const hasConnection = graph.connections.some(conn => 
        conn.source === node.id && conn.sourceHandle === outputDef.id
      )
      
      if (!hasConnection) {
        result.unusedOutputs.push(outputDef.name)
        // 未使用的输出只是警告，不影响有效性
        result.warnings.push(`输出 "${outputDef.name}" 未被使用`)
      }
    }

    return result
  }

  /**
   * 验证连接
   */
  validateConnection(connection: ConnectionInstance, graph: MaterialGraph): string | null {
    const sourceNode = graph.nodes.find(n => n.id === connection.source)
    const targetNode = graph.nodes.find(n => n.id === connection.target)

    if (!sourceNode || !targetNode) {
      return `连接引用了不存在的节点: ${connection.id}`
    }

    const sourceDef = this.nodeRegistry.get(sourceNode.data.nodeType)
    const targetDef = this.nodeRegistry.get(targetNode.data.nodeType)

    if (!sourceDef || !targetDef) {
      return `连接的节点类型未定义: ${connection.id}`
    }

    const sourcePort = sourceDef.outputs.find(p => p.id === connection.sourceHandle)
    const targetPort = targetDef.inputs.find(p => p.id === connection.targetHandle)

    if (!sourcePort || !targetPort) {
      return `连接引用了不存在的端口: ${connection.id}`
    }

    // 检查类型兼容性
    const compatibility = this.typeConverter.checkPortCompatibility(sourcePort.type, targetPort.type)
    if (!compatibility.compatible) {
      return `类型不兼容: ${sourcePort.type} -> ${targetPort.type} (${connection.id})`
    }

    return null
  }

  /**
   * 检测循环依赖
   */
  detectCycles(graph: MaterialGraph): string[][] {
    const cycles: string[][] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const dfs = (nodeId: string, path: string[]): void => {
      if (recursionStack.has(nodeId)) {
        // 找到循环
        const cycleStart = path.indexOf(nodeId)
        cycles.push(path.slice(cycleStart))
        return
      }

      if (visited.has(nodeId)) {
        return
      }

      visited.add(nodeId)
      recursionStack.add(nodeId)
      path.push(nodeId)

      // 遍历所有输出连接
      const outgoingConnections = graph.connections.filter(conn => conn.source === nodeId)
      for (const connection of outgoingConnections) {
        dfs(connection.target, [...path])
      }

      recursionStack.delete(nodeId)
    }

    // 从每个节点开始DFS
    for (const node of graph.nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id, [])
      }
    }

    return cycles
  }
}

// 导出单例实例
export const typeConverter = new TypeConversionManager()
export const nodeRegistry = new NodeDefinitionRegistry()
export const graphValidator = new GraphValidator()
