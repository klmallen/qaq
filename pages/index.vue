<template>
  <div class="demo-selector">
    <div class="header">
      <h1>QAQ游戏引擎演示</h1>
      <p>选择一个演示来体验QAQ引擎的功能</p>
    </div>

    <div class="demo-buttons">
      <NuxtLink to="/test-coordinates" class="demo-button demo-test">
        <div class="button-icon">🧪</div>
        <h3>坐标系测试</h3>
        <p>验证2D坐标系是否正确</p>
        <ul>
          <li>坐标原点测试</li>
          <li>边界检测验证</li>
          <li>移动控制测试</li>
        </ul>
      </NuxtLink>

      <NuxtLink to="/demo-boundary" class="demo-button demo-boundary">
        <div class="button-icon">🎯</div>
        <h3>边界系统演示</h3>
        <p>体验不同的边界处理方式</p>
        <ul>
          <li>无边界模式</li>
          <li>夹紧边界</li>
          <li>环绕边界</li>
        </ul>
      </NuxtLink>

      <NuxtLink to="/demo-simple" class="demo-button demo-simple">
        <div class="button-icon">⚡</div>
        <h3>简单演示</h3>
        <p>基础引擎功能测试</p>
        <ul>
          <li>引擎初始化</li>
          <li>场景创建</li>
          <li>节点系统</li>
        </ul>
      </NuxtLink>

      <NuxtLink to="/demo-2d" class="demo-button demo-2d">
        <div class="button-icon">🎮</div>
        <h3>2D演示</h3>
        <p>体验2D精灵渲染和WASD键控制</p>
        <ul>
          <li>2D精灵渲染</li>
          <li>WASD键盘控制</li>
          <li>相机跟随系统</li>
          <li>动画系统</li>
        </ul>
      </NuxtLink>

      <NuxtLink to="/demo-tilemap" class="demo-button demo-tilemap">
        <div class="button-icon">🗺️</div>
        <h3>TileMap演示</h3>
        <p>体验瓦片地图系统和多层渲染</p>
        <ul>
          <li>多层瓦片地图</li>
          <li>动态地图生成</li>
          <li>块优化渲染</li>
          <li>相机控制</li>
        </ul>
      </NuxtLink>

      <NuxtLink to="/demo-3d" class="demo-button demo-3d">
        <div class="button-icon">🌐</div>
        <h3>3D演示</h3>
        <p>体验3D模型加载和渲染功能</p>
        <ul>
          <li>3D模型加载</li>
          <li>3D场景渲染</li>
          <li>光照和阴影</li>
        </ul>
      </NuxtLink>

      <NuxtLink to="/roguelike-3d" class="demo-button demo-roguelike">
        <div class="button-icon">⚔️</div>
        <h3>3D肉鸽游戏</h3>
        <p>体验3D肉鸽游戏玩法</p>
        <ul>
          <li>3D角色模型</li>
          <li>动画切换</li>
          <li>战斗系统</li>
          <li>小地图导航</li>
        </ul>
      </NuxtLink>
    </div>

    <div class="footer">
      <p>QAQ游戏引擎 - 新一代TypeScript游戏引擎</p>
      <p class="debug-note">🔧 当前版本包含坐标系修复和调试功能</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 设置页面标题
useHead({
  title: 'QAQ游戏引擎演示'
})
</script>

<style scoped>
.demo-selector {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  font-family: 'Arial', sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.header h1 {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #22c55e, #4ade80);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header p {
  font-size: 1.2rem;
  color: #a0a0a0;
  margin: 0;
}

.demo-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
  max-width: 1200px;
  width: 100%;
}

.demo-button {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(34, 197, 94, 0.3);
  border-radius: 16px;
  padding: 2rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.demo-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.1), transparent);
  transition: left 0.5s ease;
}

.demo-button:hover::before {
  left: 100%;
}

.demo-button:hover {
  border-color: #22c55e;
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(34, 197, 94, 0.2);
}

.demo-test {
  border-color: rgba(255, 193, 7, 0.5);
}

.demo-test:hover {
  border-color: #ffc107;
  box-shadow: 0 10px 30px rgba(255, 193, 7, 0.2);
}

.demo-boundary {
  border-color: rgba(59, 130, 246, 0.5);
}

.demo-boundary:hover {
  border-color: #3b82f6;
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.2);
}

.button-icon {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 1rem;
}

.demo-button h3 {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #22c55e;
}

.demo-test h3 {
  color: #ffc107;
}

.demo-boundary h3 {
  color: #3b82f6;
}

.demo-3d h3 {
  color: #8b5cf6;
}

.demo-roguelike {
  border-color: rgba(255, 68, 68, 0.5);
}

.demo-roguelike:hover {
  border-color: #ff4444;
  box-shadow: 0 10px 30px rgba(255, 68, 68, 0.2);
}

.demo-roguelike h3 {
  color: #ff4444;
}

.demo-roguelike li::before {
  color: #ff4444;
}

.demo-button p {
  color: #a0a0a0;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.demo-button ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.demo-button li {
  color: #c0c0c0;
  margin-bottom: 0.5rem;
  position: relative;
  padding-left: 1.5rem;
}

.demo-button li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #22c55e;
  font-weight: bold;
}

.demo-test li::before {
  color: #ffc107;
}

.demo-boundary li::before {
  color: #3b82f6;
}

.footer {
  text-align: center;
  color: #666;
  font-size: 0.9rem;
}

.footer p {
  margin: 0.25rem 0;
}

.debug-note {
  color: #ffc107;
  font-size: 0.8rem;
  font-style: italic;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .demo-buttons {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .header h1 {
    font-size: 2rem;
  }

  .header p {
    font-size: 1rem;
  }
}
</style>
