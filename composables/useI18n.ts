/**
 * QAQ游戏引擎 - 简化的i18n composable
 * 
 * 提供基本的多语言支持功能
 */

// 导入语言文件
import enMessages from '~/locales/en.json'
import zhCNMessages from '~/locales/zh-CN.json'
import jaMessages from '~/locales/ja.json'

// 语言消息映射
const messages = {
  'en': enMessages,
  'zh-CN': zhCNMessages,
  'ja': jaMessages
}

// 当前语言状态
const currentLocale = ref('zh-CN')

// 获取嵌套对象的值
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null
  }, obj)
}

// 翻译函数
function translate(key: string, params?: Record<string, any>): string {
  const locale = currentLocale.value
  const message = getNestedValue(messages[locale], key)
  
  if (!message) {
    // 回退到英文
    const fallbackMessage = getNestedValue(messages['en'], key)
    if (!fallbackMessage) {
      console.warn(`Missing translation for key: ${key}`)
      return key
    }
    return interpolate(fallbackMessage, params)
  }
  
  return interpolate(message, params)
}

// 字符串插值
function interpolate(message: string, params?: Record<string, any>): string {
  if (!params) return message
  
  return message.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match
  })
}

// 设置语言
function setLocale(locale: string) {
  if (messages[locale]) {
    currentLocale.value = locale
    
    // 保存到localStorage
    if (process.client) {
      localStorage.setItem('qaq-language', locale)
    }
    
    console.log('✅ 语言切换成功:', locale)
  } else {
    console.warn('❌ 不支持的语言:', locale)
  }
}

// 获取可用语言列表
function getAvailableLocales() {
  return [
    { code: 'en', name: 'English' },
    { code: 'zh-CN', name: '中文' },
    { code: 'ja', name: '日本語' }
  ]
}

// 初始化语言设置
function initializeLocale() {
  if (process.client) {
    const savedLanguage = localStorage.getItem('qaq-language')
    if (savedLanguage && messages[savedLanguage]) {
      currentLocale.value = savedLanguage
    } else {
      // 检测浏览器语言
      const browserLang = navigator.language || navigator.languages[0]
      if (browserLang.startsWith('zh')) {
        currentLocale.value = 'zh-CN'
      } else if (browserLang.startsWith('ja')) {
        currentLocale.value = 'ja'
      } else {
        currentLocale.value = 'en'
      }
    }
  }
}

// 导出composable
export function useI18n() {
  // 初始化
  if (process.client && !localStorage.getItem('qaq-i18n-initialized')) {
    initializeLocale()
    localStorage.setItem('qaq-i18n-initialized', 'true')
  }
  
  return {
    t: translate,
    locale: currentLocale,
    setLocale,
    locales: getAvailableLocales(),
    availableLocales: getAvailableLocales()
  }
}
