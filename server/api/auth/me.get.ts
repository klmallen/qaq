/**
 * QAQ游戏引擎 - 获取当前用户信息API端点
 * 
 * 功能说明：
 * - 获取当前登录用户的信息
 * - 验证访问令牌
 * - 返回用户详细信息
 * - 支持令牌刷新
 * 
 * 作者：QAQ游戏引擎团队
 * 创建时间：2024年
 */

import { authService } from '~/services/AuthService'

/**
 * 获取当前用户信息API处理函数
 */
export default defineEventHandler(async (event) => {
  // 只允许GET请求
  assertMethod(event, 'GET')

  try {
    // 获取访问令牌
    const accessToken = getCookie(event, 'qaq_access_token') || 
                       getHeader(event, 'authorization')?.replace('Bearer ', '')

    if (!accessToken) {
      throw createError({
        statusCode: 401,
        statusMessage: '未提供访问令牌'
      })
    }

    // 验证访问令牌
    const user = await authService.verifyAccessToken(accessToken)

    if (!user) {
      // 尝试使用刷新令牌
      const refreshToken = getCookie(event, 'qaq_refresh_token')
      
      if (refreshToken) {
        const authResult = await authService.refreshAccessToken(refreshToken)
        
        if (authResult) {
          // 更新cookie
          setCookie(event, 'qaq_access_token', authResult.accessToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 // 15分钟
          })

          setCookie(event, 'qaq_refresh_token', authResult.refreshToken, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 // 7天
          })

          // 返回用户信息
          return {
            success: true,
            data: {
              user: authResult.user,
              accessToken: authResult.accessToken,
              refreshToken: authResult.refreshToken,
              expiresAt: authResult.expiresAt
            }
          }
        }
      }

      throw createError({
        statusCode: 401,
        statusMessage: '访问令牌无效或已过期'
      })
    }

    // 返回用户信息
    return {
      success: true,
      data: {
        user
      }
    }

  } catch (error) {
    console.error('获取用户信息API错误:', error)

    // 如果是已知错误，直接抛出
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    // 未知错误
    throw createError({
      statusCode: 500,
      statusMessage: '获取用户信息失败'
    })
  }
})
