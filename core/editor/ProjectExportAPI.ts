/**
 * QAQ游戏引擎 - 项目导出API
 * 
 * 提供项目导出/导入的全局接口
 */

import { ProjectExporter } from './ProjectExporter'
import { ExportFormat, ProjectExportVersion } from './ProjectExportTypes'
import type {
  ProjectExportOptions,
  ProjectImportOptions,
  ProjectExportResult,
  ProjectImportResult,
  ValidationResult
} from './ProjectExportTypes'

// ============================================================================
// 全局API函数
// ============================================================================

/**
 * 导出完整项目
 */
export async function exportFullProject(options: Partial<ProjectExportOptions> = {}): Promise<ProjectExportResult> {
  const exporter = ProjectExporter.getInstance()
  
  const defaultOptions: ProjectExportOptions = {
    format: ExportFormat.JSON,
    fileName: `qaq_project_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`,
    includeResources: true,
    includeEditorState: true,
    includeUserConfig: true,
    compression: false,
    validation: true,
    onProgress: (progress, message, details) => {
      if (progress % 10 === 0 || progress === 100) {
        // 只在关键进度点输出日志，减少console.log使用
      }
    },
    onError: (error, context) => {
      // 仅在关键错误时输出
    },
    onComplete: (result) => {
      if (result.success) {
        // 成功完成时的简要日志
      }
    }
  }
  
  const finalOptions = { ...defaultOptions, ...options }
  
  try {
    return await exporter.exportProject(finalOptions)
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error))
  }
}

/**
 * 导入完整项目
 */
export async function importFullProject(options: Partial<ProjectImportOptions> = {}): Promise<ProjectImportResult> {
  const exporter = ProjectExporter.getInstance()
  
  const defaultOptions: ProjectImportOptions = {
    validateVersion: true,
    clearCurrentProject: true,
    restoreEditorState: true,
    restoreUserConfig: true,
    loadResources: true,
    onProgress: (progress, message, details) => {
      if (progress % 10 === 0 || progress === 100) {
        // 只在关键进度点输出日志
      }
    },
    onError: (error, context) => {
      // 仅在关键错误时输出
    },
    onComplete: (result) => {
      if (result.success) {
        // 成功完成时的简要日志
      }
    }
  }
  
  const finalOptions = { ...defaultOptions, ...options }
  
  try {
    return await exporter.importProject(finalOptions)
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error))
  }
}

/**
 * 快速导出（仅核心数据）
 */
export async function quickExportProject(fileName?: string): Promise<ProjectExportResult> {
  return exportFullProject({
    fileName: fileName || `qaq_quick_export_${Date.now()}.json`,
    includeResources: false,
    includeEditorState: false,
    includeUserConfig: false,
    compression: true,
    validation: false
  })
}

/**
 * 验证项目文件
 */
export async function validateProjectFile(): Promise<ValidationResult> {
  const exporter = ProjectExporter.getInstance()
  
  try {
    // 通过文件选择器加载项目数据
    const projectData = await (exporter as any).loadProjectFile()
    return exporter.validateProjectData(projectData)
  } catch (error) {
    return {
      isValid: false,
      version: ProjectExportVersion.CURRENT,
      compatibility: 'none',
      issues: [{
        level: 'error',
        message: error instanceof Error ? error.message : '未知错误',
        component: 'file'
      }],
      summary: {
        totalIssues: 1,
        errors: 1,
        warnings: 0,
        infos: 0
      }
    }
  }
}

/**
 * 获取项目导出清单
 */
export async function getProjectExportManifest(): Promise<{
  engineState: boolean
  sceneTree: boolean
  scriptSystem: boolean
  animationSystem: boolean
  editorState: boolean
  resources: number
  estimatedSize: number
}> {
  const exporter = ProjectExporter.getInstance()
  return await exporter.getExportManifest()
}

/**
 * 创建项目备份
 */
export async function createProjectBackup(): Promise<ProjectExportResult> {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  
  return exportFullProject({
    fileName: `qaq_backup_${timestamp}.json`,
    includeResources: true,
    includeEditorState: true,
    includeUserConfig: true,
    compression: false,
    validation: true,
    onProgress: (progress, message) => {
      // 备份过程的进度反馈
    }
  })
}

/**
 * 恢复项目备份
 */
