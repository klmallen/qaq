/**
 * QAQ游戏引擎 - 用户登出API端点
 * 
 * 功能说明：
 * - 处理用户登出请求
 * - 清除用户会话
 * - 删除认证令牌
 * - 清除客户端cookie
 * 
 * 作者：QAQ游戏引擎团队
 * 创建时间：2024年
 */

import { authService } from '~/services/AuthService'

/**
 * 用户登出API处理函数
 */
export default defineEventHandler(async (event) => {
  // 只允许POST请求
  assertMethod(event, 'POST')

  try {
    // 获取访问令牌
    const accessToken = getCookie(event, 'qaq_access_token') || 
                       getHeader(event, 'authorization')?.replace('Bearer ', '')

    if (accessToken) {
      // 调用认证服务进行登出
      await authService.logout(accessToken)
    }

    // 清除cookie
    setCookie(event, 'qaq_access_token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // 立即过期
    })

    setCookie(event, 'qaq_refresh_token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // 立即过期
    })

    // 返回成功响应
    return {
      success: true,
      message: '登出成功'
    }

  } catch (error) {
    console.error('登出API错误:', error)

    // 即使登出失败，也要清除cookie
    setCookie(event, 'qaq_access_token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    })

    setCookie(event, 'qaq_refresh_token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    })

    return {
      success: true,
      message: '登出成功'
    }
  }
})
