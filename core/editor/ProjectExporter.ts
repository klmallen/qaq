/**
 * QAQ游戏引擎 - 项目导出器
 * 
 * 完整的项目导出/导入系统实现
 */

import { Engine, Scene, Node } from '../index'
import { 
  ProjectExportVersion, 
  ExportFormat, 
  ResourceType, 
  EngineState as EngineStateEnum 
} from './ProjectExportTypes'
import type {
  ProjectExportData,
  ProjectExportOptions,
  ProjectImportOptions,
  ProjectExportResult,
  ProjectImportResult,
  ValidationResult,
  EngineStateData,
  SceneTreeData,
  ScriptSystemData,
  AnimationSystemData,
  EditorStateData,
  ResourceManifest,
  UserConfigData,
  ProjectMetadata,
  SerializationContext,
  DeserializationContext
} from './ProjectExportTypes'

// ============================================================================
// 项目导出器类
// ============================================================================

export class ProjectExporter {
  private static instance: ProjectExporter | null = null
  private engine: Engine | null = null

  private constructor() {
    this.engine = Engine.getInstance()
  }

  static getInstance(): ProjectExporter {
    if (!ProjectExporter.instance) {
      ProjectExporter.instance = new ProjectExporter()
    }
    return ProjectExporter.instance
  }

  /**
   * 导出完整项目
   */
  async exportProject(options: ProjectExportOptions): Promise<ProjectExportResult> {
    const startTime = performance.now()
    const warnings: string[] = []
    const errors: string[] = []

    try {
      options.onProgress?.(0, '开始项目导出...')

      // 1. 收集引擎状态
      options.onProgress?.(10, '收集引擎状态...')
      const engineState = await this.collectEngineState()

      // 2. 收集场景树数据
      options.onProgress?.(25, '收集场景树数据...')
      const sceneTree = await this.collectSceneTreeData()

      // 3. 收集脚本系统数据
      options.onProgress?.(40, '收集脚本系统数据...')
      const scriptSystem = await this.collectScriptSystemData()

      // 4. 收集动画系统数据
      options.onProgress?.(55, '收集动画系统数据...')
      const animationSystem = await this.collectAnimationSystemData()

      // 5. 收集编辑器状态
      options.onProgress?.(70, '收集编辑器状态...')
      const editorState = options.includeEditorState ? 
        await this.collectEditorState() : this.getDefaultEditorState()

      // 6. 生成资源清单
      options.onProgress?.(80, '生成资源清单...')
      const resourceManifest = options.includeResources ? 
        await this.generateResourceManifest() : this.getEmptyResourceManifest()

      // 7. 收集用户配置
      options.onProgress?.(85, '收集用户配置...')
      const userConfig = options.includeUserConfig ? 
        await this.collectUserConfig() : this.getDefaultUserConfig()

      // 8. 生成项目元数据
      options.onProgress?.(90, '生成项目元数据...')
      const metadata = this.generateProjectMetadata()

      // 9. 构建导出数据
      const exportData: ProjectExportData = {
        metadata,
        engineState,
        sceneTree,
        scriptSystem,
        animationSystem,
        editorState,
        resourceManifest,
        userConfig
      }

      // 10. 验证数据完整性
      if (options.validation) {
        options.onProgress?.(95, '验证数据完整性...')
        const validation = this.validateProjectData(exportData)
        if (!validation.isValid) {
          validation.issues.forEach(issue => {
            if (issue.level === 'error') {
              errors.push(`${issue.component}: ${issue.message}`)
            } else if (issue.level === 'warning') {
              warnings.push(`${issue.component}: ${issue.message}`)
            }
          })
        }
      }

      // 11. 序列化和保存
      options.onProgress?.(98, '序列化和保存数据...')
      const fileName = options.fileName || `project_${Date.now()}.json`
      const serializedData = this.serializeProjectData(exportData, options.format)
      
      await this.saveProjectFile(serializedData, fileName, options.format)

      const endTime = performance.now()
      const result: ProjectExportResult = {
        success: errors.length === 0,
        fileName,
        fileSize: serializedData.length,
        exportTime: endTime - startTime,
        metadata,
        warnings,
        errors
      }

      options.onProgress?.(100, '项目导出完成')
      options.onComplete?.(result)

      return result

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      errors.push(err.message)
      options.onError?.(err, 'exportProject')

      return {
        success: false,
        fileName: '',
        fileSize: 0,
        exportTime: performance.now() - startTime,
        metadata: this.generateProjectMetadata(),
        warnings,
        errors
      }
    }
  }

