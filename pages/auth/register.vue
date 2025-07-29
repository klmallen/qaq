<!--
QAQ游戏引擎 - 用户注册页面

功能说明：
- 提供用户注册表单
- 支持邮箱密码注册
- 集成第三方注册（Google、GitHub、Apple）
- 表单验证和错误处理
- 响应式设计

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
          {{ t('auth.joinTitle') || '加入 QAQ 游戏引擎' }}
        </h2>
        <p class="text-gray-400">
          {{ t('auth.registerDescription') || '创建您的账户，开始游戏开发之旅' }}
        </p>
      </div>

      <!-- 注册表单 -->
      <div class="bg-gray-900 rounded-lg p-8 shadow-xl">
        <form @submit.prevent="handleRegister" class="space-y-6">
          <!-- 姓名输入 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="firstName" class="block text-sm font-medium text-gray-300 mb-2">
                {{ t('auth.firstName') }}
              </label>
              <UInput
                id="firstName"
                v-model="form.firstName"
                type="text"
                :placeholder="t('forms.placeholder.firstName')"
                size="lg"
                :disabled="isLoading"
                :error="!!errors.firstName"
                class="w-full"
              />
              <p v-if="errors.firstName" class="mt-1 text-sm text-red-400">
                {{ errors.firstName }}
              </p>
            </div>

            <div>
              <label for="lastName" class="block text-sm font-medium text-gray-300 mb-2">
                {{ t('auth.lastName') }}
              </label>
              <UInput
                id="lastName"
                v-model="form.lastName"
                type="text"
                :placeholder="t('forms.placeholder.lastName')"
                size="lg"
                :disabled="isLoading"
                :error="!!errors.lastName"
                class="w-full"
              />
              <p v-if="errors.lastName" class="mt-1 text-sm text-red-400">
                {{ errors.lastName }}
              </p>
            </div>
          </div>

          <!-- 邮箱输入 -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
              {{ t('auth.email') }} *
            </label>
            <UInput
              id="email"
              v-model="form.email"
              type="email"
              :placeholder="t('forms.placeholder.email')"
              size="lg"
              :disabled="isLoading"
              :error="!!errors.email"
              class="w-full"
              required
            />
            <p v-if="errors.email" class="mt-1 text-sm text-red-400">
              {{ errors.email }}
            </p>
          </div>

          <!-- 用户名输入 -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-300 mb-2">
              {{ t('auth.username') }}（{{ t('forms.optional') }}）
            </label>
            <UInput
              id="username"
              v-model="form.username"
              type="text"
              :placeholder="t('forms.placeholder.username')"
              size="lg"
              :disabled="isLoading"
              :error="!!errors.username"
              class="w-full"
            />
            <p v-if="errors.username" class="mt-1 text-sm text-red-400">
              {{ errors.username }}
            </p>
          </div>

          <!-- 密码输入 -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
              {{ t('auth.password') }} *
            </label>
            <UInput
              id="password"
              v-model="form.password"
              type="password"
              :placeholder="t('forms.placeholder.password')"
              size="lg"
              :disabled="isLoading"
              :error="!!errors.password"
              class="w-full"
              required
            />
            <p v-if="errors.password" class="mt-1 text-sm text-red-400">
              {{ errors.password }}
            </p>
          </div>

          <!-- 确认密码输入 -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-300 mb-2">
              {{ t('auth.confirmPassword') }} *
            </label>
            <UInput
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              :placeholder="t('forms.placeholder.confirmPassword')"
              size="lg"
              :disabled="isLoading"
              :error="!!errors.confirmPassword"
              class="w-full"
              required
            />
            <p v-if="errors.confirmPassword" class="mt-1 text-sm text-red-400">
              {{ errors.confirmPassword }}
            </p>
          </div>

          <!-- 服务条款同意 -->
          <div>
            <UCheckbox
              v-model="form.agreeToTerms"
              :disabled="isLoading"
              :error="!!errors.agreeToTerms"
              required
            >
              <template #label>
                <span class="text-gray-300">
                  {{ t('auth.agreeToTermsPrefix') || '我同意' }}
                  <NuxtLink to="/terms" class="text-primary-400 hover:text-primary-300">
                    {{ t('auth.termsOfService') || '服务条款' }}
                  </NuxtLink>
                  {{ t('auth.and') || '和' }}
                  <NuxtLink to="/privacy" class="text-primary-400 hover:text-primary-300">
                    {{ t('auth.privacyPolicy') || '隐私政策' }}
                  </NuxtLink>
                </span>
              </template>
            </UCheckbox>
            <p v-if="errors.agreeToTerms" class="mt-1 text-sm text-red-400">
              {{ errors.agreeToTerms }}
            </p>
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

          <!-- 注册按钮 -->
          <UButton
            type="submit"
            size="lg"
            :loading="isLoading"
            :disabled="!isFormValid"
            class="w-full"
            color="primary"
          >
            <template #leading>
              <Icon name="heroicons:user-plus" />
            </template>
            {{ isLoading ? t('status.loading') : t('auth.createAccount') || '创建账户' }}
          </UButton>
        </form>

        <!-- 分割线 -->
        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-600" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-gray-800 text-gray-400">或者</span>
            </div>
          </div>
        </div>

        <!-- 第三方注册 -->
        <div class="mt-6 space-y-3">
          <UButton
            variant="outline"
            size="lg"
            class="w-full"
            :disabled="isLoading"
            @click="handleSocialRegister('google')"
          >
            <template #leading>
              <Icon name="logos:google-icon" />
            </template>
            使用 Google 注册
          </UButton>

          <UButton
            variant="outline"
            size="lg"
            class="w-full"
            :disabled="isLoading"
            @click="handleSocialRegister('github')"
          >
            <template #leading>
              <Icon name="logos:github-icon" />
            </template>
            {{ t('auth.registerWithGitHub') || '使用 GitHub 注册' }}
          </UButton>

          <UButton
            variant="outline"
            size="lg"
            class="w-full"
            :disabled="isLoading"
            @click="handleSocialRegister('apple')"
          >
            <template #leading>
              <Icon name="logos:apple" />
            </template>
            使用 Apple 注册
          </UButton>
        </div>

        <!-- 登录链接 -->
        <div class="mt-6 text-center">
          <p class="text-gray-400">
            {{ t('auth.alreadyHaveAccount') || '已有账户？' }}
            <NuxtLink
              to="/auth/login"
              class="text-primary-400 hover:text-primary-300 font-medium transition-colors"
            >
              {{ t('auth.signInNow') || '立即登录' }}
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 注册页面逻辑
 */

