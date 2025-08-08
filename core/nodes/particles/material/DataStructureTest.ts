// ============================================================================
// QAQ Engine - 数据结构测试和验证 (Data Structure Test & Validation)
// ============================================================================

import {
  DataType,
  NodeType,
  NodeCategory
} from './DataStructureDefinition'
import type {
  MaterialGraph,
  NodeInstance,
  ConnectionInstance,
  NodeInstanceData
} from './DataStructureDefinition'

import { typeConverter, nodeRegistry, graphValidator } from './TypeSystem'
import { VueFlowAdapter } from './VueFlowAdapter'

/**
 * 数据结构测试套件
 */
export class DataStructureTestSuite {

  /**
   * 运行所有测试
   */
  static runAllTests(): void {
    console.log('🧪 开始数据结构测试...')
    
    try {
      this.testTypeConversion()
      this.testNodeRegistry()
      this.testGraphValidation()
      this.testVueFlowAdapter()
      this.testComplexGraph()
      
      console.log('✅ 所有测试通过！')
    } catch (error) {
      console.error('❌ 测试失败:', error)
    }
  }

  /**
   * 测试类型转换系统
   */
  static testTypeConversion(): void {
    console.log('📝 测试类型转换系统...')

    // 测试直接匹配
    const directMatch = typeConverter.checkPortCompatibility(DataType.FLOAT, DataType.FLOAT)
    console.assert(directMatch.compatible && directMatch.directMatch, '直接匹配测试失败')

    // 测试类型转换
    const conversion = typeConverter.checkPortCompatibility(DataType.FLOAT, DataType.VEC3)
    console.assert(conversion.compatible && conversion.conversionNeeded, '类型转换测试失败')

    // 测试转换代码生成
    const glslCode = typeConverter.getConversionCode(DataType.FLOAT, DataType.VEC3, 'inputValue')
    console.assert(glslCode === 'vec3(inputValue)', '转换代码生成测试失败')

    // 测试不兼容类型
    const incompatible = typeConverter.checkPortCompatibility(DataType.TEXTURE, DataType.FLOAT)
    console.assert(!incompatible.compatible, '不兼容类型测试失败')

    console.log('✅ 类型转换系统测试通过')
  }

  /**
   * 测试节点注册表
   */
  static testNodeRegistry(): void {
    console.log('📝 测试节点注册表...')

    // 测试获取节点定义
    const floatInputDef = nodeRegistry.get(NodeType.INPUT_FLOAT)
    console.assert(floatInputDef !== undefined, '获取Float输入节点定义失败')
    console.assert(floatInputDef!.name === 'Float', 'Float节点名称错误')

    // 测试按类别获取节点
    const inputNodes = nodeRegistry.getByCategory(NodeCategory.INPUT)
    console.assert(inputNodes.length > 0, '按类别获取节点失败')

    // 测试搜索节点
    const searchResults = nodeRegistry.search('float')
    console.assert(searchResults.length > 0, '搜索节点失败')

    // 测试粒子节点
    const particleAgeDef = nodeRegistry.get(NodeType.PARTICLE_AGE)
    console.assert(particleAgeDef !== undefined, '获取粒子年龄节点定义失败')
    console.assert(particleAgeDef!.category === NodeCategory.PARTICLE_INPUT, '粒子节点类别错误')

    console.log('✅ 节点注册表测试通过')
  }

  /**
   * 测试图验证系统
   */
  static testGraphValidation(): void {
    console.log('📝 测试图验证系统...')

    // 创建测试图
    const testGraph = this.createTestGraph()

    // 验证图
    const validationResult = graphValidator.validateGraph(testGraph)
    console.assert(validationResult.valid, '图验证失败')
    console.assert(validationResult.nodeResults.size === testGraph.nodes.length, '节点验证结果数量错误')

    // 测试循环依赖检测
    const cyclicGraph = this.createCyclicGraph()
    const cyclicResult = graphValidator.validateGraph(cyclicGraph)
    console.assert(!cyclicResult.valid, '循环依赖检测失败')
    console.assert(cyclicResult.cyclicDependencies.length > 0, '循环依赖未检测到')

    console.log('✅ 图验证系统测试通过')
  }

  /**
   * 测试Vue Flow适配器
   */
  static testVueFlowAdapter(): void {
    console.log('📝 测试Vue Flow适配器...')

    // 创建Vue Flow格式数据
    const vueFlowNodes = [
      {
        id: 'input1',
        type: 'input',
        position: { x: 0, y: 0 },
        data: {
          label: 'Float Input',
          outputType: 'float',
          value: 1.5
        }
      },
      {
        id: 'output1',
        type: 'output',
        position: { x: 300, y: 0 },
        data: {
          label: 'Material Output'
        }
      }
    ]

    const vueFlowEdges = [
      {
        id: 'edge1',
        source: 'input1',
        target: 'output1',
        sourceHandle: 'input1-output',
        targetHandle: 'output1-input-baseColor'
      }
    ]

    // 转换为QAQ格式
    const { graph, errors } = VueFlowAdapter.validateAndConvert(vueFlowNodes, vueFlowEdges)
    console.assert(errors.length === 0, `转换错误: ${errors.join(', ')}`)
    console.assert(graph.nodes.length === 2, '节点数量错误')
    console.assert(graph.connections.length === 1, '连接数量错误')

    // 转换回Vue Flow格式
    const { nodes, edges } = VueFlowAdapter.toVueFlow(graph)
    console.assert(nodes.length === 2, '反向转换节点数量错误')
    console.assert(edges.length === 1, '反向转换连接数量错误')

    console.log('✅ Vue Flow适配器测试通过')
  }

