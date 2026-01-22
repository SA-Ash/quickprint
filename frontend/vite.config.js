import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        host: true, // Allow external access
        proxy: {
            // Proxy API requests to backend during development
            '/api': {
                target: process.env.VITE_API_BASE_URL || 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        // Optimize chunk size
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    animations: ['framer-motion'],
                    charts: ['recharts'],
                },
            },
        },
    },
    // Preview server config (for production preview)
    preview: {
        port: 4173,
        host: true,
    },
})
