/**
 * QAQ游戏引擎 - 场景管理服务
 * 
 * 功能说明：
 * - 处理场景的创建、保存、加载、删除操作
 * - 管理场景节点的层次结构
 * - 处理场景数据的序列化和反序列化
 * - 提供场景列表和搜索功能
 * 
 * 作者：QAQ游戏引擎团队
 * 创建时间：2024年
 */

import { prismaManager } from '~/lib/prisma'
import type { PrismaClient, Scene, SceneNode, Prisma } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

/**
 * 场景创建参数接口
 */
export interface CreateSceneParams {
  /** 场景名称 */
  name: string
  /** 场景文件路径 */
  path: string
  /** 场景类型 */
  type: '2d' | '3d' | 'ui'
  /** 场景描述（可选） */
  description?: string
  /** 是否为主场景（可选） */
  isMain?: boolean
}

/**
 * 场景节点数据接口
 */
export interface SceneNodeData {
  /** 节点UUID */
  uuid: string
  /** 节点名称 */
  name: string
  /** 节点类型 */
  type: string
  /** 父节点UUID（可选） */
  parentId?: string
  /** 节点位置 */
  position: { x: number; y: number; z: number }
  /** 节点旋转 */
  rotation: { x: number; y: number; z: number }
  /** 节点缩放 */
  scale: { x: number; y: number; z: number }
  /** 节点是否可见 */
  visible: boolean
  /** 节点属性 */
  properties: Record<string, any>
  /** 子节点列表 */
  children?: SceneNodeData[]
}

/**
 * 场景保存参数接口
 */
export interface SaveSceneParams {
  /** 场景名称 */
  name: string
  /** 场景文件路径 */
  path: string
  /** 场景类型 */
  type: '2d' | '3d' | 'ui'
  /** 场景描述（可选） */
  description?: string
  /** 场景树数据 */
  sceneTree: any
  /** 场景节点列表 */
  nodes: SceneNodeData[]
}

/**
 * 场景查询结果接口（包含节点数据）
 */
export interface SceneWithNodes extends Scene {
  /** 场景节点列表 */
  nodes: SceneNode[]
}

/**
 * 场景管理服务类
 * 提供场景相关的所有数据库操作
 */
export class SceneService {
  /**
   * 创建新场景
   * 
   * @param projectPath 项目路径
   * @param params 场景创建参数
   * @returns Promise<Scene> 创建的场景对象
   * @throws Error 当场景创建失败时抛出错误
   */
  async createScene(projectPath: string, params: CreateSceneParams): Promise<Scene> {
    console.log(`🎬 开始创建场景: ${params.name}`)
    
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      // 获取项目信息
      const project = await client.project.findFirst({
        where: { path: projectPath }
      })

      if (!project) {
        throw new Error(`项目不存在: ${projectPath}`)
      }

      // 检查场景路径是否已存在
      const existingScene = await client.scene.findFirst({
        where: {
          projectId: project.id,
          path: params.path
        }
      })

      if (existingScene) {
        throw new Error(`场景路径已存在: ${params.path}`)
      }

      // 创建场景记录
      const scene = await client.scene.create({
        data: {
          name: params.name,
          path: params.path,
          type: params.type,
          description: params.description || '',
          isMain: params.isMain || false,
          projectId: project.id,
          sceneData: {
            version: '1.0.0',
            created: new Date().toISOString(),
            nodes: []
          }
        }
      })

      console.log(`✅ 场景创建成功: ${scene.name} (ID: ${scene.id})`)
      return scene

    } catch (error) {
      console.error(`❌ 场景创建失败: ${params.name}`, error)
      throw new Error(`场景创建失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 保存场景数据
   * 
   * @param projectPath 项目路径
   * @param params 场景保存参数
   * @returns Promise<Scene> 保存的场景对象
   * @throws Error 当场景保存失败时抛出错误
   */
  async saveScene(projectPath: string, params: SaveSceneParams): Promise<Scene> {
    console.log(`💾 开始保存场景: ${params.name}`)
    
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      // 获取项目信息
      const project = await client.project.findFirst({
        where: { path: projectPath }
      })

      if (!project) {
        throw new Error(`项目不存在: ${projectPath}`)
      }

      // 使用事务确保数据一致性
      const result = await client.$transaction(async (tx) => {
        // 更新或创建场景记录
        const scene = await tx.scene.upsert({
          where: {
            projectId_path: {
              projectId: project.id,
              path: params.path
            }
          },
          update: {
            name: params.name,
            type: params.type,
            description: params.description,
            sceneData: params.sceneTree,
            updatedAt: new Date()
          },
          create: {
            name: params.name,
            path: params.path,
            type: params.type,
            description: params.description || '',
            projectId: project.id,
            sceneData: params.sceneTree
          }
        })

        // 删除现有的场景节点
        await tx.sceneNode.deleteMany({
          where: { sceneId: scene.id }
        })

        // 保存新的场景节点
        if (params.nodes && params.nodes.length > 0) {
          await this.saveSceneNodes(tx, scene.id, params.nodes)
        }

        return scene
      })

      console.log(`✅ 场景保存成功: ${result.name}`)
      return result

    } catch (error) {
      console.error(`❌ 场景保存失败: ${params.name}`, error)
      throw new Error(`场景保存失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 加载场景数据
   * 
   * @param projectPath 项目路径
   * @param scenePath 场景文件路径
   * @returns Promise<SceneWithNodes | null> 场景对象（包含节点数据）
   */
  async loadScene(projectPath: string, scenePath: string): Promise<SceneWithNodes | null> {
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      const scene = await client.scene.findFirst({
        where: { path: scenePath },
        include: {
          nodes: {
            orderBy: { createdAt: 'asc' }
          }
        }
      })

      if (scene) {
        console.log(`📖 场景加载成功: ${scene.name}`)
      }

      return scene as SceneWithNodes | null

    } catch (error) {
      console.error(`❌ 场景加载失败: ${scenePath}`, error)
      return null
    }
  }

  /**
   * 获取项目的所有场景
   * 
   * @param projectPath 项目路径
   * @returns Promise<Scene[]> 场景列表
   */
  async getScenes(projectPath: string): Promise<Scene[]> {
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      const scenes = await client.scene.findMany({
        orderBy: [
          { isMain: 'desc' }, // 主场景排在前面
          { updatedAt: 'desc' }
        ]
      })

      console.log(`📋 获取场景列表: ${scenes.length} 个场景`)
      return scenes

    } catch (error) {
      console.error(`❌ 获取场景列表失败: ${projectPath}`, error)
      return []
    }
  }

