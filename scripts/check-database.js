/**
 * QAQ游戏引擎 - 数据库状态检查脚本
 *
 * 用于检查数据库连接、用户数据和外键约束
 */

// 修复 Prisma 6.11+ 的 ESM 导入问题
import pkg from '@prisma/client'
const { PrismaClient } = pkg

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 开始检查数据库状态...')

    // 1. 检查数据库连接
    console.log('\n📡 检查数据库连接...')
    await prisma.$connect()
    console.log('✅ 数据库连接成功')

    // 2. 检查用户表
    console.log('\n👥 检查用户表...')
    const userCount = await prisma.user.count()
    console.log(`📊 用户总数: ${userCount}`)

    if (userCount === 0) {
      console.log('⚠️ 数据库中没有用户，这可能是外键约束失败的原因')
      console.log('💡 请先注册一个用户账号')
      return
    }

    // 3. 显示所有用户
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true
      },
      take: 10
    })

    console.log('\n👤 用户列表:')
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user.id}`)
      console.log(`     邮箱: ${user.email}`)
      console.log(`     用户名: ${user.username || '未设置'}`)
      console.log(`     姓名: ${user.firstName || ''} ${user.lastName || ''}`.trim() || '未设置')
      console.log(`     状态: ${user.isActive ? '✅ 激活' : '❌ 禁用'}`)
      console.log(`     创建时间: ${user.createdAt.toLocaleString('zh-CN')}`)
      console.log('')
    })

    // 4. 检查项目表
    console.log('\n📁 检查项目表...')
    const projectCount = await prisma.project.count()
    console.log(`📊 项目总数: ${projectCount}`)

    if (projectCount > 0) {
      const projects = await prisma.project.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true
            }
          }
        },
        take: 5
      })

      console.log('\n📂 项目列表:')
      projects.forEach((project, index) => {
        console.log(`  ${index + 1}. ${project.name}`)
        console.log(`     ID: ${project.id}`)
        console.log(`     路径: ${project.path}`)
        console.log(`     所有者: ${project.user.email}`)
        console.log(`     创建时间: ${project.createdAt.toLocaleString('zh-CN')}`)
        console.log('')
      })
    }

    // 5. 检查用户会话表
    console.log('\n🔐 检查用户会话表...')
    const sessionCount = await prisma.userSession.count()
    console.log(`📊 会话总数: ${sessionCount}`)

    if (sessionCount > 0) {
      const activeSessions = await prisma.userSession.findMany({
        where: {
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: {
            select: {
              email: true
            }
          }
        },
        take: 5
      })

      console.log(`📊 活跃会话数: ${activeSessions.length}`)
      activeSessions.forEach((session, index) => {
        console.log(`  ${index + 1}. 用户: ${session.user.email}`)
        console.log(`     会话ID: ${session.id}`)
        console.log(`     过期时间: ${session.expiresAt.toLocaleString('zh-CN')}`)
        console.log('')
      })
    }

    // 6. 检查外键约束
    console.log('\n🔗 检查外键约束...')

    // 检查是否有孤立的项目（用户不存在）
    const orphanedProjects = await prisma.$queryRaw`
      SELECT p.id, p.name, p.userId
      FROM Project p
      LEFT JOIN User u ON p.userId = u.id
      WHERE u.id IS NULL
    `

    if (orphanedProjects.length > 0) {
      console.log('⚠️ 发现孤立的项目（用户不存在）:')
      orphanedProjects.forEach(project => {
        console.log(`  - 项目: ${project.name} (ID: ${project.id})`)
        console.log(`    用户ID: ${project.userId}`)
      })
    } else {
      console.log('✅ 没有发现孤立的项目')
    }

    // 7. 测试创建项目的数据
    console.log('\n🧪 模拟项目创建数据...')
    const firstUser = users[0]
    if (firstUser) {
      console.log('📋 模拟项目数据:')
      console.log(`  用户ID: ${firstUser.id}`)
      console.log(`  用户邮箱: ${firstUser.email}`)
      console.log(`  用户状态: ${firstUser.isActive ? '激活' : '禁用'}`)

      // 检查用户是否可以创建项目
      if (!firstUser.isActive) {
        console.log('❌ 用户账号已禁用，无法创建项目')
      } else {
        console.log('✅ 用户可以创建项目')
      }
    }

    console.log('\n🎉 数据库检查完成！')

  } catch (error) {
    console.error('❌ 数据库检查失败:', error)
    console.error('错误详情:', {
      code: error.code,
      message: error.message,
      meta: error.meta
    })
  } finally {
    await prisma.$disconnect()
  }
}

// 运行检查
checkDatabase()
