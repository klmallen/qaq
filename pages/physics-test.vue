<template>
  <div class="physics-test">
    <h1>QAQ引擎物理系统测试</h1>
    <div class="controls">
      <button @click="resetPhysics">重置物理体</button>
      <button @click="addTestCube">添加测试立方体</button>
      <button @click="toggleDebug">切换调试信息</button>
    </div>
    <div class="info">
      <p>物理状态: {{ physicsStatus }}</p>
      <p>物理体数量: {{ bodyCount }}</p>
      <p>重力: {{ gravity }}</p>
    </div>
    <div id="physics-test-container" style="width: 100%; height: 600px;"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Engine from '~/core/engine/Engine'
import Scene from '~/core/scene/Scene'
import Node3D from '~/core/nodes/Node3D'
import MeshInstance3D from '~/core/nodes/MeshInstance3D'
import Camera3D from '~/core/nodes/Camera3D'

// 响应式状态
const physicsStatus = ref('未初始化')
const bodyCount = ref(0)
const gravity = ref('N/A')

// 引擎和场景引用
let engine: Engine | null = null
let scene: Scene | null = null
let testCubes: MeshInstance3D[] = []

// 物理系统模块
let PhysicsServer: any = null
let RigidBody3D: any = null
let StaticBody3D: any = null
let CollisionShape3D: any = null
let CollisionShapeType: any = null
let RigidBodyMode: any = null

// 加载物理系统模块
async function loadPhysicsModules() {
  try {
    const [
      physicsServerModule,
      rigidBodyModule,
      staticBodyModule,
      collisionShapeModule
    ] = await Promise.all([
      import('~/core/physics/PhysicsServer'),
      import('~/core/nodes/physics/RigidBody3D'),
      import('~/core/nodes/physics/StaticBody3D'),
      import('~/core/nodes/physics/CollisionShape3D')
    ])

    PhysicsServer = physicsServerModule.default
    RigidBody3D = rigidBodyModule.default
    StaticBody3D = staticBodyModule.default
    CollisionShape3D = collisionShapeModule.default
    CollisionShapeType = physicsServerModule.CollisionShapeType
    RigidBodyMode = rigidBodyModule.RigidBodyMode

    console.log('✅ 物理系统模块加载完成')
    return true
  } catch (error) {
    console.error('❌ 物理系统模块加载失败:', error)
    return false
  }
}

// 创建测试立方体
async function createTestCube(x: number, y: number, z: number): Promise<MeshInstance3D | null> {
  if (!RigidBody3D || !CollisionShapeType) return null

  const cube = new MeshInstance3D(`TestCube_${Date.now()}`)
  cube.createBoxMesh({ x: 1, y: 1, z: 1 })
  cube.position = { x, y, z }
  cube.castShadow = true

  // 添加物理体
  const physicsBody = new RigidBody3D(`${cube.name}_RigidBody`, {
    mode: RigidBodyMode.DYNAMIC,
    mass: 1.0,
    restitution: 0.5,
    friction: 0.7
  })

  cube.addChild(physicsBody)
  ;(cube as any).physicsBody = physicsBody

  // 添加碰撞形状
  const collisionShape = new CollisionShape3D(`${cube.name}_Collision`, {
    shapeType: CollisionShapeType.BOX,
    parameters: { size: { x: 1, y: 1, z: 1 } }
  })

  physicsBody.addChild(collisionShape)

  testCubes.push(cube)
  console.log(`✅ 创建测试立方体: ${cube.name}`)
  return cube
}

