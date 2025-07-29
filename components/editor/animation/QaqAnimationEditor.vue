<!--
  QAQ 游戏引擎 动画编辑器主界面
  整合时间轴编辑器和状态机编辑器
  类似于 Godot 的 Animation 编辑器
-->

<template>
  <div class="animation-editor">
    <!-- 编辑器头部 -->
    <div class="editor-header">
      <div class="header-left">
        <UButton 
          icon="i-heroicons-plus" 
          size="sm"
          @click="createNewAnimation"
        >
          新建动画
        </UButton>
        <USelect 
          v-model="selectedAnimationId"
          :options="animationOptions"
          option-attribute="name"
          value-attribute="id"
          placeholder="选择动画片段"
          class="w-48"
          @change="onAnimationChanged"
        />
        <UDivider orientation="vertical" class="mx-2" />
        <UButton 
          icon="i-heroicons-cog-6-tooth" 
          size="sm"
          variant="outline"
          @click="showAnimationSettings"
        >
          设置
        </UButton>
      </div>
      
      <div class="header-center">
        <UTabs v-model="activeTab" :items="editorTabs" />
      </div>
      
      <div class="header-right">
        <span class="text-sm text-gray-600">目标: {{ targetMeshName || '未选择' }}</span>
        <UButton 
          icon="i-heroicons-link" 
          size="sm"
          variant="outline"
          @click="selectTargetMesh"
        >
          选择目标
        </UButton>
      </div>
    </div>

    <!-- 编辑器内容区域 -->
    <div class="editor-content">
      <!-- 时间轴编辑器 -->
      <div v-show="activeTab === 'timeline'" class="editor-panel">
        <QaqTimelineEditor
          :animation-clip="currentAnimationClip"
          :duration="animationDuration"
          :frame-rate="animationFrameRate"
          :current-time="currentTime"
          :is-playing="isPlaying"
          @play="onPlay"
          @pause="onPause"
          @stop="onStop"
          @seek="onSeek"
          @keyframe-added="onKeyframeAdded"
          @keyframe-removed="onKeyframeRemoved"
          @keyframe-moved="onKeyframeMoved"
          @keyframe-changed="onKeyframeChanged"
        />
      </div>

      <!-- 状态机编辑器 -->
      <div v-show="activeTab === 'statemachine'" class="editor-panel">
        <QaqStateMachineEditor
          :state-machine="currentStateMachine"
          :is-playing="isStateMachineTestMode"
          :current-state="currentStateMachineState"
          @state-added="onStateAdded"
          @state-updated="onStateUpdated"
          @state-removed="onStateRemoved"
          @transition-added="onTransitionAdded"
          @transition-updated="onTransitionUpdated"
          @transition-removed="onTransitionRemoved"
          @parameter-changed="onParameterChanged"
          @play="onStateMachinePlay"
          @stop="onStateMachineStop"
        />
      </div>

      <!-- 曲线编辑器 -->
      <div v-show="activeTab === 'curves'" class="editor-panel">
        <div class="curve-editor-placeholder">
          <div class="placeholder-content">
            <UIcon name="i-heroicons-chart-bar" class="w-16 h-16 text-gray-400" />
            <h3 class="text-lg font-medium text-gray-600 mt-4">曲线编辑器</h3>
            <p class="text-gray-500 mt-2">用于编辑动画过渡曲线和关键帧插值</p>
            <p class="text-sm text-gray-400 mt-4">即将推出...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 动画设置对话框 -->
    <UModal v-model="animationSettingsDialog.open">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">动画设置</h3>
        </template>
        
        <div class="space-y-4">
          <UFormGroup label="动画名称">
            <UInput v-model="animationSettingsDialog.data.name" />
          </UFormGroup>
          
          <UFormGroup label="时长 (秒)">
            <UInput 
              v-model.number="animationSettingsDialog.data.duration" 
              type="number" 
              :min="0.1" 
              :max="60" 
              :step="0.1"
            />
          </UFormGroup>
          
          <UFormGroup label="帧率 (FPS)">
            <USelect 
              v-model="animationSettingsDialog.data.frameRate"
              :options="[12, 24, 30, 60]"
            />
          </UFormGroup>
          
          <UFormGroup label="循环播放">
            <UToggle v-model="animationSettingsDialog.data.loop" />
          </UFormGroup>
        </div>
        
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="outline" @click="animationSettingsDialog.open = false">
              取消
            </UButton>
            <UButton @click="saveAnimationSettings">
              保存
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>

    <!-- 目标选择对话框 -->
    <UModal v-model="targetSelectionDialog.open">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">选择动画目标</h3>
        </template>
        
        <div class="space-y-4">
          <UFormGroup label="场景中的 MeshInstance3D 节点">
            <USelect 
              v-model="targetSelectionDialog.selectedMesh"
              :options="availableMeshNodes"
              option-attribute="name"
              value-attribute="id"
              placeholder="选择网格节点"
            />
          </UFormGroup>
          
          <div v-if="targetSelectionDialog.selectedMesh" class="mesh-info">
            <h4 class="text-sm font-medium mb-2">骨骼信息</h4>
            <div class="skeleton-info">
              <p class="text-sm text-gray-600">
                骨骼数量: {{ getSkeletonInfo(targetSelectionDialog.selectedMesh).boneCount }}
              </p>
              <p class="text-sm text-gray-600">
                动画数量: {{ getSkeletonInfo(targetSelectionDialog.selectedMesh).animationCount }}
              </p>
            </div>
          </div>
        </div>
        
        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton variant="outline" @click="targetSelectionDialog.open = false">
              取消
            </UButton>
            <UButton @click="selectTarget">
              选择
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import QaqTimelineEditor from './QaqTimelineEditor.vue'
import QaqStateMachineEditor from './QaqStateMachineEditor.vue'
import { AnimationClip } from '../../../core/animation/AnimationClip'
import { StateMachine } from '../../../core/animation/StateMachine'
import { Animator } from '../../../core/animation/Animator'

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
  targetMesh?: any // MeshInstance3D 节点
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'animation-created': [animation: AnimationClip]
  'animation-updated': [animation: AnimationClip]
  'animation-deleted': [animationId: string]
  'target-changed': [target: any]
}>()

