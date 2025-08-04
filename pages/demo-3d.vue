<template>
  <div class="demo-container">
    <div class="demo-header">
      <NuxtLink to="/" class="back-button">
        ← 返回主页
      </NuxtLink>
      <h1>QAQ引擎 3D演示</h1>
      <div class="controls">
        <p>3D模型加载和渲染演示</p>
      </div>
    </div>

    <div class="game-container">
      <div id="game-canvas" ref="gameCanvas"></div>
    </div>

    <div class="demo-info">
      <div class="info-panel">
        <h3>演示功能</h3>
        <ul>
          <li>✓ 3D模型加载</li>
          <li>✓ 3D场景渲染</li>
          <li>✓ 光照和阴影</li>
          <li>✓ Camera3D轨道控制器</li>
          <li>✓ 动画循环播放与切换</li>
        </ul>
      </div>

      <div class="info-panel">
        <h3>相机控制</h3>
        <ul>
          <li><strong>左键拖拽</strong>: 旋转相机</li>
          <li><strong>右键拖拽</strong>: 平移视角</li>
          <li><strong>滚轮</strong>: 缩放距离</li>
        </ul>
      </div>

      <div class="info-panel">
        <h3>动画控制</h3>
        <p v-if="currentAnimationName">当前播放: <strong>{{ currentAnimationName }}</strong></p>
        <div class="control-buttons">
          <button @click="cycleAnimation()" class="test-btn">播放下一个动画</button>
        </div>
      </div>

      <div class="info-panel">
        <h3>场景内容</h3>
        <ul>
          <li>🎭 3D角色模型</li>
          <li>💡 方向光照</li>
          <li>📷 3D相机</li>
          <li>🌍 3D环境</li>
        </ul>
      </div>

      <div class="info-panel" v-if="loadingStatus">
        <h3>加载状态</h3>
        <p :class="{ 'loading': loadingStatus.includes('加载中'), 'success': loadingStatus.includes('成功'), 'error': loadingStatus.includes('失败') }">
          {{ loadingStatus }}
        </p>
      </div>

      <div class="info-panel">
        <h3>🔍 碰撞调试</h3>
        <div class="control-group">
          <label class="control-item">
            <input type="checkbox" v-model="collisionDebugEnabled" @change="toggleCollisionDebug">
            显示碰撞体
          </label>

          <div class="control-item" v-if="collisionDebugEnabled">
            <label>透明度: {{ collisionOpacity.toFixed(1) }}</label>
            <input type="range" min="0" max="1" step="0.1" v-model="collisionOpacity" @input="updateCollisionOpacity">
          </div>

          <div class="control-buttons" v-if="collisionDebugEnabled">
            <button @click="runCollisionTests" class="test-btn small">运行测试</button>
            <button @click="changeCollisionColors" class="test-btn small">更换颜色</button>
          </div>
        </div>
      </div>

      <div class="info-panel">
        <h3>🔄 动画同步</h3>
        <div class="control-group">
          <label class="control-item">
            <input type="checkbox" v-model="animationSyncEnabled" @change="toggleAnimationSync">
            启用动画同步
          </label>

          <div class="control-item" v-if="animationSyncEnabled">
            <label>同步策略:</label>
            <select v-model="syncStrategy" @change="updateSyncStrategy" class="sync-select">
              <option value="realtime">实时同步</option>
              <option value="keyframe">关键帧同步</option>
              <option value="threshold">阈值同步</option>
              <option value="manual">手动同步</option>
            </select>
          </div>

          <div class="control-item" v-if="animationSyncEnabled && syncStrategy === 'threshold'">
            <label>位置阈值: {{ positionThreshold.toFixed(3) }}</label>
            <input type="range" min="0.001" max="0.1" step="0.001" v-model="positionThreshold" @input="updateSyncThresholds">
          </div>

          <div class="control-buttons" v-if="animationSyncEnabled">
            <button @click="runAnimationSyncTests" class="test-btn small">同步测试</button>
          </div>
        </div>
      </div>

      <div class="info-panel">
        <h3>🎯 碰撞节点</h3>
        <div class="control-group">
          <div class="control-buttons">
            <button @click="runCollisionNodesTests" class="test-btn small">节点测试</button>
            <button @click="showCollisionStats" class="test-btn small">显示统计</button>
          </div>

          <div class="control-item">
            <label>角色控制器: {{ characterBody ? '已创建' : '未创建' }}</label>
          </div>

          <div class="control-item">
            <label>检测区域: {{ detectionArea ? '已创建' : '未创建' }}</label>
          </div>

          <div class="control-item">
            <label>碰撞管理器: {{ collisionManager ? '已启用' : '未启用' }}</label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Engine, Scene, Node3D, MeshInstance3D, Camera3D, DirectionalLight3D, ScriptManager, ScriptBase, AnimationPlayer } from '~/core'