// 初始化物理测试场景
async function initPhysicsTest() {
  try {
    // 加载物理模块
    const loaded = await loadPhysicsModules()
    if (!loaded) {
      physicsStatus.value = '模块加载失败'
      return
    }

    // 初始化引擎
    engine = Engine.getInstance()
    await engine.initialize('physics-test-container')

    // 初始化物理服务器
    const physicsServer = PhysicsServer.getInstance()
    physicsServer.initialize({
      gravity: { x: 0, y: -9.82, z: 0 },
      solverIterations: 10,
      allowSleep: true,
      broadphase: 'sap'
    })

    // 设置全局可用
    if (typeof window !== 'undefined') {
      (window as any).PhysicsServer = PhysicsServer
    }

    physicsStatus.value = '已初始化'
    gravity.value = `(0, -9.82, 0)`

    // 创建场景
    scene = new Scene('PhysicsTestScene')
    const root = new Node3D('Root')
    scene.addChild(root)

    // 创建相机
    const camera = new Camera3D('MainCamera')
    camera.position = { x: 0, y: 5, z: 10 }
    camera.lookAt({ x: 0, y: 0, z: 0 })
    root.addChild(camera)

    // 创建地面
    const ground = new MeshInstance3D('Ground')
    ground.createPlaneMesh({ width: 20, height: 20 })
    ground.position = { x: 0, y: 0, z: 0 }
    ground.rotation = { x: -Math.PI / 2, y: 0, z: 0 }
    root.addChild(ground)

    // 为地面添加静态物理体
    const groundPhysics = new StaticBody3D('Ground_StaticBody')
    ground.addChild(groundPhysics)
    ;(ground as any).physicsBody = groundPhysics

    const groundCollision = new CollisionShape3D('Ground_Collision', {
      shapeType: CollisionShapeType.PLANE,
      parameters: {}
    })
    groundPhysics.addChild(groundCollision)

    // 创建初始测试立方体
    for (let i = 0; i < 3; i++) {
      const cube = await createTestCube(i * 2 - 2, 5 + i, 0)
      if (cube) {
        root.addChild(cube)
      }
    }

    // 启动场景
    await engine.setMainScene(scene)
    scene._enterTree()
    camera.setPerspective(45, 0.1, 1000)
    await engine.startPlayMode()

    // 创建轨道控制器
    try {
      const controls = camera.enableOrbitControls({ x: 0, y: 1, z: 0 })
      controls.minDistance = 5
      controls.maxDistance = 50
      controls.enableDamping = true
      controls.dampingFactor = 0.05
    } catch (error) {
      console.warn('轨道控制器创建失败:', error)
    }

    engine.switchTo3D()
    engine.startRendering()

    // 开始状态监控
    startStatusMonitoring()

    console.log('✅ 物理测试场景初始化完成')

  } catch (error) {
    console.error('❌ 物理测试初始化失败:', error)
    physicsStatus.value = '初始化失败'
  }
}

// 状态监控
function startStatusMonitoring() {
  const updateStatus = () => {
    if (PhysicsServer) {
      const physicsServer = PhysicsServer.getInstance()
      if (physicsServer) {
        bodyCount.value = physicsServer.bodyCount || 0
        physicsStatus.value = physicsServer.initialized ? '运行中' : '未初始化'
      }
    }
  }

  // 每秒更新状态
  setInterval(updateStatus, 1000)
  updateStatus()
}

// 重置物理体
function resetPhysics() {
  testCubes.forEach((cube, index) => {
    if ((cube as any).physicsBody) {
      const physicsBody = (cube as any).physicsBody
      physicsBody.setPosition({ x: index * 2 - 2, y: 5 + index, z: 0 })
      physicsBody.setVelocity({ x: 0, y: 0, z: 0 })
      physicsBody.setAngularVelocity({ x: 0, y: 0, z: 0 })
    }
  })
  console.log('🔄 物理体已重置')
}

// 添加测试立方体
async function addTestCube() {
  if (!scene) return

  const x = (Math.random() - 0.5) * 10
  const y = 8 + Math.random() * 5
  const z = (Math.random() - 0.5) * 10

  const cube = await createTestCube(x, y, z)
  if (cube) {
    const root = scene.getChild('Root')
    if (root) {
      root.addChild(cube)
      console.log(`✅ 添加新测试立方体: ${cube.name}`)
    }
  }
}

// 切换调试信息
function toggleDebug() {
  console.log('🔍 当前物理状态:')
  console.log('- 物理服务器状态:', physicsStatus.value)
  console.log('- 物理体数量:', bodyCount.value)
  console.log('- 重力:', gravity.value)
  console.log('- 测试立方体数量:', testCubes.length)
  
  testCubes.forEach((cube, index) => {
    if ((cube as any).physicsBody) {
      const physicsBody = (cube as any).physicsBody
      console.log(`- 立方体${index}:`, {
        position: cube.position,
        physicsPosition: physicsBody.position,
        velocity: physicsBody.getVelocity ? physicsBody.getVelocity() : 'N/A'
      })
    }
  })
}

// 组件生命周期
onMounted(() => {
  initPhysicsTest()
})

onUnmounted(() => {
  if (engine) {
    engine.destroy()
  }
})
</script>

<style scoped>
.physics-test {
  padding: 20px;
}

.controls {
  margin: 20px 0;
}

.controls button {
  margin-right: 10px;
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.controls button:hover {
  background: #0056b3;
}

.info {
  margin: 20px 0;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.info p {
  margin: 5px 0;
}
</style>