// ============================================================================
// 响应式数据
// ============================================================================

const activeTab = ref('timeline')
const selectedAnimationId = ref<string>('')
const targetMeshName = ref<string>('')

// 动画数据
const animations = ref<AnimationClip[]>([])
const stateMachines = ref<StateMachine[]>([])
const animator = ref<Animator | null>(null)

// 播放状态
const isPlaying = ref(false)
const currentTime = ref(0)
const animationDuration = ref(5.0)
const animationFrameRate = ref(30)

// 状态机测试模式
const isStateMachineTestMode = ref(false)
const currentStateMachineState = ref<string>('')

// 对话框状态
const animationSettingsDialog = ref({
  open: false,
  data: {
    name: '',
    duration: 5.0,
    frameRate: 30,
    loop: true
  }
})

const targetSelectionDialog = ref({
  open: false,
  selectedMesh: ''
})

// ============================================================================
// 计算属性
// ============================================================================

const editorTabs = computed(() => [
  { key: 'timeline', label: '时间轴', icon: 'i-heroicons-clock' },
  { key: 'statemachine', label: '状态机', icon: 'i-heroicons-squares-plus' },
  { key: 'curves', label: '曲线', icon: 'i-heroicons-chart-bar' }
])

const animationOptions = computed(() => 
  animations.value.map(anim => ({
    id: anim.name,
    name: anim.name
  }))
)

const currentAnimationClip = computed(() => 
  animations.value.find(anim => anim.name === selectedAnimationId.value) || null
)

const currentStateMachine = computed(() => 
  stateMachines.value[0] || null
)

const availableMeshNodes = computed(() => {
  // 这里应该从场景树中获取所有 MeshInstance3D 节点
  // 暂时返回模拟数据
  return [
    { id: 'character_mesh', name: 'Character' },
    { id: 'weapon_mesh', name: 'Weapon' },
    { id: 'prop_mesh', name: 'Prop' }
  ]
})

// ============================================================================
// 方法
// ============================================================================

const createNewAnimation = () => {
  const name = prompt('动画名称:')
  if (!name) return
  
  const newAnimation = new AnimationClip(name, 5.0)
  animations.value.push(newAnimation)
  selectedAnimationId.value = name
  
  emit('animation-created', newAnimation)
}

const onAnimationChanged = (animationId: string) => {
  selectedAnimationId.value = animationId
  const animation = animations.value.find(anim => anim.name === animationId)
  if (animation) {
    animationDuration.value = animation.duration
    animationFrameRate.value = animation.frameRate
  }
}

const showAnimationSettings = () => {
  const currentAnim = currentAnimationClip.value
  if (!currentAnim) return
  
  animationSettingsDialog.value.data = {
    name: currentAnim.name,
    duration: currentAnim.duration,
    frameRate: currentAnim.frameRate,
    loop: currentAnim.loop
  }
  animationSettingsDialog.value.open = true
}

const saveAnimationSettings = () => {
  const currentAnim = currentAnimationClip.value
  if (!currentAnim) return
  
  currentAnim.name = animationSettingsDialog.value.data.name
  currentAnim.duration = animationSettingsDialog.value.data.duration
  currentAnim.frameRate = animationSettingsDialog.value.data.frameRate
  currentAnim.loop = animationSettingsDialog.value.data.loop
  
  animationDuration.value = currentAnim.duration
  animationFrameRate.value = currentAnim.frameRate
  
  emit('animation-updated', currentAnim)
  animationSettingsDialog.value.open = false
}

const selectTargetMesh = () => {
  targetSelectionDialog.value.open = true
}

const selectTarget = () => {
  const meshId = targetSelectionDialog.value.selectedMesh
  const meshNode = availableMeshNodes.value.find(node => node.id === meshId)
  if (meshNode) {
    targetMeshName.value = meshNode.name
    emit('target-changed', meshNode)
  }
  targetSelectionDialog.value.open = false
}

