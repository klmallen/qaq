/**
 * QAQ游戏引擎 - Light3D 光照系统演示
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 演示如何使用QAQ游戏引擎的光照系统
 * - 展示各种光照类型的效果和配置
 * - 提供完整的光照场景示例
 * - 演示阴影系统和调试功能
 */

import DirectionalLight3D from './DirectionalLight3D'
import OmniLight3D from './OmniLight3D'
import SpotLight3D from './SpotLight3D'
import Node3D from '../Node3D'
import MeshInstance3D from '../MeshInstance3D'
import * as THREE from 'three'

// ============================================================================
// 基础光照演示
// ============================================================================

/**
 * 创建基础光照场景
 */
export function createBasicLightingScene(): Node3D {
  console.log('🎨 创建基础光照场景...')
  
  // 创建根节点
  const scene = new Node3D('LightingScene')
  
  // 创建地面
  const ground = new MeshInstance3D('Ground')
  ground.createPlaneMesh(20, 20)
  ground.position = { x: 0, y: -1, z: 0 }
  ground.rotation = { x: -Math.PI / 2, y: 0, z: 0 }
  scene.addChild(ground)
  
  // 创建一些立方体
  for (let i = 0; i < 5; i++) {
    const cube = new MeshInstance3D(`Cube${i}`)
    cube.createBoxMesh(1, 1, 1)
    cube.position = {
      x: (i - 2) * 3,
      y: 0,
      z: 0
    }
    scene.addChild(cube)
  }
  
  // 添加方向光（主光源）
  const sunLight = new DirectionalLight3D('SunLight', {
    color: 0xffffff,
    intensity: 1.0,
    castShadow: true,
    shadowMapSize: 2048
  })
  sunLight.position = { x: 10, y: 10, z: 5 }
  sunLight.setDirection({ x: 0, y: 0, z: 0 })
  sunLight.setShadowCameraSize(15)
  scene.addChild(sunLight)
  
  // 添加环境光（填充光）
  const ambientLight = new OmniLight3D('AmbientLight', {
    color: 0x404040,
    intensity: 0.3,
    range: 50
  })
  ambientLight.position = { x: 0, y: 5, z: 0 }
  scene.addChild(ambientLight)
  
  console.log('✅ 基础光照场景创建完成')
  return scene
}

/**
 * 创建多彩光照场景
 */
export function createColorfulLightingScene(): Node3D {
  console.log('🌈 创建多彩光照场景...')
  
  // 创建根节点
  const scene = new Node3D('ColorfulLightingScene')
  
  // 创建中心球体
  const centerSphere = new MeshInstance3D('CenterSphere')
  centerSphere.createSphereMesh(1, 32, 16)
  centerSphere.position = { x: 0, y: 0, z: 0 }
  scene.addChild(centerSphere)
  
  // 创建围绕的小球体
  const sphereCount = 8
  for (let i = 0; i < sphereCount; i++) {
    const angle = (i / sphereCount) * Math.PI * 2
    const radius = 4
    
    const sphere = new MeshInstance3D(`Sphere${i}`)
    sphere.createSphereMesh(0.5, 16, 8)
    sphere.position = {
      x: Math.cos(angle) * radius,
      y: 0,
      z: Math.sin(angle) * radius
    }
    scene.addChild(sphere)
  }
  
  // 添加红色点光源
  const redLight = new OmniLight3D('RedLight', {
    color: 0xff0000,
    intensity: 2.0,
    range: 8,
    decay: 2
  })
  redLight.position = { x: 3, y: 2, z: 0 }
  scene.addChild(redLight)
  
  // 添加绿色点光源
  const greenLight = new OmniLight3D('GreenLight', {
    color: 0x00ff00,
    intensity: 2.0,
    range: 8,
    decay: 2
  })
  greenLight.position = { x: -3, y: 2, z: 0 }
  scene.addChild(greenLight)
  
  // 添加蓝色聚光灯
  const blueSpotLight = new SpotLight3D('BlueSpotLight', {
    color: 0x0000ff,
    intensity: 3.0,
    range: 12,
    angle: Math.PI / 6, // 30度
    penumbra: 0.3,
    castShadow: true
  })
  blueSpotLight.position = { x: 0, y: 6, z: 0 }
  blueSpotLight.setDirection({ x: 0, y: 0, z: 0 })
  scene.addChild(blueSpotLight)
  
  console.log('✅ 多彩光照场景创建完成')
  return scene
}

/**
 * 创建动态光照场景
 */
export function createDynamicLightingScene(): Node3D {
  console.log('⚡ 创建动态光照场景...')
  
  // 创建根节点
  const scene = new Node3D('DynamicLightingScene')
  
  // 创建地面
  const ground = new MeshInstance3D('Ground')
  ground.createPlaneMesh(30, 30)
  ground.position = { x: 0, y: -2, z: 0 }
  ground.rotation = { x: -Math.PI / 2, y: 0, z: 0 }
  scene.addChild(ground)
  
  // 创建一些障碍物
  for (let i = 0; i < 10; i++) {
    const obstacle = new MeshInstance3D(`Obstacle${i}`)
    obstacle.createBoxMesh(
      0.5 + Math.random() * 1.5,
      1 + Math.random() * 2,
      0.5 + Math.random() * 1.5
    )
    obstacle.position = {
      x: (Math.random() - 0.5) * 20,
      y: 0,
      z: (Math.random() - 0.5) * 20
    }
    scene.addChild(obstacle)
  }
  
  // 创建移动的聚光灯（模拟手电筒）
  const flashlight = new SpotLight3D('Flashlight', {
    color: 0xffffaa,
    intensity: 4.0,
    range: 15,
    angle: Math.PI / 8, // 22.5度
    penumbra: 0.4,
    castShadow: true,
    shadowMapSize: 1024
  })
  flashlight.position = { x: 0, y: 3, z: 8 }
  flashlight.setDirection({ x: 0, y: -1, z: -1 })
  scene.addChild(flashlight)
  
  // 创建巡逻的点光源
  const patrolLight = new OmniLight3D('PatrolLight', {
    color: 0xff6600,
    intensity: 1.5,
    range: 6,
    decay: 1.5
  })
  patrolLight.position = { x: -8, y: 1, z: 0 }
  scene.addChild(patrolLight)
  
  // 创建脉动的点光源
  const pulseLight = new OmniLight3D('PulseLight', {
    color: 0x6600ff,
    intensity: 0.5,
    range: 10,
    decay: 2
  })
  pulseLight.position = { x: 8, y: 1, z: 0 }
  scene.addChild(pulseLight)
  
  console.log('✅ 动态光照场景创建完成')
  return scene
}

