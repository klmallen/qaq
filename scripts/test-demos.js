#!/usr/bin/env node

/**
 * QAQ游戏引擎演示测试脚本
 * 用于验证演示页面的基本功能
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🎮 QAQ游戏引擎演示测试')
console.log('========================')

// 检查演示页面文件
const demoFiles = [
  'pages/index.vue',
  'pages/demo-2d.vue',
  'pages/demo-3d.vue'
]

console.log('\n📁 检查演示页面文件...')
let allFilesExist = true

demoFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file)
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - 存在`)
  } else {
    console.log(`❌ ${file} - 不存在`)
    allFilesExist = false
  }
})

// 检查资源文件
const resourceFiles = [
  'public/icon.svg',
  'public/saien.glb'
]

console.log('\n📦 检查资源文件...')
let allResourcesExist = true

resourceFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file)
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath)
    const sizeKB = (stats.size / 1024).toFixed(2)
    console.log(`✅ ${file} - 存在 (${sizeKB} KB)`)
  } else {
    console.log(`❌ ${file} - 不存在`)
    allResourcesExist = false
  }
})

// 检查引擎核心文件
const coreFiles = [
  'core/index.ts',
  'core/engine/Engine.ts',
  'core/scene/Scene.ts',
  'core/nodes/Node.ts',
  'core/nodes/Node2D.ts',
  'core/nodes/Node3D.ts',
  'core/nodes/2d/Sprite2D.ts',
  'core/nodes/MeshInstance3D.ts',
  'core/nodes/3d/Camera3D.ts',
  'core/nodes/lights/Light3D.ts',
  'core/script/ScriptManager.ts',
  'core/script/ScriptBase.ts'
]

console.log('\n🔧 检查引擎核心文件...')
let allCoreFilesExist = true

coreFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file)
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} - 存在`)
  } else {
    console.log(`❌ ${file} - 不存在`)
    allCoreFilesExist = false
  }
})

// 总结
console.log('\n📊 测试总结')
console.log('============')

if (allFilesExist && allResourcesExist && allCoreFilesExist) {
  console.log('🎉 所有文件检查通过！')
  console.log('\n🚀 可以启动演示：')
  console.log('   npm run dev')
  console.log('\n📖 演示说明：')
  console.log('   - 访问 http://localhost:3000 查看主页')
  console.log('   - 点击 "2D演示" 体验2D功能')
  console.log('   - 点击 "3D演示" 体验3D功能')
  process.exit(0)
} else {
  console.log('❌ 部分文件缺失，请检查项目结构')

  if (!allFilesExist) {
    console.log('   - 演示页面文件缺失')
  }
  if (!allResourcesExist) {
    console.log('   - 资源文件缺失')
  }
  if (!allCoreFilesExist) {
    console.log('   - 引擎核心文件缺失')
  }

  process.exit(1)
}
