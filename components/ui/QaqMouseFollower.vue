<template>
  <div
    ref="follower"
    class="qaq-mouse-follower"
    :class="{
      'hover-state': isHovering,
      'dragging-state': isDragging,
      'connecting-state': isConnecting,
      'green-element-hover': isHoveringGreenElement
    }"
  ></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Props
interface Props {
  enabled?: boolean
  speed?: number
  size?: number
  color?: string
  advancedEffects?: boolean
  liquidDeformation?: boolean
  backgroundEffect?: 'none' | 'blur' | 'brightness' | 'contrast' | 'backdrop' | 'blend'
  perspectiveIntensity?: number
}

const props = withDefaults(defineProps<Props>(), {
  enabled: true,
  speed: 0.15,
  size: 12,
  color: '#00DC82',
  advancedEffects: true,
  liquidDeformation: true,
  backgroundEffect: 'backdrop',
  perspectiveIntensity: 1000
})

// 响应式状态
const follower = ref<HTMLElement>()
const isHovering = ref(false)
const isDragging = ref(false)
const isConnecting = ref(false)
const isHoveringGreenElement = ref(false)

// 鼠标和光标位置
let mouse = { x: 0, y: 0 }
let cursor = { x: 0, y: 0 }
let velocity = { x: 0, y: 0 }
let prevMouse = { x: 0, y: 0 }
let smoothVelocity = { x: 0, y: 0 }

// 状态管理
let currentState = 'default'
let targetScale = { x: 1, y: 1 }
let currentScale = { x: 1, y: 1 }

// 高级变形状态
let liquidDeform = { x: 0, y: 0, rotation: 0, skew: 0 }
let targetLiquidDeform = { x: 0, y: 0, rotation: 0, skew: 0 }
let velocityHistory: Array<{x: number, y: number, time: number}> = []
let lastUpdateTime = performance.now()

// 动画ID和性能监控
let animationId: number
let frameCount = 0
let lastTime = performance.now()
let fps = 60

// 绿色元素检测
const isGreenElement = (element: HTMLElement): boolean => {
  // 检查类名
  if (element.classList.contains('qaq-primary') ||
      element.classList.contains('bg-primary') ||
      element.classList.contains('text-primary') ||
      element.classList.contains('border-primary')) {
    return true
  }

  // 检查计算样式中的绿色
  const computedStyle = window.getComputedStyle(element)
  const bgColor = computedStyle.backgroundColor
  const borderColor = computedStyle.borderColor
  const color = computedStyle.color

  // 检查是否包含QAQ绿色 (#00DC82 = rgb(0, 220, 130))
  const greenColors = [
    'rgb(0, 220, 130)',
    'rgba(0, 220, 130',
    '#00DC82',
    '#00dc82'
  ]

  return greenColors.some(greenColor =>
    bgColor.includes(greenColor) ||
    borderColor.includes(greenColor) ||
    color.includes(greenColor)
  )
}

// 液体变形计算
const calculateLiquidDeformation = () => {
  if (!props.advancedEffects || !props.liquidDeformation) return

  const currentTime = performance.now()
  const deltaTime = currentTime - lastUpdateTime
  lastUpdateTime = currentTime

  // 更新速度历史
  velocityHistory.push({
    x: velocity.x,
    y: velocity.y,
    time: currentTime
  })

  // 保持最近100ms的历史记录
  velocityHistory = velocityHistory.filter(v => currentTime - v.time < 100)

  if (velocityHistory.length < 2) return

  // 计算平均速度和加速度
  const avgVelocity = velocityHistory.reduce((acc, v) => ({
    x: acc.x + v.x,
    y: acc.y + v.y
  }), { x: 0, y: 0 })

  avgVelocity.x /= velocityHistory.length
  avgVelocity.y /= velocityHistory.length

  const speed = Math.sqrt(avgVelocity.x ** 2 + avgVelocity.y ** 2)
  const angle = Math.atan2(avgVelocity.y, avgVelocity.x)

  // 液体变形参数
  const maxDeformation = 3.0
  const deformationFactor = Math.min(speed * 0.05, maxDeformation)

  // 计算目标变形
  targetLiquidDeform.x = deformationFactor * Math.abs(Math.cos(angle))
  targetLiquidDeform.y = deformationFactor * Math.abs(Math.sin(angle))
  targetLiquidDeform.rotation = angle * (180 / Math.PI) * 0.3
  targetLiquidDeform.skew = Math.min(speed * 0.02, 15) // 最大15度倾斜

  // 平滑过渡到目标变形
  const lerpFactor = 0.15
  liquidDeform.x += (targetLiquidDeform.x - liquidDeform.x) * lerpFactor
  liquidDeform.y += (targetLiquidDeform.y - liquidDeform.y) * lerpFactor
  liquidDeform.rotation += (targetLiquidDeform.rotation - liquidDeform.rotation) * lerpFactor
  liquidDeform.skew += (targetLiquidDeform.skew - liquidDeform.skew) * lerpFactor
}

