# ตารางคะแนนออนไลน์ + กรรมการกลาง

เกมเขียนตารางคะแนนตรง ๆ ไม่ได้ (กันโกง) → ส่งผ่านฟังก์ชันบนเซิร์ฟเวอร์ที่ตรวจว่า **เล่นนานจริง** และ **คะแนนไม่เกินที่ทำได้จริง**
หน้าเกมมีหน้าใส่ชื่อ (`#sheet` ใน index.html) + `online.js` + หน้า `/top10` พร้อมแล้ว — แค่ต่อ Supabase

## ติดตั้ง (ครั้งเดียวต่อโปรเจกต์ Supabase · ใช้ Supabase MCP)
1. รัน `supabase/leaderboard.sql` (apply_migration) · บัญชีฟรีเปิดได้ 2 โปรเจกต์ — 1 โปรเจกต์เก็บได้หลายเกม
2. ใส่ใน `public/config.js` → `ONLINE.URL`, `ONLINE.KEY` (**Publishable key** `sb_publishable_…` หรือ anon — ห้ามใช้ service_role), `ONLINE.GAME_ID`
3. ตั้งกติกากรรมการจากผลทดสอบ bot:
   `insert into public.game_rules (game, min_seconds, max_points_per_second, bonus) values ('<GAME_ID>', 3, <ค่า>, 200) on conflict (game) do update set max_points_per_second = excluded.max_points_per_second;`
4. ตรวจด้วย get_advisors (security) — คำเตือน "SECURITY DEFINER callable by anon" ของ game_start/game_submit **ตั้งใจให้เป็นแบบนั้น** (ผู้เล่นไม่ต้องล็อกอิน)

## ทดสอบให้เห็นว่ากันโกงได้ (ต้องทำ)
- ส่งคะแนนปลอมสูงมาก → ต้องได้ "คะแนนสูงเกินจริง"
- ส่งก่อนเล่นครบ 3 วิ → "เล่นสั้นเกินจริง" · ส่งซ้ำรอบเดิม → "รอบนี้ส่งคะแนนไปแล้ว"
- `insert` ตรงเข้า game_scores ด้วยคีย์สาธารณะ → permission denied
- เปิด `/top10` ค้างไว้ แล้วส่งคะแนนจริง → ชื่อเด้งขึ้นเองไม่ต้องรีเฟรช
- ลบคะแนนทดสอบออกหลังทดสอบ

## บอกผู้เรียนตรง ๆ
กรรมการกันคะแนน "เกินจริง" ได้ แต่คนเขียนสคริปต์รอครบเวลาแล้วส่งคะแนนสูงแบบพอเป็นไปได้ยังทำได้ — เกมแข่งชิงรางวัลจริงต้องให้เซิร์ฟเวอร์ตรวจทุกการเล่น (เกินขอบเขตคลาส)
ล้างคะแนนก่อนคลาส: `delete from public.game_scores where game = '<GAME_ID>';`
