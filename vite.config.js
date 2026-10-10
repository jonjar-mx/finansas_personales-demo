import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:4000'
const hmrClientPort = process.env.VITE_HMR_CLIENT_PORT ? Number(process.env.VITE_HMR_CLIENT_PORT) : undefined

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Listen on all network interfaces
    allowedHosts: ['finanzas.jonjar.space'],
    port: 3000,
    strictPort: true,
    watch: {
      usePolling: true, // Required for docker bind mounts
      interval: 1000,
      ignored: ['**/dist/**']
    },
    hmr: hmrClientPort ? { clientPort: hmrClientPort } : undefined,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true
      }
    }
  }
})
