// ============================================================================
// QAQ Engine - 光照系统演示模块 (Lighting System Demo Module)
// ============================================================================

import { Scene } from '~/core/scene/Scene'
import DirectionalLight3D from '~/core/nodes/lights/DirectionalLight3D'
import * as THREE from 'three'

/**
 * 光照演示类型枚举
 */
export enum LightingDemoType {
  BASIC = 'basic',
  DYNAMIC = 'dynamic',
  COLORFUL = 'colorful',
  SUNSET = 'sunset',
  NIGHT = 'night'
}

/**
 * 光照演示管理器
 */
export class LightingDemo {
  private scene: Scene | null = null
  private lights: DirectionalLight3D[] = []
  private currentType: LightingDemoType = LightingDemoType.BASIC
  private animationTime: number = 0

  constructor(scene: Scene) {
    this.scene = scene
  }

  /**
   * 初始化光照系统
   */
  initialize(): void {
    console.log('💡 初始化光照演示系统...')
    
    try {
      this.createBasicLighting()
      console.log('✅ 光照演示系统初始化完成')
    } catch (error) {
      console.error('❌ 光照演示系统初始化失败:', error)
    }
  }

  /**
   * 创建基础光照
   */
  private createBasicLighting(): void {
    if (!this.scene) return

    // 主光源
    const mainLight = new DirectionalLight3D()
    mainLight.name = 'MainLight'
    mainLight.color = new THREE.Color(0xffffff)
    mainLight.intensity = 1.0
    mainLight.position.set(5, 10, 5)
    mainLight.lookAt(new THREE.Vector3(0, 0, 0))
    
    this.scene.addChild(mainLight)
    this.lights.push(mainLight)

    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.3)
    this.scene.object3D.add(ambientLight)
  }

  /**
   * 切换光照演示类型
   */
  switchTo(type: LightingDemoType): void {
    console.log(`💡 切换到${type}光照演示`)
    
    this.currentType = type
    this.clearLights()
    
    switch (type) {
      case LightingDemoType.BASIC:
        this.createBasicLighting()
        break
      case LightingDemoType.DYNAMIC:
        this.createDynamicLighting()
        break
      case LightingDemoType.COLORFUL:
        this.createColorfulLighting()
        break
      case LightingDemoType.SUNSET:
        this.createSunsetLighting()
        break
      case LightingDemoType.NIGHT:
        this.createNightLighting()
        break
    }
  }

  /**
   * 创建动态光照
   */
  private createDynamicLighting(): void {
    if (!this.scene) return

    // 旋转的主光源
    const rotatingLight = new DirectionalLight3D()
    rotatingLight.name = 'RotatingLight'
    rotatingLight.color = new THREE.Color(0xffffff)
    rotatingLight.intensity = 1.2
    rotatingLight.position.set(8, 8, 0)
    
    this.scene.addChild(rotatingLight)
    this.lights.push(rotatingLight)

    // 脉冲光源
    const pulseLight = new DirectionalLight3D()
    pulseLight.name = 'PulseLight'
    pulseLight.color = new THREE.Color(0x4ecdc4)
    pulseLight.intensity = 0.5
    pulseLight.position.set(-5, 6, 5)
    
    this.scene.addChild(pulseLight)
    this.lights.push(pulseLight)

    // 环境光
    const ambientLight = new THREE.AmbientLight(0x202040, 0.2)
    this.scene.object3D.add(ambientLight)
  }

  /**
   * 创建彩色光照
   */
  private createColorfulLighting(): void {
    if (!this.scene) return

    const colors = [
      { color: 0xff6b35, pos: [6, 8, 6] },    // 橙色
      { color: 0x4ecdc4, pos: [-6, 8, 6] },   // 青色
      { color: 0xf9ca24, pos: [6, 8, -6] },   // 黄色
      { color: 0xeb4d4b, pos: [-6, 8, -6] }   // 红色
    ]

    colors.forEach((lightConfig, index) => {
      const light = new DirectionalLight3D()
      light.name = `ColorLight_${index}`
      light.color = new THREE.Color(lightConfig.color)
      light.intensity = 0.6
      light.position.set(...lightConfig.pos)
      light.lookAt(new THREE.Vector3(0, 0, 0))
      
      this.scene!.addChild(light)
      this.lights.push(light)
    })

    // 低强度环境光
    const ambientLight = new THREE.AmbientLight(0x111111, 0.1)
    this.scene.object3D.add(ambientLight)
  }

  /**
   * 创建日落光照
   */
  private createSunsetLighting(): void {
    if (!this.scene) return

    // 太阳光（橙红色）
    const sunLight = new DirectionalLight3D()
    sunLight.name = 'SunLight'
    sunLight.color = new THREE.Color(0xff4500) // 橙红色
    sunLight.intensity = 1.5
    sunLight.position.set(10, 3, 8) // 低角度模拟日落
    sunLight.lookAt(new THREE.Vector3(0, 0, 0))
    
    this.scene.addChild(sunLight)
    this.lights.push(sunLight)

    // 天空光（蓝紫色）
    const skyLight = new DirectionalLight3D()
    skyLight.name = 'SkyLight'
    skyLight.color = new THREE.Color(0x4169e1) // 蓝色
    skyLight.intensity = 0.3
    skyLight.position.set(-5, 10, -5)
    skyLight.lookAt(new THREE.Vector3(0, 0, 0))
    
    this.scene.addChild(skyLight)
    this.lights.push(skyLight)

    // 暖色环境光
    const ambientLight = new THREE.AmbientLight(0x402010, 0.4)
    this.scene.object3D.add(ambientLight)
  }

  /**
   * 创建夜晚光照
   */
  private createNightLighting(): void {
    if (!this.scene) return

    // 月光（冷白色）
    const moonLight = new DirectionalLight3D()
    moonLight.name = 'MoonLight'
    moonLight.color = new THREE.Color(0xb0c4de) // 冷白色
    moonLight.intensity = 0.4
    moonLight.position.set(-8, 12, 8)
    moonLight.lookAt(new THREE.Vector3(0, 0, 0))
    
    this.scene.addChild(moonLight)
    this.lights.push(moonLight)

    // 星光（微弱蓝光）
    const starLight = new DirectionalLight3D()
    starLight.name = 'StarLight'
    starLight.color = new THREE.Color(0x191970) // 深蓝色
    starLight.intensity = 0.1
    starLight.position.set(5, 15, -5)
    starLight.lookAt(new THREE.Vector3(0, 0, 0))
    
    this.scene.addChild(starLight)
    this.lights.push(starLight)

    // 深蓝色环境光
    const ambientLight = new THREE.AmbientLight(0x0a0a20, 0.2)
    this.scene.object3D.add(ambientLight)
  }

  /**
   * 更新光照动画
   */
  update(deltaTime: number): void {
    this.animationTime += deltaTime

    if (this.currentType === LightingDemoType.DYNAMIC) {
      this.updateDynamicLighting()
    } else if (this.currentType === LightingDemoType.COLORFUL) {
      this.updateColorfulLighting()
    }
  }

  /**
   * 更新动态光照
   */
  private updateDynamicLighting(): void {
    const rotatingLight = this.lights.find(light => light.name === 'RotatingLight')
    if (rotatingLight) {
      // 旋转光源
      const radius = 8
      rotatingLight.position.x = Math.cos(this.animationTime * 0.5) * radius
      rotatingLight.position.z = Math.sin(this.animationTime * 0.5) * radius
      rotatingLight.lookAt(new THREE.Vector3(0, 0, 0))
    }

    const pulseLight = this.lights.find(light => light.name === 'PulseLight')
    if (pulseLight) {
      // 脉冲强度
      pulseLight.intensity = 0.3 + Math.sin(this.animationTime * 3) * 0.3
    }
  }

  /**
   * 更新彩色光照
   */
  private updateColorfulLighting(): void {
    this.lights.forEach((light, index) => {
      if (light.name.startsWith('ColorLight_')) {
        // 每个光源不同的脉冲频率
        const frequency = 1 + index * 0.5
        light.intensity = 0.4 + Math.sin(this.animationTime * frequency) * 0.3
      }
    })
  }

  /**
   * 清理所有光源
   */
  private clearLights(): void {
    if (!this.scene) return

    // 移除QAQ光源
    this.lights.forEach(light => {
      this.scene!.removeChild(light)
    })
    this.lights = []

    // 清理Three.js环境光
    const ambientLights = this.scene.object3D.children.filter(
      child => child instanceof THREE.AmbientLight
    )
    ambientLights.forEach(light => {
      this.scene!.object3D.remove(light)
    })
  }

  /**
   * 获取当前光照类型
   */
  getCurrentType(): LightingDemoType {
    return this.currentType
  }

  /**
   * 获取光源数量
   */
  getLightCount(): number {
    return this.lights.length
  }

  /**
   * 销毁光照演示
   */
  dispose(): void {
    this.clearLights()
    this.scene = null
    console.log('🧹 光照演示资源已清理')
  }
}

/**
 * 光照演示工厂函数
 */
export function createLightingDemo(scene: Scene): LightingDemo {
  return new LightingDemo(scene)
}

/**
 * 获取所有可用的光照演示类型
 */
export function getAvailableLightingTypes(): LightingDemoType[] {
  return Object.values(LightingDemoType)
}

/**
 * 获取光照类型的显示名称
 */
export function getLightingTypeName(type: LightingDemoType): string {
  const names = {
    [LightingDemoType.BASIC]: '💡 基础光照',
    [LightingDemoType.DYNAMIC]: '🔄 动态光照',
    [LightingDemoType.COLORFUL]: '🌈 彩色光照',
    [LightingDemoType.SUNSET]: '🌅 日落光照',
    [LightingDemoType.NIGHT]: '🌙 夜晚光照'
  }
  return names[type] || type
}
