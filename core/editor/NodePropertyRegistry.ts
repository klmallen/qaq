/**
 * QAQ游戏引擎 - 节点属性注册表
 * 
 * 为所有节点类型注册可序列化属性，类似Godot的_bind_methods
 */

import { RegisterProperty } from './AutoSerializer'
import Node from '../nodes/Node'
import Scene from '../nodes/Scene'
import Node3D from '../nodes/Node3D'
import MeshInstance3D from '../nodes/MeshInstance3D'
import Camera3D from '../nodes/Camera3D'
import DirectionalLight3D from '../nodes/DirectionalLight3D'
import AnimationPlayer from '../nodes/animation/AnimationPlayer'

// ============================================================================
// 属性注册函数
// ============================================================================

/**
 * 注册Node基类属性
 */
export function registerNodeProperties() {
  // 基础属性
  RegisterProperty(Node, 'name', 'string')
  RegisterProperty(Node, 'processMode', 'number')
  RegisterProperty(Node, 'processPriority', 'number')
  
  console.log('📝 Node基类属性已注册')
}

/**
 * 注册Scene属性
 */
export function registerSceneProperties() {
  // Scene继承Node的所有属性，无需额外注册
  console.log('📝 Scene属性已注册')
}

/**
 * 注册Node3D属性
 */
export function registerNode3DProperties() {
  // 3D变换属性
  RegisterProperty(Node3D, 'position', 'vector3')
  RegisterProperty(Node3D, 'rotation', 'vector3')
  RegisterProperty(Node3D, 'scale', 'vector3')
  RegisterProperty(Node3D, 'visible', 'boolean')
  
  console.log('📝 Node3D属性已注册')
}

/**
 * 注册MeshInstance3D属性
 */
export function registerMeshInstance3DProperties() {
  // 继承Node3D的所有属性
  
  // 渲染属性
  RegisterProperty(MeshInstance3D, 'castShadow', 'boolean')
  RegisterProperty(MeshInstance3D, 'receiveShadow', 'boolean')
  RegisterProperty(MeshInstance3D, 'materialType', 'string')
  
  // 网格资源属性
  RegisterProperty(MeshInstance3D, 'meshPath', 'string', 'getMeshPath', 'setMeshPath')
  
  console.log('📝 MeshInstance3D属性已注册')
}

/**
 * 注册Camera3D属性
 */
export function registerCamera3DProperties() {
  // 继承Node3D的所有属性
  
  // 相机属性
  RegisterProperty(Camera3D, 'fov', 'number')
  RegisterProperty(Camera3D, 'near', 'number')
  RegisterProperty(Camera3D, 'far', 'number')
  RegisterProperty(Camera3D, 'projectionMode', 'string')
  RegisterProperty(Camera3D, 'clearColor', 'color')
  RegisterProperty(Camera3D, 'clearFlags', 'number')
  
  // 特殊属性（需要自定义处理）
  RegisterProperty(Camera3D, 'isCurrent', 'boolean', 'isCurrent', 'setAsCurrent')
  
  console.log('📝 Camera3D属性已注册')
}

/**
 * 注册DirectionalLight3D属性
 */
export function registerDirectionalLight3DProperties() {
  // 继承Node3D的所有属性
  
  // 光源属性
  RegisterProperty(DirectionalLight3D, 'color', 'color')
  RegisterProperty(DirectionalLight3D, 'intensity', 'number')
  RegisterProperty(DirectionalLight3D, 'enabled', 'boolean')
  
  // 阴影属性
  RegisterProperty(DirectionalLight3D, 'castShadow', 'boolean')
  RegisterProperty(DirectionalLight3D, 'shadowMapSize', 'number')
  RegisterProperty(DirectionalLight3D, 'shadowBias', 'number')
  RegisterProperty(DirectionalLight3D, 'shadowRadius', 'number')
  
  console.log('📝 DirectionalLight3D属性已注册')
}

/**
 * 注册AnimationPlayer属性
 */
export function registerAnimationPlayerProperties() {
  // 动画播放器属性
  RegisterProperty(AnimationPlayer, 'autoplay', 'string')
  RegisterProperty(AnimationPlayer, 'speed', 'number')
  RegisterProperty(AnimationPlayer, 'processMode', 'string')
  RegisterProperty(AnimationPlayer, 'globalTransitionTime', 'number', 'getGlobalTransitionTime', 'setGlobalTransitionTime')
  RegisterProperty(AnimationPlayer, 'intelligentTransitionsEnabled', 'boolean', 'isIntelligentTransitionsEnabled', 'setIntelligentTransitionsEnabled')
  RegisterProperty(AnimationPlayer, 'currentAnimation', 'string', 'getCurrentAnimation', 'setCurrentAnimation')
  
  console.log('📝 AnimationPlayer属性已注册')
}

