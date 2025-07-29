# QAQ游戏引擎认证系统测试指南

## ✅ **问题已解决**

**问题**：Multiple `definePageMeta` calls are not supported  
**解决方案**：将两个 `definePageMeta` 调用合并为一个  
**状态**：✅ 已修复，开发服务器正常运行

## 🧪 **认证系统测试步骤**

### **1. 访问应用**
```
http://localhost:3000
```

### **2. 测试认证流程**

#### **步骤1：访问受保护的页面**
- 访问 `http://localhost:3000/editor`
- 应该自动重定向到 `http://localhost:3000/auth/login`

#### **步骤2：测试用户注册**
- 访问 `http://localhost:3000/auth/register`
- 填写注册表单：
  - 邮箱：test@example.com
  - 密码：password123
  - 名字：Test
  - 姓氏：User
- 点击"创建账户"按钮

#### **步骤3：测试用户登录**
- 访问 `http://localhost:3000/auth/login`
- 使用注册的凭据登录
- 登录成功后应该重定向到编辑器页面

#### **步骤4：验证编辑器集成**
- 检查编辑器右上角是否显示用户信息
- 点击用户头像下拉菜单
- 测试登出功能

### **3. 预期行为**

#### **✅ 正常情况**
- 未登录用户访问 `/editor` 自动重定向到 `/auth/login`
- 注册成功后自动登录并跳转到编辑器
- 登录成功后跳转到编辑器
- 编辑器显示用户信息和登出按钮
- 登出后清除会话并重定向到登录页面

#### **⚠️ 可能的问题**
1. **Prisma客户端未生成**
   - 错误：`@prisma/client` could not be resolved
   - 解决：运行 `npx prisma generate`

2. **数据库未初始化**
   - 错误：数据库表不存在
   - 解决：运行 `npx prisma db push`

3. **JWT密钥未设置**
   - 错误：JWT签名失败
   - 解决：设置环境变量 `JWT_SECRET`

### **4. 故障排除**

#### **如果注册/登录失败**
1. 检查浏览器开发者工具的网络标签
2. 查看服务器控制台的错误信息
3. 确认数据库连接正常

#### **如果页面重定向不工作**
1. 检查认证中间件是否正确加载
2. 确认 cookie 设置正确
3. 验证 JWT 令牌生成和验证

### **5. 数据库设置（如果需要）**

```bash
# 生成Prisma客户端
npx prisma generate

# 推送数据库schema
npx prisma db push

# 查看数据库内容
npx prisma studio
```

### **6. 环境变量设置**

创建 `.env` 文件：
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
DATABASE_URL=file:./dev.db
GLOBAL_DB_PATH=./global
```

## 🎯 **测试结果记录**

### **基础功能测试**
- [ ] 开发服务器启动成功
- [ ] 登录页面正常显示
- [ ] 注册页面正常显示
- [ ] 表单验证工作正常

### **认证流程测试**
- [ ] 用户注册成功
- [ ] 用户登录成功
- [ ] 会话管理正常
- [ ] 自动重定向工作

### **编辑器集成测试**
- [ ] 编辑器页面受保护
- [ ] 用户信息正确显示
- [ ] 登出功能正常
- [ ] 令牌刷新工作

### **API端点测试**
- [ ] POST /api/auth/register
- [ ] POST /api/auth/login
- [ ] POST /api/auth/logout
- [ ] GET /api/auth/me

## 📝 **已知限制**

1. **第三方登录**：Google、GitHub、Apple登录功能已预留接口但未实现
2. **邮箱验证**：新用户注册后需要邮箱验证功能未实现
3. **密码重置**：忘记密码功能未实现
4. **项目关联**：现有项目与用户关联需要数据迁移

## 🚀 **下一步开发**

1. **优先级高**：实现项目与用户关联
2. **优先级中**：添加邮箱验证和密码重置
3. **优先级低**：实现第三方登录集成

---

**测试完成后，请更新此文档记录测试结果！** ✅