// 背景影响效果
const updateBackgroundEffect = (mouseX: number, mouseY: number) => {
  if (!props.advancedEffects || props.backgroundEffect === 'none') return

  // 创建或更新背景效果元素
  let effectElement = document.getElementById('qaq-mouse-background-effect')

  if (!effectElement) {
    effectElement = document.createElement('div')
    effectElement.id = 'qaq-mouse-background-effect'
    effectElement.className = 'qaq-mouse-background-effect'
    document.body.appendChild(effectElement)
  }

  // 更新位置
  const effectSize = props.size * 4 // 效果区域是小球的4倍大
  effectElement.style.left = `${mouseX - effectSize/2}px`
  effectElement.style.top = `${mouseY - effectSize/2}px`
  effectElement.style.width = `${effectSize}px`
  effectElement.style.height = `${effectSize}px`

  // 根据背景效果类型应用样式
  switch (props.backgroundEffect) {
    case 'blur':
      effectElement.style.backdropFilter = 'blur(8px)'
      effectElement.style.background = 'rgba(0, 220, 130, 0.1)'
      break
    case 'brightness':
      effectElement.style.backdropFilter = 'brightness(1.3) contrast(1.1)'
      effectElement.style.background = 'radial-gradient(circle, rgba(0, 220, 130, 0.2) 0%, transparent 70%)'
      break
    case 'contrast':
      effectElement.style.backdropFilter = 'contrast(1.5) saturate(1.2)'
      effectElement.style.background = 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)'
      break
    case 'backdrop':
      effectElement.style.backdropFilter = 'blur(4px) brightness(1.1) saturate(1.3)'
      effectElement.style.background = 'radial-gradient(circle, rgba(0, 220, 130, 0.15) 0%, rgba(0, 220, 130, 0.05) 50%, transparent 70%)'
      break
    case 'blend':
      effectElement.style.background = 'radial-gradient(circle, rgba(0, 220, 130, 0.8) 0%, rgba(0, 220, 130, 0.3) 30%, transparent 70%)'
      effectElement.style.mixBlendMode = 'multiply'
      break
  }
}

// 清理背景效果
const cleanupBackgroundEffect = () => {
  const effectElement = document.getElementById('qaq-mouse-background-effect')
  if (effectElement) {
    effectElement.remove()
  }
}

// 鼠标移动处理
const onMouseMove = (e: MouseEvent) => {
  if (!props.enabled) return

  mouse.x = e.clientX
  mouse.y = e.clientY

  // 检查是否悬停在交互元素上
  const target = e.target as HTMLElement
  const isInteractive = target.closest('.qaq-interactive') ||
                       target.closest('button') ||
                       target.closest('[role="button"]') ||
                       target.closest('.vue-flow__handle') ||
                       target.closest('.qaq-node-editor') ||
                       target.closest('.clickable') ||
                       target.closest('input') ||
                       target.closest('select') ||
                       target.closest('textarea')

  // 检查是否悬停在绿色元素上
  let isGreen = false
  let currentElement = target
  let depth = 0

  // 向上遍历DOM树检查绿色元素（最多5层）
  while (currentElement && depth < 5) {
    if (isGreenElement(currentElement)) {
      isGreen = true
      break
    }
    currentElement = currentElement.parentElement as HTMLElement
    depth++
  }

  // 更新状态
  const newHovering = !!isInteractive
  const newGreenHovering = isGreen

  if (newHovering !== isHovering.value || newGreenHovering !== isHoveringGreenElement.value) {
    isHovering.value = newHovering
    isHoveringGreenElement.value = newGreenHovering
    updateState()
  }
}