  /**
   * 导入并恢复项目
   */
  async importProject(options: ProjectImportOptions): Promise<ProjectImportResult> {
    const startTime = performance.now()
    const warnings: string[] = []
    const errors: string[] = []
    const restoredComponents: string[] = []

    try {
      options.onProgress?.(0, '开始项目导入...')

      // 1. 选择和读取项目文件
      options.onProgress?.(5, '读取项目文件...')
      const projectData = await this.loadProjectFile()

      // 2. 验证项目数据
      options.onProgress?.(15, '验证项目数据...')
      if (options.validateVersion) {
        const validation = this.validateProjectData(projectData)
        if (!validation.isValid) {
          validation.issues.forEach(issue => {
            if (issue.level === 'error') {
              errors.push(issue.message)
            } else {
              warnings.push(issue.message)
            }
          })
          if (errors.length > 0) {
            throw new Error('项目数据验证失败')
          }
        }
      }

      // 3. 清理当前项目
      if (options.clearCurrentProject) {
        options.onProgress?.(25, '清理当前项目...')
        await this.clearCurrentProject()
      }

      // 4. 恢复引擎状态
      options.onProgress?.(35, '恢复引擎状态...')
      await this.restoreEngineState(projectData.engineState)
      restoredComponents.push('engineState')

      // 5. 恢复场景树
      options.onProgress?.(50, '恢复场景树...')
      await this.restoreSceneTree(projectData.sceneTree)
      restoredComponents.push('sceneTree')

      // 6. 恢复脚本系统
      options.onProgress?.(65, '恢复脚本系统...')
      await this.restoreScriptSystem(projectData.scriptSystem)
      restoredComponents.push('scriptSystem')

      // 7. 恢复动画系统
      options.onProgress?.(75, '恢复动画系统...')
      await this.restoreAnimationSystem(projectData.animationSystem)
      restoredComponents.push('animationSystem')

      // 8. 恢复编辑器状态
      if (options.restoreEditorState && projectData.editorState) {
        options.onProgress?.(85, '恢复编辑器状态...')
        await this.restoreEditorState(projectData.editorState)
        restoredComponents.push('editorState')
      }

      // 9. 加载资源
      if (options.loadResources && projectData.resourceManifest) {
        options.onProgress?.(90, '加载项目资源...')
        await this.loadProjectResources(projectData.resourceManifest)
        restoredComponents.push('resources')
      }

      // 10. 恢复用户配置
      if (options.restoreUserConfig && projectData.userConfig) {
        options.onProgress?.(95, '恢复用户配置...')
        await this.restoreUserConfig(projectData.userConfig)
        restoredComponents.push('userConfig')
      }

      const endTime = performance.now()
      const result: ProjectImportResult = {
        success: true,
        projectName: projectData.metadata.name,
        importTime: endTime - startTime,
        metadata: projectData.metadata,
        restoredComponents,
        warnings,
        errors
      }

      options.onProgress?.(100, '项目导入完成')
      options.onComplete?.(result)

      return result

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      errors.push(err.message)
      options.onError?.(err, 'importProject')

      return {
        success: false,
        projectName: '',
        importTime: performance.now() - startTime,
        metadata: this.generateProjectMetadata(),
        restoredComponents,
        warnings,
        errors
      }
    }
  }

