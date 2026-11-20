import { cloudflare } from '@cloudflare/vite-plugin';
import { defineConfig } from 'vite';

// เกมเป็นไฟล์ธรรมดาใน public/ ไม่ต้อง bundle · host: true = มือถือในวง Wi-Fi เดียวกันเปิดลิงก์ Network ได้
export default defineConfig({
  plugins: [cloudflare()],
  server: { port: 8100, host: true }
});
