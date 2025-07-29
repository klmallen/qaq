/**
 * QAQ游戏引擎 - 数据库配置和便捷函数
 *
 * 功能说明：
 * - 提供数据库操作的便捷函数
 * - 集成各种服务类的功能
 * - 向后兼容原有的API接口
 *
 * 作者：QAQ游戏引擎团队
 * 创建时间：2024年
 */

import { prismaManager } from './prisma'
import { projectService } from '~/services/ProjectService'
import { sceneService } from '~/services/SceneService'
import { scriptService } from '~/services/ScriptService'
import { materialService } from '~/services/MaterialService'

// 重新导出PrismaManager作为DatabaseManager以保持向后兼容
export { PrismaManager as DatabaseManager } from './prisma'

// ============================================================================
// 便捷函数 - 项目管理
// ============================================================================

/**
 * 初始化项目数据库
 *
 * @param projectPath 项目路径
 * @param projectData 项目数据
 * @returns Promise<Project> 创建的项目对象
 */
export async function initializeProjectDatabase(projectPath: string, projectData: {
  name: string
  description?: string
  version?: string
  type?: '2d' | '3d' | 'ui'
}) {
  console.log(`🚀 初始化项目数据库: ${projectData.name}`)

  try {
    const project = await projectService.createProject({
      name: projectData.name,
      path: projectPath,
      description: projectData.description,
      version: projectData.version,
      type: projectData.type
    })

    console.log(`✅ 项目数据库初始化成功: ${project.name}`)
    return project
  } catch (error) {
    console.error('❌ 项目数据库初始化失败:', error)
    throw error
  }
}

/**
 * 获取当前项目数据
 *
 * @returns Promise<Project | null> 当前项目对象
 */
export async function getCurrentProject() {
  try {
    const project = await projectService.getCurrentProject()
    if (project) {
      console.log(`📖 获取当前项目: ${project.name}`)
    }
    return project
  } catch (error) {
    console.error('❌ 获取当前项目失败:', error)
    return null
  }
}

// ============================================================================
// 便捷函数 - 场景管理
// ============================================================================

/**
 * 保存场景到数据库
 *
 * @param projectPath 项目路径
 * @param sceneData 场景数据
 * @returns Promise<Scene> 保存的场景对象
 */
export async function saveSceneToDatabase(projectPath: string, sceneData: {
  name: string
  path: string
  type: '2d' | '3d' | 'ui'
  sceneData: any
  nodes: any[]
}) {
  console.log(`💾 保存场景到数据库: ${sceneData.name}`)

  try {
    const scene = await sceneService.saveScene(projectPath, {
      name: sceneData.name,
      path: sceneData.path,
      type: sceneData.type,
      sceneTree: sceneData.sceneData,
      nodes: sceneData.nodes
    })

    console.log(`✅ 场景保存成功: ${scene.name}`)
    return scene
  } catch (error) {
    console.error('❌ 场景保存失败:', error)
    throw error
  }
}

// ============================================================================
// 便捷函数 - 脚本管理
// ============================================================================

/**
 * 保存脚本到数据库
 *
 * @param projectPath 项目路径
 * @param scriptData 脚本数据
 * @returns Promise<Script | null> 保存的脚本对象
 */
export async function saveScriptToDatabase(projectPath: string, scriptData: {
  name: string
  path: string
  content: string
  language?: string
}) {
  console.log(`💾 保存脚本到数据库: ${scriptData.name}`)

  try {
    const script = await scriptService.saveScript(projectPath, scriptData.path, scriptData.content)
    if (script) {
      console.log(`✅ 脚本保存成功: ${script.name}`)
    }
    return script
  } catch (error) {
    console.error('❌ 脚本保存失败:', error)
    return null
  }
}

// ============================================================================
// 便捷函数 - 材质管理
// ============================================================================

/**
 * 保存材质到数据库
 *
 * @param projectPath 项目路径
 * @param materialData 材质数据
 * @returns Promise<Material | null> 保存的材质对象
 */
export async function saveMaterialToDatabase(projectPath: string, materialData: {
  name: string
  type: string
  properties: Record<string, any>
}) {
  console.log(`💾 保存材质到数据库: ${materialData.name}`)

  try {
    const material = await materialService.saveMaterial(projectPath, materialData.name, materialData.properties)
    if (material) {
      console.log(`✅ 材质保存成功: ${material.name}`)
    }
    return material
  } catch (error) {
    console.error('❌ 材质保存失败:', error)
    return null
  }
}

// ============================================================================
// 导出服务实例和管理器
// ============================================================================

export const dbManager = prismaManager
export { projectService, sceneService, scriptService, materialService }
