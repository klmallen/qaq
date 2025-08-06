<template>
  <div class="demo-container">
    <div class="game-container" ref="gameContainer">
      <!-- 游戏画布将在这里渲染 -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Engine from '~/core/engine/Engine'
import { Scene } from '~/core/scene/Scene'
import Camera3D from '~/core/nodes/3d/Camera3D'
import MeshInstance3D from '~/core/nodes/MeshInstance3D'
import DirectionalLight3D from '~/core/nodes/lights/DirectionalLight3D'

const gameContainer = ref<HTMLElement>()

// 游戏对象
let engine: Engine
let scene: Scene
let camera: Camera3D
let cubeA: MeshInstance3D
let cubeB: MeshInstance3D

// 物理系统模块
let PhysicsServer: any = null
let RigidBody3D: any = null
let StaticBody3D: any = null
let RigidBodyMode: any = null
let CollisionShapeType: any = null

// 加载物理系统模块
async function loadPhysicsModules() {
  if (PhysicsServer) return

  try {
    const [physicsServerModule, rigidBodyModule, staticBodyModule] = await Promise.all([
      import('~/core/physics/PhysicsServer'),
      import('~/core/nodes/physics/RigidBody3D'),
      import('~/core/nodes/physics/StaticBody3D')
    ])

    PhysicsServer = physicsServerModule.default
    RigidBody3D = rigidBodyModule.default
    StaticBody3D = staticBodyModule.default
    RigidBodyMode = rigidBodyModule.RigidBodyMode
    CollisionShapeType = physicsServerModule.CollisionShapeType
  } catch (error) {
    console.error('物理系统加载失败:', error)
  }
}

// 添加物理体
async function addPhysicsBody(object: MeshInstance3D, bodyType: 'dynamic' | 'static', mass: number = 1.0) {
  await loadPhysicsModules()

  let physicsBody: any

  if (bodyType === 'static') {
    physicsBody = new StaticBody3D(`${object.name}_StaticBody`)
  } else {
    physicsBody = new RigidBody3D(`${object.name}_RigidBody`, {
      mode: RigidBodyMode.DYNAMIC,
      mass: mass,
      restitution: 0.3,
      friction: 0.7
    })
  }

  // 设置初始位置
  if (object.position) {
    physicsBody.position = { ...object.position }
  }

  object.addChild(physicsBody)
  ;(object as any).physicsBody = physicsBody

  return physicsBody
}

// 添加碰撞形状
async function addCollisionShape(physicsBody: any, shapeType: any, parameters: any) {
  if (!physicsBody) return

  switch (shapeType) {
    case CollisionShapeType?.BOX:
      const boxSize = parameters.size || { x: 1, y: 1, z: 1 }
      physicsBody.addBoxShape(boxSize)
      break
    case CollisionShapeType?.PLANE:
      physicsBody.addPlaneShape()
      break
  }
}

// 初始化3D演示
async function init3DDemo() {
  if (!gameContainer.value) return

  try {
    // 创建引擎
    engine = Engine.getInstance()
    await engine.initialize({ container: gameContainer.value })

    // 创建场景
    scene = new Scene('Demo3DScene')

    // 创建相机
    camera = new Camera3D('MainCamera')
    camera.position = { x: 0, y: 5, z: 10 }
    scene.addChild(camera)

    // 创建轨道控制器
    camera.enableOrbitControls({ x: 0, y: 0, z: 0 })

    // 创建光源
    const sunLight = new DirectionalLight3D('SunLight')
    sunLight.color = 0xffffff
    sunLight.intensity = 1.0
    sunLight.position = { x: 5, y: 10, z: 5 }
    sunLight.enableShadows()
    scene.addChild(sunLight)

    // 初始化物理系统
    await loadPhysicsModules()
    if (PhysicsServer) {
      const physicsServer = PhysicsServer.getInstance()

      if (!physicsServer.initialized) {
        physicsServer.initialize({
          gravity: { x: 0, y: -9.82, z: 0 },
          solverIterations: 10,
          allowSleep: true,
          broadphase: 'sap'
        })

        // 设置为全局可用
        if (typeof window !== 'undefined') {
          (window as any).PhysicsServer = PhysicsServer
        }
      }

      // 创建地面
      const ground = new MeshInstance3D('Ground')
      ground.createPlaneMesh({ x: 20, y: 20 })
      ground.rotation = { x: -Math.PI / 2, y: 0, z: 0 }
      ground.position = { x: 0, y: -2, z: 0 }  // 🔧 修复：与物理体位置一致
      ground.receiveShadow = true
      scene.addChild(ground)

      // 地面物理体
      const groundPhysicsBody = await addPhysicsBody(ground, 'static')
      // if (groundPhysicsBody) {
      //   await addCollisionShape(groundPhysicsBody, CollisionShapeType?.PLANE, {})

      //   // 设置地面物理体位置和旋转
      //   const cannonBody = groundPhysicsBody._physicsBody
      //   if (cannonBody) {
      //     cannonBody.position.set(0, -2, 0)
      //     const CANNON = (window as any).CANNON
      //     if (CANNON) {
      //       cannonBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
      //     }
      //   }
      // }

      // 创建立方体A
      cubeA = new MeshInstance3D('CubeA')
      cubeA.createBoxMesh({ x: 1, y: 1, z: 1 })
      cubeA.position = { x: -3, y: 5, z: 0 }
      cubeA.castShadow = true
      scene.addChild(cubeA)

      const cubeAPhysicsBody = await addPhysicsBody(cubeA, 'dynamic', 5)
      if (cubeAPhysicsBody) {
        await addCollisionShape(cubeAPhysicsBody, CollisionShapeType?.BOX, { size: { x: 1, y: 1, z: 1 } })
      }

      // // 创建立方体B
      // cubeB = new MeshInstance3D('CubeB')
      // cubeB.createBoxMesh({ x: 1, y: 1, z: 1 })
      // cubeB.position = { x: 3, y: 8, z: 0 }
      // cubeB.castShadow = true
      // scene.addChild(cubeB)

      // const cubeBPhysicsBody = await addPhysicsBody(cubeB, 'dynamic', 3)
      // if (cubeBPhysicsBody) {
      //   await addCollisionShape(cubeBPhysicsBody, CollisionShapeType?.BOX, { size: { x: 1, y: 1, z: 1 } })
      // }
    }

    // 启动场景
    await engine.setMainScene(scene)
    scene._enterTree()
    camera.setPerspective(45, 0.1, 1000)
    await engine.startPlayMode()

  } catch (error) {
    console.error('初始化失败:', error)
  }
}

onMounted(() => {
  init3DDemo()
})

onUnmounted(() => {
  if (engine) {
    engine.destroy()
  }
})
</script>

<style scoped>
.demo-container {
  min-height: 100vh;
  background: #1a1a1a;
  padding: 0;
  margin: 0;
}

.game-container {
  width: 100%;
  height: 100vh;
  position: relative;
}
</style>