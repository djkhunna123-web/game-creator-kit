// juice.js — "ความมันส์สำเร็จรูป" สำหรับเกม Phaser 3 บนมือถือ (ZenityX Game Creator Kit)
// เกมสนุกเพราะ "ทุกการกระทำมีการตอบสนอง": เด้ง ประกาย สั่น เสียงไล่โน้ต ตัวเลขวิ่ง
// ใช้: ใน create() เรียก Juice.setup(this) ครั้งเดียว แล้วเรียกฟังก์ชันด้านล่างได้ทุกที่
//
//   Juice.burst(x, y, 0xffe082)          ประกายแตกกระจาย
//   Juice.pop(x, y, '+10', '#ffe082')    ตัวเลขลอยขึ้น
//   Juice.banner('COMBO x3!', '#ff4081') ตัวหนังสือใหญ่กลางจอ
//   Juice.shake() · Juice.flash() · Juice.hitstop(70) · Juice.punch(obj)
//   Juice.trail(obj, [0xffe082, 0xff8a65]) ไฟท้าย/ประกายตามวัตถุ
//   Juice.countdown(() => เริ่มเกม)     3 · 2 · 1 · GO!
//   Juice.countUp(textObj, 0, 520)       ตัวเลขวิ่ง
//   new Juice.Combo({ window: 1.2, step: 5, max: 4 })  คอมโบ + ตัวคูณ
//   Juice.grade(score, { S: 600, A: 400, B: 200 })     เกรด S/A/B/C
//   Sfx.coin(n) · Sfx.hit() · Sfx.power() · Sfx.tick() · Sfx.go() · Sfx.win() · Sfx.over()
//   แนวนอน (ORIENTATION: 'landscape'): หน้า "หมุนมือถือ" + หยุดเกมตอนจอตั้ง + Android ล็อกแนวนอนหลังแตะ — ทำให้เองท้ายไฟล์

// ทิศจอตั้งใน config.js → ORIENTATION: 'portrait' (แนวตั้ง 360 × 640 · ค่าเริ่มต้น) หรือ 'landscape' (แนวนอน 640 × 360)
const LANDSCAPE = (window.CONFIG && CONFIG.ORIENTATION) === 'landscape';
const W = LANDSCAPE ? 640 : 360, H = LANDSCAPE ? 360 : 640; // พิกัดในเกม — วางของด้วย W, H เสมอ (ไม่ใช้ตัวเลขตายตัว)
const FONT = "'IBM Plex Sans Thai Looped', Tahoma, sans-serif";

// เรนเดอร์ละเอียดตามจอจริง (ตัวหนังสือคม ไม่แตกเป็นพิกเซล): แคนวาส = W×H × Z แล้วซูมกล้อง Z เท่า
// แนวนอน: เปิดเกมตอนถือมือถือแนวตั้ง ก็คิดขนาดแบบหมุนแล้ว (หมุนจอปุ๊บ ตัวหนังสือคมทันที)
const VW = LANDSCAPE ? Math.max(innerWidth, innerHeight) : innerWidth;
const VH = LANDSCAPE ? Math.min(innerWidth, innerHeight) : innerHeight;
const Z = Math.max(1, Math.min(3, Math.ceil(Math.min(VW / W, VH / H) * (devicePixelRatio || 1) - 0.15)));
// testString = ตัวอย่างที่ใช้วัดความสูงตัวหนังสือ: ใส่สระ/วรรณยุกต์ไทยซ้อนกัน (ฟื้ ปู่ ฐ ญ) ไม่งั้น "เพื่อ" "ที่นี่" โดนตัดวรรณยุกต์ด้านบนหาย
const text = (size, color = '#ffffff', extra = {}) => ({ fontFamily: FONT, fontSize: size + 'px', color, fontStyle: '700', resolution: Z, testString: '|MÉqgyฟื้ปู่ฐญ', ...extra });

