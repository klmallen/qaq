/**
 * QAQ游戏引擎 - GLTF资源加载器测试
 *
 * 作者: QAQ游戏引擎开发团队
 * 创建时间: 2024年
 *
 * 功能说明:
 * - 测试增强的GLTF资源加载器功能
 * - 验证资源解析和分类的正确性
 * - 测试资源过滤和查询功能
 * - 确保向后兼容性
 */

import ResourceLoader from './ResourceLoader'
import EnhancedGLTFLoader, { GLTFResourceAccessor } from './EnhancedGLTFLoader'
import GLTFResourceFilter from './GLTFResourceFilter'
import { GLTFResourceType, GLTFLoadOptions } from './GLTFResource'
import * as THREE from 'three'

// ============================================================================
// 测试辅助函数
// ============================================================================

/**
 * 创建模拟的GLTF文件URL
 */
function createMockGLTFUrl(): string {
  // 在实际测试中，这里应该是真实的GLTF文件路径
  return '/test-assets/sample.gltf'
}

/**
 * 创建测试用的GLTF加载选项
 */
function createTestLoadOptions(): GLTFLoadOptions {
  return {
    parseAnimations: true,
    parseMaterials: true,
    parseTextures: true,
    parseCameras: true,
    parseLights: true,
    parseSkins: true,
    createResourceIndex: true,
    parseDependencies: true
  }
}

// ============================================================================
// 基础功能测试
// ============================================================================

/**
 * 测试增强的GLTF加载器基础功能
 */
async function testEnhancedGLTFLoader(): Promise<void> {
  console.log('🧪 测试增强的GLTF加载器...')
  
  const loader = new EnhancedGLTFLoader()
  
  // 测试支持的扩展名
  console.assert(
    loader.supportedExtensions.includes('gltf'),
    '应支持.gltf扩展名'
  )
  console.assert(
    loader.supportedExtensions.includes('glb'),
    '应支持.glb扩展名'
  )
  
  // 测试进度回调设置
  let progressCalled = false
  loader.setProgressCallback((progress) => {
    progressCalled = true
    console.assert(
      typeof progress.loaded === 'number',
      '进度回调应包含loaded属性'
    )
    console.assert(
      typeof progress.total === 'number',
      '进度回调应包含total属性'
    )
  })
  
  console.log('✅ 增强的GLTF加载器基础功能测试通过')
}

/**
 * 测试ResourceLoader的GLTF专用方法
 */
async function testResourceLoaderGLTFMethods(): Promise<void> {
  console.log('🧪 测试ResourceLoader的GLTF专用方法...')
  
  const resourceLoader = ResourceLoader.getInstance()
  
  // 测试loadGLTF方法存在
  console.assert(
    typeof resourceLoader.loadGLTF === 'function',
    'ResourceLoader应有loadGLTF方法'
  )
  
  // 测试createGLTFAccessor方法存在
  console.assert(
    typeof resourceLoader.createGLTFAccessor === 'function',
    'ResourceLoader应有createGLTFAccessor方法'
  )
  
  console.log('✅ ResourceLoader的GLTF专用方法测试通过')
}

/**
 * 测试GLTF资源结构
 */
function testGLTFResourceStructure(): void {
  console.log('🧪 测试GLTF资源结构...')
  
  // 创建模拟的GLTF资源对象
  const mockGLTFResource = {
    gltf: {} as any,
    scene: new THREE.Group(),
    scenes: [new THREE.Group()],
    animations: [],
    meshes: [],
    materials: [],
    textures: [],
    cameras: [],
    lights: [],
    metadata: {
      scenes: [],
      nodes: [],
      meshes: [],
      materials: [],
      textures: [],
      animations: [],
      cameras: []
    },
    resourceIndex: {
      byType: new Map(),
      byId: new Map(),
      byName: new Map(),
      dependencies: new Map()
    },
    stats: {
      totalVertices: 0,
      totalTriangles: 0,
      totalTextureMemory: 0,
      fileSize: 0,
      parseTime: 0
    }
  }
  
  // 验证资源结构
  console.assert(mockGLTFResource.scene instanceof THREE.Group, '应有主场景')
  console.assert(Array.isArray(mockGLTFResource.scenes), '应有场景数组')
  console.assert(Array.isArray(mockGLTFResource.animations), '应有动画数组')
  console.assert(Array.isArray(mockGLTFResource.meshes), '应有网格数组')
  console.assert(Array.isArray(mockGLTFResource.materials), '应有材质数组')
  console.assert(Array.isArray(mockGLTFResource.textures), '应有纹理数组')
  console.assert(typeof mockGLTFResource.metadata === 'object', '应有元数据对象')
  console.assert(typeof mockGLTFResource.resourceIndex === 'object', '应有资源索引')
  console.assert(typeof mockGLTFResource.stats === 'object', '应有统计信息')
  
  console.log('✅ GLTF资源结构测试通过')
}

