/**
 * QAQ游戏引擎 - Light3D 光照系统测试
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 测试Light3D基类和所有光照节点的功能
 * - 验证光照属性设置和Three.js集成
 * - 测试阴影系统和调试功能
 * - 确保光照节点的正确性和稳定性
 */

import Light3D, { LightType, ShadowType } from './Light3D'
import DirectionalLight3D from './DirectionalLight3D'
import OmniLight3D from './OmniLight3D'
import SpotLight3D from './SpotLight3D'
import * as THREE from 'three'

// ============================================================================
// 测试辅助函数
// ============================================================================

/**
 * 创建测试场景
 */
function createTestScene(): THREE.Scene {
  const scene = new THREE.Scene()
  
  // 添加一个简单的立方体用于测试光照
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshStandardMaterial({ color: 0x888888 })
  const cube = new THREE.Mesh(geometry, material)
  scene.add(cube)
  
  return scene
}

/**
 * 创建测试渲染器
 */
function createTestRenderer(): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer()
  renderer.setSize(800, 600)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  return renderer
}

// ============================================================================
// DirectionalLight3D 测试
// ============================================================================

/**
 * 测试方向光基础功能
 */
function testDirectionalLight(): void {
  console.log('🧪 测试 DirectionalLight3D...')
  
  // 创建方向光
  const dirLight = new DirectionalLight3D('TestDirectionalLight', {
    color: 0xffffff,
    intensity: 1.0,
    castShadow: true,
    shadowMapSize: 1024
  })
  
  // 测试基础属性
  console.assert(dirLight.lightType === LightType.DIRECTIONAL, '光照类型应为DIRECTIONAL')
  console.assert(dirLight.color === 0xffffff, '光照颜色应为白色')
  console.assert(dirLight.intensity === 1.0, '光照强度应为1.0')
  console.assert(dirLight.castShadow === true, '应启用阴影投射')
  
  // 测试方向光特有属性
  console.assert(dirLight.shadowCameraLeft === -10, '阴影相机左边界默认值')
  console.assert(dirLight.shadowCameraRight === 10, '阴影相机右边界默认值')
  
  // 测试属性设置
  dirLight.color = 0xff0000
  console.assert(dirLight.color === 0xff0000, '颜色设置应生效')
  
  dirLight.intensity = 2.0
  console.assert(dirLight.intensity === 2.0, '强度设置应生效')
  
  // 测试阴影相机设置
  dirLight.setShadowCameraBox(-20, 20, 20, -20)
  console.assert(dirLight.shadowCameraLeft === -20, '阴影相机范围设置应生效')
  
  // 测试方向设置
  dirLight.setDirection({ x: 1, y: -1, z: 0 })
  const direction = dirLight.getDirectionVector()
  console.assert(direction.x === 1 && direction.y === -1 && direction.z === 0, '方向设置应生效')
  
  // 测试克隆
  const cloned = dirLight.clone('ClonedDirectionalLight')
  console.assert(cloned.name === 'ClonedDirectionalLight', '克隆节点名称应正确')
  console.assert(cloned.color === dirLight.color, '克隆节点属性应一致')
  
  console.log('✅ DirectionalLight3D 测试通过')
}

/**
 * 测试全向光基础功能
 */
function testOmniLight(): void {
  console.log('🧪 测试 OmniLight3D...')
  
  // 创建全向光
  const omniLight = new OmniLight3D('TestOmniLight', {
    color: 0x00ff00,
    intensity: 1.5,
    range: 15,
    decay: 1.5,
    castShadow: true
  })
  
  // 测试基础属性
  console.assert(omniLight.lightType === LightType.POINT, '光照类型应为POINT')
  console.assert(omniLight.color === 0x00ff00, '光照颜色应为绿色')
  console.assert(omniLight.intensity === 1.5, '光照强度应为1.5')
  
  // 测试全向光特有属性
  console.assert(omniLight.range === 15, '光照范围应为15')
  console.assert(omniLight.decay === 1.5, '衰减系数应为1.5')
  
  // 测试属性设置
  omniLight.setRangeAndDecay(20, 2.0)
  console.assert(omniLight.range === 20, '范围设置应生效')
  console.assert(omniLight.decay === 2.0, '衰减设置应生效')
  
  // 测试克隆
  const cloned = omniLight.clone('ClonedOmniLight')
  console.assert(cloned.name === 'ClonedOmniLight', '克隆节点名称应正确')
  console.assert(cloned.range === omniLight.range, '克隆节点属性应一致')
  
  console.log('✅ OmniLight3D 测试通过')
}

