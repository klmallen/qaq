/**
 * QAQ游戏引擎 - 创建项目API
 *
 * 处理项目创建请求，验证用户权限并创建项目记录
 */

import { AuthService } from '~/services/AuthService'
import { getCurrentPrismaClient } from '~/lib/prisma'
import path from 'path'
import fs from 'fs/promises'

const authService = new AuthService()

export default defineEventHandler(async (event) => {
  try {
    // 只允许POST请求
    assertMethod(event, 'POST')

    // 获取数据库客户端
    const prisma = await getCurrentPrismaClient()

    // 验证用户认证
    const headers = getHeaders(event)
    const authorization = headers.authorization

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        statusMessage: '需要认证'
      })
    }

    const token = authorization.substring(7)
    const user = await authService.verifyAccessToken(token)

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: '无效的认证令牌'
      })
    }

    // 验证用户信息完整性
    if (!user.id) {
      console.error('❌ 用户对象缺少ID字段:', user)
      throw createError({
        statusCode: 500,
        statusMessage: '用户信息不完整'
      })
    }

    console.log('👤 验证用户信息:', {
      id: user.id,
      email: user.email,
      username: user.username
    })

    // 验证用户是否在数据库中存在
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, isActive: true }
    })

    if (!existingUser) {
      console.error('❌ 用户在数据库中不存在:', user.id)
      throw createError({
        statusCode: 401,
        statusMessage: '用户不存在'
      })
    }

    if (!existingUser.isActive) {
      console.error('❌ 用户账号已被禁用:', user.id)
      throw createError({
        statusCode: 403,
        statusMessage: '用户账号已被禁用'
      })
    }

    console.log('✅ 用户验证通过:', existingUser.email)

    // 获取请求体
    const body = await readBody(event)
    const { name, description, template, location } = body

    // 验证必需字段
    if (!name || !location) {
      throw createError({
        statusCode: 400,
        statusMessage: '项目名称和位置不能为空'
      })
    }

    // 验证项目名称格式
    const nameRegex = /^[a-zA-Z0-9\s\-_\u4e00-\u9fa5]+$/
    if (!nameRegex.test(name)) {
      throw createError({
        statusCode: 400,
        statusMessage: '项目名称包含无效字符'
      })
    }

    // 生成项目路径
    const sanitizedName = name.replace(/[^a-zA-Z0-9\-_]/g, '-').toLowerCase()
    const projectPath = path.join(location, sanitizedName)

    // 检查项目路径是否已存在
    const existingProject = await prisma.project.findUnique({
      where: { path: projectPath }
    })

    if (existingProject) {
      throw createError({
        statusCode: 409,
        statusMessage: '项目路径已存在'
      })
    }

    // 创建项目目录结构
    try {
      console.log('📁 开始创建项目目录:', projectPath)

      // 检查父目录是否存在和可写
      const parentDir = path.dirname(projectPath)
      try {
        await fs.access(parentDir, fs.constants.W_OK)
      } catch (accessError) {
        console.error('❌ 父目录不可写:', parentDir, accessError)
        throw createError({
          statusCode: 400,
          statusMessage: `项目位置不可写: ${parentDir}`
        })
      }

      // 创建项目目录结构
      const directories = [
        projectPath,
        path.join(projectPath, 'scenes'),
        path.join(projectPath, 'scripts'),
        path.join(projectPath, 'assets'),
        path.join(projectPath, 'materials'),
        path.join(projectPath, 'animations'),
        path.join(projectPath, '.qaq')
      ]

      for (const dir of directories) {
        await fs.mkdir(dir, { recursive: true })
        console.log('✅ 创建目录:', dir)
      }

    } catch (error) {
      console.error('❌ 创建项目目录失败:', error)
      throw createError({
        statusCode: 500,
        statusMessage: `创建项目目录失败: ${error.message}`
      })
    }

    // 默认项目设置
    const defaultSettings = {
      renderer: {
        type: '3d',
        quality: 'high',
        shadows: true,
        antialiasing: 'msaa_4x'
      },
      physics: {
        enabled: true,
        gravity: { x: 0, y: -9.81, z: 0 },
        timeStep: 1/60
      },
      audio: {
        enabled: true,
        masterVolume: 1.0,
        format: '48khz_16bit'
      },
      input: {
        keyBindings: {
          move_forward: 'W',
          move_backward: 'S',
          move_left: 'A',
          move_right: 'D',
          jump: 'Space'
        }
      },
      build: {
        target: 'web',
        optimization: 'debug'
      }
    }

    // 在数据库中创建项目记录
    let project
    try {
      console.log('💾 开始创建项目数据库记录...')
      console.log('📋 项目数据:', {
        name,
        description: description || '',
        path: projectPath,
        version: '1.0.0',
        engineVersion: '1.0.0',
        userId: user.id,
        isPublic: false,
        lastOpened: new Date()
      })

      project = await prisma.project.create({
        data: {
          name,
          description: description || '',
          path: projectPath,
          version: '1.0.0',
          engineVersion: '1.0.0',
          userId: user.id,
          isPublic: false,
          settings: defaultSettings,
          lastOpened: new Date()
        }
      })
      console.log('✅ 项目记录创建成功:', project.id)
    } catch (dbError: any) {
      console.error('❌ 创建项目数据库记录失败:', dbError)
      console.error('❌ 错误详情:', {
        code: dbError.code,
        message: dbError.message,
        meta: dbError.meta
      })

      // 清理已创建的目录
      try {
        await fs.rm(projectPath, { recursive: true, force: true })
        console.log('🧹 已清理项目目录:', projectPath)
      } catch (cleanupError) {
        console.error('⚠️ 清理项目目录失败:', cleanupError)
      }

      // 根据错误类型提供更具体的错误信息
      let errorMessage = '创建项目记录失败'

      if (dbError.code === 'P2003') {
        // 外键约束违反
        console.error('🔗 外键约束违反 - 用户ID可能无效:', user.id)
        errorMessage = '用户信息无效，请重新登录'
      } else if (dbError.code === 'P2002') {
        // 唯一约束违反
        console.error('🔄 唯一约束违反 - 项目路径可能已存在:', projectPath)
        errorMessage = '项目路径已存在，请选择其他位置'
      } else if (dbError.code === 'P1001') {
        // 数据库连接错误
        console.error('🔌 数据库连接失败')
        errorMessage = '数据库连接失败，请稍后重试'
      }

      throw createError({
        statusCode: 500,
        statusMessage: `${errorMessage}: ${dbError.message}`
      })
    }

    // 创建默认场景
    let defaultScene
    try {
      console.log('🎬 开始创建默认场景...')
      defaultScene = await prisma.scene.create({
        data: {
          name: 'Main',
          path: 'scenes/Main.tscn',
          type: '3d',
          projectId: project.id,
          isMain: true,
          description: '主场景',
          sceneData: {
            nodes: [],
            environment: {
              skybox: 'default',
              lighting: 'natural',
              fog: false
            },
            camera: {
              position: { x: 0, y: 0, z: 5 },
              rotation: { x: 0, y: 0, z: 0 },
              fov: 75
            }
          }
        }
      })
      console.log('✅ 默认场景创建成功:', defaultScene.id)
    } catch (sceneError) {
      console.error('❌ 创建默认场景失败:', sceneError)

      // 清理已创建的项目和目录
      try {
        await prisma.project.delete({ where: { id: project.id } })
        await fs.rm(projectPath, { recursive: true, force: true })
        console.log('🧹 已清理项目记录和目录')
      } catch (cleanupError) {
        console.error('⚠️ 清理失败:', cleanupError)
      }

      throw createError({
        statusCode: 500,
        statusMessage: `创建默认场景失败: ${sceneError.message}`
      })
    }

    // 创建根节点
    await prisma.sceneNode.create({
      data: {
        uuid: `root-${Date.now()}`,
        name: 'Root',
        type: 'Node3D',
        sceneId: defaultScene.id,
        position: JSON.stringify({ x: 0, y: 0, z: 0 }),
        rotation: JSON.stringify({ x: 0, y: 0, z: 0 }),
        scale: JSON.stringify({ x: 1, y: 1, z: 1 }),
        visible: true,
        properties: {
          description: '场景根节点'
        }
      }
    })

    // 创建项目配置文件
    const projectConfig = {
      name: project.name,
      version: project.version,
      engineVersion: project.engineVersion,
      created: project.createdAt.toISOString(),
      settings: defaultSettings
    }

    await fs.writeFile(
      path.join(projectPath, '.qaq', 'project.json'),
      JSON.stringify(projectConfig, null, 2),
      'utf8'
    )

    // 返回创建的项目信息
    return {
      success: true,
      message: '项目创建成功',
      data: {
        project: {
          id: project.id,
          name: project.name,
          description: project.description,
          path: project.path,
          version: project.version,
          engineVersion: project.engineVersion,
          createdAt: project.createdAt,
          lastOpened: project.lastOpened,
          settings: project.settings
        },
        defaultScene: {
          id: defaultScene.id,
          name: defaultScene.name,
          path: defaultScene.path,
          type: defaultScene.type,
          isMain: defaultScene.isMain
        }
      }
    }

  } catch (error) {
    console.error('❌ 项目创建API错误:', error)

    // 处理已知错误
    if (error.statusCode) {
      throw error
    }

    // 未知错误
    throw createError({
      statusCode: 500,
      statusMessage: '服务器内部错误'
    })
  }
})
