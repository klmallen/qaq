<template>
  <div class="qaq-property-renderer">
    <!-- 分组渲染 -->
    <div v-for="[groupName, properties] in groupedProperties" :key="groupName" class="qaq-property-group">
      <div class="qaq-group-header">
        <h4>{{ groupName }}</h4>
      </div>
      
      <div class="qaq-group-content">
        <div 
          v-for="property in properties" 
          :key="property.name"
          v-show="shouldShowProperty(property)"
          class="qaq-property-item"
        >
          <!-- 属性标签 -->
          <label class="qaq-property-label">
            {{ property.label || property.name }}
            <span v-if="property.description" class="qaq-property-description">
              {{ property.description }}
            </span>
          </label>
          
          <!-- 属性控件 -->
          <div class="qaq-property-control">
            <!-- 布尔值 - 开关 -->
            <UToggle
              v-if="property.controlType === 'toggle'"
              :model-value="getPropertyValue(property.name)"
              @update:model-value="setPropertyValue(property.name, $event)"
              :disabled="property.readonly"
            />
            
            <!-- 数字输入 -->
            <UInput
              v-else-if="property.controlType === 'number'"
              type="number"
              :model-value="getPropertyValue(property.name)"
              @update:model-value="setPropertyValue(property.name, parseFloat($event) || 0)"
              :min="property.min"
              :max="property.max"
              :step="property.step || 1"
              :disabled="property.readonly"
            />
            
            <!-- 滑块 -->
            <div v-else-if="property.controlType === 'slider'" class="qaq-slider-container">
              <URange
                :model-value="[getPropertyValue(property.name)]"
                @update:model-value="setPropertyValue(property.name, $event[0])"
                :min="property.min || 0"
                :max="property.max || 100"
                :step="property.step || 1"
                :disabled="property.readonly"
              />
              <UInput
                type="number"
                :model-value="getPropertyValue(property.name)"
                @update:model-value="setPropertyValue(property.name, parseFloat($event) || 0)"
                :min="property.min"
                :max="property.max"
                :step="property.step || 1"
                :disabled="property.readonly"
                class="qaq-slider-input"
              />
            </div>
            
            <!-- 选择框 -->
            <USelectMenu
              v-else-if="property.controlType === 'select'"
              :model-value="getPropertyValue(property.name)"
              @update:model-value="setPropertyValue(property.name, $event)"
              :options="property.enumOptions || []"
              :disabled="property.readonly"
            />
            
            <!-- 向量2 -->
            <div v-else-if="property.controlType === 'vector2'" class="qaq-vector-container">
              <div class="qaq-vector-component">
                <label>{{ property.vectorLabels?.[0] || 'X' }}</label>
                <UInput
                  type="number"
                  :model-value="getPropertyValue(property.name)?.x || 0"
                  @update:model-value="updateVectorComponent(property.name, 'x', parseFloat($event) || 0)"
                  :step="property.step || 0.01"
                  :disabled="property.readonly"
                />
              </div>
              <div class="qaq-vector-component">
                <label>{{ property.vectorLabels?.[1] || 'Y' }}</label>
                <UInput
                  type="number"
                  :model-value="getPropertyValue(property.name)?.y || 0"
                  @update:model-value="updateVectorComponent(property.name, 'y', parseFloat($event) || 0)"
                  :step="property.step || 0.01"
                  :disabled="property.readonly"
                />
              </div>
            </div>
            
            <!-- 向量3 -->
            <div v-else-if="property.controlType === 'vector3'" class="qaq-vector-container">
              <div class="qaq-vector-component">
                <label>{{ property.vectorLabels?.[0] || 'X' }}</label>
                <UInput
                  type="number"
                  :model-value="getPropertyValue(property.name)?.x || 0"
                  @update:model-value="updateVectorComponent(property.name, 'x', parseFloat($event) || 0)"
                  :step="property.step || 0.01"
                  :disabled="property.readonly"
                />
              </div>
              <div class="qaq-vector-component">
                <label>{{ property.vectorLabels?.[1] || 'Y' }}</label>
                <UInput
                  type="number"
                  :model-value="getPropertyValue(property.name)?.y || 0"
                  @update:model-value="updateVectorComponent(property.name, 'y', parseFloat($event) || 0)"
                  :step="property.step || 0.01"
                  :disabled="property.readonly"
                />
              </div>
              <div class="qaq-vector-component">
                <label>{{ property.vectorLabels?.[2] || 'Z' }}</label>
                <UInput
                  type="number"
                  :model-value="getPropertyValue(property.name)?.z || 0"
                  @update:model-value="updateVectorComponent(property.name, 'z', parseFloat($event) || 0)"
                  :step="property.step || 0.01"
                  :disabled="property.readonly"
                />
              </div>
            </div>
            
            <!-- 多行文本 -->
            <UTextarea
              v-else-if="property.controlType === 'textarea'"
              :model-value="getPropertyValue(property.name)"
              @update:model-value="setPropertyValue(property.name, $event)"
              :disabled="property.readonly"
            />
            
            <!-- 颜色选择器 -->
            <UInput
              v-else-if="property.controlType === 'color'"
              type="color"
              :model-value="getPropertyValue(property.name)"
              @update:model-value="setPropertyValue(property.name, $event)"
              :disabled="property.readonly"
            />
            
            <!-- 默认文本输入 -->
            <UInput
              v-else
              :model-value="getPropertyValue(property.name)"
              @update:model-value="setPropertyValue(property.name, $event)"
              :disabled="property.readonly"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Node } from '~/core/nodes/Node'
