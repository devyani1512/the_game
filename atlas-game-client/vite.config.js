import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/', // ensures assets and CSS load correctly in production
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