  /**
   * 删除场景
   * 
   * @param projectPath 项目路径
   * @param scenePath 场景文件路径
   * @returns Promise<boolean> 删除是否成功
   */
  async deleteScene(projectPath: string, scenePath: string): Promise<boolean> {
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      const result = await client.scene.deleteMany({
        where: { path: scenePath }
      })

      if (result.count > 0) {
        console.log(`🗑️ 场景删除成功: ${scenePath}`)
        return true
      }

      return false

    } catch (error) {
      console.error(`❌ 场景删除失败: ${scenePath}`, error)
      return false
    }
  }

  /**
   * 设置主场景
   * 
   * @param projectPath 项目路径
   * @param scenePath 场景文件路径
   * @returns Promise<boolean> 设置是否成功
   */
  async setMainScene(projectPath: string, scenePath: string): Promise<boolean> {
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      await client.$transaction(async (tx) => {
        // 清除所有场景的主场景标记
        await tx.scene.updateMany({
          data: { isMain: false }
        })

        // 设置指定场景为主场景
        await tx.scene.updateMany({
          where: { path: scenePath },
          data: { isMain: true }
        })
      })

      console.log(`🎯 主场景设置成功: ${scenePath}`)
      return true

    } catch (error) {
      console.error(`❌ 主场景设置失败: ${scenePath}`, error)
      return false
    }
  }

  /**
   * 复制场景
   * 
   * @param projectPath 项目路径
   * @param sourcePath 源场景路径
   * @param targetPath 目标场景路径
   * @param newName 新场景名称
   * @returns Promise<Scene | null> 复制的场景对象
   */
  async duplicateScene(projectPath: string, sourcePath: string, targetPath: string, newName: string): Promise<Scene | null> {
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      // 加载源场景
      const sourceScene = await this.loadScene(projectPath, sourcePath)
      if (!sourceScene) {
        throw new Error(`源场景不存在: ${sourcePath}`)
      }

      // 创建新场景
      const newScene = await this.createScene(projectPath, {
        name: newName,
        path: targetPath,
        type: sourceScene.type as '2d' | '3d' | 'ui',
        description: `复制自: ${sourceScene.name}`
      })

      // 复制场景数据
      if (sourceScene.nodes.length > 0) {
        const nodeData: SceneNodeData[] = sourceScene.nodes.map(node => ({
          uuid: uuidv4(), // 生成新的UUID
          name: node.name,
          type: node.type,
          parentId: node.parentId || undefined,
          position: node.position as { x: number; y: number; z: number },
          rotation: node.rotation as { x: number; y: number; z: number },
          scale: node.scale as { x: number; y: number; z: number },
          visible: node.visible,
          properties: node.properties as Record<string, any>
        }))

        await this.saveScene(projectPath, {
          name: newName,
          path: targetPath,
          type: sourceScene.type as '2d' | '3d' | 'ui',
          description: `复制自: ${sourceScene.name}`,
          sceneTree: sourceScene.sceneData,
          nodes: nodeData
        })
      }

      console.log(`📋 场景复制成功: ${sourcePath} -> ${targetPath}`)
      return newScene

    } catch (error) {
      console.error(`❌ 场景复制失败: ${sourcePath} -> ${targetPath}`, error)
      return null
    }
  }

  // ========================================================================
  // 私有辅助方法
  // ========================================================================

  /**
   * 递归保存场景节点
   * 
   * @param tx 事务客户端
   * @param sceneId 场景ID
   * @param nodes 节点数据列表
   */
  private async saveSceneNodes(tx: any, sceneId: string, nodes: SceneNodeData[]): Promise<void> {
    for (const nodeData of nodes) {
      await tx.sceneNode.create({
        data: {
          uuid: nodeData.uuid,
          name: nodeData.name,
          type: nodeData.type,
          sceneId: sceneId,
          parentId: nodeData.parentId || null,
          position: nodeData.position,
          rotation: nodeData.rotation,
          scale: nodeData.scale,
          visible: nodeData.visible,
          properties: nodeData.properties
        }
      })
    }
  }
}

/**
 * 导出场景服务单例实例
 */
export const sceneService = new SceneService()
