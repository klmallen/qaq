<template>
  <div class="demo-container">
    <div class="demo-header">
      <NuxtLink to="/" class="back-button">
        ← 返回主页
      </NuxtLink>
      <h1>QAQ引擎简单演示</h1>
      <div class="controls">
        <p>基础引擎功能测试</p>
      </div>
    </div>
    
    <div class="game-container">
      <div id="game-canvas" ref="gameCanvas"></div>
    </div>
    
    <div class="demo-info">
      <div class="info-panel">
        <h3>演示状态</h3>
        <p :class="statusClass">{{ status }}</p>
      </div>
      
      <div class="info-panel">
        <h3>测试功能</h3>
        <ul>
          <li>✓ 引擎初始化</li>
          <li>✓ 场景创建</li>
          <li>✓ 节点系统</li>
          <li>✓ 渲染管道</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 设置页面标题
useHead({
  title: 'QAQ引擎简单演示'
})

const gameCanvas = ref<HTMLElement>()
const status = ref<string>('准备初始化...')
const statusClass = ref<string>('loading')

onMounted(async () => {
  if (!gameCanvas.value) return
  
  try {
    console.log('🎮 开始简单演示...')
    status.value = '正在初始化引擎...'
    
    // 动态导入引擎模块
    const { Engine, Scene, Node3D } = await import('~/core')
    
    console.log('✅ 引擎模块导入成功')
    status.value = '引擎模块加载完成'
    
    // 获取引擎实例
    const engine = Engine.getInstance()
    
    // 初始化引擎
    await engine.initialize({
      container: gameCanvas.value,
      width: 800,
      height: 600,
      antialias: true,
      backgroundColor: 0x222222
    })
    
    console.log('✅ 引擎初始化完成')
    status.value = '引擎初始化成功'
    statusClass.value = 'success'
    
    // 创建简单场景
    const scene = new Scene('SimpleScene', {
      type: 'MAIN',
      persistent: false,
      autoStart: true
    })
    
    // 创建根节点
    const root = new Node3D('Root')
    scene.addChild(root)
    
    console.log('✅ 场景创建完成')
    status.value = '场景创建成功'
    
    // 设置主场景
    await engine.setMainScene(scene)
    scene._enterTree()
    
    // 启动渲染
    engine.startRendering()
    
    console.log('🎉 简单演示启动成功！')
    status.value = '演示运行中'
    
  } catch (error) {
    console.error('❌ 简单演示初始化失败:', error)
    status.value = `初始化失败: ${error.message}`
    statusClass.value = 'error'
  }
})

onUnmounted(() => {
  try {
    // 动态导入并清理引擎
    import('~/core').then(({ Engine }) => {
      const engine = Engine.getInstance()
      engine.stopRendering()
      engine.destroy()
      console.log('🧹 简单演示清理完成')
    })
  } catch (error) {
    console.error('❌ 简单演示清理失败:', error)
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
