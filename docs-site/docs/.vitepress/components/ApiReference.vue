<template>
  <div class="api-reference">
    <div class="api-header">
      <h3 class="api-title">{{ title }}</h3>
      <div class="api-badges">
        <span v-if="since" class="badge since">Since v{{ since }}</span>
        <span v-if="deprecated" class="badge deprecated">Deprecated</span>
        <span v-if="experimental" class="badge experimental">Experimental</span>
      </div>
    </div>
    
    <div v-if="description" class="api-description">
      <p>{{ description }}</p>
    </div>
    
    <div v-if="signature" class="api-signature">
      <h4>Signature</h4>
      <pre><code>{{ signature }}</code></pre>
    </div>
    
    <div v-if="parameters && parameters.length" class="api-parameters">
      <h4>Parameters</h4>
      <table class="params-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="param in parameters" :key="param.name">
            <td><code>{{ param.name }}</code></td>
            <td><code>{{ param.type }}</code></td>
            <td>
              <span :class="param.required ? 'required' : 'optional'">
                {{ param.required ? 'Yes' : 'No' }}
              </span>
            </td>
            <td>{{ param.description }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <div v-if="returns" class="api-returns">
      <h4>Returns</h4>
      <div class="return-info">
        <code>{{ returns.type }}</code>
        <p>{{ returns.description }}</p>
      </div>
    </div>
    
    <div v-if="examples && examples.length" class="api-examples">
      <h4>Examples</h4>
      <div v-for="(example, index) in examples" :key="index" class="example-item">
        <h5 v-if="example.title">{{ example.title }}</h5>
        <CodeExample
          :title="example.title || `Example ${index + 1}`"
          :code="example.code"
          :language="example.language || 'typescript'"
          :description="example.description"
          :output="example.output"
        />
      </div>
    </div>
    
    <div v-if="seeAlso && seeAlso.length" class="api-see-also">
      <h4>See Also</h4>
      <ul>
        <li v-for="link in seeAlso" :key="link.text">
          <a :href="link.url">{{ link.text }}</a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import CodeExample from './CodeExample.vue'

interface Parameter {
  name: string
  type: string
  required: boolean
  description: string
  default?: string
}

interface ReturnInfo {
  type: string
  description: string
}

interface Example {
  title?: string
  code: string
  language?: string
  description?: string
  output?: string
}

interface SeeAlsoLink {
  text: string
  url: string
}

interface Props {
  title: string
  description?: string
  signature?: string
  parameters?: Parameter[]
  returns?: ReturnInfo
  examples?: Example[]
  seeAlso?: SeeAlsoLink[]
  since?: string
  deprecated?: boolean
  experimental?: boolean
}

defineProps<Props>()
</script>

<style scoped>
.api-reference {
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  padding: 2rem;
  margin: 2rem 0;
}

.api-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.api-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--qaq-green-400);
}

.api-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge.since {
  background: var(--qaq-green-600);
  color: white;
}

.badge.deprecated {
  background: #ef4444;
  color: white;
}

.badge.experimental {
  background: #f59e0b;
  color: white;
}

.api-description {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 6px;
  border-left: 4px solid var(--qaq-green-500);
}

.api-description p {
  margin: 0;
  color: var(--vp-c-text-1);
  line-height: 1.6;
}

.api-signature {
  margin-bottom: 1.5rem;
}

.api-signature h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: var(--vp-c-text-1);
}

.api-signature pre {
  background: var(--vp-code-block-bg);
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  padding: 1rem;
  margin: 0;
  overflow-x: auto;
}

.api-signature code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.9rem;
  color: var(--qaq-green-300);
}

.api-parameters,
.api-returns,
.api-examples,
.api-see-also {
  margin-bottom: 1.5rem;
}

.api-parameters h4,
.api-returns h4,
.api-examples h4,
.api-see-also h4 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: var(--vp-c-text-1);
}

.params-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.params-table th,
.params-table td {
  padding: 0.75rem;
  text-align: left;
  border: 1px solid var(--vp-c-border);
}

.params-table th {
  background: var(--qaq-green-900);
  color: var(--qaq-green-100);
  font-weight: 600;
}

.params-table td code {
  background: var(--vp-code-bg);
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.85rem;
  color: var(--qaq-green-300);
}

.required {
  color: var(--qaq-green-400);
  font-weight: 600;
}

.optional {
  color: var(--vp-c-text-3);
}

.return-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 6px;
}

.return-info code {
  background: var(--vp-code-bg);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  color: var(--qaq-green-300);
  white-space: nowrap;
}

.return-info p {
  margin: 0;
  color: var(--vp-c-text-2);
}

.example-item {
  margin-bottom: 1rem;
}

.example-item h5 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: var(--vp-c-text-1);
}

.api-see-also ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.api-see-also li {
  margin-bottom: 0.5rem;
}

.api-see-also a {
  color: var(--qaq-green-400);
  text-decoration: none;
  font-weight: 500;
}

.api-see-also a:hover {
  color: var(--qaq-green-300);
  text-decoration: underline;
}

@media (max-width: 768px) {
  .api-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .api-badges {
    align-self: flex-start;
  }
  
  .return-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .params-table {
    font-size: 0.8rem;
  }
  
  .params-table th,
  .params-table td {
    padding: 0.5rem;
  }
}
</style>
