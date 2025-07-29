/**
 * QAQ游戏引擎 - 项目创建调试API
 *
 * 用于调试项目创建过程中的问题
 */

import { PrismaClient } from '@prisma/client'
import { AuthService } from '~/services/AuthService'
import path from 'path'
import fs from 'fs/promises'

const prisma = new PrismaClient()
const authService = new AuthService()

export default defineEventHandler(async (event) => {
  try {
    // 只允许POST请求
    assertMethod(event, 'POST')

    console.log('🔍 开始调试项目创建API...')

    // 获取请求头
    const headers = getHeaders(event)
    console.log('📋 请求头:', {
      authorization: headers.authorization ? '存在' : '不存在',
      'content-type': headers['content-type'],
      'user-agent': headers['user-agent']
    })

    // 检查认证头
    const authorization = headers.authorization
    if (!authorization || !authorization.startsWith('Bearer ')) {
      console.log('❌ 认证头缺失或格式错误')
      return {
        success: false,
        error: '认证头缺失或格式错误',
        debug: {
          hasAuth: !!authorization,
          authFormat: authorization ? authorization.substring(0, 10) + '...' : 'none'
        }
      }
    }

    const token = authorization.substring(7)
    console.log('🔑 Token长度:', token.length)

    // 验证用户
    let user
    try {
      user = await authService.verifyAccessToken(token)
      console.log('👤 用户验证结果:', user ? '成功' : '失败')
      if (user) {
        console.log('👤 用户信息:', {
          id: user.id,
          email: user.email,
          username: user.username,
          isActive: user.isActive
        })
      }
    } catch (authError) {
      console.error('❌ 认证服务错误:', authError)
      return {
        success: false,
        error: '认证服务错误',
        debug: {
          authError: authError.message
        }
      }
    }

    if (!user) {
      return {
        success: false,
        error: '用户验证失败',
        debug: {
          tokenLength: token.length,
          tokenStart: token.substring(0, 20) + '...'
        }
      }
    }

    // 检查数据库连接
    let dbConnection = false
    try {
      await prisma.$queryRaw`SELECT 1`
      dbConnection = true
      console.log('✅ 数据库连接正常')
    } catch (dbError) {
      console.error('❌ 数据库连接失败:', dbError)
      return {
        success: false,
        error: '数据库连接失败',
        debug: {
          dbError: dbError.message
        }
      }
    }

    // 检查用户是否在数据库中存在
    let existingUser
    try {
      existingUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, email: true, isActive: true }
      })
      console.log('👤 数据库中的用户:', existingUser ? '存在' : '不存在')
    } catch (userError) {
      console.error('❌ 查询用户失败:', userError)
      return {
        success: false,
        error: '查询用户失败',
        debug: {
          userError: userError.message
        }
      }
    }

    // 获取请求体
    let body
    try {
      body = await readBody(event)
      console.log('📋 请求体:', {
        name: body?.name,
        description: body?.description,
        location: body?.location,
        template: body?.template
      })
    } catch (bodyError) {
      console.error('❌ 读取请求体失败:', bodyError)
      return {
        success: false,
        error: '读取请求体失败',
        debug: {
          bodyError: bodyError.message
        }
      }
    }

    // 验证必需字段
    const { name, location } = body
    if (!name || !location) {
      return {
        success: false,
        error: '项目名称和位置不能为空',
        debug: {
          hasName: !!name,
          hasLocation: !!location,
          body
        }
      }
    }

    // 检查项目路径是否已存在
    const sanitizedName = name.replace(/[^a-zA-Z0-9\-_]/g, '-').toLowerCase()
    const projectPath = require('path').join(location, sanitizedName)

    let existingProject
    try {
      existingProject = await prisma.project.findUnique({
        where: { path: projectPath }
      })
      console.log('📁 项目路径检查:', existingProject ? '已存在' : '可用')
    } catch (pathError) {
      console.error('❌ 检查项目路径失败:', pathError)
      return {
        success: false,
        error: '检查项目路径失败',
        debug: {
          pathError: pathError.message,
          projectPath
        }
      }
    }

    // 返回调试信息
    return {
      success: true,
      message: '调试检查完成',
      debug: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          isActive: user.isActive
        },
        existingUser: existingUser ? {
          id: existingUser.id,
          email: existingUser.email,
          isActive: existingUser.isActive
        } : null,
        database: {
          connected: dbConnection
        },
        request: {
          name,
          location,
          projectPath,
          existingProject: !!existingProject
        }
      }
    }

  } catch (error) {
    console.error('❌ 调试API错误:', error)
    return {
      success: false,
      error: '调试API错误',
      debug: {
        errorMessage: error.message,
        errorStack: error.stack
      }
    }
  } finally {
    await prisma.$disconnect()
  }
})
