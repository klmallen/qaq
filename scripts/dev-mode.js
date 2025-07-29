#!/usr/bin/env node

/**
 * QAQ游戏引擎开发模式切换脚本
 * 支持Vite和Nuxt两种开发模式
 */

const { spawn } = require('child_process')
const path = require('path')

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
}

function colorLog(message, color = 'white') {
    console.log(colors[color] + message + colors.reset)
}

function showHelp() {
    colorLog('\n🎮 QAQ游戏引擎开发模式切换器', 'cyan')
    colorLog('=====================================', 'cyan')
    colorLog('\n使用方法:', 'bright')
    colorLog('  node scripts/dev-mode.js [模式] [选项]', 'white')
    
    colorLog('\n可用模式:', 'bright')
    colorLog('  vite     - Vite模式 (TypeScript核心调试)', 'green')
    colorLog('  nuxt     - Nuxt模式 (完整应用开发)', 'blue')
    colorLog('  debug    - 纯HTML调试模式', 'yellow')
    
    colorLog('\n选项:', 'bright')
    colorLog('  --port   - 指定端口号', 'white')
    colorLog('  --host   - 指定主机地址', 'white')
    colorLog('  --help   - 显示帮助信息', 'white')
    
    colorLog('\n示例:', 'bright')
    colorLog('  node scripts/dev-mode.js vite', 'white')
    colorLog('  node scripts/dev-mode.js nuxt --port 3001', 'white')
    colorLog('  node scripts/dev-mode.js debug', 'white')
    
    colorLog('\n模式说明:', 'bright')
    colorLog('  🚀 Vite模式:', 'green')
    colorLog('     - 纯TypeScript环境', 'white')
    colorLog('     - 快速热重载', 'white')
    colorLog('     - 专注核心功能调试', 'white')
    colorLog('     - 不依赖Vue/Nuxt', 'white')
    
    colorLog('  🌐 Nuxt模式:', 'blue')
    colorLog('     - 完整的Vue.js应用', 'white')
    colorLog('     - SSR/SPA支持', 'white')
    colorLog('     - 完整的UI界面', 'white')
    colorLog('     - 生产环境部署', 'white')
    
    colorLog('  🔧 Debug模式:', 'yellow')
    colorLog('     - 纯HTML/JS环境', 'white')
    colorLog('     - 无框架依赖', 'white')
    colorLog('     - 快速原型测试', 'white')
    colorLog('     - 浏览器兼容性测试', 'white')
    
    colorLog('\n=====================================\n', 'cyan')
}

function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        colorLog(`\n🚀 执行命令: ${command} ${args.join(' ')}`, 'cyan')
        
        const child = spawn(command, args, {
            stdio: 'inherit',
            shell: true,
            cwd: path.join(__dirname, '..'),
            ...options
        })
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve()
            } else {
                reject(new Error(`命令执行失败，退出码: ${code}`))
            }
        })
        
        child.on('error', (error) => {
            reject(error)
        })
    })
}

async function startViteMode(options = {}) {
    colorLog('\n🚀 启动Vite模式 - TypeScript核心调试', 'green')
    colorLog('=====================================', 'green')
    colorLog('特性:', 'bright')
    colorLog('  ✅ 纯TypeScript环境', 'white')
    colorLog('  ✅ 快速热重载 (HMR)', 'white')
    colorLog('  ✅ 专注引擎核心功能', 'white')
    colorLog('  ✅ THREE.js集成调试', 'white')
    colorLog('  ✅ 实时性能监控', 'white')
    
    const args = ['run', 'dev:vite']
    
    if (options.port) {
        process.env.VITE_PORT = options.port
    }
    if (options.host) {
        process.env.VITE_HOST = options.host
    }
    
    try {
        await runCommand('npm', args)
    } catch (error) {
        colorLog(`❌ Vite模式启动失败: ${error.message}`, 'red')
        process.exit(1)
    }
}

async function startNuxtMode(options = {}) {
    colorLog('\n🌐 启动Nuxt模式 - 完整应用开发', 'blue')
    colorLog('=====================================', 'blue')
    colorLog('特性:', 'bright')
    colorLog('  ✅ 完整的Vue.js应用', 'white')
    colorLog('  ✅ SSR/SPA支持', 'white')
    colorLog('  ✅ 组件化开发', 'white')
    colorLog('  ✅ 路由管理', 'white')
    colorLog('  ✅ 生产环境就绪', 'white')
    
    const args = ['run', 'dev:nuxt']
    
    if (options.port) {
        args.push('--', '--port', options.port)
    }
    if (options.host) {
        args.push('--', '--host', options.host)
    }
    
    try {
        await runCommand('npm', args)
    } catch (error) {
        colorLog(`❌ Nuxt模式启动失败: ${error.message}`, 'red')
        process.exit(1)
    }
}

async function startDebugMode(options = {}) {
    colorLog('\n🔧 启动Debug模式 - 纯HTML调试', 'yellow')
    colorLog('=====================================', 'yellow')
    colorLog('特性:', 'bright')
    colorLog('  ✅ 纯HTML/JS环境', 'white')
    colorLog('  ✅ 无框架依赖', 'white')
    colorLog('  ✅ 快速原型测试', 'white')
    colorLog('  ✅ 浏览器兼容性', 'white')
    
    const port = options.port || '8000'
    const host = options.host || 'localhost'
    
    colorLog(`\n🌐 启动HTTP服务器: http://${host}:${port}`, 'cyan')
    
    try {
        await runCommand('python', ['-m', 'http.server', port, '--directory', 'debug'])
    } catch (error) {
        colorLog('❌ Python服务器启动失败，尝试Node.js服务器...', 'yellow')
        
        try {
            await runCommand('npm', ['run', 'test:browser'])
        } catch (nodeError) {
            colorLog(`❌ Debug模式启动失败: ${nodeError.message}`, 'red')
            colorLog('💡 请确保安装了Python或Node.js', 'yellow')
            process.exit(1)
        }
    }
}

function parseArgs() {
    const args = process.argv.slice(2)
    const options = {}
    let mode = 'vite' // 默认模式
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i]
        
        if (arg === '--help' || arg === '-h') {
            showHelp()
            process.exit(0)
        } else if (arg === '--port') {
            options.port = args[++i]
        } else if (arg === '--host') {
            options.host = args[++i]
        } else if (!arg.startsWith('--')) {
            mode = arg
        }
    }
    
    return { mode, options }
}

async function main() {
    const { mode, options } = parseArgs()
    
    colorLog('🎮 QAQ游戏引擎开发模式切换器', 'cyan')
    colorLog(`📅 ${new Date().toLocaleString()}`, 'white')
    
    switch (mode.toLowerCase()) {
        case 'vite':
        case 'v':
        case 'ts':
        case 'typescript':
            await startViteMode(options)
            break
            
        case 'nuxt':
        case 'n':
        case 'vue':
            await startNuxtMode(options)
            break
            
        case 'debug':
        case 'd':
        case 'html':
            await startDebugMode(options)
            break
            
        default:
            colorLog(`❌ 未知模式: ${mode}`, 'red')
            colorLog('💡 使用 --help 查看可用模式', 'yellow')
            showHelp()
            process.exit(1)
    }
}

// 处理中断信号
process.on('SIGINT', () => {
    colorLog('\n\n👋 开发服务器已停止', 'yellow')
    process.exit(0)
})

process.on('SIGTERM', () => {
    colorLog('\n\n👋 开发服务器已停止', 'yellow')
    process.exit(0)
})

// 启动
main().catch((error) => {
    colorLog(`❌ 启动失败: ${error.message}`, 'red')
    process.exit(1)
})
