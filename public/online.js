// online.js — ส่งคะแนนขึ้นตาราง Supabase ผ่าน "กรรมการกลาง" (ใช้กับ supabase/leaderboard.sql)
// เกมเขียนตารางคะแนนตรง ๆ ไม่ได้ ต้องเรียก 2 ฟังก์ชันบนเซิร์ฟเวอร์:
//   game_start(game)   ตอนเริ่มเล่น → เซิร์ฟเวอร์จดเวลาเริ่มเอง ได้เลขรอบกลับมา
//   game_submit(...)   ตอนจบเกม    → เซิร์ฟเวอร์เช็กว่าเล่นนานจริง + คะแนนไม่เกินจริง แล้วค่อยบันทึก
window.Online = {
  on: !!(window.ONLINE && ONLINE.URL && ONLINE.KEY),

  async rpc(fn, body = {}) {
    const res = await fetch(`${ONLINE.URL}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: { apikey: ONLINE.KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  },

  // เรียกตอนเริ่มรอบ — ถ้าเน็ตหลุดได้ null (เกมยังเล่นต่อได้ตามปกติ)
  begin() {
    return this.on ? this.rpc('game_start', { p_game: ONLINE.GAME_ID }).catch(() => null) : Promise.resolve(null);
  },

  // หน้าใส่ชื่อหลังจบเกม → คืนผลจากกรรมการ หรือ null ถ้ากดข้าม
  askName(score, runPromise) {
    const $ = (id) => document.getElementById(id);
    const sheet = $('sheet'), form = $('sheetForm'), input = $('sheetName');
    const send = $('sheetSend'), skip = $('sheetSkip'), msg = $('sheetMsg');
    $('sheetScore').textContent = `${score} ดาว`;
    input.value = localStorage.getItem('playerName') || '';
    msg.textContent = ''; send.disabled = false; send.textContent = 'ส่งขึ้นจอใหญ่';
    sheet.hidden = false;

    return new Promise((resolve) => {
      const close = (result) => {
        sheet.hidden = true; form.onsubmit = null; skip.onclick = null;
        input.blur(); resolve(result);
      };
      skip.onclick = () => close(null);
      form.onsubmit = async (e) => {
        e.preventDefault();
        const name = input.value.trim();
        if (!name) { msg.textContent = 'พิมพ์ชื่อก่อนนะ'; input.focus(); return; }
        localStorage.setItem('playerName', name);
        send.disabled = true; send.textContent = 'กำลังส่ง…'; msg.textContent = '';
        try {
          const runId = await runPromise;
          if (!runId) throw new Error('no run');
          close(await this.rpc('game_submit', { p_run: runId, p_name: name, p_score: score }));
        } catch (err) {
          send.disabled = false; send.textContent = 'ลองส่งอีกครั้ง';
          msg.textContent = 'ส่งไม่สำเร็จ เช็กอินเทอร์เน็ตแล้วลองใหม่';
        }
      };
    });
  }
};
