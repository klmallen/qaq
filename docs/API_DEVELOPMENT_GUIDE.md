# QAQ游戏引擎 - API开发指南

## 📋 概述

本文档详细介绍如何在QAQ游戏引擎项目中编写和管理API接口，包括文件结构、命名规范、代码示例和最佳实践。

## 📁 1. API接口文件位置

### **目录结构**
```
qaq-game-engine/
├── server/
│   └── api/
│       ├── auth/                 # 认证相关API
│       │   ├── login.post.ts     # 用户登录
│       │   ├── register.post.ts  # 用户注册
│       │   ├── logout.post.ts    # 用户登出
│       │   └── me.get.ts         # 获取当前用户信息
│       ├── projects/             # 项目管理API
│       │   ├── index.get.ts      # 获取项目列表
│       │   ├── create.post.ts    # 创建新项目
│       │   ├── [id].get.ts       # 获取单个项目
│       │   ├── [id].put.ts       # 更新项目
│       │   └── [id].delete.ts    # 删除项目
│       ├── scenes/               # 场景管理API
│       ├── assets/               # 资源管理API
│       └── materials/            # 材质管理API
```

### **API路由映射**
- `server/api/auth/login.post.ts` → `POST /api/auth/login`
- `server/api/projects/index.get.ts` → `GET /api/projects`
- `server/api/projects/[id].get.ts` → `GET /api/projects/:id`

## 📝 2. 文件命名规范

### **命名规则**
```
[路径名称].[HTTP方法].ts
```

### **HTTP方法对应**
- `*.get.ts` - GET请求
- `*.post.ts` - POST请求
- `*.put.ts` - PUT请求
- `*.patch.ts` - PATCH请求
- `*.delete.ts` - DELETE请求

### **动态路由**
- `[id].get.ts` - 单个参数 `/api/resource/:id`
- `[...slug].get.ts` - 多级路径 `/api/resource/path/to/file`

## 💻 3. 代码结构示例

### **基础GET接口示例**
```typescript
/**
 * 获取项目列表API
 * GET /api/projects
 */

import { PrismaClient } from '@prisma/client'
import { AuthService } from '~/services/AuthService'

const prisma = new PrismaClient()
const authService = new AuthService()

export default defineEventHandler(async (event) => {
  try {
    // 1. 验证请求方法
    assertMethod(event, 'GET')

    // 2. 用户认证验证
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

    // 3. 获取查询参数
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const limit = parseInt(query.limit as string) || 20
    const search = query.search as string || ''

    // 4. 构建数据库查询
    const where: any = {
      userId: user.id
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // 5. 执行数据库查询
    const [projects, totalCount] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          scenes: {
            select: { id: true, name: true, isMain: true }
          },
          _count: {
            select: { scenes: true, scripts: true, materials: true }
          }
        }
      }),
      prisma.project.count({ where })
    ])

    // 6. 返回响应
    return {
      success: true,
      message: '项目列表获取成功',
      data: {
        projects,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit
        }
      }
    }

  } catch (error) {
    console.error('❌ 获取项目列表API错误:', error)

    // 处理已知错误
    if (error.statusCode) {
      throw error
    }

    // 未知错误
    throw createError({
      statusCode: 500,
      statusMessage: '服务器内部错误'
    })
  } finally {
    await prisma.$disconnect()
  }
})
```

