<template>
  <div class="script-system-demo">
    <h1>QAQ引擎脚本系统演示</h1>

    <div class="demo-info">
      <h3>🎯 脚本系统特性：</h3>
      <ul>
        <li>✨ <strong>类型安全</strong>：基于TypeScript的脚本基类</li>
        <li>🔄 <strong>生命周期管理</strong>：_ready(), _process(), _exit_tree()等标准方法</li>
        <li>🎮 <strong>游戏模式检测</strong>：只在播放模式下执行脚本</li>
        <li>🏗️ <strong>继承架构</strong>：所有脚本必须继承ScriptBase基类</li>
        <li>🔗 <strong>Node访问</strong>：通过this访问挂载的Node实例</li>
        <li>📝 <strong>便捷API</strong>：内置print(), randf(), getNode()等工具方法</li>
      </ul>
    </div>

    <div class="demo-status">
      <p v-if="isLoading">正在初始化脚本系统...</p>
      <p v-else-if="error" class="error">错误: {{ error }}</p>
      <p v-else-if="engineReady" class="success">脚本系统已就绪！当前模式: {{ currentGameMode }}</p>
      <p v-else class="info">点击按钮开始体验脚本系统</p>
    </div>

    <div class="demo-controls">
      <button @click="initializeDemo" :disabled="isLoading" class="init-btn">
        {{ isLoading ? '初始化中...' : '初始化脚本系统' }}
      </button>

      <div v-if="engineReady" class="game-mode-controls">
        <button @click="startPlayMode" :disabled="currentGameMode === 'play'" class="play-btn">
          ▶️ 开始播放
        </button>
        <button @click="pausePlayMode" :disabled="currentGameMode !== 'play'" class="pause-btn">
          ⏸️ 暂停
        </button>
        <button @click="stopPlayMode" :disabled="currentGameMode === 'editor'" class="stop-btn">
          ⏹️ 停止
        </button>
      </div>
    </div>

    <!-- 游戏画布 -->
    <div class="demo-canvas">
      <div id="script-demo-canvas"></div>
    </div>

    <!-- 脚本信息面板 -->
    <div v-if="engineReady" class="script-info-panel">
      <h3>📋 脚本信息</h3>
      <div class="script-stats">
        <p><strong>注册的脚本类:</strong> {{ registeredScripts.length }}</p>
        <p><strong>活动脚本实例:</strong> {{ scriptStats.activeScripts }}</p>
        <p><strong>本帧处理的脚本:</strong> {{ scriptStats.processedThisFrame }}</p>
        <p><strong>当前游戏模式:</strong> {{ currentGameMode }}</p>
      </div>

      <div class="script-list">
        <h4>🎭 示例脚本类:</h4>
        <div v-for="script in registeredScripts" :key="script" class="script-item">
          <strong>{{ script }}</strong>
          <p>{{ getScriptDescription(script) }}</p>
        </div>
      </div>
    </div>

    <!-- 操作日志 -->
    <div class="demo-logs">
      <h3>📝 操作日志</h3>
      <div class="log-container">
        <div v-for="(log, index) in logs" :key="index" class="log-entry">
          {{ log }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 响应式数据
const isLoading = ref(false)
const error = ref('')
const engineReady = ref(false)
const logs = ref<string[]>([])
const currentGameMode = ref('editor')
const registeredScripts = ref<string[]>([])
const scriptStats = ref({
  activeScripts: 0,
  processedThisFrame: 0,
  totalScripts: 0
})

// 引擎和脚本管理器引用
let engine: any = null
let scriptManager: any = null
let statsUpdateInterval: number | null = null

// 添加日志
const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  logs.value.push(`[${timestamp}] ${message}`)

  // 限制日志数量
  if (logs.value.length > 50) {
    logs.value.shift()
  }
}

// 获取脚本描述
const getScriptDescription = (scriptName: string): string => {
  const descriptions: Record<string, string> = {
    'RotatingSprite': '旋转精灵脚本 - 提供旋转和缩放动画效果',
    'MovingCharacter': '移动角色脚本 - 在场景中自动移动并处理边界反弹',
    'InteractiveButton': '交互式按钮脚本 - 提供悬停、点击等交互效果'
  }
  return descriptions[scriptName] || '未知脚本'
}

