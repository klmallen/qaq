/**
 * QAQ游戏引擎 - 场景导出/加载管理器
 * 
 * 基于Node反射序列化系统的场景导出和加载功能
 */

import { Scene, Engine, Node } from '../index'

// ============================================================================
// 接口定义
// ============================================================================

export interface SceneExportOptions {
  fileName?: string
  includeMetadata?: boolean
  compress?: boolean
  onProgress?: (progress: number, message: string) => void
  onError?: (error: Error) => void
  onComplete?: (fileName: string, dataSize: number) => void
}

export interface SceneLoadOptions {
  validateVersion?: boolean
  clearCurrentScene?: boolean
  onProgress?: (progress: number, message: string) => void
  onError?: (error: Error) => void
  onComplete?: (scene: Scene, metadata: any) => void
}

export interface SceneMetadata {
  version: string
  engineVersion: string
  created: number
  modified: number
  author?: string
  description?: string
  nodeCount: number
  dataSize: number
  checksum?: string
}

export interface ExportedSceneData {
  metadata: SceneMetadata
  sceneData: any
  resources?: { [key: string]: any }
}

// ============================================================================
// 场景导出/加载管理器
// ============================================================================

export class SceneExportManager {
  private static instance: SceneExportManager | null = null
  private engine: Engine | null = null

  private constructor() {
    this.engine = Engine.getInstance()
  }

  static getInstance(): SceneExportManager {
    if (!SceneExportManager.instance) {
      SceneExportManager.instance = new SceneExportManager()
    }
    return SceneExportManager.instance
  }

  /**
   * 导出场景到JSON文件
   */
  async exportSceneToFile(scene: Scene, options: SceneExportOptions = {}): Promise<void> {
    const {
      fileName = `scene_${Date.now()}.json`,
      includeMetadata = true,
      compress = false,
      onProgress,
      onError,
      onComplete
    } = options

    try {
      onProgress?.(0, '开始序列化场景...')

      // 序列化场景数据
      const sceneData = scene.serialize()
      onProgress?.(30, '场景序列化完成')

      // 创建元数据
      let metadata: SceneMetadata | undefined
      if (includeMetadata) {
        metadata = this.createSceneMetadata(scene, sceneData)
        onProgress?.(50, '创建元数据完成')
      }

      // 构建导出数据
      const exportData: ExportedSceneData = {
        metadata: metadata!,
        sceneData,
        resources: {} // 未来可以扩展资源导出
      }

      onProgress?.(70, '准备导出数据...')

      // 转换为JSON字符串
      let jsonString = JSON.stringify(exportData, null, compress ? 0 : 2)
      const dataSize = jsonString.length

      onProgress?.(90, '生成下载文件...')

      // 创建下载
      this.downloadJSON(jsonString, fileName)

      onProgress?.(100, '导出完成')
      onComplete?.(fileName, dataSize)

      console.log(`✅ 场景导出成功: ${fileName} (${(dataSize / 1024).toFixed(2)} KB)`)

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      onError?.(err)
      console.error('❌ 场景导出失败:', err)
      throw err
    }
  }

  /**
   * 从文件加载场景
   */
  async loadSceneFromFile(options: SceneLoadOptions = {}): Promise<Scene> {
    const {
      validateVersion = true,
      clearCurrentScene = true,
      onProgress,
      onError,
      onComplete
    } = options

    return new Promise((resolve, reject) => {
      try {
        onProgress?.(0, '选择文件...')

        // 创建文件选择器
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

            onProgress?.(20, `读取文件: ${file.name}`)

            // 读取文件内容
            const fileContent = await this.readFileAsText(file)
            onProgress?.(40, '解析JSON数据...')

            // 解析JSON数据
            const exportData: ExportedSceneData = JSON.parse(fileContent)
            onProgress?.(60, '验证数据格式...')

            // 验证数据格式
            if (!exportData.sceneData) {
              throw new Error('无效的场景数据格式')
            }

            // 版本兼容性检查
            if (validateVersion && exportData.metadata) {
              this.validateVersion(exportData.metadata)
            }

            onProgress?.(70, '清理当前场景...')

            // 清理当前场景
            if (clearCurrentScene && this.engine) {
              await this.engine.clearAllData()
            }

            onProgress?.(80, '反序列化场景...')

            // 反序列化场景
            const scene = Node.deserialize(exportData.sceneData, Scene) as Scene

            onProgress?.(100, '加载完成')
            onComplete?.(scene, exportData.metadata)

            console.log(`✅ 场景加载成功: ${file.name}`)
            resolve(scene)

          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error))
            onError?.(err)
            console.error('❌ 场景加载失败:', err)
            reject(err)
          } finally {
            document.body.removeChild(input)
          }
        }