### **POST接口示例（创建资源）**
```typescript
/**
 * 创建新项目API
 * POST /api/projects/create
 */

import { PrismaClient } from '@prisma/client'
import { AuthService } from '~/services/AuthService'
import path from 'path'
import fs from 'fs/promises'

const prisma = new PrismaClient()
const authService = new AuthService()

export default defineEventHandler(async (event) => {
  try {
    // 1. 验证请求方法
    assertMethod(event, 'POST')

    // 2. 用户认证
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

    // 3. 获取请求体数据
    const body = await readBody(event)
    const { name, description, location, template } = body

    // 4. 数据验证
    if (!name || !location) {
      throw createError({
        statusCode: 400,
        statusMessage: '项目名称和位置不能为空'
      })
    }

    // 验证项目名称格式
    const nameRegex = /^[a-zA-Z0-9\s\-_\u4e00-\u9fa5]+$/
    if (!nameRegex.test(name)) {
      throw createError({
        statusCode: 400,
        statusMessage: '项目名称包含无效字符'
      })
    }

    // 5. 业务逻辑处理
    const sanitizedName = name.replace(/[^a-zA-Z0-9\-_]/g, '-').toLowerCase()
    const projectPath = path.join(location, sanitizedName)

    // 检查项目路径是否已存在
    const existingProject = await prisma.project.findUnique({
      where: { path: projectPath }
    })

    if (existingProject) {
      throw createError({
        statusCode: 409,
        statusMessage: '项目路径已存在'
      })
    }

    // 6. 数据库事务操作
    const result = await prisma.$transaction(async (tx) => {
      // 创建项目记录
      const project = await tx.project.create({
        data: {
          name,
          description: description || '',
          path: projectPath,
          version: '1.0.0',
          engineVersion: '1.0.0',
          userId: user.id,
          isPublic: false,
          settings: {
            renderer: { type: '3d', quality: 'high' },
            physics: { enabled: true, gravity: { x: 0, y: -9.81, z: 0 } }
          },
          lastOpened: new Date()
        }
      })

      // 创建默认场景
      const defaultScene = await tx.scene.create({
        data: {
          name: 'Main',
          path: 'scenes/Main.tscn',
          type: '3d',
          projectId: project.id,
          isMain: true,
          description: '主场景',
          sceneData: {
            nodes: [],
            environment: { skybox: 'default', lighting: 'natural' }
          }
        }
      })

      return { project, defaultScene }
    })

    // 7. 文件系统操作
    try {
      await fs.mkdir(projectPath, { recursive: true })
      await fs.mkdir(path.join(projectPath, 'scenes'), { recursive: true })
      await fs.mkdir(path.join(projectPath, 'assets'), { recursive: true })
      await fs.mkdir(path.join(projectPath, '.qaq'), { recursive: true })
    } catch (fsError) {
      // 如果文件系统操作失败，回滚数据库操作
      await prisma.project.delete({ where: { id: result.project.id } })
      throw createError({
        statusCode: 500,
        statusMessage: '创建项目目录失败'
      })
    }

    // 8. 返回成功响应
    return {
      success: true,
      message: '项目创建成功',
      data: {
        project: result.project,
        defaultScene: result.defaultScene
      }
    }

  } catch (error) {
    console.error('❌ 项目创建API错误:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: '服务器内部错误'
    })
  } finally {
    await prisma.$disconnect()
  }
})
```

### **PUT接口示例（更新资源）**
```typescript
/**
 * 更新项目API
 * PUT /api/projects/[id]
 */

export default defineEventHandler(async (event) => {
  try {
    assertMethod(event, 'PUT')

    // 获取路由参数
    const projectId = getRouterParam(event, 'id')

    if (!projectId) {
      throw createError({
        statusCode: 400,
        statusMessage: '项目ID不能为空'
      })
    }

    // 用户认证（省略，与上面相同）
    const user = await authenticateUser(event)

    // 获取请求体
    const body = await readBody(event)
    const { name, description, settings } = body

    // 验证项目所有权
    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id
      }
    })

    if (!existingProject) {
      throw createError({
        statusCode: 404,
        statusMessage: '项目不存在或无权限访问'
      })
    }

    // 更新项目
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: name || existingProject.name,
        description: description ?? existingProject.description,
        settings: settings || existingProject.settings,
        updatedAt: new Date()
      }
    })

    return {
      success: true,
      message: '项目更新成功',
      data: { project: updatedProject }
    }

  } catch (error) {
    console.error('❌ 项目更新API错误:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: '服务器内部错误'
    })
  } finally {
    await prisma.$disconnect()
  }
})
```

