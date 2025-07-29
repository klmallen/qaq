/**
 * QAQ游戏引擎 - GLTF资源加载器使用示例
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 演示如何使用增强的GLTF资源加载器
 * - 展示各种加载选项和资源访问方法
 * - 提供完整的使用场景示例
 * - 演示资源过滤和优化功能
 */

import ResourceLoader from './ResourceLoader'
import GLTFResourceFilter from './GLTFResourceFilter'
import { GLTFResourceType, GLTFLoadOptions } from './GLTFResource'
import * as THREE from 'three'

// ============================================================================
// 基础使用示例
// ============================================================================

/**
 * 基础GLTF加载示例
 */
export async function basicGLTFLoadingExample(): Promise<void> {
  console.log('📦 基础GLTF加载示例')
  
  const resourceLoader = ResourceLoader.getInstance()
  
  try {
    // 1. 使用默认选项加载GLTF
    console.log('1. 加载GLTF文件...')
    const gltfResource = await resourceLoader.loadGLTF('/models/character.gltf')
    
    console.log('✅ GLTF加载完成')
    console.log(`- 场景数量: ${gltfResource.scenes.length}`)
    console.log(`- 动画数量: ${gltfResource.animations.length}`)
    console.log(`- 网格数量: ${gltfResource.meshes.length}`)
    console.log(`- 材质数量: ${gltfResource.materials.length}`)
    console.log(`- 纹理数量: ${gltfResource.textures.length}`)
    
    // 2. 获取主场景并添加到Three.js场景中
    const scene = new THREE.Scene()
    scene.add(gltfResource.scene)
    
    // 3. 播放动画（如果有）
    if (gltfResource.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(gltfResource.scene)
      const action = mixer.clipAction(gltfResource.animations[0])
      action.play()
      console.log(`🎬 开始播放动画: ${gltfResource.animations[0].name}`)
    }
    
  } catch (error) {
    console.error('❌ GLTF加载失败:', error)
  }
}

/**
 * 高级GLTF加载选项示例
 */
export async function advancedGLTFLoadingExample(): Promise<void> {
  console.log('🔧 高级GLTF加载选项示例')
  
  const resourceLoader = ResourceLoader.getInstance()
  
  // 配置加载选项
  const loadOptions: GLTFLoadOptions = {
    parseAnimations: true,
    parseMaterials: true,
    parseTextures: true,
    parseCameras: false, // 不解析相机
    parseLights: true,
    parseSkins: true,
    createResourceIndex: true,
    parseDependencies: true,
    resourceTypeFilter: [
      GLTFResourceType.MESH,
      GLTFResourceType.MATERIAL,
      GLTFResourceType.TEXTURE,
      GLTFResourceType.ANIMATION
    ]
  }
  
  try {
    console.log('1. 使用自定义选项加载GLTF...')
    const gltfResource = await resourceLoader.loadGLTF('/models/environment.gltf', loadOptions)
    
    console.log('✅ 高级GLTF加载完成')
    console.log('📊 资源统计:')
    console.log(`- 总顶点数: ${gltfResource.stats.totalVertices}`)
    console.log(`- 总三角形数: ${gltfResource.stats.totalTriangles}`)
    console.log(`- 纹理内存: ${(gltfResource.stats.totalTextureMemory / 1024 / 1024).toFixed(2)} MB`)
    console.log(`- 解析时间: ${gltfResource.stats.parseTime} ms`)
    
  } catch (error) {
    console.error('❌ 高级GLTF加载失败:', error)
  }
}

/**
 * GLTF资源访问示例
 */
export async function gltfResourceAccessExample(): Promise<void> {
  console.log('🔍 GLTF资源访问示例')
  
  const resourceLoader = ResourceLoader.getInstance()
  
  try {
    const gltfResource = await resourceLoader.loadGLTF('/models/vehicle.gltf')
    const accessor = resourceLoader.createGLTFAccessor(gltfResource)
    
    console.log('1. 访问动画资源...')
    const animations = accessor.getAnimations()
    animations.forEach((animation, index) => {
      console.log(`  动画 ${index}: ${animation.name} (时长: ${animation.duration}s)`)
    })
    
    // 按名称获取特定动画
    const driveAnimation = accessor.getAnimationByName('Drive')
    if (driveAnimation) {
      console.log(`✅ 找到驾驶动画: ${driveAnimation.name}`)
    }
    
    console.log('2. 访问材质资源...')
    const materials = accessor.getMaterials()
    materials.forEach((material, index) => {
      console.log(`  材质 ${index}: ${material.name || '未命名'} (类型: ${material.type})`)
    })
    
    console.log('3. 访问纹理资源...')
    const textures = accessor.getTextures()
    textures.forEach((texture, index) => {
      const image = texture.image
      if (image) {
        console.log(`  纹理 ${index}: ${texture.name || '未命名'} (${image.width}x${image.height})`)
      }
    })
    
    console.log('4. 访问网格资源...')
    const meshes = accessor.getMeshes()
    meshes.forEach((mesh, index) => {
      const geometry = mesh.geometry
      const vertexCount = geometry.attributes.position?.count || 0
      console.log(`  网格 ${index}: ${mesh.name || '未命名'} (顶点数: ${vertexCount})`)
    })
    
  } catch (error) {
    console.error('❌ 资源访问失败:', error)
  }
}

