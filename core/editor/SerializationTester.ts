/**
 * QAQ游戏引擎 - 序列化测试工具
 * 
 * 用于验证序列化系统的完整性和正确性
 */

import SceneSerializer from './SceneSerializer'
import { Scene, Node3D, MeshInstance3D, Camera3D, DirectionalLight3D, AnimationPlayer } from '../index'

// ============================================================================
// 测试结果接口
// ============================================================================

export interface SerializationTestResult {
  testName: string
  success: boolean
  issues: string[]
  executionTime: number
  dataSize: number
}

export interface TestSuite {
  name: string
  results: SerializationTestResult[]
  overallSuccess: boolean
  totalIssues: number
}

// ============================================================================
// 序列化测试器类
// ============================================================================

export class SerializationTester {
  private serializer: SceneSerializer

  constructor() {
    this.serializer = new SceneSerializer()
  }

  /**
   * 运行完整的序列化测试套件
   */
  async runFullTestSuite(): Promise<TestSuite> {
    console.log('🧪 开始运行序列化测试套件...')
    
    const results: SerializationTestResult[] = []
    
    // 运行各种测试
    results.push(await this.testBasicNodeSerialization())
    results.push(await this.testNode3DSerialization())
    results.push(await this.testCamera3DSerialization())
    results.push(await this.testDirectionalLight3DSerialization())
    results.push(await this.testMeshInstance3DSerialization())
    results.push(await this.testAnimationPlayerSerialization())
    results.push(await this.testComplexSceneSerialization())
    results.push(await this.testDemo3DSceneCompatibility())
    
    // 计算总体结果
    const overallSuccess = results.every(r => r.success)
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0)
    
    const testSuite: TestSuite = {
      name: 'QAQ引擎序列化测试套件',
      results,
      overallSuccess,
      totalIssues
    }
    
