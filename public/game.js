// game.js — เกมจาก ZenityX Game Creator Kit
// โครงมี 2 ส่วน:
//   [โครงเกม]  หน้าเริ่ม · นับถอยหลัง · HUD · คอมโบ · FEVER · หน้าจบ+เกรด · ส่งคะแนน · โหมด AI ทดสอบ  → เก็บไว้ ใช้ได้ทุกเกม
//   [กติกาเกม] ส่วนที่มีป้าย ★ เปลี่ยนตรงนี้                                                       → เปลี่ยนเป็นเกมของคุณ
// ตัวเลขทั้งหมดอยู่ใน config.js · ความมันส์ (ประกาย เสียง เด้ง) มาจาก juice.js
const C = window.CONFIG;
const ART = window.ART || {};
const BOT = new URLSearchParams(location.search).has('bot'); // ?bot=1 = ให้ AI เล่นเองไว้ทดสอบ

class Game extends Phaser.Scene {
  constructor() { super('Game'); }

  preload() {
    for (const [k, v] of Object.entries(ART)) {
      if (/\.(mp3|ogg|wav|m4a)$/i.test(v)) this.load.audio(k, v); else this.load.image(k, v);
    }
  }

  create() {
    this.cameras.main.setOrigin(0, 0).setZoom(Z);
    Juice.setup(this);
    this.makeShapes();
    this.best = Number(localStorage.getItem(this.storeKey('best')) || 0);

    // ฉากหลัง (มีภาพ bg ใน ART = ใช้ภาพ · ไม่มี = สีพื้น)
    this.textures.exists('bg')
      ? this.add.image(0, 0, 'bg').setOrigin(0).setDisplaySize(W, H)
      : this.add.rectangle(0, 0, W, H, 0x150f33).setOrigin(0);
    this.feverGlow = this.add.rectangle(0, 0, W, H, 0xff4081, 0).setOrigin(0).setDepth(1);

    this.music = this.cache.audio.exists('music') ? this.sound.add('music', { loop: true, volume: 0.4 }) : null;
    this.combo = new Juice.Combo({ window: C.COMBO_WINDOW, step: C.COMBO_STEP, max: C.MAX_MULT });

    // HUD (ตัวหนังสือ 15px ขึ้นไป อ่านง่ายบนมือถือ)
    this.scoreText = this.add.text(16, 12, '', text(24, '#ffe082')).setDepth(10);
    this.comboText = this.add.text(16, 44, '', text(16, '#ff80ab')).setDepth(10);
    this.timeText = this.add.text(W / 2, 12, '', text(24)).setOrigin(0.5, 0).setDepth(10);
    this.livesText = this.add.text(W - 16, 12, '', text(22, '#ff6b81')).setOrigin(1, 0).setDepth(10);

    this.input.on('pointerdown', (p) => { if (this.state === 'play') this.onTap(this.cameras.main.getWorldPoint(p.x, p.y)); });
    this.input.on('pointermove', (p) => { if (p.isDown && (this.state === 'play' || this.state === 'count')) this.onDrag(this.cameras.main.getWorldPoint(p.x, p.y)); });

    this.setupWorld();
    this.state = 'ready';
    this.showReady();
  }

  storeKey(k) { return `${(window.ONLINE && ONLINE.GAME_ID) || 'game'}-${k}`; }

  // =====================================================================
  // ★ เปลี่ยนตรงนี้: กติกาเกม
  // =====================================================================

