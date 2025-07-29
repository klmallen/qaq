/**
 * QAQ游戏引擎 - 初始化全局数据库脚本
 *
 * 为全局数据库创建表结构
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

async function initGlobalDatabase() {
  console.log('🚀 开始初始化全局数据库...')

  try {
    // 1. 确保全局数据库目录存在
    const globalDbPath = process.env.GLOBAL_DB_PATH || './global'
    const globalDbDir = path.resolve(globalDbPath)
    const qaqDir = path.resolve(globalDbDir, '.qaq')

    if (!fs.existsSync(qaqDir)) {
      fs.mkdirSync(qaqDir, { recursive: true })
      console.log(`📁 创建全局数据库目录: ${qaqDir}`)
    }

    // 2. 设置全局数据库URL（使用与AuthService相同的路径格式）
    const globalDbUrl = `file:${qaqDir}/project.db`
    console.log(`📍 全局数据库路径: ${globalDbUrl}`)

    // 3. 临时设置环境变量
    const originalDbUrl = process.env.DATABASE_URL
    process.env.DATABASE_URL = globalDbUrl

    // 4. 运行数据库推送
    console.log('🔄 推送数据库schema到全局数据库...')
    execSync('npx prisma db push --force-reset', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: globalDbUrl }
    })

    // 5. 恢复原始环境变量
    if (originalDbUrl) {
      process.env.DATABASE_URL = originalDbUrl
    } else {
      delete process.env.DATABASE_URL
    }

    console.log('✅ 全局数据库初始化完成!')

    // 6. 验证数据库
    console.log('🔍 验证全局数据库...')
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient({
      datasources: {
        db: { url: globalDbUrl }
      }
    })

    // 测试连接
    await prisma.$connect()
    console.log('✅ 全局数据库连接成功')

    // 检查表是否存在
    const userCount = await prisma.user.count()
    console.log(`📊 用户表检查通过，当前用户数: ${userCount}`)

    await prisma.$disconnect()
    console.log('🎉 全局数据库初始化和验证完成!')

  } catch (error) {
    console.error('❌ 全局数据库初始化失败:', error.message)
    process.exit(1)
  }
}

// 运行初始化
initGlobalDatabase()