  /**
   * 测试复杂图结构
   */
  static testComplexGraph(): void {
    console.log('📝 测试复杂图结构...')

    const complexGraph = this.createComplexParticleGraph()
    
    // 验证复杂图
    const validationResult = graphValidator.validateGraph(complexGraph)
    console.assert(validationResult.valid, '复杂图验证失败')

    // 更新连接类型信息
    VueFlowAdapter.updateConnectionTypes(complexGraph)

    // 检查连接有效性
    for (const connection of complexGraph.connections) {
      console.assert(connection.valid !== undefined, '连接有效性未设置')
      console.assert(connection.dataType !== undefined, '连接数据类型未设置')
    }

    console.log('✅ 复杂图结构测试通过')
  }

  /**
   * 创建测试图
   */
  private static createTestGraph(): MaterialGraph {
    const floatInputNode: NodeInstance = {
      id: 'float1',
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

    const outputNode: NodeInstance = {
      id: 'output1',
      type: 'output',
      position: { x: 300, y: 0 },
      data: {
        label: 'Material Output',
        nodeType: NodeType.OUTPUT_MATERIAL,
        inputValues: {},
        outputValues: {},
        inputConnections: {
          baseColor: false,
          metallic: false,
          roughness: false,
          normal: false,
          emission: false,
          alpha: false
        },
        outputConnections: {},
        properties: {}
      },
      nodeType: NodeType.OUTPUT_MATERIAL,
      category: NodeCategory.OUTPUT
    }

    const connection: ConnectionInstance = {
      id: 'conn1',
      source: 'float1',
      target: 'output1',
      sourceHandle: 'value',
      targetHandle: 'alpha',
      dataType: DataType.FLOAT,
      valid: true
    }

    return {
      id: 'test_graph',
      name: 'Test Graph',
      nodes: [floatInputNode, outputNode],
      connections: [connection],
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        nodeCount: 2,
        connectionCount: 1
      },
      settings: {
        autoCompile: true,
        enableOptimization: true,
        targetShaderModel: 'webgl2',
        enableDebugging: false
      }
    }
  }

