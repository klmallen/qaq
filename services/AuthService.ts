/**
 * QAQ游戏引擎 - 用户认证服务
 *
 * 功能说明：
 * - 处理用户注册、登录、登出操作
 * - 管理用户会话和JWT令牌
 * - 提供密码加密和验证功能
 * - 处理用户权限和访问控制
 *
 * 作者：QAQ游戏引擎团队
 * 创建时间：2024年
 */

import { prismaManager } from '~/lib/prisma'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

// 动态类型导入，避免静态导入问题
type PrismaClient = any
type User = any
type UserSession = any

/**
 * 用户注册参数接口
 */
export interface RegisterUserParams {
  /** 邮箱地址 */
  email: string
  /** 密码 */
  password: string
  /** 名字（可选） */
  firstName?: string
  /** 姓氏（可选） */
  lastName?: string
  /** 用户名（可选） */
  username?: string
}

/**
 * 用户登录参数接口
 */
export interface LoginUserParams {
  /** 邮箱地址 */
  email: string
  /** 密码 */
  password: string
  /** IP地址（可选） */
  ipAddress?: string
  /** 用户代理（可选） */
  userAgent?: string
}

/**
 * 认证结果接口
 */
export interface AuthResult {
  /** 用户信息 */
  user: Omit<User, 'password'>
  /** 访问令牌 */
  accessToken: string
  /** 刷新令牌 */
  refreshToken: string
  /** 令牌过期时间 */
  expiresAt: Date
}

/**
 * JWT载荷接口
 */
export interface JWTPayload {
  /** 用户ID */
  userId: string
  /** 用户邮箱 */
  email: string
  /** 会话ID */
  sessionId: string
  /** 签发时间 */
  iat: number
  /** 过期时间 */
  exp: number
}

/**
 * 用户认证服务类
 * 提供完整的用户认证和会话管理功能
 */
export class AuthService {
  /** JWT密钥 */
  private readonly jwtSecret: Uint8Array
  /** 访问令牌过期时间（15分钟） */
  private readonly accessTokenExpiry = 15 * 60 * 1000
  /** 刷新令牌过期时间（7天） */
  private readonly refreshTokenExpiry = 7 * 24 * 60 * 60 * 1000

  constructor() {
    // 从环境变量获取JWT密钥，如果没有则使用默认值
    const secret = process.env.JWT_SECRET || 'qaq-game-engine-default-secret-key'
    this.jwtSecret = new TextEncoder().encode(secret)
  }

