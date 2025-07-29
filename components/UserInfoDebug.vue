<template>
  <div class="user-info-debug p-4 bg-gray-800 rounded-lg text-white">
    <h3 class="text-lg font-bold mb-4 text-green-400">🔍 用户信息调试面板</h3>
    
    <!-- 认证状态 -->
    <div class="mb-4">
      <h4 class="font-semibold mb-2">认证状态:</h4>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span class="text-gray-400">已认证:</span>
          <span :class="authStore.isAuthenticated ? 'text-green-400' : 'text-red-400'">
            {{ authStore.isAuthenticated ? '✅ 是' : '❌ 否' }}
          </span>
        </div>
        <div>
          <span class="text-gray-400">有Token:</span>
          <span :class="!!authStore.token ? 'text-green-400' : 'text-red-400'">
            {{ !!authStore.token ? '✅ 是' : '❌ 否' }}
          </span>
        </div>
        <div>
          <span class="text-gray-400">有刷新Token:</span>
          <span :class="!!authStore.refreshToken ? 'text-green-400' : 'text-red-400'">
            {{ !!authStore.refreshToken ? '✅ 是' : '❌ 否' }}
          </span>
        </div>
        <div>
          <span class="text-gray-400">信息完整:</span>
          <span :class="authStore.isUserInfoComplete ? 'text-green-400' : 'text-red-400'">
            {{ authStore.isUserInfoComplete ? '✅ 是' : '❌ 否' }}
          </span>
        </div>
      </div>
    </div>

    <!-- 用户信息 -->
    <div class="mb-4" v-if="authStore.user">
      <h4 class="font-semibold mb-2">用户信息:</h4>
      <div class="bg-gray-700 p-3 rounded text-sm">
        <div class="grid grid-cols-1 gap-1">
          <div><span class="text-gray-400">ID:</span> {{ authStore.user.id || '❌ 缺失' }}</div>
          <div><span class="text-gray-400">邮箱:</span> {{ authStore.user.email || '❌ 缺失' }}</div>
          <div><span class="text-gray-400">用户名:</span> {{ authStore.user.username || '❌ 缺失' }}</div>
          <div><span class="text-gray-400">名字:</span> {{ authStore.user.firstName || '❌ 缺失' }}</div>
          <div><span class="text-gray-400">姓氏:</span> {{ authStore.user.lastName || '❌ 缺失' }}</div>
          <div><span class="text-gray-400">头像:</span> {{ authStore.user.avatar || '❌ 缺失' }}</div>
          <div><span class="text-gray-400">激活状态:</span> {{ authStore.user.isActive ? '✅ 激活' : '❌ 未激活' }}</div>
        </div>
      </div>
    </div>

    <!-- Getter测试 -->
    <div class="mb-4">
      <h4 class="font-semibold mb-2">Getter测试:</h4>
      <div class="bg-gray-700 p-3 rounded text-sm">
        <div class="grid grid-cols-1 gap-1">
          <div><span class="text-gray-400">全名:</span> {{ authStore.userFullName || '❌ 缺失' }}</div>
          <div><span class="text-gray-400">显示名:</span> {{ authStore.userDisplayName || '❌ 缺失' }}</div>
          <div><span class="text-gray-400">用户ID:</span> {{ authStore.userId || '❌ 缺失' }}</div>
          <div><span class="text-gray-400">邮箱:</span> {{ authStore.userEmail || '❌ 缺失' }}</div>
          <div><span class="text-gray-400">头像:</span> {{ authStore.userAvatar || '❌ 缺失' }}</div>
        </div>
      </div>
    </div>

    <!-- Token信息 -->
    <div class="mb-4" v-if="authStore.token">
      <h4 class="font-semibold mb-2">Token信息:</h4>
      <div class="bg-gray-700 p-3 rounded text-sm">
        <div><span class="text-gray-400">Token长度:</span> {{ authStore.token.length }}</div>
        <div><span class="text-gray-400">Token前缀:</span> {{ authStore.token.substring(0, 20) }}...</div>
        <div><span class="text-gray-400">过期时间:</span> {{ authStore.expiresAt || '❌ 缺失' }}</div>
        <div v-if="authStore.expiresAt">
          <span class="text-gray-400">剩余时间:</span> {{ getTokenRemainingTime() }}
        </div>
      </div>
    </div>

    <!-- localStorage检查 -->
    <div class="mb-4">
      <h4 class="font-semibold mb-2">localStorage状态:</h4>
      <div class="bg-gray-700 p-3 rounded text-sm">
        <div><span class="text-gray-400">认证状态标记:</span> {{ getAuthStatus() }}</div>
        <div><span class="text-gray-400">认证数据存在:</span> {{ hasAuthData() ? '✅ 是' : '❌ 否' }}</div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex gap-2 mt-4">
      <button 
        @click="testSaveToStorage" 
        class="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
      >
        测试保存
      </button>
      <button 
        @click="testLoadFromStorage" 
        class="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
      >
        测试加载
      </button>
      <button 
        @click="clearStorage" 
        class="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
      >
        清除存储
      </button>
      <button 
        @click="refreshData" 
        class="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm"
      >
        刷新数据
      </button>
    </div>
  </div>
</template>

<script setup>
const authStore = useAuthStore()

// 获取认证状态
function getAuthStatus() {
  if (process.client) {
    return localStorage.getItem('qaq-auth-status') || '❌ 无'
  }
  return '服务端'
}

// 检查认证数据是否存在
function hasAuthData() {
  if (process.client) {
    return !!localStorage.getItem('qaq-auth')
  }
  return false
}

// 获取Token剩余时间
function getTokenRemainingTime() {
  if (!authStore.expiresAt) return '未知'
  
  const now = new Date()
  const expires = new Date(authStore.expiresAt)
  const diff = expires.getTime() - now.getTime()
  
  if (diff <= 0) return '已过期'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  return `${days}天 ${hours}小时 ${minutes}分钟`
}

// 测试保存到存储
function testSaveToStorage() {
  console.log('🧪 测试保存到localStorage...')
  authStore.saveToStorage()
  console.log('✅ 保存测试完成')
}

// 测试从存储加载
function testLoadFromStorage() {
  console.log('🧪 测试从localStorage加载...')
  const result = authStore.loadFromStorage()
  console.log('✅ 加载测试完成，结果:', result)
}

// 清除存储
function clearStorage() {
  console.log('🧪 清除localStorage...')
  authStore.clearStorage()
  console.log('✅ 清除完成')
}

// 刷新数据
async function refreshData() {
  console.log('🧪 刷新用户数据...')
  try {
    await authStore.autoLogin()
    console.log('✅ 数据刷新完成')
  } catch (error) {
    console.error('❌ 数据刷新失败:', error)
  }
}
</script>

<style scoped>
.user-info-debug {
  font-family: 'Courier New', monospace;
  max-width: 600px;
}
</style>
