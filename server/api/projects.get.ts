/**
 * QAQ游戏引擎 - 获取项目列表API
 *
 * 处理用户项目列表查询请求，支持分页、排序和权限过滤
 */

import { getCurrentPrismaClient } from '~/lib/prisma'

async function getAuthService() {
  const { authService } = await import('~/services/AuthService')
  return authService
}

export default defineEventHandler(async (event) => {
  // 在外部声明 prisma 变量以便在 finally 块中使用
  let prisma: any = null

  try {
    // 只允许GET请求
    assertMethod(event, 'GET')

    // 获取服务实例
    prisma = await getCurrentPrismaClient()
    const authService = await getAuthService()

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

    console.log('🔍 获取项目列表请求，用户:', user.email)

    // 获取查询参数
    const query = getQuery(event)
    const {
      limit = '20',
      offset = '0',
      sortBy = 'lastOpened',
      sortOrder = 'desc',
      search = '',
      includePublic = 'false'
    } = query

    // 参数验证和转换
    const limitNum = Math.min(parseInt(limit as string) || 20, 100) // 最大100个
    const offsetNum = Math.max(parseInt(offset as string) || 0, 0)
    const sortByField = ['name', 'createdAt', 'updatedAt', 'lastOpened'].includes(sortBy as string)
      ? sortBy as string
      : 'lastOpened'
    const sortOrderValue = sortOrder === 'asc' ? 'asc' : 'desc'
    const includePublicProjects = includePublic === 'true'

    console.log('📊 查询参数:', {
      limit: limitNum,
      offset: offsetNum,
      sortBy: sortByField,
      sortOrder: sortOrderValue,
      search: search,
      includePublic: includePublicProjects
    })

    // 构建查询条件
    const whereCondition: any = {
      OR: [
        { userId: user.id }, // 用户自己的项目
      ]
    }

    // 如果包含公共项目
    if (includePublicProjects) {
      whereCondition.OR.push({ isPublic: true })
    }

    // 搜索条件
    if (search && search.trim()) {
      const searchTerm = search.trim()
      whereCondition.AND = [
        {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        }
      ]
    }

    // 查询项目列表
    const [projects, totalCount] = await Promise.all([
      prisma.project.findMany({
        where: whereCondition,
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
        },
        orderBy: {
          [sortByField]: sortOrderValue
        },
        take: limitNum,
        skip: offsetNum
      }),

      // 获取总数用于分页
      prisma.project.count({
        where: whereCondition
      })
    ])

    console.log(`✅ 查询到 ${projects.length} 个项目，总计 ${totalCount} 个`)

    // 格式化项目数据
    const formattedProjects = projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      path: project.path,
      version: project.version,
      engineVersion: project.engineVersion,
      isPublic: project.isPublic,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      lastOpened: project.lastOpened,
      settings: project.settings,
      owner: project.user ? {
        id: project.user.id,
        email: project.user.email,
        username: project.user.username,
        firstName: project.user.firstName,
        lastName: project.user.lastName,
        avatar: project.user.avatar
      } : null,
      stats: {
        scenes: project._count?.scenes || 0,
        scripts: project._count?.scripts || 0,
        materials: project._count?.materials || 0,
        animations: project._count?.animations || 0,
        assets: project._count?.assets || 0
      }
    }))

    // 计算分页信息
    const totalPages = Math.ceil(totalCount / limitNum)
    const currentPage = Math.floor(offsetNum / limitNum) + 1
    const hasNextPage = offsetNum + limitNum < totalCount
    const hasPrevPage = offsetNum > 0

    // 返回项目列表
    return {
      success: true,
      message: `成功获取 ${projects.length} 个项目`,
      data: {
        projects: formattedProjects,
        pagination: {
          total: totalCount,
          totalPages,
          currentPage,
          limit: limitNum,
          offset: offsetNum,
          hasNextPage,
          hasPrevPage
        },
        query: {
          sortBy: sortByField,
          sortOrder: sortOrderValue,
          search: search || null,
          includePublic: includePublicProjects
        }
      }
    }

  } catch (error: any) {
    console.error('❌ 获取项目列表API错误:', error)

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
