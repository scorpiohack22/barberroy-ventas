// ================= SCENES — VIDEO 7 BLOCK 7 "CIERRE" (EXPEDIENTE 007, warm, PAPEL RECORTADO look) =================
let P44 = '44_0', P45 = '45_0', P46 = '46_1';
const PH_LIST = [P44, P45, P46];
const PH_GRADE = { [P44]: 'brightness(1.04) contrast(1.04) saturate(1.05)', [P45]: 'brightness(1.03) contrast(1.03)', [P46]: 'brightness(1.03) contrast(1.03)' };
const hasPh = id => !!PH[id];
// neutral "IA" robot (generic AI, not one of the 5)
V7R.COL.ia = { body: '#cfc8ba', dark: '#8f877a', rim: '#f6f1e6', eye: '#e6fbff', glow: '#9fe8ff', screen: '#141c24', name: 'IA' }; V7R.SEED.ia = 71;
const BOT = (x, y, s, id, t, o = {}) => V7R.robot(ctx, x, y, s, id, Object.assign({ t }, o));
const stepT = (lt, k = 2) => Math.floor(lt * 24 / k) * k / 24; // stop-motion camera (updates every k frames)

// ---------- shared paper night/dusk diorama ----------
function paperSky(t, o = {}) {
  ctx.fillStyle = vgrad(0, H, o.sky || [[0, '#15122e'], [.55, '#2e2450'], [1, '#4a2f4a']]); ctx.fillRect(-300, -300, W + 600, H + 600);
  backlight(o.bx ?? 960, o.by ?? 600, o.br ?? 950, o.bcol || 'rgba(255,165,95,.5)');
  const R = rng(o.seed || 5); for (let i = 0; i < (o.stars ?? 26); i++) { const x = R() * W, y = R() * 430, r = 4 + R() * 7; pstar(x + (o.px || 0) * .15, y, r, 'rgba(255,240,200,.9)', i + 40); }
  if (o.moon !== false) { const mx = (o.mx ?? 1520) + (o.px || 0) * .15, my = o.my ?? 190; glow(mx, my, 240, 'rgba(255,230,170,.35)'); pcirc(mx, my, 66, 66, '#f6e7c4', { sh: 6 }, 91); pcirc(mx - 18, my - 10, 12, 10, '#e8d4a8', { sh: 0, rim: 0 }, 92); }
}
function paperHills(t, o = {}) {
  const px = o.px || 0, c = o.cols || ['#2a2147', '#3b2b55', '#5a3a4a'];
  ctx.save(); ctx.translate(px * .25, 0); pband(x => (o.y0 ?? 560) - 70 * Math.sin(x * .004 + 1) - 40 * Math.sin(x * .011), H + 300, c[0], { sh: 8, blur: 18 }, 31); ctx.restore();
  ctx.save(); ctx.translate(px * .5, 0); pband(x => (o.y1 ?? 650) - 50 * Math.sin(x * .005 + 3) - 22 * Math.sin(x * .017), H + 300, c[1], { sh: 10, blur: 20 }, 32); ctx.restore();
}
function paperGround(o = {}) { const px = o.px || 0; ctx.save(); ctx.translate(px * .8, 0); pband(x => (o.y ?? 760) - 10 * Math.sin(x * .006), H + 300, o.col || '#6a4a3c', { sh: 12, blur: 22 }, 33); ctx.restore(); }
// railway fork: trunk from bottom (bx,by) to fork point (fx,fy), branches to l & r
function paperFork(bx, by, fx, fy, l, r, w0, w1) { const wm = lerp(w0, w1, .45); pTrack([fx, fy], l, wm, w1, 2); pTrack([fx, fy], r, wm, w1, 3); pTrack([bx, by], [fx, fy], w0, wm, 1); }