// ---------- เสียง 8-bit สร้างด้วยโค้ด (Web Audio) — ฟรี ไม่ใช้ไฟล์ เล่นได้ทุกเครื่อง ----------
const Sfx = {
  ctx: null,
  on: true,
  unlock() {
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.on = false; } }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(freq, dur, type = 'square', vol = 0.08, slideTo = null, delay = 0) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime + delay, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol = 0.25) {
    if (!this.on || !this.ctx) return;
    const n = Math.floor(this.ctx.sampleRate * dur), b = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = this.ctx.createBufferSource(), g = this.ctx.createGain(), f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 900; g.gain.value = vol;
    src.buffer = b; src.connect(f).connect(g).connect(this.ctx.destination); src.start();
  },
  // เก็บของ: ยิ่งคอมโบสูง เสียงยิ่งสูงขึ้นทีละโน้ต (ทำให้รู้สึก "ติดไฟ")
  coin(step = 0) {
    const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
    const f = 880 * Math.pow(2, scale[Math.min(step, scale.length - 1)] / 12);
    this.tone(f, 0.05); this.tone(f * 1.5, 0.1, 'square', 0.06, null, 0.05);
  },
  gold() { [1047, 1319, 1568, 2093].forEach((f, i) => this.tone(f, 0.09, 'square', 0.06, null, i * 0.05)); },
  power() { this.tone(330, 0.25, 'triangle', 0.1, 1320); },
  combo() { [784, 988, 1175].forEach((f, i) => this.tone(f, 0.08, 'square', 0.06, null, i * 0.06)); },
  hit() { this.noise(0.35, 0.35); this.tone(180, 0.3, 'sawtooth', 0.09, 60); },
  shield() { this.tone(600, 0.2, 'triangle', 0.1, 200); this.noise(0.15, 0.15); },
  whoosh() { this.tone(500, 0.12, 'triangle', 0.05, 1500); },
  tick() { this.tone(1200, 0.04, 'square', 0.05); },
  go() { this.tone(523, 0.1); this.tone(1047, 0.25, 'square', 0.08, null, 0.1); },
  over() { [523, 440, 349, 262].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.1, null, i * 0.18)); },
  win() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.16, 'square', 0.07, null, i * 0.1)); }
};