/**
 * 测试聚光灯基础功能
 */
function testSpotLight(): void {
  console.log('🧪 测试 SpotLight3D...')
  
  // 创建聚光灯
  const spotLight = new SpotLight3D('TestSpotLight', {
    color: 0x0000ff,
    intensity: 2.0,
    range: 25,
    angle: Math.PI / 4, // 45度
    penumbra: 0.2,
    decay: 1.8
  })
  
  // 测试基础属性
  console.assert(spotLight.lightType === LightType.SPOT, '光照类型应为SPOT')
  console.assert(spotLight.color === 0x0000ff, '光照颜色应为蓝色')
  console.assert(spotLight.intensity === 2.0, '光照强度应为2.0')
  
  // 测试聚光灯特有属性
  console.assert(spotLight.range === 25, '光照范围应为25')
  console.assert(Math.abs(spotLight.angle - Math.PI / 4) < 0.001, '光锥角度应为45度')
  console.assert(spotLight.penumbra === 0.2, '边缘衰减应为0.2')
  console.assert(spotLight.decay === 1.8, '衰减系数应为1.8')
  
  // 测试角度转换
  spotLight.angleDegrees = 60
  console.assert(Math.abs(spotLight.angleDegrees - 60) < 0.1, '角度度数设置应生效')
  
  // 测试光锥参数设置
  spotLight.setConeParametersDegrees(30, 0.3)
  console.assert(Math.abs(spotLight.angleDegrees - 30) < 0.1, '光锥角度设置应生效')
  console.assert(spotLight.penumbra === 0.3, '边缘衰减设置应生效')
  
  // 测试方向设置
  spotLight.setDirectionVector({ x: 0, y: -1, z: 0 })
  const direction = spotLight.getDirectionVector()
  console.assert(Math.abs(direction.y + 1) < 0.001, '方向向量设置应生效')
  
  // 测试克隆
  const cloned = spotLight.clone('ClonedSpotLight')
  console.assert(cloned.name === 'ClonedSpotLight', '克隆节点名称应正确')
  console.assert(cloned.range === spotLight.range, '克隆节点属性应一致')
  
  console.log('✅ SpotLight3D 测试通过')
}

/**
 * 测试光照系统集成
 */
function testLightingSystemIntegration(): void {
  console.log('🧪 测试光照系统集成...')
  
  // 创建测试场景
  const scene = createTestScene()
  const renderer = createTestRenderer()
  
  // 创建各种光照
  const dirLight = new DirectionalLight3D('DirLight')
  const omniLight = new OmniLight3D('OmniLight')
  const spotLight = new SpotLight3D('SpotLight')
  
  // 设置光照位置
  dirLight.position = { x: 5, y: 5, z: 5 }
  omniLight.position = { x: -3, y: 2, z: 0 }
  spotLight.position = { x: 0, y: 5, z: 3 }
  
  // 模拟节点进入场景树
  dirLight._ready()
  omniLight._ready()
  spotLight._ready()
  
  // 验证Three.js对象创建
  console.assert(dirLight.threeLight !== null, '方向光Three.js对象应已创建')
  console.assert(omniLight.threeLight !== null, '全向光Three.js对象应已创建')
  console.assert(spotLight.threeLight !== null, '聚光灯Three.js对象应已创建')
  
  // 验证光照类型
  console.assert(dirLight.threeLight instanceof THREE.DirectionalLight, '应创建DirectionalLight')
  console.assert(omniLight.threeLight instanceof THREE.PointLight, '应创建PointLight')
  console.assert(spotLight.threeLight instanceof THREE.SpotLight, '应创建SpotLight')
  
  // 测试统计信息
  const dirStats = dirLight.getStats()
  console.assert(dirStats.lightType === LightType.DIRECTIONAL, '统计信息应正确')
  console.assert(dirStats.hasThreeLight === true, '应有Three.js光照对象')
  
  console.log('✅ 光照系统集成测试通过')
}

// ============================================================================
// 主测试函数
// ============================================================================

/**
 * 运行所有光照系统测试
 */
export function runLightingTests(): void {
  console.log('🚀 开始光照系统测试...')
  
  try {
    testDirectionalLight()
    testOmniLight()
    testSpotLight()
    testLightingSystemIntegration()
    
    console.log('🎉 所有光照系统测试通过！')
  } catch (error) {
    console.error('❌ 光照系统测试失败:', error)
    throw error
  }
}

// 如果直接运行此文件，执行测试
if (typeof window === 'undefined') {
  runLightingTests()
}