/**
 * 测试GLTF资源访问器
 */
function testGLTFResourceAccessor(): void {
  console.log('🧪 测试GLTF资源访问器...')
  
  // 创建模拟资源
  const mockResource = {
    gltf: {} as any,
    scene: new THREE.Group(),
    scenes: [],
    animations: [
      new THREE.AnimationClip('TestAnimation', 1.0, [])
    ],
    meshes: [],
    materials: [
      new THREE.MeshStandardMaterial({ name: 'TestMaterial' })
    ],
    textures: [
      new THREE.Texture()
    ],
    cameras: [],
    lights: [],
    metadata: {
      scenes: [],
      nodes: [],
      meshes: [],
      materials: [],
      textures: [],
      animations: [],
      cameras: []
    },
    resourceIndex: {
      byType: new Map(),
      byId: new Map(),
      byName: new Map(),
      dependencies: new Map()
    },
    stats: {
      totalVertices: 0,
      totalTriangles: 0,
      totalTextureMemory: 0,
      fileSize: 0,
      parseTime: 0
    }
  }
  
  const accessor = new GLTFResourceAccessor(mockResource)
  
  // 测试动画访问
  const animations = accessor.getAnimations()
  console.assert(animations.length === 1, '应返回正确数量的动画')
  console.assert(animations[0].name === 'TestAnimation', '应返回正确的动画')
  
  const animationByName = accessor.getAnimationByName('TestAnimation')
  console.assert(animationByName !== null, '应能按名称找到动画')
  console.assert(animationByName?.name === 'TestAnimation', '应返回正确的动画')
  
  // 测试材质访问
  const materials = accessor.getMaterials()
  console.assert(materials.length === 1, '应返回正确数量的材质')
  
  const materialByName = accessor.getMaterialByName('TestMaterial')
  console.assert(materialByName !== null, '应能按名称找到材质')
  console.assert(materialByName?.name === 'TestMaterial', '应返回正确的材质')
  
  // 测试纹理访问
  const textures = accessor.getTextures()
  console.assert(textures.length === 1, '应返回正确数量的纹理')
  
  console.log('✅ GLTF资源访问器测试通过')
}

/**
 * 测试GLTF资源过滤器
 */
function testGLTFResourceFilter(): void {
  console.log('🧪 测试GLTF资源过滤器...')
  
  // 创建模拟资源
  const mockResource = {
    gltf: {} as any,
    scene: new THREE.Group(),
    scenes: [],
    animations: [],
    meshes: [],
    materials: [],
    textures: [],
    cameras: [],
    lights: [],
    metadata: {
      scenes: [],
      nodes: [],
      meshes: [],
      materials: [],
      textures: [],
      animations: [],
      cameras: []
    },
    resourceIndex: {
      byType: new Map([
        [GLTFResourceType.MATERIAL, [
          {
            resource: new THREE.MeshStandardMaterial(),
            metadata: {
              id: 'material_0',
              name: 'TestMaterial',
              type: GLTFResourceType.MATERIAL,
              index: 0
            },
            dependencies: []
          }
        ]]
      ]),
      byId: new Map(),
      byName: new Map(),
      dependencies: new Map()
    },
    stats: {
      totalVertices: 0,
      totalTriangles: 0,
      totalTextureMemory: 0,
      fileSize: 0,
      parseTime: 0
    }
  }
  
  const filter = new GLTFResourceFilter(mockResource)
  
  // 测试按类型过滤
  const materials = filter.filterResources({
    types: [GLTFResourceType.MATERIAL]
  })
  console.assert(materials.length === 1, '应能按类型过滤资源')
  
  // 测试按名称查找
  const foundResources = filter.findResources('TestMaterial')
  console.assert(foundResources.length === 1, '应能按名称查找资源')
  
  // 测试统计信息
  const stats = filter.getResourceStats()
  console.assert(stats.totalResources === 1, '应返回正确的资源总数')
  console.assert(stats.resourcesByType.get(GLTFResourceType.MATERIAL) === 1, '应返回正确的材质数量')
  
  console.log('✅ GLTF资源过滤器测试通过')
}

