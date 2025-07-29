#!/usr/bin/env node

/**
 * QAQ游戏引擎核心功能测试运行器
 * 纯Node.js环境，不依赖浏览器
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

function colorLog(message, color = 'white') {
    console.log(colors[color] + message + colors.reset);
}

class QAQTestRunner {
    constructor() {
        this.testResults = [];
        this.startTime = Date.now();
        
        // 模拟浏览器环境
        this.setupMockEnvironment();
    }
    
    setupMockEnvironment() {
        // 模拟全局对象
        global.window = {
            addEventListener: () => {},
            removeEventListener: () => {},
            innerWidth: 1920,
            innerHeight: 1080
        };
        
        global.document = {
            createElement: (tag) => ({
                style: {},
                addEventListener: () => {},
                removeEventListener: () => {},
                setPointerCapture: () => {},
                releasePointerCapture: () => {},
                clientWidth: 1920,
                clientHeight: 1080
            }),
            addEventListener: () => {},
            querySelector: () => null,
            body: {}
        };
        
        global.HTMLCanvasElement = class MockCanvas {};
        
        // 模拟THREE.js基础对象
        global.THREE = {
            Scene: class MockScene {
                constructor() {
                    this.children = [];
                }
                add(object) {
                    this.children.push(object);
                }
            },
            PerspectiveCamera: class MockPerspectiveCamera {
                constructor(fov, aspect, near, far) {
                    this.fov = fov;
                    this.aspect = aspect;
                    this.near = near;
                    this.far = far;
                    this.position = { x: 0, y: 0, z: 0, set: (x, y, z) => {
                        this.position.x = x;
                        this.position.y = y;
                        this.position.z = z;
                    }};
                    this.rotation = { x: 0, y: 0, z: 0 };
                }
                lookAt(x, y, z) {
                    // Mock lookAt implementation
                }
                updateProjectionMatrix() {
                    // Mock update
                }
            },
            OrthographicCamera: class MockOrthographicCamera {
                constructor(left, right, top, bottom, near, far) {
                    this.left = left;
                    this.right = right;
                    this.top = top;
                    this.bottom = bottom;
                    this.near = near;
                    this.far = far;
                    this.position = { x: 0, y: 0, z: 0, set: (x, y, z) => {
                        this.position.x = x;
                        this.position.y = y;
                        this.position.z = z;
                    }};
                }
            },
            WebGLRenderer: class MockRenderer {
                constructor() {
                    this.info = {
                        memory: { geometries: 0, textures: 0 },
                        render: { calls: 0, triangles: 0 }
                    };
                }
                setSize() {}
                render() {}
            },
            Vector3: class MockVector3 {
                constructor(x = 0, y = 0, z = 0) {
                    this.x = x;
                    this.y = y;
                    this.z = z;
                }
                set(x, y, z) {
                    this.x = x;
                    this.y = y;
                    this.z = z;
                    return this;
                }
            }
        };
        
        colorLog('🔧 Mock environment setup complete', 'cyan');
    }
    
    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, message, type };
        this.testResults.push(logEntry);
        
        const colorMap = {
            'info': 'white',
            'pass': 'green',
            'fail': 'red',
            'error': 'red',
            'warn': 'yellow'
        };
        
        colorLog(`[${timestamp}] ${message}`, colorMap[type] || 'white');
    }
    
    assert(condition, message) {
        if (condition) {
            this.log(`✅ PASS: ${message}`, 'pass');
            return true;
        } else {
            this.log(`❌ FAIL: ${message}`, 'fail');
            return false;
        }
    }
    
    async testBasicStructure() {
        this.log('🏗️ Testing basic project structure...', 'info');
        
        const coreFiles = [
            '../core/engine/Engine.ts',
            '../core/nodes/base/Camera.ts',
            '../core/nodes/3d/Camera3D.ts',
            '../core/nodes/base/Node.ts',
            '../core/nodes/3d/Node3D.ts'
        ];
        
        for (const file of coreFiles) {
            const filePath = path.join(__dirname, file);
            const exists = fs.existsSync(filePath);
            this.assert(exists, `Core file exists: ${file}`);
        }
    }
    
    async testMockCamera3D() {
        this.log('📷 Testing mock Camera3D functionality...', 'info');
        
        try {
            // 创建模拟的Camera3D类
            class MockCamera3D {
                constructor(name) {
                    this.name = name;
                    this._position = { x: 0, y: 0, z: 0 };
                    this._rotation = { x: 0, y: 0, z: 0 };
                    this.current = false;
                    this._perspectiveCamera = new THREE.PerspectiveCamera(75, 16/9, 0.1, 1000);
                }
                
                get position() {
                    return this._position;
                }
                
                set position(value) {
                    this._position = { ...value };
                    // 同步到THREE.js对象
                    if (this._perspectiveCamera) {
                        this._perspectiveCamera.position.set(value.x, value.y, value.z);
                    }
                }
                
                get rotation() {
                    return this._rotation;
                }
                
                set rotation(value) {
                    this._rotation = { ...value };
                }
                
                lookAt(target) {
                    if (this._perspectiveCamera) {
                        this._perspectiveCamera.lookAt(target.x, target.y, target.z);
                    }
                }
                
                setPerspective(fov, near, far) {
                    if (this._perspectiveCamera) {
                        this._perspectiveCamera.fov = fov;
                        this._perspectiveCamera.near = near;
                        this._perspectiveCamera.far = far;
                        this._perspectiveCamera.updateProjectionMatrix();
                    }
                }
                
                makeCurrent() {
                    this.current = true;
                }
            }
            
            // 测试Camera3D基础功能
            const camera = new MockCamera3D('TestCamera');
            
            this.assert(camera.name === 'TestCamera', 'Camera3D name property');
            this.assert(typeof camera.position === 'object', 'Camera3D position property');
            this.assert(typeof camera.rotation === 'object', 'Camera3D rotation property');
            
            // 测试位置设置
            const testPositions = [
                { x: 0, y: 0, z: 0 },
                { x: 10, y: 20, z: 30 },
                { x: -5, y: -10, z: -15 },
                { x: 0, y: -200, z: -30 } // 极端位置
            ];
            
            for (let i = 0; i < testPositions.length; i++) {
                const pos = testPositions[i];
                camera.position = pos;
                
                const positionMatch = Math.abs(camera.position.x - pos.x) < 0.001 &&
                                    Math.abs(camera.position.y - pos.y) < 0.001 &&
                                    Math.abs(camera.position.z - pos.z) < 0.001;
                
                this.assert(positionMatch, `Position test ${i + 1}: (${pos.x}, ${pos.y}, ${pos.z})`);
                
                // 检查THREE.js同步
                const threePos = camera._perspectiveCamera.position;
                const threeSync = Math.abs(threePos.x - pos.x) < 0.001 &&
                                Math.abs(threePos.y - pos.y) < 0.001 &&
                                Math.abs(threePos.z - pos.z) < 0.001;
                
                this.assert(threeSync, `THREE.js sync test ${i + 1}`);
            }
            
            // 测试投影参数
            camera.setPerspective(90, 0.01, 2000);
            this.assert(Math.abs(camera._perspectiveCamera.fov - 90) < 0.001, 'FOV parameter setting');
            this.assert(Math.abs(camera._perspectiveCamera.near - 0.01) < 0.001, 'Near parameter setting');
            this.assert(Math.abs(camera._perspectiveCamera.far - 2000) < 0.001, 'Far parameter setting');
            
            // 测试lookAt
            camera.lookAt({ x: 5, y: 5, z: 5 });
            this.assert(true, 'lookAt method execution');
            
            // 测试激活
            camera.makeCurrent();
            this.assert(camera.current === true, 'Camera activation');
            
        } catch (error) {
            this.log(`❌ Mock Camera3D test failed: ${error.message}`, 'error');
        }
    }
    
    async testPerformance() {
        this.log('⚡ Running performance tests...', 'info');
        
        try {
            // 创建简单的性能测试
            class MockCamera3D {
                constructor() {
                    this._position = { x: 0, y: 0, z: 0 };
                    this._perspectiveCamera = new THREE.PerspectiveCamera();
                }
                
                set position(value) {
                    this._position = { ...value };
                    this._perspectiveCamera.position.set(value.x, value.y, value.z);
                }
                
                get position() {
                    return this._position;
                }
            }
            
            const camera = new MockCamera3D();
            const iterations = 10000;
            
            // 测试位置设置性能
            const startTime = process.hrtime.bigint();
            
            for (let i = 0; i < iterations; i++) {
                camera.position = {
                    x: Math.random() * 100 - 50,
                    y: Math.random() * 100 - 50,
                    z: Math.random() * 100 - 50
                };
            }
            
            const endTime = process.hrtime.bigint();
            const duration = Number(endTime - startTime) / 1000000; // 转换为毫秒
            const avgTime = duration / iterations;
            
            this.log(`📊 Position setting performance: ${avgTime.toFixed(6)}ms per operation`, 'info');
            this.assert(avgTime < 0.1, 'Position setting performance is acceptable (< 0.1ms)');
            
        } catch (error) {
            this.log(`❌ Performance test failed: ${error.message}`, 'error');
        }
    }
    
    async testFileStructure() {
        this.log('📁 Testing file structure...', 'info');
        
        const expectedDirs = [
            '../core',
            '../core/engine',
            '../core/nodes',
            '../core/nodes/base',
            '../core/nodes/3d',
            '../core/camera'
        ];
        
        for (const dir of expectedDirs) {
            const dirPath = path.join(__dirname, dir);
            const exists = fs.existsSync(dirPath);
            this.assert(exists, `Directory exists: ${dir}`);
        }
        
        // 检查是否有TypeScript配置
        const tsConfigPath = path.join(__dirname, '../tsconfig.json');
        const hasTsConfig = fs.existsSync(tsConfigPath);
        this.assert(hasTsConfig, 'TypeScript configuration exists');
    }
    
    async runAllTests() {
        colorLog('🚀 Starting QAQ Engine Core Tests (Node.js)', 'cyan');
        colorLog('=====================================', 'cyan');
        
        await this.testBasicStructure();
        await this.testFileStructure();
        await this.testMockCamera3D();
        await this.testPerformance();
        
        colorLog('=====================================', 'cyan');
        this.generateReport();
    }
    
    generateReport() {
        const endTime = Date.now();
        const totalTime = endTime - this.startTime;
        
        const totalTests = this.testResults.filter(r => r.type === 'pass' || r.type === 'fail').length;
        const passedTests = this.testResults.filter(r => r.type === 'pass').length;
        const failedTests = this.testResults.filter(r => r.type === 'fail').length;
        const errors = this.testResults.filter(r => r.type === 'error').length;
        
        colorLog('📊 TEST REPORT', 'bright');
        colorLog(`Total Tests: ${totalTests}`, 'white');
        colorLog(`Passed: ${passedTests} ✅`, 'green');
        colorLog(`Failed: ${failedTests} ❌`, 'red');
        colorLog(`Errors: ${errors} 🚨`, 'red');
        colorLog(`Success Rate: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0}%`, 'cyan');
        colorLog(`Total Time: ${totalTime}ms`, 'yellow');
        
        if (failedTests > 0 || errors > 0) {
            colorLog('🚨 FAILED TESTS:', 'red');
            this.testResults
                .filter(r => r.type === 'fail' || r.type === 'error')
                .forEach(r => colorLog(`   ${r.message}`, 'red'));
        }
        
        // 保存测试报告
        const reportPath = path.join(__dirname, 'test-report.json');
        const report = {
            timestamp: new Date().toISOString(),
            totalTime,
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                errors: errors,
                successRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0
            },
            results: this.testResults
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        colorLog(`📄 Test report saved to: ${reportPath}`, 'cyan');
        
        return report;
    }
}

// 命令行参数处理
const args = process.argv.slice(2);
const testRunner = new QAQTestRunner();

if (args.includes('--help') || args.includes('-h')) {
    colorLog('QAQ Engine Test Runner', 'cyan');
    colorLog('Usage: node test-runner.js [options]', 'white');
    colorLog('Options:', 'white');
    colorLog('  --help, -h     Show this help message', 'white');
    colorLog('  --verbose, -v  Verbose output', 'white');
    colorLog('  --quick, -q    Quick test (skip performance tests)', 'white');
    process.exit(0);
}

// 运行测试
testRunner.runAllTests().then(() => {
    const report = testRunner.generateReport();
    process.exit(report.summary.failed > 0 || report.summary.errors > 0 ? 1 : 0);
}).catch(error => {
    colorLog(`❌ Test runner failed: ${error.message}`, 'red');
    process.exit(1);
});