import AnimationStateMachine from '~/core/nodes/animation/AnimationStateMachine'
import AnimationDebugger from '~/core/nodes/animation/AnimationDebugger'
// 简化的碰撞系统集成 - 移除复杂的异步加载
// 这些功能将在用户点击时动态加载
import { testCircularReferenceFix } from '~/core/editor/test-circular-reference-fix'
import { runSerializationFixTests } from '~/core/editor/test-serialization-fix'
import '~/core/editor/SceneManagementAPI'
import '~/core/editor/test-scene-management'
import '~/core/editor/test-export-fix'
import '~/core/editor/ProjectExportAPI'
import '~/core/editor/test-project-export'
import '~/core/resources/ResourceAPI'
import '~/core/resources/test-resource-system'
import { ref, onMounted, onUnmounted } from 'vue'
import { exportFullProject } from '~/core/editor/ProjectExportAPI'

// 设置页面标题
// useHead({
//   title: 'QAQ引擎 3D演示'
// })

const gameCanvas = ref<HTMLElement>()
const loadingStatus = ref<string>('准备初始化...')
const currentAnimationName = ref<string>('无')

// 碰撞调试相关变量
const collisionDebugEnabled = ref(true)
const collisionOpacity = ref(0.5)
const showStaticBodies = ref(true)
const showRigidBodies = ref(true)
const showAreas = ref(true)
const showCharacterBodies = ref(true)

// 动画同步相关变量
const animationSyncEnabled = ref(false)
const syncStrategy = ref<any>('threshold')
const syncUpdateFrequency = ref(30)
const positionThreshold = ref(0.01)
const rotationThreshold = ref(0.017)

// 全局变量
let character: MeshInstance3D | null = null
let engine: Engine | null = null
let animationSync: any = null
let characterCollisionShape: any = null
let characterBody: any = null
let detectionArea: any = null
let collisionManager: any = null

/**
 * 设置角色动画状态机
 */
