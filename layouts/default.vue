<template>
  <div class="qaq-layout-default">
    <slot />
  </div>
</template>

<script setup>
// 默认布局不需要特殊逻辑，只是一个简单的包装器
</script>

<style scoped>
.qaq-layout-default {
  height: 100vh;
  overflow: hidden;
}
</style>