import type { PropertyMetadata } from '~/core/decorators/PropertyDecorators'
import { PropertyMetadataRegistry } from '~/core/decorators/PropertyDecorators'

// ============================================================================
// Props 和 Emits
// ============================================================================

interface Props {
  node: Node | null
}

interface Emits {
  (e: 'property-changed', propertyName: string, value: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ============================================================================
// 响应式数据
// ============================================================================

const propertyValues = ref<Record<string, any>>({})

// ============================================================================
// 计算属性
// ============================================================================

const groupedProperties = computed(() => {
  if (!props.node) return new Map()
  
  const constructor = props.node.constructor as any
  return PropertyMetadataRegistry.getPropertiesByGroup(constructor)
})

// ============================================================================
// 方法
// ============================================================================

function getPropertyValue(propertyName: string): any {
  if (!props.node) return null
  
  // 尝试从缓存获取
  if (propertyName in propertyValues.value) {
    return propertyValues.value[propertyName]
  }
  
  // 从节点获取实际值
  let value: any
  
  // 尝试直接访问属性
  if (propertyName in props.node) {
    value = (props.node as any)[propertyName]
  }
  // 尝试通过 getter 访问
  else {
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(props.node), propertyName)
    if (descriptor && descriptor.get) {
      value = descriptor.get.call(props.node)
    }
    // 尝试通过属性系统访问
    else if (props.node.hasProperty && props.node.hasProperty(propertyName)) {
      value = props.node.getProperty(propertyName)
    }
  }
  
  // 缓存值
  propertyValues.value[propertyName] = value
  return value
}

function setPropertyValue(propertyName: string, value: any): void {
  if (!props.node) return
  
  // 更新缓存
  propertyValues.value[propertyName] = value
  
  try {
    // 尝试直接设置属性
    if (propertyName in props.node) {
      (props.node as any)[propertyName] = value
    }
    // 尝试通过 setter 设置
    else {
      const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(props.node), propertyName)
      if (descriptor && descriptor.set) {
        descriptor.set.call(props.node, value)
      }
      // 尝试通过属性系统设置
      else if (props.node.setProperty && props.node.hasProperty(propertyName)) {
        props.node.setProperty(propertyName, value)
      }
    }
    
    // 发射变化事件
    emit('property-changed', propertyName, value)
  } catch (error) {
    console.error(`Failed to set property "${propertyName}":`, error)
  }
}

function updateVectorComponent(propertyName: string, component: string, value: number): void {
  const currentValue = getPropertyValue(propertyName) || {}
  const newValue = { ...currentValue, [component]: value }
  setPropertyValue(propertyName, newValue)
}

function shouldShowProperty(property: PropertyMetadata): boolean {
  if (!property.showIf) return true
  
  const conditionValue = getPropertyValue(property.showIf)
  return conditionValue === property.showIfValue
}

// ============================================================================
// 监听器
// ============================================================================

watch(() => props.node, (newNode) => {
  // 清空缓存，重新加载属性值
  propertyValues.value = {}
}, { immediate: true })
</script>

<style scoped>
.qaq-property-renderer {
  padding: 8px;
}

.qaq-property-group {
  margin-bottom: 16px;
}

.qaq-group-header {
  padding: 8px 0;
  border-bottom: 1px solid var(--qaq-border-color, #333);
  margin-bottom: 8px;
}

.qaq-group-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--qaq-text-primary, #ffffff);
}

.qaq-group-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qaq-property-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.qaq-property-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--qaq-text-secondary, #cccccc);
}

.qaq-property-description {
  font-size: 11px;
  font-weight: normal;
  color: var(--qaq-text-tertiary, #999999);
  display: block;
  margin-top: 2px;
}

.qaq-property-control {
  width: 100%;
}

.qaq-slider-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qaq-slider-input {
  width: 80px;
  flex-shrink: 0;
}

.qaq-vector-container {
  display: flex;
  gap: 8px;
}

.qaq-vector-component {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.qaq-vector-component label {
  font-size: 10px;
  color: var(--qaq-text-tertiary, #999999);
  text-align: center;
}
</style>
