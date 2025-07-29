<!--
QAQ游戏引擎 - 用户登录页面

功能说明：
- 提供用户登录表单
- 支持邮箱密码登录
- 集成第三方登录（Google、GitHub、Apple）
- 响应式设计，适配各种屏幕尺寸
- 表单验证和错误处理

作者：QAQ游戏引擎团队
创建时间：2024年
-->

<template>
  <div class="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- 头部Logo和标题 -->
      <div class="text-center">
        <div class="mx-auto h-16 w-16 bg-primary-500 rounded-lg flex items-center justify-center mb-4">
          <Icon name="heroicons:cube" class="h-8 w-8 text-white" />
        </div>
        <h2 class="text-3xl font-bold text-white mb-2">
          {{ t('auth.login') }} {{ t('welcome.title') }}
        </h2>
        <p class="text-gray-400">
          {{ t('auth.loginDescription') || '使用您的账户访问项目和资源' }}
        </p>
      </div>

      <!-- 登录表单 -->
      <div class="bg-gray-900 rounded-lg p-8 shadow-xl">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- 邮箱输入 -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
              {{ t('auth.email') }}
            </label>
            <UInput
              id="email"
              v-model="form.email"
              type="email"
              :placeholder="t('forms.placeholder.email')"
              size="lg"
              :disabled="authStore.isLoading"
              :error="!!errors.email"
              class="w-full"
              required
            />
            <p v-if="errors.email" class="mt-1 text-sm text-red-400">
              {{ errors.email }}
            </p>
          </div>

          <!-- 密码输入 -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
              {{ t('auth.password') }}
            </label>
            <UInput
              id="password"
              v-model="form.password"
              type="password"
              :placeholder="t('forms.placeholder.password')"
              size="lg"
              :disabled="authStore.isLoading"
              :error="!!errors.password"
              class="w-full"
              required
            />
            <p v-if="errors.password" class="mt-1 text-sm text-red-400">
              {{ errors.password }}
            </p>
          </div>

          <!-- 记住我和忘记密码 -->
          <div class="flex items-center justify-between">
            <UCheckbox
              v-model="form.rememberMe"
              :label="t('auth.rememberMe')"
              :disabled="authStore.isLoading"
            />
            <NuxtLink
              to="/auth/forgot-password"
              class="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              {{ t('auth.forgotPassword') }}
            </NuxtLink>
          </div>

          <!-- 错误信息显示 -->
          <UAlert
            v-if="authStore.error"
            icon="i-heroicons-exclamation-triangle"
            color="red"
            variant="soft"
            :title="authStore.error"
            :close-button="{ icon: 'i-heroicons-x-mark-20-solid', color: 'gray', variant: 'link', padded: false }"
            @close="authStore.clearError()"
          />

          <!-- 登录按钮 -->
          <UButton
            type="submit"
            size="lg"
            :loading="authStore.isLoading"
            :disabled="authStore.isLoading || !isFormValid"
            class="w-full"
            color="primary"
          >
            <template #leading>
              <Icon
                :name="authStore.isLoading ? 'heroicons:arrow-path' : 'heroicons:arrow-right-on-rectangle'"
                :class="{ 'animate-spin': authStore.isLoading }"
              />
            </template>
            {{ authStore.isLoading ? t('status.loading') : t('auth.login') }}
          </UButton>
        </form>

        <!-- 分割线 -->
        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-600" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-gray-900 text-gray-400">或者</span>
            </div>
          </div>
        </div>

        <!-- 第三方登录 -->
        <div class="mt-6 space-y-3">
          <UButton
            variant="outline"
            size="lg"
            class="w-full"
            :disabled="isLoading"
            @click="handleSocialLogin('google')"
          >
            <template #leading>
              <Icon name="logos:google-icon" />
            </template>
            {{ t('auth.loginWithGoogle') || '使用 Google 登录' }}
          </UButton>

          <UButton
            variant="outline"
            size="lg"
            class="w-full"
            :disabled="isLoading"
            @click="handleSocialLogin('github')"
          >
            <template #leading>
              <Icon name="logos:github-icon" />
            </template>
            使用 GitHub 登录
          </UButton>

          <UButton
            variant="outline"
            size="lg"
            class="w-full"
            :disabled="isLoading"
            @click="handleSocialLogin('apple')"
          >
            <template #leading>
              <Icon name="logos:apple" />
            </template>
            使用 Apple 登录
          </UButton>
        </div>

        <!-- 注册链接 -->
        <div class="mt-6 text-center">
          <p class="text-gray-400">
            还没有账户？
            <NuxtLink
              to="/auth/register"
              class="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              立即注册
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 登录页面逻辑
 */

