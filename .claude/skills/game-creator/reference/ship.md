# ขึ้นเว็บ + QR (ขั้นที่ 5)

- ครั้งแรก: `npm install` แล้ว `npx cf auth login` (ล็อกอิน Cloudflare ในเบราว์เซอร์)
- เปลี่ยนชื่อ Worker ใน `cloudflare.config.ts` (`name`) = ชื่อลิงก์เกม เช่น `mochi-dash`
- `npm run ship` → ขึ้น Cloudflare + เขียน `qr.png` + พิมพ์ลิงก์ `https://<ชื่อ>.<บัญชี>.workers.dev`
- มีไฟล์ `.dev.vars` (คีย์ลับ เช่น Stripe) → ship ส่งขึ้นเป็น secret ให้เอง
- เปิดลิงก์บนมือถือจริงทุกครั้งหลังขึ้นเว็บ · หน้า Top 10: `<ลิงก์>/top10` (มี QR ในหน้าเอง)
- เซฟจุด: `git add -A && git commit -m "เกมเล่นได้ + ขึ้นเว็บ"` · GitHub: บอก AI "เก็บขึ้น GitHub repo ใหม่ชื่อ ..."
- dev บนเครื่อง: `npm run dev` → http://localhost:8100 (มือถือวง Wi-Fi เดียวกันเปิดลิงก์ Network ได้)
