import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    silent: true,
    onConsoleLog(log: string, type: 'stdout' | 'stderr'): boolean | void {
      if (log.includes('Could not parse CSS stylesheet')) return false;
    },
    css: false, // Avoid JSDOM parsing Tailwind v4 CSS to eliminate noise
  },
})
