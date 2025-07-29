/**
 * QAQ游戏引擎 - 服务端Prisma工具函数
 *
 * 为服务端API提供统一的Prisma客户端和认证服务访问
 */

import { getCurrentPrismaClient, getProjectPrismaClient } from '~/lib/prisma'
import { AuthService } from '~/services/AuthService'

/**
 * 获取Prisma客户端实例
 * 优先使用当前项目的客户端，如果没有则使用全局客户端
 */
export async function getPrismaClient() {
  try {
    // 尝试获取当前项目的客户端
    const currentClient = await getCurrentPrismaClient()
    if (currentClient) {
      return currentClient
    }

    // 如果没有当前项目，使用默认项目路径
    const defaultProjectPath = process.cwd()
    return await getProjectPrismaClient(defaultProjectPath)
  } catch (error) {
    console.error('❌ 获取Prisma客户端失败:', error)
    throw new Error('数据库连接失败')
  }
}

/**
 * 获取认证服务实例
 */
export async function getAuthService() {
  return new AuthService()
}

/**
 * 获取指定项目的Prisma客户端
 */
export async function getProjectClient(projectPath: string) {
  return await getProjectPrismaClient(projectPath)
}