import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  shims: false,
  treeshake: true,
  minify: false,
  target: 'node16',
  platform: 'node',
  external: ['@ldesign/git-core']
})