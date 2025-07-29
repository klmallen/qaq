<template>
  <component
    :is="tag"
    class="qaq-interactive"
    :class="[
      `qaq-interactive--${variant}`,
      {
        'qaq-interactive--hovering': isHovering,
        'qaq-interactive--pressing': isPressing,
        'qaq-interactive--disabled': disabled
      }
    ]"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    @mousedown="onMouseDown"
    @mouseup="onMouseUp"
    @click="onClick"
  >
    <div class="qaq-interactive__background"></div>
    <div class="qaq-interactive__border"></div>
    <div class="qaq-interactive__content">
      <slot />
    </div>
    <div class="qaq-interactive__ripple" ref="rippleContainer"></div>
  </component>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Props
interface Props {
  tag?: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'node' | 'handle'
  disabled?: boolean
  ripple?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'div',
  variant: 'primary',
  disabled: false,
  ripple: true
})

// Emits
const emit = defineEmits<{
  click: [event: MouseEvent]
  hover: [isHovering: boolean]
}>()

// 响应式状态
const isHovering = ref(false)
const isPressing = ref(false)
const rippleContainer = ref<HTMLElement>()

// 鼠标事件处理
const onMouseEnter = () => {
  if (props.disabled) return
  isHovering.value = true
  emit('hover', true)
}

const onMouseLeave = () => {
  if (props.disabled) return
  isHovering.value = false
  isPressing.value = false
  emit('hover', false)
}

const onMouseDown = (e: MouseEvent) => {
  if (props.disabled) return
  isPressing.value = true
  
  // 创建涟漪效果
  if (props.ripple && rippleContainer.value) {
    createRipple(e)
  }
}

const onMouseUp = () => {
  if (props.disabled) return
  isPressing.value = false
}

const onClick = (e: MouseEvent) => {
  if (props.disabled) return
  emit('click', e)
}

// 涟漪效果
const createRipple = (e: MouseEvent) => {
  if (!rippleContainer.value) return
  
  const rect = rippleContainer.value.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = e.clientX - rect.left - size / 2
  const y = e.clientY - rect.top - size / 2
  
  const ripple = document.createElement('div')
  ripple.className = 'qaq-ripple-effect'
  ripple.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    background: radial-gradient(circle, rgba(0, 220, 130, 0.3) 0%, transparent 70%);
    border-radius: 50%;
    transform: scale(0);
    animation: qaq-ripple 0.6s ease-out;
    pointer-events: none;
  `
  
  rippleContainer.value.appendChild(ripple)
  
  // 清理涟漪元素
  setTimeout(() => {
    if (ripple.parentNode) {
      ripple.parentNode.removeChild(ripple)
    }
  }, 600)
}
</script>

<style scoped>
.qaq-interactive {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;
  user-select: none;
}

.qaq-interactive--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* 背景层 */
.qaq-interactive__background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

/* 边框层 */
.qaq-interactive__border {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 2px solid transparent;
  border-radius: inherit;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 2;
}

/* 内容层 */
.qaq-interactive__content {
  position: relative;
  z-index: 3;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 涟漪容器 */
.qaq-interactive__ripple {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  border-radius: inherit;
  z-index: 2;
}

/* Primary变体 */
.qaq-interactive--primary:hover .qaq-interactive__background {
  background: rgba(0, 220, 130, 0.1);
}

.qaq-interactive--primary:hover .qaq-interactive__border {
  border-color: var(--qaq-primary, #00DC82);
}

.qaq-interactive--primary.qaq-interactive--hovering {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 220, 130, 0.2);
}

.qaq-interactive--primary.qaq-interactive--pressing .qaq-interactive__content {
  transform: scale(0.98);
}

/* Secondary变体 */
.qaq-interactive--secondary:hover .qaq-interactive__background {
  background: rgba(255, 255, 255, 0.05);
}

.qaq-interactive--secondary:hover .qaq-interactive__border {
  border-color: rgba(255, 255, 255, 0.3);
}

/* Ghost变体 */
.qaq-interactive--ghost:hover .qaq-interactive__background {
  background: rgba(255, 255, 255, 0.1);
}

/* Node变体（用于节点编辑器） */
.qaq-interactive--node {
  border-radius: 8px;
  padding: 12px 16px;
  background: var(--qaq-editor-panel, #383838);
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.qaq-interactive--node:hover .qaq-interactive__background {
  background: rgba(0, 220, 130, 0.05);
}

.qaq-interactive--node:hover .qaq-interactive__border {
  border-color: var(--qaq-primary, #00DC82);
}

.qaq-interactive--node.qaq-interactive--hovering {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Handle变体（用于连接点） */
.qaq-interactive--handle {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--qaq-primary, #00DC82);
  border: 2px solid #2a2a2a;
}

.qaq-interactive--handle:hover {
  transform: scale(1.3);
  box-shadow: 0 0 12px rgba(0, 220, 130, 0.8);
}

.qaq-interactive--handle.qaq-interactive--pressing {
  transform: scale(1.1);
}

/* 涟漪动画 */
@keyframes qaq-ripple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

/* 全局涟漪效果样式 */
:global(.qaq-ripple-effect) {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  animation: qaq-ripple 0.6s ease-out;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .qaq-interactive--node.qaq-interactive--hovering {
    transform: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .qaq-interactive,
  .qaq-interactive__background,
  .qaq-interactive__border,
  .qaq-interactive__content {
    transition: none !important;
  }
  
  .qaq-interactive--hovering {
    transform: none !important;
  }
  
  .qaq-ripple-effect {
    animation: none !important;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .qaq-interactive__border {
    border-width: 3px;
  }
  
  .qaq-interactive--primary:hover .qaq-interactive__border {
    border-color: #ffffff;
  }
}
</style>