// ============================================================================
// 批量注册函数
// ============================================================================

/**
 * 注册所有节点类型的属性
 */
export function registerAllNodeProperties() {
  console.log('🔧 开始注册所有节点属性...')
  
  registerNodeProperties()
  registerSceneProperties()
  registerNode3DProperties()
  registerMeshInstance3DProperties()
  registerCamera3DProperties()
  registerDirectionalLight3DProperties()
  registerAnimationPlayerProperties()
  
  console.log('✅ 所有节点属性注册完成')
}

/**
 * 获取节点的所有可序列化属性
 */
export function getNodeSerializableProperties(nodeClass: typeof Node): Map<string, any> {
  return (nodeClass as any)._serializableProperties || new Map()
}

/**
 * 检查节点是否有指定属性
 */
export function hasSerializableProperty(nodeClass: typeof Node, propertyName: string): boolean {
  const properties = getNodeSerializableProperties(nodeClass)
  return properties.has(propertyName)
}

/**
 * 获取属性描述符
 */
export function getPropertyDescriptor(nodeClass: typeof Node, propertyName: string): any {
  const properties = getNodeSerializableProperties(nodeClass)
  return properties.get(propertyName)
}

// ============================================================================
// 调试和检查函数
// ============================================================================

/**
 * 打印所有注册的属性
 */
export function printAllRegisteredProperties() {
  const nodeClasses = [
    { name: 'Node', class: Node },
    { name: 'Scene', class: Scene },
    { name: 'Node3D', class: Node3D },
    { name: 'MeshInstance3D', class: MeshInstance3D },
    { name: 'Camera3D', class: Camera3D },
    { name: 'DirectionalLight3D', class: DirectionalLight3D },
    { name: 'AnimationPlayer', class: AnimationPlayer }
  ]
  
  console.log('\n📋 所有注册的可序列化属性:')
  console.log('='.repeat(60))
  
  for (const { name, class: NodeClass } of nodeClasses) {
    const properties = getNodeSerializableProperties(NodeClass)
    
    console.log(`\n${name} (${properties.size} 个属性):`)
    
    if (properties.size === 0) {
      console.log('  (无注册属性)')
      continue
    }
    
    for (const [key, descriptor] of properties.entries()) {
      const type = descriptor.type
      const getter = descriptor.getter || '直接访问'
      const setter = descriptor.setter || '直接设置'
      
      console.log(`  📌 ${key}: ${type}`)
      console.log(`     getter: ${getter}`)
      console.log(`     setter: ${setter}`)
    }
  }
  
  console.log('\n' + '='.repeat(60))
}

/**
 * 验证属性注册的完整性
 */
export function validatePropertyRegistration(): { success: boolean; issues: string[] } {
  const issues: string[] = []
  
  // 检查Node3D是否有基础3D属性
  const node3DProps = getNodeSerializableProperties(Node3D)
  const required3DProps = ['position', 'rotation', 'scale', 'visible']
  
  for (const prop of required3DProps) {
    if (!node3DProps.has(prop)) {
      issues.push(`Node3D缺少必需属性: ${prop}`)
    }
  }
  
  // 检查Camera3D是否有相机属性
  const cameraProps = getNodeSerializableProperties(Camera3D)
  const requiredCameraProps = ['fov', 'near', 'far']
  
  for (const prop of requiredCameraProps) {
    if (!cameraProps.has(prop)) {
      issues.push(`Camera3D缺少必需属性: ${prop}`)
    }
  }
  
  // 检查DirectionalLight3D是否有光源属性
  const lightProps = getNodeSerializableProperties(DirectionalLight3D)
  const requiredLightProps = ['color', 'intensity', 'enabled']
  
  for (const prop of requiredLightProps) {
    if (!lightProps.has(prop)) {
      issues.push(`DirectionalLight3D缺少必需属性: ${prop}`)
    }
  }
  
  return {
    success: issues.length === 0,
    issues
  }
}

// 导出到全局，方便调试（仅在浏览器环境中）
if (typeof window !== 'undefined' && window) {
  try {
    (window as any).printAllRegisteredProperties = printAllRegisteredProperties
    (window as any).validatePropertyRegistration = validatePropertyRegistration
    console.log('💡 调试命令:')
    console.log('  - window.printAllRegisteredProperties() // 查看所有注册属性')
    console.log('  - window.validatePropertyRegistration() // 验证属性注册')
  } catch (error) {
    console.warn('⚠️ 无法设置全局调试函数:', error)
  }
}

export default {
  registerAllNodeProperties,
  getNodeSerializableProperties,
  hasSerializableProperty,
  getPropertyDescriptor,
  printAllRegisteredProperties,
  validatePropertyRegistration
}
