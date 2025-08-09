<template>
  <div class="test-editor-access">
    <div class="test-container">
      <h1>🎮 编辑器访问测试</h1>
      <p>测试编辑器是否可以直接访问（无需登录）</p>
      
      <div class="test-results">
        <div class="test-item">
          <div class="test-label">当前页面访问状态:</div>
          <div class="test-value success">✅ 成功访问（无需登录）</div>
        </div>
        
        <div class="test-item">
          <div class="test-label">编辑器页面链接:</div>
          <div class="test-value">
            <NuxtLink to="/editor" class="editor-link">
              🚀 进入编辑器
            </NuxtLink>
          </div>
        </div>
        
        <div class="test-item">
          <div class="test-label">集成测试页面:</div>
          <div class="test-value">
            <NuxtLink to="/test-editor-integration" class="editor-link">
              🧪 引擎集成测试
            </NuxtLink>
          </div>
        </div>
      </div>
      
      <div class="test-info">
        <h3>✅ 修改完成</h3>
        <ul>
          <li>移除了 <code>middleware: 'auth'</code> 配置</li>
          <li>移除了认证状态检查逻辑</li>
          <li>移除了登录重定向逻辑</li>
          <li>编辑器现在可以直接访问</li>
        </ul>
      </div>
      
      <div class="test-actions">
        <UButton 
          @click="testEditorAccess" 
          color="primary" 
          size="lg"
        >
          🧪 测试编辑器访问
        </UButton>
        
        <UButton 
          @click="goToEditor" 
          color="green" 
          size="lg"
        >
          🎮 直接进入编辑器
        </UButton>
      </div>
      
      <div v-if="testResults.length > 0" class="test-logs">
        <h3>测试日志</h3>
        <div class="logs-container">
          <div 
            v-for="(log, index) in testResults" 
            :key="index"
            class="log-item"
            :class="log.type"
          >
            <span class="log-time">{{ log.time }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 页面标题
useHead({
  title: '编辑器访问测试 - QAQ Game Engine'
})

// 响应式数据
const testResults = ref<Array<{ time: string, message: string, type: string }>>([])

// 方法
function addLog(message: string, type: 'info' | 'success' | 'error' = 'info') {
  const time = new Date().toLocaleTimeString()
  testResults.value.unshift({ time, message, type })
  
  // 限制日志数量
  if (testResults.value.length > 20) {
    testResults.value = testResults.value.slice(0, 20)
  }
}

async function testEditorAccess() {
  addLog('🧪 开始测试编辑器访问...', 'info')
  
  try {
    // 测试编辑器页面是否可访问
    const response = await fetch('/editor', { method: 'HEAD' })
    
    if (response.ok) {
      addLog('✅ 编辑器页面可以正常访问', 'success')
    } else {
      addLog(`❌ 编辑器页面访问失败: ${response.status}`, 'error')
    }
    
    // 测试集成测试页面
    const integrationResponse = await fetch('/test-editor-integration', { method: 'HEAD' })
    
    if (integrationResponse.ok) {
      addLog('✅ 集成测试页面可以正常访问', 'success')
    } else {
      addLog(`❌ 集成测试页面访问失败: ${integrationResponse.status}`, 'error')
    }
    
    addLog('🎉 访问测试完成', 'success')
    
  } catch (error) {
    addLog(`❌ 测试过程中发生错误: ${error}`, 'error')
  }
}

async function goToEditor() {
  addLog('🚀 正在跳转到编辑器...', 'info')
  await navigateTo('/editor')
}

// 页面加载时自动测试
onMounted(() => {
  addLog('📄 编辑器访问测试页面已加载', 'info')
  addLog('✅ 当前页面无需登录即可访问', 'success')
})
</script>

<style scoped>
.test-editor-access {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  padding: 40px 20px;
}

.test-container {
  max-width: 800px;
  margin: 0 auto;
  background: #1f2937;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #60a5fa, #34d399);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

p {
  text-align: center;
  color: #9ca3af;
  margin-bottom: 40px;
  font-size: 1.1rem;
}

.test-results {
  background: #111827;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.test-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #374151;
}

.test-item:last-child {
  margin-bottom: 0;
  border-bottom: none;
}

.test-label {
  font-weight: 500;
  color: #d1d5db;
}

.test-value {
  font-weight: 600;
}

.test-value.success {
  color: #10b981;
}

.editor-link {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background: #1d4ed8;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s;
  font-weight: 500;
}

.editor-link:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.test-info {
  background: #065f46;
  border: 1px solid #10b981;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.test-info h3 {
  color: #10b981;
  margin-bottom: 15px;
  font-size: 1.2rem;
}

.test-info ul {
  color: #d1fae5;
  padding-left: 20px;
}

.test-info li {
  margin-bottom: 8px;
}

.test-info code {
  background: #064e3b;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  color: #6ee7b7;
}

.test-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-bottom: 30px;
}

.test-logs {
  background: #111827;
  border-radius: 8px;
  padding: 20px;
}

.test-logs h3 {
  margin-bottom: 15px;
  color: #f3f4f6;
  font-size: 1.1rem;
}

.logs-container {
  max-height: 300px;
  overflow-y: auto;
  background: #0f172a;
  border-radius: 6px;
  padding: 15px;
}

.log-item {
  display: flex;
  margin-bottom: 8px;
  font-family: monospace;
  font-size: 0.9rem;
}

.log-item:last-child {
  margin-bottom: 0;
}

.log-time {
  color: #6b7280;
  margin-right: 12px;
  min-width: 80px;
}

.log-message {
  flex: 1;
}

.log-item.info .log-message {
  color: #60a5fa;
}

.log-item.success .log-message {
  color: #10b981;
}

.log-item.error .log-message {
  color: #ef4444;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .test-container {
    padding: 20px;
  }
  
  h1 {
    font-size: 2rem;
  }
  
  .test-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .test-actions {
    flex-direction: column;
  }
}
</style>
