/**
 * QAQ游戏引擎 - Token测试API
 * 
 * 用于测试和验证用户token的有效性
 */

import { AuthService } from '~/services/AuthService'

const authService = new AuthService()

export default defineEventHandler(async (event) => {
  console.log('🔑 Token测试API开始执行...')
  
  try {
    // 只允许POST请求
    assertMethod(event, 'POST')

    // 获取请求头
    const headers = getHeaders(event)
    console.log('📋 请求头信息:', {
      hasAuth: !!headers.authorization,
      authFormat: headers.authorization?.substring(0, 20) + '...'
    })

    // 验证认证头
    const authorization = headers.authorization
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return {
        success: false,
        error: '认证头缺失或格式错误',
        details: {
          hasAuth: !!authorization,
          format: authorization ? 'invalid' : 'missing'
        }
      }
    }

    const token = authorization.substring(7)
    console.log('🔑 Token信息:', {
      length: token.length,
      start: token.substring(0, 10) + '...',
      end: '...' + token.substring(token.length - 10)
    })

    // 验证token
    console.log('👤 开始验证token...')
    let user
    try {
      user = await authService.verifyAccessToken(token)
      console.log('👤 Token验证结果:', user ? '有效' : '无效')
    } catch (authError) {
      console.error('❌ Token验证异常:', authError)
      return {
        success: false,
        error: 'Token验证异常',
        details: {
          errorMessage: authError.message,
          errorType: authError.constructor.name
        }
      }
    }

    if (!user) {
      return {
        success: false,
        error: 'Token无效或已过期',
        details: {
          tokenLength: token.length,
          tokenValid: false
        }
      }
    }

    // 返回用户信息
    return {
      success: true,
      message: 'Token验证成功',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isActive: user.isActive,
          isVerified: user.isVerified
        },
        token: {
          length: token.length,
          valid: true
        }
      }
    }

  } catch (error) {
    console.error('❌ Token测试API异常:', error)
    return {
      success: false,
      error: '服务器内部错误',
      details: {
        errorMessage: error.message,
        errorStack: error.stack
      }
    }
  }
})
