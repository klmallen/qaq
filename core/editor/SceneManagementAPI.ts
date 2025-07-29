/**
 * QAQ游戏引擎 - 场景管理API
 * 
 * 提供场景导出、加载和数据清除的全局接口
 */

import { Engine, Scene, Node } from '../index'
import SceneExportManager, { type SceneExportOptions, type SceneLoadOptions } from './SceneExportManager'

// ============================================================================
// 全局API接口
// ============================================================================

/**
 * 导出当前场景到文件
 */
export async function exportCurrentScene(options: SceneExportOptions = {}): Promise<void> {
  const engine = Engine.getInstance()
  const currentScene = (engine as any)._currentQAQScene as Scene
  
  // if (!currentScene) {
  //   throw new Error('没有当前场景可以导出')
  // }
  
  const exportManager = SceneExportManager.getInstance()
  
  // 设置默认选项
  const defaultOptions: SceneExportOptions = {
    fileName: `${currentScene.name}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`,
    includeMetadata: true,
    compress: false,
    onProgress: (progress, message) => {
      console.log(`📦 导出进度 ${progress}%: ${message}`)
    },
    onError: (error) => {
      console.error('❌ 导出失败:', error)
    },
    onComplete: (fileName, dataSize) => {
      console.log(`✅ 导出完成: ${fileName} (${(dataSize / 1024).toFixed(2)} KB)`)
    }
  }
  
  const finalOptions = { ...defaultOptions, ...options }
  
  try {
    await exportManager.exportSceneToFile(currentScene, finalOptions)
  } catch (error) {
    console.error('❌ 场景导出失败:', error)
    throw error
  }
}

/**
 * 从文件加载场景
 */
export async function loadSceneFromFile(options: SceneLoadOptions = {}): Promise<Scene> {
  const exportManager = SceneExportManager.getInstance()
  
  // 设置默认选项
  const defaultOptions: SceneLoadOptions = {
    validateVersion: true,
    clearCurrentScene: true,
    onProgress: (progress, message) => {
      console.log(`📥 加载进度 ${progress}%: ${message}`)
    },
    onError: (error) => {
      console.error('❌ 加载失败:', error)
    },
    onComplete: (scene, metadata) => {
      console.log(`✅ 加载完成: ${scene.name}`)
      if (metadata) {
        console.log(`📊 场景信息: ${metadata.nodeCount} 个节点, 创建于 ${new Date(metadata.created).toLocaleString()}`)
      }
      
      // 设置为当前场景
      const engine = Engine.getInstance()
      ;(engine as any)._currentQAQScene = scene
      
      // 重新启动渲染（如果需要）
      if ((engine as any)._state !== 'RUNNING') {
        engine.startRendering()
      }
    }
  }
  
  const finalOptions = { ...defaultOptions, ...options }
  
  try {
    return await exportManager.loadSceneFromFile(finalOptions)
  } catch (error) {
    console.error('❌ 场景加载失败:', error)
    throw error
  }
}

/**
 * 清除引擎所有数据
 */
export async function clearEngineData(): Promise<void> {
  const engine = Engine.getInstance()
  
  try {
    await engine.clearAllData((progress, message) => {
      console.log(`🧹 清理进度 ${progress}%: ${message}`)
    })
    
    console.log('✅ 引擎数据清理完成')
    
    // 清理全局引用
    const globalKeys = [
      'currentScene', 'animationPlayer', 'stateMachine', 
      'animationDebugger', 'scriptManager', 'characterController', 'animationCycler'
    ]
    
    for (const key of globalKeys) {
      if ((window as any)[key]) {
        (window as any)[key] = null
        console.log(`🧹 清理全局引用: ${key}`)
      }
    }
    
  } catch (error) {
    console.error('❌ 清理引擎数据失败:', error)
    throw error
  }
}

/**
 * 创建新的空场景
 */
export function createNewScene(name: string = 'NewScene'): Scene {
  const scene = new Scene(name)
  
  // 设置为当前场景
  const engine = Engine.getInstance()
  ;(engine as any)._currentQAQScene = scene
  
  console.log(`✅ 创建新场景: ${name}`)
  return scene
}

/**
 * 获取当前场景信息
 */
