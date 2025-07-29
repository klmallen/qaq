/**
 * QAQ游戏引擎 - Node反射序列化测试
 * 
 * 简单的测试文件，验证Node反射序列化是否正常工作
 */

import { Scene, Node3D, Camera3D, DirectionalLight3D, MeshInstance3D } from '../index'

/**
 * 测试Node反射序列化
 */
export function testNodeReflectionSerialization(): void {
  console.log('🧪 开始测试Node反射序列化...')

  try {
    // 创建测试场景
    const scene = new Scene('TestScene')
    
    // 添加相机
    const camera = new Camera3D('MainCamera')
    camera.position = { x: 5, y: 5, z: 5 }
    camera.fov = 60
    scene.addChild(camera)

    // 添加光源
    const light = new DirectionalLight3D('SunLight')
    light.position = { x: 10, y: 10, z: 5 }
    light.intensity = 1.5
    scene.addChild(light)

    // 添加网格
    const mesh = new MeshInstance3D('TestMesh')
    mesh.position = { x: 0, y: 0, z: 0 }
    mesh.scale = { x: 0.01, y: 0.01, z: 0.01 }
    scene.addChild(mesh)

    console.log('✅ 测试场景创建完成')

    // 测试序列化
    console.log('📦 开始序列化...')
    const serialized = scene.serialize()
    console.log('✅ 序列化成功')
    console.log('📊 序列化数据大小:', JSON.stringify(serialized).length, '字节')

    // 测试反序列化
    if (typeof (Scene as any).deserialize === 'function') {
      console.log('🔄 开始反序列化...')
      const restored = (Scene as any).deserialize(serialized)
      console.log('✅ 反序列化成功')
      console.log('📋 恢复的场景名称:', restored.name)
      console.log('📋 恢复的子节点数量:', restored.children.length)
    } else {
      console.log('ℹ️ Scene.deserialize方法不存在')
    }

    console.log('🎉 Node反射序列化测试完成！')

  } catch (error) {
    console.error('❌ Node反射序列化测试失败:', error)
  }
}

// 导出到全局
if (typeof window !== 'undefined') {
  (window as any).testNodeReflectionSerialization = testNodeReflectionSerialization
  console.log('💡 运行 window.testNodeReflectionSerialization() 测试Node反射序列化')
}

export default testNodeReflectionSerialization
