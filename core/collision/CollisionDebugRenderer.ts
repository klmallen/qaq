/**
 * QAQ游戏引擎 - 碰撞调试渲染器
 * 
 * 功能：为碰撞形状创建线框几何体并管理渲染
 * 特性：GPU加速、材质复用、批量渲染优化
 */

import * as THREE from 'three'
import type { Vector3 } from '../../types/core'

// ============================================================================
// 接口定义
// ============================================================================

export interface WireframeConfig {
  color?: number
  opacity?: number
  lineWidth?: number
}

export interface BoundingBox {
  min: Vector3
  max: Vector3
}

// ============================================================================
// CollisionDebugRenderer 实现
// ============================================================================

export class CollisionDebugRenderer {
  private static _instance: CollisionDebugRenderer | null = null
  
  private _debugScene: THREE.Scene
  private _materials: Map<string, THREE.LineBasicMaterial> = new Map()
  private _wireframes: Map<string, THREE.LineSegments> = new Map()
  private _enabled: boolean = true

  private constructor() {
    this._debugScene = new THREE.Scene()
    this._debugScene.name = 'CollisionDebugScene'
  }

  static getInstance(): CollisionDebugRenderer {
    if (!CollisionDebugRenderer._instance) {
      CollisionDebugRenderer._instance = new CollisionDebugRenderer()
    }
    return CollisionDebugRenderer._instance
  }

  // ========================================================================
  // 几何体创建方法
  // ========================================================================

  createBoxWireframe(size: Vector3, config: WireframeConfig = {}): THREE.LineSegments {
    const geometry = this._createBoxGeometry(size)
    const material = this._getMaterial(config)
    return new THREE.LineSegments(geometry, material)
  }

  createSphereWireframe(radius: number, segments: number = 16, config: WireframeConfig = {}): THREE.LineSegments {
    const geometry = this._createSphereGeometry(radius, segments)
    const material = this._getMaterial(config)
    return new THREE.LineSegments(geometry, material)
  }

  createCapsuleWireframe(radius: number, height: number, config: WireframeConfig = {}): THREE.LineSegments {
    const geometry = this._createCapsuleGeometry(radius, height)
    const material = this._getMaterial(config)
    return new THREE.LineSegments(geometry, material)
  }

  createCylinderWireframe(
    radiusTop: number, 
    radiusBottom: number, 
    height: number, 
    segments: number = 16,
    config: WireframeConfig = {}
  ): THREE.LineSegments {
    const geometry = this._createCylinderGeometry(radiusTop, radiusBottom, height, segments)
    const material = this._getMaterial(config)
    return new THREE.LineSegments(geometry, material)
  }

  createMeshWireframe(meshGeometry: THREE.BufferGeometry, config: WireframeConfig = {}): THREE.LineSegments {
    const geometry = new THREE.EdgesGeometry(meshGeometry)
    const material = this._getMaterial(config)
    return new THREE.LineSegments(geometry, material)
  }

  // ========================================================================
  // 线框管理方法
  // ========================================================================

  addWireframe(id: string, wireframe: THREE.LineSegments): void {
    if (this._wireframes.has(id)) {
      this.removeWireframe(id)
    }
    
    this._wireframes.set(id, wireframe)
    this._debugScene.add(wireframe)
  }

  removeWireframe(id: string): void {
    const wireframe = this._wireframes.get(id)
    if (wireframe) {
      this._debugScene.remove(wireframe)
      wireframe.geometry.dispose()
      this._wireframes.delete(id)
    }
  }

  getWireframe(id: string): THREE.LineSegments | undefined {
    return this._wireframes.get(id)
  }

  updateWireframeTransform(id: string, position: Vector3, rotation: Vector3, scale: Vector3): void {
    const wireframe = this._wireframes.get(id)
    if (wireframe) {
      wireframe.position.set(position.x, position.y, position.z)
      wireframe.rotation.set(rotation.x, rotation.y, rotation.z)
      wireframe.scale.set(scale.x, scale.y, scale.z)
    }
  }

  updateWireframeColor(id: string, color: number): void {
    const wireframe = this._wireframes.get(id)
    if (wireframe && wireframe.material instanceof THREE.LineBasicMaterial) {
      wireframe.material.color.setHex(color)
    }
  }