export function getCurrentSceneInfo(): any {
  const engine = Engine.getInstance()
  const currentScene = (engine as any)._currentQAQScene as Scene
  
  if (!currentScene) {
    return {
      hasScene: false,
      message: '当前没有加载场景'
    }
  }
  
  const nodeCount = countNodesRecursive(currentScene)
  
  return {
    hasScene: true,
    name: currentScene.name,
    nodeCount,
    id: currentScene.getInstanceId(),
    children: currentScene.children.map(child => ({
      name: child.name,
      type: child.constructor.name,
      id: child.getInstanceId()
    }))
  }
}

/**
 * 递归计算节点数量
 */
function countNodesRecursive(node: any): number {
  let count = 1
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      count += countNodesRecursive(child)
    }
  }
  return count
}

/**
 * 设置拖拽加载功能
 */
export function setupDragAndDropLoader(dropZoneSelector: string = 'body'): void {
  const dropZone = document.querySelector(dropZoneSelector) as HTMLElement
  if (!dropZone) {
    console.error(`❌ 找不到拖拽区域: ${dropZoneSelector}`)
    return
  }
  
  const exportManager = SceneExportManager.getInstance()
  
  exportManager.setupDragAndDropLoader(dropZone, {
    validateVersion: true,
    clearCurrentScene: true,
    onProgress: (progress, message) => {
      console.log(`📥 拖拽加载进度 ${progress}%: ${message}`)
    },
    onError: (error) => {
      console.error('❌ 拖拽加载失败:', error)
      alert(`拖拽加载失败: ${error.message}`)
    },
    onComplete: (scene, metadata) => {
      console.log(`✅ 拖拽加载完成: ${scene.name}`)
      
      // 设置为当前场景
      const engine = Engine.getInstance()
      ;(engine as any)._currentQAQScene = scene
      
      // 重新启动渲染
      if ((engine as any)._state !== 'RUNNING') {
        engine.startRendering()
      }
      
      alert(`场景加载成功: ${scene.name}\n节点数量: ${metadata?.nodeCount || 0}`)
    }
  })
  
  // 添加视觉反馈样式
  const style = document.createElement('style')
  style.textContent = `
    .drag-over {
      background-color: rgba(0, 123, 255, 0.1) !important;
      border: 2px dashed #007bff !important;
    }
  `
  document.head.appendChild(style)
  
  console.log(`✅ 拖拽加载功能已启用，拖拽区域: ${dropZoneSelector}`)
}

/**
 * 显示场景管理帮助信息
 */
export function showSceneManagementHelp(): void {
  console.log(`
🎮 QAQ引擎场景管理API使用指南:

📦 导出场景:
  window.exportCurrentScene()                    // 导出当前场景
  window.exportCurrentScene({fileName: 'my.json'}) // 自定义文件名

📥 加载场景:
  window.loadSceneFromFile()                     // 从文件加载场景
  window.setupDragAndDropLoader()                // 启用拖拽加载

🧹 数据管理:
  window.clearEngineData()                       // 清除所有数据
  window.createNewScene('MyScene')               // 创建新场景

📊 场景信息:
  window.getCurrentSceneInfo()                   // 获取当前场景信息
  window.showSceneManagementHelp()               // 显示帮助信息

💡 提示:
  - 导出的文件包含完整的场景数据和元数据
  - 支持拖拽JSON文件到页面进行加载
  - 清除数据会释放所有内存资源
  - 所有操作都有进度显示和错误处理
  `)
}

// ============================================================================
// 导出到全局（仅在浏览器环境中）
// ============================================================================

if (typeof window !== 'undefined' && window) {
  try {
    // 场景管理API
    (window as any).exportCurrentScene = exportCurrentScene
    (window as any).loadSceneFromFile = loadSceneFromFile
    (window as any).clearEngineData = clearEngineData
    (window as any).createNewScene = createNewScene
    (window as any).getCurrentSceneInfo = getCurrentSceneInfo
    (window as any).setupDragAndDropLoader = setupDragAndDropLoader
    (window as any).showSceneManagementHelp = showSceneManagementHelp
    
    console.log('🎮 场景管理API已加载到全局')
    console.log('💡 运行 window.showSceneManagementHelp() 查看使用指南')
    
  } catch (error) {
    console.warn('⚠️ 无法设置全局场景管理API:', error)
  }
}

// 函数已在定义时导出，无需重复导出