/**
 * GLTF资源过滤示例
 */
export async function gltfResourceFilterExample(): Promise<void> {
  console.log('🔎 GLTF资源过滤示例')
  
  const resourceLoader = ResourceLoader.getInstance()
  
  try {
    const gltfResource = await resourceLoader.loadGLTF('/models/complex-scene.gltf')
    const filter = new GLTFResourceFilter(gltfResource)
    
    console.log('1. 按类型过滤资源...')
    const materials = filter.filterResources({
      types: [GLTFResourceType.MATERIAL]
    })
    console.log(`  找到 ${materials.length} 个材质`)
    
    const textures = filter.filterResources({
      types: [GLTFResourceType.TEXTURE]
    })
    console.log(`  找到 ${textures.length} 个纹理`)
    
    console.log('2. 按名称查找资源...')
    const metalResources = filter.findResources('metal', {
      caseSensitive: false,
      useRegex: false
    })
    console.log(`  找到 ${metalResources.length} 个包含"metal"的资源`)
    
    console.log('3. 使用正则表达式查找...')
    const colorResources = filter.findResources('(red|blue|green)', {
      useRegex: true,
      caseSensitive: false
    })
    console.log(`  找到 ${colorResources.length} 个颜色相关的资源`)
    
    console.log('4. 获取资源统计信息...')
    const stats = filter.getResourceStats()
    console.log(`  总资源数: ${stats.totalResources}`)
    console.log(`  已命名资源: ${stats.namedResources}`)
    console.log(`  未命名资源: ${stats.unnamedResources}`)
    console.log(`  平均依赖数: ${stats.averageDependencies.toFixed(2)}`)
    
    console.log('5. 资源类型分布:')
    for (const [type, count] of stats.resourcesByType.entries()) {
      console.log(`  ${type}: ${count}`)
    }
    
  } catch (error) {
    console.error('❌ 资源过滤失败:', error)
  }
}

/**
 * GLTF资源优化示例
 */
export async function gltfResourceOptimizationExample(): Promise<void> {
  console.log('⚡ GLTF资源优化示例')
  
  const resourceLoader = ResourceLoader.getInstance()
  
  try {
    const gltfResource = await resourceLoader.loadGLTF('/models/large-scene.gltf')
    const filter = new GLTFResourceFilter(gltfResource)
    
    console.log('1. 分析未使用的资源...')
    const unusedResources = filter.getUnusedResources()
    if (unusedResources.length > 0) {
      console.log(`  发现 ${unusedResources.length} 个未使用的资源:`)
      unusedResources.forEach(resourceId => {
        console.log(`    - ${resourceId}`)
      })
    } else {
      console.log('  ✅ 没有发现未使用的资源')
    }
    
    console.log('2. 分析资源依赖关系...')
    const materialResources = filter.filterResources({
      types: [GLTFResourceType.MATERIAL]
    })
    
    materialResources.slice(0, 3).forEach(container => {
      const analysis = filter.analyzeDependencies(container.metadata.id)
      if (analysis) {
        console.log(`  材质 ${container.metadata.name}:`)
        console.log(`    直接依赖: ${analysis.directDependencies.length}`)
        console.log(`    间接依赖: ${analysis.indirectDependencies.length}`)
        console.log(`    依赖深度: ${analysis.dependencyDepth}`)
        console.log(`    循环依赖: ${analysis.hasCircularDependency ? '是' : '否'}`)
      }
    })
    
    console.log('3. 获取优化建议...')
    const suggestions = filter.getOptimizationSuggestions()
    if (suggestions.length > 0) {
      console.log('  💡 优化建议:')
      suggestions.forEach((suggestion, index) => {
        console.log(`    ${index + 1}. ${suggestion}`)
      })
    } else {
      console.log('  ✅ 资源已经很好地优化了')
    }
    
  } catch (error) {
    console.error('❌ 资源优化分析失败:', error)
  }
}

/**
 * 向后兼容性示例
 */