function setupCharacterStateMachine(animationPlayer: AnimationPlayer): AnimationStateMachine {
  const stateMachine = new AnimationStateMachine('CharacterStateMachine')
  stateMachine.setAnimationPlayer(animationPlayer)
  stateMachine.setDebugEnabled(true)

  // 添加状态机参数
  stateMachine.addParameter('speed', 'float', 0)
  stateMachine.addParameter('isGrounded', 'bool', true)
  stateMachine.addParameter('attack', 'trigger', false)
  stateMachine.addParameter('jump', 'trigger', false)

  // 添加动画状态
  stateMachine.addState({
    name: 'Idle',
    animationName: 'Idle1',
    speed: 1.0,
    loop: true,
    onEnter: () => console.log('🧍 进入待机状态'),
    onExit: () => console.log('🚶 离开待机状态')
  })

  stateMachine.addState({
    name: 'Walk',
    animationName: 'Run_Base',
    speed: 1.0,
    loop: true,
    onEnter: () => console.log('🚶 进入行走状态'),
    onExit: () => console.log('🏃 离开行走状态')
  })

  stateMachine.addState({
    name: 'Run',
    animationName: 'Run_Base',
    speed: 1.5,
    loop: true,
    onEnter: () => console.log('🏃 进入奔跑状态'),
    onExit: () => console.log('🏃 离开奔跑状态')
  })

  stateMachine.addState({
    name: 'Attack1',
    animationName: 'Attack1',
    speed: 1.0,
    loop: false,
    onEnter: () => console.log('⚔️ 进入攻击状态'),
    onExit: () => console.log('⚔️ 离开攻击状态')
  })

  stateMachine.addState({
    name: 'Jump',
    animationName: 'Spell1',
    speed: 1.0,
    loop: false,
    onEnter: () => console.log('🦘 进入跳跃状态'),
    onExit: () => console.log('🦘 离开跳跃状态')
  })

  // 设置默认状态
  stateMachine.setDefaultState('Idle')

  // 添加状态转换
  // Idle -> Walk (速度 > 0.1)
  stateMachine.addTransition({
    id: 'idle_to_walk',
    fromState: 'Idle',
    toState: 'Walk',
    conditions: [{ parameter: 'speed', operator: '>', value: 0.1 }],
    hasExitTime: false,
    exitTime: 0,
    transitionDuration: 0.3,
    interruptible: true
  })

  // Walk -> Idle (速度 <= 0.1)
  stateMachine.addTransition({
    id: 'walk_to_idle',
    fromState: 'Walk',
    toState: 'Idle',
    conditions: [{ parameter: 'speed', operator: '<=', value: 0.1 }],
    hasExitTime: false,
    exitTime: 0,
    transitionDuration: 0.3,
    interruptible: true
  })

  // Walk -> Run (速度 > 5)
  stateMachine.addTransition({
    id: 'walk_to_run',
    fromState: 'Walk',
    toState: 'Run',
    conditions: [{ parameter: 'speed', operator: '>', value: 5 }],
    hasExitTime: false,
    exitTime: 0,
    transitionDuration: 0.2,
    interruptible: true
  })

  // Run -> Walk (速度 <= 5)
  stateMachine.addTransition({
    id: 'run_to_walk',
    fromState: 'Run',
    toState: 'Walk',
    conditions: [{ parameter: 'speed', operator: '<=', value: 5 }],
    hasExitTime: false,
    exitTime: 0,
    transitionDuration: 0.2,
    interruptible: true
  })

  // Any -> Attack (攻击触发器)
  for (const fromState of ['Idle', 'Walk', 'Run']) {
    stateMachine.addTransition({
      id: `${fromState.toLowerCase()}_to_attack`,
      fromState,
      toState: 'Attack',
      conditions: [{ parameter: 'attack', operator: '==', value: true }],
      hasExitTime: false,
      exitTime: 0,
      transitionDuration: 0.1,
      interruptible: false
    })
  }

  // Attack -> Idle (攻击结束)
  stateMachine.addTransition({
    id: 'attack_to_idle',
    fromState: 'Attack',
    toState: 'Idle',
    conditions: [], // 无条件，依赖退出时间
    hasExitTime: true,
    exitTime: 0.8, // 动画播放80%后自动退出
    transitionDuration: 0.2,
    interruptible: false
  })

  // Any -> Jump (跳跃触发器)
  for (const fromState of ['Idle', 'Walk', 'Run']) {
    stateMachine.addTransition({
      id: `${fromState.toLowerCase()}_to_jump`,
      fromState,
      toState: 'Jump',
      conditions: [
        { parameter: 'jump', operator: '==', value: true },
        { parameter: 'isGrounded', operator: '==', value: true }
      ],
      hasExitTime: false,
      exitTime: 0,
      transitionDuration: 0.15,
      interruptible: false
    })
  }

  // Jump -> Idle (跳跃结束)
  stateMachine.addTransition({
    id: 'jump_to_idle',
    fromState: 'Jump',
    toState: 'Idle',
    conditions: [{ parameter: 'isGrounded', operator: '==', value: true }],
    hasExitTime: true,
    exitTime: 0.9,
    transitionDuration: 0.2,
    interruptible: true
  })

  // 启动状态机
  stateMachine.start()

  return stateMachine
}

