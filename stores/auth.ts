/**
 * QAQ游戏引擎 - 认证状态管理
 *
 * 功能说明：
 * - 管理用户登录状态
 * - 存储用户信息和令牌
 * - 提供登录、登出、注册等操作
 * - 处理认证状态的持久化
 *
 * 作者：QAQ游戏引擎团队
 * 创建时间：2024年
 */

import { defineStore } from 'pinia'
import type { User } from '@prisma/client'

/**
 * 注册用户参数接口
 */
export interface RegisterUserParams {
  email: string
  password: string
  confirmPassword: string
  firstName?: string
  lastName?: string
  username?: string
}

/**
 * 登录用户参数接口
 */
export interface LoginUserParams {
  email: string
  password: string
  rememberMe?: boolean
}

/**
 * 认证结果接口
 */
export interface AuthResult {
  user: User
  token: string
  refreshToken?: string
  expiresAt: Date
}

/**
 * 用户信息接口（不包含密码）
 */
export interface UserInfo extends Omit<User, 'password'> {}

/**
 * 认证状态接口
 */
export interface AuthState {
  /** 当前用户信息 */
  user: UserInfo | null
  /** 是否已登录 */
  isAuthenticated: boolean
  /** 是否正在加载 */
  isLoading: boolean
  /** 错误信息 */
  error: string | null
  /** 访问令牌 */
  token: string | null
  /** 刷新令牌 */
  refreshToken: string | null
  /** 令牌过期时间 */
  expiresAt: string | null
  /** 令牌刷新定时器 */
  tokenRefreshTimer: NodeJS.Timeout | null
}

/**
 * 认证状态管理Store
 */