export async function backwardCompatibilityExample(): Promise<void> {
  console.log('🔄 向后兼容性示例')
  
  const resourceLoader = ResourceLoader.getInstance()
  
  try {
    console.log('1. 使用原有的load方法...')
    const scene = await resourceLoader.load('/models/simple.gltf')
    
    console.assert(scene instanceof THREE.Group, '应返回THREE.Group对象')
    console.log('✅ 原有的load方法仍然正常工作')
    
    console.log('2. 新旧方法对比...')
    const gltfResource = await resourceLoader.loadGLTF('/models/simple.gltf')
    
    console.log('  原方法返回: THREE.Group')
    console.log('  新方法返回: 完整的GLTFResource对象')
    console.log(`    - 包含 ${gltfResource.animations.length} 个动画`)
    console.log(`    - 包含 ${gltfResource.materials.length} 个材质`)
    console.log(`    - 包含 ${gltfResource.textures.length} 个纹理`)
    console.log('  ✅ 新方法提供了更丰富的资源信息')
    
  } catch (error) {
    console.error('❌ 向后兼容性测试失败:', error)
  }
}

// ============================================================================
// 完整使用流程示例
// ============================================================================

/**
 * 完整的GLTF资源管理流程示例
 */
export async function completeGLTFWorkflowExample(): Promise<void> {
  console.log('🎮 完整的GLTF资源管理流程示例')
  
  const resourceLoader = ResourceLoader.getInstance()
  
  try {
    // 1. 加载GLTF资源
    console.log('步骤1: 加载GLTF资源...')
    const gltfResource = await resourceLoader.loadGLTF('/models/game-character.gltf', {
      parseAnimations: true,
      parseMaterials: true,
      parseTextures: true,
      createResourceIndex: true,
      parseDependencies: true
    })
    
    // 2. 创建访问器和过滤器
    console.log('步骤2: 创建资源管理工具...')
    const accessor = resourceLoader.createGLTFAccessor(gltfResource)
    const filter = new GLTFResourceFilter(gltfResource)
    
    // 3. 设置场景
    console.log('步骤3: 设置Three.js场景...')
    const scene = new THREE.Scene()
    scene.add(gltfResource.scene)
    
    // 4. 设置动画
    console.log('步骤4: 设置动画系统...')
    const mixer = new THREE.AnimationMixer(gltfResource.scene)
    const idleAnimation = accessor.getAnimationByName('Idle')
    const walkAnimation = accessor.getAnimationByName('Walk')
    
    if (idleAnimation) {
      const idleAction = mixer.clipAction(idleAnimation)
      idleAction.play()
      console.log('  ✅ 播放待机动画')
    }
    
    // 5. 材质管理
    console.log('步骤5: 管理材质资源...')
    const materials = accessor.getMaterials()
    materials.forEach(material => {
      if (material instanceof THREE.MeshStandardMaterial) {
        // 调整材质属性
        material.roughness = 0.8
        material.metalness = 0.2
      }
    })
    console.log(`  ✅ 调整了 ${materials.length} 个材质`)
    
    // 6. 资源优化
    console.log('步骤6: 资源优化分析...')
    const suggestions = filter.getOptimizationSuggestions()
    if (suggestions.length > 0) {
      console.log('  💡 发现优化机会:')
      suggestions.forEach(suggestion => console.log(`    - ${suggestion}`))
    }
    
    // 7. 运行时更新
    console.log('步骤7: 设置运行时更新...')
    const clock = new THREE.Clock()
    
    function animate() {
      const deltaTime = clock.getDelta()
      mixer.update(deltaTime)
      
      // 这里可以添加渲染逻辑
      // renderer.render(scene, camera)
      
      requestAnimationFrame(animate)
    }
    
    // animate() // 在实际应用中启动动画循环
    
    console.log('🎉 完整的GLTF资源管理流程设置完成！')
    
  } catch (error) {
    console.error('❌ 完整流程示例失败:', error)
  }
}

// ============================================================================
// 主示例函数
// ============================================================================

/**
 * 运行所有GLTF资源加载器示例
 */
export async function runGLTFResourceLoaderExamples(): Promise<void> {
  console.log('🚀 开始GLTF资源加载器示例演示...')
  
  try {
    await basicGLTFLoadingExample()
    console.log('\n' + '='.repeat(50) + '\n')
    
    await advancedGLTFLoadingExample()
    console.log('\n' + '='.repeat(50) + '\n')
    
    await gltfResourceAccessExample()
    console.log('\n' + '='.repeat(50) + '\n')
    
    await gltfResourceFilterExample()
    console.log('\n' + '='.repeat(50) + '\n')
    
    await gltfResourceOptimizationExample()
    console.log('\n' + '='.repeat(50) + '\n')
    
    await backwardCompatibilityExample()
    console.log('\n' + '='.repeat(50) + '\n')
    
    await completeGLTFWorkflowExample()
    
    console.log('\n🎉 所有GLTF资源加载器示例演示完成！')
    
  } catch (error) {
    console.error('❌ 示例演示失败:', error)
  }
}

// 如果直接运行此文件，执行示例
if (typeof window === 'undefined') {
  runGLTFResourceLoaderExamples().catch(console.error)
}
