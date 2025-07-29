<template>
  <div id="qaq-app" class="qaq-editor">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

// 设置页面元数据
useHead({
  title: 'QAQ Game Engine',
  meta: [
    { name: 'description', content: 'QAQ Game Engine - A Vue3 + Nuxt UI Pro game engine editor inspired by Godot' }
  ]
})

// 初始化认证状态
const authStore = useAuthStore()

// 应用启动时尝试自动登录
onMounted(async () => {
  console.log('🚀 QAQ游戏引擎启动，检查认证状态...')
  await authStore.autoLogin()
})

// 设置颜色模式为深色 (通过 nuxt.config.ts 配置)

// 全局错误处理
const handleError = (error) => {
  console.error('QAQ Engine Error:', error)
}

// 监听未捕获的错误
if (process.client) {
  window.addEventListener('error', handleError)
  window.addEventListener('unhandledrejection', (event) => {
    handleError(event.reason)
  })
}

// 页面卸载时清理
onBeforeUnmount(() => {
  if (process.client) {
    window.removeEventListener('error', handleError)
  }
})
</script>

<style>
/* 确保应用占满整个视口 */
#qaq-app {
  height: 100vh;
  overflow: hidden;
}

/* 强制纯黑色主题 */
html, body {
  background-color: #000000 !important;
  color: #f3f4f6 !important;
}

/* 覆盖Nuxt UI的默认样式 */
.qaq-editor {
  background-color: #000000 !important;
  color: #f3f4f6 !important;
}

/* 确保所有面板使用纯黑色主题 */
.qaq-editor * {
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #2a2a2a;
  --color-gray-700: #1a1a1a;
  --color-gray-800: #0a0a0a;
  --color-gray-900: #000000;
}
</style>
