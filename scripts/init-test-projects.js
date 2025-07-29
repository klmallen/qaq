/**
 * QAQ游戏引擎 - 测试项目数据初始化脚本
 * 
 * 用于创建测试项目数据，便于开发和测试
 */

const { PrismaClient } = require('@prisma/client')
const path = require('path')
const fs = require('fs')

const prisma = new PrismaClient()

async function initTestProjects() {
  try {
    console.log('🚀 开始初始化测试项目数据...')
    
    // 查找第一个用户
    const user = await prisma.user.findFirst()
    
    if (!user) {
      console.log('❌ 未找到用户，请先创建用户账号')
      return
    }
    
    console.log(`👤 使用用户: ${user.email}`)
    
    // 检查是否已有项目
    const existingProjects = await prisma.project.count({
      where: { userId: user.id }
    })
    
    if (existingProjects > 0) {
      console.log(`✅ 用户已有 ${existingProjects} 个项目，跳过初始化`)
      return
    }
    
    // 创建测试项目数据
    const testProjects = [
      {
        name: '我的第一个游戏',
        description: '这是一个简单的3D平台跳跃游戏',
        template: '3d-game',
        path: '/tmp/qaq-projects/my-first-game'
      },
      {
        name: '太空射击游戏',
        description: '经典的太空射击游戏，包含敌人AI和武器系统',
        template: '2d-game',
        path: '/tmp/qaq-projects/space-shooter'
      },
      {
        name: '角色扮演游戏',
        description: '包含完整RPG系统的角色扮演游戏',
        template: '3d-rpg',
        path: '/tmp/qaq-projects/rpg-game'
      }
    ]
    
    for (const projectData of testProjects) {
      console.log(`📦 创建项目: ${projectData.name}`)
      
      // 创建项目目录
      if (!fs.existsSync(projectData.path)) {
        fs.mkdirSync(projectData.path, { recursive: true })
        fs.mkdirSync(path.join(projectData.path, 'scenes'), { recursive: true })
        fs.mkdirSync(path.join(projectData.path, 'scripts'), { recursive: true })
        fs.mkdirSync(path.join(projectData.path, 'assets'), { recursive: true })
        fs.mkdirSync(path.join(projectData.path, '.qaq'), { recursive: true })
      }
      
      // 创建项目记录
      const project = await prisma.project.create({
        data: {
          name: projectData.name,
          description: projectData.description,
          path: projectData.path,
          version: '1.0.0',
          engineVersion: '1.0.0',
          userId: user.id,
          isPublic: false,
          settings: {
            renderer: { type: '3d', quality: 'high' },
            physics: { enabled: true, gravity: { x: 0, y: -9.81, z: 0 } }
          },
          lastOpened: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // 随机最近7天内
        }
      })
      
      // 创建默认场景
      const scene = await prisma.scene.create({
        data: {
          name: 'Main',
          path: 'scenes/Main.tscn',
          type: '3d',
          projectId: project.id,
          isMain: true,
          description: '主场景',
          sceneData: {
            nodes: [],
            environment: { skybox: 'default', lighting: 'natural' },
            camera: { position: { x: 0, y: 0, z: 5 }, fov: 75 }
          }
        }
      })
      
      // 创建一些测试脚本
      await prisma.script.create({
        data: {
          name: 'Player',
          path: 'scripts/Player.ts',
          language: 'typescript',
          projectId: project.id,
          content: '// Player controller script\nexport class Player {\n  // TODO: Implement player logic\n}',
          description: '玩家控制器脚本'
        }
      })
      
      // 创建测试材质
      await prisma.material.create({
        data: {
          name: 'DefaultMaterial',
          type: 'StandardMaterial',
          projectId: project.id,
          properties: {
            color: '#ffffff',
            metallic: 0.0,
            roughness: 0.5
          },
          description: '默认材质'
        }
      })
      
      console.log(`✅ 项目 "${projectData.name}" 创建完成`)
    }
    
    console.log('🎉 测试项目数据初始化完成！')
    
    // 显示统计信息
    const totalProjects = await prisma.project.count()
    const totalScenes = await prisma.scene.count()
    const totalScripts = await prisma.script.count()
    
    console.log('📊 数据库统计:')
    console.log(`  - 项目: ${totalProjects}`)
    console.log(`  - 场景: ${totalScenes}`)
    console.log(`  - 脚本: ${totalScripts}`)
    
  } catch (error) {
    console.error('❌ 初始化测试项目失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行初始化
if (require.main === module) {
  initTestProjects()
}

module.exports = { initTestProjects }
