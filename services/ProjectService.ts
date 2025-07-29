/**
 * QAQ游戏引擎 - 项目管理服务
 * 
 * 功能说明：
 * - 处理项目的创建、读取、更新、删除操作
 * - 管理项目设置和元数据
 * - 提供项目列表和搜索功能
 * - 处理项目的导入和导出
 * 
 * 作者：QAQ游戏引擎团队
 * 创建时间：2024年
 */

import { prismaManager } from '~/lib/prisma'
import type { PrismaClient, Project, Prisma } from '@prisma/client'
import path from 'path'
import fs from 'fs'

/**
 * 项目创建参数接口
 */
export interface CreateProjectParams {
  /** 项目名称 */
  name: string
  /** 项目路径 */
  path: string
  /** 项目描述（可选） */
  description?: string
  /** 项目版本（可选，默认1.0.0） */
  version?: string
  /** 项目类型（可选，默认3d） */
  type?: '2d' | '3d' | 'ui'
  /** 项目设置（可选） */
  settings?: Record<string, any>
}

/**
 * 项目更新参数接口
 */
export interface UpdateProjectParams {
  /** 项目名称 */
  name?: string
  /** 项目描述 */
  description?: string
  /** 项目版本 */
  version?: string
  /** 项目设置 */
  settings?: Record<string, any>
}

/**
 * 项目查询结果接口（包含关联数据）
 */
export interface ProjectWithRelations extends Project {
  /** 场景列表 */
  scenes?: Array<{
    id: string
    name: string
    path: string
    type: string
    updatedAt: Date
  }>
  /** 脚本列表 */
  scripts?: Array<{
    id: string
    name: string
    path: string
    language: string
    updatedAt: Date
  }>
  /** 材质列表 */
  materials?: Array<{
    id: string
    name: string
    type: string
    updatedAt: Date
  }>
}

/**
 * 项目管理服务类
 * 提供项目相关的所有数据库操作
 */
