<template>
  <UDropdown :items="languageItems" :popper="{ placement: 'bottom-end' }">
    <UButton
      color="gray"
      variant="ghost"
      size="sm"
      :icon="currentLanguage.icon"
      :trailing="false"
    >
      <span class="hidden sm:inline">{{ currentLanguage.name }}</span>
      <span class="sm:hidden">{{ currentLanguage.code.toUpperCase() }}</span>
    </UButton>
  </UDropdown>
</template>

<script setup>
// 使用i18n
const { locale, locales, setLocale } = useI18n()
const { $i18n } = useNuxtApp()

// 语言配置
const languages = [
  {
    code: 'en',
    name: 'English',
    icon: 'i-heroicons-language',
    flag: '🇺🇸'
  },
  {
    code: 'zh-CN',
    name: '中文',
    icon: 'i-heroicons-language',
    flag: '🇨🇳'
  },
  {
    code: 'ja',
    name: '日本語',
    icon: 'i-heroicons-language',
    flag: '🇯🇵'
  }
]

// 当前语言
const currentLanguage = computed(() => {
  return languages.find(lang => lang.code === locale.value) || languages[1]
})

// 下拉菜单项
const languageItems = computed(() => [
  languages.map(lang => ({
    label: lang.name,
    icon: lang.icon,
    click: () => changeLanguage(lang.code),
    disabled: lang.code === locale.value,
    class: lang.code === locale.value ? 'bg-green-500/10 text-green-400' : ''
  }))
])

// 切换语言
async function changeLanguage(newLocale) {
  if (newLocale === locale.value) return
  
  try {
    // 设置新语言
    await setLocale(newLocale)
    
    // 保存到localStorage
    if (process.client) {
      localStorage.setItem('qaq-language', newLocale)
    }
    
    // 显示成功通知
    const toast = useToast()
    const langName = languages.find(lang => lang.code === newLocale)?.name || newLocale
    
    toast.add({
      title: $i18n.t('notifications.languageChanged'),
      description: `Language changed to ${langName}`,
      icon: 'i-heroicons-language',
      color: 'green',
      timeout: 3000
    })
    
    console.log('✅ 语言切换成功:', newLocale)
    
  } catch (error) {
    console.error('❌ 语言切换失败:', error)
    
    const toast = useToast()
    toast.add({
      title: $i18n.t('common.error'),
      description: 'Failed to change language',
      icon: 'i-heroicons-exclamation-circle',
      color: 'red'
    })
  }
}

// 页面挂载时恢复语言设置
onMounted(() => {
  if (process.client) {
    const savedLanguage = localStorage.getItem('qaq-language')
    if (savedLanguage && savedLanguage !== locale.value) {
      const validLanguage = languages.find(lang => lang.code === savedLanguage)
      if (validLanguage) {
        setLocale(savedLanguage)
      }
    }
  }
})
</script>

<style scoped>
/* 自定义样式 */
</style>