// 页面元数据
definePageMeta({
  layout: false, // 不使用默认布局
  middleware: [] // 不使用认证中间件
})

// 页面SEO
useSeoMeta({
  title: '登录 - QAQ游戏引擎',
  description: '登录到QAQ游戏引擎，开始您的游戏开发之旅'
})

// 状态管理和i18n
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()

// 通知系统 - 简化版本，直接使用toast
const toast = useToast()

const showLoginSuccess = (username: string) => {
  toast.add({
    title: t('auth.loginSuccess'),
    description: t('auth.welcomeBack', { username }) || `欢迎回来，${username}！`,
    icon: 'i-heroicons-check-circle',
    color: 'green',
    timeout: 3000
  })
}

// 表单数据
const form = reactive({
  email: '',
  password: '',
  rememberMe: false
})

// 表单验证错误
const errors = reactive({
  email: '',
  password: ''
})

// 加载状态
const isLoading = computed(() => authStore.isLoading)

// 表单验证
const isFormValid = computed(() => {
  return form.email.length > 0 &&
         form.password.length > 0 &&
         !errors.email &&
         !errors.password
})

/**
 * 验证邮箱格式
 */
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 表单验证
 */
const validateForm = (): boolean => {
  // 清除之前的错误
  errors.email = ''
  errors.password = ''

  let isValid = true

  // 验证邮箱
  if (!form.email) {
    errors.email = '请输入邮箱地址'
    isValid = false
  } else if (!validateEmail(form.email)) {
    errors.email = '请输入有效的邮箱地址'
    isValid = false
  }

  // 验证密码
  if (!form.password) {
    errors.password = '请输入密码'
    isValid = false
  } else if (form.password.length < 6) {
    errors.password = '密码长度至少6位'
    isValid = false
  }

  return isValid
}

/**
 * 处理登录提交
 */
const handleLogin = async (): Promise<void> => {
  // 表单验证
  if (!validateForm()) {
    return
  }

  try {
    // 调用登录API
    const success = await authStore.login({
      email: form.email,
      password: form.password,
      rememberMe: form.rememberMe
    })

    if (success) {
      // 显示登录成功通知
      const username = authStore.user?.firstName || authStore.user?.username || t('common.user') || '用户'
      showLoginSuccess(username)

      // 检查是否有重定向路径
      const redirectPath = route.query.redirect as string

      // 登录成功，重定向到目标页面或主页面
      if (redirectPath && redirectPath !== '/auth/login') {
        await router.push(redirectPath)
      } else {
        await router.push('/')
      }
    }
  } catch (error) {
    console.error(t('auth.loginFailed') + ':', error)
  }
}

/**
 * 页面挂载时的初始化
 */
onMounted(() => {
  // 如果URL中有email参数（来自注册页面），预填邮箱
  const emailFromQuery = route.query.email as string
  if (emailFromQuery) {
    form.email = emailFromQuery
    console.log('✅ 已预填邮箱:', emailFromQuery)
  }
})

/**
 * 处理第三方登录
 */
const handleSocialLogin = async (provider: 'google' | 'github' | 'apple'): Promise<void> => {
  try {
    // TODO: 实现第三方登录逻辑
    console.log(`使用 ${provider} 登录`)

    // 这里应该调用相应的第三方登录API
    // 暂时显示提示信息
    const toast = useToast()
    toast.add({
      title: '功能开发中',
      description: `${provider} 登录功能正在开发中，敬请期待！`,
      color: 'blue'
    })
  } catch (error) {
    console.error(`${provider} 登录失败:`, error)
  }
}

/**
 * 监听表单变化，清除对应的错误信息
 */
watch(() => form.email, () => {
  if (errors.email) {
    errors.email = ''
  }
})

watch(() => form.password, () => {
  if (errors.password) {
    errors.password = ''
  }
})

/**
 * 页面挂载时检查是否已登录
 */
onMounted(async () => {
  // 如果用户已登录，重定向到主页面
  if (authStore.isAuthenticated) {
    await router.push('/editor')
  }
})
</script>

<style scoped>
/* 自定义样式 - 纯黑色主题 */
.bg-black {
  background: #000000;
}

.bg-gray-900 {
  background: rgba(10, 10, 10, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(26, 26, 26, 0.5);
}
</style>