  // รูปทรงสีล้วน (ใช้จนกว่าจะมีภาพจริงใน ART — key เดียวกันจะใช้ภาพแทนอัตโนมัติ)
  makeShapes() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const tex = (key, w, h, draw) => { if (this.textures.exists(key)) return; g.clear(); draw(); g.generateTexture(key, w, h); };
    tex('orb', 96, 96, () => { g.fillStyle(0x80deea); g.fillCircle(48, 48, 46); g.fillStyle(0xffffff, 0.8); g.fillCircle(34, 32, 12); });
    tex('bomb', 96, 96, () => { g.fillStyle(0x37474f); g.fillCircle(48, 52, 40); g.fillStyle(0xff5252); g.fillRect(42, 4, 12, 18); });
    g.destroy();
  }

  setupWorld() { this.items = []; }

  // เริ่มรอบใหม่: ล้างของเก่า ตั้งค่าเริ่มต้น
  resetRound() {
    this.items.forEach((o) => o.destroy());
    this.items = [];
    this.spawnTimer = 0;
  }

  spawn() {
    const bomb = Math.random() < C.BOMB_CHANCE;
    const gold = !bomb && Math.random() < C.GOLD_CHANCE;
    const o = this.add.image(Phaser.Math.Between(50, W - 50), Phaser.Math.Between(120, H - 90), bomb ? 'bomb' : 'orb').setDepth(2).setScale(0);
    o.size = gold ? 74 : 62;
    o.kind = bomb ? 'bomb' : gold ? 'gold' : 'orb';
    if (gold) o.setTint(0xffd54f);
    o.born = this.time.now;
    o.life = C.ITEM_LIFE / this.speedMult;
    this.tweens.add({ targets: o, displayWidth: o.size, displayHeight: o.size, duration: 160, ease: 'Back.out' });
    this.items.push(o);
  }

  onTap(pt) {
    const hit = this.items.find((o) => Phaser.Math.Distance.Between(pt.x, pt.y, o.x, o.y) < o.size * 0.6);
    if (!hit) return;
    this.items = this.items.filter((o) => o !== hit);
    if (hit.kind === 'bomb') this.loseLife(hit.x, hit.y);
    else this.addScore(hit.kind === 'gold' ? C.GOLD_POINTS : C.POINTS, hit.x, hit.y, hit.kind === 'gold');
    hit.destroy();
  }

  onDrag(pt) { /* เกมแบบลากนิ้ว ใช้ตรงนี้ */ }

  // ทุกเฟรมตอนกำลังเล่น
  updatePlay(dt, time) {
    this.spawnTimer += dt * 1000 * this.speedMult * (this.fever ? C.FEVER_SPAWN : 1);
    if (this.spawnTimer >= C.SPAWN_EVERY) { this.spawnTimer -= C.SPAWN_EVERY; this.spawn(); }
    this.items = this.items.filter((o) => {
      const age = time - o.born;
      if (age > o.life) { o.destroy(); return false; }
      o.setAlpha(age > o.life * 0.7 ? 0.5 + 0.5 * Math.sin(age / 40) : 1); // กะพริบก่อนหาย
      return true;
    });
  }

  // AI เล่นเอง (?bot=1): แตะของดีที่ใกล้หายที่สุด ไม่แตะระเบิด · ตอบสนองช้ากว่าคนนิดหน่อย
  botPlay(time) {
    if (time < (this.botNext || 0)) return;
    this.botNext = time + 320 + Math.random() * 260; // ช้ากว่าเครื่อง เหมือนคนจริง
    if (Math.random() < 0.15) return;                 // บางทีก็พลาด
    const t = this.items.filter((o) => o.kind !== 'bomb').sort((a, b) => (b.life - (time - b.born)) - (a.life - (time - a.born)))[0];
    if (t) this.onTap({ x: t.x, y: t.y });
  }

  // =====================================================================
  // [โครงเกม] ใช้ได้ทุกเกม — แก้เมื่อจำเป็นเท่านั้น
  // =====================================================================

  // ได้คะแนน: คูณคอมโบ × FEVER + ประกาย + เสียงไล่โน้ต + ตัวเลขลอย
  addScore(base, x, y, gold = false) {
    const r = this.combo.hit(this.time.now);
    const pts = base * r.mult * (this.fever ? C.FEVER_MULT : 1);
    this.score += pts;
    this.stats.hits++; this.stats.maxCombo = Math.max(this.stats.maxCombo, r.count);
    if (gold) { Sfx.gold(); Juice.burst(x, y, 0xffd54f, 22, 260); Juice.flash(0xffd54f, 120, 0.25); }
    else { Sfx.coin(Math.min(r.count - 1, 10)); Juice.burst(x, y, 0xffe082, 10); }
    Juice.pop(x, y - 12, '+' + pts, gold ? '#ffd54f' : '#ffe082', gold ? 28 : 20 + Math.min(r.mult, 4) * 2);
    Juice.punch(this.scoreText, 1.25);
    if (r.levelUp) { Sfx.combo(); Juice.banner(`COMBO ×${r.mult}!`, '#ff80ab', 40); }
  }

  // พลาด: เสียชีวิต + จอสั่น + หยุดแว้บ + คอมโบหลุด
  loseLife(x, y) {
    this.lives--;
    if (this.combo.count >= C.COMBO_STEP) Juice.pop(x, y - 30, 'คอมโบหลุด!', '#ff8a80', 18);
    this.combo.reset();
    Sfx.hit(); Juice.hitstop(90); Juice.shake(200, 0.016); Juice.flash(0xff1744, 160, 0.35);
    Juice.burst(x, y, 0xff7043, 18, 240);
    if (navigator.vibrate && !BOT) navigator.vibrate(80);
  }

  panel(build, button, onTap) {
    const c = this.add.container(0, 0).setDepth(20);
    c.add(this.add.rectangle(0, 0, W, H, 0x000000, 0.62).setOrigin(0));
    const y = build(c);
    const btn = this.add.container(W / 2, y + 44);
    btn.add([this.add.rectangle(0, 0, 230, 62, 0xff4081).setStrokeStyle(3, 0xffffff), this.add.text(0, 0, button, text(24)).setOrigin(0.5)]);
    c.add(btn);
    this.tweens.add({ targets: btn, scale: 1.06, yoyo: true, repeat: -1, duration: 500 });
    const zone = this.add.zone(0, 0, W, H).setOrigin(0).setInteractive();
    zone.once('pointerdown', () => {
      Sfx.unlock();
      if (this.music && !this.music.isPlaying) this.music.play();
      c.destroy(); this.panelBox = null; onTap();
    });
    c.add(zone);
    this.panelBox = c;
    return c;
  }

  showReady() {
    this.panel((c) => {
      let y = 200;
      for (const [t, size, color] of [
        [C.TITLE, 36, '#ffe082'],
        [C.SUBTITLE, 18, '#ffffff'],
        [`ทำติดกัน = คอมโบ ×${C.MAX_MULT} · ${C.FEVER_TIME} วิท้าย FEVER ×${C.FEVER_MULT}`, 15, '#ff80ab'],
        [this.best ? `คะแนนสูงสุด ${this.best.toLocaleString()}` : `เล่น ${C.GAME_TIME} วินาที · ${C.LIVES} ชีวิต`, 16, '#c5cae9']
      ]) { c.add(this.add.text(W / 2, y, t, text(size, color, { align: 'center', wordWrap: { width: W - 40 } })).setOrigin(0.5)); y += size * 1.7; }
      return y;
    }, 'แตะเพื่อเริ่ม', () => this.start());
    this.updateHud();
    if (BOT) this.time.delayedCall(300, () => { if (this.panelBox) { this.panelBox.destroy(); this.panelBox = null; } this.start(); });
  }

  start() {
    this.resetRound();
    this.score = 0; this.lives = C.LIVES; this.timeLeft = C.GAME_TIME;
    this.speedMult = 1; this.speedTimer = 0; this.fever = false; this.lastTick = 99;
    this.stats = { hits: 0, maxCombo: 0 };
    this.combo.reset();
    this.feverGlow.setAlpha(0);
    if (this.music) this.music.setRate(1);
    this.state = 'count';
    this.updateHud();
    Juice.countdown(() => {
      this.state = 'play';
      this.run = window.Online && Online.on ? Online.begin() : null; // ขอเลขรอบจากกรรมการกลาง
    });
  }

  enterFever() {
    this.fever = true;
    Sfx.combo(); Juice.banner('FEVER!', '#ff4081', 56); Juice.flash(0xff4081, 220, 0.3);
    this.tweens.add({ targets: this.feverGlow, alpha: 0.14, yoyo: true, repeat: -1, duration: 260 });
    if (this.music) this.music.setRate(1.15);
  }

  gameOver() {
    this.state = 'over';
    this.fever = false; this.combo.reset(); this.updateHud();
    this.tweens.killTweensOf(this.feverGlow); this.feverGlow.setAlpha(0);
    if (this.music) this.music.setRate(1);
    this.lives > 0 ? Sfx.win() : Sfx.over();
    const isBest = this.score > this.best;
    if (isBest) { this.best = this.score; localStorage.setItem(this.storeKey('best'), String(this.best)); }
    window.__lastRun = { score: this.score, ...this.stats, lives: this.lives };
    (window.__runs = window.__runs || []).push(window.__lastRun);
    this.time.delayedCall(500, () => this.showOver(isBest));
  }

  showOver(isBest) {
    const { g, color } = Juice.grade(this.score, C.GRADES);
    let rankText;
    this.panel((c) => {
      c.add(this.add.text(W / 2, 150, this.lives <= 0 ? 'เกมโอเวอร์!' : 'หมดเวลา!', text(28, '#ff8a80')).setOrigin(0.5));
      const gradeText = this.add.text(W / 2, 238, g, text(96, color, { stroke: '#1a1440', strokeThickness: 8 })).setOrigin(0.5).setScale(0);
      c.add(gradeText);
      this.tweens.add({ targets: gradeText, scale: 1, duration: 420, delay: 700, ease: 'Back.out',
        onStart: () => { (g === 'S' || g === 'A') ? Sfx.combo() : Sfx.tick(); if (g === 'S') Juice.burst(W / 2, 238, 0xffd54f, 24, 260); } });
      const scoreText = this.add.text(W / 2, 320, '0', text(44, '#ffe082')).setOrigin(0.5);
      c.add(scoreText);
      Juice.countUp(scoreText, 0, this.score, 700, (v) => v.toLocaleString());
      c.add(this.add.text(W / 2, 362, `ทำได้ ${this.stats.hits} ครั้ง · คอมโบสูงสุด ${this.stats.maxCombo}`, text(15, '#c5cae9')).setOrigin(0.5));
      c.add(this.add.text(W / 2, 390, isBest ? 'สถิติใหม่ของคุณ!' : `คะแนนสูงสุด ${this.best.toLocaleString()}`, text(17, isBest ? '#b9f6ca' : '#c5cae9')).setOrigin(0.5));
      rankText = this.add.text(W / 2, 420, '', text(17, '#80deea')).setOrigin(0.5);
      c.add(rankText);
      return 432;
    }, 'เล่นอีกครั้ง', () => this.start());

    // ออนไลน์ + ได้คะแนน → ถามชื่อแล้วส่งให้กรรมการกลาง
    if (window.Online && Online.on && this.score > 0 && !BOT) {
      this.time.delayedCall(1500, () => {
        if (this.state !== 'over') return;
        Online.askName(this.score, this.run).then((res) => {
          if (!res || !rankText.active) return;
          rankText.setText(res.ok ? `อันดับที่ ${res.rank} บนจอใหญ่!` : `ไม่บันทึก: ${res.reason}`).setColor(res.ok ? '#80deea' : '#ff8a80');
          if (res.ok) Juice.punch(rankText, 1.25, 140);
        });
      });
    }
    if (BOT) this.time.delayedCall(2500, () => { if (this.state === 'over') { this.panelBox && this.panelBox.destroy(); this.panelBox = null; this.start(); } });
  }

  updateHud() {
    this.scoreText.setText(`★ ${(this.score || 0).toLocaleString()}`);
    const t = Math.ceil(this.timeLeft ?? C.GAME_TIME);
    this.timeText.setText(`${t} วิ`).setColor(this.state === 'play' && t <= 5 ? '#ff5252' : this.fever ? '#ff80ab' : '#ffffff');
    this.livesText.setText('♥'.repeat(Math.max(0, this.lives ?? C.LIVES)));
    const cb = this.combo.count >= 2 ? `×${this.combo.mult} · ${this.combo.count} คอมโบ` : '';
    this.comboText.setText(this.fever ? `FEVER ×${C.FEVER_MULT}  ${cb}` : cb);
  }

  update(time, deltaMs) {
    if (this.state !== 'play' || Juice.frozen()) return;
    const dt = Math.min(deltaMs, 50) / 1000;
    this.timeLeft -= dt;
    this.speedTimer += dt;
    if (this.speedTimer >= 5) { this.speedTimer -= 5; this.speedMult *= C.SPEED_UP; }
    if (!this.fever && this.timeLeft <= C.FEVER_TIME) this.enterFever();
    const sec = Math.ceil(this.timeLeft);
    if (sec <= 5 && sec < this.lastTick) { this.lastTick = sec; Sfx.tick(); Juice.punch(this.timeText, 1.3); }

    if (BOT) this.botPlay(time);
    this.updatePlay(dt, time);
    if (this.combo.expired(time)) this.combo.reset();
    this.updateHud();
    if (this.lives <= 0 || this.timeLeft <= 0) { this.timeLeft = Math.max(0, this.timeLeft); this.updateHud(); this.gameOver(); }
  }
}

function boot() {
  window.__game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: W * Z,
    height: H * Z,
    backgroundColor: '#05040f',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: [Game]
  });
}
// รอฟอนต์ไทยโหลดก่อน ตัวหนังสือจะได้ไม่กระพริบเปลี่ยนฟอนต์
(document.fonts ? Promise.race([document.fonts.load(`700 20px ${FONT}`), new Promise((r) => setTimeout(r, 2000))]) : Promise.resolve()).then(boot, boot);
