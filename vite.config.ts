import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages のサブパス公開に必須。これが無いとアセットが全て 404 になる。
  // 値は CI/CD (.github/workflows/*.yml) が VITE_BASE_PATH として渡す。
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
})