// ---------- Juice ----------
const Juice = {
  scene: null,
  freezeUntil: 0,

  setup(scene) {
    this.scene = scene;
    this.freezeUntil = 0;
    if (!scene.textures.exists('jx-dot')) {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1); g.fillCircle(8, 8, 8); g.generateTexture('jx-dot', 16, 16);
      g.clear(); g.fillStyle(0xffffff, 1);
      g.fillPoints([{ x: 8, y: 0 }, { x: 10, y: 6 }, { x: 16, y: 8 }, { x: 10, y: 10 }, { x: 8, y: 16 }, { x: 6, y: 10 }, { x: 0, y: 8 }, { x: 6, y: 6 }], true);
      g.generateTexture('jx-spark', 16, 16);
      g.destroy();
    }
  },

  // ประกายแตกกระจาย
  burst(x, y, color = 0xffffff, n = 12, speed = 200) {
    const e = this.scene.add.particles(0, 0, 'jx-spark', {
      speed: { min: speed * 0.4, max: speed }, angle: { min: 0, max: 360 }, lifespan: { min: 300, max: 550 },
      scale: { start: 0.9, end: 0 }, rotate: { min: 0, max: 360 }, tint: color, blendMode: 'ADD', emitting: false
    }).setDepth(8);
    e.explode(n, x, y);
    this.scene.time.delayedCall(700, () => e.destroy());
  },

  // ตัวเลข/คำลอยขึ้นแล้วจางหาย
  pop(x, y, str, color = '#ffffff', size = 22) {
    const s = this.scene.add.text(x, y, str, text(size, color, { stroke: '#1a1440', strokeThickness: 4 })).setOrigin(0.5).setDepth(9).setScale(0.6);
    this.scene.tweens.add({ targets: s, scale: 1, duration: 120, ease: 'Back.out' });
    this.scene.tweens.add({ targets: s, y: y - 46, alpha: 0, delay: 220, duration: 520, onComplete: () => s.destroy() });
  },

  // ข้อความใหญ่กลางจอ (COMBO / FEVER / เฉียด!)
  banner(str, color = '#ffe082', size = 40, y = H * 0.36) {
    const s = this.scene.add.text(W / 2, y, str, text(size, color, { stroke: '#1a1440', strokeThickness: 6 })).setOrigin(0.5).setDepth(15).setScale(0.2).setAlpha(0);
    this.scene.tweens.add({ targets: s, scale: 1, alpha: 1, duration: 220, ease: 'Back.out' });
    this.scene.tweens.add({ targets: s, scale: 1.15, alpha: 0, delay: 650, duration: 300, onComplete: () => s.destroy() });
    return s;
  },

  shake(ms = 160, amount = 0.012) { this.scene.cameras.main.shake(ms, amount); },
  flash(color = 0xffffff, ms = 120, alpha = 0.45) {
    const r = this.scene.add.rectangle(0, 0, W, H, color, alpha).setOrigin(0).setDepth(30);
    this.scene.tweens.add({ targets: r, alpha: 0, duration: ms, onComplete: () => r.destroy() });
  },
  // หยุดเกมแว้บเดียวตอนโดนชน ทำให้รู้สึก "หนัก" (ใน update ให้เช็ก Juice.frozen())
  hitstop(ms = 70) { this.freezeUntil = this.scene.time.now + ms; },
  frozen() { return this.scene && this.scene.time.now < this.freezeUntil; },

  // เด้งวัตถุ (เช่น ตัวเลขคะแนน)
  punch(target, s = 1.3, ms = 90) {
    if (!target || !target.scene || !target.active) return;
    const base = target.getData('baseScale') ?? target.scaleX;
    target.setData('baseScale', base);
    this.scene.tweens.killTweensOf(target);
    target.setScale(base);
    this.scene.tweens.add({ targets: target, scale: base * s, yoyo: true, duration: ms });
  },

  // ไฟท้าย/ประกายที่ตามวัตถุ (คืนตัว emitter ไว้เปลี่ยนสีหรือหยุด)
  trail(target, colors = [0xffe082, 0xff8a65], offsetY = 26) {
    return this.scene.add.particles(0, 0, 'jx-dot', {
      follow: target, followOffset: { x: 0, y: offsetY }, speed: { min: 30, max: 90 }, angle: { min: 70, max: 110 },
      lifespan: 380, scale: { start: 0.55, end: 0 }, alpha: { start: 0.9, end: 0 }, tint: colors, frequency: 28, blendMode: 'ADD'
    }).setDepth(2);
  },

  // นับถอยหลัง 3 · 2 · 1 · GO!
  countdown(onGo) {
    const steps = ['3', '2', '1', 'GO!'];
    steps.forEach((s, i) => this.scene.time.delayedCall(i * 600, () => {
      const last = i === steps.length - 1;
      last ? Sfx.go() : Sfx.tick();
      this.banner(s, last ? '#b9f6ca' : '#ffffff', last ? 64 : 84, H * 0.42);
      if (last) onGo();
    }));
  },

  // ตัวเลขวิ่งจาก a ไป b
  countUp(textObj, from, to, ms = 900, fmt = (v) => String(v)) {
    const o = { v: from };
    const alive = () => textObj.scene && textObj.active; // ข้อความอาจถูกลบไปแล้ว (เช่น กดเล่นใหม่เร็ว ๆ)
    const tw = this.scene.tweens.add({
      targets: o, v: to, duration: ms, ease: 'Cubic.out',
      onUpdate: () => { if (alive()) textObj.setText(fmt(Math.round(o.v))); },
      onComplete: () => { if (alive()) { textObj.setText(fmt(to)); this.punch(textObj, 1.2, 120); } }
    });
    textObj.once('destroy', () => tw.stop());
  },

  // เกรดจากคะแนน
  grade(score, table) {
    const colors = { S: '#ffd54f', A: '#80deea', B: '#b9f6ca', C: '#c5cae9' };
    const g = score >= table.S ? 'S' : score >= table.A ? 'A' : score >= table.B ? 'B' : 'C';
    return { g, color: colors[g] };
  },

  // คอมโบ: เก็บติดกันภายใน window วินาที → ทุก step ครั้ง ตัวคูณ +1 (สูงสุด max)
  Combo: class {
    constructor({ window = 1.2, step = 5, max = 4 } = {}) { Object.assign(this, { window, step, max }); this.reset(); }
    reset() { this.count = 0; this.last = -1e9; this.mult = 1; }
    hit(nowMs) {
      this.count = nowMs - this.last <= this.window * 1000 ? this.count + 1 : 1;
      this.last = nowMs;
      const mult = Math.min(this.max, 1 + Math.floor(this.count / this.step));
      const levelUp = mult > this.mult;
      this.mult = mult;
      return { count: this.count, mult, levelUp };
    }
    expired(nowMs) { return this.count > 0 && nowMs - this.last > this.window * 1000; }
  }
};