const getSkeletonInfo = (meshId: string) => {
  // 这里应该从实际的网格节点获取骨骼信息
  // 暂时返回模拟数据
  return {
    boneCount: 25,
    animationCount: 3
  }
}

// 时间轴编辑器事件处理
const onPlay = () => {
  isPlaying.value = true
  // 启动动画播放循环
  startAnimationLoop()
}

const onPause = () => {
  isPlaying.value = false
}

const onStop = () => {
  isPlaying.value = false
  currentTime.value = 0
}

const onSeek = (time: number) => {
  currentTime.value = time
}

const onKeyframeAdded = (trackId: string, time: number, value: any) => {
  console.log('Keyframe added:', trackId, time, value)
}

const onKeyframeRemoved = (trackId: string, time: number) => {
  console.log('Keyframe removed:', trackId, time)
}

const onKeyframeMoved = (trackId: string, oldTime: number, newTime: number) => {
  console.log('Keyframe moved:', trackId, oldTime, newTime)
}

const onKeyframeChanged = (trackId: string, time: number, value: any) => {
  console.log('Keyframe changed:', trackId, time, value)
}

// 状态机编辑器事件处理
const onStateAdded = (stateData: any) => {
  console.log('State added:', stateData)
}

const onStateUpdated = (stateId: string, stateData: any) => {
  console.log('State updated:', stateId, stateData)
}

const onStateRemoved = (stateId: string) => {
  console.log('State removed:', stateId)
}

const onTransitionAdded = (transitionData: any) => {
  console.log('Transition added:', transitionData)
}

const onTransitionUpdated = (transitionId: string, transitionData: any) => {
  console.log('Transition updated:', transitionId, transitionData)
}

const onTransitionRemoved = (transitionId: string) => {
  console.log('Transition removed:', transitionId)
}

const onParameterChanged = (name: string, value: any) => {
  console.log('Parameter changed:', name, value)
  if (currentStateMachine.value) {
    currentStateMachine.value.setParameter(name, value)
  }
}

const onStateMachinePlay = () => {
  isStateMachineTestMode.value = true
  startStateMachineTest()
}

const onStateMachineStop = () => {
  isStateMachineTestMode.value = false
}

// 动画播放循环
const startAnimationLoop = () => {
  const animate = () => {
    if (!isPlaying.value) return
    
    currentTime.value += 1/60 // 60 FPS
    if (currentTime.value >= animationDuration.value) {
      if (currentAnimationClip.value?.loop) {
        currentTime.value = 0
      } else {
        isPlaying.value = false
        return
      }
    }
    
    // 更新动画
    if (animator.value) {
      animator.value.update(1/60)
    }
    
    requestAnimationFrame(animate)
  }
  
  requestAnimationFrame(animate)
}

// 状态机测试
const startStateMachineTest = () => {
  const testLoop = () => {
    if (!isStateMachineTestMode.value) return
    
    if (currentStateMachine.value) {
      currentStateMachine.value.update(1/60)
      currentStateMachineState.value = currentStateMachine.value.currentState
    }
    
    requestAnimationFrame(testLoop)
  }
  
  requestAnimationFrame(testLoop)
}

// ============================================================================
// 生命周期
// ============================================================================

onMounted(() => {
  // 初始化动画编辑器
  initializeAnimationEditor()
})

const initializeAnimationEditor = () => {
  // 创建默认动画
  const defaultAnimation = new AnimationClip('Default', 5.0)
  animations.value.push(defaultAnimation)
  selectedAnimationId.value = 'Default'
  
  // 创建默认状态机
  const defaultStateMachine = new StateMachine('DefaultStateMachine')
  stateMachines.value.push(defaultStateMachine)
  
  // 创建动画控制器
  animator.value = new Animator('MainAnimator')
  const layer = animator.value.addLayer('base', 'Base Layer', 1.0)
  
  console.log('Animation editor initialized')
}

// 监听目标网格变化
watch(() => props.targetMesh, (newTarget) => {
  if (newTarget) {
    targetMeshName.value = newTarget.name || 'Unknown'
    
    // 设置骨骼到动画控制器
    if (animator.value && newTarget.skeleton) {
      animator.value.skeleton = newTarget.skeleton
    }
  }
})
</script>

<style scoped>
.animation-editor {
  @apply flex flex-col h-full bg-white;
}

.editor-header {
  @apply flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50;
}

.header-left {
  @apply flex items-center gap-2;
}

.header-center {
  @apply flex-1 flex justify-center;
}

.header-right {
  @apply flex items-center gap-2;
}

.editor-content {
  @apply flex-1 overflow-hidden;
}

.editor-panel {
  @apply h-full;
}

.curve-editor-placeholder {
  @apply h-full flex items-center justify-center bg-gray-50;
}

.placeholder-content {
  @apply text-center;
}

.mesh-info {
  @apply p-3 bg-gray-50 rounded border border-gray-200;
}

.skeleton-info {
  @apply space-y-1;
}
</style>
