import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

// base: './' — чтобы сборка открывалась на GitHub Pages из любой папки репозитория
// mode single — один HTML-файл для быстрого просмотра без сервера
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'single' ? [vue(), viteSingleFile()] : [vue()],
  build: {
    outDir: mode === 'single' ? 'dist-single' : 'dist'
  }
}))
