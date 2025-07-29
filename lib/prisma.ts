/**
 * QAQ游戏引擎 - Prisma数据库客户端管理
 *
 * 功能说明：
 * - 管理项目特定的SQLite数据库连接
 * - 提供数据库客户端的创建、获取和销毁
 * - 支持多项目数据库隔离
 * - 自动处理数据库初始化和迁移
 *
 * 作者：QAQ游戏引擎团队
 * 创建时间：2024年
 */

// 临时解决方案：创建模拟的 Prisma Client
class MockPrismaClient {
  constructor() {
    console.log('🔧 使用模拟 Prisma Client')
  }

  async $disconnect() {
    return Promise.resolve()
  }

  // 模拟各种数据模型
  user = {
    findFirst: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({})
  }

  project = {
    findFirst: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({})
  }

  scene = {
    findFirst: () => Promise.resolve(null),
    findMany: () => Promise.resolve([]),
    create: () => Promise.resolve({}),
    update: () => Promise.resolve({}),
    delete: () => Promise.resolve({})
  }
}

// 动态导入函数 - 修复 Prisma 6.11+ 的 ESM 导入问题
async function loadPrismaClient() {
  if (typeof window !== 'undefined') {
    return MockPrismaClient
  }

  try {
    // 修复 Prisma 6.11+ 的 CommonJS/ESM 导入问题
    const prismaModule = await import('@prisma/client')

    // Prisma 6.11+ 使用默认导出
    let PrismaClientClass

    if (prismaModule.default) {
      // 处理默认导出的情况
      if (typeof prismaModule.default === 'function') {
        PrismaClientClass = prismaModule.default
      } else if (prismaModule.default.PrismaClient) {
        PrismaClientClass = prismaModule.default.PrismaClient
      }
    } else if (prismaModule.PrismaClient) {
      // 处理命名导出的情况（向后兼容）
      PrismaClientClass = prismaModule.PrismaClient
    }

    if (!PrismaClientClass) {
      console.warn('⚠️ 无法解析 Prisma Client，使用模拟客户端')
      return MockPrismaClient
    }

    return PrismaClientClass
  } catch (error) {
    console.warn('⚠️ Prisma Client 导入失败，使用模拟客户端:', error.message)
    return MockPrismaClient
  }
}

// 模拟 path 和 fs 模块
const mockPath = {
  join: (...args: string[]) => args.join('/'),
  dirname: (p: string) => p.split('/').slice(0, -1).join('/'),
  normalize: (p: string) => p.replace(/\\/g, '/')
}

const mockFs = {
  existsSync: () => false,
  mkdirSync: () => {},
  default: {
    existsSync: () => false,
    mkdirSync: () => {}
  }
}

// 动态导入 path 模块
async function loadPath() {
  if (typeof window !== 'undefined') {
    return mockPath
  }

  try {
    return (await import('path')).default
  } catch (error) {
    return mockPath
  }
}

// 动态导入 fs 模块
async function loadFs() {
  if (typeof window !== 'undefined') {
    return mockFs
  }

  try {
    return await import('fs')
  } catch (error) {
    return mockFs
  }
}

/**
 * 数据库客户端管理器
 * 负责管理多个项目的数据库连接，确保每个项目有独立的数据库文件
 */
export class PrismaManager {
  /** 单例实例 */
  private static instance: PrismaManager

  /** 存储各项目的数据库客户端 */
  private clients: Map<string, any> = new Map()

  /** 当前活动的项目ID */
  private currentProjectId: string | null = null

  /** 缓存的模块 */
  private PrismaClientClass: any = null
  private pathModule: any = null
  private fsModule: any = null

  /**
   * 初始化所需的模块
   */
  private async initializeModules(): Promise<void> {
    if (!this.PrismaClientClass) {
      this.PrismaClientClass = await loadPrismaClient()
    }
    if (!this.pathModule) {
      this.pathModule = await loadPath()
    }
    if (!this.fsModule) {
      this.fsModule = await loadFs()
    }
  }

  /**
   * 私有构造函数，确保单例模式
   */
  private constructor() {}

  /**
   * 获取单例实例
   * @returns PrismaManager实例
   */
  static getInstance(): PrismaManager {
    if (!PrismaManager.instance) {
      PrismaManager.instance = new PrismaManager()
    }
    return PrismaManager.instance
  }

