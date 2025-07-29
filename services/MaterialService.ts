/**
 * QAQ游戏引擎 - 材质管理服务
 * 
 * 功能说明：
 * - 处理材质的创建、保存、加载、删除操作
 * - 支持多种材质类型（Basic、Lambert、Phong、Standard、Physical）
 * - 管理材质属性和纹理贴图
 * - 提供材质预设和模板功能
 * 
 * 作者：QAQ游戏引擎团队
 * 创建时间：2024年
 */

import { prismaManager } from '~/lib/prisma'
import type { PrismaClient, Material, Prisma } from '@prisma/client'

/**
 * 支持的材质类型
 */
export type MaterialType = 'basic' | 'lambert' | 'phong' | 'standard' | 'physical'

/**
 * 材质创建参数接口
 */
export interface CreateMaterialParams {
  /** 材质名称 */
  name: string
  /** 材质类型 */
  type: MaterialType
  /** 材质属性 */
  properties: MaterialProperties
}

/**
 * 材质属性接口
 */
export interface MaterialProperties {
  /** 基础颜色（十六进制） */
  albedo?: string
  /** 粗糙度 (0-1) */
  roughness?: number
  /** 金属度 (0-1) */
  metalness?: number
  /** 自发光颜色（十六进制） */
  emission?: string
  /** 透明度 (0-1) */
  opacity?: number
  /** 是否透明 */
  transparent?: boolean
  /** 纹理贴图路径 */
  textures?: {
    /** 基础颜色贴图 */
    albedoMap?: string
    /** 法线贴图 */
    normalMap?: string
    /** 粗糙度贴图 */
    roughnessMap?: string
    /** 金属度贴图 */
    metalnessMap?: string
    /** 自发光贴图 */
    emissionMap?: string
    /** 环境遮蔽贴图 */
    aoMap?: string
    /** 高度贴图 */
    heightMap?: string
  }
  /** 自定义着色器参数 */
  shaderParams?: Record<string, any>
}

/**
 * 材质更新参数接口
 */
export interface UpdateMaterialParams {
  /** 材质名称 */
  name?: string
  /** 材质类型 */
  type?: MaterialType
  /** 材质属性 */
  properties?: Partial<MaterialProperties>
}

/**
 * 材质搜索参数接口
 */
export interface SearchMaterialsParams {
  /** 搜索关键词 */
  keyword?: string
  /** 材质类型过滤 */
  type?: MaterialType
  /** 排序方式 */
  sortBy?: 'name' | 'type' | 'updatedAt' | 'createdAt'
  /** 排序顺序 */
  sortOrder?: 'asc' | 'desc'
}

/**
 * 材质预设定义
 */
interface MaterialPreset {
  /** 预设名称 */
  name: string
  /** 预设描述 */
  description: string
  /** 材质类型 */
  type: MaterialType
  /** 材质属性 */
  properties: MaterialProperties
}

/**
 * 材质管理服务类
 * 提供材质相关的所有数据库操作
 */
export class MaterialService {
  /** 材质预设缓存 */
  private presets: MaterialPreset[] = []

  constructor() {
    this.initializePresets()
  }

