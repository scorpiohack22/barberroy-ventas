// Escenas 3D low-poly. Cada escena: build() -> { scene, camera, update(lt, info), draw2d?(ctx, lt, info) }
// lt = segundos desde que empezó la escena. info.marks = inicio (relativo) de cada línea del guion en la escena.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const W = 720, H = 1280;

// ---------- utilidades ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const easeOut = x => 1 - Math.pow(1 - clamp(x), 3);
export const easeInOut = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const easeBack = x => { x = clamp(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
export const lerp = (a, b, t) => a + (b - a) * t;
export const prog = (lt, a, b) => clamp((lt - a) / (b - a));

export function rng(seed) { // mulberry32 determinista
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: .85, metalness: 0, ...o });

export function mesh(geo, material, { x = 0, y = 0, z = 0, rx = 0, cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.rotation.x = rx;
  m.castShadow = cast; m.receiveShadow = receive; return m;
}

export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.userData = { canvas: c, g, draw }; return t;
}

export function gradientBg(top, bottom, mid) {
  return canvasTex(8, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, top); if (mid) gr.addColorStop(.55, mid); gr.addColorStop(1, bottom);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
}

export function baseScene({ top, bottom, mid, fog, fogNear = 20, fogFar = 90, sun = '#fff1dc', sunI = 2.4, sunPos = [-6, 12, 9], hemi = 1.1, shadowSize = 12 }) {
  const scene = new THREE.Scene();
  scene.background = gradientBg(top, bottom, mid);
  if (fog) scene.fog = new THREE.Fog(fog, fogNear, fogFar);
  scene.add(new THREE.HemisphereLight('#dfe8ff', '#8c7f73', hemi));
  const d = new THREE.DirectionalLight(sun, sunI); d.position.set(...sunPos);
  d.castShadow = true; d.shadow.mapSize.set(1024, 1024);
  Object.assign(d.shadow.camera, { left: -shadowSize, right: shadowSize, top: shadowSize, bottom: -shadowSize, near: .5, far: 60 });
  d.shadow.bias = -0.0008; d.shadow.radius = 4; scene.add(d);
  const camera = new THREE.PerspectiveCamera(42, W / H, .05, 400);
  return { scene, camera, sun: d };
}

export function textSprite(text, { size = 64, color = '#fff', bg = null, stroke = '#000', font = 'Montserrat', weight = 900, pad = 18, scale = 1 } = {}) {
  const tmp = document.createElement('canvas').getContext('2d');
  tmp.font = `${weight} ${size}px ${font}`;
  const tw = Math.ceil(tmp.measureText(text).width) + pad * 2, th = Math.ceil(size * 1.35) + pad * 2;
  const tex = canvasTex(tw, th, (g, w, h) => {
    if (bg) { g.fillStyle = bg; roundRect(g, 0, 0, w, h, h * .3); g.fill(); }
    g.font = `${weight} ${size}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    if (stroke) { g.lineWidth = size * .16; g.strokeStyle = stroke; g.lineJoin = 'round'; g.strokeText(text, w / 2, h / 2 + 2); }
    g.fillStyle = color; g.fillText(text, w / 2, h / 2 + 2);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(tw / 200 * scale, th / 200 * scale, 1); s.userData.base = s.scale.clone(); return s;
}

export function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

export function popScale(sprite, k) { const b = sprite.userData.base; sprite.scale.set(b.x * k, b.y * k, 1); sprite.visible = k > .001; }

// ---------- personajes ----------
export function makePerson({ shirt = '#4f7d4f', pants = '#33384a', skin = '#e2b48c', hair = '#1c1917', apron = null, tufts = false, seed = 1 } = {}) {
  const g = new THREE.Group();
  const mSkin = mat(skin), mPants = mat(pants), mShirt = mat(shirt), mShoe = mat('#2a2522');
  const mHair = mat(hair, { roughness: .6 });
  const legs = [], arms = [];
  for (const sx of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(sx * .14, .86, 0);
    p.add(mesh(new THREE.BoxGeometry(.22, .82, .26), mPants, { y: -.41 }));
    p.add(mesh(new THREE.BoxGeometry(.24, .1, .36), mShoe, { y: -.82, z: .05 }));
    g.add(p); legs.push(p);
  }
  g.add(mesh(new THREE.BoxGeometry(.62, .72, .34), mShirt, { y: 1.2 }));
  if (apron) g.add(mesh(new THREE.BoxGeometry(.5, .8, .02), mat(apron), { y: 1.12, z: .18 }));
  for (const sx of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(sx * .4, 1.52, 0);
    p.add(mesh(new THREE.BoxGeometry(.17, .62, .2), mShirt, { y: -.3 }));
    p.add(mesh(new THREE.IcosahedronGeometry(.1, 0), mSkin, { y: -.66 }));
    g.add(p); arms.push(p);
  }
  g.add(mesh(new THREE.CylinderGeometry(.09, .1, .12, 8), mSkin, { y: 1.6 }));
  const head = new THREE.Group(); head.position.y = 1.83; g.add(head);
  const skull = mesh(new THREE.IcosahedronGeometry(.22, 1), mSkin); skull.scale.set(1, 1.12, 1); head.add(skull);
  for (const sx of [-1, 1]) {
    head.add(mesh(new THREE.SphereGeometry(.028, 8, 6), mat('#1b1b1b'), { x: sx * .08, y: .02, z: .2, cast: false }));
    head.add(mesh(new THREE.BoxGeometry(.09, .018, .02), mat('#3b2a20'), { x: sx * .08, y: .08, z: .205, cast: false }));
    head.add(mesh(new THREE.IcosahedronGeometry(.05, 0), mSkin, { x: sx * .225, y: 0 }));
  }
  head.add(mesh(new THREE.ConeGeometry(.035, .09, 4), mSkin, { y: -.04, z: .22 , rx: Math.PI / 2 }));
  head.add(mesh(new THREE.BoxGeometry(.1, .018, .02), mat('#9c5a4a'), { y: -.12, z: .19, cast: false }));
  const cap = mesh(new THREE.SphereGeometry(.235, 14, 8, 0, Math.PI * 2, 0, Math.PI * .5), mHair);
  cap.scale.set(1, 1.1, 1.05); cap.position.set(0, .02, -.015); cap.rotation.x = -.25; head.add(cap);
  const tuftList = [];
  if (tufts) {
    const r = rng(seed);
    for (let i = 0; i < 70; i++) {
      const th = r() * Math.PI * 2, ph = Math.acos(lerp(1, .12, r()));
      const n = new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th));
      if (n.z > .55 && n.y < .55) continue; // dejar la cara libre
      const t = mesh(new THREE.ConeGeometry(.045, .2 + r() * .12, 4), mHair, { cast: false });
      t.position.copy(n.clone().multiplyScalar(.22)).add(new THREE.Vector3(0, .05, -.02));
      t.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n.clone().add(new THREE.Vector3(0, .5, -.2)).normalize());
      t.userData = { home: t.position.clone(), q: t.quaternion.clone(), d: r(), spin: new THREE.Vector3(r() - .5, r() - .5, r() - .5).multiplyScalar(8), drift: new THREE.Vector3((r() - .5) * .8, 0, (r() - .2) * .6) };
      head.add(t); tuftList.push(t);
    }
  }
  g.userData = { legs, arms, head, hairMat: mHair, tufts: tuftList };
  return g;
}

export function walk(p, phase, amt = 1) {
  const s = Math.sin(phase) * .55 * amt;
  p.userData.legs[0].rotation.x = s; p.userData.legs[1].rotation.x = -s;
  p.userData.arms[0].rotation.x = -s * .8; p.userData.arms[1].rotation.x = s * .8;
  p.position.y = Math.abs(Math.cos(phase)) * .04 * amt;
}

function tree(x, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s);
  g.add(mesh(new THREE.CylinderGeometry(.12, .16, 1.2, 6), mat('#6b4a35'), { y: .6 }));
  g.add(mesh(new THREE.IcosahedronGeometry(.9, 0), mat('#5f9a5a'), { y: 1.7 }));
  g.add(mesh(new THREE.IcosahedronGeometry(.65, 0), mat('#6fae66'), { y: 2.3, x: .2 }));
  return g;
}

export function stripeTex(colors, n = 6, diag = true) {
  const t = canvasTex(256, 256, (g, w, h) => {
    const sw = w / n;
    for (let i = -n; i < n * 2; i++) {
      g.fillStyle = colors[((i % colors.length) + colors.length) % colors.length];
      g.beginPath();
      if (diag) { g.moveTo(i * sw, 0); g.lineTo(i * sw + sw, 0); g.lineTo(i * sw + sw - w, h); g.lineTo(i * sw - w, h); }
      else g.rect(i * sw, 0, sw, h);
      g.fill();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

export function signTex(text, bg, fg, w = 1024, h = 200, size = 120) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = fg; g.lineWidth = 8; g.strokeRect(14, 14, w - 28, h - 28);
    g.font = `900 ${size}px Montserrat`; g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 6);
  });
}

// ---------- 1. Barbería (exterior) ----------
function barberia() {
  const { scene, camera } = baseScene({ top: '#6d84c4', mid: '#c9a9c0', bottom: '#f7c79a', fog: '#e8c6b0', fogNear: 25, fogFar: 110, sun: '#ffe3c2', sunPos: [-9, 11, 10], shadowSize: 16 });
  scene.add(mesh(new THREE.PlaneGeometry(300, 300), mat('#9b958d'), { cast: false , rx: -Math.PI / 2 }));
  scene.add(mesh(new THREE.BoxGeometry(40, .18, 4), mat('#d3cbbf'), { y: .09, z: 2.2 }));
  for (let i = -6; i <= 6; i++) scene.add(mesh(new THREE.BoxGeometry(1.4, .02, .14), mat('#efe6c8'), { x: i * 3, y: .01, z: 7, cast: false }));
  const b = new THREE.Group(); b.position.z = -1; scene.add(b);
  b.add(mesh(new THREE.BoxGeometry(8, 4.6, 4), mat('#f1e3c8'), { y: 2.3 }));
  b.add(mesh(new THREE.BoxGeometry(8.5, .35, 4.5), mat('#8a5844'), { y: 4.75 }));
  const glass = mat('#2d3e52', { emissive: '#ffbf7a', emissiveIntensity: .35, roughness: .3 });
  b.add(mesh(new THREE.BoxGeometry(3.2, 1.9, .12), glass, { x: -1.4, y: 1.7, z: 2 }));
  b.add(mesh(new THREE.BoxGeometry(3.4, .14, .3), mat('#6b4a35'), { x: -1.4, y: .7, z: 2.05 }));
  b.add(mesh(new THREE.BoxGeometry(1.25, 2.4, .12), mat('#5a3826'), { x: 2.1, y: 1.2, z: 2.02 }));
  b.add(mesh(new THREE.SphereGeometry(.06, 6, 4), mat('#e2c26a', { metalness: .8 }), { x: 2.55, y: 1.2, z: 2.1 }));
  const aw = mesh(new THREE.BoxGeometry(6.6, .08, 1.3), new THREE.MeshStandardMaterial({ map: stripeTex(['#c8372d', '#f4efe6'], 8, false), roughness: .9 }), { x: -.2, y: 3.05, z: 2.55 });
  aw.rotation.x = .35; b.add(aw);
  const sign = mesh(new THREE.PlaneGeometry(4.6, .9), new THREE.MeshStandardMaterial({ map: signTex('BARBERÍA ROY', '#1d1b1f', '#ff6a1a') }), { y: 3.9, z: 2.03, cast: false });
  b.add(sign);
  const poleTex = stripeTex(['#d22f2f', '#f5f5f5', '#2d4fbf', '#f5f5f5'], 8);
  poleTex.repeat.set(1, 1.6);
  const pole = mesh(new THREE.CylinderGeometry(.16, .16, 1.4, 16), new THREE.MeshStandardMaterial({ map: poleTex, roughness: .3 }), { x: 3.35, y: 2.1, z: 2.3 });
  b.add(pole);
  for (const y of [1.35, 2.85]) b.add(mesh(new THREE.SphereGeometry(.2, 10, 6), mat('#d8d8d8', { metalness: .7, roughness: .3 }), { x: 3.35, y, z: 2.3 }));
  // vecinos
  const nb = [['#c9d6e3', 5.5, -9.5], ['#e7c1b5', 3.8, 9], ['#d6e2c4', 6.5, -17], ['#efd9a8', 4.5, 17]];
  for (const [c, h, x] of nb) { scene.add(mesh(new THREE.BoxGeometry(7.6, h, 5), mat(c), { x, y: h / 2, z: -1.5 }));
    scene.add(mesh(new THREE.BoxGeometry(2.2, 1.4, .1), glass, { x: x - 1.5, y: 1.9, z: 1.06 })); }
  for (const [x, z, s] of [[-5.4, 3.3, 1], [5.6, 3.4, .9], [-13, 3.2, 1.1], [13.5, 3.1, 1]]) scene.add(tree(x, z, s));
  const r = rng(7);
  for (let i = 0; i < 9; i++) { const h = 14 + r() * 18;
    scene.add(mesh(new THREE.ConeGeometry(10 + r() * 6, h, 5), mat(i % 2 ? '#b6a1c4' : '#a893bb'), { x: -70 + i * 18, y: h / 2 - 1, z: -70 - r() * 20, cast: false })); }
  const walker = makePerson({ shirt: '#c2793a', pants: '#3d4258', seed: 3 }); walker.rotation.y = Math.PI / 2; scene.add(walker);
  const walker2 = makePerson({ shirt: '#5a76b8', hair: '#5a3b22', seed: 4 }); walker2.rotation.y = -Math.PI / 2; scene.add(walker2);
  return {
    scene, camera,
    update(lt, info) {
      const p = easeInOut(lt / info.dur);
      camera.position.set(lerp(-1.5, .4, p), lerp(2.6, 2.1, p), lerp(24, 10.5, p));
      camera.lookAt(lerp(0, .3, p), 2.4, -1);
      poleTex.offset.y = -lt * .6;
      walker.position.set(-9 + lt * 1.3, 0, 2.8); walk(walker, lt * 7);
      walker.position.y += .18;
      walker2.position.set(8 - lt * 1.1, .18, 3.9); walk(walker2, lt * 6.5 + 1);
      walker2.position.y += .18;
    }
  };
}

// ---------- interior compartido ----------
function interior(scene) {
  const check = canvasTex(256, 256, (g, w) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#2b2b30' : '#ece7de'; g.fillRect(i * 64, j * 64, 64, 64); } });
  check.wrapS = check.wrapT = THREE.RepeatWrapping; check.repeat.set(6, 6);
  scene.add(mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshStandardMaterial({ map: check, roughness: .5 }), { cast: false , rx: -Math.PI / 2 }));
  scene.add(mesh(new THREE.PlaneGeometry(24, 8), mat('#e8dccb'), { y: 4, z: -4, cast: false }));
  const lw = mesh(new THREE.PlaneGeometry(24, 8), mat('#d9cbb6'), { x: -6, y: 4, cast: false }); lw.rotation.y = Math.PI / 2; scene.add(lw);
  scene.add(mesh(new THREE.BoxGeometry(24, .9, .1), mat('#6b4a35'), { y: .45, z: -3.94 }));
  for (const x of [0, 3.6, -3.6]) {
    const s = new THREE.Group(); s.position.x = x; scene.add(s);
    s.add(mesh(new THREE.BoxGeometry(2.6, 1.9, .08), mat('#4a3426'), { y: 2.15, z: -3.92 }));
    s.add(mesh(new THREE.BoxGeometry(2.3, 1.6, .06), mat('#b9d0de', { roughness: .15, metalness: .35, emissive: '#9fc0d6', emissiveIntensity: .15 }), { y: 2.15, z: -3.86, cast: false }));
    s.add(mesh(new THREE.BoxGeometry(2.6, .12, .55), mat('#7a553d'), { y: 1.0, z: -3.65 }));
    const bc = ['#2f6fd0', '#d04a2f', '#f2c14e', '#e9e9e9', '#5fae6a'];
    for (let i = 0; i < 5; i++) s.add(mesh(new THREE.CylinderGeometry(.07, .08, .3 + (i % 2) * .1, 8), mat(bc[i], { roughness: .4 }), { x: -.8 + i * .38, y: 1.22, z: -3.6 }));
    s.add(chair(0, -1.8));
  }
  const lamp = new THREE.PointLight('#ffd9a8', 12, 14); lamp.position.set(0, 5, 0); scene.add(lamp);
}

function chair(x, z) {
  const c = new THREE.Group(); c.position.set(x, 0, z);
  const chrome = mat('#cfd3d8', { metalness: .85, roughness: .25, flatShading: false });
  const red = mat('#b2302a', { roughness: .5 });
  c.add(mesh(new THREE.CylinderGeometry(.45, .5, .08, 16), chrome, { y: .04 }));
  c.add(mesh(new THREE.CylinderGeometry(.09, .09, .5, 10), chrome, { y: .3 }));
  c.add(mesh(new THREE.BoxGeometry(.85, .2, .8), red, { y: .62 }));
  c.add(mesh(new THREE.BoxGeometry(.85, 1.0, .16), red, { y: 1.15, z: -.38 }));
  c.add(mesh(new THREE.BoxGeometry(.4, .22, .12), red, { y: 1.8, z: -.38 }));
  for (const sx of [-1, 1]) c.add(mesh(new THREE.BoxGeometry(.12, .1, .7), chrome, { x: sx * .48, y: .9 }));
  return c;
}

function bubbleTex() {
  return canvasTex(560, 300, (g, w, h) => {
    g.fillStyle = '#fff'; roundRect(g, 10, 10, w - 20, h - 70, 60); g.fill();
    g.beginPath(); g.arc(90, h - 40, 22, 0, 7); g.arc(50, h - 14, 12, 0, 7); g.fill();
    const sw = (x, c1, c2, label) => {
      const gr = g.createLinearGradient(x, 40, x + 130, 170); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
      g.fillStyle = gr; g.beginPath(); g.arc(x + 65, 105, 62, 0, 7); g.fill(); g.lineWidth = 5; g.strokeStyle = '#b8c0cc'; g.stroke();
      g.font = '900 30px Montserrat'; g.fillStyle = '#222'; g.textAlign = 'center'; g.fillText(label, x + 65, 205);
    };
    sw(50, '#2a2a2a', '#050505', 'NEGRO'); sw(370, '#ffffff', '#cfd6e2', 'PLATINO');
    g.fillStyle = '#ff6a1a'; g.beginPath(); g.moveTo(215, 85); g.lineTo(320, 85); g.lineTo(320, 65); g.lineTo(355, 105); g.lineTo(320, 145); g.lineTo(320, 125); g.lineTo(215, 125); g.fill();
  });
}

// ---------- 2. Cliente entra ----------
function cliente() {
  const { scene, camera } = baseScene({ top: '#efe6d8', bottom: '#d9cbb6', sun: '#fff0dc', sunI: 1.8, sunPos: [5, 9, 7], hemi: 1.3, shadowSize: 8 });
  interior(scene);
  const barber = makePerson({ shirt: '#f3f1ec', apron: '#262326', pants: '#2b2b33', hair: '#4a2e1c', skin: '#c99271', seed: 5 });
  barber.position.set(-1.1, 0, -1.2); barber.rotation.y = .5; scene.add(barber);
  const client = makePerson({ shirt: '#3f7d52', pants: '#3a3f55', hair: '#121212', seed: 6, tufts: true }); scene.add(client);
  const bubble = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex(), transparent: true, depthWrite: false }));
  bubble.userData.base = new THREE.Vector3(1.12, .6, 1); bubble.position.set(.15, 2.75, .3); scene.add(bubble);
  return {
    scene, camera,
    update(lt, info) {
      const m2 = info.marks[1] ?? info.dur;
      const wp = clamp(lt / 3.2);
      client.position.set(lerp(4.6, .9, easeOut(wp)), 0, lerp(3.4, -.3, easeOut(wp)));
      client.rotation.y = lerp(-2.3, -1.2, easeInOut(prog(lt, 2.6, 3.6)));
      walk(client, lt * 7.5, 1 - easeOut(prog(lt, 2.8, 3.4)));
      barber.userData.arms[1].rotation.x = -Math.sin(lt * 2) * .15 - .2;
      barber.userData.head.rotation.y = lerp(0, .5, easeInOut(prog(lt, 1, 2.5)));
      const p1 = easeInOut(lt / m2), p2 = easeInOut(prog(lt, m2, info.dur));
      camera.position.set(lerp(-.6, -.2, p1) + p2 * -.4, lerp(2.4, 2.05, p1) + p2 * .1, lerp(8, 5.2, p1) - p2 * 1.6);
      camera.lookAt(lerp(.6, .6, p1), lerp(1.4, 1.9, p2), -.8);
      popScale(bubble, easeBack(prog(lt, m2 + .1, m2 + .45)));
      bubble.position.y = 2.75 + Math.sin(lt * 2) * .03;
    }
  };
}

// ---------- 3. Duda ----------
function duda() {
  const { scene, camera } = baseScene({ top: '#3a2c5c', mid: '#7a4f86', bottom: '#e09aa0', sun: '#ffd6c0', sunI: 2.6, sunPos: [4, 10, 6], shadowSize: 5 });
  const plat = mesh(new THREE.CylinderGeometry(2.4, 2.6, .5, 10), mat('#efe3d3'), { y: -.25 }); scene.add(plat);
  scene.add(mesh(new THREE.CylinderGeometry(2.6, 2.2, 2.5, 10), mat('#5a3f6e'), { y: -1.75 }));
  const barber = makePerson({ shirt: '#f3f1ec', apron: '#262326', pants: '#2b2b33', hair: '#4a2e1c', skin: '#c99271', seed: 5 }); scene.add(barber);
  const qs = [0, 1, 2].map(i => { const s = textSprite('?', { size: 120, color: '#ffe23a', stroke: '#2a1a00', scale: 1.1 }); scene.add(s); return s; });
  const book = new THREE.Group(); scene.add(book);
  const cover = signTex('COLORIMETRÍA', '#c0392b', '#fff', 512, 640, 62);
  book.add(mesh(new THREE.BoxGeometry(.9, 1.15, .22), [mat('#efe9dc'), mat('#c0392b'), mat('#efe9dc'), mat('#efe9dc'), new THREE.MeshStandardMaterial({ map: cover }), mat('#c0392b')]));
  const dust = []; const r = rng(11);
  for (let i = 0; i < 26; i++) { const d = mesh(new THREE.IcosahedronGeometry(.025, 0), mat('#fff8e8', { emissive: '#fff2c8', emissiveIntensity: .6 }), { cast: false });
    d.userData = { a: r() * 6.28, rr: .6 + r() * .5, y: r() * 1.2 - .6, s: .3 + r() * .5 }; book.add(d); dust.push(d); }
  return {
    scene, camera,
    update(lt, info) {
      const m2 = info.marks[1] ?? info.dur * .45;
      const a = lerp(-.5, .35, lt / info.dur);
      camera.position.set(Math.sin(a) * 4.4, 2.1, Math.cos(a) * 4.4); camera.lookAt(0, 1.5, 0);
      const nod = lt < m2 ? Math.max(0, Math.sin(lt * 9)) * .18 * (1 - prog(lt, 0, 1.2)) : 0;
      barber.userData.head.rotation.x = nod;
      const scratch = easeInOut(prog(lt, m2 - .1, m2 + .5));
      barber.userData.arms[1].rotation.x = lerp(0, -2.7, scratch); barber.userData.arms[1].rotation.z = lerp(0, -.5, scratch);
      barber.userData.arms[1].rotation.y = Math.sin(lt * 14) * .12 * scratch;
      barber.userData.head.rotation.z = lerp(0, -.15, scratch);
      qs.forEach((q, i) => { const k = easeBack(prog(lt, m2 + .2 + i * .18, m2 + .5 + i * .18));
        popScale(q, k); q.position.set(Math.cos(lt * 1.3 + i * 2.1) * .75, 2.45 + i * .15 + Math.sin(lt * 3 + i) * .08, Math.sin(lt * 1.3 + i * 2.1) * .75); });
      const bk = easeBack(prog(lt, m2 + .7, m2 + 1.2));
      book.scale.setScalar(Math.max(.001, bk)); book.position.set(1.15, 1.35 + Math.sin(lt * 2) * .06, .6);
      book.rotation.set(.15, -.5 + Math.sin(lt) * .2, .1);
      dust.forEach(d => { const u = d.userData; d.position.set(Math.cos(u.a + lt * u.s) * u.rr, u.y + Math.sin(lt * u.s * 2 + u.a) * .1, Math.sin(u.a + lt * u.s) * u.rr); });
    }
  };
}

// ---------- 4. Mezcla ----------
function bottleTex(top, sub, bg, fg) {
  return canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = fg; g.font = '900 54px Montserrat'; g.textAlign = 'center'; g.fillText(top, w / 2, 110);
    g.font = '800 40px Montserrat'; g.fillText(sub, w / 2, 175);
  });
}

function mezcla() {
  const { scene, camera } = baseScene({ top: '#f3d9b8', bottom: '#d69a72', sun: '#fff1dc', sunI: 2.4, sunPos: [-4, 9, 5], shadowSize: 5 });
  scene.add(mesh(new THREE.BoxGeometry(9, .35, 6), mat('#a0714f'), { y: -.18 }));
  const pts = [[0, 0], [.55, 0], [.75, .08], [.95, .5], [1.0, .55], [.9, .55], [.86, .5], [.68, .12], [0, .1]].map(([x, y]) => new THREE.Vector2(x, y));
  scene.add(mesh(new THREE.LatheGeometry(pts, 20), mat('#1f1f22', { roughness: .45, side: THREE.DoubleSide })));
  const mixMat = mat('#e9e6f6', { roughness: .35 });
  const mix = mesh(new THREE.CylinderGeometry(.7, .6, .04, 20), mixMat, { y: .12, cast: false }); scene.add(mix);
  const per = new THREE.Group(); per.position.set(-1.7, 0, -.6); scene.add(per);
  per.add(mesh(new THREE.CylinderGeometry(.38, .38, 1.5, 16), [new THREE.MeshStandardMaterial({ map: bottleTex('PERÓXIDO', '40 VOL', '#f4f4f4', '#c0392b'), roughness: .4 }), mat('#f4f4f4'), mat('#f4f4f4')], { y: .75 }));
  per.add(mesh(new THREE.CylinderGeometry(.16, .22, .3, 12), mat('#c0392b'), { y: 1.65 }));
  per.rotation.y = .9;
  const tub = new THREE.Group(); tub.position.set(1.55, 0, -.5); scene.add(tub);
  tub.add(mesh(new THREE.CylinderGeometry(.6, .52, .95, 16), [new THREE.MeshStandardMaterial({ map: bottleTex('DECOLORANTE', 'POLVO', '#2f55c8', '#fff'), roughness: .5 }), mat('#2f55c8'), mat('#2f55c8')], { y: .48 }));
  const brush = new THREE.Group(); scene.add(brush);
  brush.add(mesh(new THREE.CylinderGeometry(.04, .05, 1.3, 8), mat('#111'), { y: .65 }));
  brush.add(mesh(new THREE.BoxGeometry(.28, .2, .08), mat('#eee'), { y: .05 }));
  const timer = new THREE.Group(); timer.position.set(.2, 0, -1.9); scene.add(timer);
  timer.add(mesh(new THREE.CylinderGeometry(.5, .55, .4, 18), mat('#ff6a1a'), { y: .2 }));
  timer.add(mesh(new THREE.CylinderGeometry(.42, .42, .05, 18), mat('#fafafa'), { y: .42 }));
  const hand = mesh(new THREE.BoxGeometry(.04, .02, .36), mat('#222'), { y: .46 }); hand.geometry.translate(0, 0, -.16); timer.add(hand);
  const powder = []; const r = rng(21);
  for (let i = 0; i < 60; i++) { const p = mesh(new THREE.IcosahedronGeometry(.035 + r() * .03, 0), mat('#dfe6ff'), { cast: false });
    p.userData = { d: r() * 1.6, x: (r() - .5) * .3, z: (r() - .5) * .3 }; scene.add(p); powder.push(p); }
  return {
    scene, camera,
    update(lt, info) {
      const m2 = info.marks[1] ?? info.dur * .5;
      const a = lerp(.35, -.25, easeInOut(lt / info.dur));
      const zoom = lerp(6.4, 5.2, easeInOut(lt / info.dur));
      camera.position.set(Math.sin(a) * zoom, 4.2, Math.cos(a) * zoom); camera.lookAt(0, .35, -.3);
      const tilt = easeInOut(prog(lt, .2, .8)) * (1 - easeInOut(prog(lt, 2.6, 3.2)));
      tub.rotation.z = tilt * 1.6; tub.position.set(lerp(1.55, .95, tilt), tilt * 1.1, -.5);
      powder.forEach(p => { const u = p.userData; const tt = lt - .7 - u.d;
        if (tt < 0 || tt > .6) { p.visible = false; return; } p.visible = true;
        p.position.set(lerp(.6, u.x, tt / .6), 1.6 - 4.9 * tt * tt * 1.6, u.z - .3 * (1 - tt / .6)); });
      const fill = easeOut(prog(lt, .7, m2));
      mix.position.y = .12 + fill * .3; mix.scale.setScalar(1 + fill * .3);
      const sp = lt * 5;
      brush.position.set(Math.cos(sp) * .35, .2 + fill * .3, Math.sin(sp) * .35);
      brush.rotation.set(Math.sin(sp) * .3, 0, -Math.cos(sp) * .3);
      mixMat.color.set('#e9e6f6').lerp(new THREE.Color('#c9b7ff'), Math.sin(lt * 3) * .5 * fill);
      hand.rotation.y = -easeInOut(prog(lt, m2, info.dur - .3)) * Math.PI * 1.66;
      timer.scale.setScalar(1 + Math.max(0, Math.sin(lt * 20)) * .04 * prog(lt, m2, m2 + .2));
    }
  };
}

// ---------- 5 y 6. Cabeza (naranja / se rompe) ----------
function cabeza(mode) {
  const naranjaMode = mode === 'naranja';
  const { scene, camera } = baseScene(naranjaMode
    ? { top: '#7fa7d8', bottom: '#e7eef7', sun: '#ffffff', sunI: 2.2, sunPos: [3, 6, 6], shadowSize: 3 }
    : { top: '#2a1726', mid: '#5b2a3a', bottom: '#a54a4a', sun: '#ffd1b0', sunI: 2.8, sunPos: [-3, 5, 6], shadowSize: 3 });
  const p = makePerson({ shirt: '#3f7d52', pants: '#3a3f55', hair: '#121212', seed: 6, tufts: true });
  p.position.y = -1.1; scene.add(p);
  const towel = mesh(new THREE.TorusGeometry(.3, .1, 6, 14), mat('#f0f0f0'), { y: .48 }); towel.rotation.x = Math.PI / 2; p.add(towel);
  const hairMat = p.userData.hairMat;
  const orange = new THREE.Color('#ff7a1c'), black = new THREE.Color('#141414');
  const drops = []; const r = rng(31);
  if (naranjaMode) for (let i = 0; i < 50; i++) { const d = mesh(new THREE.SphereGeometry(.02, 6, 4), mat('#9fd0ff', { roughness: .1, transparent: true, opacity: .85 }), { cast: false });
    d.userData = { x: (r() - .5) * .9, z: (r() - .5) * .9, o: r() }; scene.add(d); drops.push(d); }
  let hand = null;
  if (!naranjaMode) {
    hand = new THREE.Group(); scene.add(hand);
    const skin = mat('#c99271');
    hand.add(mesh(new THREE.BoxGeometry(.24, .08, .28), skin));
    for (let i = 0; i < 4; i++) hand.add(mesh(new THREE.BoxGeometry(.05, .05, .2), skin, { x: -.09 + i * .06, z: .22 }));
    hand.add(mesh(new THREE.BoxGeometry(.2, .2, .5), mat('#f3f1ec'), { z: -.35 }));
  }
  const sparks = [];
  for (let i = 0; i < 14; i++) { const s = textSprite('✦', { size: 70, color: '#ffd23a', stroke: null, scale: .35 }); s.userData.a = r() * 6.28; s.userData.rr = .45 + r() * .2; s.userData.y = r() * .4; scene.add(s); sparks.push(s); }
  return {
    scene, camera,
    update(lt, info) {
      const head = p.userData.head;
      if (naranjaMode) {
        const a = lerp(.6, -.5, easeInOut(lt / info.dur));
        camera.position.set(Math.sin(a) * 1.7, .95, Math.cos(a) * 1.7); camera.lookAt(0, .78, 0);
        drops.forEach(d => { const u = d.userData; const tt = ((lt * 1.4 + u.o) % 1);
          d.visible = lt < 2.2; d.position.set(u.x, 1.6 - tt * 1.4, u.z); });
        const c = easeInOut(prog(lt, 1.6, 2.6));
        hairMat.color.copy(black).lerp(orange, c);
        hairMat.emissive.copy(orange).multiplyScalar(c * (.25 + Math.sin(lt * 6) * .08));
        head.rotation.y = Math.sin(lt * .9) * .25; head.rotation.x = -c * .1;
        sparks.forEach((s, i) => { const k = easeBack(prog(lt, 2.4 + i * .05, 2.7 + i * .05)); popScale(s, k * (.8 + Math.sin(lt * 8 + i) * .2));
          s.position.set(Math.cos(s.userData.a + lt) * s.userData.rr, .95 + s.userData.y, Math.sin(s.userData.a + lt) * s.userData.rr); });
      } else {
        hairMat.color.copy(orange); hairMat.emissive.copy(orange).multiplyScalar(.15);
        const a = lerp(-.4, .3, easeInOut(lt / info.dur));
        camera.position.set(Math.sin(a) * 2.1, .7, Math.cos(a) * 2.1); camera.lookAt(0, .55, 0);
        const reach = easeInOut(prog(lt, .1, .9)), back = easeInOut(prog(lt, 1.2, 2));
        hand.position.set(lerp(1.4, .32, reach) + back * .5, .98 + reach * .08, lerp(.4, .05, reach));
        hand.rotation.set(0, Math.PI / 2 + .3, lerp(0, .8, reach));
        sparks.forEach(s => s.visible = false);
        const hw = head.getWorldPosition(new THREE.Vector3());
        p.userData.tufts.forEach(t => { const u = t.userData; const tt = lt - .8 - u.d * 1.6;
          if (tt <= 0) { t.position.copy(u.home); t.quaternion.copy(u.q); return; }
          t.position.set(u.home.x + u.drift.x * tt, u.home.y - 2.2 * tt * tt - .15 * tt, u.home.z + u.drift.z * tt);
          t.rotation.set(u.spin.x * tt, u.spin.y * tt, u.spin.z * tt);
          t.visible = hw.y + t.position.y > -1.2; });
        head.rotation.y = Math.sin(lt * 1.2) * .1;
      }
    }
  };
}

// ---------- 7. Reseña ----------
function resena() {
  const { scene, camera } = baseScene({ top: '#5c1414', bottom: '#c2463c', sun: '#ffe2d0', sunI: 2.4, sunPos: [-3, 6, 7], shadowSize: 4 });
  const phone = new THREE.Group(); scene.add(phone);
  phone.add(mesh(new RoundedBoxGeometry(1.7, 3.4, .2, 4, .22), mat('#141416', { roughness: .3, flatShading: false })));
  let stars = 5;
  const screen = canvasTex(512, 1000, (g, w, h) => drawScreen(g, w, h, stars));
  phone.add(mesh(new THREE.PlaneGeometry(1.56, 3.2), new THREE.MeshBasicMaterial({ map: screen }), { z: .102, cast: false }));
  const falling = []; const r = rng(41);
  for (let i = 0; i < 12; i++) { const s = textSprite('★', { size: 90, color: '#9a9a9a', stroke: '#3a3a3a', scale: .6 }); s.userData = { ...s.userData, x: (r() - .5) * 3.4, d: r() * 2.5, sp: .6 + r() * .6 }; scene.add(s); falling.push(s); }
  return {
    scene, camera,
    update(lt, info) {
      camera.position.set(0, .2, 6.2 - easeInOut(lt / info.dur) * 1.1); camera.lookAt(0, 0, 0);
      const k = easeBack(prog(lt, 0, .5));
      phone.scale.setScalar(Math.max(.001, k));
      phone.rotation.set(-.12 + Math.sin(lt * 1.3) * .05, lerp(-.9, -.15, easeOut(lt / 1.2)) + Math.sin(lt) * .08, .06);
      phone.position.y = Math.sin(lt * 1.6) * .06;
      const s = Math.round(lerp(5, 1, easeInOut(prog(lt, .3, 1.5))));
      if (s !== stars) { stars = s; drawScreen(screen.userData.g, 512, 1000, stars); screen.needsUpdate = true; }
      falling.forEach(f => { const u = f.userData; const tt = (lt - u.d) * u.sp;
        f.visible = tt > 0; f.position.set(u.x, 2.6 - tt * 1.6, -1.2); f.material.rotation = tt * 2; });
    }
  };
}

function drawScreen(g, w, h, stars) {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f2f2f4'; g.fillRect(0, 0, w, 150);
  g.fillStyle = '#111'; g.font = '800 40px Montserrat'; g.textAlign = 'left'; g.fillText('Reseñas', 36, 105);
  g.fillStyle = '#ddd'; g.beginPath(); g.arc(80, 250, 46, 0, 7); g.fill();
  g.fillStyle = '#555'; g.font = '800 34px Montserrat'; g.fillText('Cliente', 145, 245);
  g.fillStyle = '#999'; g.font = '600 24px Montserrat'; g.fillText('hace 2 horas', 145, 282);
  for (let i = 0; i < 5; i++) {
    g.fillStyle = i < stars ? '#ffb400' : '#d9d9d9'; g.font = '900 84px Montserrat'; g.fillText('★', 34 + i * 92, 420);
  }
  g.fillStyle = '#222'; g.font = '700 34px Montserrat';
  ['Me dejó el pelo', 'NARANJA y', 'quemado.', 'No vuelvo.'].forEach((l, i) => g.fillText(l, 36, 520 + i * 52));
  g.fillStyle = '#eee'; for (let i = 0; i < 3; i++) { roundRect(g, 36, 760 + i * 70, w - 72, 40, 16); g.fill(); }
}

// ---------- 8. Círculo cromático ----------
function circulo() {
  const { scene, camera } = baseScene({ top: '#0f1230', bottom: '#2b3270', sun: '#ffffff', sunI: 2.6, sunPos: [2, 8, 6], shadowSize: 4, hemi: 1.4 });
  const wheel = new THREE.Group(); wheel.rotation.x = -1.0; scene.add(wheel);
  const spin = new THREE.Group(); wheel.add(spin);
  const wedges = [];
  for (let i = 0; i < 12; i++) {
    const a0 = (i * 30 - 13.5) * Math.PI / 180, a1 = (i * 30 + 13.5) * Math.PI / 180;
    const s = new THREE.Shape(); s.absarc(0, 0, 2.3, a0, a1, false); s.absarc(0, 0, .85, a1, a0, true);
    const geo = new THREE.ExtrudeGeometry(s, { depth: .3, bevelEnabled: true, bevelSize: .04, bevelThickness: .04, bevelSegments: 1, curveSegments: 4 });
    const c = new THREE.Color().setHSL(i * 30 / 360, .85, .55, THREE.SRGBColorSpace);
    const m = mesh(geo, mat(c, { emissive: c, emissiveIntensity: .05 })); spin.add(m); wedges.push(m);
  }
  spin.add(mesh(new THREE.CylinderGeometry(.7, .7, .25, 20), mat('#f4f1ea'), { z: .15 , rx: Math.PI / 2 }));
  const lblO = textSprite('NARANJA', { size: 54, color: '#ff8a2a', scale: .9 }), lblA = textSprite('AZUL', { size: 54, color: '#5aa2ff', scale: .9 });
  const lblN = textSprite('SE NEUTRALIZAN', { size: 44, color: '#fff', bg: 'rgba(0,0,0,.55)', stroke: null, scale: .9 });
  [lblO, lblA, lblN].forEach(l => scene.add(l));
  return {
    scene, camera,
    update(lt, info) {
      const m2 = info.marks[1] ?? info.dur * .5;
      camera.position.set(0, 3.6, 14 - easeInOut(lt / info.dur) * 1.2); camera.lookAt(0, -.1, 0);
      const target = Math.PI * 150 / 180;
      spin.rotation.z = target + 7 * (1 - easeOut(prog(lt, 0, Math.max(1.5, m2))));
      const lift = easeBack(prog(lt, m2, m2 + .5));
      wedges.forEach((w, i) => { const on = i === 1 || i === 7;
        w.position.z = on ? lift * .7 : 0; w.material.emissiveIntensity = on ? .05 + lift * .35 : .05;
        w.material.color.setHSL(i * 30 / 360, on ? .95 : lerp(.85, .35, lift), on ? .52 : lerp(.55, .4, lift), THREE.SRGBColorSpace); });
      popScale(lblO, easeBack(prog(lt, m2 + .3, m2 + .6))); lblO.position.set(-1.55, 1.35, .6);
      popScale(lblA, easeBack(prog(lt, m2 + .4, m2 + .7))); lblA.position.set(1.55, 1.35, .6);
      popScale(lblN, easeBack(prog(lt, m2 + .9, m2 + 1.2))); lblN.position.set(0, -1.75, .9);
    }
  };
}

// ---------- 9. Cierre ----------
function cta() {
  const scene = new THREE.Scene();
  scene.background = canvasTex(512, 910, (g, w, h) => {
    g.fillStyle = '#0a0a0a'; g.fillRect(0, 0, w, h);
    const r = g.createRadialGradient(w / 2, h * .4, 10, w / 2, h * .4, w * .9);
    r.addColorStop(0, 'rgba(255,106,26,.45)'); r.addColorStop(.5, 'rgba(227,38,47,.12)'); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.fillRect(0, 0, w, h);
  });
  scene.add(new THREE.HemisphereLight('#ffffff', '#442211', 1.3));
  const d = new THREE.DirectionalLight('#fff', 2.5); d.position.set(3, 4, 6); scene.add(d);
  const camera = new THREE.PerspectiveCamera(42, W / H, .1, 100);
  const logo = new THREE.Group(); scene.add(logo);
  logo.add(mesh(new RoundedBoxGeometry(2.4, 2.4, .5, 5, .45), mat('#f0441f', { roughness: .35, flatShading: false })));
  const face = canvasTex(512, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#ff6a1a'); gr.addColorStop(1, '#e3262f');
    g.fillStyle = gr; roundRect(g, 0, 0, w, h, 96); g.fill();
    g.fillStyle = '#fff'; g.font = '900 380px Montserrat'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('R', w / 2, h / 2 + 24);
  });
  logo.add(mesh(new THREE.PlaneGeometry(2.3, 2.3), new THREE.MeshStandardMaterial({ map: face, transparent: true, roughness: .4 }), { z: .26, cast: false }));
  const bits = []; const r = rng(51);
  for (let i = 0; i < 30; i++) { const b = mesh(new THREE.BoxGeometry(.08, .08, .08), mat(i % 2 ? '#ff6a1a' : '#e3262f', { emissive: '#ff6a1a', emissiveIntensity: .4 }), { cast: false });
    b.userData = { a: r() * 6.28, rr: 2 + r() * 1.6, y: (r() - .5) * 5, s: .2 + r() * .4 }; scene.add(b); bits.push(b); }
  return {
    scene, camera,
    update(lt) {
      camera.position.set(0, -1.15, 9); camera.lookAt(0, -1.15, 0);
      const k = easeBack(prog(lt, 0, .8));
      logo.scale.setScalar(Math.max(.001, k)); logo.position.y = .9 + Math.sin(lt * 1.5) * .08;
      logo.rotation.set(Math.sin(lt * 1.1) * .08, lerp(-Math.PI * 1.5, 0, easeOut(prog(lt, 0, 1.1))) + Math.sin(lt * .8) * .15, 0);
      bits.forEach(b => { const u = b.userData; b.position.set(Math.cos(u.a + lt * u.s) * u.rr, u.y + Math.sin(lt + u.a) * .2 - .3, Math.sin(u.a + lt * u.s) * u.rr - 1); b.rotation.set(lt * u.s * 3, lt, 0); });
    },
    draw2d(ctx, lt, info) {
      const a = easeOut(prog(lt, .5, 1));
      ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center';
      ctx.font = '900 64px Montserrat'; ctx.fillStyle = '#ff6a1a';
      ctx.letterSpacing = '8px'; ctx.fillText('BARBERROY', W / 2 + 4, 730 + (1 - a) * 20);
      ctx.font = '700 28px Montserrat'; ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.letterSpacing = '12px';
      ctx.fillText('ACADEMY', W / 2 + 6, 778 + (1 - a) * 20);
      ctx.letterSpacing = '0px';
      const b = easeBack(prog(lt, info.dur * .55, info.dur * .55 + .4));
      if (b > 0) {
        const pulse = 1 + Math.sin(lt * 6) * .03;
        ctx.globalAlpha = 1; ctx.translate(W / 2, 1150); ctx.scale(b * pulse, b * pulse);
        const gr = ctx.createLinearGradient(-200, 0, 200, 0); gr.addColorStop(0, '#ff6a1a'); gr.addColorStop(1, '#e3262f');
        ctx.fillStyle = gr; roundRect(ctx, -210, -42, 420, 84, 42); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '900 36px Montserrat'; ctx.textBaseline = 'middle'; ctx.fillText('LINK EN LA BIO ↓', 0, 2);
      }
      ctx.restore();
    }
  };
}

export const SCENES = { barberia, cliente, duda, mezcla, naranja: () => cabeza('naranja'), rompe: () => cabeza('rompe'), resena, circulo, cta };