// ---------- S1 0.00 "Porque al final, la IA no tiene moral propia." — lonely IA robot at the lever, empty heart-shaped hole ----------
SC.moral = { tinAt0: 0, label: { txt: 'SIN MORAL', at: 1.55, pos: 'bl' }, noFlicker: 1, draw(lt, d, t) {
  const k = easeIO(lt / d), px = lerp(30, -30, k);
  paperSky(t, { px, bx: 900, by: 640 });
  paperHills(t, { px });
  paperGround({ px, y: 770 });
  ctx.save(); ctx.translate(px * .8, 0);
  paperFork(1010, 1180, 1000, 930, [800, 784], [1200, 784], 120, 30);
  ctx.restore();
  ctx.save(); ctx.translate(px * 1.0, 0);
  // lever next to the robot
  pLever(1260, 960, 1.15, -.18, t, { glow: .35 + .2 * Math.sin(t * 3) });
  // the robot looks down at its own chest
  const lookDown = easeOut(at(lt, .9, 1.3));
  const S = 1.5, rx = 780, ry = 960;
  BOT(rx, ry, S, 'ia', t, { look: [.1 * (1 - lookDown), lerp(.1, .9, lookDown)], tilt: .1 * lookDown, mouth: 'flat', armL: .25, armR: .55 });
  // empty heart-shaped hole on the chest (cut out of the paper, backlit)
  const hp = easeOut(at(lt, 1.1, 1.6)), hx = rx, hy = ry - 112 * S + 6;
  if (hp > 0) {
    ctx.save(); ctx.globalAlpha = hp;
    const hpts = heartPts(hx, hy, 46 * (.6 + .4 * hp));
    pathPts(hpts); ctx.fillStyle = '#0d0a18'; ctx.fill();
    ctx.save(); pathPts(hpts); ctx.clip(); glow(hx, hy + 10, 70, 'rgba(120,200,255,.25)'); ctx.restore();
    ctx.setLineDash([10, 8]); ctx.lineDashOffset = -t * 30; ctx.strokeStyle = 'rgba(255,240,210,.9)'; ctx.lineWidth = 4; pathPts(hpts); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  }
  pQuestion(hx + 120, hy - 150, 120, at(lt, 1.75, 2.15), t);
  ctx.restore();
  pVignette(.4);
}, cam: (lt, d) => ({ z: lerp(1.0, 1.07, easeIO(lt / d)), y: lerp(0, 20, easeIO(lt / d)), weave: .3, vig: .35, grain: .08 }) };

// ---------- S2 2.86 "Tiene la que le pusimos nosotros." — photo 44 (human + robot hand on the same lever) / drawn paper hands ----------
let S2 = { f: [[.4, .5], [.42, .46]], z: [1.02, 1.12] };
function sleeveHuman(gx, gy, off) { // arm coming from the left, ending at the grip
  ctx.save(); ctx.translate(off, 0);
  PP([[-400, gy - 70], [gx - 190, gy - 62], [gx - 175, gy + 78], [-400, gy + 90]], '#3c5f96', { sh: 12, blur: 20 }, 141);
  PP([[gx - 215, gy - 68], [gx - 160, gy - 66], [gx - 150, gy + 82], [gx - 205, gy + 84]], '#f1ead8', { sh: 6 }, 142);
  // palm behind the stick
  prect(gx - 170, gy - 66, 175, 140, 50, '#e2a27a', { sh: 8 }, 143);
  ctx.restore();
}
function fingersHuman(gx, gy, off) {
  ctx.save(); ctx.translate(off, 0);
  for (let i = 0; i < 4; i++) prect(gx - 40, gy - 62 + i * 33, 92 - Math.abs(i - 1.3) * 8, 32, 15, '#e8ad86', { sh: 5, blur: 8, rimK: .5 }, 150 + i);
  // thumb over the top
  PP([[gx - 120, gy - 40], [gx - 20, gy - 92], [gx + 18, gy - 78], [gx - 4, gy - 52], [gx - 96, gy - 10]], '#e8ad86', { sh: 6, blur: 10 }, 158);
  ctx.restore();
}
function sleeveBot(gx, gy, off) { // robot arm from the right
  ctx.save(); ctx.translate(off, 0);
  PP([[W + 400, gy - 64], [gx + 190, gy - 56], [gx + 175, gy + 70], [W + 400, gy + 84]], '#8f877a', { sh: 12, blur: 20 }, 161);
  for (let k = 0; k < 4; k++) prect(gx + 260 + k * 120, gy - 60, 18, 136, 6, '#6e675c', { sh: 3, rim: .4 }, 162 + k);
  prect(gx + 160, gy - 74, 50, 160, 14, '#cfc8ba', { sh: 7 }, 167);
  prect(gx - 6, gy - 62, 180, 132, 30, '#cfc8ba', { sh: 8 }, 168);
  ctx.restore();
}
function fingersBot(gx, gy, off) {
  ctx.save(); ctx.translate(off, 0);
  for (let i = 0; i < 4; i++) { const y = gy - 58 + i * 32; prect(gx - 52, y, 44, 28, 10, '#d8d2c4', { sh: 5, blur: 8 }, 170 + i); prect(gx - 6, y + 2, 42, 24, 9, '#bdb5a6', { sh: 4, blur: 6 }, 175 + i); pcirc(gx - 8, y + 14, 5, 5, '#6e675c', { sh: 0, tex: 0, rim: 0 }, 180 + i); }
  PP([[gx + 120, gy - 40], [gx + 40, gy - 88], [gx - 4, gy - 80], [gx + 16, gy - 52], [gx + 100, gy - 8]], '#d8d2c4', { sh: 6, blur: 10 }, 186);
  ctx.restore();
}
function handsFallback(lt, d, t) {
  const st = stepT(lt);
  ctx.fillStyle = vgrad(0, H, [[0, '#7a3a2a'], [.5, '#b8633a'], [1, '#5a2a22']]); ctx.fillRect(-300, -300, W + 600, H + 600);
  backlight(960, 430, 1000, 'rgba(255,200,120,.65)');
  // rays + layered paper arches (back)
  for (let i = 0; i < 9; i++) { ctx.save(); ctx.globalAlpha = .07; ctx.fillStyle = '#ffe2b0'; ctx.beginPath(); ctx.moveTo(960, 430); const a = -Math.PI / 2 + (i - 4) * .3 + Math.sin(t * .4) * .02; ctx.lineTo(960 + Math.cos(a - .06) * 1600, 430 + Math.sin(a - .06) * 1600); ctx.lineTo(960 + Math.cos(a + .06) * 1600, 430 + Math.sin(a + .06) * 1600); ctx.fill(); ctx.restore(); }
  for (let i = 0; i < 3; i++) { const r = 820 - i * 150; PP(circPts(960, 1180, r * 1.25, r, 48), ['#8a3f2c', '#a5502f', '#c76a38'][i], { sh: 12, blur: 26 }, 120 + i); }
  const gyH = 520, gyB = 760, gx = 960;
  const inH = easeOut(at(st, .1, .85)), inB = easeOut(at(st, .25, 1.0));
  const offH = (1 - inH) * -620, offB = (1 - inB) * 620;
  sleeveHuman(gx, gyH, offH); sleeveBot(gx, gyB, offB);
  // the lever stick (in front of palms)
  const jj = jit(t, 9, 1.2, .004);
  ctx.save(); ctx.translate(jj[0], jj[1]);
  prect(gx - 26, 210, 52, 1000, 20, '#d4cdbd', { sh: 12, blur: 18 }, 130);
  const pulse = at(st, 1.0, 1.4);
  glow(gx, 190, 220, `rgba(255,90,60,${.3 + .35 * Math.sin(pulse * Math.PI)})`);
  pcirc(gx, 190, 74, 74, '#d8432f', { sh: 10 }, 131); pcirc(gx - 22, 168, 20, 16, '#f08c74', { sh: 0, tex: 0, rim: 0 }, 132);
  ctx.restore();
  fingersHuman(gx, gyH, offH); fingersBot(gx, gyB, offB);
  // a small paper heart lights up between the hands on "nosotros"
  const hp = at(st, 1.05, 1.45);
  if (hp > 0) { ctx.save(); ctx.globalAlpha = clamp(hp * 2); glow(gx, 640, 200 * hp, 'rgba(255,120,110,.5)'); const k = backOut(hp); ctx.translate(gx + 170, 640); ctx.scale(k, k); PP(heartPts(0, 0, 62), '#e8484f', { sh: 8, blur: 12 }, 190); ctx.restore(); }
  pVignette(.45);
}
SC.pusimos = { tin: 'leak', label: { txt: 'NOSOTROS', at: .95, pos: 'br' }, noFlicker: 1, draw(lt, d, t) {
  if (!hasPh(P44)) { handsFallback(lt, d, t); return; }
  photoShot(P44, stepT(lt, 3), d, { z: S2.z, f: S2.f, ease: easeIO });
  photoPaperFX(.16, .2);
}, cam: (lt, d) => ({ vig: .38, grain: .08, weave: .4 }) };

