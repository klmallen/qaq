// ============================================================================
// QAQ Engine - 物理系统演示模块 (Physics System Demo Module)
// ============================================================================

import { Scene } from '~/core/scene/Scene'
import MeshInstance3D from '~/core/nodes/MeshInstance3D'
import * as THREE from 'three'

/**
 * 物理演示管理器
 */
export class PhysicsDemo {
  private scene: Scene | null = null
  private cannonDebugger: any = null
  private debuggerEnabled: boolean = true
  private physicsObjects: MeshInstance3D[] = []

  // 物理模块引用
  private RigidBody3D: any = null
  private StaticBody3D: any = null
  private RigidBodyMode: any = null
  private CollisionShapeType: any = null

  constructor(scene: Scene) {
    this.scene = scene
  }

  /**
   * 初始化物理系统
   */
  async initialize(): Promise<void> {
    console.log('🔧 初始化物理演示系统...')

    try {
      // 加载物理模块
      await this.loadPhysicsModules()
      
      // 初始化调试器
      await this.initializeDebugger()
      
      // 创建基础物理对象
      this.createBasicPhysicsObjects()
      
      console.log('✅ 物理演示系统初始化完成')
    } catch (error) {
      console.error('❌ 物理演示系统初始化失败:', error)
    }
  }

  /**
   * 加载物理系统模块
   */
  private async loadPhysicsModules(): Promise<void> {
    try {
      // 暂时禁用物理模块加载，因为路径问题
      console.warn('⚠️ 物理模块暂时禁用，需要修复导入路径')

      // TODO: 修复物理模块导入路径
      // const physicsModule = await import('~/core/nodes/physics/RigidBody3D')
      // this.RigidBody3D = physicsModule.RigidBody3D
      // this.StaticBody3D = physicsModule.StaticBody3D
      // this.RigidBodyMode = physicsModule.RigidBodyMode
      // this.CollisionShapeType = physicsModule.CollisionShapeType

      console.log('✅ 物理模块加载完成（暂时禁用）')
    } catch (error) {
      console.error('❌ 物理模块加载失败:', error)
      throw error
    }
  }

  /**
   * 初始化CANNON调试器
   */
  private async initializeDebugger(): Promise<void> {
    if (!this.scene) return

    try {
      const PhysicsServer = (await import('~/core/physics/PhysicsServer')).default
      const world = PhysicsServer.getInstance()._world
      
      if (!world) {
        console.warn('⚠️ 物理世界未初始化，跳过调试器设置')
        return
      }

      const CannonDebugger = (await import('cannon-es-debugger')).default

      // 创建调试器实例
      this.cannonDebugger = new CannonDebugger(this.scene.object3D, world, {
        color: 0x00ff00,        // 绿色线框
        scale: 1.0,             // 缩放比例
        onInit: (body: any, mesh: any) => {
          // 调试网格初始化回调
          mesh.material.wireframe = true
          mesh.material.transparent = true
          mesh.material.opacity = 0.5
        }
      })

      console.log('✅ CANNON调试器初始化成功')
    } catch (error) {
      console.error('❌ CANNON调试器初始化失败:', error)
    }
  }

  /**
   * 创建基础物理对象
   */
  private createBasicPhysicsObjects(): void {
    if (!this.scene || !this.RigidBody3D || !this.StaticBody3D) return

    try {
      // 创建地面（静态物体）
      const ground = this.createGround()
      if (ground) {
        this.scene.addChild(ground)
        this.physicsObjects.push(ground)
      }

      // 创建动态立方体
      const dynamicCube = this.createDynamicCube()
      if (dynamicCube) {
        this.scene.addChild(dynamicCube)
        this.physicsObjects.push(dynamicCube)
      }

      console.log('✅ 基础物理对象创建完成')
    } catch (error) {
      console.error('❌ 创建基础物理对象失败:', error)
    }
  }

  /**
   * 创建地面
   */
  private createGround(): MeshInstance3D | null {
    try {
      const ground = new MeshInstance3D()
      ground.name = 'Ground'
      
      // 设置几何体和材质
      const geometry = new THREE.BoxGeometry(20, 0.5, 20)
      const material = new THREE.MeshLambertMaterial({ 
        color: 0x404040,
        transparent: true,
        opacity: 0.8
      })
      ground.setMesh(geometry, material)
      
      // 设置位置
      ground.position.y = -2
      
      // 添加静态物理体
      const staticBody = new this.StaticBody3D()
      staticBody.setCollisionShape(this.CollisionShapeType.BOX, { 
        size: new THREE.Vector3(10, 0.25, 10) 
      })
      ground.addChild(staticBody)
      
      return ground
    } catch (error) {
      console.error('❌ 创建地面失败:', error)
      return null
    }
  }