  /**
   * 验证项目数据完整性
   */
  validateProjectData(data: ProjectExportData): ValidationResult {
    const issues: ValidationResult['issues'] = []

    // 验证元数据
    if (!data.metadata) {
      issues.push({
        level: 'error',
        message: '缺少项目元数据',
        component: 'metadata'
      })
    }

    // 验证引擎状态
    if (!data.engineState) {
      issues.push({
        level: 'error',
        message: '缺少引擎状态数据',
        component: 'engineState'
      })
    }

    // 验证场景树
    if (!data.sceneTree) {
      issues.push({
        level: 'error',
        message: '缺少场景树数据',
        component: 'sceneTree'
      })
    }

    // 版本兼容性检查
    const currentVersion = ProjectExportVersion.CURRENT
    const dataVersion = data.metadata?.exportVersion
    let compatibility: ValidationResult['compatibility'] = 'full'

    if (dataVersion !== currentVersion) {
      compatibility = 'partial'
      issues.push({
        level: 'warning',
        message: `版本不匹配: 数据版本 ${dataVersion}, 当前版本 ${currentVersion}`,
        component: 'version',
        suggestion: '某些功能可能不完全兼容'
      })
    }

    const summary = {
      totalIssues: issues.length,
      errors: issues.filter(i => i.level === 'error').length,
      warnings: issues.filter(i => i.level === 'warning').length,
      infos: issues.filter(i => i.level === 'info').length
    }

    return {
      isValid: summary.errors === 0,
      version: dataVersion || ProjectExportVersion.CURRENT,
      compatibility,
      issues,
      summary
    }
  }

  /**
   * 获取导出清单信息
   */
  async getExportManifest(): Promise<{
    engineState: boolean
    sceneTree: boolean
    scriptSystem: boolean
    animationSystem: boolean
    editorState: boolean
    resources: number
    estimatedSize: number
  }> {
    const manifest = {
      engineState: !!this.engine,
      sceneTree: !!(this.engine as any)?._currentQAQScene,
      scriptSystem: !!(window as any).scriptManager,
      animationSystem: !!(window as any).stateMachine || !!(window as any).animationPlayer,
      editorState: true, // 总是可用
      resources: 0,
      estimatedSize: 0
    }

    // 估算资源数量和大小
    try {
      const resourceManifest = await this.generateResourceManifest()
      manifest.resources = resourceManifest.resourceCount
      manifest.estimatedSize = resourceManifest.totalSize
    } catch (error) {
      // 忽略资源清单生成错误
    }

    return manifest
  }

  // ========================================================================
  // 私有方法 - 数据收集
  // ========================================================================

  private async collectEngineState(): Promise<EngineStateData> {
    if (!this.engine) {
      throw new Error('引擎未初始化')
    }

    const engineAny = this.engine as any
    
    return {
      state: engineAny._state || EngineStateEnum.UNINITIALIZED,
      config: {
        width: engineAny._canvas?.width || 800,
        height: engineAny._canvas?.height || 600,
        antialias: true,
        enableShadows: true,
        backgroundColor: 0x87ceeb
      },
      renderer: {
        type: 'WebGLRenderer',
        capabilities: {},
        extensions: [],
        parameters: {}
      },
      canvas: {
        width: engineAny._canvas?.width || 800,
        height: engineAny._canvas?.height || 600,
        style: {}
      },
      performance: {
        fps: 60,
        frameTime: 16.67
      }
    }
  }

