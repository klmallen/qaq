/**
 * QAQ游戏引擎 - 碰撞调试系统演示
 * 
 * 演示内容：
 * - CollisionDebugRenderer 基础功能
 * - CollisionShape3D 调试可视化
 * - 实时调试控制
 */

import * as THREE from 'three'
import CollisionDebugRenderer from './CollisionDebugRenderer'
import DebugMaterialManager from './DebugMaterialManager'
import CollisionShape3D from '../nodes/physics/CollisionShape3D'
import { CollisionShapeType } from '../physics/PhysicsServer'
import type { Vector3 } from '../../types/core'

// ============================================================================
// 演示场景设置
// ============================================================================

export class CollisionDebugDemo {
  private _scene: THREE.Scene
  private _camera: THREE.PerspectiveCamera
  private _renderer: THREE.WebGLRenderer
  private _debugRenderer: CollisionDebugRenderer
  private _materialManager: DebugMaterialManager
  
  private _shapes: CollisionShape3D[] = []
  private _animationId: number = 0

  constructor(container: HTMLElement) {
    // 初始化Three.js场景
    this._scene = new THREE.Scene()
    this._scene.background = new THREE.Color(0x222222)

    // 设置相机
    this._camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000)
    this._camera.position.set(0, 5, 10)
    this._camera.lookAt(0, 0, 0)

    // 设置渲染器
    this._renderer = new THREE.WebGLRenderer({ antialias: true })
    this._renderer.setSize(container.clientWidth, container.clientHeight)
    this._renderer.shadowMap.enabled = true
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(this._renderer.domElement)

    // 初始化调试系统
    this._debugRenderer = CollisionDebugRenderer.getInstance()
    this._materialManager = DebugMaterialManager.getInstance()

    // 添加调试场景到主场景
    this._scene.add(this._debugRenderer.getDebugScene())

    this._setupLighting()
    this._createDemoShapes()
    this._startAnimation()

