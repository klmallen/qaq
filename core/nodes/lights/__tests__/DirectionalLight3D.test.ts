/**
 * QAQ游戏引擎 - DirectionalLight3D 测试文件
 * 
 * 测试DirectionalLight3D类的所有功能
 */

import { DirectionalLight3D, DirectionalLightConfig } from '../DirectionalLight3D'
import { LightType, ShadowType } from '../Light3D'
import * as THREE from 'three'

// Mock Three.js objects for testing
const mockScene = new THREE.Scene()

describe('DirectionalLight3D', () => {
  let directionalLight: DirectionalLight3D

  beforeEach(() => {
    directionalLight = new DirectionalLight3D('TestDirectionalLight')
  })

  afterEach(() => {
    if (directionalLight) {
      directionalLight.destroy()
    }
  })

  describe('构造函数和基本属性', () => {
    test('应该正确创建DirectionalLight3D实例', () => {
      expect(directionalLight).toBeInstanceOf(DirectionalLight3D)
      expect(directionalLight.name).toBe('TestDirectionalLight')
      expect(directionalLight.lightType).toBe(LightType.DIRECTIONAL)
    })

    test('应该使用默认配置', () => {
      expect(directionalLight.shadowCameraLeft).toBe(-10)
      expect(directionalLight.shadowCameraRight).toBe(10)
      expect(directionalLight.shadowCameraTop).toBe(10)
      expect(directionalLight.shadowCameraBottom).toBe(-10)
      expect(directionalLight.target).toEqual({ x: 0, y: 0, z: 0 })
    })

    test('应该接受自定义配置', () => {
      const config: DirectionalLightConfig = {
        color: 0xff0000,
        intensity: 2.0,
        shadowCameraLeft: -20,
        shadowCameraRight: 20,
        target: { x: 1, y: 2, z: 3 }
      }

      const customLight = new DirectionalLight3D('CustomLight', config)
      
      expect(customLight.color).toBe(0xff0000)
      expect(customLight.intensity).toBe(2.0)
      expect(customLight.shadowCameraLeft).toBe(-20)
      expect(customLight.shadowCameraRight).toBe(20)
      expect(customLight.target).toEqual({ x: 1, y: 2, z: 3 })

      customLight.destroy()
    })
  })

  describe('阴影相机属性', () => {
    test('应该正确设置和获取阴影相机边界', () => {
      directionalLight.shadowCameraLeft = -15
      expect(directionalLight.shadowCameraLeft).toBe(-15)

      directionalLight.shadowCameraRight = 15
      expect(directionalLight.shadowCameraRight).toBe(15)

      directionalLight.shadowCameraTop = 15
      expect(directionalLight.shadowCameraTop).toBe(15)

      directionalLight.shadowCameraBottom = -15
      expect(directionalLight.shadowCameraBottom).toBe(-15)
    })

    test('setShadowCameraBox应该正确设置所有边界', () => {
      directionalLight.setShadowCameraBox(-25, 25, 25, -25)
      
      expect(directionalLight.shadowCameraLeft).toBe(-25)
      expect(directionalLight.shadowCameraRight).toBe(25)
      expect(directionalLight.shadowCameraTop).toBe(25)
      expect(directionalLight.shadowCameraBottom).toBe(-25)
    })

    test('setShadowCameraSize应该设置正方形相机', () => {
      directionalLight.setShadowCameraSize(30)
      
      expect(directionalLight.shadowCameraLeft).toBe(-15)
      expect(directionalLight.shadowCameraRight).toBe(15)
      expect(directionalLight.shadowCameraTop).toBe(15)
      expect(directionalLight.shadowCameraBottom).toBe(-15)
    })
  })

  describe('目标和方向控制', () => {
    test('应该正确设置和获取目标位置', () => {
      const target = { x: 5, y: 10, z: -5 }
      directionalLight.target = target
      
      expect(directionalLight.target).toEqual(target)
    })

    test('setDirection应该设置目标位置', () => {
      const target = { x: 1, y: 2, z: 3 }
      directionalLight.setDirection(target)
      
      expect(directionalLight.target).toEqual(target)
    })

    test('setDirectionVector应该根据方向向量设置目标', () => {
      directionalLight.position = { x: 0, y: 0, z: 0 }
      const direction = { x: 1, y: 0, z: -1 }
      
      directionalLight.setDirectionVector(direction)
      
      expect(directionalLight.target).toEqual({ x: 1, y: 0, z: -1 })
    })

    test('getDirectionVector应该返回正确的方向向量', () => {
      directionalLight.position = { x: 0, y: 5, z: 0 }
      directionalLight.target = { x: 1, y: 0, z: -1 }
      
      const direction = directionalLight.getDirectionVector()
      
      expect(direction).toEqual({ x: 1, y: -5, z: -1 })
    })
  })

  describe('Three.js集成', () => {
    test('应该在_ready时创建Three.js对象', () => {
      // 模拟节点进入场景树
      directionalLight._ready()
      
      expect(directionalLight.directionalLight).toBeInstanceOf(THREE.DirectionalLight)
      expect(directionalLight.threeLight).toBeInstanceOf(THREE.DirectionalLight)
    })

    test('Three.js光照对象应该有正确的属性', () => {
      directionalLight.color = 0x00ff00
      directionalLight.intensity = 1.5
      directionalLight._ready()
      
      const threeLight = directionalLight.directionalLight!
      expect(threeLight.color.getHex()).toBe(0x00ff00)
      expect(threeLight.intensity).toBe(1.5)
      expect(threeLight.target).toBeDefined()
    })
  })

  describe('克隆功能', () => {
    test('应该正确克隆DirectionalLight3D', () => {
      directionalLight.color = 0xff0000
      directionalLight.intensity = 2.0
      directionalLight.position = { x: 1, y: 2, z: 3 }
      directionalLight.target = { x: 4, y: 5, z: 6 }
      directionalLight.shadowCameraLeft = -20
      
      const cloned = directionalLight.clone('ClonedLight')
      
      expect(cloned.name).toBe('ClonedLight')
      expect(cloned.color).toBe(0xff0000)
      expect(cloned.intensity).toBe(2.0)
      expect(cloned.position).toEqual({ x: 1, y: 2, z: 3 })
      expect(cloned.target).toEqual({ x: 4, y: 5, z: 6 })
      expect(cloned.shadowCameraLeft).toBe(-20)
      
      cloned.destroy()
    })
  })

  describe('统计信息', () => {
    test('getDirectionalStats应该返回完整的统计信息', () => {
      directionalLight.target = { x: 1, y: 0, z: -1 }
      directionalLight.position = { x: 0, y: 5, z: 0 }
      
      const stats = directionalLight.getDirectionalStats()
      
      expect(stats.shadowCameraLeft).toBe(-10)
      expect(stats.shadowCameraRight).toBe(10)
      expect(stats.shadowCameraTop).toBe(10)
      expect(stats.shadowCameraBottom).toBe(-10)
      expect(stats.target).toEqual({ x: 1, y: 0, z: -1 })
      expect(stats.direction).toEqual({ x: 1, y: -5, z: -1 })
    })
  })

  describe('阴影系统', () => {
    test('应该正确配置阴影', () => {
      directionalLight.castShadow = true
      directionalLight.shadowType = ShadowType.PCF
      directionalLight._ready()
      
      const threeLight = directionalLight.directionalLight!
      expect(threeLight.castShadow).toBe(true)
      expect(threeLight.shadow).toBeDefined()
    })
  })
})
