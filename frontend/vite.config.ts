import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In dev, /api calls go to the FastAPI server, so no CORS setup is needed locally.
    proxy: { '/api': 'http://localhost:8000' },
  },
})
