<template>
  <div class="qaq-layout-editor">
    <slot />
  </div>
</template>

<script setup>
// 编辑器布局 - 为编辑器页面提供专门的布局
</script>

<style scoped>
.qaq-layout-editor {
  height: 100vh;
  overflow: hidden;
  background-color: var(--qaq-editor-bg);
}
</style>