### **DELETE接口示例**
```typescript
/**
 * 删除项目API
 * DELETE /api/projects/[id]
 */

export default defineEventHandler(async (event) => {
  try {
    assertMethod(event, 'DELETE')

    const projectId = getRouterParam(event, 'id')
    const user = await authenticateUser(event)

    // 验证项目存在和权限
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: user.id
      }
    })

    if (!project) {
      throw createError({
        statusCode: 404,
        statusMessage: '项目不存在或无权限访问'
      })
    }

    // 删除项目（级联删除相关数据）
    await prisma.project.delete({
      where: { id: projectId }
    })

    // 可选：删除项目文件夹
    try {
      await fs.rm(project.path, { recursive: true, force: true })
    } catch (fsError) {
      console.warn('⚠️ 删除项目文件夹失败:', fsError)
      // 不抛出错误，因为数据库记录已删除
    }

    return {
      success: true,
      message: '项目删除成功'
    }

  } catch (error) {
    console.error('❌ 项目删除API错误:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: '服务器内部错误'
    })
  } finally {
    await prisma.$disconnect()
  }
})
```

## 🔐 4. 认证和权限验证

### **认证中间件函数**
```typescript
// utils/auth.ts
import { AuthService } from '~/services/AuthService'

const authService = new AuthService()

/**
 * 用户认证辅助函数
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
 */
export async function requirePermission(user: any, resource: string, action: string) {
  // 实现权限检查逻辑
  // 例如：检查用户角色、资源所有权等

  if (action === 'delete' && user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: '权限不足'
    })
  }
}

/**
 * 资源所有权验证
 */
export async function verifyOwnership(userId: string, resourceId: string, resourceType: string) {
  const prisma = new PrismaClient()

  try {
    let resource

    switch (resourceType) {
      case 'project':
        resource = await prisma.project.findFirst({
          where: { id: resourceId, userId }
        })
        break
      case 'scene':
        resource = await prisma.scene.findFirst({
          where: {
            id: resourceId,
            project: { userId }
          }
        })
        break
      default:
        throw new Error('未知的资源类型')
    }

    if (!resource) {
      throw createError({
        statusCode: 404,
        statusMessage: '资源不存在或无权限访问'
      })
    }

    return resource
  } finally {
    await prisma.$disconnect()
  }
}
```

### **在API中使用认证**
```typescript
export default defineEventHandler(async (event) => {
  try {
    // 1. 用户认证
    const user = await authenticateUser(event)

    // 2. 权限验证
    await requirePermission(user, 'project', 'create')

    // 3. 资源所有权验证（如果需要）
    const projectId = getRouterParam(event, 'id')
    if (projectId) {
      await verifyOwnership(user.id, projectId, 'project')
    }

    // 4. 业务逻辑...

  } catch (error) {
    // 错误处理...
  }
})
```

## ✅ 5. 最佳实践

### **5.1 错误处理**
```typescript
// 统一错误处理函数
function handleApiError(error: any, context: string) {
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
```

### **5.2 数据验证**
```typescript
import { z } from 'zod'

// 定义验证模式
const createProjectSchema = z.object({
  name: z.string().min(2).max(50).regex(/^[a-zA-Z0-9\s\-_\u4e00-\u9fa5]+$/),
  description: z.string().optional(),
  location: z.string().min(1),
  template: z.enum(['3d-game', '2d-game', 'vr-game', 'empty']).optional()
})

// 在API中使用
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // 验证请求数据
    const validatedData = createProjectSchema.parse(body)

    // 使用验证后的数据
    // ...

  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: '请求数据格式错误',
        data: error.errors
      })
    }

    throw error
  }
})
```

### **5.3 响应格式标准化**
```typescript
// 统一响应格式
interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
  timestamp?: string
}

// 成功响应辅助函数
function successResponse<T>(message: string, data?: T): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  }
}

// 错误响应辅助函数
function errorResponse(message: string, error?: string): ApiResponse {
  return {
    success: false,
    message,
    error,
    timestamp: new Date().toISOString()
  }
}
```

### **5.4 数据库连接管理**
```typescript
// 使用连接池和事务
export default defineEventHandler(async (event) => {
  const prisma = new PrismaClient()

  try {
    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({ /* ... */ })
      const scene = await tx.scene.create({ /* ... */ })
      return { project, scene }
    })

    return successResponse('操作成功', result)

  } catch (error) {
    handleApiError(error, '项目创建')
  } finally {
    // 确保连接关闭
    await prisma.$disconnect()
  }
})
```