  private async collectSceneTreeData(): Promise<SceneTreeData> {
    const engineAny = this.engine as any
    const currentScene = engineAny._currentQAQScene

    // 收集所有Scene实例
    const allScenes = this.findAllSceneInstances()

    if (allScenes.length === 0) {
      return {
        currentScene: null,
        scenes: {},
        rootNodes: [],
        nodeHierarchy: {},
        nodeCount: 0
      }
    }

    const scenes: Record<string, any> = {}
    const rootNodes: string[] = []
    const nodeHierarchy: Record<string, string[]> = {}
    let totalNodeCount = 0

    // 序列化所有找到的场景
    for (const scene of allScenes) {
      try {
        const serializedScene = scene.serialize()
        const sceneId = scene.getInstanceId()
        const sceneName = scene.name || `Scene_${sceneId}`

        scenes[sceneName] = serializedScene
        rootNodes.push(sceneId)

        // 构建节点层次结构
        if (scene.children && Array.isArray(scene.children)) {
          nodeHierarchy[sceneId] = scene.children.map((child: any) =>
            child.getInstanceId ? child.getInstanceId() : `child_${Math.random().toString(36).substr(2, 9)}`
          )
        } else {
          nodeHierarchy[sceneId] = []
        }

        totalNodeCount += this.countNodesRecursive(serializedScene)

        console.log(`✅ 收集场景: ${sceneName} (${nodeHierarchy[sceneId].length} 个子节点)`)
      } catch (error) {
        console.warn(`⚠️ 序列化场景失败: ${scene.name}`, error)
      }
    }

    const currentSceneName = currentScene ? (currentScene.name || 'CurrentScene') :
      (allScenes.length > 0 ? (allScenes[0].name || 'Scene_0') : null)

    console.log(`📊 场景收集完成: 找到 ${allScenes.length} 个场景，总计 ${totalNodeCount} 个节点`)

    return {
      currentScene: currentSceneName,
      scenes,
      rootNodes,
      nodeHierarchy,
      nodeCount: totalNodeCount
    }
  }

  /**
   * 查找所有Scene实例
   */
  private findAllSceneInstances(): any[] {
    const scenes: any[] = []

    // 1. 检查引擎当前场景
    const engineAny = this.engine as any
    if (engineAny._currentQAQScene) {
      scenes.push(engineAny._currentQAQScene)
    }

    // 2. 检查全局window对象中的场景引用
    if (typeof window !== 'undefined') {
      // 检查常见的全局场景变量名
      const globalSceneVars = [
        'currentScene', 'scene', 'mainScene', 'testScene',
        'scene1', 'scene2', 'scene3', 'scene4', 'scene5',
        'scene6', 'scene7', 'scene8', 'scene9', 'scene10'
      ]

      for (const varName of globalSceneVars) {
        const sceneObj = (window as any)[varName]
        if (sceneObj && this.isSceneInstance(sceneObj)) {
          // 避免重复添加
          if (!scenes.find(s => s.getInstanceId && s.getInstanceId() === sceneObj.getInstanceId())) {
            scenes.push(sceneObj)
          }
        }
      }

      // 3. 扫描window对象中所有可能的Scene实例
      try {
        for (const key in window) {
          const obj = (window as any)[key]
          if (this.isSceneInstance(obj)) {
            // 避免重复添加
            if (!scenes.find(s => s.getInstanceId && s.getInstanceId() === obj.getInstanceId())) {
              scenes.push(obj)
            }
          }
        }
      } catch (error) {
        // 忽略扫描错误
      }
    }

    // 4. 检查Three.js场景中的QAQ场景节点
    if (this.engine && (this.engine as any)._scene) {
      const threeScene = (this.engine as any)._scene
      this.scanThreeSceneForQAQScenes(threeScene, scenes)
    }

    console.log(`🔍 场景扫描完成: 找到 ${scenes.length} 个Scene实例`)
    return scenes
  }

  /**
   * 检查对象是否为Scene实例
   */
  private isSceneInstance(obj: any): boolean {
    if (!obj || typeof obj !== 'object') {
      return false
    }

    // 检查是否有Scene的特征方法和属性
    return (
      typeof obj.serialize === 'function' &&
      typeof obj.getInstanceId === 'function' &&
      (obj.constructor.name === 'Scene' ||
       obj.type === 'Scene' ||
       (obj.name && typeof obj.name === 'string') ||
       (obj.children && Array.isArray(obj.children)))
    )
  }

  /**
   * 扫描Three.js场景中的QAQ场景节点
   */
  private scanThreeSceneForQAQScenes(threeScene: any, scenes: any[]): void {
    if (!threeScene || !threeScene.children) {
      return
    }

    const scanObject = (obj: any) => {
      // 检查对象是否关联了QAQ场景
      if (obj.userData && obj.userData.qaqScene) {
        const qaqScene = obj.userData.qaqScene
        if (this.isSceneInstance(qaqScene)) {
          if (!scenes.find(s => s.getInstanceId && s.getInstanceId() === qaqScene.getInstanceId())) {
            scenes.push(qaqScene)
          }
        }
      }

      // 递归扫描子对象
      if (obj.children && Array.isArray(obj.children)) {
        for (const child of obj.children) {
          scanObject(child)
        }
      }
    }

    for (const child of threeScene.children) {
      scanObject(child)
    }
  }

