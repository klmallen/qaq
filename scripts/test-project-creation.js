/**
 * QAQ游戏引擎 - 项目创建测试脚本
 *
 * 测试项目创建API是否正常工作
 */

async function testProjectCreation() {
  console.log('🧪 开始测试项目创建功能...')

  try {
    // 1. 首先测试登录
    console.log('🔐 测试用户登录...')
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@qaq-engine.com',
        password: 'admin123'
      })
    })

    const loginData = await loginResponse.json()

    if (!loginData.success) {
      throw new Error('登录失败: ' + loginData.message)
    }

    console.log('✅ 登录成功!')
    const token = loginData.data.accessToken

    // 2. 测试项目列表获取
    console.log('📋 测试获取项目列表...')
    const projectsResponse = await fetch('http://localhost:3000/api/projects', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    const projectsData = await projectsResponse.json()

    console.log('✅ 项目列表获取成功:', {
      count: projectsData.data?.projects?.length || 0,
      total: projectsData.data?.total || 0
    })

    // 3. 测试项目创建
    console.log('🚀 测试项目创建...')
    const createResponse = await fetch('http://localhost:3000/api/projects/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Project ' + Date.now(),
        location: 'C:/temp/test-projects',
        description: 'Test project created by automated script',
        template: 'empty'
      })
    })

    const createData = await createResponse.json()

    if (createData.success) {
      console.log('✅ 项目创建成功!')
      console.log('📊 项目信息:', {
        id: createData.data.project.id,
        name: createData.data.project.name,
        path: createData.data.project.path
      })
    } else {
      throw new Error('项目创建失败: ' + createData.message)
    }

    console.log('🎉 所有测试通过!')

  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    if (error.data) {
      console.error('错误详情:', error.data)
    }
    process.exit(1)
  }
}

// 运行测试
testProjectCreation()
