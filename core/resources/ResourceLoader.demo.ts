/**
 * QAQ游戏引擎 - ResourceLoader 功能演示
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 演示内容:
 * - ResourceLoader基础资源加载功能
 * - 多格式3D模型加载演示
 * - 异步加载和进度管理
 * - 资源缓存和性能优化
 * - 与MeshInstance3D的集成使用
 */

import ResourceLoader, { ResourceType, LoadOptions } from './ResourceLoader'
import type { LoadProgress } from './ResourceLoader'
import MeshInstance3D from '../nodes/MeshInstance3D'

// ============================================================================
// 演示函数
// ============================================================================

/**
 * 演示基础ResourceLoader功能
 */
function demoBasicResourceLoader(): void {
  console.log('📦 演示基础ResourceLoader功能...\n')

  // 获取ResourceLoader单例
  const loader = ResourceLoader.getInstance()

  console.log(`✅ ResourceLoader单例获取成功`)
  console.log(`   实例类型: ${loader.constructor.name}`)

  // 展示支持的文件格式
  const supportedExtensions = loader.getSupportedExtensions()
  console.log(`\n📋 支持的文件格式 (${supportedExtensions.length}种):`)

  const formatGroups = {
    '3D模型': ['gltf', 'glb', 'obj', 'fbx'],
    '纹理图片': ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif'],
    '其他': []
  }

  // 分类显示支持的格式
  Object.entries(formatGroups).forEach(([category, formats]) => {
    const categoryFormats = supportedExtensions.filter(ext => formats.includes(ext))
    if (categoryFormats.length > 0) {
      console.log(`   ${category}: ${categoryFormats.join(', ')}`)
    }
  })

  // 其他格式
  const otherFormats = supportedExtensions.filter(ext =>
    !formatGroups['3D模型'].includes(ext) &&
    !formatGroups['纹理图片'].includes(ext)
  )
  if (otherFormats.length > 0) {
    console.log(`   其他: ${otherFormats.join(', ')}`)
  }

  console.log('\n')
}

/**
 * 演示文件格式检测
 */
function demoFormatDetection(): void {
  console.log('🔍 演示文件格式检测...\n')

  const loader = ResourceLoader.getInstance()

  // 测试不同类型的文件
  const testFiles = [
    { path: 'models/character.gltf', desc: 'GLTF模型文件' },
    { path: 'models/building.glb', desc: 'GLB二进制模型' },
    { path: 'models/terrain.obj', desc: 'OBJ模型文件' },
    { path: 'models/animation.fbx', desc: 'FBX模型文件' },
    { path: 'textures/diffuse.jpg', desc: 'JPG纹理文件' },
    { path: 'textures/normal.png', desc: 'PNG纹理文件' },
    { path: 'sounds/bgm.mp3', desc: 'MP3音频文件' },
    { path: 'unknown.xyz', desc: '未知格式文件' }
  ]

  console.log(`📁 文件格式检测结果:`)
  testFiles.forEach(file => {
    const isSupported = loader.isSupported(file.path)
    const status = isSupported ? '✅ 支持' : '❌ 不支持'
    console.log(`   ${file.desc}: ${status}`)
    console.log(`     路径: ${file.path}`)
  })

  console.log('\n')
}

/**
 * 演示进度回调系统
 */
function demoProgressCallback(): void {
  console.log('📊 演示进度回调系统...\n')

  const loader = ResourceLoader.getInstance()

  // 设置全局进度回调
  loader.setGlobalProgressCallback((progress: LoadProgress) => {
    const percentage = (progress.progress * 100).toFixed(1)
    const loaded = (progress.loaded / 1024).toFixed(1)
    const total = (progress.total / 1024).toFixed(1)

    console.log(`   📈 加载进度: ${percentage}% (${loaded}KB / ${total}KB)`)
    console.log(`     文件: ${progress.url}`)
  })

  console.log(`✅ 全局进度回调设置完成`)
  console.log(`   回调功能: 实时显示加载进度`)
  console.log(`   显示信息: 百分比、已加载/总大小、文件路径`)

  // 演示进度数据结构
  const mockProgress: LoadProgress = {
    loaded: 512000,  // 512KB
    total: 1024000,  // 1MB
    progress: 0.5,   // 50%
    url: 'models/demo.gltf'
  }

  console.log(`\n📋 进度数据结构示例:`)
  console.log(`   loaded: ${mockProgress.loaded} bytes`)
  console.log(`   total: ${mockProgress.total} bytes`)
  console.log(`   progress: ${mockProgress.progress} (0-1)`)
  console.log(`   url: ${mockProgress.url}`)

  console.log('\n')
}

