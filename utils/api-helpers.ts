/**
 * QAQ游戏引擎 - API开发辅助函数
 * 
 * 提供API开发中常用的工具函数和辅助方法
 */

import { AuthService } from '~/services/AuthService'

const authService = new AuthService()

/**
 * 分页参数解析
 * @param query 查询参数对象
 * @returns 解析后的分页参数
 */
export function parsePaginationQuery(query: any) {
  const page = Math.max(1, parseInt(query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20))
  const skip = (page - 1) * limit
  
  return { page, limit, skip }
}

/**
 * 搜索条件构建
 * @param search 搜索关键词
 * @param fields 搜索字段数组
 * @returns Prisma查询条件
 */
export function buildSearchCondition(search: string, fields: string[]) {
  if (!search) return {}
  
  return {
    OR: fields.map(field => ({
      [field]: { contains: search, mode: 'insensitive' }
    }))
  }
}

/**
 * 排序条件解析
 * @param query 查询参数
 * @param allowedFields 允许排序的字段
 * @param defaultSort 默认排序字段
 * @returns Prisma排序条件
 */
export function parseSortQuery(query: any, allowedFields: string[], defaultSort = 'createdAt') {
  const sortBy = allowedFields.includes(query.sortBy) ? query.sortBy : defaultSort
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc'
  
  return { [sortBy]: sortOrder }
}

/**
 * 获取客户端IP地址
 * @param event H3Event对象
 * @returns 客户端IP地址
 */
export function getClientIP(event: any): string {
  const headers = getHeaders(event)
  
  return (
    headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    headers['x-real-ip'] ||
    headers['cf-connecting-ip'] ||
    event.node?.req?.connection?.remoteAddress ||
    '127.0.0.1'
  )
}

/**
 * 用户认证辅助函数
 * @param event H3Event对象
 * @returns 认证用户信息
 */
export async function authenticateUser(event: any) {
  const headers = getHeaders(event)
  const authorization = headers.authorization
  
  if (!authorization?.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: '需要认证'
    })
  }
  
  const token = authorization.substring(7)
  const user = await authService.verifyAccessToken(token)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: '无效的认证令牌'
    })
  }
  
  return user
}

/**
 * 权限验证函数
 * @param user 用户对象
 * @param resource 资源类型
 * @param action 操作类型
 */
export async function requirePermission(user: any, resource: string, action: string) {
  // 基础权限检查逻辑
  if (action === 'delete' && user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: '权限不足'
    })
  }
  
  // 可以根据需要扩展更复杂的权限逻辑
}

/**
 * 统一成功响应格式
 * @param message 响应消息
 * @param data 响应数据
 * @returns 标准化响应对象
 */
export function successResponse<T = any>(message: string, data?: T) {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  }
}

/**
 * 统一错误响应格式
 * @param message 错误消息
 * @param error 错误详情
 * @returns 标准化错误响应对象
 */
export function errorResponse(message: string, error?: string) {
  return {
    success: false,
    message,
    error,
    timestamp: new Date().toISOString()
  }
}

/**
 * API错误处理函数
 * @param error 错误对象
 * @param context 错误上下文
 */
export function handleApiError(error: any, context: string) {
  console.error(`❌ ${context}API错误:`, error)
  
  // 已知错误直接抛出
  if (error.statusCode) {
    throw error
  }
  
  // Prisma错误处理
  if (error.code === 'P2002') {
    throw createError({
      statusCode: 409,
      statusMessage: '数据已存在'
    })
  }
  
  if (error.code === 'P2025') {
    throw createError({
      statusCode: 404,
      statusMessage: '记录不存在'
    })
  }
  
  // 默认服务器错误
  throw createError({
    statusCode: 500,
    statusMessage: '服务器内部错误'
  })
}

/**
 * 数据验证辅助函数
 * @param data 待验证数据
 * @param rules 验证规则
 * @returns 验证结果
 */
export function validateData(data: any, rules: Record<string, any>) {
  const errors: Record<string, string> = {}
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field]
    
    // 必填验证
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors[field] = `${field}不能为空`
      continue
    }
    
    // 如果字段为空且不是必填，跳过其他验证
    if (!value && !rule.required) continue
    
    // 长度验证
    if (rule.minLength && value.length < rule.minLength) {
      errors[field] = `${field}长度不能少于${rule.minLength}个字符`
    }
    
    if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `${field}长度不能超过${rule.maxLength}个字符`
    }
    
    // 正则验证
    if (rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.message || `${field}格式不正确`
    }
    
    // 邮箱验证
    if (rule.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        errors[field] = `${field}格式不正确`
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * 性能监控装饰器
 * @param handler API处理函数
 * @returns 包装后的处理函数
 */
export function withPerformanceMonitoring(handler: Function) {
  return async (event: any) => {
    const startTime = Date.now()
    const method = getMethod(event)
    const url = getRequestURL(event)
    
    try {
      const result = await handler(event)
      
      // 记录成功请求
      console.log(`✅ ${method} ${url.pathname} - ${Date.now() - startTime}ms`)
      
      return result
    } catch (error) {
      // 记录错误请求
      console.error(`❌ ${method} ${url.pathname} - ${Date.now() - startTime}ms - ${error.message}`)
      throw error
    }
  }
}

/**
 * 请求频率限制（简单实现）
 * @param event H3Event对象
 * @param options 限制选项
 */
export async function rateLimit(event: any, options: { max: number; windowMs: number }) {
  const clientIP = getClientIP(event)
  const key = `rate_limit:${clientIP}`
  
  // 这里应该使用Redis或其他缓存系统
  // 简单实现仅作示例
  const now = Date.now()
  const windowStart = now - options.windowMs
  
  // 实际项目中应该使用Redis等缓存系统来实现
  console.log(`Rate limit check for ${clientIP}: ${key}`)
  
  // 如果超过限制，抛出错误
  // if (requestCount > options.max) {
  //   throw createError({
  //     statusCode: 429,
  //     statusMessage: '请求过于频繁，请稍后再试'
  //   })
  // }
}

/**
 * 批量操作辅助函数
 * @param items 待处理项目数组
 * @param operation 操作函数
 * @param batchSize 批次大小
 * @returns 处理结果数组
 */
export async function batchOperation<T>(
  items: T[],
  operation: (item: T) => Promise<any>,
  batchSize = 10
) {
  const results = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(operation))
    results.push(...batchResults)
  }
  
  return results
}

/**
 * 生成唯一ID
 * @returns 唯一标识符
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 安全的JSON解析
 * @param jsonString JSON字符串
 * @param defaultValue 默认值
 * @returns 解析结果
 */
export function safeJsonParse(jsonString: string, defaultValue: any = null) {
  try {
    return JSON.parse(jsonString)
  } catch (error) {
    console.warn('JSON解析失败:', error)
    return defaultValue
  }
}

/**
 * 文件大小格式化
 * @param bytes 字节数
 * @returns 格式化后的文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 时间格式化
 * @param date 日期对象
 * @returns 格式化后的时间字符串
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}
