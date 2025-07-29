import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // 入口文件配置
  root: './debug-vite',
  
  // 构建配置
  build: {
    outDir: '../dist-debug',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'debug-vite/main.ts'),
      name: 'QAQEngineDebug',
      fileName: 'qaq-engine-debug'
    },
    rollupOptions: {
      external: ['three'],
      output: {
        globals: {
          three: 'THREE'
        }
      }
    },
    sourcemap: true,
    minify: false // 调试模式不压缩
  },
  
  // 开发服务器配置
  server: {
    port: 5173,
    host: 'localhost',
    open: true,
    cors: true,
    hmr: {
      overlay: true
    }
  },
  
  // 路径解析
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '~/core': resolve(__dirname, './core'),
      '~/types': resolve(__dirname, './types'),
      '~/debug': resolve(__dirname, './debug-vite')
    },
    extensions: ['.ts', '.js', '.vue', '.json']
  },
  
  // TypeScript配置
  esbuild: {
    target: 'esnext',
    keepNames: true,
    sourcemap: true
  },
  
  // 依赖优化
  optimizeDeps: {
    include: [
      'three',
      'three/examples/jsm/controls/OrbitControls',
      'three/examples/jsm/loaders/GLTFLoader'
    ],
    force: true
  },
  
  // 插件配置
  plugins: [
    // 自定义插件：TypeScript路径解析
    {
      name: 'typescript-paths',
      configResolved(config) {
        // 确保TypeScript路径正确解析
        config.resolve.alias = {
          ...config.resolve.alias,
          '~/core': resolve(__dirname, './core'),
          '~/types': resolve(__dirname, './types')
        }
      }
    },
    
    // 自定义插件：开发模式增强
    {
      name: 'dev-enhancements',
      configureServer(server) {
        server.middlewares.use('/api', (req, res, next) => {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
          next()
        })
      }
    }
  ],
  
  // 环境变量
  define: {
    __DEV__: true,
    __VITE_MODE__: true,
    global: 'globalThis'
  },
  
  // CSS配置
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./debug-vite/styles/variables.scss";`
      }
    }
  },
  
  // 日志级别
  logLevel: 'info',
  
  // 清除控制台
  clearScreen: false
})
