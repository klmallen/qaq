// ============================================================================
// QAQ Engine - 粒子形状管理器 (Particle Shape Manager)
// 管理粒子发射形状的计算和生成
// ============================================================================

import * as THREE from 'three'

/**
 * 发射形状枚举
 */
export enum EmissionShape {
  POINT = 'point',
  SPHERE = 'sphere',
  HEMISPHERE = 'hemisphere',
  BOX = 'box',
  CYLINDER = 'cylinder',
  CONE = 'cone',
  RING = 'ring',
  DISC = 'disc',
  EDGE_RING = 'edge_ring',
  CUSTOM_MESH = 'custom_mesh'
}

/**
 * 形状参数接口
 */
export interface ShapeParameters {
  // 通用参数
  radius?: number
  height?: number
  size?: THREE.Vector3
  
  // 圆锥参数
  angle?: number
  
  // 环形参数
  innerRadius?: number
  outerRadius?: number
  
  // 自定义网格
  customMesh?: THREE.Mesh
  
  // 发射方向模式
  directionMode?: 'outward' | 'inward' | 'random' | 'custom'
  customDirection?: THREE.Vector3
}

/**
 * 粒子位置和方向数据
 */
export interface ParticleSpawnData {
  position: THREE.Vector3
  direction: THREE.Vector3
  normal: THREE.Vector3
}

/**
 * 粒子形状管理器
 * 
 * 负责计算各种发射形状的粒子生成位置和方向
 */