export async function restoreProjectBackup(): Promise<ProjectImportResult> {
  return importFullProject({
    validateVersion: true,
    clearCurrentProject: true,
    restoreEditorState: true,
    restoreUserConfig: true,
    loadResources: true,
    onProgress: (progress, message) => {
      // 恢复过程的进度反馈
    }
  })
}

/**
 * 导出项目模板
 */
export async function exportProjectTemplate(templateName: string): Promise<ProjectExportResult> {
  return exportFullProject({
    fileName: `template_${templateName}_${Date.now()}.json`,
    includeResources: false,
    includeEditorState: false,
    includeUserConfig: false,
    compression: false,
    validation: true
  })
}

/**
 * 从模板创建项目
 */
export async function createProjectFromTemplate(): Promise<ProjectImportResult> {
  return importFullProject({
    validateVersion: false,
    clearCurrentProject: true,
    restoreEditorState: false,
    restoreUserConfig: false,
    loadResources: false
  })
}

/**
 * 获取当前项目状态摘要
 */
export async function getCurrentProjectSummary(): Promise<{
  hasEngine: boolean
  hasScene: boolean
  sceneNodeCount: number
  hasScripts: boolean
  hasAnimations: boolean
  estimatedExportSize: number
}> {
  try {
    const manifest = await getProjectExportManifest()
    
    // 估算导出大小（简单估算）
    let estimatedSize = 1024 // 基础元数据大小
    if (manifest.engineState) estimatedSize += 512
    if (manifest.sceneTree) estimatedSize += 2048
    if (manifest.scriptSystem) estimatedSize += 1024
    if (manifest.animationSystem) estimatedSize += 1024
    if (manifest.editorState) estimatedSize += 512
    estimatedSize += manifest.estimatedSize
    
    return {
      hasEngine: manifest.engineState,
      hasScene: manifest.sceneTree,
      sceneNodeCount: manifest.resources, // 临时使用resources作为节点计数
      hasScripts: manifest.scriptSystem,
      hasAnimations: manifest.animationSystem,
      estimatedExportSize: estimatedSize
    }
  } catch (error) {
    return {
      hasEngine: false,
      hasScene: false,
      sceneNodeCount: 0,
      hasScripts: false,
      hasAnimations: false,
      estimatedExportSize: 0
    }
  }
}

/**
 * 显示项目导出帮助信息
 */
export function showProjectExportHelp(): void {
  const helpText = `
🎮 QAQ引擎项目导出系统使用指南:

📦 完整导出:
  window.exportFullProject()                    // 导出完整项目
  window.exportFullProject({fileName: 'my.json'}) // 自定义文件名

📥 项目导入:
  window.importFullProject()                    // 导入完整项目
  window.restoreProjectBackup()                 // 恢复备份

🚀 快速操作:
  window.quickExportProject()                   // 快速导出（仅核心数据）
  window.createProjectBackup()                  // 创建备份
  window.exportProjectTemplate('basic')         // 导出模板

🔍 验证和信息:
  window.validateProjectFile()                  // 验证项目文件
  window.getProjectExportManifest()             // 获取导出清单
  window.getCurrentProjectSummary()             // 获取项目摘要

💡 提示:
  - 完整导出包含引擎状态、场景、脚本、动画等所有数据
  - 快速导出仅包含核心场景数据，文件更小
  - 备份功能会自动添加时间戳
  - 模板导出不包含用户配置和资源文件
  - 所有操作都有进度回调和错误处理
  `
}

// ============================================================================
// 导出到全局（仅在浏览器环境中）
// ============================================================================

if (typeof window !== 'undefined' && window) {
  try {
    // 项目导出API
    (window as any).exportFullProject = exportFullProject
    (window as any).importFullProject = importFullProject
    (window as any).quickExportProject = quickExportProject
    (window as any).validateProjectFile = validateProjectFile
    (window as any).getProjectExportManifest = getProjectExportManifest
    (window as any).createProjectBackup = createProjectBackup
    (window as any).restoreProjectBackup = restoreProjectBackup
    (window as any).exportProjectTemplate = exportProjectTemplate
    (window as any).createProjectFromTemplate = createProjectFromTemplate
    (window as any).getCurrentProjectSummary = getCurrentProjectSummary
    (window as any).showProjectExportHelp = showProjectExportHelp
    
    // 项目导出器类
    (window as any).ProjectExporter = ProjectExporter
    
  } catch (error) {
    // 静默处理全局设置错误
  }
}

// 函数已在定义时导出，无需重复导出