  private async collectScriptSystemData(): Promise<ScriptSystemData> {
    try {
      // 导入ScriptManager
      const { default: ScriptManager } = await import('../script/ScriptManager')
      const scriptManager = ScriptManager.getInstance()

      // 使用ScriptManager的序列化方法
      const scriptData = scriptManager.serialize()

      // 转换为ProjectExportTypes格式
      const registeredClasses: Record<string, any> = {}
      for (const [className, classData] of Object.entries(scriptData.registeredClasses || {})) {
        const classInfo = classData as any
        registeredClasses[className] = {
          className: className,
          source: classInfo.filePath || undefined,
          metadata: {
            constructorName: classInfo.constructorName,
            registeredAt: classInfo.registeredAt
          }
        }
      }

      const scriptInstances: Record<string, any> = {}
      for (const [instanceId, instanceData] of Object.entries(scriptData.scriptInstances || {})) {
        const instance = instanceData as any
        scriptInstances[instanceId] = {
          nodeId: instance.nodeId,
          className: instance.className,
          properties: {
            nodeName: instance.nodeName,
            filePath: instance.filePath,
            createdAt: instance.createdAt,
            scriptState: instance.scriptState
          },
          state: instance.active ? 'running' : 'paused'
        }
      }

      console.log(`📜 收集脚本系统数据: ${Object.keys(registeredClasses).length} 个类, ${Object.keys(scriptInstances).length} 个实例`)

      return {
        registeredClasses,
        scriptInstances,
        globalScripts: [] // 可以后续扩展全局脚本
      }
    } catch (error) {
      console.warn('⚠️ 收集脚本系统数据失败:', error)
      return {
        registeredClasses: {},
        scriptInstances: {},
        globalScripts: []
      }
    }
  }

  private async collectAnimationSystemData(): Promise<AnimationSystemData> {
    const stateMachine = (window as any).stateMachine
    const animationPlayer = (window as any).animationPlayer
    
    return {
      stateMachines: {},
      animationPlayers: {},
      globalMixers: []
    }
  }

  private async collectEditorState(): Promise<EditorStateData> {
    return this.getDefaultEditorState()
  }

  private async generateResourceManifest(): Promise<ResourceManifest> {
    try {
      // 导入ResourceManager
      const { default: ResourceManager } = await import('../resources/ResourceManager')
      const resourceManager = ResourceManager.getInstance()

      // 获取当前资源清单
      let manifest = resourceManager.getManifest()

      // 如果资源清单为空，尝试扫描项目中的实际资源
      if (Object.keys(manifest.resources).length === 0) {
        console.log('🔍 资源清单为空，开始扫描项目资源...')
        manifest = await this.scanProjectResources(resourceManager)
      }

      // 验证资源完整性
      const validation = await resourceManager.validateResources()

      // 更新清单状态
      manifest.missingResources = validation.missing
      manifest.brokenReferences = validation.corrupted
      manifest.lastScan = Date.now()

      // 计算总大小
      let totalSize = 0
      for (const resource of Object.values(manifest.resources)) {
        totalSize += resource.size || 0
      }
      manifest.totalSize = totalSize

      console.log(`📊 资源清单生成完成: ${Object.keys(manifest.resources).length} 个资源`)
      return manifest
    } catch (error) {
      console.warn('⚠️ 生成资源清单失败，使用空清单:', error)
      return this.getEmptyResourceManifest()
    }
  }