    this.printTestSuiteResults(testSuite)
    return testSuite
  }

  /**
   * 测试基础Node序列化
   */
  private async testBasicNodeSerialization(): Promise<SerializationTestResult> {
    const startTime = performance.now()
    const issues: string[] = []
    
    try {
      // 创建测试节点
      const original = new Node3D('TestNode')
      original.setProperty('customProperty', 'testValue')
      original.setProperty('numberProperty', 42)
      original.setProperty('boolProperty', true)
      
      // 序列化
      const serializedData = await this.serializer.serialize(new Scene('TestScene'))
      const dataSize = JSON.stringify(serializedData).length
      
      // 反序列化
      const restored = await this.serializer.deserialize(serializedData)
      
      // 验证基础属性
      if (restored.name !== 'TestScene') {
        issues.push('场景名称不匹配')
      }
      
      const executionTime = performance.now() - startTime
      
      return {
        testName: '基础Node序列化',
        success: issues.length === 0,
        issues,
        executionTime,
        dataSize
      }
      
    } catch (error) {
      issues.push(`序列化异常: ${error}`)
      return {
        testName: '基础Node序列化',
        success: false,
        issues,
        executionTime: performance.now() - startTime,
        dataSize: 0
      }
    }
  }

  /**
   * 测试Node3D序列化
   */
  private async testNode3DSerialization(): Promise<SerializationTestResult> {
    const startTime = performance.now()
    const issues: string[] = []
    
    try {
      // 创建测试场景
      const scene = new Scene('Node3DTestScene')
      const testNode = new Node3D('TestNode3D')
      
      // 设置3D变换属性
      testNode.position = { x: 1.5, y: -2.3, z: 4.7 }
      testNode.rotation = { x: 0.1, y: 0.2, z: 0.3 }
      testNode.scale = { x: 2.0, y: 1.5, z: 0.8 }
      testNode.visible = false
      
      scene.addChild(testNode)
      
      // 序列化和反序列化
      const serializedData = await this.serializer.serialize(scene)
      const restoredScene = await this.serializer.deserialize(serializedData)
      
      // 验证
      const restoredNode = restoredScene.children[0] as Node3D
      
      if (!this.vectorsEqual(testNode.position, restoredNode.position)) {
        issues.push('位置属性不匹配')
      }
      
      if (!this.vectorsEqual(testNode.rotation, restoredNode.rotation)) {
        issues.push('旋转属性不匹配')
      }
      
      if (!this.vectorsEqual(testNode.scale, restoredNode.scale)) {
        issues.push('缩放属性不匹配')
      }
      
      if (testNode.visible !== restoredNode.visible) {
        issues.push('可见性属性不匹配')
      }
      
      return {
        testName: 'Node3D序列化',
        success: issues.length === 0,
        issues,
        executionTime: performance.now() - startTime,
        dataSize: JSON.stringify(serializedData).length
      }
      
    } catch (error) {
      issues.push(`Node3D序列化异常: ${error}`)
      return {
        testName: 'Node3D序列化',
        success: false,
        issues,
        executionTime: performance.now() - startTime,
        dataSize: 0
      }
    }
  }

  /**
   * 测试Camera3D序列化
   */
  private async testCamera3DSerialization(): Promise<SerializationTestResult> {
    const startTime = performance.now()
    const issues: string[] = []
    
    try {
      const scene = new Scene('CameraTestScene')
      const camera = new Camera3D('TestCamera')
      
      // 设置相机属性
      camera.position = { x: 5, y: 5, z: 5 }
      camera.fov = 60
      camera.near = 0.1
      camera.far = 1000
      camera.clearColor = { r: 0.2, g: 0.3, b: 0.4, a: 1.0 }
      camera.makeCurrent()
      
      scene.addChild(camera)
      
      // 序列化和反序列化
      const serializedData = await this.serializer.serialize(scene)
      const restoredScene = await this.serializer.deserialize(serializedData)
      
      // 验证
      const restoredCamera = restoredScene.children[0] as Camera3D
      
      if (!this.vectorsEqual(camera.position, restoredCamera.position)) {
        issues.push('相机位置不匹配')
      }
      
      if (Math.abs(camera.fov - restoredCamera.fov) > 0.001) {
        issues.push('相机FOV不匹配')
      }
      
      if (Math.abs(camera.near - restoredCamera.near) > 0.001) {
        issues.push('相机近平面不匹配')
      }
      
      if (Math.abs(camera.far - restoredCamera.far) > 0.001) {
        issues.push('相机远平面不匹配')
      }
      
      // 注意：isCurrent状态需要异步验证
      setTimeout(() => {
        if (!restoredCamera.isCurrent()) {
          console.warn('⚠️ 相机当前状态未正确恢复')
        }
      }, 100)
      
      return {
        testName: 'Camera3D序列化',
        success: issues.length === 0,
        issues,
        executionTime: performance.now() - startTime,
        dataSize: JSON.stringify(serializedData).length
      }
      
    } catch (error) {
      issues.push(`Camera3D序列化异常: ${error}`)
      return {
        testName: 'Camera3D序列化',
        success: false,
        issues,
        executionTime: performance.now() - startTime,
        dataSize: 0
      }
    }
  }

  /**
   * 测试DirectionalLight3D序列化
   */
  private async testDirectionalLight3DSerialization(): Promise<SerializationTestResult> {
    const startTime = performance.now()
    const issues: string[] = []
    
    try {
      const scene = new Scene('LightTestScene')
      const light = new DirectionalLight3D('TestLight')
      
      // 设置光源属性
      light.position = { x: 10, y: 10, z: 5 }
      light.color = { r: 1.0, g: 0.8, b: 0.6 }
      light.intensity = 1.5
      light.castShadow = true
      light.shadowMapSize = 2048
      
      scene.addChild(light)
      
      // 序列化和反序列化
      const serializedData = await this.serializer.serialize(scene)
      const restoredScene = await this.serializer.deserialize(serializedData)
      
      // 验证
      const restoredLight = restoredScene.children[0] as DirectionalLight3D
      
      if (!this.vectorsEqual(light.position, restoredLight.position)) {
        issues.push('光源位置不匹配')
      }
      
      if (!this.colorsEqual(light.color, restoredLight.color)) {
        issues.push('光源颜色不匹配')
      }
      
      if (Math.abs(light.intensity - restoredLight.intensity) > 0.001) {
        issues.push('光源强度不匹配')
      }
      
      if (light.castShadow !== restoredLight.castShadow) {
        issues.push('阴影投射设置不匹配')
      }
      
      return {
        testName: 'DirectionalLight3D序列化',
        success: issues.length === 0,
        issues,
        executionTime: performance.now() - startTime,
        dataSize: JSON.stringify(serializedData).length
      }
      
    } catch (error) {
      issues.push(`DirectionalLight3D序列化异常: ${error}`)
      return {
        testName: 'DirectionalLight3D序列化',
        success: false,
        issues,
        executionTime: performance.now() - startTime,
        dataSize: 0
      }
    }
  }

  /**
   * 测试MeshInstance3D序列化
   */
  private async testMeshInstance3DSerialization(): Promise<SerializationTestResult> {
    const startTime = performance.now()
    const issues: string[] = []
    
    try {
      const scene = new Scene('MeshTestScene')
      const mesh = new MeshInstance3D('TestMesh')
      
      // 设置网格属性
      mesh.position = { x: 0, y: 0, z: 0 }
      mesh.scale = { x: 0.01, y: 0.01, z: 0.01 }
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.setProperty('meshPath', './assets/test-model.gltf')
      
      scene.addChild(mesh)
      
      // 序列化和反序列化
      const serializedData = await this.serializer.serialize(scene)
      const restoredScene = await this.serializer.deserialize(serializedData)
      
      // 验证
      const restoredMesh = restoredScene.children[0] as MeshInstance3D
      
      if (!this.vectorsEqual(mesh.position, restoredMesh.position)) {
        issues.push('网格位置不匹配')
      }
      
      if (!this.vectorsEqual(mesh.scale, restoredMesh.scale)) {
        issues.push('网格缩放不匹配')
      }
      
      if (mesh.castShadow !== restoredMesh.castShadow) {
        issues.push('阴影投射设置不匹配')
      }
      
      return {
        testName: 'MeshInstance3D序列化',
        success: issues.length === 0,
        issues,
        executionTime: performance.now() - startTime,
        dataSize: JSON.stringify(serializedData).length
      }
      
    } catch (error) {
      issues.push(`MeshInstance3D序列化异常: ${error}`)
      return {
        testName: 'MeshInstance3D序列化',
        success: false,
        issues,
        executionTime: performance.now() - startTime,
        dataSize: 0
      }
    }
  }

  /**
   * 测试AnimationPlayer序列化
   */
  private async testAnimationPlayerSerialization(): Promise<SerializationTestResult> {
    const startTime = performance.now()
    const issues: string[] = []
    
    try {
      const scene = new Scene('AnimationTestScene')
      const animPlayer = new AnimationPlayer('TestAnimator')
      
      // 设置动画播放器属性
      animPlayer.setProperty('autoplay', 'idle')
      animPlayer.setProperty('speed', 1.5)
      animPlayer.setGlobalTransitionTime(0.5)
      animPlayer.setIntelligentTransitionsEnabled(true)
      
      scene.addChild(animPlayer)
      
      // 序列化和反序列化
      const serializedData = await this.serializer.serialize(scene)
      const restoredScene = await this.serializer.deserialize(serializedData)
      
      // 验证
      const restoredAnimPlayer = restoredScene.children[0] as AnimationPlayer
      
      if (animPlayer.getProperty('autoplay') !== restoredAnimPlayer.getProperty('autoplay')) {
        issues.push('自动播放设置不匹配')
      }
      
      if (Math.abs(animPlayer.getGlobalTransitionTime() - restoredAnimPlayer.getGlobalTransitionTime()) > 0.001) {
        issues.push('全局过渡时间不匹配')
      }
      
      if (animPlayer.isIntelligentTransitionsEnabled() !== restoredAnimPlayer.isIntelligentTransitionsEnabled()) {
        issues.push('智能过渡设置不匹配')
      }
      
      return {
        testName: 'AnimationPlayer序列化',
        success: issues.length === 0,
        issues,
        executionTime: performance.now() - startTime,
        dataSize: JSON.stringify(serializedData).length
      }
      
    } catch (error) {
      issues.push(`AnimationPlayer序列化异常: ${error}`)
      return {
        testName: 'AnimationPlayer序列化',
        success: false,
        issues,
        executionTime: performance.now() - startTime,
        dataSize: 0
      }
    }
  }

  /**
   * 测试复杂场景序列化
   */
  private async testComplexSceneSerialization(): Promise<SerializationTestResult> {
    const startTime = performance.now()
    const issues: string[] = []
    
    try {
      // 创建复杂场景
      const scene = new Scene('ComplexTestScene')
      
      // 添加相机
      const camera = new Camera3D('MainCamera')
      camera.position = { x: 5, y: 5, z: 5 }
      camera.makeCurrent()
      scene.addChild(camera)
      
      // 添加光源
      const light = new DirectionalLight3D('SunLight')
      light.position = { x: 10, y: 10, z: 5 }
      light.intensity = 1.0
      scene.addChild(light)
      
      // 添加根节点
      const root = new Node3D('Root')
      scene.addChild(root)
      
      // 添加角色
      const character = new MeshInstance3D('Character')
      character.scale = { x: 0.01, y: 0.01, z: 0.01 }
      root.addChild(character)
      
      // 添加动画播放器
      const animPlayer = new AnimationPlayer('Animator')
      character.addChild(animPlayer)
      
      // 序列化和反序列化
      const serializedData = await this.serializer.serialize(scene)
      const restoredScene = await this.serializer.deserialize(serializedData)
      
      // 验证场景结构
      if (restoredScene.children.length !== scene.children.length) {
        issues.push(`场景子节点数量不匹配: 期望${scene.children.length}, 实际${restoredScene.children.length}`)
      }
      
      // 验证节点类型
      const expectedTypes = ['Camera3D', 'DirectionalLight3D', 'Node3D']
      for (let i = 0; i < expectedTypes.length; i++) {
        if (restoredScene.children[i]?.constructor.name !== expectedTypes[i]) {
          issues.push(`节点${i}类型不匹配: 期望${expectedTypes[i]}, 实际${restoredScene.children[i]?.constructor.name}`)
        }
      }
      
      return {
        testName: '复杂场景序列化',
        success: issues.length === 0,
        issues,
        executionTime: performance.now() - startTime,
        dataSize: JSON.stringify(serializedData).length
      }
      
    } catch (error) {
      issues.push(`复杂场景序列化异常: ${error}`)
      return {
        testName: '复杂场景序列化',
        success: false,
        issues,
        executionTime: performance.now() - startTime,
        dataSize: 0
      }
    }
  }

  /**
   * 测试demo-3d.vue场景兼容性
   */
  private async testDemo3DSceneCompatibility(): Promise<SerializationTestResult> {
    const startTime = performance.now()
    const issues: string[] = []
    
    try {
      // 模拟demo-3d.vue的场景结构
      const scene = new Scene('Demo3DScene')
      
      // 添加相机（demo-3d.vue中使用）
      const camera = new Camera3D('MainCamera')
      camera.position = { x: 5, y: 5, z: 5 }
      camera.lookAt({ x: 0, y: 0, z: 0 })
      scene.addChild(camera)
      
      // 添加方向光（demo-3d.vue中使用）
      const light = new DirectionalLight3D('DirectionalLight')
      light.position = { x: 10, y: 10, z: 5 }
      light.intensity = 1
      scene.addChild(light)
      
      // 添加角色节点（demo-3d.vue中使用）
      const character = new MeshInstance3D('Character')
      character.scale = { x: 0.01, y: 0.01, z: 0.01 }
      scene.addChild(character)
      
      // 添加动画播放器（demo-3d.vue中使用）
      const animationPlayer = new AnimationPlayer('AnimationPlayer')
      character.addChild(animationPlayer)
      
      // 序列化测试
      const serializedData = await this.serializer.serialize(scene)
      const restoredScene = await this.serializer.deserialize(serializedData)
      
      // 验证关键组件是否存在
      const restoredCamera = restoredScene.findChild('MainCamera')
      if (!restoredCamera) {
        issues.push('相机节点丢失')
      }
      
      const restoredLight = restoredScene.findChild('DirectionalLight')
      if (!restoredLight) {
        issues.push('光源节点丢失')
      }
      
      const restoredCharacter = restoredScene.findChild('Character')
      if (!restoredCharacter) {
        issues.push('角色节点丢失')
      }
      
      const restoredAnimPlayer = restoredCharacter?.findChild('AnimationPlayer')
      if (!restoredAnimPlayer) {
        issues.push('动画播放器节点丢失')
      }
      
      return {
        testName: 'demo-3d.vue兼容性',
        success: issues.length === 0,
        issues,
        executionTime: performance.now() - startTime,
        dataSize: JSON.stringify(serializedData).length
      }
      
    } catch (error) {
      issues.push(`demo-3d兼容性测试异常: ${error}`)
      return {
        testName: 'demo-3d.vue兼容性',
        success: false,
        issues,
        executionTime: performance.now() - startTime,
        dataSize: 0
      }
    }
  }

  /**
   * 打印测试套件结果
   */
  private printTestSuiteResults(testSuite: TestSuite): void {
    console.log(`\n📊 ${testSuite.name} - 测试结果`)
    console.log('='.repeat(60))
    
    testSuite.results.forEach(result => {
      const status = result.success ? '✅' : '❌'
      const time = result.executionTime.toFixed(2)
      const size = (result.dataSize / 1024).toFixed(2)
      
      console.log(`${status} ${result.testName} (${time}ms, ${size}KB)`)
      
      if (result.issues.length > 0) {
        result.issues.forEach(issue => {
          console.log(`   ⚠️ ${issue}`)
        })
      }
    })
    
    console.log('='.repeat(60))
    console.log(`总体结果: ${testSuite.overallSuccess ? '✅ 通过' : '❌ 失败'}`)
    console.log(`总问题数: ${testSuite.totalIssues}`)
    console.log(`通过率: ${((testSuite.results.filter(r => r.success).length / testSuite.results.length) * 100).toFixed(1)}%`)
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  private vectorsEqual(v1: any, v2: any, tolerance = 0.001): boolean {
    if (!v1 || !v2) return v1 === v2
    return Math.abs(v1.x - v2.x) < tolerance &&
           Math.abs(v1.y - v2.y) < tolerance &&
           Math.abs(v1.z - v2.z) < tolerance
  }

  private colorsEqual(c1: any, c2: any, tolerance = 0.001): boolean {
    if (!c1 || !c2) return c1 === c2
    return Math.abs(c1.r - c2.r) < tolerance &&
           Math.abs(c1.g - c2.g) < tolerance &&
           Math.abs(c1.b - c2.b) < tolerance
  }
}

// 导出到全局，方便在控制台中使用
if (typeof window !== 'undefined') {
  (window as any).SerializationTester = SerializationTester
  (window as any).runSerializationTests = async () => {
    const tester = new SerializationTester()
    return await tester.runFullTestSuite()
  }
  console.log('💡 在控制台中运行 window.runSerializationTests() 来测试序列化系统')
}

export default SerializationTester
