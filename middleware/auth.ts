/**
 * QAQ游戏引擎 - 认证中间件
 * 
 * 功能说明：
 * - 检查用户是否已登录
 * - 保护需要认证的页面
 * - 重定向未认证用户到登录页面
 * - 处理令牌验证和刷新
 * 
 * 作者：QAQ游戏引擎团队
 * 创建时间：2024年
 */

import { authService } from '~/services/AuthService'

/**
 * 认证中间件
 * 在访问受保护的页面之前验证用户身份
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  // 如果是服务端渲染，跳过认证检查
  if (process.server) {
    return
  }

  // 公开页面列表（不需要认证的页面）
  const publicPages = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/',
    '/about',
    '/contact'
  ]

  // 检查当前页面是否为公开页面
  const isPublicPage = publicPages.some(page => to.path.startsWith(page))
  
  if (isPublicPage) {
    return
  }

  try {
    // 从cookie或localStorage获取访问令牌
    const accessToken = useCookie('qaq_access_token').value
    
    if (!accessToken) {
      console.log('🔒 未找到访问令牌，重定向到登录页面')
      return navigateTo('/auth/login')
    }

    // 验证访问令牌
    const user = await authService.verifyAccessToken(accessToken)
    
    if (!user) {
      console.log('🔒 访问令牌无效，尝试刷新令牌')
      
      // 尝试使用刷新令牌获取新的访问令牌
      const refreshToken = useCookie('qaq_refresh_token').value
      
      if (refreshToken) {
        const authResult = await authService.refreshAccessToken(refreshToken)
        
        if (authResult) {
          // 更新cookie中的令牌
          const accessTokenCookie = useCookie('qaq_access_token', {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 // 15分钟
          })
          
          const refreshTokenCookie = useCookie('qaq_refresh_token', {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 // 7天
          })
          
          accessTokenCookie.value = authResult.accessToken
          refreshTokenCookie.value = authResult.refreshToken
          
          console.log('✅ 令牌刷新成功')
          return
        }
      }
      
      // 刷新令牌也失败了，清除所有令牌并重定向到登录页面
      console.log('🔒 令牌刷新失败，重定向到登录页面')
      
      const accessTokenCookie = useCookie('qaq_access_token')
      const refreshTokenCookie = useCookie('qaq_refresh_token')
      
      accessTokenCookie.value = null
      refreshTokenCookie.value = null
      
      return navigateTo('/auth/login')
    }

    // 用户认证成功，将用户信息存储到状态中
    const authStore = useAuthStore()
    authStore.setUser(user)
    
    console.log(`✅ 用户认证成功: ${user.email}`)

  } catch (error) {
    console.error('❌ 认证中间件错误:', error)
    return navigateTo('/auth/login')
  }
})
