import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { pwaManifest } from './src/pwa/manifest'

const apiProxyTarget =
  process.env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:8787'

function getGitValue(command: string): string {
  try {
    return execSync(`git ${command}`, { encoding: 'utf8' }).trim()
  } catch {
    return ''
  }
}

const buildCommitId = getGitValue('rev-parse --short HEAD') || 'unknown'
const buildCommitDate = getGitValue('log -1 --format=%cI')

export default defineConfig({
  define: {
    __BUILD_COMMIT_ID__: JSON.stringify(buildCommitId),
    __BUILD_COMMIT_DATE__: JSON.stringify(buildCommitDate),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'app-icon.svg'],
      manifest: pwaManifest,
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
})