  updateWireframeOpacity(id: string, opacity: number): void {
    const wireframe = this._wireframes.get(id)
    if (wireframe && wireframe.material instanceof THREE.LineBasicMaterial) {
      wireframe.material.opacity = opacity
      wireframe.material.transparent = opacity < 1.0
    }
  }

  // ========================================================================
  // 全局控制方法
  // ========================================================================

  setEnabled(enabled: boolean): void {
    this._enabled = enabled
    this._debugScene.visible = enabled
  }

  isEnabled(): boolean {
    return this._enabled
  }

  getDebugScene(): THREE.Scene {
    return this._debugScene
  }

  setGlobalOpacity(opacity: number): void {
    this._materials.forEach(material => {
      material.opacity = opacity
      material.transparent = opacity < 1.0
    })
  }

  clear(): void {
    this._wireframes.forEach((wireframe, id) => {
      this.removeWireframe(id)
    })
  }

  getWireframeCount(): number {
    return this._wireframes.size
  }

  // ========================================================================
  // 私有方法 - 几何体创建
  // ========================================================================

  private _createBoxGeometry(size: Vector3): THREE.BufferGeometry {
    const { x, y, z } = size
    const vertices = new Float32Array([
      // 底面
      -x/2, -y/2, -z/2,  x/2, -y/2, -z/2,
       x/2, -y/2, -z/2,  x/2, -y/2,  z/2,
       x/2, -y/2,  z/2, -x/2, -y/2,  z/2,
      -x/2, -y/2,  z/2, -x/2, -y/2, -z/2,
      // 顶面
      -x/2,  y/2, -z/2,  x/2,  y/2, -z/2,
       x/2,  y/2, -z/2,  x/2,  y/2,  z/2,
       x/2,  y/2,  z/2, -x/2,  y/2,  z/2,
      -x/2,  y/2,  z/2, -x/2,  y/2, -z/2,
      // 垂直边
      -x/2, -y/2, -z/2, -x/2,  y/2, -z/2,
       x/2, -y/2, -z/2,  x/2,  y/2, -z/2,
       x/2, -y/2,  z/2,  x/2,  y/2,  z/2,
      -x/2, -y/2,  z/2, -x/2,  y/2,  z/2
    ])
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    return geometry
  }

  private _createSphereGeometry(radius: number, segments: number): THREE.BufferGeometry {
    const vertices: number[] = []
    
    // 经线 (Meridians)
    for (let i = 0; i < segments; i++) {
      const phi = (i / segments) * Math.PI * 2
      for (let j = 0; j < segments; j++) {
        const theta1 = (j / segments) * Math.PI
        const theta2 = ((j + 1) / segments) * Math.PI
        
        vertices.push(
          radius * Math.sin(theta1) * Math.cos(phi),
          radius * Math.cos(theta1),
          radius * Math.sin(theta1) * Math.sin(phi),
          
          radius * Math.sin(theta2) * Math.cos(phi),
          radius * Math.cos(theta2),
          radius * Math.sin(theta2) * Math.sin(phi)
        )
      }
    }
    
    // 纬线 (Parallels)
    for (let j = 1; j < segments; j++) {
      const theta = (j / segments) * Math.PI
      const y = radius * Math.cos(theta)
      const r = radius * Math.sin(theta)
      
      for (let i = 0; i < segments; i++) {
        const phi1 = (i / segments) * Math.PI * 2
        const phi2 = ((i + 1) / segments) * Math.PI * 2
        
        vertices.push(
          r * Math.cos(phi1), y, r * Math.sin(phi1),
          r * Math.cos(phi2), y, r * Math.sin(phi2)
        )
      }
    }
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    return geometry
  }