// ---------- S3 4.94 "Por eso yo no le tengo miedo: aprendo a usarla." — user photo 45 / drawn: Scorpio + friendly IA on the laptop ----------
let S3 = { f: [[.45, .5], [.52, .52]], z: [1.0, 1.08], q: [[1152, 494], [1660, 522], [1553, 914], [1097, 864]] };
const scrAssist = t => (sw, sh) => { // clean, text-free friendly AI assistant screen
  ctx.fillStyle = vgrad(-sh / 2, sh / 2, [[0, '#f4efe6'], [1, '#e6ddcf']]); ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
  ctx.fillStyle = '#d9d0c2'; ctx.fillRect(-sw / 2, -sh / 2, sw, 34); [0, 1, 2].forEach(i => { ctx.fillStyle = ['#e86a5a', '#e8b84a', '#6ab86a'][i]; ctx.beginPath(); ctx.arc(-sw / 2 + 24 + i * 22, -sh / 2 + 17, 7, 0, 7); ctx.fill(); });
  glow(-60, 20, 260, 'rgba(255,200,130,.35)');
  V7R.robot(ctx, -90, sh / 2 - 40, .78, 'ia', { t, eyes: 'happy', mouth: 'smile', armR: 2.5 + Math.sin(t * 7) * .35, armL: .2, shadow: true });
  [[90, -120, 210], [130, -40, 150], [70, 40, 190]].forEach(([x, y, w], i) => { const on = clamp((t % 6) - i * .4); ctx.globalAlpha = .4 + .6 * on; ctx.fillStyle = i === 1 ? '#e0773a' : '#ffffff'; ctx.beginPath(); ctx.roundRect(x - w / 2 + 40, y, w, 46, 20); ctx.fill(); ctx.globalAlpha = 1; });
};
function laptopFront(x, y, s, t, lt) { // screen faces the viewer; base on the desk at (x,y)
  group(x, y, s, () => {
    prect(-250, -330, 500, 320, 22, '#3a3f48', { sh: 12, blur: 20 }, 201);
    prect(-228, -310, 456, 278, 12, '#16202c', { sh: 0, rim: .3 }, 202);
    ctx.save(); ctx.beginPath(); ctx.rect(-228, -310, 456, 278); ctx.clip();
    glow(0, -170, 300, 'rgba(120,220,255,.35)');
    const wave = Math.sin(t * 7) * .35;
    BOT(0, -40, .62, 'ia', t, { eyes: lt > 1.6 ? 'happy' : 'open', mouth: 'smile', armR: 2.5 + wave, armL: .2, look: [-.4, 0] });
    ctx.restore();
    PP([[-290, -10], [290, -10], [320, 26], [-320, 26]], '#8f959e', { sh: 8 }, 203);
  });
}
function miedoFallback(lt, d, t) {
  ctx.fillStyle = vgrad(0, H, [[0, '#d99a5c'], [1, '#a8643a']]); ctx.fillRect(-300, -300, W + 600, H + 600);
  backlight(1250, 380, 900, 'rgba(255,215,150,.55)');
  // window + paper shelves (back layers)
  prect(1200, 130, 520, 380, 14, '#f3e1bd', { sh: 12, blur: 22 }, 210);
  ctx.save(); ctx.beginPath(); ctx.rect(1222, 152, 476, 336); ctx.clip(); ctx.fillStyle = vgrad(152, 488, [[0, '#ffcf8a'], [1, '#f39a5a']]); ctx.fillRect(1222, 152, 476, 336);
  pband(x => 420 - 30 * Math.sin(x * .02), 600, '#e07a48', { sh: 6, blur: 10 }, 211); ctx.restore();
  line([[1460, 152], [1460, 488]], 10, '#f3e1bd');
  prect(140, 250, 420, 26, 6, '#7a4a30', { sh: 8 }, 212); prect(140, 420, 420, 26, 6, '#7a4a30', { sh: 8 }, 213);
  [[170, 160, '#3c5f96'], [220, 175, '#e0773a'], [262, 150, '#2f9e6a'], [310, 170, '#7b4fd0'], [430, 160, '#d8432f']].forEach(([x, h, c], i) => prect(x, 250 - h * .55, 40, h * .55, 4, c, { sh: 5 }, 220 + i));
  pcirc(470, 380, 36, 36, '#5fa36a', { sh: 6 }, 228); prect(450, 380, 40, 40, 6, '#c76a38', { sh: 5 }, 229);
  // Scorpio behind the desk
  person(720, 1160, .95, DET, { pose: 'none', talk: env(t), lid: .2, blink: blinkAt(t, .3), brow: .05, look: [.55, .05], mouth: lt > 1.6 ? 'smile' : undefined }, t);
  // desk (front paper layer)
  PP([[-300, 800], [W + 300, 800], [W + 300, H + 300], [-300, H + 300]], '#7a4a30', { sh: 14, blur: 24 }, 230);
  PP([[-300, 800], [W + 300, 800], [W + 300, 838], [-300, 838]], '#9a6440', { sh: 6 }, 231);
  laptopFront(1270, 820, 1.0, t, lt);
  mug(430, 790, 0, .7); steam(430, 740, t, 2, 110, 'rgba(255,255,255,.35)');
  pVignette(.35);
}
SC.miedo = { tin: 'cut', label: { txt: 'SIN MIEDO', at: 1.6, pos: 'bl' }, draw(lt, d, t) {
  if (!hasPh(P45)) { miedoFallback(lt, d, t); return; }
  photoShot(P45, lt, d, { z: S3.z, f: S3.f, ease: easeIO, over: () => quadScreen(scrAssist(t), 760, 560, S3.q, { tint: '#efd9b4', blur: .6, glow: 'rgba(255,220,170,.10)', glowR: 400 }) });
}, cam: (lt, d) => hasPh(P45) ? ({ vig: .42 }) : ({ z: lerp(1.0, 1.05, easeIO(lt / d)), vig: .35, grain: .08 }) };