// 鼠标按下处理
const onMouseDown = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (target.closest('.vue-flow__handle')) {
    isConnecting.value = true
  } else if (target.closest('.vue-flow__node')) {
    isDragging.value = true
  }
  updateState()
}

// 鼠标释放处理
const onMouseUp = () => {
  isDragging.value = false
  isConnecting.value = false
  updateState()
}

// 状态更新
const updateState = () => {
  let newState = 'default'

  if (isConnecting.value) {
    newState = 'connecting'
  } else if (isDragging.value) {
    newState = 'dragging'
  } else if (isHovering.value) {
    newState = 'hovering'
  }

  // 更新CSS类
  if (follower.value) {
    // 移除所有状态类
    follower.value.classList.remove('hover-state', 'dragging-state', 'connecting-state', 'green-element-hover')

    // 添加当前状态类
    if (newState !== 'default') {
      follower.value.classList.add(`${newState.replace('ing', '')}-state`)
    }

    // 添加绿色元素悬停类
    if (isHoveringGreenElement.value) {
      follower.value.classList.add('green-element-hover')
    }
  }

  if (newState !== currentState) {
    currentState = newState
    updateTargetScale()
    console.log(`🎯 Mouse Follower state: ${newState}, Green element: ${isHoveringGreenElement.value}`)
  }
}

// 更新目标缩放
const updateTargetScale = () => {
  switch (currentState) {
    case 'hovering':
      targetScale = { x: 1.5, y: 1.5 }
      break
    case 'dragging':
      targetScale = { x: 0.8, y: 0.8 }
      break
    case 'connecting':
      targetScale = { x: 1.2, y: 1.2 }
      break
    default:
      targetScale = { x: 1, y: 1 }
  }
}