// 动画控制脚本
class AnimationCycler extends ScriptBase {
  private player: AnimationPlayer | null = null
  private animationNames: string[] = []
  private currentIndex: number = -1

  override _ready(): void {
    this.player = this.node.findChild('AnimationPlayer') as AnimationPlayer
	 
    if (this.player) {
      this.animationNames = this.player.getAnimationList()
      if (this.animationNames.length > 0) {
        this.cycle()
      }
    }
  }
  
  override _process() {
  }

  public cycle(): void {
    if (!this.player || this.animationNames.length === 0) return

    this.currentIndex = (this.currentIndex + 1) % this.animationNames.length
    const nextAnimation = this.animationNames[this.currentIndex]
    console.log(this.player.play,' =====>>> nextAnimation')
    console.log(nextAnimation,' =====>>> nextAnimation')
    this.player.play(nextAnimation)
    currentAnimationName.value = nextAnimation
  }
}

const cycleAnimation = () => {
  if (character) {
    const scriptInstance = character.getScriptInstances().find(s => s.instance instanceof AnimationCycler)
    if (scriptInstance) {
      (scriptInstance.instance as AnimationCycler).cycle()
    }
  }
}

// 碰撞调试控制方法
const toggleCollisionDebug = async () => {
  try {
    const { default: CollisionDebugRenderer } = await import('~/core/collision/CollisionDebugRenderer')
    const debugRenderer = CollisionDebugRenderer.getInstance()
    debugRenderer.setEnabled(collisionDebugEnabled.value)
    console.log(`🔍 碰撞调试: ${collisionDebugEnabled.value ? '开启' : '关闭'}`)
  } catch (error) {
    console.error('❌ 加载碰撞调试渲染器失败:', error)
  }
}

const updateCollisionOpacity = async () => {
  try {
    const { default: CollisionDebugRenderer } = await import('~/core/collision/CollisionDebugRenderer')
    const debugRenderer = CollisionDebugRenderer.getInstance()
    debugRenderer.setGlobalOpacity(collisionOpacity.value)
    console.log(`🎨 碰撞透明度: ${collisionOpacity.value}`)
  } catch (error) {
    console.error('❌ 加载碰撞调试渲染器失败:', error)
  }
}

const changeCollisionColors = () => {
  console.log('🌈 更换碰撞颜色功能待实现')
}

const runCollisionTests = async () => {
  try {
    const { runAllCollisionDebugTests } = await import('~/core/collision/test-collision-debug-renderer')
    console.log('🧪 开始运行碰撞系统测试...')
    runAllCollisionDebugTests()
  } catch (error) {
    console.error('❌ 加载碰撞测试函数失败:', error)
  }
}

// 动画同步控制方法
const toggleAnimationSync = () => {
  if (!animationSync || !character) {
    console.warn('⚠️ 动画同步系统未初始化')
    return
  }

  if (animationSyncEnabled.value) {
    animationSync.startSync()
    console.log('🔄 动画碰撞同步已启用')
  } else {
    animationSync.stopSync()
    console.log('⏹️ 动画碰撞同步已禁用')
  }
}

const updateSyncStrategy = () => {
  if (animationSync) {
    animationSync.updateConfig({ strategy: syncStrategy.value })
    console.log(`⚙️ 同步策略已更新为: ${syncStrategy.value}`)
  }
}

const updateSyncThresholds = () => {
  if (animationSync) {
    animationSync.updateConfig({
      thresholds: {
        position: positionThreshold.value,
        rotation: rotationThreshold.value,
        scale: 0.01
      }
    })
    console.log(`🎯 同步阈值已更新`)
  }
}

const runAnimationSyncTests = async () => {
  try {
    const { runAllAnimationCollisionTests } = await import('~/core/collision/test-animation-collision-sync')
    console.log('🧪 开始运行动画同步测试...')
    runAllAnimationCollisionTests()
  } catch (error) {
    console.error('❌ 加载动画同步测试函数失败:', error)
  }
}