// ---------- S4 7.80 "¿Y tú? ¿A cuál le dejarías la palanca?" — the 5 robots line up, lever in the middle, "?" ----------
const PAL = 1.84; // "palanca" (9.64)
SC.palanca = { tin: 'whip', noFlicker: 1, draw(lt, d, t) {
  const k = easeIO(lt / d), px = lerp(-24, 24, k);
  paperSky(t, { px, bx: 960, by: 520, br: 1000, moon: false, seed: 9, stars: 30 });
  paperHills(t, { px, y0: 470, y1: 560 });
  // raised paper ledge where the robots stand
  ctx.save(); ctx.translate(px * .7, 0);
  PP([[-300, 585], [W + 300, 585], [W + 300, 700], [-300, 700]], '#7a5442', { sh: 10, blur: 18 }, 301);
  ctx.restore();
  paperGround({ px, y: 700, col: '#5a3e34' });
  // fork tracks in the foreground
  ctx.save(); ctx.translate(px, 0); paperFork(960, 1240, 960, 990, [640, 712], [1280, 712], 130, 34); ctx.restore();
  // robots
  const ids = V7R.IDS;
  ctx.save(); ctx.translate(px * .7, 0);
  ids.forEach((id, i) => {
    const x = 960 + (i - 2) * 360, on = at(lt, .05 + i * .22, .25 + i * .22), down = easeOut(at(lt, PAL, PAL + .3));
    if (on > 0) backlight(x, 470, 230, `rgba(255,200,130,${.25 * on})`);
    const lx = (960 - x) / 900;
    BOT(x, 600, .95, id, t, { dim: .55 * (1 - on), plaque: true, look: [lerp(lx * .4, lx, down), lerp(0, .8, down)], mouth: down > .5 ? 'o' : 'flat', bob: -10 * Math.sin(on * Math.PI) });
  });
  ctx.restore();
  // the lever in the middle (foreground)
  const g = at(lt, PAL, PAL + .3);
  ctx.save(); ctx.translate(px, 0); pLever(960, 945, .7, Math.sin(t * 2.2) * .04, t, { glow: g * (.8 + .2 * Math.sin(t * 6)) }); ctx.restore();
  pQuestion(960, 150, 150, at(lt, PAL + .1, PAL + .5), t);
  pVignette(.42);
}, cam: (lt, d) => ({ z: lerp(1.06, 1.0, easeIO(lt / d)), y: lerp(-20, 0, easeIO(lt / d)), weave: .3, vig: .35, grain: .08 }) };

