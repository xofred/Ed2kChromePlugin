import { defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default defineConfig((configEnv) => {
  const baseConfig = typeof viteConfig === 'function' ? viteConfig(configEnv) : viteConfig
  
  return {
    ...baseConfig,
    test: {
      globals: true,
      environment: 'node',
      // 关键：排除 E2E 目录，避免 Vitest 错误运行 Playwright 的测试文件
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/tests/e2e/**',
      ],
      // 包含 src 目录下的单元测试
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}']
    },
  }
})
