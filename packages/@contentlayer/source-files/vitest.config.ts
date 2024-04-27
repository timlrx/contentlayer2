import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    deps: {
      moduleDirectories: ['node_modules', path.resolve('../../../packages')],
    },
  },
})