// ---------- แนวนอน: หน้า "หมุนมือถือ" + ล็อกจอ (ทำงานเองเมื่อ ORIENTATION: 'landscape') ----------
// • ถือมือถือ/แท็บเล็ตแนวตั้ง → ขึ้นหน้า "หมุนมือถือเป็นแนวนอน" ทับเกม + หยุดเกมไว้ หมุนกลับแล้วเล่นต่อ
//   (คอม/โน้ตบุ๊กหน้าต่างแคบ ไม่ต้องหมุน → แสดงเกมย่อพอดีหน้าต่างแทน)
// • Android: แตะครั้งแรก → เต็มจอ + ล็อกแนวนอน (iPhone ล็อกไม่ได้ ใช้หน้าบอกให้หมุนแทน)
// • ติดตั้งเป็นแอป: ตั้ง "orientation": "landscape" ใน manifest.webmanifest ด้วย
const Orient = {
  portrait: () => matchMedia('(orientation: portrait) and (pointer: coarse)').matches,
  touch: () => matchMedia('(pointer: coarse)').matches,
  setup() {
    if (!LANDSCAPE || this.ready) return;
    this.ready = true;
    const css = document.createElement('style');
    css.textContent = `
      #jx-rotate { position: fixed; inset: 0; z-index: 50; display: none; flex-direction: column; align-items: center; justify-content: center;
        gap: 14px; padding: 24px; background: #05040f; color: #fff; text-align: center; font-family: ${FONT}; }
      @media (orientation: portrait) and (pointer: coarse) { #jx-rotate { display: flex; } }
      #jx-rotate .ph { width: 56px; height: 96px; border: 5px solid #ffe082; border-radius: 12px; box-sizing: border-box;
        position: relative; animation: jx-turn 2.2s ease-in-out infinite; }
      #jx-rotate .ph::after { content: ''; position: absolute; left: 50%; bottom: 6px; width: 10px; height: 10px; margin-left: -5px;
        border-radius: 50%; background: #ffe082; }
      @keyframes jx-turn { 0%, 25% { transform: rotate(0); } 55%, 100% { transform: rotate(-90deg); } }
      #jx-rotate b { font-size: 24px; line-height: 1.35; color: #ffe082; }
      #jx-rotate p { margin: 0; font-size: 17px; line-height: 1.5; font-weight: 500; color: #c5cae9; }`;
    document.head.appendChild(css);
    const box = document.createElement('div');
    box.id = 'jx-rotate';
    box.innerHTML = '<div class="ph"></div><b>หมุนมือถือเป็นแนวนอน</b><p>เกมนี้เล่นแนวนอน 🔄</p>' +
      (document.documentElement.requestFullscreen && this.touch() ? '<p>หรือแตะตรงนี้เพื่อเล่นเต็มจอ</p>' : '');
    document.body.appendChild(box);

    // หยุดเกมตอนจอตั้ง · เล่นต่อตอนจอนอน (โหมด AI ทดสอบไม่หยุด)
    const sync = () => {
      const g = window.__game;
      if (!g || /[?&]bot/.test(location.search)) return;
      if (this.portrait() && !g.isPaused) { g.pause(); g.sound && g.sound.pauseAll(); }
      else if (!this.portrait() && g.isPaused) { g.resume(); g.sound && g.sound.resumeAll(); }
    };
    matchMedia('(orientation: portrait) and (pointer: coarse)').addEventListener('change', sync);
    this.sync = sync;

    // Android: แตะครั้งแรก (ปล่อยนิ้ว) → เต็มจอ + ล็อกแนวนอน
    const lock = () => {
      const el = document.documentElement;
      if (!this.touch() || !el.requestFullscreen || document.fullscreenElement) return;
      el.requestFullscreen({ navigationUI: 'hide' })
        .then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'))
        .catch(() => {});
    };
    ['pointerup', 'touchend'].forEach((e) => document.addEventListener(e, lock, { passive: true }));
  }
};
if (document.body) Orient.setup(); else addEventListener('DOMContentLoaded', () => Orient.setup());
