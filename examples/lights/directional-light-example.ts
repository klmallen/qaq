/**
 * QAQ游戏引擎 - DirectionalLight3D 使用示例
 * 
 * 展示如何创建和配置方向光节点
 */

import { DirectionalLight3D, DirectionalLightConfig } from '../../core/nodes/lights/DirectionalLight3D'
import { ShadowType } from '../../core/nodes/lights/Light3D'
import Node3D from '../../core/nodes/Node3D'
import * as THREE from 'three'

/**
 * 基本方向光示例
 */
export function createBasicDirectionalLight(): DirectionalLight3D {
  // 创建基本方向光
  const sunLight = new DirectionalLight3D('SunLight')
  
  // 设置基本属性
  sunLight.color = 0xffffff        // 白色光
  sunLight.intensity = 1.0         // 标准强度
  sunLight.enabled = true          // 启用光照
  
  // 设置位置和方向
  sunLight.position = { x: 10, y: 10, z: 10 }
  sunLight.target = { x: 0, y: 0, z: 0 }  // 指向原点
  
  return sunLight
}

/**
 * 带阴影的方向光示例
 */
export function createShadowDirectionalLight(): DirectionalLight3D {
  const config: DirectionalLightConfig = {
    color: 0xfff8dc,              // 温暖的白色
    intensity: 1.2,               // 稍强的光照
    castShadow: true,             // 启用阴影
    shadowType: ShadowType.PCF,   // 使用PCF阴影
    shadowMapSize: 2048,          // 高质量阴影映射
    shadowCameraNear: 0.1,        // 阴影相机近平面
    shadowCameraFar: 50,          // 阴影相机远平面
    shadowBias: -0.0005,          // 阴影偏移
    shadowNormalBias: 0.05,       // 法线偏移
    shadowCameraLeft: -20,        // 阴影相机范围
    shadowCameraRight: 20,
    shadowCameraTop: 20,
    shadowCameraBottom: -20,
    target: { x: 0, y: 0, z: 0 }
  }
  
  const shadowLight = new DirectionalLight3D('ShadowSunLight', config)
  
  // 设置光照位置（模拟太阳位置）
  shadowLight.position = { x: 20, y: 30, z: 20 }
  
  return shadowLight
}

/**
 * 动态方向光示例
 */
export function createDynamicDirectionalLight(): DirectionalLight3D {
  const dynamicLight = new DirectionalLight3D('DynamicSunLight')
  
  // 基本配置
  dynamicLight.color = 0xffd700    // 金色
  dynamicLight.intensity = 0.8
  dynamicLight.castShadow = true
  
  // 设置阴影相机为正方形
  dynamicLight.setShadowCameraSize(30)
  
  // 设置初始位置
  dynamicLight.position = { x: 0, y: 20, z: 0 }
  
  return dynamicLight
}

/**
 * 调试方向光示例
 */
export function createDebugDirectionalLight(): DirectionalLight3D {
  const debugLight = new DirectionalLight3D('DebugLight', {
    color: 0x00ff00,
    intensity: 1.0,
    castShadow: true,
    debugVisible: true,  // 显示调试辅助
    shadowCameraLeft: -15,
    shadowCameraRight: 15,
    shadowCameraTop: 15,
    shadowCameraBottom: -15
  })
  
  debugLight.position = { x: 10, y: 15, z: 10 }
  debugLight.target = { x: 0, y: 0, z: 0 }
  
  return debugLight
}

/**
 * 完整场景示例
 */
export class DirectionalLightScene {
  private scene: Node3D
  private sunLight: DirectionalLight3D
  private fillLight: DirectionalLight3D
  
  constructor() {
    this.scene = new Node3D('LightingScene')
    this.setupLights()
  }
  