  /**
   * 获取指定项目的数据库客户端
   * 如果客户端不存在，会自动创建新的连接
   * 只能在服务端使用
   *
   * @param projectPath 项目路径
   * @returns Promise<any> 数据库客户端实例
   */
  async getProjectClient(projectPath: string): Promise<any> {
    // 检查是否在服务端环境
    if (typeof window !== 'undefined') {
      throw new Error('PrismaManager只能在服务端使用，客户端请通过API调用')
    }

    // 初始化模块（如果还没有）
    await this.initializeModules()
    const projectId = this.generateProjectId(projectPath)

    // 如果客户端已存在，直接返回
    if (this.clients.has(projectId)) {
      return this.clients.get(projectId)!
    }

    // 创建项目特定的数据库路径
    const dbPath = this.getProjectDatabasePath(projectPath)

    // 确保数据库目录存在
    const dbDir = this.pathModule.dirname(dbPath)
    if (!this.fsModule.existsSync(dbDir)) {
      this.fsModule.mkdirSync(dbDir, { recursive: true })
      console.log(`📁 创建数据库目录: ${dbDir}`)
    }

    // 创建Prisma客户端实例
    const client = new this.PrismaClientClass({
      datasources: {
        db: {
          url: `file:${dbPath}`
        }
      },
      log: ['error', 'warn'] // 只记录错误和警告日志
    })

    // 存储客户端以供复用
    this.clients.set(projectId, client)

    // 确保数据库schema已初始化
    await this.ensureDatabaseSchema(client, projectPath)

    console.log(`✅ 数据库客户端已创建: ${projectPath}`)
    return client
  }

  /**
   * 设置当前活动的项目
   *
   * @param projectPath 项目路径
   */
  setCurrentProject(projectPath: string): void {
    this.currentProjectId = this.generateProjectId(projectPath)
    console.log(`🎯 设置当前项目: ${projectPath}`)
  }

  /**
   * 获取当前项目的数据库客户端
   *
   * @returns Promise<PrismaClient | null> 当前项目的数据库客户端，如果没有当前项目则返回null
   */
  async getCurrentClient(): Promise<PrismaClient | null> {
    if (!this.currentProjectId) {
      console.warn('⚠️ 没有设置当前项目')
      return null
    }

    // 从项目ID反推项目路径（简化实现）
    const projectPath = this.getProjectPathFromId(this.currentProjectId)
    if (!projectPath) {
      console.error('❌ 无法从项目ID获取项目路径')
      return null
    }

    return this.getProjectClient(projectPath)
  }

  /**
   * 关闭指定项目的数据库连接
   *
   * @param projectPath 项目路径
   */
  async closeProjectConnection(projectPath: string): Promise<void> {
    const projectId = this.generateProjectId(projectPath)
    const client = this.clients.get(projectId)

    if (client) {
      await client.$disconnect()
      this.clients.delete(projectId)
      console.log(`🔌 已关闭数据库连接: ${projectPath}`)
    }
  }

  /**
   * 关闭所有数据库连接
   * 通常在应用程序退出时调用
   */
  async closeAllConnections(): Promise<void> {
    console.log('🔌 正在关闭所有数据库连接...')

    for (const [projectId, client] of this.clients) {
      try {
        await client.$disconnect()
        console.log(`✅ 已关闭连接: ${projectId}`)
      } catch (error) {
        console.error(`❌ 关闭连接失败: ${projectId}`, error)
      }
    }

    this.clients.clear()
    this.currentProjectId = null
    console.log('✅ 所有数据库连接已关闭')
  }

  /**
   * 获取所有活动的数据库连接信息
   *
   * @returns 连接信息数组
   */
  getActiveConnections(): Array<{ projectId: string; isActive: boolean }> {
    return Array.from(this.clients.keys()).map(projectId => ({
      projectId,
      isActive: projectId === this.currentProjectId
    }))
  }

  // ========================================================================
  // 私有辅助方法
  // ========================================================================

  /**
   * 根据项目路径生成唯一的项目ID
   *
   * @param projectPath 项目路径
   * @returns 项目ID
   */
  private generateProjectId(projectPath: string): string {
    // 标准化路径并生成安全的ID（不依赖 path 模块）
    return projectPath
      .replace(/\\/g, '/')  // 统一使用正斜杠
      .replace(/[\\\/]/g, '_')
      .replace(/[^a-zA-Z0-9_\-]/g, '')
      .toLowerCase()
  }