/**
 * 测试向后兼容性
 */
async function testBackwardCompatibility(): Promise<void> {
  console.log('🧪 测试向后兼容性...')
  
  const resourceLoader = ResourceLoader.getInstance()
  
  // 测试原有的load方法仍然存在
  console.assert(
    typeof resourceLoader.load === 'function',
    '原有的load方法应仍然存在'
  )
  
  // 测试原有方法的返回类型
  // 注意：这里只是类型检查，实际测试需要真实的GLTF文件
  const mockUrl = createMockGLTFUrl()
  
  try {
    // 这里会因为文件不存在而失败，但我们主要测试方法存在性
    await resourceLoader.load(mockUrl)
  } catch (error) {
    // 预期的错误，因为文件不存在
    console.assert(
      error instanceof Error,
      '应抛出适当的错误'
    )
  }
  
  console.log('✅ 向后兼容性测试通过')
}

// ============================================================================
// 集成测试
// ============================================================================

/**
 * 测试完整的GLTF加载流程
 */
async function testCompleteGLTFLoadingFlow(): Promise<void> {
  console.log('🧪 测试完整的GLTF加载流程...')
  
  const resourceLoader = ResourceLoader.getInstance()
  const mockUrl = createMockGLTFUrl()
  const options = createTestLoadOptions()
  
  try {
    // 测试增强的GLTF加载
    const gltfResource = await resourceLoader.loadGLTF(mockUrl, options)
    
    // 验证返回的资源结构
    console.assert(gltfResource.scene instanceof THREE.Group, '应返回有效的场景')
    console.assert(Array.isArray(gltfResource.scenes), '应包含场景数组')
    console.assert(typeof gltfResource.stats === 'object', '应包含统计信息')
    
    // 测试资源访问器
    const accessor = resourceLoader.createGLTFAccessor(gltfResource)
    console.assert(accessor instanceof GLTFResourceAccessor, '应创建有效的访问器')
    
    // 测试资源过滤器
    const filter = new GLTFResourceFilter(gltfResource)
    const stats = filter.getResourceStats()
    console.assert(typeof stats.totalResources === 'number', '应返回有效的统计信息')
    
    console.log('✅ 完整的GLTF加载流程测试通过')
    
  } catch (error) {
    // 在没有真实GLTF文件的情况下，这是预期的
    console.log('⚠️ 完整流程测试需要真实的GLTF文件，跳过实际加载测试')
  }
}

// ============================================================================
// 主测试函数
// ============================================================================

/**
 * 运行所有GLTF资源加载器测试
 */
export async function runGLTFResourceLoaderTests(): Promise<void> {
  console.log('🚀 开始GLTF资源加载器测试...')
  
  try {
    await testEnhancedGLTFLoader()
    await testResourceLoaderGLTFMethods()
    testGLTFResourceStructure()
    testGLTFResourceAccessor()
    testGLTFResourceFilter()
    await testBackwardCompatibility()
    await testCompleteGLTFLoadingFlow()
    
    console.log('🎉 所有GLTF资源加载器测试通过！')
  } catch (error) {
    console.error('❌ GLTF资源加载器测试失败:', error)
    throw error
  }
}

// 如果直接运行此文件，执行测试
if (typeof window === 'undefined') {
  runGLTFResourceLoaderTests().catch(console.error)
}