    console.log('🎮 碰撞调试演示初始化完成')
  }

  // ========================================================================
  // 场景设置
  // ========================================================================

  private _setupLighting(): void {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    this._scene.add(ambientLight)

    // 方向光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    this._scene.add(directionalLight)
  }

  private _createDemoShapes(): void {
    // 创建不同类型的碰撞形状进行演示
    
    // 盒子形状
    const boxShape = new CollisionShape3D('BoxShape', {
      type: CollisionShapeType.BOX,
      parameters: { size: { x: 2, y: 2, z: 2 } },
      enabled: true,
      debugVisible: false,
      debugColor: DebugMaterialManager.COLORS.RIGID_BODY
    })
    boxShape.position = { x: -4, y: 0, z: 0 }
    boxShape.setDebugEnabled(true)
    boxShape.setDebugColor(DebugMaterialManager.COLORS.RIGID_BODY)
    this._shapes.push(boxShape)

    // 球体形状
    const sphereShape = new CollisionShape3D('SphereShape', {
      type: CollisionShapeType.SPHERE,
      parameters: { radius: 1.5 },
      enabled: true,
      debugVisible: false,
      debugColor: DebugMaterialManager.COLORS.AREA
    })
    sphereShape.position = { x: 0, y: 0, z: 0 }
    sphereShape.setDebugEnabled(true)
    sphereShape.setDebugColor(DebugMaterialManager.COLORS.AREA)
    this._shapes.push(sphereShape)

    // 胶囊形状
    const capsuleShape = new CollisionShape3D('CapsuleShape', {
      type: CollisionShapeType.CAPSULE,
      parameters: { radius: 0.8, height: 3 },
      enabled: true,
      debugVisible: false,
      debugColor: DebugMaterialManager.COLORS.CHARACTER_BODY
    })
    capsuleShape.position = { x: 4, y: 0, z: 0 }
    capsuleShape.setDebugEnabled(true)
    capsuleShape.setDebugColor(DebugMaterialManager.COLORS.CHARACTER_BODY)
    this._shapes.push(capsuleShape)

    // 圆柱形状
    const cylinderShape = new CollisionShape3D('CylinderShape', {
      type: CollisionShapeType.CYLINDER,
      parameters: { radiusTop: 1, radiusBottom: 1.2, height: 2.5 },
      enabled: true,
      debugVisible: false,
      debugColor: DebugMaterialManager.COLORS.STATIC_BODY
    })
    cylinderShape.position = { x: 0, y: 0, z: 4 }
    cylinderShape.setDebugEnabled(true)
    cylinderShape.setDebugColor(DebugMaterialManager.COLORS.STATIC_BODY)
    this._shapes.push(cylinderShape)

    console.log(`✅ 创建了 ${this._shapes.length} 个演示碰撞形状`)
  }

  // ========================================================================
  // 动画和渲染
  // ========================================================================

  private _startAnimation(): void {
    const animate = () => {
      this._animationId = requestAnimationFrame(animate)
      this._updateShapes()
      this._render()
    }
    animate()
  }

  private _updateShapes(): void {
    const time = Date.now() * 0.001

    // 旋转和移动形状以演示调试线框的实时更新
    this._shapes.forEach((shape, index) => {
      const offset = index * Math.PI * 0.5
      
      // 旋转
      shape.rotation = {
        x: Math.sin(time + offset) * 0.3,
        y: time + offset,
        z: Math.cos(time + offset) * 0.2
      }
      
      // 轻微的上下移动
      const baseY = shape.position.y
      shape.position = {
        ...shape.position,
        y: baseY + Math.sin(time * 2 + offset) * 0.5
      }
    })
  }

  private _render(): void {
    this._renderer.render(this._scene, this._camera)
  }

  // ========================================================================
  // 公共控制方法
  // ========================================================================

  toggleDebugVisibility(): void {
    const enabled = !this._debugRenderer.isEnabled()
    this._debugRenderer.setEnabled(enabled)
    console.log(`🔍 调试可视化: ${enabled ? '开启' : '关闭'}`)
  }

  setGlobalOpacity(opacity: number): void {
    this._debugRenderer.setGlobalOpacity(opacity)
    console.log(`🎨 全局透明度设置为: ${opacity}`)
  }

  changeShapeColors(): void {
    const colors = [
      DebugMaterialManager.COLORS.RIGID_BODY,
      DebugMaterialManager.COLORS.AREA,
      DebugMaterialManager.COLORS.CHARACTER_BODY,
      DebugMaterialManager.COLORS.STATIC_BODY,
      DebugMaterialManager.COLORS.COLLISION
    ]

    this._shapes.forEach((shape, index) => {
      const colorIndex = (index + 1) % colors.length
      shape.setDebugColor(colors[colorIndex])
    })
    
    console.log('🌈 形状颜色已更换')
  }

  getStats(): any {
    return {
      debugRenderer: {
        enabled: this._debugRenderer.isEnabled(),
        wireframeCount: this._debugRenderer.getWireframeCount()
      },
      materialManager: this._materialManager.getStats(),
      shapes: this._shapes.length
    }
  }

  // ========================================================================
  // 清理方法
  // ========================================================================

  dispose(): void {
    if (this._animationId) {
      cancelAnimationFrame(this._animationId)
    }

    this._shapes.forEach(shape => shape.destroy())
    this._shapes.length = 0

    this._debugRenderer.clear()
    this._renderer.dispose()
    
    console.log('🧹 碰撞调试演示已清理')
  }
}

// ============================================================================
// 全局演示控制
// ============================================================================

let demoInstance: CollisionDebugDemo | null = null

export function startCollisionDebugDemo(container: HTMLElement): CollisionDebugDemo {
  if (demoInstance) {
    demoInstance.dispose()
  }
  
  demoInstance = new CollisionDebugDemo(container)
  return demoInstance
}

export function stopCollisionDebugDemo(): void {
  if (demoInstance) {
    demoInstance.dispose()
    demoInstance = null
  }
}

// 导出到全局以便在控制台中使用
if (typeof window !== 'undefined') {
  (window as any).startCollisionDebugDemo = startCollisionDebugDemo
  (window as any).stopCollisionDebugDemo = stopCollisionDebugDemo
  
  // 添加控制方法到全局
  (window as any).toggleCollisionDebug = () => demoInstance?.toggleDebugVisibility()
  (window as any).setCollisionOpacity = (opacity: number) => demoInstance?.setGlobalOpacity(opacity)
  (window as any).changeCollisionColors = () => demoInstance?.changeShapeColors()
  (window as any).getCollisionStats = () => demoInstance?.getStats()
  
  console.log('💡 碰撞调试演示控制方法已添加到全局:')
  console.log('  - startCollisionDebugDemo(container)')
  console.log('  - stopCollisionDebugDemo()')
  console.log('  - toggleCollisionDebug()')
  console.log('  - setCollisionOpacity(0.5)')
  console.log('  - changeCollisionColors()')
  console.log('  - getCollisionStats()')
}
