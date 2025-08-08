// ============================================================================
// QAQ Engine - Vue Flow 适配器 (Vue Flow Adapter)
// ============================================================================

import {
  NodeType,
  DataType
} from './DataStructureDefinition'
import type {
  MaterialGraph,
  NodeInstance,
  ConnectionInstance,
  NodeInstanceData
} from './DataStructureDefinition'
import { nodeRegistry, typeConverter } from './TypeSystem'

/**
 * Vue Flow 节点数据接口（现有格式）
 */
export interface VueFlowNodeData {
  label: string
  outputType?: string
  value?: number
  color?: string
  vector?: { x: number, y: number, z: number }
  textureName?: string
  
  // 扩展属性
  nodeType?: string
  properties?: { [key: string]: any }
}

/**
 * Vue Flow 节点接口（现有格式）
 */
export interface VueFlowNode {
  id: string
  type: string  // Vue组件类型
  position: { x: number, y: number }
  data: VueFlowNodeData
  selected?: boolean
  dragging?: boolean
}

/**
 * Vue Flow 连接接口（现有格式）
 */
export interface VueFlowConnection {
  id: string
  source: string
  target: string
  sourceHandle: string
  targetHandle: string
  type?: string
  animated?: boolean
  style?: any
}

/**
 * Vue Flow 适配器
 * 
 * 负责在QAQ数据结构和Vue Flow数据结构之间进行转换
 */
export class VueFlowAdapter {
  
  /**
   * 将QAQ MaterialGraph转换为Vue Flow格式
   */
  static toVueFlow(graph: MaterialGraph): { nodes: VueFlowNode[], edges: VueFlowConnection[] } {
    const nodes: VueFlowNode[] = graph.nodes.map(node => this.nodeToVueFlow(node))
    const edges: VueFlowConnection[] = graph.connections.map(conn => this.connectionToVueFlow(conn))
    
    return { nodes, edges }
  }

  /**
   * 将Vue Flow格式转换为QAQ MaterialGraph
   */
  static fromVueFlow(
    nodes: VueFlowNode[], 
    edges: VueFlowConnection[],
    metadata?: any
  ): MaterialGraph {
    const qaqNodes: NodeInstance[] = nodes.map(node => this.nodeFromVueFlow(node))
    const qaqConnections: ConnectionInstance[] = edges.map(edge => this.connectionFromVueFlow(edge))
    
    return {
      id: metadata?.id || `graph_${Date.now()}`,
      name: metadata?.name || 'Untitled Graph',
      description: metadata?.description,
      nodes: qaqNodes,
      connections: qaqConnections,
      metadata: {
        version: '1.0.0',
        created: metadata?.created || new Date().toISOString(),
        modified: new Date().toISOString(),
        author: metadata?.author,
        tags: metadata?.tags || [],
        nodeCount: qaqNodes.length,
        connectionCount: qaqConnections.length,
        viewport: metadata?.viewport
      },
      settings: {
        autoCompile: metadata?.autoCompile ?? true,
        enableOptimization: metadata?.enableOptimization ?? true,
        targetShaderModel: metadata?.targetShaderModel || 'webgl2',
        enableDebugging: metadata?.enableDebugging ?? false
      }
    }
  }

  /**
   * 将QAQ节点转换为Vue Flow节点
   */
  private static nodeToVueFlow(node: NodeInstance): VueFlowNode {
    const definition = nodeRegistry.get(node.data.nodeType)
    
    // 确定Vue组件类型
    let vueComponentType = 'default'
    
    switch (node.data.nodeType) {
      case NodeType.INPUT_FLOAT:
      case NodeType.INPUT_VECTOR3:
      case NodeType.INPUT_COLOR:
      case NodeType.INPUT_TEXTURE:
        vueComponentType = 'input'
        break
        
      case NodeType.MATH_ADD:
      case NodeType.MATH_MULTIPLY:
      case NodeType.MATH_LERP:
        vueComponentType = 'math'
        break
        
      case NodeType.OUTPUT_MATERIAL:
        vueComponentType = 'output'
        break
        
      case NodeType.PARTICLE_AGE:
        vueComponentType = 'particle-age'
        break
        
      case NodeType.COLOR_RAMP:
        vueComponentType = 'particle-color-ramp'
        break
        
      case NodeType.PARTICLE_OUTPUT:
        vueComponentType = 'particle-output'
        break
        
      default:
        vueComponentType = 'default'
    }

    // 转换数据格式
    const vueFlowData: VueFlowNodeData = {
      label: node.data.label,
      nodeType: node.data.nodeType,
      properties: node.data.properties
    }

    // 根据节点类型设置特定数据
    if (node.data.nodeType === NodeType.INPUT_FLOAT) {
      vueFlowData.outputType = 'float'
      vueFlowData.value = node.data.inputValues.value || 0
    } else if (node.data.nodeType === NodeType.INPUT_VECTOR3) {
      vueFlowData.outputType = 'vector3'
      const vector = node.data.inputValues.vector || { x: 0, y: 0, z: 0 }
      vueFlowData.vector = vector
    } else if (node.data.nodeType === NodeType.INPUT_COLOR) {
      vueFlowData.outputType = 'color'
      vueFlowData.color = node.data.inputValues.color || '#ffffff'
    } else if (node.data.nodeType === NodeType.INPUT_TEXTURE) {
      vueFlowData.outputType = 'texture'
      vueFlowData.textureName = node.data.inputValues.textureName || ''
    }

    return {
      id: node.id,
      type: vueComponentType,
      position: node.position,
      data: vueFlowData,
      selected: node.selected,
      dragging: node.dragging
    }
  }