// 初始化演示
const initializeDemo = async () => {
  isLoading.value = true
  error.value = ''
  addLog('开始初始化脚本系统演示...')

  try {
    // 动态导入所需模块
    const [
      { default: Engine },
      { default: ScriptManager },
      { registerDemoScripts, getAvailableScripts }
    ] = await Promise.all([
      import('../../core/engine/Engine'),
      import('../../core/script/ScriptManager'),
      import('./scripts/ScriptRegistry')
    ])

    addLog('核心模块导入成功')

    // 获取引擎实例
    engine = Engine.getInstance()
    scriptManager = ScriptManager.getInstance()

    // 获取容器
    const container = document.getElementById('script-demo-canvas')
    if (!container) {
      throw new Error('找不到画布容器')
    }

    // 初始化引擎
    const success = await engine.initialize({
      container: container,
      width: 800,
      height: 600,
      antialias: true,
      enableShadows: false
    })

    if (!success) {
      throw new Error('引擎初始化失败')
    }

    addLog('引擎初始化成功')

    // 注册示例脚本
    registerDemoScripts()
    registeredScripts.value = getAvailableScripts()
    addLog(`注册了 ${registeredScripts.value.length} 个示例脚本类`)

    // 切换到2D模式
    engine.switchTo2D()
    addLog('切换到2D渲染模式')

    // 启动渲染循环
    engine.startRendering()
    addLog('渲染循环已启动')

    // 创建演示场景和节点
    await createDemoScene()

    // 获取当前游戏模式
    currentGameMode.value = await engine.getCurrentGameMode()
    addLog(`当前游戏模式: ${currentGameMode.value}`)

    // 开始统计更新
    startStatsUpdate()

    engineReady.value = true
    addLog('脚本系统演示初始化完成！')

  } catch (err) {
    error.value = err instanceof Error ? err.message : '未知错误'
    addLog(`初始化失败: ${error.value}`)
  } finally {
    isLoading.value = false
  }
}

// 创建演示场景
const createDemoScene = async () => {
  addLog('开始创建演示场景...')

  // 动态导入节点类
  const [
    { default: Scene },
    { default: Node2D },
    { default: Sprite2D },
    { default: Button2D }
  ] = await Promise.all([
    import('../../core/scene/Scene'),
    import('../../core/nodes/Node2D'),
    import('../../core/nodes/2d/Sprite2D'),
    import('../../core/nodes/2d/Button2D')
  ])

  // 创建场景
  const scene = new Scene('ScriptDemoScene', {
    type: 'MAIN',
    persistent: false,
    autoStart: true
  })

  const rootNode = new Node2D('Root2D')
  scene.addChild(rootNode)

  // 创建旋转精灵（使用新脚本系统）
  const rotatingSprite = new Sprite2D('RotatingSprite')
  rotatingSprite.position = { x: -200, y: 0, z: 0 }
  rotatingSprite.attachScript('RotatingSprite')
  rootNode.addChild(rotatingSprite)
  addLog('创建旋转精灵，附加RotatingSprite脚本')

  // 创建移动角色
  const movingCharacter = new Sprite2D('MovingCharacter')
  movingCharacter.position = { x: 0, y: 0, z: 0 }
  movingCharacter.attachScript('MovingCharacter')
  rootNode.addChild(movingCharacter)
  addLog('创建移动角色，附加MovingCharacter脚本')

  // 创建交互式按钮
  const interactiveButton = new Button2D('InteractiveButton', {
    text: '交互按钮',
    width: 120,
    height: 40
  })
  interactiveButton.position = { x: 200, y: 100, z: 0 }
  interactiveButton.attachScript('InteractiveButton')
  rootNode.addChild(interactiveButton)
  addLog('创建交互式按钮，附加InteractiveButton脚本')

  // 创建2D位置测试节点
  const positionTester = new Sprite2D('PositionTester')
  positionTester.position = { x: 0, y: 0, z: 0 } // 从左上角开始
  positionTester.attachScript('Position2DTest')
  rootNode.addChild(positionTester)
  addLog('创建2D位置测试节点，附加Position2DTest脚本')

  // 设置为主场景
  await engine.setMainScene(scene)
  scene._enterTree()

  addLog('演示场景创建完成，包含3个带脚本的节点')
}

