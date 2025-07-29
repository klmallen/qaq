/**
 * QAQ游戏引擎 - API开发示例
 * GET /api/example/demo
 * 
 * 这是一个完整的API示例，展示如何使用辅助函数开发API接口
 */

import { PrismaClient } from '@prisma/client'
import { 
  authenticateUser,
  parsePaginationQuery,
  buildSearchCondition,
  parseSortQuery,
  successResponse,
  handleApiError,
  withPerformanceMonitoring,
  validateData
} from '~/utils/api-helpers'

const prisma = new PrismaClient()

export default defineEventHandler(withPerformanceMonitoring(async (event) => {
  try {
    // 1. 验证请求方法
    assertMethod(event, 'GET')
    
    // 2. 用户认证（如果需要）
    const user = await authenticateUser(event)
    
    // 3. 获取并解析查询参数
    const query = getQuery(event)
    
    // 解析分页参数
    const { page, limit, skip } = parsePaginationQuery(query)
    
    // 解析搜索条件
    const searchCondition = buildSearchCondition(
      query.search as string,
      ['name', 'description'] // 搜索字段
    )
    
    // 解析排序条件
    const orderBy = parseSortQuery(
      query,
      ['name', 'createdAt', 'updatedAt'], // 允许排序的字段
      'createdAt' // 默认排序字段
    )
    
    // 4. 构建数据库查询条件
    const where = {
      userId: user.id,
      ...searchCondition,
      // 可以添加其他过滤条件
      isDeleted: false
    }
    
    // 5. 执行数据库查询
    const [projects, totalCount] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          version: true,
          createdAt: true,
          updatedAt: true,
          lastOpened: true,
          // 关联数据统计
          _count: {
            select: {
              scenes: true,
              scripts: true,
              materials: true
            }
          }
        }
      }),
      prisma.project.count({ where })
    ])
    
    // 6. 计算分页信息
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1
    
    // 7. 格式化响应数据
    const formattedProjects = projects.map(project => ({
      ...project,
      stats: project._count,
      _count: undefined // 移除内部字段
    }))
    
    // 8. 返回成功响应
    return successResponse('数据获取成功', {
      projects: formattedProjects,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage
      },
      meta: {
        searchTerm: query.search || '',
        sortBy: orderBy,
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error) {
    // 统一错误处理
    handleApiError(error, '示例API')
  } finally {
    // 确保数据库连接关闭
    await prisma.$disconnect()
  }
}))

/**
 * 使用说明：
 * 
 * 1. 基础请求：
 *    GET /api/example/demo
 *    Headers: Authorization: Bearer <token>
 * 
 * 2. 分页请求：
 *    GET /api/example/demo?page=2&limit=10
 * 
 * 3. 搜索请求：
 *    GET /api/example/demo?search=测试项目
 * 
 * 4. 排序请求：
 *    GET /api/example/demo?sortBy=name&sortOrder=asc
 * 
 * 5. 组合请求：
 *    GET /api/example/demo?page=1&limit=20&search=游戏&sortBy=updatedAt&sortOrder=desc
 */
