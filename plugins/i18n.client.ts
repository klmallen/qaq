/**
 * QAQ游戏引擎 - 客户端i18n插件
 * 
 * 处理语言文件的动态加载和语言偏好的持久化
 */

export default defineNuxtPlugin(async () => {
  const { $i18n } = useNuxtApp()
  
  if (process.client && $i18n) {
    try {
      // 从localStorage恢复语言设置
      const savedLanguage = localStorage.getItem('qaq-language')
      if (savedLanguage && savedLanguage !== $i18n.locale.value) {
        const availableLocales = ['en', 'zh-CN', 'ja']
        if (availableLocales.includes(savedLanguage)) {
          await $i18n.setLocale(savedLanguage)
          console.log('✅ 恢复语言设置:', savedLanguage)
        }
      }
      
      // 监听语言变化并保存到localStorage
      watch($i18n.locale, (newLocale) => {
        if (process.client) {
          localStorage.setItem('qaq-language', newLocale)
          console.log('💾 保存语言设置:', newLocale)
        }
      })
      
    } catch (error) {
      console.warn('⚠️ i18n插件初始化失败:', error)
    }
  }
})
