<template>
  <UDropdown :items="dropdownItems" :popper="{ placement: 'bottom-end' }">
    <UButton
      color="gray"
      variant="ghost"
      trailing-icon="i-heroicons-chevron-down-20-solid"
      class="flex items-center space-x-2"
    >
      <!-- 用户头像 -->
      <UAvatar
        :src="userAvatar"
        :alt="displayName"
        size="sm"
        class="flex-shrink-0"
      />

      <!-- 用户名 -->
      <span class="hidden sm:block text-sm font-medium text-gray-200">
        {{ displayName }}
      </span>
    </UButton>

    <!-- 下拉菜单内容 -->
    <template #account="{ item }">
      <div class="text-left">
        <p class="font-medium text-gray-200">{{ displayName }}</p>
        <p class="text-sm text-gray-400">{{ userEmail }}</p>
      </div>
    </template>

    <template #item="{ item }">
      <span class="truncate">{{ item.label }}</span>
      <UIcon :name="item.icon" class="flex-shrink-0 h-4 w-4 text-gray-400 ms-auto" />
    </template>
  </UDropdown>
</template>

<script setup>
// 使用认证store
const authStore = useAuthStore()
const { t } = useI18n()

// 计算用户显示名称
const displayName = computed(() => {
  // 使用store的getter
  return authStore.userFullName || authStore.userDisplayName || 'User'
})

// 计算用户头像
const userAvatar = computed(() => {
  return authStore.userAvatar || null
})

// 计算用户邮箱
const userEmail = computed(() => {
  return authStore.userEmail || ''
})

// 下拉菜单项
const dropdownItems = computed(() => [
  [{
    slot: 'account',
    disabled: true
  }],
  [{
    label: t('navigation.profile'),
    icon: 'i-heroicons-user-circle',
    click: () => navigateTo('/profile')
  }, {
    label: t('navigation.myProjects'),
    icon: 'i-heroicons-folder-open',
    click: () => navigateTo('/profile/projects')
  }, {
    label: t('common.settings'),
    icon: 'i-heroicons-cog-6-tooth',
    click: () => navigateTo('/profile/settings')
  }],
  [{
    label: t('navigation.documentation'),
    icon: 'i-heroicons-book-open',
    click: () => window.open('https://docs.qaq-engine.com', '_blank')
  }, {
    label: t('navigation.community'),
    icon: 'i-heroicons-users',
    click: () => window.open('https://community.qaq-engine.com', '_blank')
  }, {
    label: t('navigation.support'),
    icon: 'i-heroicons-question-mark-circle',
    click: () => window.open('https://support.qaq-engine.com', '_blank')
  }],
  [{
    label: t('auth.logout'),
    icon: 'i-heroicons-arrow-right-on-rectangle',
    click: handleLogout
  }]
])

// 处理登出
async function handleLogout() {
  try {
    console.log('🔄 用户登出...')

    // 调用认证store的登出方法
    await authStore.logout()

    // 显示成功消息
    const toast = useToast()
    toast.add({
      title: '登出成功',
      description: '您已成功登出系统',
      icon: 'i-heroicons-check-circle',
      color: 'green',
      timeout: 3000
    })

    // 导航到首页
    await navigateTo('/')

  } catch (error) {
    console.error('❌ 登出失败:', error)

    // 显示错误消息
    const toast = useToast()
    toast.add({
      title: '登出失败',
      description: error.message || '登出时发生错误',
      icon: 'i-heroicons-exclamation-circle',
      color: 'red',
      timeout: 5000
    })
  }
}
</script>

<style scoped>
/* 用户下拉菜单样式 */
.user-dropdown {
  /* 自定义样式 */
}

/* 确保头像在小屏幕上也显示 */
@media (max-width: 640px) {
  .user-dropdown .user-name {
    display: none;
  }
}
</style>
