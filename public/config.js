// config.js — จูนเกมที่นี่ที่เดียว (ไม่ต้องแตะ game.js)
// หน่วยระยะ = จอเกม W × H: แนวตั้ง 360 × 640 หรือแนวนอน 640 × 360 ตาม ORIENTATION (เกมขยายให้คมเองตามจอจริง)
// เกมตัวอย่างในแม่แบบ: "แตะลูกแก้ว" — แตะลูกแก้วก่อนหาย อย่าแตะระเบิด (ให้ AI เปลี่ยนเป็นเกมของคุณได้เลย)
window.CONFIG = {
  TITLE:        'แตะลูกแก้ว',
  SUBTITLE:     'แตะให้ทัน อย่าแตะระเบิด!',

  // ทิศจอ: 'portrait' = แนวตั้ง 360×640 (ทุกแนวเกมใช้แบบนี้) · 'landscape' = แนวนอน 640×360 (เฉพาะเกมวิ่งแบบมีปุ่มกระโดด/สไลด์)
  // เปลี่ยนเป็น 'landscape' แล้วแก้ "orientation" ใน manifest.webmanifest ให้ตรงกันด้วย
  ORIENTATION:  'portrait',

  // กติกาหลัก
  GAME_TIME:    30,    // วินาทีต่อรอบ
  LIVES:        3,     // พลาดได้กี่ครั้ง
  SPAWN_EVERY:  650,   // ของโผล่ทุกกี่มิลลิวินาที
  ITEM_LIFE:    1500,  // ลูกแก้วอยู่บนจอกี่มิลลิวินาที
  BOMB_CHANCE:  0.18,  // โอกาสเป็นระเบิด
  SPEED_UP:     1.06,  // ทุก 5 วินาที เกมเร็วขึ้นกี่เท่า

  // คะแนน + คอมโบ
  POINTS:       10,    // ของธรรมดา
  GOLD_POINTS:  50,    // ของทอง (หายาก)
  GOLD_CHANCE:  0.08,
  COMBO_WINDOW: 1.2,   // ทำติดกันภายในกี่วินาทีถึงนับคอมโบ
  COMBO_STEP:   5,     // คอมโบทุกกี่ครั้ง ตัวคูณ +1
  MAX_MULT:     4,     // ตัวคูณสูงสุด

  // FEVER ช่วงท้ายเกม
  FEVER_TIME:   10,    // กี่วินาทีสุดท้าย
  FEVER_MULT:   2,     // คะแนนคูณกี่เท่า
  FEVER_SPAWN:  1.6,   // ของโผล่ถี่ขึ้นกี่เท่า

  // เกรดตอนจบ (คะแนนขั้นต่ำ) — วัดจาก AI เล่นแบบคน 12 รอบ: กลาง ๆ ได้ ~1,900 · เปลี่ยนเกมแล้วให้ AI วัดใหม่ (?bot=1)
  GRADES: { S: 3000, A: 1900, B: 1000 }
};

// ภาพและเสียง — ไฟล์ใน public/assets/ · ว่างไว้ = เกมวาดรูปทรงสีล้วนเอง
// ตัวอย่าง: { hero: 'assets/hero.png', bg: 'assets/bg.jpg', music: 'assets/music.mp3' }
window.ART = {};

// เอฟเฟกต์พิกเซลสำเร็จรูป (สไปรต์ชีต PNG + JSON จาก pixelfx — ดู .claude/skills/game-creator/reference/pixelfx.md)
// ใส่ชื่อไฟล์ไม่ต้องมีนามสกุล · เล่นในเกมด้วย this.playFx('pow', x, y)
// ตัวอย่าง: { pow: 'assets/fx/cartoon-pow', coin: 'assets/fx/coin-spin' }
window.FX = {};

// ตารางคะแนนออนไลน์ (Supabase) — ว่างไว้ = เล่นแบบออฟไลน์ ไม่ถามชื่อ
// ใส่ URL + Publishable key ของโปรเจกต์คุณ (Project Settings → API) และรัน supabase/leaderboard.sql ก่อน
window.ONLINE = {
  URL: '',
  KEY: '',
  GAME_ID: 'my-game'   // ชื่อเกมในตาราง (1 โปรเจกต์ Supabase เก็บได้หลายเกม)
};
