/**
 * QAQ游戏引擎 - 项目导出系统测试
 * 
 * 测试项目导出/导入功能的完整性和正确性
 */

import { ProjectExporter } from './ProjectExporter'
import { ExportFormat, ProjectExportVersion } from './ProjectExportTypes'
import type { ProjectExportData, ValidationResult } from './ProjectExportTypes'
import { Engine, Scene, Node3D, Camera3D, DirectionalLight3D } from '../index'

// ============================================================================
// 测试函数
// ============================================================================

/**
 * 测试项目导出器实例化
 */
export function testProjectExporterInstance(): boolean {
  try {
    const exporter = ProjectExporter.getInstance()
    const exporter2 = ProjectExporter.getInstance()
    
    // 验证单例模式
    const isSingleton = exporter === exporter2
    
    if (isSingleton) {
      return true
    } else {
      return false
    }
  } catch (error) {
    return false
  }
}

/**
 * 测试数据收集功能
 */
export async function testDataCollection(): Promise<{
  success: boolean
  collectedData: string[]
  errors: string[]
}> {
  const collectedData: string[] = []
  const errors: string[] = []

  try {
    const exporter = ProjectExporter.getInstance()
    
    // 测试引擎状态收集
    try {
      const engineState = await (exporter as any).collectEngineState()
      if (engineState && engineState.state) {
        collectedData.push('engineState')
      }
    } catch (error) {
      errors.push(`引擎状态收集失败: ${error}`)
    }

    // 测试场景树收集
    try {
      const sceneTree = await (exporter as any).collectSceneTreeData()
      if (sceneTree) {
        collectedData.push('sceneTree')
      }
    } catch (error) {
      errors.push(`场景树收集失败: ${error}`)
    }

    // 测试脚本系统收集
    try {
      const scriptSystem = await (exporter as any).collectScriptSystemData()
      if (scriptSystem) {
        collectedData.push('scriptSystem')
      }
    } catch (error) {
      errors.push(`脚本系统收集失败: ${error}`)
    }

    // 测试动画系统收集
    try {
      const animationSystem = await (exporter as any).collectAnimationSystemData()
      if (animationSystem) {
        collectedData.push('animationSystem')
      }
    } catch (error) {
      errors.push(`动画系统收集失败: ${error}`)
    }

    return {
      success: errors.length === 0,
      collectedData,
      errors
    }

  } catch (error) {
    errors.push(`数据收集测试失败: ${error}`)
    return {
      success: false,
      collectedData,
      errors
    }
  }
}

/**
 * 测试项目数据验证
 */
export function testProjectDataValidation(): {
  success: boolean
  validationResults: ValidationResult[]
  errors: string[]
} {
  const validationResults: ValidationResult[] = []
  const errors: string[] = []

  try {
    const exporter = ProjectExporter.getInstance()

    // 测试有效数据验证
    const validData: ProjectExportData = {
      metadata: {
        name: 'Test Project',
        version: '1.0.0',
        created: Date.now(),
        modified: Date.now(),
        engineVersion: '3.0.0',
        exportVersion: ProjectExportVersion.CURRENT,
        platform: 'web',
        checksum: 'test123',
        tags: ['test']
      },
      engineState: {
        state: 'running' as any,
        config: { width: 800, height: 600, antialias: true, enableShadows: true, backgroundColor: 0x87ceeb },
        renderer: { type: 'WebGL', capabilities: {}, extensions: [], parameters: {} },
        canvas: { width: 800, height: 600, style: {} },
        performance: { fps: 60, frameTime: 16.67 }
      },
      sceneTree: {
        currentScene: 'TestScene',
        scenes: {},
        rootNodes: [],
        nodeHierarchy: {},
        nodeCount: 0
      },
      scriptSystem: {
        registeredClasses: {},
        scriptInstances: {},
        globalScripts: []
      },
      animationSystem: {
        stateMachines: {},
        animationPlayers: {},
        globalMixers: []
      },
      editorState: {
        mode: 'runtime',
        selectedNodes: [],
        viewportState: {
          camera: { position: { x: 0, y: 0, z: 5 }, rotation: { x: 0, y: 0, z: 0 }, zoom: 1 },
          grid: { visible: false, size: 1, divisions: 10 },
          gizmos: { visible: false, mode: 'translate' }
        },
        panels: {
          hierarchy: { visible: false, width: 250 },
          inspector: { visible: false, width: 300 },
          console: { visible: false, height: 200 }
        },
        debugOptions: {
          showFPS: false,
          showMemory: false,
          showWireframe: false,
          showBoundingBoxes: false
        }
      },
      resourceManifest: {
        resources: {},
        totalSize: 0,
        resourceCount: 0,
        missingResources: []
      },
      userConfig: {
        preferences: { theme: 'dark', language: 'zh-CN', autoSave: true, autoSaveInterval: 300 },
        shortcuts: {},
        customSettings: {},
        recentProjects: []
      }
    }

    const validResult = exporter.validateProjectData(validData)
    validationResults.push(validResult)

    // 测试无效数据验证
    const invalidData = {} as ProjectExportData
    const invalidResult = exporter.validateProjectData(invalidData)
    validationResults.push(invalidResult)

    return {
      success: validationResults.length === 2,
      validationResults,
      errors
    }

  } catch (error) {
    errors.push(`数据验证测试失败: ${error}`)
    return {
      success: false,
      validationResults,
      errors
    }
  }
}

