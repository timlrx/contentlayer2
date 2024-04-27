import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // If we still need to use the vitest 0.12.10
    // See README.md for more information why this is needed
    // threads: false,
    deps: {
      moduleDirectories: ['node_modules', path.resolve('../../packages')],
    },
  },
})
