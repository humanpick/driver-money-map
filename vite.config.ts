import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';

// App.tsx의 APP_VERSION을 읽어 public/version.json을 자동 생성하는 플러그인
const syncVersionPlugin = () => ({
  name: 'sync-version-json',
  buildStart() {
    try {
      const appPath = path.resolve(process.cwd(), 'src/App.tsx');
      const appCode = fs.readFileSync(appPath, 'utf-8');
      const match = appCode.match(/const\s+APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
      if (match && match[1]) {
        const publicDir = path.resolve(process.cwd(), 'public');
        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
        fs.writeFileSync(
          path.resolve(publicDir, 'version.json'),
          JSON.stringify({ version: match[1] }, null, 2)
        );
      }
    } catch (e) {
      console.error('version.json 자동 생성 실패:', e);
    }
  },
});

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: '탁송대리비서 PRO',
        short_name: '탁송대리비서',
        description: '탁송·대리 기사 전용 운행 일지 및 정산 장부',
        theme_color: '#0B1120',
        background_color: '#0B1120',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
    syncVersionPlugin(),
  ],
});
