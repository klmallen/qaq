/**
 * QAQ游戏引擎 - 脚本管理服务
 * 
 * 功能说明：
 * - 处理脚本文件的创建、保存、加载、删除操作
 * - 支持多种脚本语言（TypeScript、JavaScript、GDScript等）
 * - 提供脚本模板和代码片段功能
 * - 管理脚本的版本历史和备份
 * 
 * 作者：QAQ游戏引擎团队
 * 创建时间：2024年
 */

import { prismaManager } from '~/lib/prisma'
import type { PrismaClient, Script, Prisma } from '@prisma/client'
import path from 'path'
import fs from 'fs'

/**
 * 支持的脚本语言类型
 */
export type ScriptLanguage = 'typescript' | 'javascript' | 'gdscript' | 'python' | 'lua'

/**
 * 脚本创建参数接口
 */
export interface CreateScriptParams {
  /** 脚本名称 */
  name: string
  /** 脚本文件路径 */
  path: string
  /** 脚本语言 */
  language: ScriptLanguage
  /** 脚本内容（可选，默认为模板内容） */
  content?: string
  /** 脚本描述（可选） */
  description?: string
  /** 是否为模板脚本（可选） */
  isTemplate?: boolean
}

/**
 * 脚本更新参数接口
 */
export interface UpdateScriptParams {
  /** 脚本名称 */
  name?: string
  /** 脚本内容 */
  content?: string
  /** 脚本描述 */
  description?: string
  /** 脚本语言 */
  language?: ScriptLanguage
}

/**
 * 脚本搜索参数接口
 */
export interface SearchScriptsParams {
  /** 搜索关键词 */
  keyword?: string
  /** 脚本语言过滤 */
  language?: ScriptLanguage
  /** 是否只搜索模板 */
  templatesOnly?: boolean
  /** 排序方式 */
  sortBy?: 'name' | 'updatedAt' | 'createdAt'
  /** 排序顺序 */
  sortOrder?: 'asc' | 'desc'
}

/**
 * 脚本模板定义
 */
interface ScriptTemplate {
  /** 模板名称 */
  name: string
  /** 模板描述 */
  description: string
  /** 模板内容 */
  content: string
}

/**
 * 脚本管理服务类
 * 提供脚本相关的所有数据库操作
 */
export class ScriptService {
  /** 脚本模板缓存 */
  private templates: Map<ScriptLanguage, ScriptTemplate[]> = new Map()

  constructor() {
    this.initializeTemplates()
  }

