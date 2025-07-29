/**
 * QAQ游戏引擎 - 简化项目创建API
 * 
 * 用于调试和测试项目创建功能
 */

import { PrismaClient } from '@prisma/client'
import { AuthService } from '~/services/AuthService'

const prisma = new PrismaClient()
const authService = new AuthService()

export default defineEventHandler(async (event) => {
  console.log('🚀 简化项目创建API开始执行...')
  
  try {
    // 只允许POST请求
    assertMethod(event, 'POST')
    console.log('✅ 请求方法验证通过')

    // 获取请求头
    const headers = getHeaders(event)
    console.log('📋 请求头信息:', {
      hasAuth: !!headers.authorization,
      contentType: headers['content-type'],
      userAgent: headers['user-agent']?.substring(0, 50) + '...'
    })

    // 验证认证头
    const authorization = headers.authorization
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('❌ 认证头缺失或格式错误')
      return {
        success: false,
        error: '认证头缺失或格式错误',
        statusCode: 401
      }
    }

    const token = authorization.substring(7)
    console.log('🔑 Token信息:', {
      length: token.length,
      start: token.substring(0, 20) + '...',
      end: '...' + token.substring(token.length - 20)
    })

    // 验证用户
    console.log('👤 开始验证用户...')
    let user
    try {
      user = await authService.verifyAccessToken(token)
      console.log('👤 用户验证结果:', user ? '成功' : '失败')
      
      if (user) {
        console.log('👤 用户详细信息:', {
          id: user.id,
          email: user.email,
          username: user.username,
          isActive: user.isActive
        })
      }
    } catch (authError) {
      console.error('❌ 认证服务异常:', authError)
      return {
        success: false,
        error: '认证服务异常: ' + authError.message,
        statusCode: 500
      }
    }

    if (!user) {
      console.log('❌ 用户验证失败')
      return {
        success: false,
        error: '用户验证失败',
        statusCode: 401
      }
    }

    // 检查数据库连接
    console.log('🗄️ 检查数据库连接...')
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('✅ 数据库连接正常')
    } catch (dbError) {
      console.error('❌ 数据库连接失败:', dbError)
      return {
        success: false,
        error: '数据库连接失败: ' + dbError.message,
        statusCode: 500
      }
    }

    // 验证用户在数据库中存在
    console.log('🔍 检查用户是否在数据库中存在...')
    let existingUser
    try {
      existingUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, email: true, isActive: true }
      })
      console.log('👤 数据库用户查询结果:', existingUser ? '找到' : '未找到')
    } catch (userError) {
      console.error('❌ 查询用户失败:', userError)
      return {
        success: false,
        error: '查询用户失败: ' + userError.message,
        statusCode: 500
      }
    }

    if (!existingUser) {
      console.log('❌ 用户在数据库中不存在')
      return {
        success: false,
        error: '用户在数据库中不存在',
        statusCode: 401
      }
    }

    if (!existingUser.isActive) {
      console.log('❌ 用户账号已被禁用')
      return {
        success: false,
        error: '用户账号已被禁用',
        statusCode: 403
      }
    }

    // 获取请求体
    console.log('📋 读取请求体...')
    let body
    try {
      body = await readBody(event)
      console.log('📋 请求体内容:', {
        name: body?.name,
        location: body?.location,
        description: body?.description,
        template: body?.template
      })
    } catch (bodyError) {
      console.error('❌ 读取请求体失败:', bodyError)
      return {
        success: false,
        error: '读取请求体失败: ' + bodyError.message,
        statusCode: 400
      }
    }

    // 验证必需字段
    const { name, location } = body
    if (!name || !location) {
      console.log('❌ 必需字段缺失:', { hasName: !!name, hasLocation: !!location })
      return {
        success: false,
        error: '项目名称和位置不能为空',
        statusCode: 400
      }
    }

    // 验证项目名称格式
    const nameRegex = /^[a-zA-Z0-9\s\-_\u4e00-\u9fa5]+$/
    if (!nameRegex.test(name)) {
      console.log('❌ 项目名称格式无效:', name)
      return {
        success: false,
        error: '项目名称包含无效字符',
        statusCode: 400
      }
    }

    // 生成项目路径
    const sanitizedName = name.replace(/[^a-zA-Z0-9\-_]/g, '-').toLowerCase()
    const projectPath = require('path').join(location, sanitizedName)
    console.log('📁 生成项目路径:', projectPath)

    // 检查项目路径是否已存在
    console.log('🔍 检查项目路径是否已存在...')
    let existingProject
    try {
      existingProject = await prisma.project.findUnique({
        where: { path: projectPath }
      })
      console.log('📁 项目路径检查结果:', existingProject ? '已存在' : '可用')
    } catch (pathError) {
      console.error('❌ 检查项目路径失败:', pathError)
      return {
        success: false,
        error: '检查项目路径失败: ' + pathError.message,
        statusCode: 500
      }
    }

    if (existingProject) {
      console.log('❌ 项目路径已存在')
      return {
        success: false,
        error: '项目路径已存在',
        statusCode: 409
      }
    }

    // 模拟创建项目（不实际创建文件系统）
    console.log('🎯 模拟创建项目记录...')
    let project
    try {
      project = await prisma.project.create({
        data: {
          name: name.trim(),
          description: body.description || `${name} - Created with QAQ Game Engine`,
          path: projectPath,
          template: body.template || 'empty',
          settings: JSON.stringify({
            version: '1.0.0',
            engine: 'QAQ Game Engine',
            created: new Date().toISOString()
          }),
          userId: user.id
        }
      })
      console.log('✅ 项目记录创建成功:', project.id)
    } catch (createError) {
      console.error('❌ 创建项目记录失败:', createError)
      return {
        success: false,
        error: '创建项目记录失败: ' + createError.message,
        statusCode: 500
      }
    }

    console.log('🎉 简化项目创建完成!')
    return {
      success: true,
      message: '项目创建成功（简化版）',
      data: {
        project: {
          id: project.id,
          name: project.name,
          path: project.path,
          description: project.description,
          template: project.template
        }
      }
    }

  } catch (error) {
    console.error('❌ 简化项目创建API异常:', error)
    return {
      success: false,
      error: '服务器内部错误: ' + error.message,
      statusCode: 500,
      stack: error.stack
    }
  } finally {
    await prisma.$disconnect()
  }
})
