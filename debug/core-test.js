/**
 * QAQ游戏引擎核心功能测试
 * 纯JavaScript环境，不依赖Vue/Nuxt
 */

// 模拟浏览器环境（如果在Node.js中运行）
if (typeof window === 'undefined') {
    global.window = {};
    global.document = {
        createElement: () => ({ style: {} }),
        addEventListener: () => {},
        querySelector: () => null,
        body: {}
    };
    global.HTMLCanvasElement = class {};
}

// 导入THREE.js（在浏览器环境中需要先加载THREE.js）
// <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

class QAQCoreTest {
    constructor() {
        this.testResults = [];
        this.engine = null;
        this.scene = null;
        this.camera = null;
        
        console.log('🚀 QAQ Engine Core Test initialized');
    }
    
    // 日志记录
    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
        console.log(logEntry);
        this.testResults.push({ timestamp, type, message });
    }
    
    // 断言函数
    assert(condition, message) {
        if (condition) {
            this.log(`✅ PASS: ${message}`, 'pass');
            return true;
        } else {
            this.log(`❌ FAIL: ${message}`, 'fail');
            return false;
        }
    }
    
    // 测试Engine类的基础功能
    async testEngineBasics() {
        this.log('🔧 Testing Engine basics...');
        
        try {
            // 测试Engine单例
            const Engine = (await import('../core/engine/Engine.js')).default;
            const engine1 = Engine.getInstance();
            const engine2 = Engine.getInstance();
            
            this.assert(engine1 === engine2, 'Engine singleton pattern works');
            this.assert(typeof engine1.setCurrentCamera === 'function', 'Engine has setCurrentCamera method');
            this.assert(typeof engine1.getCurrentCamera === 'function', 'Engine has getCurrentCamera method');
            
            this.engine = engine1;
            
        } catch (error) {
            this.log(`❌ Engine test failed: ${error.message}`, 'error');
        }
    }
    
    // 测试Camera3D类的基础功能
    async testCamera3DBasics() {
        this.log('📷 Testing Camera3D basics...');
        
        try {
            const { Camera3D } = await import('../core/nodes/3d/Camera3D.js');
            
            // 创建相机实例
            const camera = new Camera3D('TestCamera');
            this.camera = camera;
            
            this.assert(camera.name === 'TestCamera', 'Camera3D name property works');
            this.assert(typeof camera.position === 'object', 'Camera3D has position property');
            this.assert(typeof camera.rotation === 'object', 'Camera3D has rotation property');
            this.assert(typeof camera.makeCurrent === 'function', 'Camera3D has makeCurrent method');
            this.assert(typeof camera.lookAt === 'function', 'Camera3D has lookAt method');
            this.assert(typeof camera.setPerspective === 'function', 'Camera3D has setPerspective method');
            
        } catch (error) {
            this.log(`❌ Camera3D test failed: ${error.message}`, 'error');
        }
    }
    
    // 测试相机位置设置
    testCameraPosition() {
        this.log('📍 Testing Camera3D position mapping...');
        
        if (!this.camera) {
            this.log('❌ No camera available for position test', 'error');
            return;
        }
        
        try {
            // 测试位置设置
            const testPositions = [
                { x: 0, y: 0, z: 0 },
                { x: 10, y: 20, z: 30 },
                { x: -5, y: -10, z: -15 },
                { x: 0, y: -200, z: -30 } // 极端位置
            ];
            
            testPositions.forEach((pos, index) => {
                this.camera.position = pos;
                
                // 验证位置是否正确设置
                const actualPos = this.camera.position;
                const positionMatch = Math.abs(actualPos.x - pos.x) < 0.001 &&
                                    Math.abs(actualPos.y - pos.y) < 0.001 &&
                                    Math.abs(actualPos.z - pos.z) < 0.001;
                
                this.assert(positionMatch, `Position test ${index + 1}: (${pos.x}, ${pos.y}, ${pos.z})`);
                
                // 如果有THREE.js对象，检查同步
                if (this.camera.object3D && this.camera.object3D.position) {
                    const threePos = this.camera.object3D.position;
                    const threeSync = Math.abs(threePos.x - pos.x) < 0.001 &&
                                    Math.abs(threePos.y - pos.y) < 0.001 &&
                                    Math.abs(threePos.z - pos.z) < 0.001;
                    
                    this.assert(threeSync, `THREE.js sync test ${index + 1}`);
                }
            });
            
        } catch (error) {
            this.log(`❌ Position test failed: ${error.message}`, 'error');
        }
    }
    
    // 测试相机激活机制
    testCameraActivation() {
        this.log('🎥 Testing Camera3D activation...');
        
        if (!this.camera || !this.engine) {
            this.log('❌ No camera or engine available for activation test', 'error');
            return;
        }
        
        try {
            // 测试makeCurrent方法
            this.camera.makeCurrent();
            
            this.assert(this.camera.current === true, 'Camera current property set to true');
            
            // 测试Engine的getCurrentCamera
            const currentCamera = this.engine.getCurrentCamera();
            this.assert(currentCamera === this.camera, 'Engine returns correct current camera');
            
        } catch (error) {
            this.log(`❌ Activation test failed: ${error.message}`, 'error');
        }
    }
    
    // 测试相机投影参数
    testCameraProjection() {
        this.log('🔭 Testing Camera3D projection...');
        
        if (!this.camera) {
            this.log('❌ No camera available for projection test', 'error');
            return;
        }
        
        try {
            // 测试透视投影设置
            this.camera.setPerspective(75, 0.1, 1000);
            
            // 如果有THREE.js相机对象，验证参数传递
            if (this.camera._perspectiveCamera) {
                const threeCamera = this.camera._perspectiveCamera;
                this.assert(Math.abs(threeCamera.fov - 75) < 0.001, 'FOV parameter passed correctly');
                this.assert(Math.abs(threeCamera.near - 0.1) < 0.001, 'Near parameter passed correctly');
                this.assert(Math.abs(threeCamera.far - 1000) < 0.001, 'Far parameter passed correctly');
            }
            
        } catch (error) {
            this.log(`❌ Projection test failed: ${error.message}`, 'error');
        }
    }
    
    // 测试lookAt功能
    testCameraLookAt() {
        this.log('👁️ Testing Camera3D lookAt...');
        
        if (!this.camera) {
            this.log('❌ No camera available for lookAt test', 'error');
            return;
        }
        
        try {
            // 设置相机位置
            this.camera.position = { x: 10, y: 10, z: 10 };
            
            // 测试lookAt
            const target = { x: 0, y: 0, z: 0 };
            this.camera.lookAt(target);
            
            // 验证相机朝向（这个比较复杂，简单检查是否没有抛出错误）
            this.assert(true, 'lookAt method executed without errors');
            
        } catch (error) {
            this.log(`❌ LookAt test failed: ${error.message}`, 'error');
        }
    }
    
    // 性能测试
    performanceTest() {
        this.log('⚡ Running performance tests...');
        
        if (!this.camera) {
            this.log('❌ No camera available for performance test', 'error');
            return;
        }
        
        try {
            // 测试大量位置设置的性能
            const startTime = performance.now();
            const iterations = 1000;
            
            for (let i = 0; i < iterations; i++) {
                this.camera.position = {
                    x: Math.random() * 100 - 50,
                    y: Math.random() * 100 - 50,
                    z: Math.random() * 100 - 50
                };
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            const avgTime = duration / iterations;
            
            this.log(`📊 Position setting performance: ${avgTime.toFixed(3)}ms per operation`);
            this.assert(avgTime < 1, 'Position setting performance is acceptable (< 1ms)');
            
        } catch (error) {
            this.log(`❌ Performance test failed: ${error.message}`, 'error');
        }
    }
    
    // 运行所有测试
    async runAllTests() {
        this.log('🧪 Starting QAQ Engine Core Tests...');
        this.log('=====================================');
        
        await this.testEngineBasics();
        await this.testCamera3DBasics();
        this.testCameraPosition();
        this.testCameraActivation();
        this.testCameraProjection();
        this.testCameraLookAt();
        this.performanceTest();
        
        this.log('=====================================');
        this.generateReport();
    }
    
    // 生成测试报告
    generateReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.type === 'pass').length;
        const failedTests = this.testResults.filter(r => r.type === 'fail').length;
        const errors = this.testResults.filter(r => r.type === 'error').length;
        
        this.log('📊 TEST REPORT');
        this.log(`Total Tests: ${totalTests}`);
        this.log(`Passed: ${passedTests} ✅`);
        this.log(`Failed: ${failedTests} ❌`);
        this.log(`Errors: ${errors} 🚨`);
        this.log(`Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
        
        if (failedTests > 0 || errors > 0) {
            this.log('🚨 FAILED TESTS:');
            this.testResults
                .filter(r => r.type === 'fail' || r.type === 'error')
                .forEach(r => this.log(`   ${r.message}`));
        }
        
        return {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            errors: errors,
            successRate: (passedTests / (passedTests + failedTests)) * 100
        };
    }
    
    // 导出测试结果
    exportResults() {
        return {
            timestamp: new Date().toISOString(),
            results: this.testResults,
            summary: this.generateReport()
        };
    }
}

// 如果在浏览器环境中，自动运行测试
if (typeof window !== 'undefined') {
    window.QAQCoreTest = QAQCoreTest;
    
    // 自动运行测试
    window.addEventListener('load', async () => {
        const tester = new QAQCoreTest();
        await tester.runAllTests();
        
        // 将结果暴露到全局
        window.qaqTestResults = tester.exportResults();
    });
}

// Node.js环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QAQCoreTest;
}

// ES模块导出
export default QAQCoreTest;
