
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Cho phép sử dụng process.env.API_KEY trên Vercel
    'process.env': process.env
  },
  build: {
    target: 'esnext',
    outDir: 'dist'
  }
});
