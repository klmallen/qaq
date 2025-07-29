/**
 * QAQ游戏引擎 - Token刷新API
 *
 * 处理访问令牌的刷新请求，实现30天持久化登录
 */

import { PrismaClient } from '@prisma/client'
import { AuthService } from '~/services/AuthService'

const prisma = new PrismaClient()
const authService = new AuthService()

export default defineEventHandler(async (event) => {
  try {
    // 只允许POST请求
    assertMethod(event, 'POST')

    // 获取请求体
    const body = await readBody(event)
    const { refreshToken } = body

    if (!refreshToken) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少刷新令牌'
      })
    }

    console.log('🔄 开始处理token刷新请求...')

    try {
      // 验证刷新令牌
      const decoded = await authService.verifyRefreshToken(refreshToken)

      if (!decoded || !decoded.userId) {
        throw createError({
          statusCode: 401,
          statusMessage: '无效的刷新令牌'
        })
      }

      // 获取用户信息
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      })

      if (!user || !user.isActive) {
        throw createError({
          statusCode: 401,
          statusMessage: '用户不存在或已被禁用'
        })
      }

      // 生成新的访问令牌
      const newAccessToken = await authService.generateJWTAccessToken(user)

      // 生成新的刷新令牌（可选，延长会话）
      const newRefreshToken = await authService.generateJWTRefreshToken(user)

      // 计算新的过期时间（30天）
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      console.log('✅ Token刷新成功:', user.email)

      // 返回新的令牌信息
      return {
        success: true,
        message: 'Token刷新成功',
        data: {
          token: newAccessToken,
          refreshToken: newRefreshToken,
          expiresAt: expiresAt.toISOString(),
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar
          }
        }
      }

    } catch (tokenError) {
      console.error('❌ Token验证失败:', tokenError)

      throw createError({
        statusCode: 401,
        statusMessage: '刷新令牌已过期或无效'
      })
    }

  } catch (error: any) {
    console.error('❌ Token刷新API错误:', error)

    // 处理已知错误
    if (error.statusCode) {
      throw error
    }

    // 未知错误
    throw createError({
      statusCode: 500,
      statusMessage: '服务器内部错误'
    })
  } finally {
    await prisma.$disconnect()
  }
})
