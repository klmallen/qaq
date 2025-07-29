<template>
  <div class="qaq-material-editor">
    <!-- 材质编辑器头部 -->
    <div class="qaq-material-header">
      <div class="qaq-header-left">
        <UIcon name="i-heroicons-swatch" class="qaq-material-icon" />
        <h2>材质编辑器</h2>
        <span class="qaq-material-name">{{ currentMaterialName }}</span>
      </div>

      <div class="qaq-header-right">
        <UButton
          icon="i-heroicons-folder-open"
          size="xs"
          variant="ghost"
          @click="loadMaterial"
          title="加载材质"
        >
          加载
        </UButton>
        <UButton
          icon="i-heroicons-document-arrow-down"
          size="xs"
          variant="ghost"
          @click="saveMaterial"
          title="保存材质"
        >
          保存
        </UButton>
        <UButton
          icon="i-heroicons-arrow-path"
          size="xs"
          variant="ghost"
          @click="resetMaterial"
          title="重置材质"
        >
          重置
        </UButton>
      </div>
    </div>

    <!-- 节点编辑器 -->
    <div class="qaq-node-editor-container">
      <QaqNodeEditor
        mode="material"
        :initial-nodes="materialNodes"
        :initial-edges="materialEdges"
        @graph-change="onGraphChange"
        @node-select="onNodeSelect"
        @export="onExportMaterial"
      />
    </div>

    <!-- 3D材质预览面板 -->
    <div class="qaq-material-preview-panel">
      <Qaq3DMaterialPreview
        :material-properties="currentMaterialProperties"
      />

      <div class="qaq-preview-stats">
        <div class="qaq-stats-header">
          <h4>图表统计</h4>
        </div>
        <div class="qaq-stats-content">
          <div class="qaq-info-item">
            <span>节点数量:</span>
            <span>{{ materialNodes.length }}</span>
          </div>
          <div class="qaq-info-item">
            <span>连接数量:</span>
            <span>{{ materialEdges.length }}</span>
          </div>
          <div class="qaq-info-item">
            <span>复杂度:</span>
            <span :class="getComplexityClass()">{{ getComplexityLevel() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import QaqNodeEditor from './QaqNodeEditor.vue'
import Qaq3DMaterialPreview from './Qaq3DMaterialPreview.vue'

// 响应式状态
const currentMaterialName = ref('新材质')
const previewShape = ref<'cube' | 'sphere' | 'plane'>('sphere')
const materialNodes = ref<any[]>([])
const materialEdges = ref<any[]>([])
const selectedNode = ref<any>(null)

// 计算属性
const materialComplexity = computed(() => {
  const nodeCount = materialNodes.value.length
  const edgeCount = materialEdges.value.length
  return nodeCount + edgeCount * 0.5
})

// 当前材质属性 - 从输出节点提取
const currentMaterialProperties = computed(() => {
  const outputNode = materialNodes.value.find(node => node.type === 'qaq-output')
  if (!outputNode || !outputNode.data.materialProperties) {
    return {
      albedo: '#ffffff',
      metallic: 0.0,
      roughness: 0.5,
      normal: undefined,
      emission: '#000000',
      alpha: 1.0
    }
  }

  return {
    albedo: outputNode.data.materialProperties.albedo || '#ffffff',
    metallic: outputNode.data.materialProperties.metallic || 0.0,
    roughness: outputNode.data.materialProperties.roughness || 0.5,
    normal: outputNode.data.materialProperties.normal,
    emission: outputNode.data.materialProperties.emission || '#000000',
    alpha: outputNode.data.materialProperties.alpha || 1.0
  }
})

// 方法
const onGraphChange = (data: { nodes: any[], edges: any[] }) => {
  materialNodes.value = data.nodes
  materialEdges.value = data.edges
  console.log('Material graph changed:', data)
}

const onNodeSelect = (node: any) => {
  selectedNode.value = node
  console.log('Node selected:', node)
}

const onExportMaterial = (data: any) => {
  console.log('Exporting material:', data)

  // 生成材质代码或配置
  const materialConfig = generateMaterialConfig(data)
  console.log('Generated material config:', materialConfig)
}

const loadMaterial = () => {
  // 模拟加载材质
  console.log('Loading material...')

  // 这里可以打开文件选择器或材质库
  const sampleMaterial = createSampleMaterial()
  materialNodes.value = sampleMaterial.nodes
  materialEdges.value = sampleMaterial.edges
  currentMaterialName.value = 'Sample Material'
}

const saveMaterial = () => {
  console.log('Saving material...')

  const materialData = {
    name: currentMaterialName.value,
    nodes: materialNodes.value,
    edges: materialEdges.value,
    metadata: {
      version: '1.0',
      created: new Date().toISOString(),
      complexity: materialComplexity.value
    }
  }

  // 下载材质文件
  const blob = new Blob([JSON.stringify(materialData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${currentMaterialName.value.replace(/\s+/g, '_')}.qaq_material`
  a.click()
  URL.revokeObjectURL(url)
}

const resetMaterial = () => {
  console.log('Resetting material...')
  materialNodes.value = []
  materialEdges.value = []
  currentMaterialName.value = '新材质'
}



const getComplexityLevel = () => {
  const complexity = materialComplexity.value
  if (complexity < 5) return '简单'
  if (complexity < 15) return '中等'
  if (complexity < 30) return '复杂'
  return '非常复杂'
}

const getComplexityClass = () => {
  const complexity = materialComplexity.value
  if (complexity < 5) return 'qaq-complexity-low'
  if (complexity < 15) return 'qaq-complexity-medium'
  if (complexity < 30) return 'qaq-complexity-high'
  return 'qaq-complexity-extreme'
}

const generateMaterialConfig = (graphData: any) => {
  // 生成材质配置代码
  return {
    type: 'StandardMaterial',
    properties: extractMaterialProperties(graphData),
    shaderCode: generateShaderCode(graphData),
    dependencies: extractDependencies(graphData)
  }
}

const extractMaterialProperties = (graphData: any) => {
  const outputNode = graphData.nodes.find((node: any) => node.type === 'qaq-output')
  return outputNode?.data.materialProperties || {}
}

const generateShaderCode = (graphData: any) => {
  // 这里可以实现节点图到着色器代码的转换
  return {
    vertex: '// Generated vertex shader',
    fragment: '// Generated fragment shader'
  }
}

const extractDependencies = (graphData: any) => {
  // 提取材质依赖的纹理和资源
  const textureNodes = graphData.nodes.filter((node: any) =>
    node.data.outputType === 'texture'
  )
  return textureNodes.map((node: any) => node.data.textureName).filter(Boolean)
}

const createSampleMaterial = () => {
  // 创建示例材质
  return {
    nodes: [
      {
        id: 'node-1',
        type: 'qaq-input',
        position: { x: 100, y: 100 },
        data: { label: 'Base Color', outputType: 'color', color: '#ff6b6b' }
      },
      {
        id: 'node-2',
        type: 'qaq-input',
        position: { x: 100, y: 200 },
        data: { label: 'Roughness', outputType: 'float', value: 0.3 }
      },
      {
        id: 'node-3',
        type: 'qaq-output',
        position: { x: 400, y: 150 },
        data: { label: 'Material Output', inputTypes: ['color', 'float', 'float', 'float'] }
      }
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-3',
        sourceHandle: 'node-1-output',
        targetHandle: 'node-3-input-albedo',
        style: { stroke: '#00DC82', strokeWidth: 2 }
      },
      {
        id: 'edge-2',
        source: 'node-2',
        target: 'node-3',
        sourceHandle: 'node-2-output',
        targetHandle: 'node-3-input-roughness',
        style: { stroke: '#00DC82', strokeWidth: 2 }
      }
    ]
  }
}

// 生命周期
onMounted(() => {
  console.log('Material Editor mounted')

  // 初始化默认材质
  const defaultMaterial = createSampleMaterial()
  materialNodes.value = defaultMaterial.nodes
  materialEdges.value = defaultMaterial.edges
})
</script>

<style scoped>
.qaq-material-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--qaq-editor-bg, #2a2a2a);
  color: var(--qaq-editor-text, #ffffff);
}

.qaq-material-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--qaq-editor-panel, #383838);
  border-bottom: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.qaq-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.qaq-material-icon {
  font-size: 20px;
  color: var(--qaq-primary, #00DC82);
}

.qaq-material-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.qaq-material-name {
  font-size: 14px;
  color: var(--qaq-editor-text-muted, #aaaaaa);
  font-style: italic;
}

.qaq-header-right {
  display: flex;
  gap: 8px;
}

.qaq-node-editor-container {
  flex: 1;
  position: relative;
}

.qaq-material-preview-panel {
  position: absolute;
  top: 60px;
  right: 16px;
  width: 320px;
  background: var(--qaq-editor-panel, #383838);
  border: 1px solid var(--qaq-editor-border, #4a4a4a);
  border-radius: 8px;
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 480px;
}

.qaq-preview-stats {
  background: var(--qaq-editor-bg, #2a2a2a);
  border-top: 1px solid var(--qaq-editor-border, #4a4a4a);
  flex-shrink: 0;
}

.qaq-stats-header {
  padding: 8px 12px;
  border-bottom: 1px solid var(--qaq-editor-border, #4a4a4a);
}

.qaq-stats-header h4 {
  margin: 0;
  font-size: 12px;
  color: var(--qaq-primary, #00DC82);
  font-weight: 600;
}

.qaq-stats-content {
  padding: 8px 12px;
}

.qaq-info-item {
  display: flex;
  justify-content: space-between;
  margin: 4px 0;
  font-size: 12px;
}

.qaq-info-item span:first-child {
  color: var(--qaq-editor-text-muted, #aaaaaa);
}

.qaq-complexity-low { color: #4ade80; }
.qaq-complexity-medium { color: #fbbf24; }
.qaq-complexity-high { color: #f97316; }
.qaq-complexity-extreme { color: #ef4444; }
</style>