// ---------- S5 10.48 "Déjamelo en los comentarios." — detective office, toy train set on the desk with a tiny lever ----------
function toyTrainSet(cx, cy, s, t) {
  group(cx, cy, s, () => {
    const rx = 230, ry = 62;
    PP(circPts(0, 0, rx + 46, ry + 30, 40), '#2f5a3a', { sh: 8, blur: 12 }, 401); // green felt base
    ctx.strokeStyle = '#6b4a34'; ctx.lineWidth = 9; for (let i = 0; i < 34; i++) { const a = i / 34 * 6.283, c = Math.cos(a), sn = Math.sin(a); ctx.beginPath(); ctx.moveTo(c * (rx - 14), sn * (ry - 6)); ctx.lineTo(c * (rx + 14), sn * (ry + 6)); ctx.stroke(); }
    ctx.strokeStyle = '#c9c6c0'; ctx.lineWidth = 3.5; for (const dr of [-8, 8]) { ctx.beginPath(); ctx.ellipse(0, 0, rx + dr, ry + dr * .3, 0, 0, 6.283); ctx.stroke(); }
    const cars = [['#d8432f', 1], ['#3d7fe0', 0], ['#f2c14e', 0]];
    const items = cars.map(([col, eng], i) => { const a = smT(t) * 1.4 - i * .42; return { a, col, eng, x: Math.cos(a) * rx, y: Math.sin(a) * ry }; }).sort((p, q) => p.y - q.y);
    for (const c of items) { const sc = 1 + c.y / ry * .12; group(c.x, c.y, sc, () => {
      prect(-34, -40, 68, 36, 8, c.col, { sh: 5, blur: 7 }, 410);
      if (c.eng) { prect(-26, -64, 26, 26, 5, '#2a2a30', { sh: 3 }, 411); prect(8, -58, 14, 20, 4, '#2a2a30', { sh: 3 }, 412); glow(30, -24, 30, 'rgba(255,230,150,.5)'); }
      pcirc(-18, -2, 9, 9, '#222', { sh: 2, rim: 0 }, 413); pcirc(18, -2, 9, 9, '#222', { sh: 2, rim: 0 }, 414);
    }); }
    pLever(rx + 70, 40, .26, -.25 + Math.sin(t * 1.5) * .05, t, {});
  });
}
SC.comentarios = { tin: 'cut', label: { txt: 'COMENTARIOS', at: .15, pos: 'bl' }, draw(lt, d, t) {
  noirOffice(t, { dx: -260, part: 'back', blinds: .14 });
  person(760, 1150, .95, DET, { pose: 'none', talk: env(t), lid: .2, blink: blinkAt(t, .7), brow: .15, browUp: .3, look: [.1, .05], mouth: 'smile',
    arms: detPoint(.2), prop: () => pointerFinger(400, -640 - .2 * 120, -.5) }, t);
  blindStripes(.07, { x0: 200, y0: 160, n: 8, gap: 62, bw: 26, len: 1500 });
  noirOffice(t, { dx: -260, part: 'front' });
  toyTrainSet(1560, 905, 1.0, t);
}, cam: (lt, d) => ({ z: lerp(1.02, 1.07, easeIO(lt / d)), x: 40 }) };

