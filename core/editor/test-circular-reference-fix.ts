/**
 * QAQ游戏引擎 - 循环引用修复测试
 * 
 * 测试Node反射序列化是否正确处理循环引用问题
 */

import { Node, Scene, Node3D, Camera3D, DirectionalLight3D, MeshInstance3D } from '../index'

/**
 * 测试循环引用修复
 */
export function testCircularReferenceFix(): void {
  console.log('🧪 测试循环引用修复...')

  try {
    // 创建复杂的场景结构
    const scene = new Scene('CircularTestScene')
    
    // 添加根节点
    const root = new Node3D('Root')
    scene.addChild(root)

    // 添加相机
    const camera = new Camera3D('MainCamera')
    camera.position = { x: 5, y: 5, z: 5 }
    camera.fov = 60
    root.addChild(camera)

    // 添加光源
    const light = new DirectionalLight3D('SunLight')
    light.position = { x: 10, y: 10, z: 5 }
    light.intensity = 1.5
    light.color = { r: 1, g: 0.9, b: 0.8 }
    root.addChild(light)

    // 添加网格
    const mesh = new MeshInstance3D('TestMesh')
    mesh.position = { x: 0, y: 0, z: 0 }
    mesh.scale = { x: 0.01, y: 0.01, z: 0.01 }
    mesh.castShadow = true
    root.addChild(mesh)

    // 创建更深的嵌套结构
    const childMesh = new MeshInstance3D('ChildMesh')
    childMesh.position = { x: 1, y: 1, z: 1 }
    mesh.addChild(childMesh)

    console.log('✅ 复杂场景结构创建完成')
    console.log(`📊 场景统计: ${scene.children.length} 个直接子节点`)

    // 测试序列化
    console.log('📦 开始序列化测试...')
    const startTime = performance.now()
    
    const serialized = scene.serialize()
    
    const endTime = performance.now()
    const serializationTime = endTime - startTime

    console.log('✅ 序列化成功！')
    console.log(`⏱️ 序列化耗时: ${serializationTime.toFixed(2)}ms`)
    console.log(`📊 序列化数据大小: ${JSON.stringify(serialized).length} 字节`)
    console.log(`📊 根节点类型: ${serialized.type}`)
    console.log(`📊 根节点子节点数: ${serialized.children.length}`)

    // 验证序列化数据结构
    console.log('🔍 验证序列化数据结构...')
    
    if (serialized.children.length > 0) {
      const rootChild = serialized.children[0]
      console.log(`  - 根子节点类型: ${rootChild.type}`)
      console.log(`  - 根子节点子节点数: ${rootChild.children.length}`)
      
      if (rootChild.children.length > 0) {
        console.log('  - 子节点类型:')
        rootChild.children.forEach((child: any, index: number) => {
          console.log(`    ${index + 1}. ${child.type} (${child.name})`)
        })
      }
    }

    // 测试反序列化
    console.log('🔄 开始反序列化测试...')
    const deserializeStartTime = performance.now()

    const restored = Node.deserialize(serialized, Scene) as Scene

    const deserializeEndTime = performance.now()
    const deserializationTime = deserializeEndTime - deserializeStartTime

    console.log('✅ 反序列化成功！')
    console.log(`⏱️ 反序列化耗时: ${deserializationTime.toFixed(2)}ms`)
    console.log(`📊 恢复的场景名称: ${restored.name}`)
    console.log(`📊 恢复的子节点数: ${restored.children.length}`)

    // 验证数据完整性
    console.log('🔍 验证数据完整性...')
    const issues: string[] = []

    if (restored.name !== scene.name) {
      issues.push(`场景名称不匹配: ${scene.name} vs ${restored.name}`)
    }

    if (restored.children.length !== scene.children.length) {
      issues.push(`子节点数量不匹配: ${scene.children.length} vs ${restored.children.length}`)
    }

    // 检查特定节点
    const restoredRoot = restored.children[0] as Node3D
    if (restoredRoot) {
      const restoredCamera = restoredRoot.children.find(child => child.name === 'MainCamera') as Camera3D
      const restoredLight = restoredRoot.children.find(child => child.name === 'SunLight') as DirectionalLight3D
      const restoredMesh = restoredRoot.children.find(child => child.name === 'TestMesh') as MeshInstance3D

      if (!restoredCamera) {
        issues.push('相机节点丢失')
      } else if (Math.abs(restoredCamera.fov - camera.fov) > 0.001) {
        issues.push(`相机FOV不匹配: ${camera.fov} vs ${restoredCamera.fov}`)
      }

      if (!restoredLight) {
        issues.push('光源节点丢失')
      } else if (Math.abs(restoredLight.intensity - light.intensity) > 0.001) {
        issues.push(`光源强度不匹配: ${light.intensity} vs ${restoredLight.intensity}`)
      }

      if (!restoredMesh) {
        issues.push('网格节点丢失')
      } else if (restoredMesh.castShadow !== mesh.castShadow) {
        issues.push(`网格阴影设置不匹配: ${mesh.castShadow} vs ${restoredMesh.castShadow}`)
      }
    }

    // 输出验证结果
    if (issues.length === 0) {
      console.log('✅ 数据完整性验证通过！')
    } else {
      console.warn('⚠️ 发现数据完整性问题:')
      issues.forEach(issue => console.warn(`  - ${issue}`))
    }

    // 性能统计
    console.log('📊 性能统计:')
    console.log(`  - 序列化速度: ${(serialized.children.length / serializationTime * 1000).toFixed(0)} 节点/秒`)
    console.log(`  - 反序列化速度: ${(restored.children.length / deserializationTime * 1000).toFixed(0)} 节点/秒`)
    console.log(`  - 数据压缩比: ${(JSON.stringify(serialized).length / 1024).toFixed(2)} KB`)

    console.log('🎉 循环引用修复测试完成！')

    return {
      success: issues.length === 0,
      serializationTime,
      deserializationTime,
      dataSize: JSON.stringify(serialized).length,
      issues
    }

  } catch (error) {
    console.error('❌ 循环引用修复测试失败:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * 测试简单序列化
 */
export function testSimpleSerialization(): void {
  console.log('🧪 测试简单序列化...')

  try {
    // 创建简单节点
    const node = new Node3D('SimpleNode')
    node.position = { x: 1, y: 2, z: 3 }
    node.visible = true

    console.log('📦 序列化简单节点...')
    const serialized = node.serialize()

    console.log('✅ 简单序列化成功！')
    console.log('📊 序列化数据:', JSON.stringify(serialized, null, 2))

    // 反序列化
    const restored = Node.deserialize(serialized, Node3D) as Node3D
    console.log('✅ 简单反序列化成功！')
    console.log(`📊 恢复的节点名称: ${restored.name}`)
    console.log(`📊 恢复的位置: ${JSON.stringify((restored as any).position)}`)

  } catch (error) {
    console.error('❌ 简单序列化测试失败:', error)
  }
}

// 导出到全局（仅在浏览器环境中）
if (typeof window !== 'undefined' && window) {
  try {
    (window as any).testCircularReferenceFix = testCircularReferenceFix
    (window as any).testSimpleSerialization = testSimpleSerialization
    console.log('💡 可用测试命令:')
    console.log('  - window.testCircularReferenceFix() // 测试循环引用修复')
    console.log('  - window.testSimpleSerialization() // 测试简单序列化')
  } catch (error) {
    console.warn('⚠️ 无法设置全局测试函数:', error)
  }
}