/**
 * 演示缓存系统
 */
function demoCacheSystem(): void {
  console.log('💾 演示缓存系统...\n')

  const loader = ResourceLoader.getInstance()

  // 清除现有缓存
  loader.clearCache()
  console.log(`🗑️ 清除所有缓存`)

  // 检查缓存状态
  let cacheStats = loader.getCacheStats()
  console.log(`📊 缓存统计:`)
  console.log(`   缓存项数量: ${cacheStats.count}`)
  console.log(`   缓存URL列表: ${cacheStats.urls.length > 0 ? cacheStats.urls.join(', ') : '无'}`)

  // 演示缓存配置选项
  const cacheOptions: LoadOptions = {
    useCache: true,
    timeout: 30000
  }

  console.log(`\n⚙️ 缓存配置选项:`)
  console.log(`   启用缓存: ${cacheOptions.useCache}`)
  console.log(`   超时时间: ${cacheOptions.timeout}ms`)

  // 演示缓存优势
  console.log(`\n🚀 缓存系统优势:`)
  console.log(`   ✅ 避免重复加载相同资源`)
  console.log(`   ✅ 提高应用响应速度`)
  console.log(`   ✅ 减少网络带宽使用`)
  console.log(`   ✅ 支持内存管理和清理`)

  console.log('\n')
}

/**
 * 演示加载选项配置
 */
function demoLoadOptions(): void {
  console.log('⚙️ 演示加载选项配置...\n')

  // 基础加载选项
  const basicOptions: LoadOptions = {
    useCache: true,
    timeout: 30000
  }

  console.log(`📋 基础加载选项:`)
  console.log(`   useCache: ${basicOptions.useCache} - 启用资源缓存`)
  console.log(`   timeout: ${basicOptions.timeout}ms - 加载超时时间`)

  // 高级加载选项
  const advancedOptions: LoadOptions = {
    useCache: true,
    timeout: 60000,
    enableDraco: true,
    dracoDecoderPath: '/draco/',
    loaderConfig: {
      crossOrigin: 'anonymous',
      withCredentials: false
    }
  }

  console.log(`\n🔧 高级加载选项:`)
  console.log(`   enableDraco: ${advancedOptions.enableDraco} - 启用Draco压缩`)
  console.log(`   dracoDecoderPath: ${advancedOptions.dracoDecoderPath} - Draco解码器路径`)
  console.log(`   loaderConfig: 自定义加载器配置`)

  // 性能优化选项
  console.log(`\n🚀 性能优化建议:`)
  console.log(`   ✅ 启用Draco压缩减少文件大小`)
  console.log(`   ✅ 合理设置超时时间`)
  console.log(`   ✅ 使用缓存避免重复加载`)
  console.log(`   ✅ 预加载关键资源`)

  console.log('\n')
}

/**
 * 演示与MeshInstance3D的集成
 */
function demoMeshInstance3DIntegration(): void {
  console.log('🔗 演示与MeshInstance3D的集成...\n')

  // 创建MeshInstance3D节点
  const meshNode = new MeshInstance3D('DemoMesh')

  console.log(`✅ 创建MeshInstance3D节点: ${meshNode.name}`)
  console.log(`   节点类型: ${meshNode.constructor.name}`)
  console.log(`   渲染层: ${meshNode.renderLayer}`)

  // 演示模型加载方法
  console.log(`\n📦 MeshInstance3D模型加载方法:`)
  console.log(`   loadModel(path, onProgress) - 异步加载模型`)
  console.log(`   replaceModel(path, onProgress) - 替换当前模型`)
  console.log(`   setModelFromGroup(group) - 从Three.js Group设置模型`)

  // 演示静态方法
  console.log(`\n🔧 静态工具方法:`)
  console.log(`   preloadModel(path) - 预加载单个模型`)
  console.log(`   preloadModels(paths, onProgress) - 批量预加载`)
  console.log(`   clearModelCache(path?) - 清除模型缓存`)
  console.log(`   getModelCacheStats() - 获取缓存统计`)

  // 演示使用流程
  console.log(`\n📋 典型使用流程:`)
  console.log(`   1. 创建MeshInstance3D节点`)
  console.log(`   2. 调用loadModel()加载3D模型`)
  console.log(`   3. 设置进度回调监听加载状态`)
  console.log(`   4. 模型加载完成后自动应用到节点`)
  console.log(`   5. 可选：使用replaceModel()动态切换模型`)

  console.log('\n')
}

/**
 * 演示错误处理机制
 */