// ---------- S6 12.24 "Y si quieres aprender a usar la IA para crear contenido," — user photo 46 / drawn golden-hour tracks ----------
let S6 = { f: [[.49, .43], [.49, .40]], z: [1.0, 1.09] };
function crearFallback(lt, d, t) {
  const k = easeIO(lt / d), px = lerp(-20, 20, k);
  paperSky(t, { sky: [[0, '#f2a65a'], [.6, '#f6c27a'], [1, '#e08850']], bx: 1300, by: 560, br: 900, bcol: 'rgba(255,240,190,.7)', moon: false, stars: 0, px });
  ctx.save(); ctx.translate(px * .2, 0); pcirc(1300, 560, 120, 120, '#fff0c0', { sh: 0, rim: 0 }, 501); ctx.restore();
  paperHills(t, { px, cols: ['#c46a48', '#a8503c'], y0: 590, y1: 660 });
  paperGround({ px, y: 740, col: '#7a4a34' });
  ctx.save(); ctx.translate(px, 0); pTrack([1240, 1300], [1260, 742], 210, 40, 6); ctx.restore();
  ctx.save(); ctx.translate(px * 1.1, 0);
  person(650, 1040, .78, DET, { pose: 'stand', talk: env(t), lid: .2, blink: blinkAt(t, .2), brow: .05, look: [.2, .05], mouth: 'smile' }, t);
  // helper robot holding a phone camera on a stick
  BOT(930, 1030, .62, 'ia', t, { armR: 2.4, armL: .2, eyes: 'happy', mouth: 'smile', handFn: (c, hx, hy, side) => { if (side !== 'r') return; c.save(); c.translate(hx, hy - 30); prect(-28, -60, 56, 92, 10, '#1d2b36', { sh: 4 }, 520); pcirc(0, -40, 8, 8, '#6a7a86', { sh: 0, rim: 0 }, 521); pcirc(14, 18, 6, 6, '#ff4a3a', { sh: 0, rim: 0, tex: 0 }, 522); c.restore(); } });
  ctx.restore();
  pVignette(.35);
}
SC.crear = { tin: 'leak', label: { txt: 'CREAR CONTENIDO', at: 1.6, pos: 'br' }, draw(lt, d, t) {
  if (!hasPh(P46)) { crearFallback(lt, d, t); return; }
  photoShot(P46, lt, d, { z: S6.z, f: S6.f, ease: easeIO });
}, cam: (lt, d) => hasPh(P46) ? ({ vig: .4 }) : ({ z: lerp(1.0, 1.04, easeIO(lt / d)), vig: .35, grain: .08 }) };