  /**
   * 创建新脚本
   * 
   * @param projectPath 项目路径
   * @param params 脚本创建参数
   * @returns Promise<Script> 创建的脚本对象
   * @throws Error 当脚本创建失败时抛出错误
   */
  async createScript(projectPath: string, params: CreateScriptParams): Promise<Script> {
    console.log(`📝 开始创建脚本: ${params.name}`)
    
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      // 获取项目信息
      const project = await client.project.findFirst({
        where: { path: projectPath }
      })

      if (!project) {
        throw new Error(`项目不存在: ${projectPath}`)
      }

      // 检查脚本路径是否已存在
      const existingScript = await client.script.findFirst({
        where: {
          projectId: project.id,
          path: params.path
        }
      })

      if (existingScript) {
        throw new Error(`脚本路径已存在: ${params.path}`)
      }

      // 获取脚本内容（如果未提供则使用模板）
      const content = params.content || this.getTemplateContent(params.language, 'basic')

      // 创建脚本记录
      const script = await client.script.create({
        data: {
          name: params.name,
          path: params.path,
          language: params.language,
          content: content,
          description: params.description || '',
          isTemplate: params.isTemplate || false,
          projectId: project.id
        }
      })

      console.log(`✅ 脚本创建成功: ${script.name} (ID: ${script.id})`)
      return script

    } catch (error) {
      console.error(`❌ 脚本创建失败: ${params.name}`, error)
      throw new Error(`脚本创建失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 保存脚本内容
   * 
   * @param projectPath 项目路径
   * @param scriptPath 脚本文件路径
   * @param content 脚本内容
   * @returns Promise<Script | null> 保存的脚本对象
   */
  async saveScript(projectPath: string, scriptPath: string, content: string): Promise<Script | null> {
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      const result = await client.script.updateMany({
        where: { path: scriptPath },
        data: {
          content: content,
          updatedAt: new Date()
        }
      })

      if (result.count > 0) {
        console.log(`💾 脚本保存成功: ${scriptPath}`)
        
        // 返回更新后的脚本对象
        return await client.script.findFirst({
          where: { path: scriptPath }
        })
      }

      return null

    } catch (error) {
      console.error(`❌ 脚本保存失败: ${scriptPath}`, error)
      return null
    }
  }

  /**
   * 加载脚本内容
   * 
   * @param projectPath 项目路径
   * @param scriptPath 脚本文件路径
   * @returns Promise<Script | null> 脚本对象
   */
  async loadScript(projectPath: string, scriptPath: string): Promise<Script | null> {
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      const script = await client.script.findFirst({
        where: { path: scriptPath }
      })

      if (script) {
        console.log(`📖 脚本加载成功: ${script.name}`)
      }

      return script

    } catch (error) {
      console.error(`❌ 脚本加载失败: ${scriptPath}`, error)
      return null
    }
  }

  /**
   * 更新脚本信息
   * 
   * @param projectPath 项目路径
   * @param scriptPath 脚本文件路径
   * @param params 更新参数
   * @returns Promise<Script | null> 更新后的脚本对象
   */
  async updateScript(projectPath: string, scriptPath: string, params: UpdateScriptParams): Promise<Script | null> {
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      // 准备更新数据
      const updateData: Prisma.ScriptUpdateInput = {
        ...(params.name && { name: params.name }),
        ...(params.content !== undefined && { content: params.content }),
        ...(params.description !== undefined && { description: params.description }),
        ...(params.language && { language: params.language }),
        updatedAt: new Date()
      }

      const result = await client.script.updateMany({
        where: { path: scriptPath },
        data: updateData
      })

      if (result.count > 0) {
        console.log(`✅ 脚本更新成功: ${scriptPath}`)
        
        // 返回更新后的脚本对象
        return await client.script.findFirst({
          where: { path: scriptPath }
        })
      }

      return null

    } catch (error) {
      console.error(`❌ 脚本更新失败: ${scriptPath}`, error)
      return null
    }
  }

  /**
   * 获取项目的所有脚本
   * 
   * @param projectPath 项目路径
   * @param params 搜索参数（可选）
   * @returns Promise<Script[]> 脚本列表
   */
  async getScripts(projectPath: string, params?: SearchScriptsParams): Promise<Script[]> {
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      // 构建查询条件
      const where: Prisma.ScriptWhereInput = {}
      
      if (params?.keyword) {
        where.OR = [
          { name: { contains: params.keyword } },
          { description: { contains: params.keyword } },
          { content: { contains: params.keyword } }
        ]
      }
      
      if (params?.language) {
        where.language = params.language
      }
      
      if (params?.templatesOnly) {
        where.isTemplate = true
      }

      // 构建排序条件
      const orderBy: Prisma.ScriptOrderByWithRelationInput = {}
      const sortBy = params?.sortBy || 'updatedAt'
      const sortOrder = params?.sortOrder || 'desc'
      orderBy[sortBy] = sortOrder

      const scripts = await client.script.findMany({
        where,
        orderBy
      })

      console.log(`📋 获取脚本列表: ${scripts.length} 个脚本`)
      return scripts

    } catch (error) {
      console.error(`❌ 获取脚本列表失败: ${projectPath}`, error)
      return []
    }
  }

  /**
   * 删除脚本
   * 
   * @param projectPath 项目路径
   * @param scriptPath 脚本文件路径
   * @returns Promise<boolean> 删除是否成功
   */
  async deleteScript(projectPath: string, scriptPath: string): Promise<boolean> {
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      const result = await client.script.deleteMany({
        where: { path: scriptPath }
      })

      if (result.count > 0) {
        console.log(`🗑️ 脚本删除成功: ${scriptPath}`)
        return true
      }

      return false

    } catch (error) {
      console.error(`❌ 脚本删除失败: ${scriptPath}`, error)
      return false
    }
  }

  /**
   * 复制脚本
   * 
   * @param projectPath 项目路径
   * @param sourcePath 源脚本路径
   * @param targetPath 目标脚本路径
   * @param newName 新脚本名称
   * @returns Promise<Script | null> 复制的脚本对象
   */
  async duplicateScript(projectPath: string, sourcePath: string, targetPath: string, newName: string): Promise<Script | null> {
    try {
      // 加载源脚本
      const sourceScript = await this.loadScript(projectPath, sourcePath)
      if (!sourceScript) {
        throw new Error(`源脚本不存在: ${sourcePath}`)
      }

      // 创建新脚本
      const newScript = await this.createScript(projectPath, {
        name: newName,
        path: targetPath,
        language: sourceScript.language as ScriptLanguage,
        content: sourceScript.content,
        description: `复制自: ${sourceScript.name}`
      })

      console.log(`📋 脚本复制成功: ${sourcePath} -> ${targetPath}`)
      return newScript

    } catch (error) {
      console.error(`❌ 脚本复制失败: ${sourcePath} -> ${targetPath}`, error)
      return null
    }
  }

  /**
   * 获取脚本模板列表
   * 
   * @param language 脚本语言
   * @returns ScriptTemplate[] 模板列表
   */
  getTemplates(language: ScriptLanguage): ScriptTemplate[] {
    return this.templates.get(language) || []
  }

  /**
   * 获取模板内容
   * 
   * @param language 脚本语言
   * @param templateName 模板名称
   * @returns string 模板内容
   */
  getTemplateContent(language: ScriptLanguage, templateName: string): string {
    const templates = this.templates.get(language) || []
    const template = templates.find(t => t.name === templateName)
    return template?.content || this.getDefaultTemplate(language)
  }

  // ========================================================================
  // 私有辅助方法
  // ========================================================================

  /**
   * 初始化脚本模板
   */
  private initializeTemplates(): void {
    // TypeScript模板
    this.templates.set('typescript', [
      {
        name: 'basic',
        description: '基础TypeScript脚本',
        content: `/**
 * QAQ游戏引擎脚本
 * 创建时间: ${new Date().toISOString()}
 */

export class MyScript {
  constructor() {
    console.log('脚本已初始化')
  }

  update(deltaTime: number): void {
    // 每帧更新逻辑
  }

  onDestroy(): void {
    // 清理逻辑
  }
}`
      },
      {
        name: 'node',
        description: '节点脚本模板',
        content: `import { Node3D } from '~/core/nodes/Node3D'

export class NodeScript extends Node3D {
  ready(): void {
    // 节点准备完成时调用
    console.log('节点已准备就绪:', this.name)
  }

  process(delta: number): void {
    // 每帧处理逻辑
  }
}`
      }
    ])

    // JavaScript模板
    this.templates.set('javascript', [
      {
        name: 'basic',
        description: '基础JavaScript脚本',
        content: `/**
 * QAQ游戏引擎脚本
 * 创建时间: ${new Date().toISOString()}
 */

class MyScript {
  constructor() {
    console.log('脚本已初始化')
  }

  update(deltaTime) {
    // 每帧更新逻辑
  }

  onDestroy() {
    // 清理逻辑
  }
}

export default MyScript`
      }
    ])

    // GDScript模板
    this.templates.set('gdscript', [
      {
        name: 'basic',
        description: '基础GDScript脚本',
        content: `extends Node

# QAQ游戏引擎脚本
# 创建时间: ${new Date().toISOString()}

func _ready():
    print("脚本已初始化")

func _process(delta):
    # 每帧更新逻辑
    pass`
      }
    ])
  }

  /**
   * 获取默认模板内容
   * 
   * @param language 脚本语言
   * @returns string 默认模板内容
   */
  private getDefaultTemplate(language: ScriptLanguage): string {
    const templates = this.templates.get(language)
    return templates?.[0]?.content || `// ${language} 脚本\n// 创建时间: ${new Date().toISOString()}\n\nconsole.log('Hello, QAQ Game Engine!')`
  }
}

/**
 * 导出脚本服务单例实例
 */
export const scriptService = new ScriptService()
