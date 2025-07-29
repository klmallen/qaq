<template>
  <div class="qaq-logo" :class="{ animated: animation }">
    <div class="logo-container">
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        class="logo-svg"
      >
        <!-- Outer ring -->
        <circle
          cx="60"
          cy="60"
          r="55"
          stroke="url(#gradient1)"
          stroke-width="3"
          fill="none"
          class="outer-ring"
        />
        
        <!-- Inner geometric pattern -->
        <polygon
          points="60,20 85,45 85,75 60,100 35,75 35,45"
          stroke="url(#gradient2)"
          stroke-width="2"
          fill="url(#gradient3)"
          class="inner-shape"
        />
        
        <!-- Center Q -->
        <text
          x="60"
          y="70"
          text-anchor="middle"
          class="logo-text"
          fill="url(#textGradient)"
        >
          Q
        </text>
        
        <!-- Gradients -->
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#22c55e;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#16a34a;stop-opacity:1" />
          </linearGradient>
          
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#4ade80;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#22c55e;stop-opacity:1" />
          </linearGradient>
          
          <radialGradient id="gradient3" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style="stop-color:#22c55e;stop-opacity:0.1" />
            <stop offset="100%" style="stop-color:#16a34a;stop-opacity:0.3" />
          </radialGradient>
          
          <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#dcfce7;stop-opacity:1" />
          </linearGradient>
        </defs>
      </svg>
      
      <div class="logo-title">
        <h1>QAQ Game Engine</h1>
        <p class="logo-subtitle">Next-generation TypeScript game engine</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  animation?: boolean
}

withDefaults(defineProps<Props>(), {
  animation: true
})
</script>

<style scoped>
.qaq-logo {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem 0;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.logo-svg {
  filter: drop-shadow(0 4px 16px rgba(34, 197, 94, 0.3));
}

.animated .outer-ring {
  animation: rotate 8s linear infinite;
}

.animated .inner-shape {
  animation: pulse 3s ease-in-out infinite;
}

.logo-text {
  font-family: 'Arial Black', sans-serif;
  font-size: 36px;
  font-weight: 900;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

.logo-title h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #22c55e, #4ade80);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
}

.logo-subtitle {
  margin: 0.5rem 0 0 0;
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
  text-align: center;
  font-weight: 400;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.8;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
}

@media (max-width: 768px) {
  .logo-title h1 {
    font-size: 2rem;
  }
  
  .logo-subtitle {
    font-size: 1rem;
  }
  
  .logo-svg {
    width: 100px;
    height: 100px;
  }
}
</style>