        input.onerror = () => {
          const err = new Error('文件读取失败')
          onError?.(err)
          reject(err)
          document.body.removeChild(input)
        }

        // 添加到DOM并触发点击
        document.body.appendChild(input)
        input.click()

      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        onError?.(err)
        reject(err)
      }
    })
  }

  /**
   * 支持拖拽加载场景
   */
  setupDragAndDropLoader(
    dropZone: HTMLElement, 
    options: SceneLoadOptions = {}
  ): void {
    const handleDragOver = (event: DragEvent) => {
      event.preventDefault()
      dropZone.classList.add('drag-over')
    }

    const handleDragLeave = (event: DragEvent) => {
      event.preventDefault()
      dropZone.classList.remove('drag-over')
    }

    const handleDrop = async (event: DragEvent) => {
      event.preventDefault()
      dropZone.classList.remove('drag-over')

      const files = event.dataTransfer?.files
      if (!files || files.length === 0) return

      const file = files[0]
      if (!file.name.endsWith('.json')) {
        options.onError?.(new Error('请拖拽JSON格式的场景文件'))
        return
      }

      try {
        options.onProgress?.(0, `处理拖拽文件: ${file.name}`)
        
        const fileContent = await this.readFileAsText(file)
        const exportData: ExportedSceneData = JSON.parse(fileContent)
        
        if (options.clearCurrentScene && this.engine) {
          await this.engine.clearAllData()
        }
        
        const scene = Node.deserialize(exportData.sceneData, Scene) as Scene

        options.onComplete?.(scene, exportData.metadata)
        console.log(`✅ 拖拽加载场景成功: ${file.name}`)

      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        options.onError?.(err)
        console.error('❌ 拖拽加载场景失败:', err)
      }
    }

    // 绑定事件
    dropZone.addEventListener('dragover', handleDragOver)
    dropZone.addEventListener('dragleave', handleDragLeave)
    dropZone.addEventListener('drop', handleDrop)

    console.log('✅ 拖拽加载功能已启用')
  }

  /**
   * 创建场景元数据
   */
  private createSceneMetadata(scene: Scene, sceneData: any): SceneMetadata {
    const nodeCount = this.countNodes(sceneData)
    const dataSize = JSON.stringify(sceneData).length

    return {
      version: '1.0.0',
      engineVersion: '3.0.0', // QAQ引擎版本
      created: Date.now(),
      modified: Date.now(),
      author: 'QAQ Engine User',
      description: `场景: ${scene.name}`,
      nodeCount,
      dataSize,
      checksum: this.generateChecksum(sceneData)
    }
  }

  /**
   * 计算节点数量
   */
  private countNodes(nodeData: any): number {
    let count = 1
    if (nodeData.children && Array.isArray(nodeData.children)) {
      for (const child of nodeData.children) {
        count += this.countNodes(child)
      }
    }
    return count
  }

  /**
   * 生成数据校验和
   */
  private generateChecksum(data: any): string {
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * 验证版本兼容性
   */
  private validateVersion(metadata: SceneMetadata): void {
    const currentVersion = '3.0.0'
    if (metadata.engineVersion && metadata.engineVersion !== currentVersion) {
      console.warn(`⚠️ 版本不匹配: 文件版本 ${metadata.engineVersion}, 当前版本 ${currentVersion}`)
    }
  }

  /**
   * 读取文件为文本
   */
  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsText(file)
    })
  }

  /**
   * 下载JSON文件
   */
  private downloadJSON(jsonString: string, fileName: string): void {
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // 清理URL对象
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}

// 导出类型接口（类已在定义时导出）
export type {
  SceneExportOptions,
  SceneLoadOptions,
  SceneMetadata,
  ExportedSceneData
}

export default SceneExportManager
