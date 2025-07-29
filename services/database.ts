/**
 * QAQ Game Engine Database Services
 * High-level database operations for the game engine
 */

import { dbManager, type DatabaseManager } from '~/lib/database'

// 动态类型导入，避免静态导入问题
type PrismaClient = any

// ============================================================================
// Project Services
// ============================================================================

export class ProjectService {
  private dbManager: DatabaseManager

  constructor() {
    this.dbManager = dbManager
  }

  async createProject(projectData: {
    name: string
    path: string
    description?: string
    version?: string
  }) {
    const client = await this.dbManager.getProjectClient(projectData.path)

    try {
      const project = await client.project.create({
        data: {
          name: projectData.name,
          description: projectData.description,
          path: projectData.path,
          version: projectData.version || '1.0.0',
          engineVersion: '1.0.0',
          settings: {
            renderPipeline: '3d',
            physics: 'enabled',
            audio: 'enabled',
            defaultScene: 'Scene1'
          }
        }
      })

      // Set as current project
      this.dbManager.setCurrentProject(projectData.path)

      return project
    } catch (error) {
      console.error('Failed to create project:', error)
      throw error
    }
  }

  async getProject(projectPath: string) {
    const client = await this.dbManager.getProjectClient(projectPath)

    try {
      return await client.project.findFirst({
        where: { path: projectPath },
        include: {
          scenes: {
            orderBy: { updatedAt: 'desc' }
          },
          scripts: {
            orderBy: { updatedAt: 'desc' }
          },
          materials: {
            orderBy: { name: 'asc' }
          }
        }
      })
    } catch (error) {
      console.error('Failed to get project:', error)
      return null
    }
  }