### **5.5 性能优化**
```typescript
// 使用索引和优化查询
const projects = await prisma.project.findMany({
  where: { userId },
  select: {
    // 只选择需要的字段
    id: true,
    name: true,
    description: true,
    updatedAt: true,
    // 使用include优化关联查询
    _count: {
      select: {
        scenes: true,
        scripts: true
      }
    }
  },
  // 分页
  skip: (page - 1) * limit,
  take: limit,
  // 排序
  orderBy: { updatedAt: 'desc' }
})
```

### **5.6 常见陷阱避免**

1. **忘记关闭数据库连接**
   ```typescript
   // ❌ 错误
   const prisma = new PrismaClient()
   // 忘记调用 prisma.$disconnect()

   // ✅ 正确
   try {
     // API逻辑
   } finally {
     await prisma.$disconnect()
   }
   ```

2. **没有验证用户权限**
   ```typescript
   // ❌ 错误 - 直接操作数据
   await prisma.project.delete({ where: { id } })

   // ✅ 正确 - 验证所有权
   const project = await prisma.project.findFirst({
     where: { id, userId: user.id }
   })
   if (!project) throw createError({ statusCode: 404 })
   ```

3. **不处理并发操作**
   ```typescript
   // ✅ 使用事务处理并发
   await prisma.$transaction(async (tx) => {
     // 原子操作
   })
   ```

## 📚 6. 调试和测试

### **API测试示例**
```bash
# 测试登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 测试获取项目列表
curl -X GET http://localhost:3001/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"

# 测试创建项目
curl -X POST http://localhost:3001/api/projects/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"测试项目","location":"C:/Projects"}'
```

## 🛠️ 7. 实用工具和辅助函数

### **7.1 通用辅助函数**
```typescript
// utils/api-helpers.ts

/**
 * 分页参数解析
 */
export function parsePaginationQuery(query: any) {
  const page = Math.max(1, parseInt(query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 20))
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

/**
 * 搜索条件构建
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
 */
export function parseSortQuery(query: any, allowedFields: string[], defaultSort = 'createdAt') {
  const sortBy = allowedFields.includes(query.sortBy) ? query.sortBy : defaultSort
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc'

  return { [sortBy]: sortOrder }
}

/**
 * 客户端IP获取
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
```

### **7.2 数据库查询优化**
```typescript
// utils/db-helpers.ts

/**
 * 批量操作辅助函数
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
 * 软删除辅助函数
 */
export async function softDelete(prisma: any, model: string, id: string) {
  return await prisma[model].update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isDeleted: true
    }
  })
}

/**
 * 审计日志记录
 */
export async function createAuditLog(
  prisma: any,
  userId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  details?: any
) {
  return await prisma.auditLog.create({
    data: {
      userId,
      action,
      resourceType,
      resourceId,
      details: details ? JSON.stringify(details) : null,
      timestamp: new Date()
    }
  })
}
```

## 🔄 8. API版本管理

### **8.1 版本化API结构**
```
server/api/
├── v1/
│   ├── auth/
│   ├── projects/
│   └── scenes/
├── v2/
│   ├── auth/
│   └── projects/
└── latest/ -> v2/  # 符号链接指向最新版本
```

### **8.2 版本兼容性处理**
```typescript
// server/api/v1/projects/index.get.ts
export default defineEventHandler(async (event) => {
  // V1 API逻辑
  const projects = await getProjectsV1(user.id)

  return {
    success: true,
    data: projects,
    version: 'v1'
  }
})

// server/api/v2/projects/index.get.ts
export default defineEventHandler(async (event) => {
  // V2 API逻辑 - 增强功能
  const projects = await getProjectsV2(user.id)

  return {
    success: true,
    data: projects,
    meta: {
      version: 'v2',
      features: ['enhanced-search', 'bulk-operations']
    }
  }
})
```

## 📊 9. 监控和日志

### **9.1 API性能监控**
```typescript
// utils/monitoring.ts

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

// 使用示例
export default defineEventHandler(withPerformanceMonitoring(async (event) => {
  // API逻辑
}))
```