// ---------- S7/S8 15.10 / 18.12 paper end card "SCORPIO NET" + "ESCRÍBEME IA" ----------
const HANDLE = 'SCORPIO NET';
const EC0 = 15.10, EC_SEARCH = 15.25 - EC0, EC_TYPE0 = 16.92 - EC0, EC_TYPE1 = 17.62 - EC0, EC_NAME = 16.95 - EC0, EC_BTN = 18.22 - EC0, EC_IA = 19.40 - EC0, EC_SEND = 20.10 - EC0;
let END_AV = [.49, .40, .26];
function planeIcon(x, y, s, col) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-30, -4); ctx.lineTo(34, -30); ctx.lineTo(14, 32); ctx.lineTo(4, 8); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(4, 8); ctx.lineTo(34, -30); ctx.stroke(); ctx.restore(); }
function endCard(lt, t) { // lt measured from EC0
  ctx.fillStyle = vgrad(0, H, [[0, '#3a1c18'], [1, '#1a0c0a']]); ctx.fillRect(-300, -300, W + 600, H + 600);
  backlight(960, 470, 1100, 'rgba(255,150,80,.45)');
  // layered paper waves (back → front)
  const cols = ['#5a2a22', '#7a3626', '#a8502e', '#d06e36'];
  cols.forEach((c, i) => { const y0 = 760 + i * 70, sp = .2 + i * .25; pband(x => y0 - 40 * Math.sin(x * .004 + i * 1.7 + t * .15 * sp) - 18 * Math.sin(x * .013 + i), H + 300, c, { sh: 10, blur: 22 }, 600 + i); });
  const R = rng(31); for (let i = 0; i < 14; i++) { const x = 120 + R() * 1680, y = 80 + R() * 600, r = 5 + R() * 8; pstar(x, y + Math.sin(t + i) * 4, r, 'rgba(255,225,170,.8)', 620 + i); }
  const up = easeOut(at(lt, 0, .5)), cy = lerp(600, 560, up);
  ctx.save(); ctx.globalAlpha = up;
  // search bar (paper strip) — "me encuentras en Instagram como"
  const sp = easeOut(at(lt, EC_SEARCH, EC_SEARCH + .35));
  if (sp > 0) { ctx.save(); ctx.globalAlpha *= sp; const by = cy - 365 + (1 - sp) * 20;
    prect(560, by - 44, 800, 88, 44, '#fbf3e2', { sh: 9, blur: 16 }, 630);
    ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(618, by - 4, 18, 0, 7); ctx.stroke(); line([[631, by + 9], [648, by + 26]], 7, '#6a5a4a');
    const n = Math.floor(clamp((lt - EC_TYPE0) / (EC_TYPE1 - EC_TYPE0)) * HANDLE.length), s = HANDLE.slice(0, n);
    ctx.font = '44px M9'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#2a2018'; ctx.fillText(s, 680, by + 2);
    if (Math.floor(lt * 2.4) % 2 === 0 || (n > 0 && n < HANDLE.length)) { const cw = ctx.measureText(s).width; ctx.fillRect(684 + cw, by - 22, 4, 46); }
    ctx.restore(); }
  // profile card (two paper layers)
  prect(478, cy - 244, 1000, 520, 40, '#c98a50', { sh: 14, blur: 30 }, 640);
  prect(460, cy - 262, 1000, 520, 40, '#fbf3e2', { sh: 10, blur: 20 }, 641);
  // avatar
  const ax = 640, ay = cy - 40, ar = 130, pop = backOut(at(lt, .2, .65));
  ctx.save(); ctx.translate(ax, ay); ctx.scale(pop, pop);
  pcirc(0, 0, ar + 16, ar + 16, '#e0703a', { sh: 8, blur: 14 }, 650);
  pcirc(0, 0, ar + 5, ar + 5, '#fbf3e2', { sh: 0 }, 651);
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, ar, 0, 7); ctx.clip();
  if (PH[P46]) { const im = PH[P46], c = END_AV; const s = (2 * ar / (c[2] * im.width)); ctx.drawImage(im, -c[0] * im.width * s, -c[1] * im.height * s, im.width * s, im.height * s); }
  else { ctx.fillStyle = vgrad(-ar, ar, [[0, '#f2a65a'], [1, '#c4603a']]); ctx.fillRect(-ar, -ar, 2 * ar, 2 * ar); group(0, 330, .33, () => person(0, 0, 1, DET, { pose: 'none', lid: .2, blink: blinkAt(t, .4), mouth: 'smile' }, t)); }
  ctx.restore(); ctx.restore();
  // handle
  const np = at(lt, EC_NAME, EC_NAME + .45);
  if (np <= 0) rrect(830, cy - 120, 460, 70, 20, 'rgba(60,40,25,.13)', 0);
  else { ctx.save(); const k = backOut(np); ctx.translate(830, cy - 85); ctx.scale(k, k); ptext(HANDLE, 0, 4, 80, '#1e1610', 'M9', { align: 'left', sh: 4, blur: 6, rim: 0 }); ctx.restore(); }
  rrect(830, cy - 10, 380, 22, 11, 'rgba(60,40,25,.18)', 0); rrect(830, cy + 34, 280, 22, 11, 'rgba(60,40,25,.12)', 0);
  // write-me button (presses on "escríbeme")
  const press = Math.sin(clamp(at(lt, EC_BTN, EC_BTN + .5)) * Math.PI), bp = 1 + .07 * press;
  ctx.save(); ctx.translate(1000, cy + 150); ctx.scale(bp, bp);
  prect(-170, -48, 520, 96, 48, '#e0703a', { sh: 8 - 5 * press, blur: 14 }, 660);
  planeIcon(-110, 0, 1, '#fff'); ctx.font = '52px M9'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText('ESCRÍBEME', -60, 3); ctx.restore();
  ctx.restore();
  // "IA" message bubble (paper) pops out to the right of the button on "la palabra IA"
  const ip = at(lt, EC_IA, EC_IA + .4);
  if (ip > 0) { const k = backOut(ip), bx = 1650, by = cy + 20;
    ctx.save(); ctx.translate(bx, by); ctx.scale(k, k); ctx.rotate(.04);
    glow(0, 0, 240, 'rgba(255,190,110,.35)');
    PP([[-120, -80], [120, -80], [120, 60], [-20, 60], [-70, 110], [-60, 60], [-120, 60]], '#fbf3e2', { sh: 10, blur: 18 }, 670);
    ptext('IA', 0, -8, 110, '#e0603a', 'AN', { sh: 4, blur: 6, rim: 0 });
    ctx.restore(); }
  // paper plane flies off on "te enseño"
  const fp = at(lt, EC_SEND, EC_SEND + 1.0);
  if (fp > 0 && fp < 1) { const e = easeIO(fp), x = lerp(1560, 2100, e), y = lerp(cy - 80, 120, e) - Math.sin(e * Math.PI) * 120; ctx.save(); ctx.translate(x, y); ctx.rotate(-.5 + e * .3); PP([[-50, 0], [50, -30], [10, 36], [0, 8]], '#f6efe2', { sh: 8, blur: 12 }, 680); ctx.restore(); }
  pVignette(.35);
}
SC.handle = { tin: 'dip', noFlicker: 1, draw(lt, d, t) { endCard(lt, t); }, cam: (lt, d) => ({ z: lerp(1.0, 1.03, easeIO(lt / d)), grain: .07, vig: .45, weave: .2 }) };
SC.escribeme = { tin: 'cut', noFlicker: 1, draw(lt, d, t) { endCard(lt + (18.12 - EC0), t); }, cam: (lt, d) => ({ z: lerp(1.16, 1.2, easeIO(lt / d)), x: lerp(190, 215, easeIO(lt / d)), y: lerp(40, 50, easeIO(lt / d)), grain: .07, vig: .45, weave: .2 }) };