  /**
   * 创建循环依赖图
   */
  private static createCyclicGraph(): MaterialGraph {
    const node1: NodeInstance = {
      id: 'node1',
      type: 'math',
      position: { x: 0, y: 0 },
      data: {
        label: 'Add 1',
        nodeType: NodeType.MATH_ADD,
        inputValues: {},
        outputValues: {},
        inputConnections: { a: false, b: false },
        outputConnections: { result: 1 },
        properties: {}
      },
      nodeType: NodeType.MATH_ADD,
      category: NodeCategory.MATH
    }

    const node2: NodeInstance = {
      id: 'node2',
      type: 'math',
      position: { x: 200, y: 0 },
      data: {
        label: 'Add 2',
        nodeType: NodeType.MATH_ADD,
        inputValues: {},
        outputValues: {},
        inputConnections: { a: false, b: false },
        outputConnections: { result: 1 },
        properties: {}
      },
      nodeType: NodeType.MATH_ADD,
      category: NodeCategory.MATH
    }

    // 创建循环连接
    const connection1: ConnectionInstance = {
      id: 'cycle1',
      source: 'node1',
      target: 'node2',
      sourceHandle: 'result',
      targetHandle: 'a',
      dataType: DataType.FLOAT,
      valid: true
    }

    const connection2: ConnectionInstance = {
      id: 'cycle2',
      source: 'node2',
      target: 'node1',
      sourceHandle: 'result',
      targetHandle: 'a',
      dataType: DataType.FLOAT,
      valid: true
    }

    return {
      id: 'cyclic_graph',
      name: 'Cyclic Graph',
      nodes: [node1, node2],
      connections: [connection1, connection2],
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        nodeCount: 2,
        connectionCount: 2
      },
      settings: {
        autoCompile: true,
        enableOptimization: true,
        targetShaderModel: 'webgl2',
        enableDebugging: false
      }
    }
  }

  /**
   * 创建复杂粒子图
   */
  private static createComplexParticleGraph(): MaterialGraph {
    // 粒子年龄节点
    const ageNode: NodeInstance = {
      id: 'age1',
      type: 'particle-age',
      position: { x: 0, y: 0 },
      data: {
        label: 'Particle Age',
        nodeType: NodeType.PARTICLE_AGE,
        inputValues: {},
        outputValues: {},
        inputConnections: {},
        outputConnections: { age: 1 },
        properties: {}
      },
      nodeType: NodeType.PARTICLE_AGE,
      category: NodeCategory.PARTICLE_INPUT
    }

    // 颜色渐变节点
    const colorRampNode: NodeInstance = {
      id: 'ramp1',
      type: 'particle-color-ramp',
      position: { x: 200, y: 0 },
      data: {
        label: 'Color Ramp',
        nodeType: NodeType.COLOR_RAMP,
        inputValues: {},
        outputValues: {},
        inputConnections: { factor: true },
        outputConnections: { color: 1 },
        properties: {
          colorStops: [
            { position: 0.0, color: [1, 1, 0, 1] },
            { position: 1.0, color: [1, 0, 0, 0] }
          ]
        }
      },
      nodeType: NodeType.COLOR_RAMP,
      category: NodeCategory.COLOR
    }

    // 粒子输出节点
    const outputNode: NodeInstance = {
      id: 'output1',
      type: 'particle-output',
      position: { x: 400, y: 0 },
      data: {
        label: 'Particle Output',
        nodeType: NodeType.PARTICLE_OUTPUT,
        inputValues: {},
        outputValues: {},
        inputConnections: {
          baseColor: true,
          emissive: false,
          alpha: false,
          size: false
        },
        outputConnections: {},
        properties: {}
      },
      nodeType: NodeType.PARTICLE_OUTPUT,
      category: NodeCategory.PARTICLE_OUTPUT
    }

    // 连接
    const connection1: ConnectionInstance = {
      id: 'conn1',
      source: 'age1',
      target: 'ramp1',
      sourceHandle: 'age',
      targetHandle: 'factor',
      dataType: DataType.FLOAT,
      valid: true
    }

    const connection2: ConnectionInstance = {
      id: 'conn2',
      source: 'ramp1',
      target: 'output1',
      sourceHandle: 'color',
      targetHandle: 'baseColor',
      dataType: DataType.COLOR,
      valid: true
    }

    return {
      id: 'complex_particle_graph',
      name: 'Complex Particle Graph',
      nodes: [ageNode, colorRampNode, outputNode],
      connections: [connection1, connection2],
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        nodeCount: 3,
        connectionCount: 2
      },
      settings: {
        autoCompile: true,
        enableOptimization: true,
        targetShaderModel: 'webgl2',
        enableDebugging: false
      }
    }
  }

  /**
   * 性能测试
   */
  static performanceTest(): void {
    console.log('🚀 开始性能测试...')

    const startTime = performance.now()

    // 创建大型图
    const largeGraph = this.createLargeGraph(1000, 2000)
    
    // 验证大型图
    const validationResult = graphValidator.validateGraph(largeGraph)
    
    // 类型转换测试
    for (let i = 0; i < 10000; i++) {
      typeConverter.checkPortCompatibility(DataType.FLOAT, DataType.VEC3)
    }

    const endTime = performance.now()
    const duration = endTime - startTime

    console.log(`✅ 性能测试完成，耗时: ${duration.toFixed(2)}ms`)
    console.log(`📊 大型图验证结果: ${validationResult.valid ? '有效' : '无效'}`)
  }

  /**
   * 创建大型图（用于性能测试）
   */
  private static createLargeGraph(nodeCount: number, connectionCount: number): MaterialGraph {
    const nodes: NodeInstance[] = []
    const connections: ConnectionInstance[] = []

    // 创建节点
    for (let i = 0; i < nodeCount; i++) {
      const nodeType = i % 2 === 0 ? NodeType.INPUT_FLOAT : NodeType.MATH_ADD
      const node: NodeInstance = {
        id: `node_${i}`,
        type: i % 2 === 0 ? 'input' : 'math',
        position: { x: (i % 50) * 100, y: Math.floor(i / 50) * 100 },
        data: {
          label: `Node ${i}`,
          nodeType,
          inputValues: {},
          outputValues: {},
          inputConnections: {},
          outputConnections: {},
          properties: {}
        },
        nodeType,
        category: i % 2 === 0 ? NodeCategory.INPUT : NodeCategory.MATH
      }
      nodes.push(node)
    }

    // 创建连接
    for (let i = 0; i < Math.min(connectionCount, nodeCount - 1); i++) {
      const connection: ConnectionInstance = {
        id: `conn_${i}`,
        source: `node_${i}`,
        target: `node_${i + 1}`,
        sourceHandle: 'output',
        targetHandle: 'input',
        dataType: DataType.FLOAT,
        valid: true
      }
      connections.push(connection)
    }

    return {
      id: 'large_graph',
      name: 'Large Graph',
      nodes,
      connections,
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        nodeCount: nodes.length,
        connectionCount: connections.length
      },
      settings: {
        autoCompile: false, // 禁用自动编译以提高性能
        enableOptimization: true,
        targetShaderModel: 'webgl2',
        enableDebugging: false
      }
    }
  }
}

// 导出测试函数
export function runDataStructureTests(): void {
  DataStructureTestSuite.runAllTests()
}

export function runPerformanceTests(): void {
  DataStructureTestSuite.performanceTest()
}