export class ParticleShapeManager {
  private static instance: ParticleShapeManager
  private tempVector3 = new THREE.Vector3()
  private tempVector3_2 = new THREE.Vector3()

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): ParticleShapeManager {
    if (!ParticleShapeManager.instance) {
      ParticleShapeManager.instance = new ParticleShapeManager()
    }
    return ParticleShapeManager.instance
  }

  /**
   * 生成粒子发射数据
   */
  public generateSpawnData(shape: EmissionShape, params: ShapeParameters = {}): ParticleSpawnData {
    const spawnData: ParticleSpawnData = {
      position: new THREE.Vector3(),
      direction: new THREE.Vector3(),
      normal: new THREE.Vector3()
    }

    switch (shape) {
      case EmissionShape.POINT:
        this.generatePointSpawn(spawnData, params)
        break
        
      case EmissionShape.SPHERE:
        this.generateSphereSpawn(spawnData, params)
        break
        
      case EmissionShape.HEMISPHERE:
        this.generateHemisphereSpawn(spawnData, params)
        break
        
      case EmissionShape.BOX:
        this.generateBoxSpawn(spawnData, params)
        break
        
      case EmissionShape.CYLINDER:
        this.generateCylinderSpawn(spawnData, params)
        break
        
      case EmissionShape.CONE:
        this.generateConeSpawn(spawnData, params)
        break
        
      case EmissionShape.RING:
        this.generateRingSpawn(spawnData, params)
        break
        
      case EmissionShape.DISC:
        this.generateDiscSpawn(spawnData, params)
        break
        
      case EmissionShape.EDGE_RING:
        this.generateEdgeRingSpawn(spawnData, params)
        break
        
      case EmissionShape.CUSTOM_MESH:
        this.generateCustomMeshSpawn(spawnData, params)
        break
        
      default:
        this.generatePointSpawn(spawnData, params)
    }

    // 应用方向模式
    this.applyDirectionMode(spawnData, params)

    return spawnData
  }

  /**
   * 点发射
   */
  private generatePointSpawn(spawnData: ParticleSpawnData, params: ShapeParameters): void {
    spawnData.position.set(0, 0, 0)
    spawnData.direction.set(0, 1, 0)
    spawnData.normal.set(0, 1, 0)
  }

  /**
   * 球体发射
   */
  private generateSphereSpawn(spawnData: ParticleSpawnData, params: ShapeParameters): void {
    const radius = params.radius || 1.0
    
    // 均匀分布在球体内部
    const u = Math.random()
    const v = Math.random()
    const w = Math.random()
    
    const theta = 2 * Math.PI * u
    const phi = Math.acos(2 * v - 1)
    const r = radius * Math.cbrt(w)
    
    spawnData.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    )
    
    // 方向指向球心外
    spawnData.direction.copy(spawnData.position).normalize()
    spawnData.normal.copy(spawnData.direction)
  }

  /**
   * 半球发射
   */
  private generateHemisphereSpawn(spawnData: ParticleSpawnData, params: ShapeParameters): void {
    const radius = params.radius || 1.0
    
    const u = Math.random()
    const v = Math.random()
    const w = Math.random()
    
    const theta = 2 * Math.PI * u
    const phi = Math.acos(v) // 只取上半球
    const r = radius * Math.cbrt(w)
    
    spawnData.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    )
    
    spawnData.direction.copy(spawnData.position).normalize()
    spawnData.normal.copy(spawnData.direction)
  }

  /**
   * 立方体发射
   */
  private generateBoxSpawn(spawnData: ParticleSpawnData, params: ShapeParameters): void {
    const size = params.size || new THREE.Vector3(1, 1, 1)
    
    spawnData.position.set(
      (Math.random() - 0.5) * size.x,
      (Math.random() - 0.5) * size.y,
      (Math.random() - 0.5) * size.z
    )
    
    // 随机方向
    const theta = Math.random() * 2 * Math.PI
    const phi = Math.acos(2 * Math.random() - 1)
    
    spawnData.direction.set(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta)
    )
    
    spawnData.normal.copy(spawnData.direction)
  }

  /**
   * 圆柱体发射
   */
  private generateCylinderSpawn(spawnData: ParticleSpawnData, params: ShapeParameters): void {
    const radius = params.radius || 1.0
    const height = params.height || 2.0
    
    const theta = Math.random() * 2 * Math.PI
    const r = Math.sqrt(Math.random()) * radius
    const y = (Math.random() - 0.5) * height
    
    spawnData.position.set(
      r * Math.cos(theta),
      y,
      r * Math.sin(theta)
    )
    
    // 径向方向
    spawnData.direction.set(Math.cos(theta), 0, Math.sin(theta))
    spawnData.normal.copy(spawnData.direction)
  }

  /**
   * 圆锥发射
   */
  private generateConeSpawn(spawnData: ParticleSpawnData, params: ShapeParameters): void {
    const radius = params.radius || 1.0
    const height = params.height || 2.0
    const angle = params.angle || Math.PI / 6 // 30度
    
    const theta = Math.random() * 2 * Math.PI
    const h = Math.random() * height
    const r = (radius * h / height) * Math.sqrt(Math.random())
    
    spawnData.position.set(
      r * Math.cos(theta),
      h,
      r * Math.sin(theta)
    )
    
    // 圆锥表面法向量
    const coneAngle = Math.atan(radius / height)
    spawnData.direction.set(
      Math.cos(theta) * Math.sin(coneAngle),
      Math.cos(coneAngle),
      Math.sin(theta) * Math.sin(coneAngle)
    )
    
    spawnData.normal.copy(spawnData.direction)
  }

  /**
   * 环形发射
   */
  private generateRingSpawn(spawnData: ParticleSpawnData, params: ShapeParameters): void {
    const innerRadius = params.innerRadius || 0.5
    const outerRadius = params.outerRadius || 1.0
    
    const theta = Math.random() * 2 * Math.PI
    const r = Math.sqrt(Math.random() * (outerRadius * outerRadius - innerRadius * innerRadius) + innerRadius * innerRadius)
    
    spawnData.position.set(
      r * Math.cos(theta),
      0,
      r * Math.sin(theta)
    )
    
    spawnData.direction.set(0, 1, 0)
    spawnData.normal.set(0, 1, 0)
  }

  /**
   * 圆盘发射
   */
  private generateDiscSpawn(spawnData: ParticleSpawnData, params: ShapeParameters): void {
    const radius = params.radius || 1.0
    
    const theta = Math.random() * 2 * Math.PI
    const r = Math.sqrt(Math.random()) * radius
    
    spawnData.position.set(
      r * Math.cos(theta),
      0,
      r * Math.sin(theta)
    )
    
    spawnData.direction.set(0, 1, 0)
    spawnData.normal.set(0, 1, 0)
  }

  /**
   * 环形边缘发射
   */
  private generateEdgeRingSpawn(spawnData: ParticleSpawnData, params: ShapeParameters): void {
    const radius = params.radius || 1.0
    
    const theta = Math.random() * 2 * Math.PI
    
    spawnData.position.set(
      radius * Math.cos(theta),
      0,
      radius * Math.sin(theta)
    )
    
    // 径向向外
    spawnData.direction.set(Math.cos(theta), 0, Math.sin(theta))
    spawnData.normal.copy(spawnData.direction)
  }

  /**
   * 自定义网格发射
   */
  private generateCustomMeshSpawn(spawnData: ParticleSpawnData, params: ShapeParameters): void {
    if (!params.customMesh) {
      this.generatePointSpawn(spawnData, params)
      return
    }

    const mesh = params.customMesh
    const geometry = mesh.geometry
    
    if (!geometry.attributes.position) {
      this.generatePointSpawn(spawnData, params)
      return
    }

    // 随机选择一个三角形面
    const positionAttribute = geometry.attributes.position
    const triangleCount = positionAttribute.count / 3
    const triangleIndex = Math.floor(Math.random() * triangleCount) * 3
    
    // 获取三角形顶点
    const v1 = new THREE.Vector3().fromBufferAttribute(positionAttribute, triangleIndex)
    const v2 = new THREE.Vector3().fromBufferAttribute(positionAttribute, triangleIndex + 1)
    const v3 = new THREE.Vector3().fromBufferAttribute(positionAttribute, triangleIndex + 2)
    
    // 在三角形内随机采样
    const r1 = Math.random()
    const r2 = Math.random()
    
    if (r1 + r2 > 1) {
      // 确保在三角形内
      const temp = 1 - r1
      const r1_new = 1 - r2
      const r2_new = temp
    }
    
    spawnData.position.copy(v1)
      .multiplyScalar(1 - r1 - r2)
      .addScaledVector(v2, r1)
      .addScaledVector(v3, r2)
    
    // 计算法向量
    this.tempVector3.subVectors(v2, v1)
    this.tempVector3_2.subVectors(v3, v1)
    spawnData.normal.crossVectors(this.tempVector3, this.tempVector3_2).normalize()
    
    spawnData.direction.copy(spawnData.normal)
  }

  /**
   * 应用方向模式
   */
  private applyDirectionMode(spawnData: ParticleSpawnData, params: ShapeParameters): void {
    switch (params.directionMode) {
      case 'outward':
        // 已经在各个形状函数中处理
        break
        
      case 'inward':
        spawnData.direction.negate()
        break
        
      case 'random':
        const theta = Math.random() * 2 * Math.PI
        const phi = Math.acos(2 * Math.random() - 1)
        spawnData.direction.set(
          Math.sin(phi) * Math.cos(theta),
          Math.cos(phi),
          Math.sin(phi) * Math.sin(theta)
        )
        break
        
      case 'custom':
        if (params.customDirection) {
          spawnData.direction.copy(params.customDirection).normalize()
        }
        break
    }
  }

  /**
   * 获取形状的包围盒
   */
  public getShapeBounds(shape: EmissionShape, params: ShapeParameters = {}): THREE.Box3 {
    const bounds = new THREE.Box3()
    
    switch (shape) {
      case EmissionShape.POINT:
        bounds.setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(0, 0, 0))
        break
        
      case EmissionShape.SPHERE:
      case EmissionShape.HEMISPHERE:
        const radius = params.radius || 1.0
        const size = radius * 2
        bounds.setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(size, size, size))
        break
        
      case EmissionShape.BOX:
        const boxSize = params.size || new THREE.Vector3(1, 1, 1)
        bounds.setFromCenterAndSize(new THREE.Vector3(), boxSize)
        break
        
      case EmissionShape.CYLINDER:
        const cylRadius = params.radius || 1.0
        const cylHeight = params.height || 2.0
        bounds.setFromCenterAndSize(
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(cylRadius * 2, cylHeight, cylRadius * 2)
        )
        break
        
      case EmissionShape.CONE:
        const coneRadius = params.radius || 1.0
        const coneHeight = params.height || 2.0
        bounds.setFromCenterAndSize(
          new THREE.Vector3(0, coneHeight / 2, 0),
          new THREE.Vector3(coneRadius * 2, coneHeight, coneRadius * 2)
        )
        break
        
      case EmissionShape.RING:
      case EmissionShape.DISC:
      case EmissionShape.EDGE_RING:
        const ringRadius = params.outerRadius || params.radius || 1.0
        bounds.setFromCenterAndSize(
          new THREE.Vector3(),
          new THREE.Vector3(ringRadius * 2, 0, ringRadius * 2)
        )
        break
        
      case EmissionShape.CUSTOM_MESH:
        if (params.customMesh) {
          params.customMesh.geometry.computeBoundingBox()
          if (params.customMesh.geometry.boundingBox) {
            bounds.copy(params.customMesh.geometry.boundingBox)
          }
        }
        break
        
      default:
        bounds.setFromCenterAndSize(new THREE.Vector3(), new THREE.Vector3(1, 1, 1))
    }
    
    return bounds
  }

  /**
   * 验证形状参数
   */
  public validateShapeParameters(shape: EmissionShape, params: ShapeParameters): boolean {
    switch (shape) {
      case EmissionShape.SPHERE:
      case EmissionShape.HEMISPHERE:
        return (params.radius || 1.0) > 0
        
      case EmissionShape.BOX:
        const size = params.size || new THREE.Vector3(1, 1, 1)
        return size.x > 0 && size.y > 0 && size.z > 0
        
      case EmissionShape.CYLINDER:
      case EmissionShape.CONE:
        return (params.radius || 1.0) > 0 && (params.height || 2.0) > 0
        
      case EmissionShape.RING:
        const inner = params.innerRadius || 0.5
        const outer = params.outerRadius || 1.0
        return inner >= 0 && outer > inner
        
      case EmissionShape.CUSTOM_MESH:
        return params.customMesh !== undefined && params.customMesh.geometry !== undefined
        
      default:
        return true
    }
  }
}