### **9.2 结构化日志**
```typescript
// utils/logger.ts

interface LogContext {
  userId?: string
  requestId?: string
  action?: string
  resource?: string
}

export class ApiLogger {
  static info(message: string, context?: LogContext) {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...context
    }))
  }

  static error(message: string, error: any, context?: LogContext) {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      ...context
    }))
  }

  static warn(message: string, context?: LogContext) {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...context
    }))
  }
}
```

## 🧪 10. 单元测试示例

### **10.1 API测试设置**
```typescript
// tests/api/projects.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '~/services/AuthService'

const prisma = new PrismaClient()
const authService = new AuthService()

describe('Projects API', () => {
  let testUser: any
  let authToken: string

  beforeEach(async () => {
    // 创建测试用户
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        username: 'testuser',
        password: await authService.hashPassword('password123'),
        firstName: 'Test',
        lastName: 'User'
      }
    })

    // 生成认证令牌
    authToken = await authService.generateAccessToken(testUser.id)
  })

  afterEach(async () => {
    // 清理测试数据
    await prisma.project.deleteMany({ where: { userId: testUser.id } })
    await prisma.user.delete({ where: { id: testUser.id } })
  })

  it('should create a new project', async () => {
    const projectData = {
      name: '测试项目',
      description: '这是一个测试项目',
      location: '/tmp/test-project'
    }

    const response = await $fetch('/api/projects/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: projectData
    })

    expect(response.success).toBe(true)
    expect(response.data.project.name).toBe(projectData.name)
    expect(response.data.project.userId).toBe(testUser.id)
  })

  it('should get user projects', async () => {
    // 先创建一个项目
    await prisma.project.create({
      data: {
        name: '测试项目',
        path: '/tmp/test',
        userId: testUser.id,
        version: '1.0.0',
        engineVersion: '1.0.0'
      }
    })

    const response = await $fetch('/api/projects', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })

    expect(response.success).toBe(true)
    expect(response.data.projects).toHaveLength(1)
    expect(response.data.projects[0].name).toBe('测试项目')
  })
})
```

## 📋 11. API文档生成

### **11.1 OpenAPI规范**
```typescript
// server/api/docs/openapi.get.ts
export default defineEventHandler(async (event) => {
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'QAQ游戏引擎 API',
      version: '1.0.0',
      description: 'QAQ游戏引擎的RESTful API接口文档'
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: '开发环境'
      }
    ],
    paths: {
      '/auth/login': {
        post: {
          summary: '用户登录',
          tags: ['认证'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 }
                  },
                  required: ['email', 'password']
                }
              }
            }
          },
          responses: {
            200: {
              description: '登录成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' },
                          token: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            username: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  }

  return openApiSpec
})
```

## 🚀 12. 部署和生产环境

### **12.1 环境配置**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // 服务端环境变量
    jwtSecret: process.env.JWT_SECRET,
    databaseUrl: process.env.DATABASE_URL,

    // 公开环境变量
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api'
    }
  },

  nitro: {
    // 生产环境优化
    minify: true,
    compressPublicAssets: true,

    // API路由预渲染
    prerender: {
      routes: ['/api/docs/openapi']
    }
  }
})
```

### **12.2 生产环境最佳实践**
```typescript
// 生产环境API配置
export default defineEventHandler(async (event) => {
  // 1. 请求频率限制
  await rateLimit(event, {
    max: 100, // 每分钟最多100次请求
    windowMs: 60 * 1000
  })

  // 2. 请求大小限制
  const body = await readBody(event)
  if (JSON.stringify(body).length > 1024 * 1024) { // 1MB限制
    throw createError({
      statusCode: 413,
      statusMessage: '请求体过大'
    })
  }

  // 3. CORS配置
  setHeaders(event, {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  })

  // 4. 安全头设置
  setHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  })

  // API逻辑...
})
```

---

**文档版本**: 1.0.0
**最后更新**: 2024年7月15日
**适用于**: QAQ游戏引擎 v1.0.0

## 📞 技术支持

如有问题或建议，请联系开发团队或在项目仓库中提交Issue。