  /**
   * 将Vue Flow节点转换为QAQ节点
   */
  private static nodeFromVueFlow(vueNode: VueFlowNode): NodeInstance {
    // 推断QAQ节点类型
    let qaqNodeType: NodeType
    
    if (vueNode.data.nodeType) {
      // 如果有明确的nodeType，直接使用
      qaqNodeType = vueNode.data.nodeType as NodeType
    } else {
      // 根据Vue组件类型和输出类型推断
      qaqNodeType = this.inferNodeType(vueNode.type, vueNode.data.outputType)
    }

    const definition = nodeRegistry.get(qaqNodeType)
    
    // 构建输入值
    const inputValues: { [key: string]: any } = {}
    
    if (qaqNodeType === NodeType.INPUT_FLOAT) {
      inputValues.value = vueNode.data.value || 0
    } else if (qaqNodeType === NodeType.INPUT_VECTOR3) {
      inputValues.vector = vueNode.data.vector || { x: 0, y: 0, z: 0 }
    } else if (qaqNodeType === NodeType.INPUT_COLOR) {
      inputValues.color = vueNode.data.color || '#ffffff'
    } else if (qaqNodeType === NodeType.INPUT_TEXTURE) {
      inputValues.textureName = vueNode.data.textureName || ''
    }

    // 构建连接状态
    const inputConnections: { [key: string]: boolean } = {}
    const outputConnections: { [key: string]: number } = {}
    
    if (definition) {
      definition.inputs.forEach(input => {
        inputConnections[input.id] = false
      })
      definition.outputs.forEach(output => {
        outputConnections[output.id] = 0
      })
    }

    const nodeData: NodeInstanceData = {
      label: vueNode.data.label,
      nodeType: qaqNodeType,
      inputValues,
      outputValues: {},
      inputConnections,
      outputConnections,
      properties: vueNode.data.properties || {}
    }

    return {
      id: vueNode.id,
      type: vueNode.type,
      position: vueNode.position,
      data: nodeData,
      selected: vueNode.selected,
      dragging: vueNode.dragging,
      nodeType: qaqNodeType,
      category: definition?.category
    }
  }

  /**
   * 推断节点类型
   */
  private static inferNodeType(vueType: string, outputType?: string): NodeType {
    if (vueType === 'input') {
      switch (outputType) {
        case 'float':
          return NodeType.INPUT_FLOAT
        case 'vector3':
          return NodeType.INPUT_VECTOR3
        case 'color':
          return NodeType.INPUT_COLOR
        case 'texture':
          return NodeType.INPUT_TEXTURE
        default:
          return NodeType.INPUT_FLOAT
      }
    } else if (vueType === 'math') {
      return NodeType.MATH_ADD // 默认为加法
    } else if (vueType === 'output') {
      return NodeType.OUTPUT_MATERIAL
    } else if (vueType === 'particle-age') {
      return NodeType.PARTICLE_AGE
    } else if (vueType === 'particle-color-ramp') {
      return NodeType.COLOR_RAMP
    } else if (vueType === 'particle-output') {
      return NodeType.PARTICLE_OUTPUT
    }
    
    return NodeType.INPUT_FLOAT // 默认类型
  }

  /**
   * 将QAQ连接转换为Vue Flow连接
   */
  private static connectionToVueFlow(connection: ConnectionInstance): VueFlowConnection {
    return {
      id: connection.id,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: connection.type,
      animated: connection.animated,
      style: connection.style
    }
  }

