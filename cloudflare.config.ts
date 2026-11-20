import { defineConfig } from 'cf/config';

// ชื่อ Worker = ชื่อลิงก์เกม (<ชื่อ>.<บัญชี>.workers.dev) — เปลี่ยน 'my-game' เป็นชื่อเกมภาษาอังกฤษตัวเล็ก ใช้ - แทนช่องว่าง
// ตอนนี้เป็นหน้าเว็บอย่างเดียว (ไฟล์ใน public/ + index.html) · อยากมีร้านค้า ดู extras/shop/README.md
export default defineConfig({
  worker: {
    name: 'my-game',
    compatibilityDate: '2026-11-10'
  }
});
