import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' // 1. Import the plugin

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 2. Add the plugin to the plugins array
    VitePWA({ 
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        // This will use the manifest.json we created in the public folder
        // You can also define it here if you prefer
      }
    })
  ],
})