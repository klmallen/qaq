/**
 * QAQ游戏引擎 - 用户注册API端点
 * 
 * 功能说明：
 * - 处理用户注册请求
 * - 验证注册数据
 * - 创建新用户账户
 * - 返回认证令牌
 * 
 * 作者：QAQ游戏引擎团队
 * 创建时间：2024年
 */

import { authService } from '~/services/AuthService'
import type { RegisterUserParams } from '~/services/AuthService'

/**
 * 注册请求体接口
 */
interface RegisterRequestBody extends RegisterUserParams {
  confirmPassword?: string
}

/**
 * 用户注册API处理函数
 */
export default defineEventHandler(async (event) => {
  // 只允许POST请求
  assertMethod(event, 'POST')

  try {
    // 获取请求体数据
    const body = await readBody<RegisterRequestBody>(event)

    // 验证必填字段
    if (!body.email || !body.password) {
      throw createError({
        statusCode: 400,
        statusMessage: '邮箱和密码为必填项'
      })
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      throw createError({
        statusCode: 400,
        statusMessage: '邮箱格式不正确'
      })
    }

    // 验证密码长度
    if (body.password.length < 6) {
      throw createError({
        statusCode: 400,
        statusMessage: '密码长度至少6位'
      })
    }

    // 验证确认密码（如果提供）
    if (body.confirmPassword && body.password !== body.confirmPassword) {
      throw createError({
        statusCode: 400,
        statusMessage: '两次输入的密码不一致'
      })
    }

    // 验证用户名格式（如果提供）
    if (body.username) {
      const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/
      if (!usernameRegex.test(body.username)) {
        throw createError({
          statusCode: 400,
          statusMessage: '用户名只能包含字母、数字、下划线和连字符，长度3-20位'
        })
      }
    }

    // 准备注册参数
    const registerParams: RegisterUserParams = {
      email: body.email.toLowerCase().trim(),
      password: body.password,
      firstName: body.firstName?.trim(),
      lastName: body.lastName?.trim(),
      username: body.username?.trim()
    }

    // 调用认证服务进行注册
    const authResult = await authService.register(registerParams)

    // 设置响应cookie
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

    // 返回成功响应
    return {
      success: true,
      message: '注册成功',
      data: {
        user: authResult.user,
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
        expiresAt: authResult.expiresAt
      }
    }

  } catch (error) {
    console.error('注册API错误:', error)

    // 如果是已知错误，直接抛出
    if (error instanceof Error) {
      throw createError({
        statusCode: 400,
        statusMessage: error.message
      })
    }

    // 未知错误
    throw createError({
      statusCode: 500,
      statusMessage: '注册失败，请稍后重试'
    })
  }
})
