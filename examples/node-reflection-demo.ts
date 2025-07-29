/**
 * QAQ游戏引擎 - Node反射序列化演示
 * 
 * 展示如何使用Node基类的反射序列化能力，实现零配置的场景序列化
 */

import { Scene, Node3D, MeshInstance3D, Camera3D, DirectionalLight3D, AnimationPlayer } from '../core/index'
import NodeReflectionSerializer from '../core/editor/NodeReflectionSerializer'
import EditorSystem from '../core/editor/EditorSystem'

// ============================================================================
// Node反射序列化演示类
// ============================================================================

export class NodeReflectionDemo {
  private serializer: NodeReflectionSerializer
  private editorSystem: EditorSystem
  private demoScene: Scene | null = null

  constructor() {
    this.serializer = new NodeReflectionSerializer()
    this.editorSystem = new EditorSystem({
      autoSaveInterval: 0, // 禁用自动保存，方便演示
      enableStateTracking: true
    })

    this.setupEventListeners()
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听编辑器事件
    this.editorSystem.connect('scene_created', (scene: Scene) => {
      console.log('🎬 场景创建事件:', scene.name)
    })

    this.editorSystem.connect('scene_saved', (path: string, scene: Scene) => {
      console.log('💾 场景保存事件:', path, scene.name)
    })
  }

  /**
   * 演示1: 创建复杂场景并测试反射序列化
   */
  async demonstrateComplexSceneSerialization(): Promise<void> {
    console.log('\n🎬 === 演示1: 复杂场景反射序列化 ===')

    // 创建复杂场景
    const scene = new Scene('ComplexReflectionScene')
    
    // 添加根节点
    const root = new Node3D('Root')
    root.position = { x: 0, y: 0, z: 0 }
    scene.addChild(root)

    // 添加相机
    const camera = new Camera3D('MainCamera')
    camera.position = { x: 5, y: 5, z: 5 }
    camera.fov = 75
    camera.near = 0.1
    camera.far = 1000
    camera.clearColor = { r: 0.2, g: 0.3, b: 0.4, a: 1.0 }
    camera.makeCurrent()
    root.addChild(camera)

    // 添加方向光
    const sunLight = new DirectionalLight3D('SunLight')
    sunLight.position = { x: 10, y: 10, z: 5 }
    sunLight.intensity = 1.2
    sunLight.color = { r: 1.0, g: 0.95, b: 0.8 }
    sunLight.castShadow = true
    sunLight.shadowMapSize = 2048
    root.addChild(sunLight)

    // 添加角色
    const character = new MeshInstance3D('Character')
    character.position = { x: 0, y: 0, z: 0 }
    character.scale = { x: 0.01, y: 0.01, z: 0.01 }
    character.castShadow = true
    character.receiveShadow = true
    character.materialType = 'standard'
    root.addChild(character)

    // 添加动画播放器
    const animationPlayer = new AnimationPlayer('CharacterAnimator')
    animationPlayer.setProperty('autoplay', 'idle')
    animationPlayer.setProperty('speed', 1.0)
    animationPlayer.setGlobalTransitionTime(0.3)
    animationPlayer.setIntelligentTransitionsEnabled(true)
    character.addChild(animationPlayer)

    // 添加环境对象
    const environment = new Node3D('Environment')
    environment.position = { x: 0, y: -1, z: 0 }
    root.addChild(environment)

    const ground = new MeshInstance3D('Ground')
    ground.position = { x: 0, y: 0, z: 0 }
    ground.scale = { x: 10, y: 1, z: 10 }
    ground.receiveShadow = true
    environment.addChild(ground)

    this.demoScene = scene

    try {
      console.log('📊 场景创建完成，开始分析...')
      
      // 分析场景结构
      const stats = this.serializer.getSerializationStats(scene)
      console.log('场景统计:', stats)

      // 序列化测试
      console.log('📦 开始反射序列化...')
      const startTime = performance.now()
      const serialized = await this.serializer.serialize(scene)
      const serializeTime = performance.now() - startTime

      console.log(`✅ 序列化完成 (${serializeTime.toFixed(2)}ms)`)
      console.log('序列化数据大小:', JSON.stringify(serialized).length, '字节')

      // 反序列化测试
      console.log('🔄 开始反射反序列化...')
      const deserializeStartTime = performance.now()
      const restored = await this.serializer.deserialize(serialized)
      const deserializeTime = performance.now() - deserializeStartTime

      console.log(`✅ 反序列化完成 (${deserializeTime.toFixed(2)}ms)`)

      // 验证完整性
      await this.validateSceneIntegrity(scene, restored)

    } catch (error) {
      console.error('❌ 复杂场景序列化演示失败:', error)
    }
  }

