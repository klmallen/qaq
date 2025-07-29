/**
 * QAQ游戏引擎 - 数据库初始化脚本
 *
 * 功能说明：
 * - 初始化Prisma数据库
 * - 运行数据库迁移
 * - 创建示例数据
 *
 * 使用方法：
 * node scripts/init-database.js
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🚀 开始初始化QAQ游戏引擎数据库...')

// 检查Prisma是否已安装
try {
  execSync('npx prisma --version', { stdio: 'pipe' })
  console.log('✅ Prisma已安装')
} catch (error) {
  console.error('❌ Prisma未安装，请先运行: npm install prisma @prisma/client')
  process.exit(1)
}

// 生成Prisma客户端
console.log('📦 生成Prisma客户端...')
try {
  execSync('npx prisma generate', { stdio: 'inherit' })
  console.log('✅ Prisma客户端生成成功')
} catch (error) {
  console.error('❌ Prisma客户端生成失败:', error.message)
  process.exit(1)
}

// 创建示例项目目录
const exampleProjectPath = path.join(__dirname, '..', 'example-project')
if (!fs.existsSync(exampleProjectPath)) {
  fs.mkdirSync(exampleProjectPath, { recursive: true })
  console.log('📁 创建示例项目目录')
}

// 创建.qaq目录
const qaqDir = path.join(exampleProjectPath, '.qaq')
if (!fs.existsSync(qaqDir)) {
  fs.mkdirSync(qaqDir, { recursive: true })
  console.log('📁 创建.qaq配置目录')
}

// 设置示例数据库URL
const dbPath = path.join(qaqDir, 'project.db')
process.env.DATABASE_URL = `file:${dbPath}`

console.log('🗄️ 数据库路径:', dbPath)

// 推送数据库schema
console.log('📋 推送数据库schema...')
try {
  execSync('npx prisma db push', { stdio: 'inherit', env: process.env })
  console.log('✅ 数据库schema推送成功')
} catch (error) {
  console.error('❌ 数据库schema推送失败:', error.message)
  process.exit(1)
}

// 创建示例数据
console.log('📝 创建示例数据...')
try {
  // 这里可以添加创建示例数据的代码
  // 由于我们还没有完整的Prisma客户端，暂时跳过
  console.log('⚠️ 示例数据创建跳过（需要完整的依赖安装）')
} catch (error) {
  console.error('❌ 示例数据创建失败:', error.message)
}

console.log('🎉 数据库初始化完成！')
console.log('')
console.log('📋 后续步骤：')
console.log('1. 确保所有依赖已安装: npm install')
console.log('2. 启动开发服务器: npm run dev')
console.log('3. 在编辑器中创建新项目或打开示例项目')
console.log('')
console.log('📁 示例项目路径:', exampleProjectPath)
console.log('🗄️ 数据库文件路径:', dbPath)
