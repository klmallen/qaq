/**
 * QAQ游戏引擎 - 用户登录API端点
 *
 * 功能说明：
 * - 处理用户登录请求
 * - 验证登录凭据
 * - 生成认证令牌
 * - 记录登录会话
 *
 * 作者：QAQ游戏引擎团队
 * 创建时间：2024年
 */

// 动态导入以避免模块解析问题
async function getAuthService() {
  try {
    const { authService } = await import('~/services/AuthService')
    return authService
  } catch (error) {
    console.error('❌ 无法导入 AuthService:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '服务暂时不可用'
    })
  }
}

// 类型定义
interface LoginUserParams {
  email: string
  password: string
  rememberMe?: boolean
}

/**
 * 登录请求体接口
 */
interface LoginRequestBody {
  email: string
  password: string
  rememberMe?: boolean
}

/**
 * 用户登录API处理函数
 */
export default defineEventHandler(async (event) => {
  // 只允许POST请求
  assertMethod(event, 'POST')

  try {
    // 获取请求体数据
    const body = await readBody<LoginRequestBody>(event)

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

    // 获取客户端信息
    const headers = getHeaders(event)
    const clientIP = (
      headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      headers['x-real-ip'] ||
      headers['x-client-ip'] ||
      headers['cf-connecting-ip'] ||
      event.node?.req?.connection?.remoteAddress ||
      event.node?.req?.socket?.remoteAddress ||
      '127.0.0.1'
    )
    const userAgent = headers['user-agent'] || 'Unknown'

    // 准备登录参数
    const loginParams: LoginUserParams = {
      email: body.email.toLowerCase().trim(),
      password: body.password,
      ipAddress: clientIP,
      userAgent: userAgent
    }

    // 调用认证服务进行登录
    const authService = await getAuthService()
    const authResult = await authService.login(loginParams)

    // 设置cookie过期时间（如果选择记住我，延长过期时间）
    const accessTokenMaxAge = 15 * 60 // 15分钟
    const refreshTokenMaxAge = body.rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60 // 30天或7天

    // 设置响应cookie
    setCookie(event, 'qaq_access_token', authResult.accessToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: accessTokenMaxAge
    })

    setCookie(event, 'qaq_refresh_token', authResult.refreshToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshTokenMaxAge
    })

    // 返回成功响应
    return {
      success: true,
      message: '登录成功',
      data: {
        user: authResult.user,
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken,
        expiresAt: authResult.expiresAt
      }
    }

  } catch (error) {
    console.error('登录API错误:', error)

    // 如果是已知错误，直接抛出
    if (error instanceof Error) {
      throw createError({
        statusCode: 401,
        statusMessage: error.message
      })
    }

    // 未知错误
    throw createError({
      statusCode: 500,
      statusMessage: '登录失败，请稍后重试'
    })
  }
})
