import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Invertify/', // GitHub Pages repository path for AllGitOut account
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})
