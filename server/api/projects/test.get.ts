/**
 * QAQ游戏引擎 - 项目API测试端点
 *
 * 用于测试项目API的连通性和基本功能
 */

import { getPrismaClient } from '~/server/utils/prisma.ts'

export default defineEventHandler(async (event) => {
  // 在外部声明 prisma 变量以便在 finally 块中使用
  let prisma: any = null

  try {
    console.log('🧪 项目API测试端点被调用')

    // 获取Prisma实例
    prisma = await getPrismaClient()

    // 测试数据库连接
    const projectCount = await prisma.project.count()
    const userCount = await prisma.user.count()

    console.log(`📊 数据库状态: ${projectCount} 个项目, ${userCount} 个用户`)

    // 获取最近的几个项目（不需要认证）
    const recentProjects = await prisma.project.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            scenes: true,
            scripts: true,
            materials: true
          }
        }
      }
    })

    return {
      success: true,
      message: '项目API测试成功',
      data: {
        stats: {
          totalProjects: projectCount,
          totalUsers: userCount
        },
        recentProjects: recentProjects.map(project => ({
          id: project.id,
          name: project.name,
          description: project.description,
          createdAt: project.createdAt,
          owner: `${project.user.firstName} ${project.user.lastName}`.trim() || project.user.username || project.user.email,
          stats: project._count
        })),
        timestamp: new Date().toISOString()
      }
    }

  } catch (error: any) {
    console.error('❌ 项目API测试失败:', error)

    return {
      success: false,
      message: '项目API测试失败',
      error: {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      },
      timestamp: new Date().toISOString()
    }
  } finally {
    // 安全地断开 Prisma 连接
    if (prisma) {
      await prisma.$disconnect()
    }
  }
})