  private setupLights(): void {
    // 主光源 - 模拟太阳
    this.sunLight = new DirectionalLight3D('SunLight', {
      color: 0xfff8dc,
      intensity: 1.0,
      castShadow: true,
      shadowType: ShadowType.PCF_SOFT,
      shadowMapSize: 2048,
      shadowCameraLeft: -25,
      shadowCameraRight: 25,
      shadowCameraTop: 25,
      shadowCameraBottom: -25
    })
    
    this.sunLight.position = { x: 20, y: 30, z: 20 }
    this.sunLight.target = { x: 0, y: 0, z: 0 }
    
    // 补光 - 模拟天空光
    this.fillLight = new DirectionalLight3D('FillLight', {
      color: 0x87ceeb,  // 天空蓝
      intensity: 0.3,
      castShadow: false
    })
    
    this.fillLight.position = { x: -10, y: 20, z: -10 }
    this.fillLight.target = { x: 0, y: 0, z: 0 }
    
    // 添加到场景
    this.scene.addChild(this.sunLight)
    this.scene.addChild(this.fillLight)
  }
  
  /**
   * 模拟太阳运动
   */
  public animateSun(time: number): void {
    const radius = 30
    const height = 20
    
    // 计算太阳位置
    const x = Math.cos(time * 0.001) * radius
    const z = Math.sin(time * 0.001) * radius
    const y = height + Math.sin(time * 0.0005) * 10
    
    this.sunLight.position = { x, y, z }
    
    // 根据高度调整光照强度和颜色
    const heightFactor = Math.max(0, y / (height + 10))
    this.sunLight.intensity = heightFactor * 1.2
    
    // 日出日落效果
    if (heightFactor < 0.3) {
      this.sunLight.color = 0xff6b35  // 橙红色
    } else if (heightFactor < 0.7) {
      this.sunLight.color = 0xffd700  // 金色
    } else {
      this.sunLight.color = 0xffffff  // 白色
    }
  }
  
  /**
   * 获取场景根节点
   */
  public getScene(): Node3D {
    return this.scene
  }
  
  /**
   * 获取光照统计信息
   */
  public getLightStats(): any {
    return {
      sunLight: this.sunLight.getDirectionalStats(),
      fillLight: this.fillLight.getDirectionalStats()
    }
  }
  
  /**
   * 清理资源
   */
  public destroy(): void {
    this.sunLight.destroy()
    this.fillLight.destroy()
    this.scene.destroy()
  }
}

/**
 * 使用示例
 */
export function runDirectionalLightExample(): void {
  console.log('=== DirectionalLight3D 使用示例 ===')
  
  // 1. 创建基本方向光
  const basicLight = createBasicDirectionalLight()
  console.log('基本方向光创建完成:', basicLight.name)
  
  // 2. 创建带阴影的方向光
  const shadowLight = createShadowDirectionalLight()
  console.log('阴影方向光创建完成:', shadowLight.name)
  
  // 3. 创建动态方向光
  const dynamicLight = createDynamicDirectionalLight()
  console.log('动态方向光创建完成:', dynamicLight.name)
  
  // 4. 演示方向控制
  console.log('\n=== 方向控制示例 ===')
  dynamicLight.setDirectionVector({ x: 1, y: -1, z: 0 })
  console.log('设置方向向量后的目标:', dynamicLight.target)
  console.log('当前方向向量:', dynamicLight.getDirectionVector())
  
  // 5. 演示阴影相机配置
  console.log('\n=== 阴影相机配置示例 ===')
  shadowLight.setShadowCameraBox(-30, 30, 30, -30)
  console.log('阴影相机配置:', shadowLight.getDirectionalStats())
  
  // 6. 创建完整场景
  const lightScene = new DirectionalLightScene()
  console.log('\n=== 完整光照场景创建完成 ===')
  console.log('场景光照统计:', lightScene.getLightStats())
  
  // 清理资源
  basicLight.destroy()
  shadowLight.destroy()
  dynamicLight.destroy()
  lightScene.destroy()
  
  console.log('\n=== 示例运行完成 ===')
}

// 如果直接运行此文件
if (typeof window === 'undefined') {
  runDirectionalLightExample()
}