// 动画循环
const animate = () => {
  if (!props.enabled || !follower.value) {
    animationId = requestAnimationFrame(animate)
    return
  }

  // 计算瞬时速度
  velocity.x = mouse.x - prevMouse.x
  velocity.y = mouse.y - prevMouse.y

  // 平滑速度（用于形变计算）
  smoothVelocity.x += (velocity.x - smoothVelocity.x) * 0.3
  smoothVelocity.y += (velocity.y - smoothVelocity.y) * 0.3

  // 计算速度大小
  const speed = Math.sqrt(smoothVelocity.x ** 2 + smoothVelocity.y ** 2)

  // 自适应缓动跟随 - 距离越远速度越快
  const distanceX = mouse.x - cursor.x
  const distanceY = mouse.y - cursor.y
  const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2)

  // 根据距离调整速度，距离远时加速
  const adaptiveSpeed = Math.min(props.speed + (distance * 0.001), props.speed * 2)

  cursor.x += distanceX * adaptiveSpeed
  cursor.y += distanceY * adaptiveSpeed

  // 状态缩放的缓动
  currentScale.x += (targetScale.x - currentScale.x) * 0.2
  currentScale.y += (targetScale.y - currentScale.y) * 0.2

  // 计算液体变形
  calculateLiquidDeformation()

  // 计算最终变形
  let deformScaleX = currentScale.x
  let deformScaleY = currentScale.y
  let rotationZ = 0
  let skewX = 0
  let perspective = props.perspectiveIntensity

  if (props.advancedEffects && props.liquidDeformation) {
    // 应用液体变形
    deformScaleX = currentScale.x * (1 + liquidDeform.x)
    deformScaleY = currentScale.y * (1 + liquidDeform.y)
    rotationZ = liquidDeform.rotation
    skewX = liquidDeform.skew
  } else if (currentState === 'default' && speed > 2) {
    // 传统变形（向后兼容）
    const maxDeformation = 2.5
    const deformationFactor = Math.min(speed * 0.03, maxDeformation)

    const absVelX = Math.abs(smoothVelocity.x)
    const absVelY = Math.abs(smoothVelocity.y)
    const totalVel = absVelX + absVelY

    if (totalVel > 0) {
      const horizontalRatio = absVelX / totalVel
      const verticalRatio = absVelY / totalVel

      deformScaleX = currentScale.x * (1 + deformationFactor * horizontalRatio)
      deformScaleY = currentScale.y * (1 + deformationFactor * verticalRatio)
    }
  }

  // 分离位置和变换，防止状态类覆盖
  const translateX = cursor.x - props.size/2
  const translateY = cursor.y - props.size/2

  // 构建高级变换字符串
  let transformString = `translate3d(${translateX}px, ${translateY}px, 0)`

  if (props.advancedEffects) {
    // 添加透视和3D变换
    transformString += ` perspective(${perspective}px)`
    transformString += ` rotateZ(${rotationZ}deg)`
    transformString += ` skewX(${skewX}deg)`
    transformString += ` scaleX(${deformScaleX})`
    transformString += ` scaleY(${deformScaleY})`
  } else {
    // 传统2D变换
    transformString += ` scaleX(${deformScaleX}) scaleY(${deformScaleY})`
  }

  // 应用变换
  follower.value.style.setProperty('transform', transformString, 'important')

  // 应用背景效果
  updateBackgroundEffect(translateX + props.size/2, translateY + props.size/2)

  // 保存当前位置
  prevMouse.x = mouse.x
  prevMouse.y = mouse.y

  // 性能监控
  frameCount++
  const currentTime = performance.now()
  if (currentTime - lastTime >= 1000) {
    fps = Math.round((frameCount * 1000) / (currentTime - lastTime))
    frameCount = 0
    lastTime = currentTime

    // 性能警告
    if (fps < 50) {
      console.warn(`🐌 QAQ Mouse Follower: Low FPS detected (${fps}fps)`)
    }
  }

  animationId = requestAnimationFrame(animate)
}

// 生命周期
onMounted(() => {
  if (!props.enabled) return

  // 设置初始样式
  if (follower.value) {
    follower.value.style.width = `${props.size}px`
    follower.value.style.height = `${props.size}px`
    follower.value.style.backgroundColor = props.color

    // 添加高级效果类
    if (props.advancedEffects) {
      if (props.liquidDeformation) {
        follower.value.classList.add('liquid-mode')
      }
      follower.value.classList.add('perspective-mode')
    }
  }

  // 添加body类以隐藏默认光标
  document.body.classList.add('qaq-mouse-follower-enabled')

  // 添加事件监听
  document.addEventListener('mousemove', onMouseMove, { passive: true })
  document.addEventListener('mousedown', onMouseDown, { passive: true })
  document.addEventListener('mouseup', onMouseUp, { passive: true })

  // 开始动画
  animate()

  console.log(`✅ QAQ Mouse Follower initialized (Advanced: ${props.advancedEffects}, Liquid: ${props.liquidDeformation}, Background: ${props.backgroundEffect})`)
})

onUnmounted(() => {
  // 移除body类
  document.body.classList.remove('qaq-mouse-follower-enabled')

  // 清理背景效果
  cleanupBackgroundEffect()

  // 清理事件监听
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mousedown', onMouseDown)
  document.removeEventListener('mouseup', onMouseUp)

  // 取消动画
  if (animationId) {
    cancelAnimationFrame(animationId)
  }

  console.log('🧹 QAQ Mouse Follower cleaned up')
})
</script>