  /**
   * 用户注册
   *
   * @param params 注册参数
   * @returns Promise<AuthResult> 认证结果
   * @throws Error 当注册失败时抛出错误
   */
  async register(params: RegisterUserParams): Promise<AuthResult> {
    console.log(`👤 开始用户注册: ${params.email}`)

    try {
      // 使用全局数据库客户端（用户数据存储在全局数据库中）
      const client = await this.getGlobalClient()

      // 检查邮箱是否已存在
      const existingUser = await client.user.findUnique({
        where: { email: params.email }
      })

      if (existingUser) {
        throw new Error('邮箱地址已被注册')
      }

      // 检查用户名是否已存在（如果提供了用户名）
      if (params.username) {
        const existingUsername = await client.user.findUnique({
          where: { username: params.username }
        })

        if (existingUsername) {
          throw new Error('用户名已被使用')
        }
      }

      // 加密密码
      const hashedPassword = await this.hashPassword(params.password)

      // 创建用户
      const user = await client.user.create({
        data: {
          email: params.email,
          password: hashedPassword,
          firstName: params.firstName,
          lastName: params.lastName,
          username: params.username,
          isVerified: false // 新用户默认未验证
        }
      })

      // 创建会话
      const authResult = await this.createUserSession(user.id)

      console.log(`✅ 用户注册成功: ${user.email} (ID: ${user.id})`)
      return authResult

    } catch (error) {
      console.error(`❌ 用户注册失败: ${params.email}`, error)
      throw new Error(`注册失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 用户登录
   *
   * @param params 登录参数
   * @returns Promise<AuthResult> 认证结果
   * @throws Error 当登录失败时抛出错误
   */
  async login(params: LoginUserParams): Promise<AuthResult> {
    console.log(`🔐 开始用户登录: ${params.email}`)

    try {
      const client = await this.getGlobalClient()

      // 查找用户
      const user = await client.user.findUnique({
        where: { email: params.email }
      })

      if (!user) {
        throw new Error('邮箱或密码错误')
      }

      // 检查用户是否激活
      if (!user.isActive) {
        throw new Error('账户已被禁用')
      }

      // 验证密码
      const isPasswordValid = await this.verifyPassword(params.password, user.password)
      if (!isPasswordValid) {
        throw new Error('邮箱或密码错误')
      }

      // 更新最后登录时间
      await client.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })

      // 创建会话
      const authResult = await this.createUserSession(user.id, {
        ipAddress: params.ipAddress,
        userAgent: params.userAgent
      })

      console.log(`✅ 用户登录成功: ${user.email}`)
      return authResult

    } catch (error) {
      console.error(`❌ 用户登录失败: ${params.email}`, error)
      throw new Error(`登录失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 验证访问令牌
   *
   * @param token 访问令牌
   * @returns Promise<User | null> 用户信息或null
   */
  async verifyAccessToken(token: string): Promise<Omit<User, 'password'> | null> {
    try {
      console.log('🔍 开始验证访问令牌...')
      console.log('🔑 Token长度:', token?.length || 0)
      console.log('🔑 Token前缀:', token?.substring(0, 20) + '...')

      if (!token) {
        console.log('❌ Token为空')
        return null
      }

      // 验证JWT令牌
      console.log('🔐 验证JWT签名...')
      const { payload } = await jwtVerify(token, this.jwtSecret)
      const jwtPayload = payload as unknown as JWTPayload
      console.log('✅ JWT签名验证成功')
      console.log('📋 JWT载荷:', {
        sessionId: jwtPayload.sessionId,
        userId: jwtPayload.userId,
        exp: jwtPayload.exp,
        iat: jwtPayload.iat
      })

      const client = await this.getGlobalClient()
      console.log('✅ 数据库连接获取成功')

      // 检查会话是否存在且有效
      console.log('🔍 查找用户会话...')
      const session = await client.userSession.findUnique({
        where: {
          id: jwtPayload.sessionId,
          token: token
        },
        include: { user: true }
      })

      if (!session) {
        console.log('❌ 会话不存在')
        return null
      }

      console.log('✅ 会话找到:', {
        sessionId: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt,
        isExpired: session.expiresAt < new Date()
      })

      if (session.expiresAt < new Date()) {
        console.log('❌ 会话已过期')
        return null
      }

      // 返回用户信息（排除密码）
      const { password, ...userWithoutPassword } = session.user
      console.log('✅ 用户验证成功:', {
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
        isActive: userWithoutPassword.isActive
      })

      return userWithoutPassword

    } catch (error) {
      console.error('❌ 令牌验证失败:', error)
      console.error('❌ 错误详情:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      return null
    }
  }

  /**
   * 刷新访问令牌
   *
   * @param refreshToken 刷新令牌
   * @returns Promise<AuthResult | null> 新的认证结果或null
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthResult | null> {
    try {
      const client = await this.getGlobalClient()

      // 查找刷新令牌对应的会话
      const session = await client.userSession.findUnique({
        where: { refreshToken },
        include: { user: true }
      })

      if (!session || session.expiresAt < new Date()) {
        return null
      }

      // 生成新的访问令牌
      const newExpiresAt = new Date(Date.now() + this.accessTokenExpiry)
      const newAccessToken = await this.generateAccessToken(session.user.id, session.id)

      // 更新会话
      await client.userSession.update({
        where: { id: session.id },
        data: {
          token: newAccessToken,
          expiresAt: newExpiresAt,
          updatedAt: new Date()
        }
      })

      // 返回用户信息（排除密码）
      const { password, ...userWithoutPassword } = session.user

      return {
        user: userWithoutPassword,
        accessToken: newAccessToken,
        refreshToken: session.refreshToken!,
        expiresAt: newExpiresAt
      }

    } catch (error) {
      console.error('❌ 令牌刷新失败:', error)
      return null
    }
  }

  /**
   * 用户登出
   *
   * @param token 访问令牌
   * @returns Promise<boolean> 登出是否成功
   */
  async logout(token: string): Promise<boolean> {
    try {
      const client = await this.getGlobalClient()

      // 删除会话
      const result = await client.userSession.deleteMany({
        where: { token }
      })

      console.log(`🚪 用户登出成功`)
      return result.count > 0

    } catch (error) {
      console.error('❌ 用户登出失败:', error)
      return false
    }
  }

  /**
   * 获取用户信息
   *
   * @param userId 用户ID
   * @returns Promise<User | null> 用户信息（不包含密码）
   */
  async getUserById(userId: string): Promise<Omit<User, 'password'> | null> {
    try {
      const client = await this.getGlobalClient()

      const user = await client.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return null
      }

      // 返回用户信息（排除密码）
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword

    } catch (error) {
      console.error('❌ 获取用户信息失败:', error)
      return null
    }
  }

  // ========================================================================
  // 私有辅助方法
  // ========================================================================

  /**
   * 获取全局数据库客户端
   * 用户数据存储在全局数据库中，而不是项目特定的数据库
   * 只能在服务端使用
   */
  private async getGlobalClient(): Promise<PrismaClient> {
    // 检查是否在服务端环境
    if (typeof window !== 'undefined') {
      throw new Error('AuthService只能在服务端使用，客户端请通过API调用')
    }

    // 使用一个特殊的全局路径来存储用户数据
    const globalDbPath = process.env.GLOBAL_DB_PATH || './global'
    return prismaManager.getProjectClient(globalDbPath)
  }

  /**
   * 加密密码
   *
   * @param password 明文密码
   * @returns Promise<string> 加密后的密码
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
  }

  /**
   * 验证密码
   *
   * @param password 明文密码
   * @param hashedPassword 加密后的密码
   * @returns Promise<boolean> 密码是否正确
   */
  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  /**
   * 生成访问令牌
   *
   * @param userId 用户ID
   * @param sessionId 会话ID
   * @returns Promise<string> 访问令牌
   */
  private async generateAccessToken(userId: string, sessionId: string): Promise<string> {
    const client = await this.getGlobalClient()
    const user = await client.user.findUnique({ where: { id: userId } })

    if (!user) {
      throw new Error('用户不存在')
    }

    const now = Math.floor(Date.now() / 1000)
    const exp = now + Math.floor(this.accessTokenExpiry / 1000)

    return new SignJWT({
      userId,
      email: user.email,
      sessionId,
      iat: now,
      exp
    } as JWTPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .sign(this.jwtSecret)
  }

  /**
   * 生成简单刷新令牌（用于数据库存储）
   *
   * @returns string 刷新令牌
   */
  private generateSimpleRefreshToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  /**
   * 创建用户会话
   *
   * @param userId 用户ID
   * @param metadata 会话元数据
   * @returns Promise<AuthResult> 认证结果
   */
  private async createUserSession(userId: string, metadata?: {
    ipAddress?: string
    userAgent?: string
  }): Promise<AuthResult> {
    const client = await this.getGlobalClient()

    // 获取用户信息
    const user = await client.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      throw new Error('用户不存在')
    }

    // 生成令牌
    const refreshToken = this.generateSimpleRefreshToken()
    console.log('🔑 生成的refreshToken类型:', typeof refreshToken, '值:', refreshToken)
    const expiresAt = new Date(Date.now() + this.accessTokenExpiry)

    // 创建会话记录
    const session = await client.userSession.create({
      data: {
        userId,
        token: '', // 临时占位符，稍后更新
        refreshToken,
        expiresAt,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent
      }
    })

    // 生成访问令牌
    const accessToken = await this.generateAccessToken(userId, session.id)

    // 更新会话记录中的访问令牌
    await client.userSession.update({
      where: { id: session.id },
      data: { token: accessToken }
    })

    // 返回用户信息（排除密码）
    const { password, ...userWithoutPassword } = user

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
      expiresAt
    }
  }

  /**
   * 生成JWT刷新令牌
   *
   * @param user 用户信息
   * @returns Promise<string> 刷新令牌
   */
  async generateJWTRefreshToken(user: any): Promise<string> {
    const payload = {
      userId: user.id,
      email: user.email,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30天
    }

    return jwt.sign(payload, this.jwtSecret)
  }

  /**
   * 验证刷新令牌
   *
   * @param refreshToken 刷新令牌
   * @returns Promise<any> 解码后的令牌数据
   */
  async verifyRefreshToken(refreshToken: string): Promise<any> {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtSecret) as any

      // 检查令牌类型
      if (decoded.type !== 'refresh') {
        throw new Error('无效的令牌类型')
      }

      // 检查是否过期
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('刷新令牌已过期')
      }

      return decoded
    } catch (error) {
      console.error('刷新令牌验证失败:', error)
      throw error
    }
  }

  /**
   * 生成JWT访问令牌
   *
   * @param user 用户信息
   * @returns Promise<string> 访问令牌
   */
  async generateJWTAccessToken(user: any): Promise<string> {
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.accessTokenExpiry
    }

    return jwt.sign(payload, this.jwtSecret)
  }
}

/**
 * 导出认证服务单例实例
 */
export const authService = new AuthService()