  /**
   * 创建动态立方体
   */
  private createDynamicCube(): MeshInstance3D | null {
    try {
      const cube = new MeshInstance3D()
      cube.name = 'DynamicCube'
      
      // 设置几何体和材质
      const geometry = new THREE.BoxGeometry(1, 1, 1)
      const material = new THREE.MeshLambertMaterial({ 
        color: 0xff6b35,
        transparent: true,
        opacity: 0.9
      })
      cube.setMesh(geometry, material)
      
      // 设置初始位置
      cube.position.set(0, 5, 0)
      
      // 添加刚体物理
      const rigidBody = new this.RigidBody3D()
      rigidBody.setMode(this.RigidBodyMode.DYNAMIC)
      rigidBody.setCollisionShape(this.CollisionShapeType.BOX, { 
        size: new THREE.Vector3(0.5, 0.5, 0.5) 
      })
      rigidBody.setMass(1.0)
      cube.addChild(rigidBody)
      
      return cube
    } catch (error) {
      console.error('❌ 创建动态立方体失败:', error)
      return null
    }
  }

  /**
   * 添加随机掉落的立方体
   */
  addFallingCube(): void {
    if (!this.scene || !this.RigidBody3D) return

    try {
      const cube = new MeshInstance3D()
      cube.name = `FallingCube_${Date.now()}`
      
      // 随机颜色
      const colors = [0xff6b35, 0x4ecdc4, 0x45b7d1, 0xf9ca24, 0xf0932b, 0xeb4d4b]
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      
      const geometry = new THREE.BoxGeometry(
        0.5 + Math.random() * 0.5,  // 随机大小
        0.5 + Math.random() * 0.5,
        0.5 + Math.random() * 0.5
      )
      const material = new THREE.MeshLambertMaterial({ 
        color: randomColor,
        transparent: true,
        opacity: 0.9
      })
      cube.setMesh(geometry, material)
      
      // 随机位置
      cube.position.set(
        (Math.random() - 0.5) * 8,  // x: -4 到 4
        8 + Math.random() * 3,      // y: 8 到 11
        (Math.random() - 0.5) * 8   // z: -4 到 4
      )
      
      // 添加物理体
      const rigidBody = new this.RigidBody3D()
      rigidBody.setMode(this.RigidBodyMode.DYNAMIC)
      rigidBody.setCollisionShape(this.CollisionShapeType.BOX, { 
        size: new THREE.Vector3(
          geometry.parameters.width / 2,
          geometry.parameters.height / 2,
          geometry.parameters.depth / 2
        )
      })
      rigidBody.setMass(0.5 + Math.random() * 1.0) // 随机质量
      cube.addChild(rigidBody)
      
      this.scene.addChild(cube)
      this.physicsObjects.push(cube)
      
      console.log('📦 添加了一个掉落立方体')
      
      // 5秒后自动清理
      setTimeout(() => {
        this.removePhysicsObject(cube)
      }, 5000)
      
    } catch (error) {
      console.error('❌ 添加掉落立方体失败:', error)
    }
  }

  /**
   * 移除物理对象
   */
  private removePhysicsObject(object: MeshInstance3D): void {
    if (this.scene && this.physicsObjects.includes(object)) {
      this.scene.removeChild(object)
      const index = this.physicsObjects.indexOf(object)
      if (index > -1) {
        this.physicsObjects.splice(index, 1)
      }
      object.destroy()
    }
  }

  /**
   * 清理所有动态物理对象
   */
  clearDynamicObjects(): void {
    const dynamicObjects = this.physicsObjects.filter(obj => 
      obj.name.startsWith('FallingCube_') || obj.name === 'DynamicCube'
    )
    
    dynamicObjects.forEach(obj => {
      this.removePhysicsObject(obj)
    })
    
    console.log('🧹 已清理所有动态物理对象')
  }

  /**
   * 切换物理调试器显示
   */
  toggleDebugger(): void {
    if (this.cannonDebugger) {
      this.debuggerEnabled = !this.debuggerEnabled
      this.cannonDebugger.enabled = this.debuggerEnabled
      console.log(`🔧 物理调试器: ${this.debuggerEnabled ? '开启' : '关闭'}`)
    }
  }

  /**
   * 更新物理演示
   */
  update(): void {
    // 更新调试器
    if (this.cannonDebugger && this.debuggerEnabled) {
      this.cannonDebugger.update()
    }
  }

  /**
   * 获取物理对象数量
   */
  getPhysicsObjectCount(): number {
    return this.physicsObjects.length
  }

  /**
   * 是否启用调试器
   */
  isDebuggerEnabled(): boolean {
    return this.debuggerEnabled
  }

  /**
   * 销毁物理演示
   */
  dispose(): void {
    // 清理所有物理对象
    this.physicsObjects.forEach(obj => {
      if (this.scene) {
        this.scene.removeChild(obj)
      }
      obj.destroy()
    })
    this.physicsObjects = []
    
    // 清理调试器
    this.cannonDebugger = null
    
    this.scene = null
    console.log('🧹 物理演示资源已清理')
  }
}

/**
 * 物理演示工厂函数
 */
export function createPhysicsDemo(scene: Scene): PhysicsDemo {
  return new PhysicsDemo(scene)
}
