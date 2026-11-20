// shop.js — ขาย "ยานสีทอง" ผ่าน Stripe Payment Link (Step 4 · โหมดทดสอบ)
// 1) กดปุ่ม → ไปหน้าจ่ายเงินของ Stripe
// 2) จ่ายเสร็จ Stripe ส่งกลับมาที่เกมพร้อม ?paid=เลขใบเสร็จ
// 3) เกมถามเซิร์ฟเวอร์ /api/verify ว่าจ่ายจริงไหม (เซิร์ฟเวอร์ถือคีย์ลับ ถาม Stripe ให้)
// 4) จริง → ปลดล็อก + จำไว้ในเครื่อง (localStorage)
window.Shop = {
  on: !!(window.SHOP && SHOP.GOLD_LINK),
  onChange: null, // เกมตั้งค่า: เรียกเมื่อเปลี่ยนสกิน

  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* โหมดส่วนตัว: จำไม่ได้ แต่เล่นต่อได้ */ } },
  owned() { return this.get('starCatcherGold') === '1'; },
  wearing() { return this.owned() && this.get('starCatcherSkin') !== 'normal'; },

  btn() { return document.getElementById('shopBtn'); },
  show(visible) {
    const b = this.btn();
    if (!b || !this.on) return;
    b.hidden = !visible;
    if (!visible) return;
    if (!this.owned()) { b.className = 'buy'; b.textContent = `✨ ยานสีทอง ${SHOP.GOLD_PRICE} บาท`; }
    else { b.className = 'own'; b.textContent = this.wearing() ? 'ยาน: สีทอง ✓ (แตะเปลี่ยน)' : 'ยาน: ปกติ (แตะใช้สีทอง)'; }
  },

  tap() {
    if (!this.owned()) { location.href = SHOP.GOLD_LINK; return; } // ไปหน้าจ่ายเงิน Stripe
    this.set('starCatcherSkin', this.wearing() ? 'normal' : 'gold');
    this.show(true);
    if (this.onChange) this.onChange();
  },

  toast(msg, ms = 3200) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg; t.hidden = false;
    clearTimeout(this._t);
    if (ms) this._t = setTimeout(() => { t.hidden = true; }, ms);
  },

  // กลับมาจากหน้าจ่ายเงิน: ?paid=cs_test_…
  async checkReturn() {
    const params = new URLSearchParams(location.search);
    const session = params.get('paid');
    if (!session) return;
    this.toast('กำลังตรวจการจ่ายเงิน…', 0);
    try {
      const res = await fetch('/api/verify?session=' + encodeURIComponent(session));
      const data = await res.json();
      history.replaceState(null, '', location.pathname); // ได้คำตอบแล้ว → ลบเลขใบเสร็จออกจากแถบที่อยู่
      if (data.ok) {
        this.set('starCatcherGold', '1');
        this.set('starCatcherSkin', 'gold');
        this.toast('ปลดล็อกยานสีทองแล้ว! ✨ ขอบคุณที่สนับสนุน');
        this.show(!this.btn().hidden);
        if (this.onChange) this.onChange();
      } else {
        this.toast('ยังปลดล็อกไม่ได้: ' + (data.reason || 'ตรวจไม่ผ่าน'), 5000);
      }
    } catch (e) {
      this.toast('ตรวจการจ่ายเงินไม่สำเร็จ เช็กอินเทอร์เน็ตแล้วรีเฟรชหน้านี้', 5000);
    }
  }
};

document.getElementById('shopBtn')?.addEventListener('click', () => Shop.tap());
Shop.checkReturn();