  /**
   * 演示2: 与编辑器系统集成
   */
  async demonstrateEditorIntegration(): Promise<void> {
    console.log('\n🎨 === 演示2: 编辑器系统集成 ===')

    if (!this.demoScene) {
      console.log('需要先运行演示1创建场景')
      return
    }

    try {
      // 使用编辑器系统创建场景
      const createResult = await this.editorSystem.createNewScene('EditorIntegrationScene')
      if (!createResult.success) {
        console.error('创建场景失败:', createResult.message)
        return
      }

      const editorScene = createResult.data as Scene

      // 复制演示场景的内容到编辑器场景
      for (const child of this.demoScene.children) {
        // 使用反射序列化来复制节点
        const childData = child.serialize()
        const copiedChild = child.constructor.deserialize ? 
          (child.constructor as any).deserialize(childData) : 
          child.constructor.prototype.constructor.deserialize(childData)
        
        editorScene.addChild(copiedChild)
      }

      console.log('✅ 场景内容复制完成')

      // 保存场景
      const saveResult = await this.editorSystem.saveScene('./demo-scenes/editor-integration.json')
      console.log('保存结果:', saveResult.message)

      // 测试模式切换
      console.log('🔄 测试编辑器/播放模式切换...')
      
      const playResult = await this.editorSystem.enterPlayMode()
      console.log('进入播放模式:', playResult.message)
      
      await this.sleep(1000)
      
      const editorResult = await this.editorSystem.enterEditorMode()
      console.log('返回编辑器模式:', editorResult.message)

    } catch (error) {
      console.error('❌ 编辑器集成演示失败:', error)
    }
  }

  /**
   * 演示3: 性能基准测试
   */
  async demonstratePerformanceBenchmark(): Promise<void> {
    console.log('\n⚡ === 演示3: 性能基准测试 ===')

    // 创建大量节点进行性能测试
    const scene = new Scene('PerformanceTestScene')
    const nodeCount = 100

    console.log(`创建 ${nodeCount} 个节点进行性能测试...`)

    for (let i = 0; i < nodeCount; i++) {
      const node = new Node3D(`Node_${i}`)
      node.position = { x: Math.random() * 10, y: Math.random() * 10, z: Math.random() * 10 }
      node.rotation = { x: Math.random(), y: Math.random(), z: Math.random() }
      node.scale = { x: 1 + Math.random(), y: 1 + Math.random(), z: 1 + Math.random() }
      node.visible = Math.random() > 0.5
      
      scene.addChild(node)

      // 每10个节点添加一个子节点
      if (i % 10 === 0) {
        const child = new MeshInstance3D(`Child_${i}`)
        child.castShadow = true
        child.receiveShadow = Math.random() > 0.5
        node.addChild(child)
      }
    }

    try {
      // 序列化性能测试
      console.log('📦 序列化性能测试...')
      const serializeStart = performance.now()
      const serialized = await this.serializer.serialize(scene)
      const serializeTime = performance.now() - serializeStart

      const dataSize = JSON.stringify(serialized).length
      console.log(`序列化: ${serializeTime.toFixed(2)}ms, 数据大小: ${(dataSize / 1024).toFixed(2)}KB`)

      // 反序列化性能测试
      console.log('🔄 反序列化性能测试...')
      const deserializeStart = performance.now()
      const restored = await this.serializer.deserialize(serialized)
      const deserializeTime = performance.now() - deserializeStart

      console.log(`反序列化: ${deserializeTime.toFixed(2)}ms`)

      // 验证节点数量
      const originalNodeCount = this.countNodes(scene)
      const restoredNodeCount = this.countNodes(restored)

      console.log(`节点数量验证: 原始${originalNodeCount}, 恢复${restoredNodeCount}`)

      if (originalNodeCount === restoredNodeCount) {
        console.log('✅ 性能测试通过')
      } else {
        console.warn('⚠️ 节点数量不匹配')
      }

      // 性能统计
      console.log('📊 性能统计:')
      console.log(`- 平均序列化时间/节点: ${(serializeTime / originalNodeCount).toFixed(3)}ms`)
      console.log(`- 平均反序列化时间/节点: ${(deserializeTime / restoredNodeCount).toFixed(3)}ms`)
      console.log(`- 数据压缩比: ${(dataSize / (originalNodeCount * 100)).toFixed(2)} 字节/节点`)

    } catch (error) {
      console.error('❌ 性能基准测试失败:', error)
    }
  }