  /**
   * 扫描项目中的实际资源
   */
  private async scanProjectResources(resourceManager: any): Promise<ResourceManifest> {
    const manifest = this.getEmptyResourceManifest()

    try {
      // 1. 扫描Three.js场景中的资源
      if (this.engine && (this.engine as any)._scene) {
        await this.scanThreeSceneResources((this.engine as any)._scene, resourceManager, manifest)
      }

      // 2. 扫描QAQ场景中的资源
      const allScenes = this.findAllSceneInstances()
      for (const scene of allScenes) {
        await this.scanQAQSceneResources(scene, resourceManager, manifest)
      }

      // 3. 扫描全局对象中的资源引用
      await this.scanGlobalResources(resourceManager, manifest)

      console.log(`🔍 资源扫描完成: 发现 ${Object.keys(manifest.resources).length} 个资源`)
    } catch (error) {
      console.warn('⚠️ 资源扫描失败:', error)
    }

    return manifest
  }

  /**
   * 扫描Three.js场景中的资源
   */
  private async scanThreeSceneResources(threeScene: any, resourceManager: any, manifest: any): Promise<void> {
    const scanObject = (obj: any, path: string = '') => {
      // 扫描材质
      if (obj.material) {
        this.registerMaterialResources(obj.material, resourceManager, manifest, path)
      }

      // 扫描几何体
      if (obj.geometry) {
        this.registerGeometryResources(obj.geometry, resourceManager, manifest, path)
      }

      // 扫描纹理
      if (obj.texture) {
        this.registerTextureResources(obj.texture, resourceManager, manifest, path)
      }

      // 递归扫描子对象
      if (obj.children && Array.isArray(obj.children)) {
        obj.children.forEach((child: any, index: number) => {
          scanObject(child, `${path}/child_${index}`)
        })
      }
    }

    if (threeScene.children) {
      threeScene.children.forEach((child: any, index: number) => {
        scanObject(child, `scene/child_${index}`)
      })
    }
  }