// 碰撞节点控制方法
const runCollisionNodesTests = async () => {
  try {
    const { runAllCollisionNodesTests } = await import('~/core/collision/test-collision-nodes')
    console.log('🧪 开始运行碰撞节点测试...')
    runAllCollisionNodesTests()
  } catch (error) {
    console.error('❌ 加载碰撞节点测试函数失败:', error)
  }
}

const showCollisionStats = () => {
  if (collisionManager) {
    const stats = collisionManager.getStats()
    console.log('📊 碰撞管理器统计:', stats)
  }

  if (characterBody) {
    const bodyStats = characterBody.getStats()
    console.log('🏃 角色控制器统计:', bodyStats)
  }

  if (detectionArea) {
    const areaStats = detectionArea.getStats()
    console.log('🎯 检测区域统计:', areaStats)
  }
}

onMounted(async () => {
  if (!gameCanvas.value) return

  try {
    console.log('🌐 初始化3D演示...')
    loadingStatus.value = '初始化引擎中...'

    const engine = Engine.getInstance()
    await engine.initialize({
      container: gameCanvas.value,
      width: 800,
      height: 600,
      antialias: true,
      enableShadows: true,
      backgroundColor: 0x87ceeb
    })

    console.log('✅ 引擎初始化完成')

    // 碰撞系统将在需要时动态加载
    console.log('� 碰撞系统将在使用时动态加载')

    loadingStatus.value = '注册脚本类中...'

    const scriptManager = ScriptManager.getInstance()
    scriptManager.registerScriptClass('AnimationCycler', AnimationCycler, './scripts/AnimationCycler.ts')

    // 注册更多测试脚本类（模拟）
    scriptManager.registerScriptClass('TestScript1', AnimationCycler, './scripts/TestScript1.ts')
    scriptManager.registerScriptClass('TestScript2', AnimationCycler, './scripts/TestScript2.ts')

    const scene = new Scene('Demo3DScene')

    // 创建多个测试场景并设置为全局变量以便ProjectExporter能够找到
    const scene1 = new Scene('test1')
    const scene2 = new Scene('test2')
    const scene3 = new Scene('test3')
    const scene4 = new Scene('test4')

    // 为测试场景添加一些子节点和模拟资源路径
    const node1Child1 = new Node3D('Node1_Child1')
    ;(node1Child1 as any).modelPath = './assets/models/character.gltf'
    ;(node1Child1 as any).texturePath = './assets/textures/character_diffuse.jpg'
    scene1.addChild(node1Child1)

    // 为节点附加脚本
    scriptManager.attachScriptToNode(node1Child1, 'AnimationCycler')
    scriptManager.attachScriptToNode(node1Child1, 'TestScript1')

    scene1.addChild(new Camera3D('Node1_Camera'))

    const node2Child1 = new Node3D('Node2_Child1')
    ;(node2Child1 as any).modelPath = './assets/models/environment.gltf'
    ;(node2Child1 as any).audioPath = './assets/audio/ambient.mp3'
    scene2.addChild(node2Child1)

    // 为node2Child1附加脚本
    scriptManager.attachScriptToNode(node2Child1, 'TestScript2')

    const node2Child2 = new Node3D('Node2_Child2')
    ;(node2Child2 as any).texturePath = './assets/textures/grass.jpg'
    scene2.addChild(node2Child2)

    // 为node2Child2附加脚本
    scriptManager.attachScriptToNode(node2Child2, 'AnimationCycler')

    scene2.addChild(new DirectionalLight3D('Node2_Light'))

    scene3.addChild(new Node3D('Node3_Root'))
    const scene3Root = scene3.children[0] as Node3D
    const nested1 = new Node3D('Node3_Nested1')
    ;(nested1 as any).modelPath = './assets/models/props/barrel.gltf'
    scene3Root.addChild(nested1)

    const nested2 = new Node3D('Node3_Nested2')
    ;(nested2 as any).texturePath = './assets/textures/wood.jpg'
    ;(nested2 as any).audioPath = './assets/audio/footsteps.wav'
    scene3Root.addChild(nested2)

    // 设置主场景为当前场景
    ;(window as any).currentScene = scene

    // 添加一些全局资源变量用于测试资源扫描
    ;(window as any).models = {
      character: './assets/models/character.gltf',
      environment: './assets/models/environment.gltf',
      weapon: './assets/models/sword.gltf'
    }

    ;(window as any).textures = {
      grass: './assets/textures/grass.jpg',
      stone: './assets/textures/stone.jpg',
      water: './assets/textures/water.png'
    }

    ;(window as any).audio = {
      bgm: './assets/audio/background_music.mp3',
      sfx: './assets/audio/sound_effects.wav',
      voice: './assets/audio/narrator.ogg'
    }
    
    const root = new Node3D('Root')
    scene.addChild(root)

    loadingStatus.value = '创建3D相机中...'

    const camera = new Camera3D('MainCamera')
    root.addChild(camera)
    camera.position = { x: 0, y: 2, z: 10 }
    camera.lookAt({ x: 0, y: 1, z: 0 })
    camera.makeCurrent()
    engine.setCurrentCamera(camera)

    loadingStatus.value = '设置光照系统中...'

    const sunLight = new DirectionalLight3D('SunLight')
    sunLight.position = { x: 5, y: 10, z: 5 }
    sunLight.setTarget({ x: 0, y: 0, z: 0 })
    sunLight.enableShadows()
    root.addChild(sunLight)

    loadingStatus.value = '创建地面中...'

    const ground = new MeshInstance3D('Ground')
    ground.createPlaneMesh({ x: 20, y: 20 })
    ground.rotation = { x: -Math.PI / 2, y: 0, z: 0 }
    ground.receiveShadow = true
    root.addChild(ground)

    loadingStatus.value = '加载3D模型中...'

    character = new MeshInstance3D('Character')
    character.position = { x: 0, y: 0, z: 0 }
    character.castShadow = true
    root.addChild(character)

    // 碰撞系统组件将在需要时动态创建
    console.log('💡 角色碰撞组件将在启用碰撞调试时创建')

    // 检测区域将在需要时动态创建
    console.log('💡 检测区域将在启用碰撞节点功能时创建')

    try {
      // 使用MeshInstance3D的loadModel方法（内部使用增强的GLTF加载器）
      const result = await character.loadModel('/leikedun.glb')

      console.log('✅ 3D模型加载完成', result)

      // 获取GLTF资源信息（如果是GLTF文件）
      const gltfResource = character.getGLTFResource()
      if (gltfResource) {
        console.log(`📊 GLTF资源统计: 动画${gltfResource.animations.length}个, 材质${gltfResource.materials.length}个, 纹理${gltfResource.textures.length}个`)
        console.log(`🎬 发现动画:`, character.getAnimationNames())
      }

      // 设置模型缩放
      character.scale = { x: 0.01, y: 0.01, z: 0.01 }

      loadingStatus.value = '3D模型加载成功！'

      // 设置增强的动画播放器
      const animationPlayer = new AnimationPlayer()
      character.addChild(animationPlayer as any)
      animationPlayer.setTargetModel(character)

      // 动画碰撞同步系统将在需要时动态创建
      console.log('� 动画碰撞同步系统将在启用同步功能时创建')

      // 配置智能过渡
      animationPlayer.setGlobalTransitionTime(0.3) // 默认0.3秒过渡
      animationPlayer.setIntelligentTransitionsEnabled(true)

      // 设置动画状态机
      const stateMachine = setupCharacterStateMachine(animationPlayer)

      // 将状态机添加为角色的子节点，这样它就能参与游戏循环
      character.addChild(stateMachine as any)

      // 设置调试器
      const animDebugger = new AnimationDebugger()
      animDebugger.setAnimationPlayer(animationPlayer)
      animDebugger.setStateMachine(stateMachine)

      // 将所有工具存储到全局，方便调试和控制
      ;(window as any).animationPlayer = animationPlayer
      ;(window as any).stateMachine = stateMachine
      ;(window as any).animationDebugger = animDebugger
      ;(window as any).currentScene = scene

      // 自动显示调试面板
      setTimeout(() => {
        animDebugger.show()
      }, 1000)

      console.log('🎭 动画系统设置完成')
      console.log('🎮 可用控制命令:')
      console.log('  - window.stateMachine.setParameter("speed", 5) // 设置移动速度')
      console.log('  - window.stateMachine.setTrigger("attack") // 触发攻击')
      console.log('  - window.stateMachine.setTrigger("jump") // 触发跳跃')
      console.log('  - window.animationPlayer.setGlobalTransitionTime(0.5) // 调整过渡时间')
      console.log('  - window.animationDebugger.toggle() // 切换调试面板')
      console.log('  - 按 Ctrl+Shift+D 切换调试面板')

      // 测试Node反射序列化（修复循环引用）
      setTimeout(() => {
        console.log('🧪 开始Node反射序列化测试...')

        // 先运行导出修复测试
        if (typeof (window as any).runAllExportFixTests === 'function') {
          console.log('\n🔧 运行导出修复测试...')
          ;(window as any).runAllExportFixTests()
        }

        // 再运行修复验证测试
        setTimeout(() => {
          runSerializationFixTests()
        }, 1000)

        // 最后测试复杂场景的循环引用修复
        setTimeout(() => {
          console.log('\n🔄 运行循环引用修复测试...')
          testCircularReferenceFix()
        }, 3000)

      }, 2000)

   

      // 使用 ScriptManager 附加脚本
      scriptManager.attachScriptToNode(character, 'AnimationCycler')
      console.log(character, ' =====>>> character')

    } catch (error) {
      console.error('❌ 3D模型加载失败:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      loadingStatus.value = `模型加载失败: ${errorMessage}`

      // 创建一个简单的立方体作为备用
      character.createBoxMesh()
      console.log('🔄 使用备用立方体模型')
    }

    

    loadingStatus.value = '启动3D渲染中...'

    await engine.setMainScene(scene)


    scene._enterTree()
    camera.setPerspective(45, 0.1, 1000)
    await engine.startPlayMode()

    const controls = camera.enableOrbitControls({ x: 0, y: 1, z: 0 })
    controls.minDistance = 5
    controls.maxDistance = 50

    engine.switchTo3D()
    engine.startRendering()
    // await engine.startPlayMode() // startPlayMode 只需要调用一次

    console.log('🎉 3D演示启动成功！')
    loadingStatus.value = '3D演示运行中'

    setTimeout(() => { loadingStatus.value = '' }, 3000)

    // 初始化项目导出系统测试
    setTimeout(() => {
      console.log('🏭 初始化项目导出系统...')

      // 设置当前场景引用
      ;(window as any).currentScene = scene

      // 直接导出项目并打印对象
      setTimeout(async () => {
        console.log('\n📦 开始导出当前项目...')

        try {
            await exportFullProject({
              fileName: 'demo_project_export.json',
              includeResources: true,
              includeEditorState: true,
              includeUserConfig: true,
              validation: true,
              onProgress: (progress: number, message: string) => {
                console.log(`导出进度: ${progress}% - ${message}`)
              },
              onError: (error: any) => {
                console.error('导出错误:', error)
              },
              onComplete: (result: any) => {
                console.log('\n🎉 项目导出完成!')
                console.log('📊 导出结果对象:', result)

                // 打印导出的项目数据对象结构
                if (result.success) {
                  console.log('\n📋 导出数据结构预览:')
                  console.log('- metadata:', result.metadata)
                  console.log('- 文件大小:', (result.fileSize / 1024).toFixed(2) + ' KB')
                  console.log('- 导出耗时:', result.exportTime.toFixed(2) + ' ms')

                  if (result.warnings && result.warnings.length > 0) {
                    console.warn('⚠️ 警告:', result.warnings)
                  }
                }
              }
            })
        
        } catch (error) {
          console.error('❌ 项目导出失败:', error)
        }
      }, 2000)

      // // 运行资源系统测试
      // if (typeof (window as any).runAllResourceSystemTests === 'function') {
      //   setTimeout(() => {
      //     console.log('\n🗂️ 运行资源管理系统测试...')
      //     ;(window as any).runAllResourceSystemTests()
      //   }, 2000)
      // }

      // // 显示资源管理帮助
      // if (typeof (window as any).showResourceManagementHelp === 'function') {
      //   setTimeout(() => {
      //     console.log('\n💡 资源管理系统帮助:')
      //     ;(window as any).showResourceManagementHelp()
      //   }, 3000)
      // }

      // // 显示项目导出帮助
      // if (typeof (window as any).showProjectExportHelp === 'function') {
      //   setTimeout(() => {
      //     console.log('\n💡 项目导出系统帮助:')
      //     ;(window as any).showProjectExportHelp()
      //   }, 4000)
      // }

      console.log('✅ 项目导出系统初始化完成')

    }, 5000)

  } catch (error) {
    console.error('❌ 3D演示初始化失败:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    loadingStatus.value = `初始化失败: ${errorMessage}`
  }
})

onUnmounted(() => {
  try {
    const engine = Engine.getInstance()
    engine.stopRendering()
    engine.destroy()
    console.log('🧹 3D演示清理完成')
  } catch (error) {
    console.error('❌ 3D演示清理失败:', error)
  }
})
</script>

<style scoped>
.demo-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  color: #ffffff;
  padding: 1rem;
  font-family: 'Arial', sans-serif;
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 0 1rem;
}

.back-button {
  color: #22c55e;
  text-decoration: none;
  font-size: 1.1rem;
  transition: color 0.3s ease;
}

.back-button:hover {
  color: #4ade80;
}

.demo-header h1 {
  font-size: 2rem;
  font-weight: bold;
  background: linear-gradient(45deg, #22c55e, #4ade80);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.controls p {
  color: #a0a0a0;
  margin: 0;
  font-size: 1rem;
}

.game-container {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

#game-canvas {
  border: 2px solid #22c55e;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.3);
}

.demo-info {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.info-panel {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  padding: 1.5rem;
  min-width: 200px;
  backdrop-filter: blur(10px);
}

.info-panel h3 {
  color: #22c55e;
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.info-panel ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.info-panel li {
  color: #c0c0c0;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.info-panel p {
  margin: 0;
  padding: 0.5rem;
  border-radius: 4px;
  font-weight: bold;
}

.info-panel p.loading {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.info-panel p.success {
  background: rgba(40, 167, 69, 0.2);
  color: #28a745;
}

.info-panel p.error {
  background: rgba(220, 53, 69, 0.2);
  color: #dc3545;
}

.control-buttons {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.test-btn {
  padding: 8px 12px;
  background: rgba(52, 152, 219, 0.2);
  border: 1px solid rgba(52, 152, 219, 0.5);
  border-radius: 4px;
  color: #3498db;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.test-btn:hover {
  background: rgba(52, 152, 219, 0.3);
  border-color: rgba(52, 152, 219, 0.7);
}

.test-btn:active {
  transform: translateY(1px);
}

.test-btn.small {
  padding: 4px 8px;
  font-size: 10px;
}

/* 碰撞调试控制样式 */
.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.control-item input[type="checkbox"] {
  accent-color: #3498db;
}

.control-item input[type="range"] {
  flex: 1;
  accent-color: #3498db;
}

.control-item label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 11px;
  min-width: 60px;
}

/* 动画同步控制样式 */
.sync-select {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: white;
  padding: 2px 6px;
  font-size: 11px;
  flex: 1;
}

.sync-select:focus {
  outline: none;
  border-color: #3498db;
  background: rgba(255, 255, 255, 0.15);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .demo-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .demo-header h1 {
    font-size: 1.5rem;
  }

  #game-canvas {
    max-width: 100%;
    height: auto;
  }

  .demo-info {
    flex-direction: column;
    align-items: center;
  }

  .info-panel {
    width: 100%;
    max-width: 300px;
  }
}
</style>