// 开始播放模式
const startPlayMode = async () => {
  if (engine) {
    await engine.startPlayMode()
    currentGameMode.value = await engine.getCurrentGameMode()
    addLog('切换到播放模式，脚本开始执行')
  }
}

// 暂停播放模式
const pausePlayMode = async () => {
  if (engine) {
    await engine.pausePlayMode()
    currentGameMode.value = await engine.getCurrentGameMode()
    addLog('播放模式已暂停，脚本停止执行')
  }
}

// 停止播放模式
const stopPlayMode = async () => {
  if (engine) {
    await engine.stopPlayMode()
    currentGameMode.value = await engine.getCurrentGameMode()
    addLog('切换到编辑模式，脚本停止执行')
  }
}

// 开始统计更新
const startStatsUpdate = () => {
  statsUpdateInterval = setInterval(() => {
    if (scriptManager) {
      scriptStats.value = scriptManager.getStats()
    }
  }, 1000) as unknown as number
}

// 停止统计更新
const stopStatsUpdate = () => {
  if (statsUpdateInterval) {
    clearInterval(statsUpdateInterval)
    statsUpdateInterval = null
  }
}

// 页面卸载时清理
onUnmounted(() => {
  stopStatsUpdate()
  if (engine) {
    engine.destroy()
  }
})

// 页面加载时的初始化
onMounted(() => {
  addLog('脚本系统演示页面已加载，点击按钮开始初始化')
})
</script>

<style scoped>
.script-system-demo {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 20px;
  font-size: 28px;
}

.demo-info {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}

.demo-info h3 {
  margin: 0 0 15px 0;
  font-size: 18px;
  text-align: center;
}

.demo-info ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.demo-info li {
  padding: 8px 0;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.demo-info li strong {
  color: #FFD700;
}

.demo-status {
  text-align: center;
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 8px;
  background: #f5f5f5;
}

.success {
  color: #28a745;
  font-weight: bold;
}

.error {
  color: #dc3545;
  font-weight: bold;
}

.info {
  color: #17a2b8;
  font-weight: bold;
}

.demo-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
}

.game-mode-controls {
  display: flex;
  gap: 10px;
}

.init-btn, .play-btn, .pause-btn, .stop-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.init-btn {
  background: linear-gradient(135deg, #007bff, #0056b3);
  box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
}

.play-btn {
  background: linear-gradient(135deg, #28a745, #20c997);
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
}

.pause-btn {
  background: linear-gradient(135deg, #ffc107, #e0a800);
  box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
}

.stop-btn {
  background: linear-gradient(135deg, #dc3545, #c82333);
  box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
}

.init-btn:hover:not(:disabled),
.play-btn:hover:not(:disabled),
.pause-btn:hover:not(:disabled),
.stop-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.init-btn:disabled,
.play-btn:disabled,
.pause-btn:disabled,
.stop-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.demo-canvas {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

#script-demo-canvas {
  width: 800px;
  height: 600px;
  border: 2px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.script-info-panel {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  border: 1px solid #e9ecef;
}

.script-info-panel h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.script-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.script-stats p {
  margin: 5px 0;
  padding: 10px;
  background: white;
  border-radius: 4px;
  border-left: 4px solid #007bff;
}

.script-list h4 {
  margin: 15px 0 10px 0;
  color: #333;
}

.script-item {
  background: white;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 6px;
  border-left: 4px solid #28a745;
}

.script-item strong {
  color: #007bff;
  font-size: 16px;
}

.script-item p {
  margin: 5px 0 0 0;
  color: #666;
  font-size: 14px;
}

.demo-logs {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e9ecef;
}

.demo-logs h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.4;
}

.log-entry {
  margin-bottom: 8px;
  color: #333;
  padding: 2px 0;
}

.log-entry:last-child {
  margin-bottom: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .demo-controls {
    flex-direction: column;
  }

  .game-mode-controls {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
  }

  #script-demo-canvas {
    width: 100%;
    max-width: 600px;
    height: 400px;
  }

  .script-stats {
    grid-template-columns: 1fr;
  }
}
</style>
