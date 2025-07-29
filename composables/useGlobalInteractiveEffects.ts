import { ref, onMounted, onUnmounted } from 'vue'

// 全局交互效果配置
interface InteractiveConfig {
  enabled: boolean
  respectReducedMotion: boolean
  excludeSelectors: string[]
  customSelectors: string[]
}

const defaultConfig: InteractiveConfig = {
  enabled: true,
  respectReducedMotion: true,
  excludeSelectors: [
    '.no-interactive',
    '.vue-flow__background',
    '.vue-flow__minimap',
    '.vue-flow__controls',
    '.vue-flow__panel',
    '.qaq-mouse-follower',
    '.qaq-3d-canvas',
    '.monaco-editor',
    '.monaco-editor *'
  ],
  customSelectors: [
    '.qaq-interactive',
    'button:not(.vue-flow__handle):not(.vue-flow__edge)',
    '[role="button"]:not(.vue-flow__handle)',
    '.clickable',
    '.qaq-panel-header',
    '.qaq-menu-item',
    '.qaq-tree-node',
    '.qaq-property-input',
    '.qaq-toolbar-button'
  ]
}

export function useGlobalInteractiveEffects(config: Partial<InteractiveConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config }
  const isEnabled = ref(finalConfig.enabled)
  const observer = ref<MutationObserver>()

  // 检查用户动画偏好
  const checkReducedMotion = () => {
    if (!finalConfig.respectReducedMotion) return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  // 应用交互样式
  const applyInteractiveStyles = () => {
    if (!isEnabled.value || checkReducedMotion()) return

    // 创建全局样式
    const styleId = 'qaq-global-interactive-styles'
    let styleElement = document.getElementById(styleId) as HTMLStyleElement

    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }

    const css = `
      /* 重置原有边框样式，避免冲突 */
      ${finalConfig.customSelectors.join(', ')} {
        position: relative !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        border: 2px solid transparent !important;
        border-radius: 6px !important;
        outline: none !important;
        box-shadow: none !important;
      }

      /* 移除原有的悬停样式 */
      ${finalConfig.customSelectors.join(', ')}:hover {
        border: 2px solid var(--qaq-primary, #00DC82) !important;
        background-color: rgba(0, 220, 130, 0.1) !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 12px rgba(0, 220, 130, 0.2) !important;
        z-index: 10 !important;
        outline: none !important;
      }

      /* 强制覆盖常见UI组件的原有样式 */
      button:hover,
      .btn:hover,
      .button:hover,
      [role="button"]:hover {
        border: 2px solid var(--qaq-primary, #00DC82) !important;
        background-color: rgba(0, 220, 130, 0.1) !important;
        outline: none !important;
        box-shadow: 0 4px 12px rgba(0, 220, 130, 0.2) !important;
      }

      ${finalConfig.customSelectors.map(selector => `${selector}:active`).join(', ')} {
        transform: translateY(-1px) scale(0.98) !important;
        box-shadow: 0 2px 8px rgba(0, 220, 130, 0.3) !important;
      }

      /* 排除特定元素 */
      ${finalConfig.excludeSelectors.join(', ')},
      ${finalConfig.excludeSelectors.map(selector => `${selector} *`).join(', ')} {
        border: none !important;
        transform: none !important;
        box-shadow: none !important;
        background-color: transparent !important;
      }

      /* 特殊元素样式 */
      .qaq-panel-header:hover {
        background-color: rgba(0, 220, 130, 0.05) !important;
        transform: none !important;
      }

      .qaq-tree-node:hover {
        background-color: rgba(0, 220, 130, 0.1) !important;
        border-left: 3px solid var(--qaq-primary, #00DC82) !important;
        transform: translateX(2px) !important;
        box-shadow: 2px 0 8px rgba(0, 220, 130, 0.2) !important;
      }

      .qaq-property-input:hover {
        border-color: var(--qaq-primary, #00DC82) !important;
        box-shadow: 0 0 0 3px rgba(0, 220, 130, 0.1) !important;
        transform: none !important;
      }

      /* 输入元素特殊处理 */
      input:hover, textarea:hover, select:hover {
        border-color: var(--qaq-primary, #00DC82) !important;
        box-shadow: 0 0 0 3px rgba(0, 220, 130, 0.1) !important;
        transform: none !important;
      }

      /* 3D视口控制器 */
      .qaq-viewport-controls button:hover {
        background-color: rgba(0, 220, 130, 0.2) !important;
        transform: scale(1.1) !important;
        box-shadow: 0 2px 8px rgba(0, 220, 130, 0.3) !important;
      }

      /* Vue Flow节点特殊处理 - 防止闪烁 */
      .vue-flow__node {
        transition: all 0.2s ease-out !important;
        border: 2px solid transparent !important;
      }

      .vue-flow__node:hover {
        border: 2px solid var(--qaq-primary, #00DC82) !important;
        box-shadow: 0 4px 16px rgba(0, 220, 130, 0.3) !important;
        transform: translateY(-1px) !important;
        background-color: rgba(0, 220, 130, 0.05) !important;
      }

      .vue-flow__handle {
        transition: all 0.2s ease-out !important;
        border: 2px solid #2a2a2a !important;
      }

      .vue-flow__handle:hover {
        transform: scale(1.3) !important;
        box-shadow: 0 0 12px rgba(0, 220, 130, 0.8) !important;
        border-color: #ffffff !important;
        background-color: var(--qaq-primary, #00DC82) !important;
      }

      /* 防止Vue Flow边的样式冲突 */
      .vue-flow__edge {
        pointer-events: auto !important;
      }

      .vue-flow__edge:hover .vue-flow__edge-path {
        stroke: var(--qaq-primary, #00DC82) !important;
        stroke-width: 3px !important;
        filter: drop-shadow(0 0 6px rgba(0, 220, 130, 0.6)) !important;
      }

      /* 减少动画模式支持 */
      @media (prefers-reduced-motion: reduce) {
        ${finalConfig.customSelectors.join(', ')},
        ${finalConfig.customSelectors.map(selector => `${selector}:hover`).join(', ')},
        ${finalConfig.customSelectors.map(selector => `${selector}:active`).join(', ')} {
          transition: none !important;
          transform: none !important;
          animation: none !important;
        }
      }

      /* 高对比度模式 */
      @media (prefers-contrast: high) {
        ${finalConfig.customSelectors.map(selector => `${selector}:hover`).join(', ')} {
          border-width: 3px !important;
          border-color: #ffffff !important;
        }
      }
    `

    styleElement.textContent = css
  }

  // 移除交互样式
  const removeInteractiveStyles = () => {
    const styleElement = document.getElementById('qaq-global-interactive-styles')
    if (styleElement) {
      styleElement.remove()
    }
  }

  // 观察DOM变化，为新元素应用样式
  const observeDOM = () => {
    if (!window.MutationObserver) return

    observer.value = new MutationObserver((mutations) => {
      let shouldUpdate = false

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              // 检查是否包含可交互元素
              const hasInteractiveElements = finalConfig.customSelectors.some(selector =>
                element.matches?.(selector) || element.querySelector?.(selector)
              )
              if (hasInteractiveElements) {
                shouldUpdate = true
              }
            }
          })
        }
      })

      if (shouldUpdate) {
        // 延迟更新，避免频繁重新应用样式
        setTimeout(applyInteractiveStyles, 100)
      }
    })

    observer.value.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  // 启用交互效果
  const enable = () => {
    isEnabled.value = true
    applyInteractiveStyles()
    observeDOM()
  }

  // 禁用交互效果
  const disable = () => {
    isEnabled.value = false
    removeInteractiveStyles()
    if (observer.value) {
      observer.value.disconnect()
    }
  }

  // 切换交互效果
  const toggle = () => {
    if (isEnabled.value) {
      disable()
    } else {
      enable()
    }
  }

  // 监听用户偏好变化
  const setupPreferenceListeners = () => {
    if (finalConfig.respectReducedMotion) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      const handleChange = () => {
        if (mediaQuery.matches) {
          disable()
        } else if (finalConfig.enabled) {
          enable()
        }
      }

      mediaQuery.addEventListener('change', handleChange)

      // 清理函数
      return () => {
        mediaQuery.removeEventListener('change', handleChange)
      }
    }
    return () => {}
  }

  // 生命周期管理
  let cleanupPreferences: () => void

  onMounted(() => {
    if (isEnabled.value && !checkReducedMotion()) {
      enable()
    }
    cleanupPreferences = setupPreferenceListeners()
  })

  onUnmounted(() => {
    disable()
    cleanupPreferences?.()
  })

  return {
    isEnabled,
    enable,
    disable,
    toggle,
    applyInteractiveStyles,
    removeInteractiveStyles
  }
}