<style scoped>
.qaq-mouse-follower {
  position: fixed;
  top: 0;
  left: 0;
  width: 18px;
  height: 18px;
  background: var(--qaq-primary, #00DC82);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  pointer-events: none;
  z-index: 99999;
  transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.9;
  box-shadow: 0 0 10px rgba(0, 220, 130, 0.4);

  /* 高级效果支持 */
  transform-style: preserve-3d;
  backface-visibility: hidden;
  will-change: transform, background-color, box-shadow;

  /* 液体效果增强 */
  filter: drop-shadow(0 0 8px rgba(0, 220, 130, 0.3));
}

.qaq-mouse-follower.hover-state {
  //background: #ffffff !important;
  //border-color: var(--qaq-primary, #00DC82) !important;
  //opacity: 1 !important;
  //box-shadow: 0 0 20px rgba(0, 220, 130, 0.8) !important;
}

.qaq-mouse-follower.dragging-state {
  background: #ff6b6b !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  opacity: 0.9 !important;
  box-shadow: 0 0 15px rgba(255, 107, 107, 0.6) !important;
}

.qaq-mouse-follower.connecting-state {
  background: #4ecdc4 !important;
  border-color: rgba(255, 255, 255, 0.7) !important;
  opacity: 1 !important;
  box-shadow: 0 0 20px rgba(78, 205, 196, 0.8) !important;
}

.qaq-mouse-follower.green-element-hover {
  background: #000000 !important;
  border-color: rgba(255, 255, 255, 0.8) !important;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.6) !important;
}

/* 全局光标隐藏 - 仅在启用时 */
body.qaq-mouse-follower-enabled {
  cursor: none !important;
}

body.qaq-mouse-follower-enabled * {
  cursor: none !important;
}

/* 在特定区域显示默认光标 */
body.qaq-mouse-follower-enabled input,
body.qaq-mouse-follower-enabled textarea,
body.qaq-mouse-follower-enabled select,
body.qaq-mouse-follower-enabled .monaco-editor,
body.qaq-mouse-follower-enabled .monaco-editor * {
  cursor: text !important;
}

/* 可调整大小的元素保持resize光标 */
body.qaq-mouse-follower-enabled .resize-handle,
body.qaq-mouse-follower-enabled [style*="resize"] {
  cursor: resize !important;
}

/* 背景影响效果样式 */
:global(.qaq-mouse-background-effect) {
  position: fixed;
  pointer-events: none;
  z-index: 99998; /* 在鼠标跟随器下方 */
  border-radius: 50%;
  transition: all 0.1s ease-out;
  will-change: transform, backdrop-filter, background;
}

/* 高级液体效果增强 */
.qaq-mouse-follower.liquid-mode {
  border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
  animation: liquid-morph 3s ease-in-out infinite;
}

@keyframes liquid-morph {
  0%, 100% {
    border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
  }
  25% {
    border-radius: 58% 42% 75% 25% / 76% 46% 54% 24%;
  }
  50% {
    border-radius: 50% 50% 33% 67% / 55% 27% 73% 45%;
  }
  75% {
    border-radius: 33% 67% 58% 42% / 63% 68% 32% 37%;
  }
}

/* 透视变形增强 */
.qaq-mouse-follower.perspective-mode {
  transform-origin: center center;
  perspective-origin: center center;
}

/* 状态特效增强 */
.qaq-mouse-follower.hover-state {
  background: transparent !important;
  //border-color: var(--qaq-primary, #00DC82) !important;
  opacity: 1 !important;
  box-shadow: 0 0 20px rgba(0, 220, 130, 0.8) !important;
  filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.6)) !important;
}

.qaq-mouse-follower.dragging-state {
  background: #ff6b6b !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  opacity: 0.9 !important;
  box-shadow: 0 0 15px rgba(255, 107, 107, 0.6) !important;
  filter: drop-shadow(0 0 10px rgba(255, 107, 107, 0.4)) !important;
}

.qaq-mouse-follower.connecting-state {
  background: #4ecdc4 !important;
  border-color: rgba(255, 255, 255, 0.7) !important;
  opacity: 1 !important;
  box-shadow: 0 0 20px rgba(78, 205, 196, 0.8) !important;
  filter: drop-shadow(0 0 12px rgba(78, 205, 196, 0.5)) !important;
}

.qaq-mouse-follower.green-element-hover {
  background: #000000 !important;
  border-color: rgba(255, 255, 255, 0.8) !important;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.6) !important;
  filter: drop-shadow(0 0 8px rgba(0, 0, 0, 0.4)) !important;
}
</style>