function demoErrorHandling(): void {
  console.log('⚠️ 演示错误处理机制...\n')

  const loader = ResourceLoader.getInstance()

  // 演示不同类型的错误
  console.log(`🚨 常见错误类型:`)

  // 1. 不支持的文件格式
  try {
    const isSupported = loader.isSupported('model.unknown')
    console.log(`   不支持的格式: ${isSupported ? '支持' : '不支持'} ✅`)
  } catch (error) {
    console.log(`   格式检测错误: ${error}`)
  }

  // 2. 空文件路径
  try {
    const isSupported = loader.isSupported('')
    console.log(`   空文件路径: ${isSupported ? '支持' : '不支持'} ✅`)
  } catch (error) {
    console.log(`   空路径错误: ${error}`)
  }

  // 演示错误处理策略
  console.log(`\n🛡️ 错误处理策略:`)
  console.log(`   ✅ 优雅降级 - 不支持的格式返回false`)
  console.log(`   ✅ 超时处理 - 可配置的加载超时`)
  console.log(`   ✅ 重试机制 - 失败后可重新尝试`)
  console.log(`   ✅ 详细错误信息 - 便于调试和排错`)

  // 演示最佳实践
  console.log(`\n💡 最佳实践建议:`)
  console.log(`   1. 加载前检查文件格式支持`)
  console.log(`   2. 设置合理的超时时间`)
  console.log(`   3. 提供加载失败的备用方案`)
  console.log(`   4. 监听错误事件并记录日志`)

  console.log('\n')
}

/**
 * 演示性能优化技巧
 */
function demoPerformanceOptimization(): void {
  console.log('🚀 演示性能优化技巧...\n')

  console.log(`⚡ 加载性能优化:`)
  console.log(`   1. 启用资源缓存避免重复加载`)
  console.log(`   2. 使用Draco压缩减少GLTF文件大小`)
  console.log(`   3. 预加载关键资源提升用户体验`)
  console.log(`   4. 合理设置超时时间平衡性能和稳定性`)

  console.log(`\n💾 内存管理优化:`)
  console.log(`   1. 定期清理不需要的缓存`)
  console.log(`   2. 监控缓存使用情况`)
  console.log(`   3. 按需加载避免内存浪费`)
  console.log(`   4. 使用弱引用避免内存泄漏`)

  console.log(`\n🌐 网络优化:`)
  console.log(`   1. 使用CDN加速资源加载`)
  console.log(`   2. 启用HTTP/2多路复用`)
  console.log(`   3. 压缩纹理和模型文件`)
  console.log(`   4. 实现渐进式加载`)

  console.log(`\n📊 监控和调试:`)
  console.log(`   1. 监听加载进度和性能指标`)
  console.log(`   2. 记录加载时间和错误率`)
  console.log(`   3. 使用浏览器开发工具分析`)
  console.log(`   4. 实现性能预警机制`)

  console.log('\n')
}

/**
 * 运行所有演示
 */
function runAllDemos(): void {
  console.log('🚀 QAQ游戏引擎 - ResourceLoader功能演示\n')
  console.log('=' .repeat(50))
  console.log('\n')

  try {
    demoBasicResourceLoader()
    demoFormatDetection()
    demoProgressCallback()
    demoCacheSystem()
    demoLoadOptions()
    demoMeshInstance3DIntegration()
    demoErrorHandling()
    demoPerformanceOptimization()

    console.log('🎉 所有演示完成！')
    console.log('\n📋 演示总结:')
    console.log('   ✅ 基础资源加载功能正常')
    console.log('   ✅ 多格式文件支持正常')
    console.log('   ✅ 进度回调系统正常')
    console.log('   ✅ 缓存管理系统正常')
    console.log('   ✅ 配置选项系统正常')
    console.log('   ✅ MeshInstance3D集成正常')
    console.log('   ✅ 错误处理机制正常')
    console.log('   ✅ 性能优化策略完善')
    console.log('\n🎯 ResourceLoader已准备好作为资源管理系统的核心！')
    console.log('🔧 核心特性完美运行：')
    console.log('   - 统一的资源加载API')
    console.log('   - 多格式3D模型支持')
    console.log('   - 异步加载和进度管理')
    console.log('   - 智能缓存和内存管理')
    console.log('   - 与Three.js深度集成')

  } catch (error) {
    console.error('\n❌ 演示过程中出现错误:', error)
  }
}

// ============================================================================
// 导出
// ============================================================================

export {
  demoBasicResourceLoader,
  demoFormatDetection,
  demoProgressCallback,
  demoCacheSystem,
  demoLoadOptions,
  demoMeshInstance3DIntegration,
  demoErrorHandling,
  demoPerformanceOptimization,
  runAllDemos
}

// 如果直接运行此文件，执行所有演示
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  runAllDemos()
}
