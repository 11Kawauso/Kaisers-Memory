import { defineConfig } from 'vite'
import { resolve } from 'node:path'

export default defineConfig({
  // 相対パスにしておくと、GitHub Pages のどのURLに置いても動く
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        room: resolve(import.meta.dirname, 'room.html'),
      },
    },
  },
})
