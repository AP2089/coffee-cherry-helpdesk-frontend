<template>
  <div class="flex min-h-dvh items-center justify-center px-4">
    <Card class="w-full max-w-sm border-border bg-card">
      <CardContent class="p-6">
        <form @submit="onSubmit">
          <BrandLogo size="lg" />
          <p class="mt-1 text-sm text-muted-foreground">Helpdesk</p>

          <div class="mt-6 space-y-4">
            <div class="space-y-2">
              <Label class="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                Логин
              </Label>
              <Input
                v-model="username"
                v-bind="usernameAttrs"
                type="text"
                autocomplete="username"
              />
              <p v-if="errors.username" class="text-xs text-destructive">{{ errors.username }}</p>
            </div>

            <div class="space-y-2">
              <Label class="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                Пароль
              </Label>
              <Input
                v-model="password"
                v-bind="passwordAttrs"
                type="password"
                autocomplete="current-password"
              />
              <p v-if="errors.password" class="text-xs text-destructive">{{ errors.password }}</p>
            </div>
          </div>

          <Alert v-if="auth.error" variant="destructive" class="mt-4">
            <AlertDescription>{{ errorMessage }}</AlertDescription>
          </Alert>

          <Button
            type="submit"
            variant="magnetic-filled"
            class="mt-6 w-full px-4 py-3"
            :disabled="auth.loading"
          >
            {{ auth.loading ? 'Вход…' : 'Войти' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

definePageMeta({
  layout: false,
  ssr: false,
})

const auth = useAuthStore()

const validationSchema = toTypedSchema(
  z.object({
    username: z.string().trim().min(1, 'Введите логин'),
    password: z.string().min(1, 'Введите пароль'),
  }),
)

const { handleSubmit, defineField, errors } = useForm({
  validationSchema,
  initialValues: {
    username: '',
    password: '',
  },
})

const [username, usernameAttrs] = defineField('username')
const [password, passwordAttrs] = defineField('password')

const errorMessage = computed(() => {
  if (auth.error === 'Invalid credentials' || auth.error === 'Unauthorized') {
    return 'Неверный логин или пароль'
  }

  if (auth.error === 'Route not found') {
    return 'Backend недоступен — проверьте, что сервер запущен на порту 3013'
  }

  return auth.error || 'Не удалось войти'
})

const onSubmit = handleSubmit(async (values) => {
  try {
    await auth.login(values.username, values.password)
    await navigateTo('/')
  } catch {
    // error in store
  }
})
</script>