  /**
   * 创建新材质
   * 
   * @param projectPath 项目路径
   * @param params 材质创建参数
   * @returns Promise<Material> 创建的材质对象
   * @throws Error 当材质创建失败时抛出错误
   */
  async createMaterial(projectPath: string, params: CreateMaterialParams): Promise<Material> {
    console.log(`🎨 开始创建材质: ${params.name}`)
    
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      // 获取项目信息
      const project = await client.project.findFirst({
        where: { path: projectPath }
      })

      if (!project) {
        throw new Error(`项目不存在: ${projectPath}`)
      }

      // 检查材质名称是否已存在
      const existingMaterial = await client.material.findFirst({
        where: {
          projectId: project.id,
          name: params.name
        }
      })

      if (existingMaterial) {
        throw new Error(`材质名称已存在: ${params.name}`)
      }

      // 创建材质记录
      const material = await client.material.create({
        data: {
          name: params.name,
          type: params.type,
          projectId: project.id,
          albedo: params.properties.albedo || '#ffffff',
          roughness: params.properties.roughness ?? 0.5,
          metalness: params.properties.metalness ?? 0.0,
          emission: params.properties.emission || '#000000',
          albedoMap: params.properties.textures?.albedoMap,
          normalMap: params.properties.textures?.normalMap,
          roughnessMap: params.properties.textures?.roughnessMap,
          metalnessMap: params.properties.textures?.metalnessMap,
          emissionMap: params.properties.textures?.emissionMap,
          shaderCode: null, // 自定义着色器代码
          shaderParams: params.properties.shaderParams || {}
        }
      })

      console.log(`✅ 材质创建成功: ${material.name} (ID: ${material.id})`)
      return material

    } catch (error) {
      console.error(`❌ 材质创建失败: ${params.name}`, error)
      throw new Error(`材质创建失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 保存材质数据
   * 
   * @param projectPath 项目路径
   * @param materialName 材质名称
   * @param properties 材质属性
   * @returns Promise<Material | null> 保存的材质对象
   */
  async saveMaterial(projectPath: string, materialName: string, properties: MaterialProperties): Promise<Material | null> {
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      const result = await client.material.updateMany({
        where: { name: materialName },
        data: {
          albedo: properties.albedo,
          roughness: properties.roughness,
          metalness: properties.metalness,
          emission: properties.emission,
          albedoMap: properties.textures?.albedoMap,
          normalMap: properties.textures?.normalMap,
          roughnessMap: properties.textures?.roughnessMap,
          metalnessMap: properties.textures?.metalnessMap,
          emissionMap: properties.textures?.emissionMap,
          shaderParams: properties.shaderParams || {},
          updatedAt: new Date()
        }
      })

      if (result.count > 0) {
        console.log(`💾 材质保存成功: ${materialName}`)
        
        // 返回更新后的材质对象
        return await client.material.findFirst({
          where: { name: materialName }
        })
      }

      return null

    } catch (error) {
      console.error(`❌ 材质保存失败: ${materialName}`, error)
      return null
    }
  }

  /**
   * 加载材质数据
   * 
   * @param projectPath 项目路径
   * @param materialName 材质名称
   * @returns Promise<Material | null> 材质对象
   */
  async loadMaterial(projectPath: string, materialName: string): Promise<Material | null> {
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      const material = await client.material.findFirst({
        where: { name: materialName }
      })

      if (material) {
        console.log(`📖 材质加载成功: ${material.name}`)
      }

      return material

    } catch (error) {
      console.error(`❌ 材质加载失败: ${materialName}`, error)
      return null
    }
  }

  /**
   * 更新材质信息
   * 
   * @param projectPath 项目路径
   * @param materialName 材质名称
   * @param params 更新参数
   * @returns Promise<Material | null> 更新后的材质对象
   */
  async updateMaterial(projectPath: string, materialName: string, params: UpdateMaterialParams): Promise<Material | null> {
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      // 准备更新数据
      const updateData: Prisma.MaterialUpdateInput = {
        ...(params.name && { name: params.name }),
        ...(params.type && { type: params.type }),
        ...(params.properties?.albedo && { albedo: params.properties.albedo }),
        ...(params.properties?.roughness !== undefined && { roughness: params.properties.roughness }),
        ...(params.properties?.metalness !== undefined && { metalness: params.properties.metalness }),
        ...(params.properties?.emission && { emission: params.properties.emission }),
        ...(params.properties?.textures?.albedoMap && { albedoMap: params.properties.textures.albedoMap }),
        ...(params.properties?.textures?.normalMap && { normalMap: params.properties.textures.normalMap }),
        ...(params.properties?.textures?.roughnessMap && { roughnessMap: params.properties.textures.roughnessMap }),
        ...(params.properties?.textures?.metalnessMap && { metalnessMap: params.properties.textures.metalnessMap }),
        ...(params.properties?.textures?.emissionMap && { emissionMap: params.properties.textures.emissionMap }),
        ...(params.properties?.shaderParams && { shaderParams: params.properties.shaderParams }),
        updatedAt: new Date()
      }

      const result = await client.material.updateMany({
        where: { name: materialName },
        data: updateData
      })

      if (result.count > 0) {
        console.log(`✅ 材质更新成功: ${materialName}`)
        
        // 返回更新后的材质对象
        return await client.material.findFirst({
          where: { name: params.name || materialName }
        })
      }

      return null

    } catch (error) {
      console.error(`❌ 材质更新失败: ${materialName}`, error)
      return null
    }
  }

  /**
   * 获取项目的所有材质
   * 
   * @param projectPath 项目路径
   * @param params 搜索参数（可选）
   * @returns Promise<Material[]> 材质列表
   */
  async getMaterials(projectPath: string, params?: SearchMaterialsParams): Promise<Material[]> {
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      // 构建查询条件
      const where: Prisma.MaterialWhereInput = {}
      
      if (params?.keyword) {
        where.OR = [
          { name: { contains: params.keyword } }
        ]
      }
      
      if (params?.type) {
        where.type = params.type
      }

      // 构建排序条件
      const orderBy: Prisma.MaterialOrderByWithRelationInput = {}
      const sortBy = params?.sortBy || 'name'
      const sortOrder = params?.sortOrder || 'asc'
      orderBy[sortBy] = sortOrder

      const materials = await client.material.findMany({
        where,
        orderBy
      })

      console.log(`📋 获取材质列表: ${materials.length} 个材质`)
      return materials

    } catch (error) {
      console.error(`❌ 获取材质列表失败: ${projectPath}`, error)
      return []
    }
  }

  /**
   * 删除材质
   * 
   * @param projectPath 项目路径
   * @param materialName 材质名称
   * @returns Promise<boolean> 删除是否成功
   */
  async deleteMaterial(projectPath: string, materialName: string): Promise<boolean> {
    try {
      const client = await prismaManager.getProjectClient(projectPath)
      
      const result = await client.material.deleteMany({
        where: { name: materialName }
      })

      if (result.count > 0) {
        console.log(`🗑️ 材质删除成功: ${materialName}`)
        return true
      }

      return false

    } catch (error) {
      console.error(`❌ 材质删除失败: ${materialName}`, error)
      return false
    }
  }

  /**
   * 复制材质
   * 
   * @param projectPath 项目路径
   * @param sourceName 源材质名称
   * @param targetName 目标材质名称
   * @returns Promise<Material | null> 复制的材质对象
   */
  async duplicateMaterial(projectPath: string, sourceName: string, targetName: string): Promise<Material | null> {
    try {
      // 加载源材质
      const sourceMaterial = await this.loadMaterial(projectPath, sourceName)
      if (!sourceMaterial) {
        throw new Error(`源材质不存在: ${sourceName}`)
      }

      // 创建新材质
      const properties: MaterialProperties = {
        albedo: sourceMaterial.albedo || '#ffffff',
        roughness: sourceMaterial.roughness || 0.5,
        metalness: sourceMaterial.metalness || 0.0,
        emission: sourceMaterial.emission || '#000000',
        textures: {
          albedoMap: sourceMaterial.albedoMap || undefined,
          normalMap: sourceMaterial.normalMap || undefined,
          roughnessMap: sourceMaterial.roughnessMap || undefined,
          metalnessMap: sourceMaterial.metalnessMap || undefined,
          emissionMap: sourceMaterial.emissionMap || undefined
        },
        shaderParams: sourceMaterial.shaderParams as Record<string, any> || {}
      }

      const newMaterial = await this.createMaterial(projectPath, {
        name: targetName,
        type: sourceMaterial.type as MaterialType,
        properties
      })

      console.log(`📋 材质复制成功: ${sourceName} -> ${targetName}`)
      return newMaterial

    } catch (error) {
      console.error(`❌ 材质复制失败: ${sourceName} -> ${targetName}`, error)
      return null
    }
  }

  /**
   * 获取材质预设列表
   * 
   * @returns MaterialPreset[] 预设列表
   */
  getPresets(): MaterialPreset[] {
    return this.presets
  }

  /**
   * 从预设创建材质
   * 
   * @param projectPath 项目路径
   * @param presetName 预设名称
   * @param materialName 材质名称
   * @returns Promise<Material | null> 创建的材质对象
   */
  async createFromPreset(projectPath: string, presetName: string, materialName: string): Promise<Material | null> {
    const preset = this.presets.find(p => p.name === presetName)
    if (!preset) {
      console.error(`❌ 预设不存在: ${presetName}`)
      return null
    }

    try {
      return await this.createMaterial(projectPath, {
        name: materialName,
        type: preset.type,
        properties: preset.properties
      })
    } catch (error) {
      console.error(`❌ 从预设创建材质失败: ${presetName}`, error)
      return null
    }
  }

  // ========================================================================
  // 私有辅助方法
  // ========================================================================

  /**
   * 初始化材质预设
   */
  private initializePresets(): void {
    this.presets = [
      {
        name: 'default',
        description: '默认材质',
        type: 'standard',
        properties: {
          albedo: '#ffffff',
          roughness: 0.5,
          metalness: 0.0,
          emission: '#000000'
        }
      },
      {
        name: 'metal',
        description: '金属材质',
        type: 'standard',
        properties: {
          albedo: '#c0c0c0',
          roughness: 0.1,
          metalness: 1.0,
          emission: '#000000'
        }
      },
      {
        name: 'plastic',
        description: '塑料材质',
        type: 'standard',
        properties: {
          albedo: '#ff4444',
          roughness: 0.8,
          metalness: 0.0,
          emission: '#000000'
        }
      },
      {
        name: 'glass',
        description: '玻璃材质',
        type: 'physical',
        properties: {
          albedo: '#ffffff',
          roughness: 0.0,
          metalness: 0.0,
          emission: '#000000',
          opacity: 0.1,
          transparent: true
        }
      },
      {
        name: 'emissive',
        description: '发光材质',
        type: 'standard',
        properties: {
          albedo: '#000000',
          roughness: 1.0,
          metalness: 0.0,
          emission: '#00ff00'
        }
      }
    ]
  }
}

/**
 * 导出材质服务单例实例
 */
export const materialService = new MaterialService()
