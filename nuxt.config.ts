import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  ssr: true,
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  modules: ['@nuxt/eslint', 'shadcn-nuxt', '@pinia/nuxt', '@vueuse/nuxt'],

  shadcn: {
    prefix: '',
    componentDir: '@/components/ui',
  },

  vite: {
    plugins: [tailwindcss()],
  },

  eslint: {
    config: {
      stylistic: false,
    },
  },

  css: ['~/assets/scss/tailwind.css', '~/assets/scss/main.scss'],

  runtimeConfig: {
    apiUrl: '',
    public: {
      apiUrl: '',
      socketUrl: '',
    },
  },

  app: {
    head: {
      title: 'coffee cherry · helpdesk',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#0E0C0A' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.svg' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
})