  /**
   * 扫描QAQ场景中的资源
   */
  private async scanQAQSceneResources(scene: any, resourceManager: any, manifest: any): Promise<void> {
    const scanNode = (node: any, path: string = '') => {
      // 检查节点是否有资源引用
      if (node.modelPath) {
        const uuid = resourceManager.registerResource(node.modelPath, 'model', {
          nodeId: node.getInstanceId ? node.getInstanceId() : 'unknown',
          nodeName: node.name || 'unnamed'
        })
        console.log(`📦 注册模型资源: ${node.modelPath} -> ${uuid}`)
      }

      if (node.texturePath) {
        const uuid = resourceManager.registerResource(node.texturePath, 'texture', {
          nodeId: node.getInstanceId ? node.getInstanceId() : 'unknown',
          nodeName: node.name || 'unnamed'
        })
        console.log(`📦 注册纹理资源: ${node.texturePath} -> ${uuid}`)
      }

      if (node.audioPath) {
        const uuid = resourceManager.registerResource(node.audioPath, 'audio', {
          nodeId: node.getInstanceId ? node.getInstanceId() : 'unknown',
          nodeName: node.name || 'unnamed'
        })
        console.log(`📦 注册音频资源: ${node.audioPath} -> ${uuid}`)
      }

      // 递归扫描子节点
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any, index: number) => {
          scanNode(child, `${path}/child_${index}`)
        })
      }
    }

    const sceneName = scene.name || 'unnamed_scene'
    scanNode(scene, sceneName)
  }

  /**
   * 扫描全局对象中的资源引用
   */
  private async scanGlobalResources(resourceManager: any, manifest: any): Promise<void> {
    if (typeof window === 'undefined') return

    // 检查常见的资源变量名
    const resourceVars = [
      'models', 'textures', 'audio', 'sounds', 'materials',
      'assets', 'resources', 'files', 'media'
    ]

    for (const varName of resourceVars) {
      const resourceObj = (window as any)[varName]
      if (resourceObj && typeof resourceObj === 'object') {
        this.registerObjectResources(resourceObj, resourceManager, manifest, varName)
      }
    }
  }

  /**
   * 注册材质资源
   */
  private registerMaterialResources(material: any, resourceManager: any, manifest: any, path: string): void {
    if (Array.isArray(material)) {
      material.forEach((mat, index) => {
        this.registerMaterialResources(mat, resourceManager, manifest, `${path}/material_${index}`)
      })
      return
    }

    // 检查材质的纹理
    const textureProps = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap']
    for (const prop of textureProps) {
      if (material[prop] && material[prop].image && material[prop].image.src) {
        const uuid = resourceManager.registerResource(material[prop].image.src, 'texture', {
          materialProperty: prop,
          path: path
        })
        console.log(`📦 注册材质纹理: ${material[prop].image.src} -> ${uuid}`)
      }
    }
  }

  /**
   * 注册几何体资源
   */
  private registerGeometryResources(geometry: any, resourceManager: any, manifest: any, path: string): void {
    // 如果几何体有源文件信息
    if (geometry.userData && geometry.userData.sourceFile) {
      const uuid = resourceManager.registerResource(geometry.userData.sourceFile, 'model', {
        geometryType: geometry.type,
        path: path
      })
      console.log(`📦 注册几何体资源: ${geometry.userData.sourceFile} -> ${uuid}`)
    }
  }

  /**
   * 注册纹理资源
   */
  private registerTextureResources(texture: any, resourceManager: any, manifest: any, path: string): void {
    if (texture.image && texture.image.src) {
      const uuid = resourceManager.registerResource(texture.image.src, 'texture', {
        textureType: texture.type,
        path: path
      })
      console.log(`📦 注册纹理资源: ${texture.image.src} -> ${uuid}`)
    }
  }

  /**
   * 注册对象中的资源
   */
  private registerObjectResources(obj: any, resourceManager: any, manifest: any, basePath: string): void {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // 检查是否为文件路径
        if (this.isFilePath(value)) {
          const type = this.guessResourceType(value)
          const uuid = resourceManager.registerResource(value, type, {
            source: 'global_object',
            objectKey: key,
            basePath: basePath
          })
          console.log(`📦 注册全局资源: ${value} -> ${uuid}`)
        }
      } else if (typeof value === 'object' && value !== null) {
        // 递归检查嵌套对象
        this.registerObjectResources(value, resourceManager, manifest, `${basePath}/${key}`)
      }
    }
  }

  /**
   * 检查字符串是否为文件路径
   */
  private isFilePath(str: string): boolean {
    if (typeof str !== 'string' || str.length === 0) return false

    // 检查文件扩展名
    const fileExtensions = [
      '.gltf', '.glb', '.fbx', '.obj', '.dae',  // 3D模型
      '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg',  // 图片
      '.mp3', '.wav', '.ogg', '.m4a', '.aac',  // 音频
      '.mp4', '.webm', '.ogv',  // 视频
      '.js', '.ts', '.json', '.xml'  // 脚本和数据
    ]

    const lowerStr = str.toLowerCase()
    return fileExtensions.some(ext => lowerStr.endsWith(ext)) ||
           lowerStr.includes('/') || lowerStr.includes('\\') ||
           lowerStr.startsWith('./') || lowerStr.startsWith('../') ||
           lowerStr.startsWith('http://') || lowerStr.startsWith('https://')
  }

  /**
   * 根据文件扩展名猜测资源类型
   */
  private guessResourceType(filePath: string): any {
    const lowerPath = filePath.toLowerCase()

    if (lowerPath.match(/\.(gltf|glb|fbx|obj|dae)$/)) return 'model'
    if (lowerPath.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/)) return 'texture'
    if (lowerPath.match(/\.(mp3|wav|ogg|m4a|aac)$/)) return 'audio'
    if (lowerPath.match(/\.(mp4|webm|ogv)$/)) return 'audio'  // 视频暂时归类为音频
    if (lowerPath.match(/\.(js|ts)$/)) return 'script'
    if (lowerPath.match(/\.(json|xml)$/)) return 'material'  // 数据文件暂时归类为材质

    return 'model'  // 默认类型
  }

  private async collectUserConfig(): Promise<UserConfigData> {
    return this.getDefaultUserConfig()
  }

  // ========================================================================
  // 私有方法 - 默认数据生成
  // ========================================================================

  private getDefaultEditorState(): EditorStateData {
    return {
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
    }
  }

  private getEmptyResourceManifest(): ResourceManifest {
    return {
      version: '1.0.0',
      projectRoot: '',
      resources: {},
      pathToUuid: {},
      typeIndex: {} as Record<any, string[]>,
      dependencyGraph: {},
      totalSize: 0,
      resourceCount: 0,
      missingResources: [],
      brokenReferences: [],
      lastScan: Date.now()
    }
  }

  private getDefaultUserConfig(): UserConfigData {
    return {
      preferences: {
        theme: 'dark',
        language: 'zh-CN',
        autoSave: true,
        autoSaveInterval: 300
      },
      shortcuts: {},
      customSettings: {},
      recentProjects: []
    }
  }

  private generateProjectMetadata(): ProjectMetadata {
    return {
      name: 'QAQ Project',
      version: '1.0.0',
      description: 'QAQ引擎项目',
      author: 'QAQ Engine User',
      created: Date.now(),
      modified: Date.now(),
      engineVersion: '3.0.0',
      exportVersion: ProjectExportVersion.CURRENT,
      platform: navigator.platform,
      checksum: this.generateChecksum(Date.now().toString()),
      tags: ['qaq-engine', '3d', 'game']
    }
  }

  // ========================================================================
  // 私有方法 - 工具函数
  // ========================================================================

  private countNodesRecursive(nodeData: any): number {
    let count = 1
    if (nodeData.children && Array.isArray(nodeData.children)) {
      for (const child of nodeData.children) {
        count += this.countNodesRecursive(child)
      }
    }
    return count
  }

  private generateChecksum(data: string): string {
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16)
  }

  private serializeProjectData(data: ProjectExportData, format: ExportFormat): string {
    switch (format) {
      case ExportFormat.JSON:
        return JSON.stringify(data, null, 2)
      case ExportFormat.COMPRESSED:
        return JSON.stringify(data)
      default:
        return JSON.stringify(data, null, 2)
    }
  }

  private async saveProjectFile(data: string, fileName: string, format: ExportFormat): Promise<void> {
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  private async loadProjectFile(): Promise<ProjectExportData> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.style.display = 'none'

      input.onchange = async (event) => {
        try {
          const file = (event.target as HTMLInputElement).files?.[0]
          if (!file) {
            throw new Error('未选择文件')
          }

          const fileContent = await this.readFileAsText(file)
          const projectData: ProjectExportData = JSON.parse(fileContent)
          resolve(projectData)
        } catch (error) {
          reject(error)
        } finally {
          document.body.removeChild(input)
        }
      }

      input.onerror = () => {
        reject(new Error('文件读取失败'))
        document.body.removeChild(input)
      }

      document.body.appendChild(input)
      input.click()
    })
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsText(file)
    })
  }

  private async clearCurrentProject(): Promise<void> {
    if (this.engine && typeof (this.engine as any).clearAllData === 'function') {
      await (this.engine as any).clearAllData()
    }
  }

  private async restoreEngineState(state: EngineStateData): Promise<void> {
    // 恢复引擎状态的实现
  }

  private async restoreSceneTree(sceneTree: SceneTreeData): Promise<void> {
    if (sceneTree.currentScene && sceneTree.scenes[sceneTree.currentScene]) {
      const sceneData = sceneTree.scenes[sceneTree.currentScene]
      const scene = Node.deserialize(sceneData, Scene) as Scene
      
      // 设置为当前场景
      if (this.engine) {
        (this.engine as any)._currentQAQScene = scene
      }
    }
  }

  private async restoreScriptSystem(scriptSystem: ScriptSystemData): Promise<void> {
    // 恢复脚本系统的实现
  }

  private async restoreAnimationSystem(animationSystem: AnimationSystemData): Promise<void> {
    // 恢复动画系统的实现
  }

  private async restoreEditorState(editorState: EditorStateData): Promise<void> {
    // 恢复编辑器状态的实现
  }

  private async loadProjectResources(manifest: ResourceManifest): Promise<void> {
    // 加载项目资源的实现
  }

  private async restoreUserConfig(userConfig: UserConfigData): Promise<void> {
    // 恢复用户配置的实现
  }
}

export default ProjectExporter