// ---------- S9 21.14 "Caso cerrado." — paper folder EXPEDIENTE 007, toy train, CASO CERRADO stamp ----------
const ST9 = .1;
function miniLineup(w, h, t) { ctx.fillStyle = vgrad(0, h, [[0, '#2e2450'], [1, '#4a2f4a']]); ctx.fillRect(0, 0, w, h); glow(w / 2, h * .55, w * .6, 'rgba(255,170,100,.35)'); ctx.fillStyle = '#5a3e34'; ctx.fillRect(0, h * .78, w, h * .22); V7R.IDS.forEach((id, i) => V7R.robot(ctx, w * (.14 + i * .18), h * .86, h / 520, id, { t, shadow: false, blink: false })); }
SC.cerrado = { tin: 'cut', noFlicker: 1, draw(lt, d, t) {
  ctx.fillStyle = vgrad(0, H, [[0, '#5a3424'], [1, '#2e1a12']]); ctx.fillRect(-300, -300, W + 600, H + 600);
  backlight(900, 380, 1000, 'rgba(255,180,110,.4)');
  const R = rng(4); ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 3; for (let i = 0; i < 22; i++) { const y = -60 + i * 56 + R() * 20; ctx.beginPath(); ctx.moveTo(-300, y); ctx.bezierCurveTo(500, y + R() * 30 - 15, 1300, y + R() * 30 - 15, W + 300, y); ctx.stroke(); }
  // folder (paper layers)
  group(960, 500, 1, () => {
    prect(-430, -330, 300, 60, 12, '#c99a52', { sh: 8 }, 701);
    prect(-430, -300, 860, 640, 18, '#c99a52', { sh: 16, blur: 30 }, 702);
    prect(-410, -310, 820, 610, 14, '#f3ecdc', { sh: 6, blur: 10 }, 703);
    prect(-430, -280, 860, 640, 18, '#ddb46a', { sh: 10, blur: 18 }, 704);
    prect(-300, -230, 600, 100, 8, '#f6efdf', { sh: 4, blur: 6 }, 705);
    text('EXPEDIENTE 007', 0, -180, 58, '#2a2420', 'TY');
    polaroid((w, h) => miniLineup(w, h, t), 0, 110, 520, 260, -.03, { noPin: true, kind: 'print' });
    paperclip(-240, -40, 1.1);
  });
  toyTrainSet(1500, 945, .7, t);
  stamp('CASO CERRADO', 960, 610, 130, -.1, clamp((lt - ST9) / .4));
  pVignette(.4);
}, cam: (lt, d) => ({ z: lerp(1.0, 1.03, easeIO(lt / d)), shake: stampShake(lt, [{ at: ST9, shake: .5 }]), vig: .45, grain: .08 }) };
function paperclip(x, y, s = 1) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = '#b9bcc4'; ctx.lineWidth = 6 / LS; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-10, 60); ctx.lineTo(-10, -30); ctx.arc(4, -30, 14, Math.PI, 0); ctx.lineTo(18, 70); ctx.arc(4, 70, 14, 0, Math.PI); ctx.lineTo(-10, 0); ctx.stroke(); ctx.restore(); }

const SCN = [['moral', 0], ['pusimos', 2.86], ['miedo', 4.94], ['palanca', 7.80], ['comentarios', 10.48], ['crear', 12.24], ['handle', 15.10], ['escribeme', 18.12], ['cerrado', 21.14]];
const DUR = 22.5, FADE_IN = 0, FADE_OUT = 0;
