/**
 * QAQ游戏引擎 - POST API开发示例
 * POST /api/example/create
 * 
 * 展示如何创建资源的完整API示例
 */

import { PrismaClient } from '@prisma/client'
import { 
  authenticateUser,
  successResponse,
  handleApiError,
  withPerformanceMonitoring,
  validateData,
  getClientIP
} from '~/utils/api-helpers'

const prisma = new PrismaClient()

// 定义验证规则
const validationRules = {
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9\s\-_\u4e00-\u9fa5]+$/,
    message: '项目名称只能包含字母、数字、中文、空格、连字符和下划线'
  },
  description: {
    required: false,
    maxLength: 500
  },
  location: {
    required: true,
    minLength: 1
  },
  template: {
    required: false,
    pattern: /^(3d-game|2d-game|vr-game|empty)$/,
    message: '模板类型无效'
  }
}

export default defineEventHandler(withPerformanceMonitoring(async (event) => {
  try {
    // 1. 验证请求方法
    assertMethod(event, 'POST')
    
    // 2. 用户认证
    const user = await authenticateUser(event)
    
    // 3. 获取请求体数据
    const body = await readBody(event)
    
    // 4. 数据验证
    const validation = validateData(body, validationRules)
    
    if (!validation.isValid) {
      throw createError({
        statusCode: 400,
        statusMessage: '请求数据验证失败',
        data: validation.errors
      })
    }
    
    const { name, description, location, template = '3d-game' } = body
    
    // 5. 业务逻辑验证
    // 检查项目名称是否已存在
    const existingProject = await prisma.project.findFirst({
      where: {
        name,
        userId: user.id
      }
    })
    
    if (existingProject) {
      throw createError({
        statusCode: 409,
        statusMessage: '项目名称已存在'
      })
    }
    
    // 6. 获取客户端信息
    const clientIP = getClientIP(event)
    const userAgent = getHeader(event, 'user-agent') || 'Unknown'
    
    // 7. 数据库事务操作
    const result = await prisma.$transaction(async (tx) => {
      // 创建项目记录
      const project = await tx.project.create({
        data: {
          name,
          description: description || '',
          path: `${location}/${name.replace(/[^a-zA-Z0-9\-_]/g, '-').toLowerCase()}`,
          version: '1.0.0',
          engineVersion: '1.0.0',
          userId: user.id,
          isPublic: false,
          settings: {
            template,
            renderer: {
              type: template.includes('3d') ? '3d' : '2d',
              quality: 'high',
              shadows: template.includes('3d'),
              antialiasing: 'msaa_4x'
            },
            physics: {
              enabled: template !== 'empty',
              gravity: { x: 0, y: -9.81, z: 0 },
              timeStep: 1/60
            },
            audio: {
              enabled: true,
              masterVolume: 1.0,
              format: '48khz_16bit'
            }
          },
          lastOpened: new Date()
        },
        include: {
          _count: {
            select: {
              scenes: true,
              scripts: true,
              materials: true
            }
          }
        }
      })
      
      // 创建默认场景（如果不是空项目）
      let defaultScene = null
      if (template !== 'empty') {
        defaultScene = await tx.scene.create({
          data: {
            name: 'Main',
            path: 'scenes/Main.tscn',
            type: template.includes('3d') ? '3d' : '2d',
            projectId: project.id,
            isMain: true,
            description: '主场景',
            sceneData: {
              nodes: [],
              environment: {
                skybox: template.includes('3d') ? 'default' : null,
                lighting: template.includes('3d') ? 'natural' : 'ambient',
                fog: false
              },
              camera: template.includes('3d') ? {
                position: { x: 0, y: 0, z: 5 },
                rotation: { x: 0, y: 0, z: 0 },
                fov: 75
              } : {
                position: { x: 0, y: 0 },
                zoom: 1
              }
            }
          }
        })
        
        // 创建根节点
        await tx.sceneNode.create({
          data: {
            uuid: `root-${Date.now()}`,
            name: 'Root',
            type: template.includes('3d') ? 'Node3D' : 'Node2D',
            sceneId: defaultScene.id,
            position: JSON.stringify(
              template.includes('3d') 
                ? { x: 0, y: 0, z: 0 }
                : { x: 0, y: 0 }
            ),
            rotation: JSON.stringify(
              template.includes('3d')
                ? { x: 0, y: 0, z: 0 }
                : { rotation: 0 }
            ),
            scale: JSON.stringify(
              template.includes('3d')
                ? { x: 1, y: 1, z: 1 }
                : { x: 1, y: 1 }
            ),
            visible: true,
            properties: {
              description: '场景根节点'
            }
          }
        })
      }
      
      // 记录操作日志
      await tx.auditLog?.create({
        data: {
          userId: user.id,
          action: 'CREATE_PROJECT',
          resourceType: 'project',
          resourceId: project.id,
          details: JSON.stringify({
            projectName: name,
            template,
            clientIP,
            userAgent
          }),
          timestamp: new Date()
        }
      }).catch(() => {
        // 如果审计日志表不存在，忽略错误
        console.warn('审计日志记录失败，可能是表不存在')
      })
      
      return { project, defaultScene }
    })
    
    // 8. 文件系统操作（可选）
    try {
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const projectPath = result.project.path
      
      // 创建项目目录结构
      await fs.mkdir(projectPath, { recursive: true })
      await fs.mkdir(path.join(projectPath, 'scenes'), { recursive: true })
      await fs.mkdir(path.join(projectPath, 'scripts'), { recursive: true })
      await fs.mkdir(path.join(projectPath, 'assets'), { recursive: true })
      await fs.mkdir(path.join(projectPath, 'materials'), { recursive: true })
      await fs.mkdir(path.join(projectPath, '.qaq'), { recursive: true })
      
      // 创建项目配置文件
      const projectConfig = {
        name: result.project.name,
        version: result.project.version,
        engineVersion: result.project.engineVersion,
        template,
        created: result.project.createdAt.toISOString(),
        settings: result.project.settings
      }
      
      await fs.writeFile(
        path.join(projectPath, '.qaq', 'project.json'),
        JSON.stringify(projectConfig, null, 2),
        'utf8'
      )
      
    } catch (fsError) {
      console.warn('⚠️ 文件系统操作失败:', fsError)
      // 不抛出错误，因为数据库记录已创建成功
    }
    
    // 9. 格式化响应数据
    const responseData = {
      project: {
        id: result.project.id,
        name: result.project.name,
        description: result.project.description,
        path: result.project.path,
        version: result.project.version,
        engineVersion: result.project.engineVersion,
        template,
        createdAt: result.project.createdAt,
        lastOpened: result.project.lastOpened,
        settings: result.project.settings,
        stats: result.project._count
      },
      defaultScene: result.defaultScene ? {
        id: result.defaultScene.id,
        name: result.defaultScene.name,
        path: result.defaultScene.path,
        type: result.defaultScene.type,
        isMain: result.defaultScene.isMain
      } : null
    }
    
    // 10. 返回成功响应
    return successResponse('项目创建成功', responseData)
    
  } catch (error) {
    // 统一错误处理
    handleApiError(error, '项目创建')
  } finally {
    // 确保数据库连接关闭
    await prisma.$disconnect()
  }
}))

/**
 * 使用说明：
 * 
 * 请求示例：
 * POST /api/example/create
 * Headers: 
 *   Authorization: Bearer <token>
 *   Content-Type: application/json
 * 
 * Body:
 * {
 *   "name": "我的游戏项目",
 *   "description": "这是一个测试项目",
 *   "location": "C:/Projects",
 *   "template": "3d-game"
 * }
 * 
 * 响应示例：
 * {
 *   "success": true,
 *   "message": "项目创建成功",
 *   "data": {
 *     "project": {
 *       "id": "clxxx...",
 *       "name": "我的游戏项目",
 *       "path": "C:/Projects/我的游戏项目",
 *       "version": "1.0.0",
 *       "createdAt": "2024-07-15T12:00:00.000Z"
 *     },
 *     "defaultScene": {
 *       "id": "clyyy...",
 *       "name": "Main",
 *       "type": "3d",
 *       "isMain": true
 *     }
 *   },
 *   "timestamp": "2024-07-15T12:00:00.000Z"
 * }
 */