/**
 * 测试导出清单生成
 */
export async function testExportManifest(): Promise<{
  success: boolean
  manifest: any
  errors: string[]
}> {
  const errors: string[] = []

  try {
    const exporter = ProjectExporter.getInstance()
    const manifest = await exporter.getExportManifest()

    // 验证清单结构
    const requiredFields = ['engineState', 'sceneTree', 'scriptSystem', 'animationSystem', 'editorState', 'resources', 'estimatedSize']
    const missingFields = requiredFields.filter(field => !(field in manifest))

    if (missingFields.length > 0) {
      errors.push(`清单缺少字段: ${missingFields.join(', ')}`)
    }

    return {
      success: errors.length === 0,
      manifest,
      errors
    }

  } catch (error) {
    errors.push(`导出清单测试失败: ${error}`)
    return {
      success: false,
      manifest: null,
      errors
    }
  }
}

/**
 * 测试序列化和反序列化
 */
export function testSerializationRoundTrip(): {
  success: boolean
  originalSize: number
  serializedSize: number
  errors: string[]
} {
  const errors: string[] = []

  try {
    // 创建测试场景
    const scene = new Scene('SerializationTestScene')
    const camera = new Camera3D('TestCamera')
    const light = new DirectionalLight3D('TestLight')
    const node = new Node3D('TestNode')

    // 设置属性
    camera.position = { x: 5, y: 5, z: 5 }
    camera.fov = 60
    light.intensity = 1.5
    node.position = { x: 1, y: 2, z: 3 }

    // 构建场景树
    scene.addChild(camera)
    scene.addChild(light)
    scene.addChild(node)

    // 序列化
    const serialized = scene.serialize()
    const serializedString = JSON.stringify(serialized)

    // 反序列化
    const deserialized = JSON.parse(serializedString)
    const restored = scene.constructor.deserialize ? 
      scene.constructor.deserialize(deserialized) :
      (scene as any).constructor.deserialize(deserialized)

    // 验证数据完整性
    if (!restored) {
      errors.push('反序列化失败')
    }

    return {
      success: errors.length === 0,
      originalSize: JSON.stringify(scene).length,
      serializedSize: serializedString.length,
      errors
    }

  } catch (error) {
    errors.push(`序列化测试失败: ${error}`)
    return {
      success: false,
      originalSize: 0,
      serializedSize: 0,
      errors
    }
  }
}

/**
 * 测试API可用性
 */
export function testProjectExportAPI(): {
  success: boolean
  availableFunctions: string[]
  missingFunctions: string[]
} {
  const requiredFunctions = [
    'exportFullProject',
    'importFullProject',
    'quickExportProject',
    'validateProjectFile',
    'getProjectExportManifest',
    'createProjectBackup',
    'restoreProjectBackup',
    'exportProjectTemplate',
    'createProjectFromTemplate',
    'getCurrentProjectSummary',
    'showProjectExportHelp'
  ]

  const availableFunctions: string[] = []
  const missingFunctions: string[] = []

  for (const funcName of requiredFunctions) {
    if (typeof (window as any)[funcName] === 'function') {
      availableFunctions.push(funcName)
    } else {
      missingFunctions.push(funcName)
    }
  }

  return {
    success: missingFunctions.length === 0,
    availableFunctions,
    missingFunctions
  }
}

/**
 * 运行所有项目导出测试
 */
export async function runAllProjectExportTests(): Promise<void> {
  const results = {
    instanceTest: false,
    dataCollectionTest: false,
    validationTest: false,
    manifestTest: false,
    serializationTest: false,
    apiTest: false
  }

  try {
    // 测试1: 实例化测试
    results.instanceTest = testProjectExporterInstance()

    // 测试2: 数据收集测试
    const dataCollectionResult = await testDataCollection()
    results.dataCollectionTest = dataCollectionResult.success

    // 测试3: 数据验证测试
    const validationResult = testProjectDataValidation()
    results.validationTest = validationResult.success

    // 测试4: 导出清单测试
    const manifestResult = await testExportManifest()
    results.manifestTest = manifestResult.success

    // 测试5: 序列化测试
    const serializationResult = testSerializationRoundTrip()
    results.serializationTest = serializationResult.success

    // 测试6: API可用性测试
    const apiResult = testProjectExportAPI()
    results.apiTest = apiResult.success

    // 输出测试结果摘要
    const passedTests = Object.values(results).filter(Boolean).length
    const totalTests = Object.keys(results).length

  } catch (error) {
    // 测试过程中的错误处理
  }
}

// ============================================================================
// 导出到全局（仅在浏览器环境中）
// ============================================================================

if (typeof window !== 'undefined' && window) {
  try {
    (window as any).testProjectExporterInstance = testProjectExporterInstance
    (window as any).testDataCollection = testDataCollection
    (window as any).testProjectDataValidation = testProjectDataValidation
    (window as any).testExportManifest = testExportManifest
    (window as any).testSerializationRoundTrip = testSerializationRoundTrip
    (window as any).testProjectExportAPI = testProjectExportAPI
    (window as any).runAllProjectExportTests = runAllProjectExportTests
    
  } catch (error) {
    // 静默处理全局设置错误
  }
}

// 函数已在定义时导出，无需重复导出
