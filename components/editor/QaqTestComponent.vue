<template>
  <div class="test-component">
    <h1 style="color: red; font-size: 24px; font-weight: bold;">🎉 QAQ EDITOR COMPONENTS ARE WORKING! 🎉</h1>
    <p style="color: yellow; font-size: 18px;">Editor components in subdirectory are now loading successfully!</p>
    <p style="color: lime; font-size: 16px;">This confirms that the component resolution issue has been fixed.</p>
  </div>
</template>

<script setup lang="ts">
// 简单的测试组件
console.log('🎉 QaqTestComponent loaded successfully!')
</script>

<style scoped>
.test-component {
  padding: 20px;
  background: #2a2a2a;
  color: white;
  border: 3px solid #00ff00;
  margin: 10px;
  text-align: center;
  border-radius: 8px;
}
</style>