export const useAuthStore = defineStore('auth', {
  // ========================================================================
  // 状态定义
  // ========================================================================
  state: (): AuthState => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    token: null,
    refreshToken: null,
    expiresAt: null,
    tokenRefreshTimer: null
  }),

  // ========================================================================
  // 计算属性
  // ========================================================================
  getters: {
    /**
     * 获取用户全名
     */
    userFullName: (state): string => {
      if (!state.user) return ''
      const { firstName, lastName } = state.user
      return [firstName, lastName].filter(Boolean).join(' ') || state.user.email
    },

    /**
     * 获取用户显示名称
     */
    userDisplayName: (state): string => {
      if (!state.user) return ''
      return state.user.username || state.user.email
    },

    /**
     * 检查用户是否已验证邮箱
     */
    isEmailVerified: (state): boolean => {
      return state.user?.isVerified || false
    },

    /**
     * 获取用户头像URL
     */
    userAvatar: (state): string | null => {
      return state.user?.avatar || null
    },

    /**
     * 获取用户ID
     */
    userId: (state): string | null => {
      return state.user?.id || null
    },

    /**
     * 获取用户邮箱
     */
    userEmail: (state): string | null => {
      return state.user?.email || null
    },

    /**
     * 检查用户信息是否完整
     */
    isUserInfoComplete: (state): boolean => {
      if (!state.user) return false
      return !!(state.user.id && state.user.email && state.user.firstName && state.user.lastName)
    },

    /**
     * 检查用户账户是否激活
     */
    isAccountActive: (state): boolean => {
      return state.user?.isActive || false
    }
  },

  // ========================================================================
  // 操作方法
  // ========================================================================
  actions: {
    /**
     * 用户注册
     *
     * @param params 注册参数
     * @returns Promise<boolean> 注册是否成功
     */
    async register(params: RegisterUserParams): Promise<boolean> {
      this.isLoading = true
      this.error = null

      try {
        console.log('📝 开始用户注册...')

        // 调用服务端API进行注册
        const response = await $fetch('/api/auth/register', {
          method: 'POST',
          body: {
            email: params.email,
            password: params.password,
            confirmPassword: params.confirmPassword,
            firstName: params.firstName,
            lastName: params.lastName,
            username: params.username
          }
        })

        console.log('🔍 注册API响应:', response)

        // 检查响应结构
        if (!response.success || !response.data) {
          throw new Error(response.message || '注册响应格式错误')
        }

        // 保存认证信息 - 修正数据结构
        this.user = response.data.user
        this.token = response.data.accessToken
        this.refreshToken = response.data.refreshToken
        this.expiresAt = response.data.expiresAt
        this.isAuthenticated = true

        console.log('👤 注册用户信息已保存:', this.user)
        console.log('🔑 注册Token信息已保存:', !!this.token)

        // 保存到localStorage以实现持久化
        this.saveToStorage()

        console.log('✅ 用户注册成功')
        return true

      } catch (error: any) {
        console.error('❌ 用户注册失败:', error)

        // 处理API错误响应
        if (error.data?.statusMessage) {
          this.error = error.data.statusMessage
        } else if (error.statusMessage) {
          this.error = error.statusMessage
        } else {
          this.error = '注册失败，请稍后重试'
        }

        return false

      } finally {
        this.isLoading = false
      }
    },

    /**
     * 用户登录
     *
     * @param params 登录参数
     * @returns Promise<boolean> 登录是否成功
     */
    async login(params: LoginUserParams): Promise<boolean> {
      this.isLoading = true
      this.error = null

      try {
        console.log('🔐 开始用户登录...')

        // 调用服务端API进行登录
        const response = await $fetch('/api/auth/login', {
          method: 'POST',
          body: {
            email: params.email,
            password: params.password,
            rememberMe: params.rememberMe || false
          }
        })

        console.log('🔍 登录API响应:', response)

        // 检查响应结构
        if (!response.success || !response.data) {
          throw new Error(response.message || '登录响应格式错误')
        }

        // 保存认证信息 - 修正数据结构
        this.user = response.data.user
        this.token = response.data.accessToken
        this.refreshToken = response.data.refreshToken
        this.expiresAt = response.data.expiresAt
        this.isAuthenticated = true

        console.log('👤 用户信息已保存:', this.user)
        console.log('🔑 Token信息已保存:', !!this.token)

        // 保存到localStorage以实现持久化
        this.saveToStorage()

        console.log('✅ 用户登录成功')
        console.log('🔑 当前令牌状态:', !!this.token)

        // 延迟一下，确保状态完全更新
        await nextTick()

        // 登录成功后，触发项目列表获取
        if (process.client) {
          try {
            const projectStore = useProjectStore()
            await projectStore.fetchUserProjects()
            console.log('✅ 登录后项目列表加载完成')
          } catch (error) {
            console.warn('⚠️ 登录后项目列表加载失败:', error)
            // 不抛出错误，不影响登录流程
          }
        }

        return true

      } catch (error: any) {
        console.error('❌ 用户登录失败:', error)

        // 处理API错误响应
        if (error.data?.statusMessage) {
          this.error = error.data.statusMessage
        } else if (error.statusMessage) {
          this.error = error.statusMessage
        } else {
          this.error = '登录失败，请稍后重试'
        }

        return false

      } finally {
        this.isLoading = false
      }
    },

    /**
     * 用户登出
     *
     * @returns Promise<void>
     */
    async logout(): Promise<void> {
      this.isLoading = true

      try {
        console.log('🚪 开始用户登出...')

        // 如果有令牌，调用服务端登出API
        if (this.token) {
          try {
            await $fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${this.token}`
              }
            })
          } catch (error) {
            console.warn('服务端登出失败，继续本地清理:', error)
          }
        }

        // 清除本地状态
        this.clearAuth()

        console.log('✅ 用户登出成功')

      } catch (error) {
        console.error('❌ 用户登出失败:', error)
        // 即使登出失败，也要清除本地状态
        this.clearAuth()

      } finally {
        this.isLoading = false
      }
    },

    /**
     * 检查认证状态
     * 在应用启动时调用，检查是否有有效的登录状态
     *
     * @returns Promise<boolean> 是否已认证
     */
    async checkAuth(): Promise<boolean> {
      this.isLoading = true

      try {
        console.log('🔍 检查用户认证状态...')

        // 尝试从localStorage恢复状态
        this.loadFromStorage()

        // 如果没有令牌，直接返回false
        if (!this.token) {
          console.log('❌ 未找到认证令牌')
          return false
        }

        // 验证令牌是否有效
        const response = await $fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        })

        if (response.success && response.data.user) {
          // 更新用户信息
          this.user = response.data.user
          this.isAuthenticated = true
          console.log('✅ 用户认证状态有效:', this.user.email)
          return true
        } else {
          // 令牌无效，清除状态
          this.clearAuth()
          console.log('❌ 认证令牌无效')
          return false
        }

      } catch (error: any) {
        console.error('❌ 检查认证状态失败:', error)

        // 如果是401错误，清除认证状态
        if (error.status === 401) {
          this.clearAuth()
        }

        return false

      } finally {
        this.isLoading = false
      }
    },

    /**
     * 检查认证状态的别名方法
     * 为了兼容首页调用
     */
    async checkAuthStatus(): Promise<boolean> {
      return this.checkAuth()
    },

    /**
     * 刷新用户信息
     *
     * @returns Promise<boolean> 刷新是否成功
     */
    async refreshUserInfo(): Promise<boolean> {
      if (!this.user) {
        return false
      }

      try {
        const user = await authService.getUserById(this.user.id)

        if (user) {
          this.setUser(user)
          console.log('✅ 用户信息刷新成功')
          return true
        }

        return false

      } catch (error) {
        console.error('❌ 用户信息刷新失败:', error)
        return false
      }
    },

    /**
     * 设置用户信息
     *
     * @param user 用户信息
     */
    setUser(user: UserInfo): void {
      this.user = user
      this.isAuthenticated = true
      this.error = null
    },

    /**
     * 设置认证结果
     *
     * @param authResult 认证结果
     */
    setAuthResult(authResult: AuthResult): void {
      // 设置用户信息
      this.setUser(authResult.user)

      // 保存令牌到cookie
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
    },

    /**
     * 保存认证信息到localStorage
     * 实现安全的持久化存储，包含过期时间和安全检查
     */
    saveToStorage() {
      if (process.client) {
        try {
          // 验证必要的数据是否存在
          if (!this.user || !this.token) {
            console.warn('⚠️ 用户信息或token缺失，跳过保存')
            return
          }

          // 计算30天后的过期时间
          const expirationTime = new Date()
          expirationTime.setDate(expirationTime.getDate() + 30)

          const authData = {
            user: {
              id: this.user.id,
              email: this.user.email,
              username: this.user.username,
              firstName: this.user.firstName,
              lastName: this.user.lastName,
              avatar: this.user.avatar,
              isActive: this.user.isActive,
              createdAt: this.user.createdAt,
              updatedAt: this.user.updatedAt
            },
            token: this.token,
            refreshToken: this.refreshToken,
            expiresAt: this.expiresAt || expirationTime.toISOString(),
            isAuthenticated: this.isAuthenticated,
            savedAt: new Date().toISOString(),
            version: '1.0.0', // 用于未来的数据迁移
            domain: window.location.hostname // 安全检查
          }

          // 使用加密存储（简单的Base64编码，生产环境应使用更强的加密）
          const encodedData = btoa(JSON.stringify(authData))
          localStorage.setItem('qaq-auth', encodedData)

          // 同时设置一个简单的标记用于快速检查
          localStorage.setItem('qaq-auth-status', 'authenticated')

          console.log('✅ 认证信息已安全保存到localStorage')
          console.log('👤 保存的用户信息:', {
            id: this.user.id,
            email: this.user.email,
            username: this.user.username,
            firstName: this.user.firstName,
            lastName: this.user.lastName
          })
          console.log('🔑 Token过期时间:', authData.expiresAt)

        } catch (error) {
          console.warn('❌ 保存认证信息失败:', error)
        }
      }
    },

    /**
     * 从localStorage加载认证信息
     * 包含安全检查、过期检测和自动续期逻辑
     */
    loadFromStorage() {
      if (process.client) {
        try {
          // 首先检查快速状态标记
          const authStatus = localStorage.getItem('qaq-auth-status')
          if (authStatus !== 'authenticated') {
            console.log('❌ 未找到认证状态标记')
            return false
          }

          const encodedAuthData = localStorage.getItem('qaq-auth')
          if (!encodedAuthData) {
            console.log('❌ 未找到认证数据')
            this.clearStorage()
            return false
          }

          // 解码数据
          const authData = atob(encodedAuthData)
          const parsed = JSON.parse(authData)

          // 安全检查：验证域名
          if (parsed.domain && parsed.domain !== window.location.hostname) {
            console.warn('⚠️ 域名不匹配，清除认证数据')
            this.clearStorage()
            return false
          }

          // 检查数据完整性
          if (!parsed.user || !parsed.token) {
            console.warn('⚠️ 认证数据不完整')
            this.clearStorage()
            return false
          }

          // 验证用户信息的完整性
          if (!parsed.user.id || !parsed.user.email) {
            console.warn('⚠️ 用户信息不完整，缺少必要字段')
            this.clearStorage()
            return false
          }

          const now = new Date()
          const expiresAt = new Date(parsed.expiresAt)
          const timeDiff = expiresAt.getTime() - now.getTime()
          const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

          // 检查是否过期
          if (expiresAt <= now) {
            console.log('⚠️ Token已过期，尝试刷新...')
            // 尝试使用refresh token刷新
            if (parsed.refreshToken) {
              this.scheduleTokenRefresh(true) // 立即刷新
            } else {
              this.clearStorage()
              return false
            }
          }

          // 恢复认证状态
          this.user = parsed.user
          this.token = parsed.token
          this.refreshToken = parsed.refreshToken
          this.expiresAt = parsed.expiresAt
          this.isAuthenticated = true

          console.log('✅ 从localStorage恢复认证状态:', this.user?.email)
          console.log('👤 恢复的用户信息:', {
            id: this.user?.id,
            email: this.user?.email,
            username: this.user?.username,
            firstName: this.user?.firstName,
            lastName: this.user?.lastName,
            avatar: this.user?.avatar
          })
          console.log(`🔑 Token剩余有效期: ${daysUntilExpiry} 天`)

          // 如果token在7天内过期，安排自动刷新
          if (daysUntilExpiry <= 7) {
            console.log('🔄 Token即将过期，安排自动刷新...')
            this.scheduleTokenRefresh()
          }

          return true

        } catch (error) {
          console.warn('❌ 加载认证信息失败:', error)
          this.clearStorage()
        }
      }
      return false
    },

    /**
     * 清除localStorage中的认证信息
     */
    clearStorage() {
      if (process.client) {
        try {
          // 清除所有认证相关的存储
          localStorage.removeItem('qaq-auth')
          localStorage.removeItem('qaq-auth-status')
          localStorage.removeItem('qaq-token-refresh-timer')

          // 清除定时器
          if (this.tokenRefreshTimer) {
            clearTimeout(this.tokenRefreshTimer)
            this.tokenRefreshTimer = null
          }

          console.log('🗑️ 认证信息已完全清除')
        } catch (error) {
          console.warn('❌ 清除认证信息失败:', error)
        }
      }
    },

    /**
     * 自动登录检查
     * 应用启动时调用，尝试从存储中恢复认证状态
     */
    async autoLogin(): Promise<boolean> {
      console.log('🔄 开始自动登录检查...')

      // 首先尝试从localStorage恢复
      const hasStoredAuth = this.loadFromStorage()

      if (!hasStoredAuth || !this.token) {
        console.log('❌ 没有有效的存储认证信息')
        return false
      }

      try {
        // 验证token是否仍然有效
        const response = await $fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        })

        if (response.success && response.data.user) {
          // 更新用户信息（可能有变化）
          this.user = response.data.user
          this.isAuthenticated = true

          // 重新保存到localStorage（更新用户信息）
          this.saveToStorage()

          console.log('✅ 自动登录成功:', this.user.email)
          console.log('🔑 当前令牌状态:', !!this.token)

          // 延迟一下，确保状态完全更新
          await nextTick()

          // 自动登录成功后，触发项目列表获取
          if (process.client) {
            try {
              const projectStore = useProjectStore()
              await projectStore.fetchUserProjects()
              console.log('✅ 自动登录后项目列表加载完成')
            } catch (error) {
              console.warn('⚠️ 自动登录后项目列表加载失败:', error)
              // 不抛出错误，不影响自动登录流程
            }
          }

          return true
        } else {
          throw new Error('Token验证失败')
        }

      } catch (error: any) {
        console.error('❌ 自动登录失败:', error)

        // Token无效，清除所有认证状态
        this.clearAuth()

        return false
      }
    },

    /**
     * 清除认证状态
     */
    clearAuth(): void {
      // 清除状态
      this.user = null
      this.isAuthenticated = false
      this.error = null

      // 清除localStorage
      this.clearStorage()

      // 清除cookie
      const accessTokenCookie = useCookie('qaq_access_token')
      const refreshTokenCookie = useCookie('qaq_refresh_token')

      accessTokenCookie.value = null
      refreshTokenCookie.value = null
    },

    /**
     * 设置错误信息
     *
     * @param error 错误信息
     */
    setError(error: string): void {
      this.error = error
    },

    /**
     * 清除错误信息
     */
    clearError(): void {
      this.error = null
    },

    /**
     * 安排token自动刷新
     * @param immediate 是否立即刷新
     */
    scheduleTokenRefresh(immediate: boolean = false) {
      if (!process.client) return

      // 清除现有定时器
      if (this.tokenRefreshTimer) {
        clearTimeout(this.tokenRefreshTimer)
        this.tokenRefreshTimer = null
      }

      if (immediate) {
        // 立即刷新
        this.refreshAccessToken()
        return
      }

      if (!this.expiresAt) return

      const now = new Date()
      const expiresAt = new Date(this.expiresAt)
      const timeUntilExpiry = expiresAt.getTime() - now.getTime()

      // 在过期前1小时刷新token
      const refreshTime = Math.max(timeUntilExpiry - (60 * 60 * 1000), 60 * 1000) // 最少1分钟后刷新

      console.log(`🔄 安排在 ${Math.round(refreshTime / 1000 / 60)} 分钟后刷新token`)

      this.tokenRefreshTimer = setTimeout(() => {
        this.refreshAccessToken()
      }, refreshTime)

      // 保存定时器信息到localStorage
      if (process.client) {
        localStorage.setItem('qaq-token-refresh-timer', (now.getTime() + refreshTime).toString())
      }
    },

    /**
     * 刷新访问令牌
     */
    async refreshAccessToken() {
      if (!this.refreshToken) {
        console.warn('❌ 没有刷新令牌，无法刷新访问令牌')
        return false
      }

      try {
        console.log('🔄 开始刷新访问令牌...')

        const response = await $fetch('/api/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            refreshToken: this.refreshToken
          }
        })

        if (response.success && response.data) {
          // 更新token信息
          this.token = response.data.token
          this.refreshToken = response.data.refreshToken || this.refreshToken
          this.expiresAt = response.data.expiresAt

          // 保存到localStorage
          this.saveToStorage()

          // 安排下次刷新
          this.scheduleTokenRefresh()

          console.log('✅ 访问令牌刷新成功')
          return true
        } else {
          throw new Error(response.message || '刷新令牌失败')
        }

      } catch (error: any) {
        console.error('❌ 刷新访问令牌失败:', error)

        // 刷新失败，清除认证状态
        this.logout()
        return false
      }
    },

    /**
     * 检查token是否即将过期
     */
    isTokenExpiringSoon(): boolean {
      if (!this.expiresAt) return false

      const now = new Date()
      const expiresAt = new Date(this.expiresAt)
      const timeUntilExpiry = expiresAt.getTime() - now.getTime()

      // 如果在24小时内过期，认为即将过期
      return timeUntilExpiry < (24 * 60 * 60 * 1000)
    },

    /**
     * 获取token剩余有效时间（分钟）
     */
    getTokenRemainingTime(): number {
      if (!this.expiresAt) return 0

      const now = new Date()
      const expiresAt = new Date(this.expiresAt)
      const timeUntilExpiry = expiresAt.getTime() - now.getTime()

      return Math.max(0, Math.floor(timeUntilExpiry / (1000 * 60)))
    }
  }
})