export class ProjectService {
  /**
   * 创建新项目
   * 
   * @param params 项目创建参数
   * @returns Promise<Project> 创建的项目对象
   * @throws Error 当项目创建失败时抛出错误
   */
  async createProject(params: CreateProjectParams): Promise<Project> {
    console.log(`🚀 开始创建项目: ${params.name}`)
    
    try {
      // 获取项目特定的数据库客户端
      const client = await prismaManager.getProjectClient(params.path)
      
      // 检查项目是否已存在
      const existingProject = await client.project.findFirst({
        where: { path: params.path }
      })

      if (existingProject) {
        throw new Error(`项目已存在: ${params.path}`)
      }

      // 创建项目目录结构
      await this.createProjectDirectories(params.path)

      // 准备项目数据
      const projectData: Prisma.ProjectCreateInput = {
        name: params.name,
        description: params.description || '',
        path: params.path,
        version: params.version || '1.0.0',
        engineVersion: '1.0.0',
        settings: params.settings || {
          projectType: params.type || '3d',
          renderPipeline: '3d',
          physics: 'enabled',
          audio: 'enabled',
          defaultScene: 'Scene1',
          autoSave: true,
          autoSaveInterval: 300000 // 5分钟
        }
      }

      // 创建项目记录
      const project = await client.project.create({
        data: projectData
      })

      // 设置为当前活动项目
      prismaManager.setCurrentProject(params.path)

      console.log(`✅ 项目创建成功: ${project.name} (ID: ${project.id})`)
      return project

    } catch (error) {
      console.error(`❌ 项目创建失败: ${params.name}`, error)
      throw new Error(`项目创建失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 获取项目信息
   * 
   * @param projectPath 项目路径
   * @param includeRelations 是否包含关联数据（场景、脚本等）
   * @returns Promise<ProjectWithRelations | null> 项目对象或null
   */
  async getProject(projectPath: string, includeRelations: boolean = false): Promise<ProjectWithRelations | null> {
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      const project = await client.project.findFirst({
        where: { path: projectPath },
        include: includeRelations ? {
          scenes: {
            select: {
              id: true,
              name: true,
              path: true,
              type: true,
              updatedAt: true
            },
            orderBy: { updatedAt: 'desc' }
          },
          scripts: {
            select: {
              id: true,
              name: true,
              path: true,
              language: true,
              updatedAt: true
            },
            orderBy: { updatedAt: 'desc' }
          },
          materials: {
            select: {
              id: true,
              name: true,
              type: true,
              updatedAt: true
            },
            orderBy: { name: 'asc' }
          }
        } : undefined
      })

      if (project) {
        console.log(`📖 获取项目信息: ${project.name}`)
      }

      return project as ProjectWithRelations | null

    } catch (error) {
      console.error(`❌ 获取项目失败: ${projectPath}`, error)
      return null
    }
  }

  /**
   * 更新项目信息
   * 
   * @param projectPath 项目路径
   * @param params 更新参数
   * @returns Promise<Project | null> 更新后的项目对象
   */
  async updateProject(projectPath: string, params: UpdateProjectParams): Promise<Project | null> {
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      // 准备更新数据
      const updateData: Prisma.ProjectUpdateInput = {
        ...(params.name && { name: params.name }),
        ...(params.description !== undefined && { description: params.description }),
        ...(params.version && { version: params.version }),
        ...(params.settings && { settings: params.settings }),
        updatedAt: new Date()
      }

      const project = await client.project.updateMany({
        where: { path: projectPath },
        data: updateData
      })

      if (project.count > 0) {
        console.log(`✅ 项目更新成功: ${projectPath}`)
        // 返回更新后的项目数据
        return this.getProject(projectPath)
      }

      return null

    } catch (error) {
      console.error(`❌ 项目更新失败: ${projectPath}`, error)
      throw new Error(`项目更新失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 删除项目
   * 注意：这只会删除数据库记录，不会删除项目文件
   * 
   * @param projectPath 项目路径
   * @returns Promise<boolean> 删除是否成功
   */
  async deleteProject(projectPath: string): Promise<boolean> {
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      const result = await client.project.deleteMany({
        where: { path: projectPath }
      })

      if (result.count > 0) {
        console.log(`🗑️ 项目删除成功: ${projectPath}`)
        
        // 关闭数据库连接
        await prismaManager.closeProjectConnection(projectPath)
        
        return true
      }

      return false

    } catch (error) {
      console.error(`❌ 项目删除失败: ${projectPath}`, error)
      return false
    }
  }

  /**
   * 获取当前活动项目
   * 
   * @returns Promise<ProjectWithRelations | null> 当前项目对象
   */
  async getCurrentProject(): Promise<ProjectWithRelations | null> {
    try {
      const client = await prismaManager.getCurrentClient()
      
      if (!client) {
        console.warn('⚠️ 没有当前活动项目')
        return null
      }

      const project = await client.project.findFirst({
        include: {
          scenes: {
            select: {
              id: true,
              name: true,
              path: true,
              type: true,
              updatedAt: true
            },
            orderBy: { updatedAt: 'desc' }
          },
          scripts: {
            select: {
              id: true,
              name: true,
              path: true,
              language: true,
              updatedAt: true
            },
            orderBy: { updatedAt: 'desc' }
          }
        }
      })

      return project as ProjectWithRelations | null

    } catch (error) {
      console.error('❌ 获取当前项目失败', error)
      return null
    }
  }

  /**
   * 更新项目设置
   * 
   * @param projectPath 项目路径
   * @param settings 新的设置对象
   * @returns Promise<boolean> 更新是否成功
   */
  async updateProjectSettings(projectPath: string, settings: Record<string, any>): Promise<boolean> {
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      const result = await client.project.updateMany({
        where: { path: projectPath },
        data: {
          settings: settings,
          updatedAt: new Date()
        }
      })

      if (result.count > 0) {
        console.log(`⚙️ 项目设置更新成功: ${projectPath}`)
        return true
      }

      return false

    } catch (error) {
      console.error(`❌ 项目设置更新失败: ${projectPath}`, error)
      return false
    }
  }

  /**
   * 检查项目是否存在
   * 
   * @param projectPath 项目路径
   * @returns Promise<boolean> 项目是否存在
   */
  async projectExists(projectPath: string): Promise<boolean> {
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      const project = await client.project.findFirst({
        where: { path: projectPath },
        select: { id: true }
      })

      return !!project

    } catch (error) {
      console.error(`❌ 检查项目存在性失败: ${projectPath}`, error)
      return false
    }
  }

  // ========================================================================
  // 私有辅助方法
  // ========================================================================

  /**
   * 创建项目目录结构
   * 
   * @param projectPath 项目路径
   */
  private async createProjectDirectories(projectPath: string): Promise<void> {
    const directories = [
      projectPath,
      path.join(projectPath, '.qaq'),      // QAQ引擎配置目录
      path.join(projectPath, 'scenes'),    // 场景文件目录
      path.join(projectPath, 'scripts'),   // 脚本文件目录
      path.join(projectPath, 'materials'), // 材质文件目录
      path.join(projectPath, 'textures'),  // 纹理文件目录
      path.join(projectPath, 'models'),    // 模型文件目录
      path.join(projectPath, 'audio'),     // 音频文件目录
      path.join(projectPath, 'fonts'),     // 字体文件目录
      path.join(projectPath, 'data'),      // 数据文件目录
    ]

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        console.log(`📁 创建目录: ${dir}`)
      }
    }
  }
}

/**
 * 导出项目服务单例实例
 */
export const projectService = new ProjectService()
