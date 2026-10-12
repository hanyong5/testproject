import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { trafficSignalsPlugin } from './server/trafficSignals.mjs'



// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
  envPrefix: ['VITE_KAKAO_', 'VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'],
  plugins: [react(), tailwindcss(), trafficSignalsPlugin(env.VITE_TDATA_API_KEY)],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  };
})
