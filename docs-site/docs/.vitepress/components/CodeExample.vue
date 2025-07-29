<template>
  <div class="code-example">
    <div class="example-header">
      <h4 class="example-title">{{ title }}</h4>
      <div class="example-actions">
        <button @click="copyCode" class="copy-btn" :class="{ copied }">
          <span v-if="!copied">📋 Copy</span>
          <span v-else>✅ Copied!</span>
        </button>
        <button v-if="runnable" @click="runCode" class="run-btn">
          ▶️ Run
        </button>
      </div>
    </div>
    
    <div class="example-content">
      <div class="code-block">
        <pre><code :class="`language-${language}`" v-html="highlightedCode"></code></pre>
      </div>
      
      <div v-if="description" class="example-description">
        <p>{{ description }}</p>
      </div>
      
      <div v-if="output" class="example-output">
        <h5>Expected Output:</h5>
        <pre class="output-content">{{ output }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Props {
  title: string
  code: string
  language?: string
  description?: string
  output?: string
  runnable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  language: 'typescript',
  runnable: false
})

const copied = ref(false)

// Simple syntax highlighting (in a real implementation, you'd use a proper highlighter)
const highlightedCode = computed(() => {
  let highlighted = props.code
  
  // Basic TypeScript/JavaScript highlighting
  if (props.language === 'typescript' || props.language === 'javascript') {
    highlighted = highlighted
      .replace(/\b(class|interface|function|const|let|var|import|export|from|extends|implements)\b/g, '<span class="keyword">$1</span>')
      .replace(/\b(string|number|boolean|void|any|unknown|never)\b/g, '<span class="type">$1</span>')
      .replace(/'([^']*)'/g, '<span class="string">\'$1\'</span>')
      .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>')
      .replace(/\/\/.*$/gm, '<span class="comment">$&</span>')
      .replace(/\/\*[\s\S]*?\*\//g, '<span class="comment">$&</span>')
  }
  
  return highlighted
})

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy code:', err)
  }
}

const runCode = () => {
  // In a real implementation, this would execute the code in a sandbox
  console.log('Running code:', props.code)
  alert('Code execution would happen here in a real implementation')
}
</script>

<style scoped>
.code-example {
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  margin: 1.5rem 0;
  overflow: hidden;
}

.example-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--vp-c-bg-elv);
  border-bottom: 1px solid var(--vp-c-border);
}

.example-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--qaq-green-400);
}

.example-actions {
  display: flex;
  gap: 0.5rem;
}

.copy-btn,
.run-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.copy-btn:hover,
.run-btn:hover {
  border-color: var(--qaq-green-600);
  color: var(--qaq-green-400);
}

.copy-btn.copied {
  border-color: var(--qaq-green-500);
  color: var(--qaq-green-300);
}

.run-btn {
  background: var(--qaq-green-600);
  color: white;
  border-color: var(--qaq-green-600);
}

.run-btn:hover {
  background: var(--qaq-green-500);
  border-color: var(--qaq-green-500);
}

.example-content {
  padding: 1.5rem;
}

.code-block {
  background: var(--vp-code-block-bg);
  border-radius: 6px;
  overflow-x: auto;
}

.code-block pre {
  margin: 0;
  padding: 1rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--vp-c-text-1);
}

.code-block code {
  background: none;
  padding: 0;
  font-size: inherit;
}

/* Syntax highlighting styles */
:deep(.keyword) {
  color: var(--qaq-green-400);
  font-weight: 600;
}

:deep(.type) {
  color: #60a5fa;
}

:deep(.string) {
  color: #fbbf24;
}

:deep(.comment) {
  color: var(--vp-c-text-3);
  font-style: italic;
}

.example-description {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 6px;
  border-left: 4px solid var(--qaq-green-500);
}

.example-description p {
  margin: 0;
  color: var(--vp-c-text-2);
}

.example-output {
  margin-top: 1rem;
}

.example-output h5 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.output-content {
  background: #1a1a1a;
  border: 1px solid var(--vp-c-border);
  border-radius: 4px;
  padding: 1rem;
  margin: 0;
  font-family: var(--vp-font-family-mono);
  font-size: 0.85rem;
  color: var(--qaq-green-300);
  overflow-x: auto;
}

@media (max-width: 768px) {
  .example-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .example-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