  /**
   * 验证场景完整性
   */
  private async validateSceneIntegrity(original: Scene, restored: Scene): Promise<void> {
    console.log('🔍 验证场景完整性...')

    const issues: string[] = []

    // 基本验证
    if (original.name !== restored.name) {
      issues.push(`场景名称不匹配: ${original.name} vs ${restored.name}`)
    }

    if (original.children.length !== restored.children.length) {
      issues.push(`子节点数量不匹配: ${original.children.length} vs ${restored.children.length}`)
    }

    // 详细节点验证
    const originalCamera = original.findChild('MainCamera') as Camera3D
    const restoredCamera = restored.findChild('MainCamera') as Camera3D

    if (originalCamera && restoredCamera) {
      if (Math.abs(originalCamera.fov - restoredCamera.fov) > 0.001) {
        issues.push(`相机FOV不匹配: ${originalCamera.fov} vs ${restoredCamera.fov}`)
      }
    } else {
      issues.push('相机节点缺失')
    }

    const originalLight = original.findChild('SunLight') as DirectionalLight3D
    const restoredLight = restored.findChild('SunLight') as DirectionalLight3D

    if (originalLight && restoredLight) {
      if (Math.abs(originalLight.intensity - restoredLight.intensity) > 0.001) {
        issues.push(`光源强度不匹配: ${originalLight.intensity} vs ${restoredLight.intensity}`)
      }
    } else {
      issues.push('光源节点缺失')
    }

    // 输出验证结果
    if (issues.length === 0) {
      console.log('✅ 场景完整性验证通过')
    } else {
      console.warn('⚠️ 发现完整性问题:')
      issues.forEach(issue => console.warn(`  - ${issue}`))
    }
  }

  /**
   * 计算节点数量
   */
  private countNodes(node: Scene): number {
    let count = 1
    for (const child of node.children) {
      count += this.countNodes(child as Scene)
    }
    return count
  }

  /**
   * 运行完整演示
   */
  async runFullDemo(): Promise<void> {
    console.log('🚀 开始Node反射序列化完整演示...\n')

    try {
      await this.demonstrateComplexSceneSerialization()
      await this.sleep(1000)

      await this.demonstrateEditorIntegration()
      await this.sleep(1000)

      await this.demonstratePerformanceBenchmark()

      console.log('\n🎉 Node反射序列化演示完成！')
      console.log('🎯 主要特点:')
      console.log('  ✅ 零配置 - 无需手动注册属性')
      console.log('  ✅ 自动发现 - 自动识别所有可序列化属性')
      console.log('  ✅ 类型推断 - 智能推断属性类型')
      console.log('  ✅ 完整性保证 - 确保序列化/反序列化的一致性')
      console.log('  ✅ 性能优秀 - 适合生产环境使用')

    } catch (error) {
      console.error('❌ 演示过程中发生错误:', error)
    }
  }

  /**
   * 工具方法：等待指定时间
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 清理资源
   */
  destroy(): void {
    this.editorSystem.destroy()
    console.log('🧹 演示资源已清理')
  }
}

// ============================================================================
// 使用示例
// ============================================================================

/**
 * 在浏览器控制台中运行Node反射序列化演示
 */
export async function runNodeReflectionDemo(): Promise<void> {
  const demo = new NodeReflectionDemo()
  
  try {
    await demo.runFullDemo()
  } finally {
    // 清理资源
    setTimeout(() => {
      demo.destroy()
    }, 5000) // 5秒后清理
  }
}

// 导出到全局，方便在控制台中调用
if (typeof window !== 'undefined') {
  (window as any).runNodeReflectionDemo = runNodeReflectionDemo
  (window as any).NodeReflectionDemo = NodeReflectionDemo
  console.log('💡 在控制台中运行 window.runNodeReflectionDemo() 来开始Node反射序列化演示')
}

export default NodeReflectionDemo
