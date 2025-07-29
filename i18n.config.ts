/**
 * QAQ游戏引擎 - 国际化配置
 * 
 * 支持英文、中文、日文三种语言
 */

export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'en',
  messages: {
    en: {
      // 英文翻译将从 locales/en.json 加载
    },
    'zh-CN': {
      // 中文翻译将从 locales/zh-CN.json 加载
    },
    ja: {
      // 日文翻译将从 locales/ja.json 加载
    }
  }
}))
