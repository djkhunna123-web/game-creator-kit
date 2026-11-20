// npm run ship — ขึ้นเว็บ Cloudflare แล้วสร้าง QR ของลิงก์ในคำสั่งเดียว
// 1) cf deploy (+ คีย์ลับจาก .dev.vars)  2) หาลิงก์ .workers.dev จากผลลัพธ์  3) เขียน qr.png + พิมพ์ลิงก์
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import QRCode from 'qrcode';

// มีไฟล์ .dev.vars (คีย์ลับ เช่น Stripe) → ส่งขึ้นเป็น secret ของ Worker ไปพร้อมกัน
const args = ['cf', 'deploy', ...(existsSync('.dev.vars') ? ['--secrets-file', '.dev.vars'] : [])];

const out = await new Promise((resolve, reject) => {
  let text = '';
  const p = spawn('npx', args, { shell: true, stdio: ['inherit', 'pipe', 'pipe'] });
  p.stdout.on('data', (d) => { process.stdout.write(d); text += d; });
  p.stderr.on('data', (d) => { process.stderr.write(d); text += d; });
  p.on('close', (code) => (code === 0 ? resolve(text) : reject(new Error('deploy ไม่สำเร็จ (code ' + code + ')'))));
});

const url = (out.match(/https:\/\/[a-z0-9.-]+\.workers\.dev/i) || [])[0];
if (!url) { console.error('\nขึ้นเว็บแล้ว แต่หาลิงก์ในผลลัพธ์ไม่เจอ — ดูลิงก์ด้านบนแล้วสร้าง QR เอง'); process.exit(1); }
await QRCode.toFile('qr.png', url, { width: 600, margin: 2 });
console.log(`\n✅ เกมขึ้นเว็บแล้ว: ${url}\n📱 QR อยู่ที่ไฟล์ qr.png — สแกนเล่นบนมือถือได้เลย`);
