/**
 * QAQ游戏引擎 - 创建测试用户脚本
 *
 * 用于创建测试用户，解决外键约束问题
 */

import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'

// 动态导入Prisma Client以避免CommonJS/ES模块问题
async function createPrismaClient() {
  try {
    const { PrismaClient } = await import('@prisma/client')
    // 使用全局数据库路径，与AuthService保持一致
    const globalDbPath = process.env.GLOBAL_DB_PATH || './global'
    // AuthService使用的是 projectPath/.qaq/project.db 格式
    const qaqDir = path.resolve(globalDbPath, '.qaq')
    const fullDbPath = path.resolve(qaqDir, 'project.db')
    console.log(`📍 使用全局数据库: ${fullDbPath}`)

    // 确保.qaq目录存在
    if (!fs.existsSync(qaqDir)) {
      fs.mkdirSync(qaqDir, { recursive: true })
      console.log(`📁 创建.qaq目录: ${qaqDir}`)
    }

    return new PrismaClient({
      datasources: {
        db: {
          url: `file:${fullDbPath}`
        }
      }
    })
  } catch (error) {
    console.error('❌ 无法导入Prisma Client:', error.message)
    process.exit(1)
  }
}

async function createTestUser() {
  let prisma
  try {
    console.log('👤 开始创建测试用户...')

    // 创建Prisma客户端
    prisma = await createPrismaClient()

    // 检查是否已有用户
    const existingUserCount = await prisma.user.count()
    console.log(`📊 当前用户数量: ${existingUserCount}`)

    if (existingUserCount > 0) {
      console.log('✅ 数据库中已有用户，无需创建测试用户')

      // 显示现有用户
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          isActive: true
        },
        take: 5
      })

      console.log('\n👥 现有用户列表:')
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (ID: ${user.id})`)
        console.log(`     状态: ${user.isActive ? '✅ 激活' : '❌ 禁用'}`)
      })

      return
    }

    // 创建测试用户
    const testUsers = [
      {
        email: 'admin@qaq-engine.com',
        username: 'admin',
        firstName: 'QAQ',
        lastName: 'Admin',
        password: 'admin123'
      },
      {
        email: 'developer@qaq-engine.com',
        username: 'developer',
        firstName: 'QAQ',
        lastName: 'Developer',
        password: 'dev123'
      },
      {
        email: 'test@qaq-engine.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'test123'
      }
    ]

    console.log(`🔄 准备创建 ${testUsers.length} 个测试用户...`)

    for (const userData of testUsers) {
      try {
        // 检查邮箱是否已存在
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        })

        if (existingUser) {
          console.log(`⚠️ 用户 ${userData.email} 已存在，跳过创建`)
          continue
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(userData.password, 12)

        // 创建用户
        const user = await prisma.user.create({
          data: {
            email: userData.email,
            username: userData.username,
            firstName: userData.firstName,
            lastName: userData.lastName,
            password: hashedPassword,
            isActive: true,
            isVerified: true
          }
        })

        console.log(`✅ 创建用户成功: ${user.email} (ID: ${user.id})`)
        console.log(`   用户名: ${user.username}`)
        console.log(`   密码: ${userData.password}`)
        console.log('')

      } catch (userError) {
        console.error(`❌ 创建用户 ${userData.email} 失败:`, userError.message)
      }
    }

    // 验证创建结果
    const finalUserCount = await prisma.user.count()
    console.log(`🎉 用户创建完成！当前用户总数: ${finalUserCount}`)

    // 显示所有用户
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true
      }
    })

    console.log('\n👥 所有用户列表:')
    allUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email}`)
      console.log(`     ID: ${user.id}`)
      console.log(`     用户名: ${user.username}`)
      console.log(`     姓名: ${user.firstName} ${user.lastName}`)
      console.log(`     状态: ${user.isActive ? '✅ 激活' : '❌ 禁用'}`)
      console.log(`     创建时间: ${user.createdAt.toLocaleString('zh-CN')}`)
      console.log('')
    })

    console.log('💡 现在您可以使用以上任一账号登录并创建项目了！')

  } catch (error) {
    console.error('❌ 创建测试用户失败:', error)
    console.error('错误详情:', {
      code: error.code,
      message: error.message,
      meta: error.meta
    })
  } finally {
    if (prisma) {
      await prisma.$disconnect()
    }
  }
}

// 运行创建
createTestUser()
