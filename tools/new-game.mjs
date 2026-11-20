// สร้างโปรเจกต์เกมใหม่จากแม่แบบ Game Creator Kit
//   node <Kit>/tools/new-game.mjs <โฟลเดอร์ปลายทาง> [ชื่อเกม]
// ใช้ตอนติดตั้ง skill เป็นปลั๊กอิน แล้วเริ่มเกมในโฟลเดอร์เปล่า (skill เรียกให้อัตโนมัติ)
// ไม่เขียนทับไฟล์ที่มีอยู่แล้ว · ไม่คัดลอก .git / node_modules / ไฟล์ปลั๊กอิน
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dest = resolve(process.argv[2] || '.');
const name = (process.argv[3] || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
const SKIP = new Set(['.git', 'node_modules', '.claude-plugin', '.cloudflare', '.wrangler', 'dist', 'qr.png', '.dev.vars']);

if (resolve(KIT) === dest) { console.error('ปลายทางคือตัว Kit เอง — เลือกโฟลเดอร์อื่น'); process.exit(1); }
mkdirSync(dest, { recursive: true });

let copied = 0, kept = 0;
for (const f of readdirSync(KIT)) {
  if (SKIP.has(f)) continue;
  const to = join(dest, f);
  if (existsSync(to) && f !== '.claude') { kept++; continue; }
  cpSync(join(KIT, f), to, { recursive: true, force: false, errorOnExist: false });
  copied++;
}

// ตั้งชื่อเกม (ถ้าส่งมา) ใน package.json · cloudflare.config.ts · ONLINE.GAME_ID (ชื่อไทยในหน้าเกม/manifest ให้ skill ตั้งตอนออกแบบ)
if (name) {
  const edit = (file, fn) => { const p = join(dest, file); if (existsSync(p)) writeFileSync(p, fn(readFileSync(p, 'utf8'))); };
  edit('package.json', (s) => s.replace(/"name":\s*"my-game"/, `"name": "${name}"`));
  edit('cloudflare.config.ts', (s) => s.replace(/name:\s*'my-game'/, `name: '${name}'`));
  edit('public/config.js', (s) => s.replace(/GAME_ID:\s*'my-game'/, `GAME_ID: '${name}'`));}

console.log(`✅ สร้างเกมใหม่ที่ ${dest}`);
console.log(`   คัดลอก ${copied} รายการ${kept ? ` · เก็บไฟล์เดิมไว้ ${kept} รายการ (ไม่เขียนทับ)` : ''}${name ? ` · ชื่อเกม: ${name}` : ''}`);
console.log('   ต่อไป: npm install → npm run dev (เปิดดูเกมตัวอย่าง) → เล่าไอเดียเกมให้ AI ฟัง');