// 页面元数据
definePageMeta({
  layout: false, // 不使用默认布局
  middleware: [] // 不使用认证中间件
})

// 页面SEO
useSeoMeta({
  title: '注册 - QAQ游戏引擎',
  description: '注册QAQ游戏引擎账户，开始您的游戏开发之旅'
})

// 状态管理和i18n
const authStore = useAuthStore()
const router = useRouter()
const { t } = useI18n()

// 通知系统 - 简化版本，直接使用toast
const toast = useToast()

const showRegistrationSuccess = (email: string, redirectDelay: number = 3000) => {
  toast.add({
    title: t('auth.registerSuccess'),
    description: t('auth.registerSuccessMessage', { seconds: redirectDelay / 1000 }) || `注册成功！欢迎加入QAQ游戏引擎。${redirectDelay / 1000}秒后将自动跳转到登录页面。`,
    icon: 'i-heroicons-check-circle',
    color: 'green',
    timeout: redirectDelay
  })
}

// 表单数据
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: false
})

// 表单验证错误
const errors = reactive({
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: ''
})

// 加载状态
const isLoading = computed(() => authStore.isLoading)

// 表单验证
const isFormValid = computed(() => {
  return form.email.length > 0 &&
         form.password.length > 0 &&
         form.confirmPassword.length > 0 &&
         form.agreeToTerms &&
         !Object.values(errors).some(error => error)
})

/**
 * 验证邮箱格式
 */
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证用户名格式
 */
const validateUsername = (username: string): boolean => {
  if (!username) return true // 用户名是可选的
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/
  return usernameRegex.test(username)
}

/**
 * 表单验证
 */
const validateForm = (): boolean => {
  // 清除之前的错误
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })

  let isValid = true

  // 验证邮箱
  if (!form.email) {
    errors.email = '请输入邮箱地址'
    isValid = false
  } else if (!validateEmail(form.email)) {
    errors.email = '请输入有效的邮箱地址'
    isValid = false
  }

  // 验证用户名
  if (form.username && !validateUsername(form.username)) {
    errors.username = '用户名只能包含字母、数字、下划线和连字符，长度3-20位'
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

  // 验证确认密码
  if (!form.confirmPassword) {
    errors.confirmPassword = '请确认密码'
    isValid = false
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = '两次输入的密码不一致'
    isValid = false
  }

  // 验证服务条款同意
  if (!form.agreeToTerms) {
    errors.agreeToTerms = '请同意服务条款和隐私政策'
    isValid = false
  }

  return isValid
}

/**
 * 处理注册提交
 */
const handleRegister = async (): Promise<void> => {
  // 表单验证
  if (!validateForm()) {
    return
  }

  try {
    // 调用注册API
    const success = await authStore.register({
      email: form.email,
      password: form.password,
      confirmPassword: form.confirmPassword,
      firstName: form.firstName || undefined,
      lastName: form.lastName || undefined,
      username: form.username || undefined
    })

    if (success) {
      // 显示注册成功通知并自动跳转到登录页
      showRegistrationSuccess(form.email, 3000)

      // 3秒后跳转到登录页，并预填邮箱
      setTimeout(() => {
        router.push({
          path: '/auth/login',
          query: { email: form.email }
        })
      }, 3000)
    }
  } catch (error) {
    console.error('注册失败:', error)
    // 错误信息已经在store中处理，这里不需要额外处理
  }
}

/**
 * 处理第三方注册
 */
const handleSocialRegister = async (provider: 'google' | 'github' | 'apple'): Promise<void> => {
  try {
    // TODO: 实现第三方注册逻辑
    console.log(`使用 ${provider} 注册`)

    // 这里应该调用相应的第三方注册API
    // 暂时显示提示信息
    const toast = useToast()
    toast.add({
      title: '功能开发中',
      description: `${provider} 注册功能正在开发中，敬请期待！`,
      color: 'blue'
    })
  } catch (error) {
    console.error(`${provider} 注册失败:`, error)
  }
}

/**
 * 监听表单变化，清除对应的错误信息
 */
watch(() => form.email, () => {
  if (errors.email) errors.email = ''
})

watch(() => form.username, () => {
  if (errors.username) errors.username = ''
})

watch(() => form.password, () => {
  if (errors.password) errors.password = ''
  if (errors.confirmPassword && form.confirmPassword) {
    errors.confirmPassword = ''
  }
})

watch(() => form.confirmPassword, () => {
  if (errors.confirmPassword) errors.confirmPassword = ''
})

watch(() => form.agreeToTerms, () => {
  if (errors.agreeToTerms) errors.agreeToTerms = ''
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
