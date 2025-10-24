import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/cli/index.ts',
    'src/core/index.ts',
    'src/automation/index.ts',
    'src/analytics/index.ts',
    'src/hooks/index.ts',
    'src/submodule/index.ts',
    'src/conflict/index.ts',
    'src/types/index.ts',
    'src/utils/index.ts'
  ],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: ['simple-git', '@ldesign/kit', 'chalk', 'ora', 'cli-table3', 'boxen', 'inquirer', 'commander']
})


