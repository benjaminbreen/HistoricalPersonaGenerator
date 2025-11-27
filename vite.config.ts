import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
  },
  esbuild: {
    // Allow duplicate object keys (last one wins) - these are present in data files
    logOverride: { 'duplicate-object-key': 'silent' },
  },
})
