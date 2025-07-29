<template>
  <div class="node-diagram">
    <h4 v-if="title" class="diagram-title">{{ title }}</h4>
    <div class="hierarchy-container">
      <div class="hierarchy-tree">
        <div v-for="(node, index) in processedNodes" :key="index" class="hierarchy-item" :style="{ paddingLeft: `${node.level * 2}rem` }">
          <div class="node-connector" v-if="node.level > 0">
            <div class="connector-line"></div>
          </div>
          <div class="node-info" :class="{ highlighted: node.highlighted }">
            <span class="node-name">{{ node.name }}</span>
            <span v-if="node.description" class="node-description">{{ node.description }}</span>
            <div v-if="node.properties && node.properties.length" class="node-properties">
              <span v-for="prop in node.properties" :key="prop" class="property">{{ prop }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="description" class="diagram-description">
      <p>{{ description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface NodeInfo {
  name: string
  level: number
  description?: string
  properties?: string[]
  highlighted?: boolean
}

interface Props {
  title?: string
  nodes: NodeInfo[]
  description?: string
}

const props = defineProps<Props>()

const processedNodes = computed(() => {
  return props.nodes.map(node => ({
    ...node,
    level: node.level || 0
  }))
})
</script>

<style scoped>
.node-diagram {
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1.5rem 0;
}

.diagram-title {
  margin: 0 0 1.5rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--qaq-green-400);
  text-align: center;
}

.hierarchy-container {
  background: var(--vp-c-bg-soft);
  border-radius: 6px;
  padding: 1.5rem;
  font-family: var(--vp-font-family-mono);
}

.hierarchy-tree {
  position: relative;
}

.hierarchy-item {
  position: relative;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: flex-start;
}

.node-connector {
  position: absolute;
  left: -1rem;
  top: 0.5rem;
  width: 1rem;
  height: 1px;
}

.connector-line {
  width: 100%;
  height: 1px;
  background: var(--vp-c-border);
  position: relative;
}

.connector-line::before {
  content: '';
  position: absolute;
  left: -1rem;
  top: -0.5rem;
  width: 1px;
  height: 1rem;
  background: var(--vp-c-border);
}

.node-info {
  flex: 1;
  padding: 0.75rem 1rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.node-info:hover {
  border-color: var(--qaq-green-600);
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.1);
}

.node-info.highlighted {
  border-color: var(--qaq-green-500);
  background: rgba(34, 197, 94, 0.05);
  box-shadow: 0 2px 12px rgba(34, 197, 94, 0.2);
}

.node-name {
  font-weight: 700;
  color: var(--qaq-green-400);
  font-size: 1rem;
}

.node-description {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-base);
  line-height: 1.4;
}

.node-properties {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.property {
  padding: 0.25rem 0.5rem;
  background: var(--qaq-green-900);
  color: var(--qaq-green-200);
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 500;
}

.diagram-description {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 6px;
  border-left: 4px solid var(--qaq-green-500);
}

.diagram-description p {
  margin: 0;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

/* Hierarchy lines for better visual connection */
.hierarchy-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: calc(-1rem - 0.5px);
  top: 1.5rem;
  width: 1px;
  height: calc(100% + 0.75rem);
  background: var(--vp-c-border);
  z-index: -1;
}

/* Hide the line for the last item at each level */
.hierarchy-item:last-child::after {
  display: none;
}

@media (max-width: 768px) {
  .hierarchy-item {
    padding-left: 1rem !important;
  }
  
  .node-connector {
    display: none;
  }
  
  .hierarchy-item::after {
    display: none;
  }
  
  .node-properties {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .property {
    align-self: flex-start;
  }
}
</style>
