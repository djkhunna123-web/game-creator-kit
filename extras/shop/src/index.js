// Star Catcher API (Step 4) — "แคชเชียร์ฝั่งเซิร์ฟเวอร์" ตรวจว่าจ่ายเงินจริงก่อนปลดล็อกสกิน
//   GET /api/verify?session=cs_test_…  → { ok: true, item: 'gold_skin' } ถ้าจ่ายครบผ่าน Payment Link ของเกมนี้
// คีย์ลับ Stripe อยู่ที่นี่ (ฝั่งเซิร์ฟเวอร์) เท่านั้น — ห้ามใส่ในไฟล์หน้าเว็บ

// Payment Link "สกินยานสีทอง ฿29" (โหมดทดสอบ) — ต้องตรงกับ SHOP.GOLD_LINK ใน public/config.js
const PAYMENT_LINK_ID = 'plink_1Udk0mPwFFHhN9AJDRlKbwG3';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

async function verify(url, env) {
  const key = env.STRIPE_SECRET_KEY || '';
  // รับเฉพาะคีย์โหมดทดสอบ — กันเก็บเงินจริงโดยไม่ตั้งใจ
  if (!/^(sk|rk)_test_/.test(key)) return json({ ok: false, reason: 'ร้านยังไม่เปิด (ไม่มีคีย์โหมดทดสอบ)' }, 503);

  const session = url.searchParams.get('session') || '';
  if (!/^cs_test_[A-Za-z0-9]{10,200}$/.test(session)) return json({ ok: false, reason: 'เลขใบเสร็จไม่ถูกต้อง' }, 400);

  const r = await fetch('https://api.stripe.com/v1/checkout/sessions/' + session, {
    headers: { authorization: 'Bearer ' + key }
  });
  if (!r.ok) return json({ ok: false, reason: 'ไม่พบการจ่ายเงินนี้' }, 404);
  const s = await r.json();

  if (s.payment_link !== PAYMENT_LINK_ID) return json({ ok: false, reason: 'ไม่ใช่การซื้อสกินนี้' }, 400);
  if (s.payment_status !== 'paid') return json({ ok: false, reason: 'ยังไม่ได้จ่ายเงิน' }, 402);
  return json({ ok: true, item: 'gold_skin' });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/api/verify' && request.method === 'GET') return await verify(url, env);
      return json({ ok: false, reason: 'not found' }, 404);
    } catch (err) {
      return json({ ok: false, reason: 'เซิร์ฟเวอร์ขัดข้อง ลองใหม่อีกครั้ง' }, 500);
    }
  }
};
