/**
 * QAQ游戏引擎 - 项目重命名API
 *
 * 处理项目重命名请求
 */

import { getPrismaClient, getAuthService } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  // 在外部声明 prisma 变量以便在 finally 块中使用
  let prisma: any = null

  try {
    // 只允许PATCH请求
    assertMethod(event, 'PATCH')

    // 获取服务实例
    prisma = await getPrismaClient()
    const authService = await getAuthService()

    // 获取项目ID
    const projectId = getRouterParam(event, 'id')
    if (!projectId) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少项目ID'
      })
    }

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

    // 获取请求体
    const body = await readBody(event)
    const { name, description } = body

    // 验证输入
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: '项目名称不能为空'
      })
    }

    const trimmedName = name.trim()
    const trimmedDescription = description ? description.trim() : ''

    // 验证项目名称格式
    if (trimmedName.length > 50) {
      throw createError({
        statusCode: 400,
        statusMessage: '项目名称不能超过50个字符'
      })
    }

    if (!/^[a-zA-Z0-9\u4e00-\u9fa5_\-\s]+$/.test(trimmedName)) {
      throw createError({
        statusCode: 400,
        statusMessage: '项目名称只能包含字母、数字、中文、下划线、连字符和空格'
      })
    }

    if (trimmedDescription.length > 200) {
      throw createError({
        statusCode: 400,
        statusMessage: '描述不能超过200个字符'
      })
    }

    console.log('🔄 开始重命名项目:', projectId, '新名称:', trimmedName)

    // 检查项目是否存在且用户有权限
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        description: true,
        userId: true,
        path: true
      }
    })

    if (!existingProject) {
      throw createError({
        statusCode: 404,
        statusMessage: '项目不存在'
      })
    }

    if (existingProject.userId !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: '无权限修改此项目'
      })
    }

    // 检查同名项目（排除当前项目）
    if (trimmedName !== existingProject.name) {
      const duplicateProject = await prisma.project.findFirst({
        where: {
          name: trimmedName,
          userId: user.id,
          id: { not: projectId }
        }
      })

      if (duplicateProject) {
        throw createError({
          statusCode: 409,
          statusMessage: '已存在同名项目'
        })
      }
    }

    // 更新项目信息
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: trimmedName,
        description: trimmedDescription,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        _count: {
          select: {
            scenes: true,
            scripts: true,
            materials: true,
            animations: true,
            assets: true
          }
        }
      }
    })

    console.log('✅ 项目重命名成功:', updatedProject.name)

    // 返回更新后的项目信息
    return {
      success: true,
      message: '项目重命名成功',
      data: {
        project: {
          id: updatedProject.id,
          name: updatedProject.name,
          description: updatedProject.description,
          path: updatedProject.path,
          version: updatedProject.version,
          engineVersion: updatedProject.engineVersion,
          isPublic: updatedProject.isPublic,
          createdAt: updatedProject.createdAt,
          updatedAt: updatedProject.updatedAt,
          lastOpened: updatedProject.lastOpened,
          settings: updatedProject.settings,
          owner: {
            id: updatedProject.user.id,
            email: updatedProject.user.email,
            username: updatedProject.user.username,
            firstName: updatedProject.user.firstName,
            lastName: updatedProject.user.lastName,
            avatar: updatedProject.user.avatar
          },
          stats: {
            scenes: updatedProject._count.scenes,
            scripts: updatedProject._count.scripts,
            materials: updatedProject._count.materials,
            animations: updatedProject._count.animations,
            assets: updatedProject._count.assets
          }
        }
      }
    }

  } catch (error: any) {
    console.error('❌ 项目重命名API错误:', error)

    // 处理已知错误
    if (error.statusCode) {
      throw error
    }

    // 数据库连接错误
    if (error.code === 'P1001') {
      throw createError({
        statusCode: 503,
        statusMessage: '数据库连接失败'
      })
    }

    // 数据库约束错误
    if (error.code === 'P2002') {
      throw createError({
        statusCode: 409,
        statusMessage: '项目名称已存在'
      })
    }

    // 未知错误
    throw createError({
      statusCode: 500,
      statusMessage: '服务器内部错误'
    })
  } finally {
    // 安全地断开 Prisma 连接
    if (prisma) {
      await prisma.$disconnect()
    }
  }
})