// ============================================================================
// 光照动画演示
// ============================================================================

/**
 * 光照动画控制器
 */
export class LightingAnimationController {
  private scene: Node3D
  private time: number = 0
  private animationId: number | null = null
  
  constructor(scene: Node3D) {
    this.scene = scene
  }
  
  /**
   * 开始动画
   */
  start(): void {
    if (this.animationId !== null) return
    
    const animate = () => {
      this.time += 0.016 // 约60FPS
      this.updateLights()
      this.animationId = requestAnimationFrame(animate)
    }
    
    animate()
    console.log('🎬 光照动画开始')
  }
  
  /**
   * 停止动画
   */
  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
      console.log('⏹️ 光照动画停止')
    }
  }
  
  /**
   * 更新光照
   */
  private updateLights(): void {
    // 更新手电筒位置（圆形移动）
    const flashlight = this.scene.getChild('Flashlight') as SpotLight3D
    if (flashlight) {
      const radius = 8
      flashlight.position = {
        x: Math.cos(this.time * 0.5) * radius,
        y: 3,
        z: Math.sin(this.time * 0.5) * radius + 2
      }
      // 让手电筒始终指向中心
      flashlight.setDirection({ x: 0, y: -1, z: 0 })
    }
    
    // 更新巡逻光源（直线移动）
    const patrolLight = this.scene.getChild('PatrolLight') as OmniLight3D
    if (patrolLight) {
      patrolLight.position = {
        x: Math.sin(this.time * 0.8) * 10,
        y: 1,
        z: Math.cos(this.time * 0.3) * 5
      }
    }
    
    // 更新脉动光源（强度变化）
    const pulseLight = this.scene.getChild('PulseLight') as OmniLight3D
    if (pulseLight) {
      pulseLight.intensity = 0.5 + Math.sin(this.time * 3) * 0.4
      
      // 颜色变化
      const hue = (this.time * 50) % 360
      const color = new THREE.Color()
      color.setHSL(hue / 360, 1, 0.5)
      pulseLight.color = color.getHex()
    }
  }
}

// ============================================================================
// 使用示例
// ============================================================================

/**
 * 完整的光照系统使用示例
 */
export function lightingSystemExample(): void {
  console.log('🎮 光照系统使用示例')
  
  // 1. 创建基础场景
  console.log('\n1. 基础光照场景:')
  const basicScene = createBasicLightingScene()
  
  // 2. 创建多彩场景
  console.log('\n2. 多彩光照场景:')
  const colorfulScene = createColorfulLightingScene()
  
  // 3. 创建动态场景
  console.log('\n3. 动态光照场景:')
  const dynamicScene = createDynamicLightingScene()
  
  // 4. 启动动画
  const animationController = new LightingAnimationController(dynamicScene)
  animationController.start()
  
  // 5. 演示光照控制
  console.log('\n4. 光照控制演示:')
  demonstrateLightControl()
  
  console.log('\n✨ 光照系统示例完成！')
}

/**
 * 演示光照控制
 */
function demonstrateLightControl(): void {
  // 创建各种光照
  const dirLight = new DirectionalLight3D('DemoDirectionalLight')
  const omniLight = new OmniLight3D('DemoOmniLight')
  const spotLight = new SpotLight3D('DemoSpotLight')
  
  // 演示属性设置
  console.log('设置光照颜色...')
  dirLight.setColorRGB(255, 200, 100) // 暖白色
  omniLight.setColorHSL(120, 100, 50) // 绿色
  spotLight.color = 0x0088ff // 蓝色
  
  // 演示强度控制
  console.log('调整光照强度...')
  dirLight.intensity = 1.2
  omniLight.intensity = 2.0
  spotLight.intensity = 3.0
  
  // 演示阴影设置
  console.log('配置阴影系统...')
  dirLight.castShadow = true
  dirLight.setShadowCameraSize(20)
  dirLight.setShadowBias(-0.0005, 0.01)
  
  omniLight.castShadow = true
  omniLight.setShadowMapSize(1024)
  
  spotLight.castShadow = true
  spotLight.setShadowCameraRange(0.1, 25)
  
  // 演示调试功能
  console.log('启用调试显示...')
  dirLight.debugVisible = true
  omniLight.debugVisible = true
  spotLight.debugVisible = true
  
  // 输出统计信息
  console.log('光照统计信息:')
  console.log('- 方向光:', dirLight.getStats())
  console.log('- 全向光:', omniLight.getOmniStats())
  console.log('- 聚光灯:', spotLight.getSpotStats())
}

// 如果直接运行此文件，执行示例
if (typeof window === 'undefined') {
  lightingSystemExample()
}