  /**
   * 将Vue Flow连接转换为QAQ连接
   */
  private static connectionFromVueFlow(edge: VueFlowConnection): ConnectionInstance {
    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: edge.type,
      animated: edge.animated,
      style: edge.style,
      dataType: DataType.FLOAT, // 默认类型，实际应该从端口定义推断
      valid: true
    }
  }

  /**
   * 更新连接的数据类型信息
   */
  static updateConnectionTypes(graph: MaterialGraph): void {
    for (const connection of graph.connections) {
      const sourceNode = graph.nodes.find(n => n.id === connection.source)
      const targetNode = graph.nodes.find(n => n.id === connection.target)
      
      if (sourceNode && targetNode) {
        const sourceDef = nodeRegistry.get(sourceNode.data.nodeType)
        const targetDef = nodeRegistry.get(targetNode.data.nodeType)
        
        if (sourceDef && targetDef) {
          const sourcePort = sourceDef.outputs.find(p => p.id === connection.sourceHandle)
          const targetPort = targetDef.inputs.find(p => p.id === connection.targetHandle)
          
          if (sourcePort && targetPort) {
            connection.dataType = sourcePort.type
            
            // 检查兼容性
            const compatibility = typeConverter.checkPortCompatibility(sourcePort.type, targetPort.type)
            connection.valid = compatibility.compatible
            
            if (compatibility.conversionNeeded) {
              connection.debugInfo = {
                sourceType: sourcePort.type,
                targetType: targetPort.type,
                compatible: compatibility.compatible,
                conversionNeeded: compatibility.conversionNeeded
              }
            }
          }
        }
      }
    }
  }

  /**
   * 验证Vue Flow数据并转换为QAQ格式
   */
  static validateAndConvert(
    nodes: VueFlowNode[], 
    edges: VueFlowConnection[]
  ): { graph: MaterialGraph, errors: string[] } {
    const errors: string[] = []
    
    // 验证节点
    for (const node of nodes) {
      if (!node.id) {
        errors.push(`节点缺少ID: ${JSON.stringify(node)}`)
      }
      if (!node.data.label) {
        errors.push(`节点 ${node.id} 缺少标签`)
      }
    }

    // 验证连接
    for (const edge of edges) {
      if (!edge.source || !edge.target) {
        errors.push(`连接 ${edge.id} 缺少源或目标节点`)
      }
      
      const sourceExists = nodes.some(n => n.id === edge.source)
      const targetExists = nodes.some(n => n.id === edge.target)
      
      if (!sourceExists) {
        errors.push(`连接 ${edge.id} 引用了不存在的源节点: ${edge.source}`)
      }
      if (!targetExists) {
        errors.push(`连接 ${edge.id} 引用了不存在的目标节点: ${edge.target}`)
      }
    }

    // 转换为QAQ格式
    const graph = this.fromVueFlow(nodes, edges)
    
    // 更新连接类型信息
    this.updateConnectionTypes(graph)

    return { graph, errors }
  }

  /**
   * 创建默认节点数据
   */
  static createDefaultNodeData(nodeType: NodeType): VueFlowNodeData {
    const definition = nodeRegistry.get(nodeType)
    
    if (!definition) {
      return {
        label: 'Unknown Node',
        nodeType: nodeType
      }
    }

    const data: VueFlowNodeData = {
      label: definition.name,
      nodeType: nodeType,
      properties: definition.properties || {}
    }

    // 根据节点类型设置默认值
    if (nodeType === NodeType.INPUT_FLOAT) {
      data.outputType = 'float'
      data.value = 0
    } else if (nodeType === NodeType.INPUT_VECTOR3) {
      data.outputType = 'vector3'
      data.vector = { x: 0, y: 0, z: 0 }
    } else if (nodeType === NodeType.INPUT_COLOR) {
      data.outputType = 'color'
      data.color = '#ffffff'
    }

    return data
  }

  /**
   * 获取端口颜色
   */
  static getPortColor(dataType: DataType): string {
    const colorMap: { [key in DataType]: string } = {
      [DataType.FLOAT]: '#4ade80',
      [DataType.INT]: '#22c55e',
      [DataType.BOOL]: '#ef4444',
      [DataType.VEC2]: '#3b82f6',
      [DataType.VEC3]: '#3b82f6',
      [DataType.VEC4]: '#1d4ed8',
      [DataType.MAT2]: '#7c3aed',
      [DataType.MAT3]: '#7c3aed',
      [DataType.MAT4]: '#6d28d9',
      [DataType.COLOR]: '#f472b6',
      [DataType.TEXTURE]: '#a78bfa',
      [DataType.CUBEMAP]: '#8b5cf6',
      [DataType.PARTICLE_DATA]: '#00DC82'
    }

    return colorMap[dataType] || '#6b7280'
  }
}