  async updateProjectSettings(projectPath: string, settings: Record<string, any>) {
    const client = await this.dbManager.getProjectClient(projectPath)

    try {
      return await client.project.updateMany({
        where: { path: projectPath },
        data: {
          settings: settings,
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to update project settings:', error)
      throw error
    }
  }
}

// ============================================================================
// Scene Services
// ============================================================================

export class SceneService {
  private dbManager: DatabaseManager

  constructor() {
    this.dbManager = dbManager
  }

  async saveScene(projectPath: string, sceneData: {
    name: string
    path: string
    type: string
    sceneTree: any
    nodes: any[]
  }) {
    const client = await this.dbManager.getProjectClient(projectPath)

    try {
      // Get project
      const project = await client.project.findFirst({
        where: { path: projectPath }
      })

      if (!project) {
        throw new Error('Project not found')
      }

      // Upsert scene
      const scene = await client.scene.upsert({
        where: {
          projectId_path: {
            projectId: project.id,
            path: sceneData.path
          }
        },
        update: {
          name: sceneData.name,
          type: sceneData.type,
          sceneData: sceneData.sceneTree,
          updatedAt: new Date()
        },
        create: {
          name: sceneData.name,
          path: sceneData.path,
          type: sceneData.type,
          projectId: project.id,
          sceneData: sceneData.sceneTree
        }
      })

      // Clear existing nodes for this scene
      await client.sceneNode.deleteMany({
        where: { sceneId: scene.id }
      })

      // Save scene nodes
      for (const nodeData of sceneData.nodes) {
        await client.sceneNode.create({
          data: {
            uuid: nodeData.uuid,
            name: nodeData.name,
            type: nodeData.type,
            sceneId: scene.id,
            parentId: nodeData.parentId,
            position: nodeData.position || { x: 0, y: 0, z: 0 },
            rotation: nodeData.rotation || { x: 0, y: 0, z: 0 },
            scale: nodeData.scale || { x: 1, y: 1, z: 1 },
            visible: nodeData.visible !== false,
            properties: nodeData.properties || {}
          }
        })
      }

      console.log(`✅ Scene saved: ${scene.name}`)
      return scene
    } catch (error) {
      console.error('Failed to save scene:', error)
      throw error
    }
  }

  async loadScene(projectPath: string, scenePath: string) {
    const client = await this.dbManager.getProjectClient(projectPath)

    try {
      const scene = await client.scene.findFirst({
        where: {
          path: scenePath
        },
        include: {
          nodes: {
            orderBy: { createdAt: 'asc' }
          }
        }
      })

      return scene
    } catch (error) {
      console.error('Failed to load scene:', error)
      return null
    }
  }

  async getScenes(projectPath: string) {
    const client = await this.dbManager.getProjectClient(projectPath)

    try {
      return await client.scene.findMany({
        orderBy: { updatedAt: 'desc' }
      })
    } catch (error) {
      console.error('Failed to get scenes:', error)
      return []
    }
  }

  async deleteScene(projectPath: string, scenePath: string) {
    const client = await this.dbManager.getProjectClient(projectPath)

    try {
      return await client.scene.deleteMany({
        where: { path: scenePath }
      })
    } catch (error) {
      console.error('Failed to delete scene:', error)
      throw error
    }
  }
}

// ============================================================================
// Script Services
// ============================================================================

export class ScriptService {
  private dbManager: DatabaseManager

  constructor() {
    this.dbManager = dbManager
  }

  async saveScript(projectPath: string, scriptData: {
    name: string
    path: string
    content: string
    language?: string
  }) {
    const client = await this.dbManager.getProjectClient(projectPath)

    try {
      // Get project
      const project = await client.project.findFirst({
        where: { path: projectPath }
      })

      if (!project) {
        throw new Error('Project not found')
      }

      // Upsert script
      const script = await client.script.upsert({
        where: {
          projectId_path: {
            projectId: project.id,
            path: scriptData.path
          }
        },
        update: {
          name: scriptData.name,
          content: scriptData.content,
          language: scriptData.language || 'typescript',
          updatedAt: new Date()
        },
        create: {
          name: scriptData.name,
          path: scriptData.path,
          content: scriptData.content,
          language: scriptData.language || 'typescript',
          projectId: project.id
        }
      })

      console.log(`✅ Script saved: ${script.name}`)
      return script
    } catch (error) {
      console.error('Failed to save script:', error)
      throw error
    }
  }

  async getScripts(projectPath: string) {
    const client = await this.dbManager.getProjectClient(projectPath)

    try {
      return await client.script.findMany({
        orderBy: { updatedAt: 'desc' }
      })
    } catch (error) {
      console.error('Failed to get scripts:', error)
      return []
    }
  }

  async deleteScript(projectPath: string, scriptPath: string) {
    const client = await this.dbManager.getProjectClient(projectPath)

    try {
      return await client.script.deleteMany({
        where: { path: scriptPath }
      })
    } catch (error) {
      console.error('Failed to delete script:', error)
      throw error
    }
  }
}

// ============================================================================
// Material Services
// ============================================================================

export class MaterialService {
  private dbManager: DatabaseManager

  constructor() {
    this.dbManager = dbManager
  }

  async saveMaterial(projectPath: string, materialData: {
    name: string
    type: string
    properties: Record<string, any>
  }) {
    const client = await this.dbManager.getProjectClient(projectPath)

    try {
      // Get project
      const project = await client.project.findFirst({
        where: { path: projectPath }
      })

      if (!project) {
        throw new Error('Project not found')
      }

      // Upsert material
      const material = await client.material.upsert({
        where: {
          projectId_name: {
            projectId: project.id,
            name: materialData.name
          }
        },
        update: {
          type: materialData.type,
          albedo: materialData.properties.albedo,
          roughness: materialData.properties.roughness,
          metalness: materialData.properties.metalness,
          emission: materialData.properties.emission,
          updatedAt: new Date()
        },
        create: {
          name: materialData.name,
          type: materialData.type,
          projectId: project.id,
          albedo: materialData.properties.albedo,
          roughness: materialData.properties.roughness,
          metalness: materialData.properties.metalness,
          emission: materialData.properties.emission
        }
      })

      console.log(`✅ Material saved: ${material.name}`)
      return material
    } catch (error) {
      console.error('Failed to save material:', error)
      throw error
    }
  }

  async getMaterials(projectPath: string) {
    const client = await this.dbManager.getProjectClient(projectPath)

    try {
      return await client.material.findMany({
        orderBy: { name: 'asc' }
      })
    } catch (error) {
      console.error('Failed to get materials:', error)
      return []
    }
  }
}

// ============================================================================
// Export service instances
// ============================================================================

export const projectService = new ProjectService()
export const sceneService = new SceneService()
export const scriptService = new ScriptService()
export const materialService = new MaterialService()
