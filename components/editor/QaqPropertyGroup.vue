<template>
  <div class="qaq-property-group">
    <!-- 组标题 -->
    <div 
      class="qaq-group-header"
      @click="toggleExpanded"
    >
      <UIcon 
        :name="isExpanded ? 'i-heroicons-chevron-down' : 'i-heroicons-chevron-right'"
        class="qaq-expand-icon"
      />
      <UIcon 
        :name="group.icon"
        class="qaq-group-icon"
      />
      <span class="qaq-group-title">{{ group.name }}</span>
    </div>

    <!-- 属性列表 -->
    <div v-if="isExpanded" class="qaq-properties">
      <div 
        v-for="property in group.properties"
        :key="property.name"
        class="qaq-property-item"
      >
        <div class="qaq-property-label">
          <label 
            :for="`prop-${property.name}`"
            class="qaq-label-text"
            :title="property.description"
          >
            {{ property.label }}
          </label>
        </div>
        
        <div class="qaq-property-editor">
          <!-- 布尔值编辑器 -->
          <UToggle
            v-if="property.type === 'boolean'"
            :id="`prop-${property.name}`"
            :model-value="property.value"
            @update:model-value="updateProperty(property.name, $event)"
          />

          <!-- 字符串编辑器 -->
          <UInput
            v-else-if="property.type === 'string'"
            :id="`prop-${property.name}`"
            :model-value="property.value"
            size="xs"
            @update:model-value="updateProperty(property.name, $event)"
          />

          <!-- 数字编辑器 -->
          <UInput
            v-else-if="property.type === 'float' || property.type === 'int'"
            :id="`prop-${property.name}`"
            :model-value="property.value"
            type="number"
            :step="property.step || (property.type === 'int' ? 1 : 0.01)"
            :min="property.min"
            :max="property.max"
            size="xs"
            @update:model-value="updateProperty(property.name, parseFloat($event) || 0)"
          />

          <!-- 枚举选择器 -->
          <USelectMenu
            v-else-if="property.type === 'enum'"
            :id="`prop-${property.name}`"
            :model-value="property.options?.find((opt: any) => opt.value === property.value)"
            :options="property.options || []"
            size="xs"
            @update:model-value="updateProperty(property.name, $event.value)"
          />

          <!-- Vector2 编辑器 -->
          <div v-else-if="property.type === 'vector2'" class="qaq-vector-editor">
            <div class="qaq-vector-component">
              <label class="qaq-component-label">X</label>
              <UInput
                :model-value="property.value.x"
                type="number"
                step="0.01"
                size="xs"
                @update:model-value="updateVectorProperty(property.name, 'x', parseFloat($event) || 0)"
              />
            </div>
            <div class="qaq-vector-component">
              <label class="qaq-component-label">Y</label>
              <UInput
                :model-value="property.value.y"
                type="number"
                step="0.01"
                size="xs"
                @update:model-value="updateVectorProperty(property.name, 'y', parseFloat($event) || 0)"
              />
            </div>
          </div>

          <!-- Vector3 编辑器 -->
          <div v-else-if="property.type === 'vector3'" class="qaq-vector-editor">
            <div class="qaq-vector-component">
              <label class="qaq-component-label">X</label>
              <UInput
                :model-value="property.value.x"
                type="number"
                step="0.01"
                size="xs"
                @update:model-value="updateVectorProperty(property.name, 'x', parseFloat($event) || 0)"
              />
            </div>
            <div class="qaq-vector-component">
              <label class="qaq-component-label">Y</label>
              <UInput
                :model-value="property.value.y"
                type="number"
                step="0.01"
                size="xs"
                @update:model-value="updateVectorProperty(property.name, 'y', parseFloat($event) || 0)"
              />
            </div>
            <div class="qaq-vector-component">
              <label class="qaq-component-label">Z</label>
              <UInput
                :model-value="property.value.z"
                type="number"
                step="0.01"
                size="xs"
                @update:model-value="updateVectorProperty(property.name, 'z', parseFloat($event) || 0)"
              />
            </div>
          </div>

          <!-- 颜色编辑器 -->
          <div v-else-if="property.type === 'color'" class="qaq-color-editor">
            <input
              :id="`prop-${property.name}`"
              :value="colorToHex(property.value)"
              type="color"
              class="qaq-color-input"
              @input="updateColorProperty(property.name, $event.target.value)"
            />
            <UInput
              :model-value="colorToHex(property.value)"
              size="xs"
              class="qaq-color-text"
              @update:model-value="updateColorProperty(property.name, $event)"
            />
          </div>

          <!-- 只读属性 -->
          <div v-else-if="property.type === 'readonly'" class="qaq-readonly-value">
            {{ formatReadonlyValue(property.value) }}
          </div>

          <!-- 未知类型 -->
          <div v-else class="qaq-unknown-type">
            <span class="qaq-type-label">{{ property.type }}</span>
            <span class="qaq-value-text">{{ String(property.value) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Props
interface PropertyGroup {
  name: string
  icon: string
  expanded: boolean
  properties: Property[]
}

interface Property {
  name: string
  label: string
  type: string
  value: any
  description?: string
  min?: number
  max?: number
  step?: number
  options?: { label: string; value: any }[]
}

interface Props {
  group: PropertyGroup
  node: any
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'property-changed': [propertyName: string, newValue: any]
}>()

// 响应式数据
const isExpanded = ref(props.group.expanded)

// ========================================================================
// 属性更新方法
// ========================================================================

function updateProperty(propertyName: string, newValue: any) {
  emit('property-changed', propertyName, newValue)
}

function updateVectorProperty(propertyName: string, component: string, newValue: number) {
  const currentValue = props.group.properties.find(p => p.name === propertyName)?.value
  if (currentValue && typeof currentValue === 'object') {
    const newVector = { ...currentValue, [component]: newValue }
    emit('property-changed', propertyName, newVector)
  }
}

function updateColorProperty(propertyName: string, hexValue: string) {
  // 将十六进制颜色转换为适当的颜色对象
  const color = hexToColor(hexValue)
  emit('property-changed', propertyName, color)
}

// ========================================================================
// 工具函数
// ========================================================================

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

function colorToHex(color: any): string {
  if (typeof color === 'string') {
    return color.startsWith('#') ? color : `#${color}`
  }
  
  if (color && typeof color === 'object') {
    // 假设颜色对象有 r, g, b 属性 (0-1 范围)
    const r = Math.round((color.r || 0) * 255)
    const g = Math.round((color.g || 0) * 255)
    const b = Math.round((color.b || 0) * 255)
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }
  
  return '#ffffff'
}

function hexToColor(hex: string): any {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 1, g: 1, b: 1 }
}

function formatReadonlyValue(value: any): string {
  if (typeof value === 'number') {
    return value.toLocaleString()
  }
  return String(value)
}
</script>

<style scoped>
.qaq-property-group {
  background-color: var(--qaq-card-bg, #404040);
  border-radius: 6px;
  border: 1px solid var(--qaq-border, #555555);
  overflow: hidden;
}

.qaq-group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: var(--qaq-header-bg, #454545);
  cursor: pointer;
  user-select: none;
  transition: background-color 0.1s ease;
}

.qaq-group-header:hover {
  background-color: var(--qaq-hover-bg, #4a4a4a);
}

.qaq-expand-icon {
  width: 12px;
  height: 12px;
  color: var(--qaq-text-secondary, #cccccc);
  transition: transform 0.1s ease;
}

.qaq-group-icon {
  width: 14px;
  height: 14px;
  color: var(--qaq-icon-color, #cccccc);
}

.qaq-group-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--qaq-text, #ffffff);
}

.qaq-properties {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.qaq-property-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
}

.qaq-property-label {
  flex: 0 0 80px;
  display: flex;
  align-items: center;
}

.qaq-label-text {
  font-size: 11px;
  color: var(--qaq-text-secondary, #cccccc);
  cursor: help;
  user-select: none;
}

.qaq-property-editor {
  flex: 1;
  display: flex;
  align-items: center;
}

.qaq-vector-editor {
  display: flex;
  gap: 4px;
  width: 100%;
}

.qaq-vector-component {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 2px;
}

.qaq-component-label {
  font-size: 10px;
  color: var(--qaq-text-secondary, #cccccc);
  font-weight: 600;
  min-width: 8px;
  text-align: center;
}

.qaq-color-editor {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.qaq-color-input {
  width: 32px;
  height: 24px;
  border: 1px solid var(--qaq-border, #555555);
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
}

.qaq-color-text {
  flex: 1;
}

.qaq-readonly-value {
  font-size: 11px;
  color: var(--qaq-text-secondary, #cccccc);
  font-family: monospace;
  padding: 4px 8px;
  background-color: var(--qaq-readonly-bg, rgba(255, 255, 255, 0.05));
  border-radius: 4px;
  border: 1px solid var(--qaq-border, #555555);
}

.qaq-unknown-type {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--qaq-text-secondary, #cccccc);
}

.qaq-type-label {
  font-weight: 600;
  color: var(--qaq-warning-color, #ff9500);
}

.qaq-value-text {
  font-family: monospace;
}
</style>