  private _createCapsuleGeometry(radius: number, height: number): THREE.BufferGeometry {
    const vertices: number[] = []
    const segments = 16
    const halfHeight = height / 2
    
    // 上半球
    for (let i = 0; i < segments; i++) {
      const phi = (i / segments) * Math.PI * 2
      for (let j = 0; j < segments / 2; j++) {
        const theta1 = (j / segments) * Math.PI
        const theta2 = ((j + 1) / segments) * Math.PI
        
        vertices.push(
          radius * Math.sin(theta1) * Math.cos(phi),
          halfHeight + radius * Math.cos(theta1),
          radius * Math.sin(theta1) * Math.sin(phi),
          
          radius * Math.sin(theta2) * Math.cos(phi),
          halfHeight + radius * Math.cos(theta2),
          radius * Math.sin(theta2) * Math.sin(phi)
        )
      }
    }
    
    // 下半球
    for (let i = 0; i < segments; i++) {
      const phi = (i / segments) * Math.PI * 2
      for (let j = segments / 2; j < segments; j++) {
        const theta1 = (j / segments) * Math.PI
        const theta2 = ((j + 1) / segments) * Math.PI
        
        vertices.push(
          radius * Math.sin(theta1) * Math.cos(phi),
          -halfHeight + radius * Math.cos(theta1),
          radius * Math.sin(theta1) * Math.sin(phi),
          
          radius * Math.sin(theta2) * Math.cos(phi),
          -halfHeight + radius * Math.cos(theta2),
          radius * Math.sin(theta2) * Math.sin(phi)
        )
      }
    }
    
    // 圆柱体边缘
    for (let i = 0; i < segments; i++) {
      const phi1 = (i / segments) * Math.PI * 2
      const phi2 = ((i + 1) / segments) * Math.PI * 2
      
      vertices.push(
        radius * Math.cos(phi1), halfHeight, radius * Math.sin(phi1),
        radius * Math.cos(phi2), halfHeight, radius * Math.sin(phi2),
        
        radius * Math.cos(phi1), -halfHeight, radius * Math.sin(phi1),
        radius * Math.cos(phi2), -halfHeight, radius * Math.sin(phi2)
      )
    }
    
    // 垂直线
    for (let i = 0; i < segments; i += 4) {
      const phi = (i / segments) * Math.PI * 2
      vertices.push(
        radius * Math.cos(phi), halfHeight, radius * Math.sin(phi),
        radius * Math.cos(phi), -halfHeight, radius * Math.sin(phi)
      )
    }
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    return geometry
  }

  private _createCylinderGeometry(radiusTop: number, radiusBottom: number, height: number, segments: number): THREE.BufferGeometry {
    const vertices: number[] = []
    const halfHeight = height / 2
    
    // 顶面圆
    for (let i = 0; i < segments; i++) {
      const phi1 = (i / segments) * Math.PI * 2
      const phi2 = ((i + 1) / segments) * Math.PI * 2
      
      vertices.push(
        radiusTop * Math.cos(phi1), halfHeight, radiusTop * Math.sin(phi1),
        radiusTop * Math.cos(phi2), halfHeight, radiusTop * Math.sin(phi2)
      )
    }
    
    // 底面圆
    for (let i = 0; i < segments; i++) {
      const phi1 = (i / segments) * Math.PI * 2
      const phi2 = ((i + 1) / segments) * Math.PI * 2
      
      vertices.push(
        radiusBottom * Math.cos(phi1), -halfHeight, radiusBottom * Math.sin(phi1),
        radiusBottom * Math.cos(phi2), -halfHeight, radiusBottom * Math.sin(phi2)
      )
    }
    
    // 垂直边
    for (let i = 0; i < segments; i += 2) {
      const phi = (i / segments) * Math.PI * 2
      vertices.push(
        radiusTop * Math.cos(phi), halfHeight, radiusTop * Math.sin(phi),
        radiusBottom * Math.cos(phi), -halfHeight, radiusBottom * Math.sin(phi)
      )
    }
    
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    return geometry
  }

  private _getMaterial(config: WireframeConfig): THREE.LineBasicMaterial {
    const color = config.color ?? 0x00ff00
    const opacity = config.opacity ?? 1.0
    const key = `${color.toString(16)}_${opacity.toFixed(2)}`
    
    if (!this._materials.has(key)) {
      const material = new THREE.LineBasicMaterial({
        color: color,
        opacity: opacity,
        transparent: opacity < 1.0,
        depthTest: true,
        depthWrite: false
      })
      this._materials.set(key, material)
    }
    
    return this._materials.get(key)!
  }

  // ========================================================================
  // 清理方法
  // ========================================================================

  dispose(): void {
    this.clear()
    this._materials.forEach(material => material.dispose())
    this._materials.clear()
    CollisionDebugRenderer._instance = null
  }
}

export default CollisionDebugRenderer