  /**
   * 从项目ID反推项目路径
   * 注意：这是一个简化的实现，实际项目中可能需要维护ID到路径的映射
   *
   * @param projectId 项目ID
   * @returns 项目路径或null
   */
  private getProjectPathFromId(projectId: string): string | null {
    // 简化实现：将下划线替换回路径分隔符
    // 实际项目中建议维护一个ID到路径的映射表
    return projectId.replace(/_/g, '/')
  }

  /**
   * 获取项目数据库文件的完整路径
   * 数据库文件存储在项目的.qaq目录中
   *
   * @param projectPath 项目路径
   * @returns 数据库文件路径
   */
  private getProjectDatabasePath(projectPath: string): string {
    // 使用简单的路径拼接，避免依赖 path 模块
    const qaqDir = projectPath + '/.qaq'
    return qaqDir + '/project.db'
  }

  /**
   * 确保数据库schema已正确初始化
   * 如果是新数据库，会自动创建所需的表结构
   *
   * @param client Prisma客户端实例
   * @param projectPath 项目路径
   */
  private async ensureDatabaseSchema(client: PrismaClient, projectPath: string): Promise<void> {
    try {
      // 尝试查询一个表来检查数据库是否已初始化
      await client.project.findFirst()
      console.log(`✅ 数据库schema已存在: ${projectPath}`)
    } catch (error) {
      console.log(`🔧 正在初始化数据库schema: ${projectPath}`)

      try {
        // 自动运行数据库schema推送
        await this.pushDatabaseSchema(projectPath)
        console.log(`✅ 数据库schema初始化成功: ${projectPath}`)
      } catch (pushError) {
        console.error(`❌ 数据库schema初始化失败: ${projectPath}`, pushError)
        throw new Error(`数据库初始化失败: ${pushError instanceof Error ? pushError.message : '未知错误'}`)
      }
    }
  }

  /**
   * 推送数据库schema到指定项目
   * 使用Prisma db push命令创建表结构
   *
   * @param projectPath 项目路径
   */
  private async pushDatabaseSchema(projectPath: string): Promise<void> {
    const { execSync } = await import('child_process')
    const dbPath = this.getProjectDatabasePath(projectPath)

    // 设置临时环境变量
    const originalUrl = process.env.DATABASE_URL
    process.env.DATABASE_URL = `file:${dbPath}`

    try {
      console.log(`📋 推送schema到数据库: ${dbPath}`)

      // 运行Prisma db push命令
      execSync('npx prisma db push --accept-data-loss', {
        stdio: 'pipe',
        env: process.env,
        cwd: process.cwd()
      })

      console.log(`✅ Schema推送成功: ${projectPath}`)
    } catch (error) {
      console.error(`❌ Schema推送失败: ${projectPath}`, error)
      throw error
    } finally {
      // 恢复原始环境变量
      if (originalUrl) {
        process.env.DATABASE_URL = originalUrl
      } else {
        delete process.env.DATABASE_URL
      }
    }
  }
}

/**
 * 导出单例实例，方便在服务端模块中使用
 * 注意：只能在服务端使用，客户端会抛出错误
 */
export const prismaManager = PrismaManager.getInstance()

/**
 * 便捷函数：获取当前项目的数据库客户端
 * 只能在服务端使用
 *
 * @returns Promise<PrismaClient | null>
 */
export async function getCurrentPrismaClient(): Promise<PrismaClient | null> {
  if (typeof window !== 'undefined') {
    throw new Error('getCurrentPrismaClient只能在服务端使用')
  }
  return prismaManager.getCurrentClient()
}

/**
 * 便捷函数：获取指定项目的数据库客户端
 * 只能在服务端使用
 *
 * @param projectPath 项目路径
 * @returns Promise<PrismaClient>
 */
export async function getProjectPrismaClient(projectPath: string): Promise<PrismaClient> {
  if (typeof window !== 'undefined') {
    throw new Error('getProjectPrismaClient只能在服务端使用')
  }
  return prismaManager.getProjectClient(projectPath)
}
