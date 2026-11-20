# ร้านค้าในเกม (Stripe Payment Link · โหมดทดสอบ)

ขายของในเกม เช่น "สกินทอง 29 บาท" — จ่ายด้วยบัตรทดสอบ ไม่มีเงินจริง · ตัวอย่างเต็ม: Star Catcher step-4

## ให้ AI ทำ
```
/game-creator เพิ่มร้านค้า: ปุ่ม "[ของที่ขาย] [ราคา] บาท" ในหน้าเริ่มเกม
ใช้ Stripe Payment Link โหมดทดสอบ จ่ายเสร็จกลับมาที่เกม
ให้เซิร์ฟเวอร์ถาม Stripe ว่าจ่ายจริงก่อนปลดล็อก (ใช้ไฟล์ใน extras/shop)
```

## สิ่งที่ AI ต้องทำ (เช็กลิสต์)
1. Stripe Dashboard เปิด **Test mode / Sandbox** → สร้างสินค้า + ราคา + Payment Link (ผ่าน Stripe MCP หรือ API)
   - หลังจ่าย ส่งกลับไป `https://<เกม>.workers.dev/?paid={CHECKOUT_SESSION_ID}`
2. คัดลอก `extras/shop/shop.js` → `public/shop.js` · ใส่ `<script src="shop.js">` ก่อน game.js · เพิ่มปุ่ม `#shopBtn` + `#toast` ใน index.html
3. คัดลอก `extras/shop/src/index.js` → `src/index.js` · แก้ `PAYMENT_LINK_ID`
4. `cloudflare.config.ts`: เพิ่ม `entrypoint`, `assets: { runWorkerFirst: ['/api/*'] }`, `env: { STRIPE_SECRET_KEY: bindings.secret() }` (ดูตัวอย่างใน Star Catcher)
5. ไฟล์ `.dev.vars` (ไม่ขึ้น GitHub): `STRIPE_SECRET_KEY="sk_test_…"` → `npm run ship` ส่งขึ้นเป็น secret ให้เอง
6. ทดสอบ: บัตร `4242 4242 4242 4242` · วันหมดอายุในอนาคต · CVC อะไรก็ได้ · ใบเสร็จปลอม/ยังไม่จ่ายต้องถูกปฏิเสธ

## ข้อควรรู้
- เซิร์ฟเวอร์รับเฉพาะคีย์ `sk_test_` / `rk_test_` (กันเก็บเงินจริงโดยไม่ตั้งใจ)
- ของที่ซื้อจำไว้ในเครื่อง (localStorage) — เกมขายจริงต้องมีบัญชีผู้เล่น + บันทึกการซื้อบนเซิร์ฟเวอร์
- เปิดรับเงินจริงต้องยืนยันตัวตนกับ Stripe ก่อน (ไม่สอนในคลาส)
