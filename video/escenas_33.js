// Escenas de "Los 33" (mina San José, Chile, 2010). Usa las utilidades de escenas.js.
import * as THREE from 'three';
import {
  W, H, clamp, easeOut, easeInOut, easeBack, roundRect, mat, mesh, canvasTex, gradientBg, baseScene,
  textSprite, popScale, makePerson, walk, rng, lerp, prog, stripeTex
} from './escenas.js';

const ROCK = '#8a5f4c', ROCK2 = '#6e4a3b', SAND = '#d8a594', MOUNT = '#b9786a';
const SKIN = ['#e2b48c', '#c99271', '#a8754f', '#d9a47c', '#8c5a3c'];
const HAIR = ['#1c1917', '#3a2a1c', '#4a3b30', '#1c1917', '#6a6a6a'];

// ---------- piezas ----------
function makeMiner(seed = 1, { lamp = true } = {}) {
  const r = rng(seed * 7 + 3);
  const p = makePerson({ shirt: '#3d4356', pants: '#2c3140', skin: SKIN[(r() * SKIN.length) | 0], hair: HAIR[(r() * HAIR.length) | 0], seed });
  const vestCol = r() < .7 ? '#e8642a' : '#c9b13a';
  p.add(mesh(new THREE.BoxGeometry(.66, .58, .37), mat(vestCol), { y: 1.24 }));
  const refl = mat('#e9e9e9', { emissive: '#bfbfbf', emissiveIntensity: .35 });
  for (const y of [1.1, 1.32]) p.add(mesh(new THREE.BoxGeometry(.67, .05, .38), refl, { y, cast: false }));
  const head = p.userData.head;
  head.add(mesh(new THREE.SphereGeometry(.255, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), mat(r() < .8 ? '#f2c230' : '#f4f4f0', { roughness: .45 }), { y: .07 }));
  head.add(mesh(new THREE.CylinderGeometry(.29, .29, .03, 16), mat('#e0b020'), { y: .07 }));
  if (lamp) head.add(mesh(new THREE.CylinderGeometry(.05, .05, .05, 10), new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff6d0', emissiveIntensity: 3 }), { y: .2, z: .23, rx: Math.PI / 2, cast: false }));
  return p;
}

function sit(p) {
  p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2 + .1);
  p.position.y = -.42;
}

function desert(scene, { mountain = true } = {}) {
  scene.add(mesh(new THREE.PlaneGeometry(400, 400), mat(SAND), { cast: false, rx: -Math.PI / 2 }));
  const r = rng(77);
  for (let i = 0; i < 9; i++) { const h = 8 + r() * 14;
    scene.add(mesh(new THREE.ConeGeometry(14 + r() * 10, h, 5), mat(i % 2 ? '#a87a86' : '#9a6f7e'), { x: -90 + i * 23, y: h / 2 - 1, z: -90 - r() * 30, cast: false })); }
  if (mountain) { const m = mesh(new THREE.ConeGeometry(16, 13, 6), mat(MOUNT), { y: 6.5, z: -14 }); m.rotation.y = .3; scene.add(m); return m; }
}

// Corte de montaña plano (silueta triangular) para diagramas
function profile(scene, { w = 7, h = 6.5, y = -2.6 } = {}) {
  const s = new THREE.Shape(); s.moveTo(-w, 0); s.lineTo(0, h); s.lineTo(w, 0); s.lineTo(w, -6); s.lineTo(-w, -6); s.closePath();
  const m = mesh(new THREE.ShapeGeometry(s), new THREE.MeshStandardMaterial({ color: '#6b4436', roughness: 1 }), { y, cast: false });
  scene.add(m);
  const edge = mesh(new THREE.ShapeGeometry((() => { const e = new THREE.Shape(); e.moveTo(-w - .1, 0); e.lineTo(0, h + .12); e.lineTo(w + .1, 0); e.lineTo(w, 0); e.lineTo(0, h); e.lineTo(-w, 0); return e; })()), new THREE.MeshBasicMaterial({ color: '#c98f7a' }), { y, z: .01, cast: false });
  scene.add(edge);
  return m;
}

function helix(turns = 4.5, r0 = 1.3, top = 2.6, bottom = -3.2) {
  const pts = [];
  for (let i = 0; i <= 240; i++) { const t = i / 240, a = t * turns * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * r0 * (1 - t * .15), lerp(top, bottom, t), Math.sin(a) * .5 + .6)); }
  return new THREE.CatmullRomCurve3(pts);
}

function tunnel(scene, { len = 18, w = 3.4, h = 3, lamps = 4, dark = false } = {}) {
  const rock = mat(dark ? '#5a3c30' : ROCK);
  scene.add(mesh(new THREE.BoxGeometry(w + 2, .2, len), mat('#6b4c3c'), { y: -.1, z: -len / 2 + 2 }));
  for (const sx of [-1, 1]) scene.add(mesh(new THREE.BoxGeometry(1, h + 1, len), rock, { x: sx * (w / 2 + .5), y: h / 2, z: -len / 2 + 2 }));
  scene.add(mesh(new THREE.BoxGeometry(w + 2, 1, len), mat(ROCK2), { y: h + .5, z: -len / 2 + 2 }));
  const wood = mat('#8c6a42');
  for (let z = 1; z > -len + 2; z -= 3) {
    for (const sx of [-1, 1]) scene.add(mesh(new THREE.BoxGeometry(.2, h, .2), wood, { x: sx * (w / 2 - .1), y: h / 2, z }));
    scene.add(mesh(new THREE.BoxGeometry(w, .22, .22), wood, { y: h - .1, z }));
  }
  const lights = [];
  for (let i = 0; i < lamps; i++) {
    const z = -1 - i * 4.2;
    const lm = mesh(new THREE.BoxGeometry(.5, .08, .2), new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#ffe2a8', emissiveIntensity: 2.5 }), { y: h - .15, z, cast: false });
    scene.add(lm);
    const pl = new THREE.PointLight('#ffcf8a', 9, 9, 1.6); pl.position.set(0, h - .4, z); scene.add(pl); lights.push({ lm, pl });
  }
  return lights;
}

function caveScene(top = '#140d0a', bottom = '#2a1a14') {
  const scene = new THREE.Scene(); scene.background = gradientBg(top, bottom);
  scene.add(new THREE.HemisphereLight('#ffdcc0', '#2a1a12', .55));
  const key = new THREE.DirectionalLight('#ffd8b0', .9); key.position.set(2, 6, 5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 }); scene.add(key);
  const camera = new THREE.PerspectiveCamera(46, W / H, .05, 300);
  return { scene, camera };
}

function puff(color = '#cfae96') { const m = mesh(new THREE.IcosahedronGeometry(1, 1), mat(color, { roughness: 1, transparent: true }), { cast: false }); return m; }

function dustCloud(scene, n, seed, color) {
  const r = rng(seed), arr = [];
  for (let i = 0; i < n; i++) { const p = puff(color); p.userData = { a: r() * 6.28, sp: .6 + r() * 1.6, d: r() * .8, s: .4 + r() * .9 }; scene.add(p); arr.push(p); }
  return (origin, tt) => arr.forEach(p => { const u = p.userData, q = tt - u.d;
    p.visible = q > 0; if (q <= 0) return;
    p.position.set(origin.x + Math.cos(u.a) * q * u.sp, origin.y + q * .35, origin.z + Math.sin(u.a) * q * u.sp * .6);
    p.scale.setScalar(u.s * (.3 + q * .7)); p.material.opacity = Math.max(0, .85 - q * .25); });
}

// ---------- 1. Entrada a la mina ----------
function entrada() {
  const { scene, camera } = baseScene({ top: '#3c2d48', mid: '#b47a86', bottom: '#f0b48e', fog: '#d9a093', fogNear: 30, fogFar: 140, sun: '#ffd2b0', sunI: 2.2, sunPos: [-10, 8, 8], shadowSize: 14 });
  const m = desert(scene);
  const door = new THREE.Group(); door.position.set(0, 0, -5.2); scene.add(door);
  door.add(mesh(new THREE.BoxGeometry(3.4, 3, .6), mat('#5c3a2e'), { y: 1.5 }));
  door.add(mesh(new THREE.BoxGeometry(2.6, 2.5, .2), new THREE.MeshBasicMaterial({ color: '#0d0907' }), { y: 1.25, z: .25, cast: false }));
  const miners = [0, 1, 2, 3, 4].map(i => { const p = makeMiner(10 + i); p.rotation.y = Math.PI; scene.add(p); return p; });
  return {
    scene, camera,
    update(lt, info) {
      const p = easeInOut(lt / info.dur);
      camera.position.set(lerp(3, 1, p), lerp(2.6, 2.2, p), lerp(13, 8, p)); camera.lookAt(0, 1.8, -4);
      miners.forEach((mn, i) => { const z = 4 - lt * 1.15 - (i % 3) * .8 - i * .5; const x = -1.2 + (i % 3) * .9 + (i > 2 ? .4 : 0);
        mn.position.set(x, 0, Math.max(-4.6, z)); walk(mn, lt * 7 + i, z > -4.6 ? 1 : 0); mn.visible = z > -4.9; });
      void m;
    }
  };
}

// ---------- 2. Rampa en espiral ----------
function rampa() {
  const scene = new THREE.Scene(); scene.background = gradientBg('#2c2236', '#d79a86', '#8a5f72');
  scene.add(new THREE.HemisphereLight('#ffe0d0', '#402820', 1.2));
  const d = new THREE.DirectionalLight('#ffd8c0', 1.4); d.position.set(-3, 5, 6); scene.add(d);
  const camera = new THREE.PerspectiveCamera(42, W / H, .1, 200);
  profile(scene);
  const curve = helix();
  scene.add(mesh(new THREE.TubeGeometry(curve, 400, .045, 6), new THREE.MeshBasicMaterial({ color: '#f1dccb' }), { cast: false }));
  const dot = mesh(new THREE.SphereGeometry(.12, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff7d0' }), { cast: false }); scene.add(dot);
  const glow = new THREE.PointLight('#ffe7a0', 6, 3); dot.add(glow);
  const halo = textSprite('●', { size: 120, color: 'rgba(255,240,180,.55)', stroke: null, scale: .7 }); dot.add(halo);
  return {
    scene, camera,
    update(lt, info) {
      camera.position.set(0, lerp(.6, -.2, easeInOut(lt / info.dur)), lerp(13, 11, easeInOut(lt / info.dur))); camera.lookAt(0, .1, 0);
      dot.position.copy(curve.getPointAt(easeInOut(clamp((lt - .2) / (info.dur - .5)))));
    }
  };
}

// ---------- 3. Derrumbe ----------
function derrumbe() {
  const { scene, camera } = caveScene();
  const lights = tunnel(scene, { lamps: 3 });
  const miners = [0, 1, 2].map(i => { const p = makeMiner(20 + i); p.position.set(-.8 + i * .8, 0, -1 - i * .6); p.rotation.y = Math.PI + (i - 1) * .3; scene.add(p); return p; });
  const r = rng(5), rocks = [];
  for (let i = 0; i < 46; i++) { const s = .3 + r() * .7; const b = mesh(new THREE.IcosahedronGeometry(s, 0), mat(r() < .5 ? ROCK : ROCK2));
    b.userData = { x: (r() - .5) * 3, z: -9 - r() * 3, y0: 3.2 + r() * 2, d: r() * 1.4, rest: s * .7 + (i > 20 ? (r() * 2.2) : 0), spin: r() * 4 }; scene.add(b); rocks.push(b); }
  const dust = dustCloud(scene, 26, 9, '#b08d78');
  return {
    scene, camera,
    update(lt, info) {
      const T = 1.0, tt = lt - T;
      const shake = tt > 0 ? Math.exp(-tt * .9) * .14 : 0;
      camera.position.set(.3 + Math.sin(lt * 57) * shake, 1.7 + Math.cos(lt * 43) * shake, 4.4 - easeInOut(lt / info.dur) * 1.2); camera.lookAt(0, 1.4, -8);
      rocks.forEach(b => { const u = b.userData, q = tt - u.d;
        if (q <= 0) { b.position.set(u.x, u.y0 + 10, u.z); b.visible = false; return; } b.visible = true;
        const y = Math.max(u.rest, u.y0 - 4.9 * q * q); b.position.set(u.x, y, u.z); b.rotation.set(q * u.spin, q * u.spin * .7, 0); });
      dust(new THREE.Vector3(0, .8, -8), tt);
      lights.forEach((l, i) => { const f = tt > 0 && tt < 3 ? (Math.sin(lt * 37 + i * 3) > .2 ? 1 : .15) : 1; l.pl.intensity = 9 * f; l.lm.material.emissiveIntensity = 2.5 * f; });
      miners.forEach((m, i) => { const look = easeOut(prog(lt, T + .2, T + .7)); m.rotation.y = Math.PI + (i - 1) * .3 + look * Math.PI;
        m.userData.head.rotation.x = -look * .3; m.userData.arms.forEach(a => a.rotation.x = -look * 1.2); });
    }
  };
}

// ---------- 4. Atrapados (33) ----------
function refugio() {
  const { scene, camera } = caveScene('#0d0806', '#24160f');
  tunnel(scene, { len: 14, w: 7, h: 3.4, lamps: 2, dark: true });
  const r = rng(33), crowd = [];
  for (let i = 0; i < 33; i++) { const p = makeMiner(100 + i); const row = Math.floor(i / 7), col = i % 7;
    p.position.set(-2.6 + col * .86 + (row % 2) * .4 + (r() - .5) * .2, 0, -1 - row * 1.0 + (r() - .5) * .2); p.rotation.y = (r() - .5) * .5; scene.add(p); crowd.push(p); }
  return {
    scene, camera,
    update(lt, info) {
      const p = easeInOut(lt / info.dur);
      camera.position.set(lerp(-.6, .5, p), lerp(2.5, 2.1, p), lerp(5.2, 3.4, p)); camera.lookAt(0, 1.4, -2.5);
      crowd.forEach((c, i) => { c.userData.head.rotation.y = Math.sin(lt * .8 + i) * .25; });
    }
  };
}

// ---------- 5. Comida para dos días ----------
function shelf(scene) {
  const g = new THREE.Group(); scene.add(g);
  const metal = mat('#6c707a', { metalness: .4, roughness: .5 });
  g.add(mesh(new THREE.BoxGeometry(4.4, 3.4, .1), mat('#2b2a2e'), { y: 1.7, z: -.55 }));
  for (const y of [.9, 2.1]) g.add(mesh(new THREE.BoxGeometry(4.4, .1, 1.1), metal, { y }));
  for (const sx of [-1, 1]) g.add(mesh(new THREE.BoxGeometry(.1, 3.4, 1.1), metal, { x: sx * 2.2, y: 1.7 }));
  const tin = mat('#c9ccd2', { metalness: .6, roughness: .35 }), red = mat('#c8382c');
  for (let i = 0; i < 3; i++) { g.add(mesh(new THREE.CylinderGeometry(.24, .24, .14, 16), tin, { x: -1.2 + i * .52, y: 2.23 })); g.add(mesh(new THREE.CylinderGeometry(.245, .245, .06, 16), red, { x: -1.2 + i * .52, y: 2.23 })); }
  for (let i = 0; i < 2; i++) { g.add(mesh(new THREE.BoxGeometry(.38, .62, .32), mat('#f2f2ee'), { x: .8 + i * .48, y: 2.47 })); g.add(mesh(new THREE.BoxGeometry(.39, .12, .33), mat('#2f55c8'), { x: .8 + i * .48, y: 2.5 })); }
  g.add(mesh(new THREE.BoxGeometry(.6, .18, .4), mat('#d4a35a'), { x: -.8, y: 1.04 }));
  g.add(mesh(new THREE.CylinderGeometry(.18, .18, .4, 14), mat('#e08a2a'), { x: .9, y: 1.15 }));
  return g;
}

function comida() {
  const { scene, camera } = caveScene('#1a110d', '#3a2519');
  scene.add(mesh(new THREE.BoxGeometry(14, .2, 10), mat('#5a3e30'), { y: -.1 }));
  scene.add(mesh(new THREE.BoxGeometry(14, 8, .3), mat(ROCK2), { y: 3, z: -1 }));
  shelf(scene);
  const lamp = new THREE.PointLight('#ffd49a', 14, 10, 1.4); lamp.position.set(0, 3.6, 2); scene.add(lamp);
  const two = textSprite('2 DÍAS', { size: 70, color: '#ffd98a', bg: 'rgba(20,14,10,.85)', stroke: null, scale: .65 });
  const n33 = textSprite('33 PERSONAS', { size: 70, color: '#fff', bg: '#c8382c', stroke: null, scale: .65 });
  scene.add(two); scene.add(n33);
  return {
    scene, camera,
    update(lt, info) {
      const p = easeInOut(lt / info.dur);
      camera.position.set(lerp(-.4, .3, p), lerp(1.9, 1.7, p), lerp(6.2, 5.0, p)); camera.lookAt(0, 1.6, 0);
      const m2 = info.dur * .5;
      popScale(two, easeBack(prog(lt, .9, 1.2))); two.position.set(0, 3.45, .4);
      popScale(n33, easeBack(prog(lt, m2 + .3, m2 + .6))); n33.position.set(0, 2.95, .4);
      lamp.intensity = 14 + Math.sin(lt * 23) * .8;
    }
  };
}

// ---------- 6. Ración ----------
function racion() {
  const { scene, camera } = caveScene('#1e140f', '#4a2e22');
  scene.add(mesh(new THREE.BoxGeometry(8, .3, 6), mat('#7a5640'), { y: -.15 }));
  const lbl = canvasTex(512, 128, (g, w, h) => { g.fillStyle = '#e9e6df'; g.fillRect(0, 0, w, h); g.fillStyle = '#c8382c'; g.fillRect(0, 0, w, 26); g.fillRect(0, h - 26, w, 26);
    g.fillStyle = '#1d3a7a'; g.font = '900 54px Montserrat'; g.textAlign = 'center'; g.fillText('ATÚN', w / 2, 86); });
  scene.add(mesh(new THREE.CylinderGeometry(.9, .9, .55, 28, 1, true), new THREE.MeshStandardMaterial({ map: lbl, side: THREE.DoubleSide, roughness: .5 }), { y: .28 }));
  scene.add(mesh(new THREE.CylinderGeometry(.9, .9, .04, 28), mat('#a8adb4', { metalness: .6 }), { y: .02 }));
  scene.add(mesh(new THREE.CylinderGeometry(.86, .86, .04, 28), mat('#c9a184'), { y: .45, cast: false }));
  const lid = mesh(new THREE.CylinderGeometry(.9, .9, .02, 28), mat('#c9ccd2', { metalness: .7, roughness: .3 })); lid.position.set(-.6, .9, -.9); lid.rotation.set(-1.1, 0, .3); scene.add(lid);
  const spoon = new THREE.Group(); scene.add(spoon);
  spoon.add(mesh(new THREE.BoxGeometry(.09, .03, 1.6), mat('#d6d9de', { metalness: .8, roughness: .25 }), { z: .9 }));
  const bowl = mesh(new THREE.SphereGeometry(.2, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat('#d6d9de', { metalness: .8, roughness: .25, side: THREE.DoubleSide })); bowl.scale.set(1, .5, 1.3); spoon.add(bowl);
  const tuna = mesh(new THREE.SphereGeometry(.15, 10, 6), mat('#c9a184'), { y: .02 }); tuna.scale.set(1, .4, 1.2); spoon.add(tuna);
  const marks = [0, 1].map(i => { const s = textSprite(String(i + 1), { size: 110, color: '#ffd98a', stroke: '#2a1a10', scale: .8 }); scene.add(s); return s; });
  return {
    scene, camera,
    update(lt, info) {
      camera.position.set(.4, 3.6, 5.6 - easeInOut(lt / info.dur) * .6); camera.lookAt(0, .6, 0);
      const cyc = (lt - .3) / 1.4, k = Math.floor(cyc), f = cyc - k;
      const active = k >= 0 && k < 2;
      const dip = active ? Math.sin(Math.min(f, 1) * Math.PI) : 0;
      spoon.position.set(.2, .5 + (1 - dip) * .9 + (active ? 0 : .9), .3 - dip * .1); spoon.rotation.set(-.35 + dip * .2, -.4, 0);
      tuna.visible = active ? f > .5 : k >= 2;
      marks.forEach((m, i) => { popScale(m, easeBack(prog(lt, .3 + i * 1.4 + .8, .3 + i * 1.4 + 1.1))); m.position.set(-1.3 + i * .55, 1.7, .2); });
    }
  };
}

// ---------- 7. 17 días ----------
function espera() {
  const { scene, camera } = caveScene('#0b0705', '#1e130d');
  tunnel(scene, { len: 10, w: 4, h: 3, lamps: 1, dark: true });
  const m = makeMiner(41); sit(m); m.position.set(-1.2, -.42, -1.5); m.rotation.y = .5; scene.add(m);
  m.userData.arms.forEach(a => { a.rotation.x = -1.0; }); m.userData.head.rotation.x = .35;
  const m2 = makeMiner(42); sit(m2); m2.position.set(1.1, -.42, -2.6); m2.rotation.y = -.6; scene.add(m2);
  const can = mesh(new THREE.CylinderGeometry(.14, .14, .12, 12), mat('#c9ccd2', { metalness: .6 }), { x: -.6, y: .06, z: -.9 }); scene.add(can);
  const lamp = new THREE.PointLight('#ffcf8a', 5, 6, 1.6); lamp.position.set(-1, 1.2, -.5); scene.add(lamp);
  return {
    scene, camera,
    update(lt, info) {
      camera.position.set(lerp(1.2, .6, easeInOut(lt / info.dur)), 1.4, lerp(3.2, 2.4, easeInOut(lt / info.dur))); camera.lookAt(-.8, .6, -1.6);
      const day = (lt * 1.6) % 1; lamp.intensity = 3 + Math.sin(day * Math.PI) * 4 + (Math.sin(lt * 31) > .8 ? -1.5 : 0);
      m.userData.head.rotation.x = .35 + Math.sin(lt * .7) * .05;
    }
  };
}

// ---------- 8. La sonda ----------
function drill() {
  const g = new THREE.Group();
  const steel = mat('#b9bec6', { metalness: .8, roughness: .3 });
  g.add(mesh(new THREE.CylinderGeometry(.11, .11, 6, 12), steel, { y: 3 }));
  g.add(mesh(new THREE.ConeGeometry(.16, .4, 8), mat('#7d838c', { metalness: .8 }), { y: -.2, rx: Math.PI }));
  for (let i = 0; i < 3; i++) g.add(mesh(new THREE.BoxGeometry(.24, .04, .04), mat('#e8e8e8', { emissive: '#999', emissiveIntensity: .3 }), { y: .3 + i * .5 }));
  return g;
}

function sonda() {
  const { scene, camera } = caveScene('#0d0806', '#22150e');
  tunnel(scene, { len: 12, w: 4, h: 3, lamps: 2, dark: true });
  const bit = drill(); bit.position.set(0, 5, -3.2); scene.add(bit);
  const miners = [0, 1].map(i => { const p = makeMiner(50 + i); p.position.set(-1.2 + i * 2.4, 0, -2.4 + i * .3); p.rotation.y = i ? -2.2 : 2.2; scene.add(p); return p; });
  const r = rng(8), chips = [];
  for (let i = 0; i < 30; i++) { const c = mesh(new THREE.IcosahedronGeometry(.04 + r() * .06, 0), mat(ROCK), { cast: false }); c.userData = { v: new THREE.Vector3((r() - .5) * 1.4, -r() * .5, (r() - .5) * 1.4), d: r() * .6 }; scene.add(c); chips.push(c); }
  const dust = dustCloud(scene, 10, 4, '#9c7a66');
  return {
    scene, camera,
    update(lt, info) {
      const T = 1.3, tt = lt - T;
      bit.position.y = 5 - easeOut(prog(lt, .2, T + .8)) * 3.1; bit.rotation.y = lt * 9;
      const sh = tt > 0 && tt < .6 ? .05 : 0;
      camera.position.set(Math.sin(lt * 60) * sh, 1.2 + Math.cos(lt * 50) * sh, 2.2 - easeInOut(lt / info.dur) * .4); camera.lookAt(0, 2.4, -3.2);
      chips.forEach(c => { const q = tt - c.userData.d * .3; c.visible = q > 0 && q < 2; if (q > 0) { c.position.set(0, 2.9, -3.2).addScaledVector(c.userData.v, q); c.position.y -= 4.9 * q * q; } });
      dust(new THREE.Vector3(0, 2.6, -3.2), tt * .7);
      miners.forEach((m, i) => { const up = easeBack(prog(lt, T + .3 + i * .2, T + .7 + i * .2)); m.userData.arms.forEach(a => a.rotation.x = -up * 2.8); m.userData.head.rotation.x = -up * .5;
        m.position.y = up > .5 ? Math.abs(Math.sin(lt * 9 + i)) * .12 : 0; });
    }
  };
}

// ---------- 9. La nota ----------
function mensaje() {
  const { scene, camera } = caveScene('#2a1912', '#4a2b20');
  const bit = drill(); bit.position.set(0, -1.2, -1); scene.add(bit);
  const note = canvasTex(700, 520, (g, w, h) => {
    g.fillStyle = '#f4efe2'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(120,140,190,.35)'; g.lineWidth = 2; for (let y = 60; y < h; y += 46) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = '#d0281f'; g.font = '800 70px Montserrat'; g.textAlign = 'left';
    g.save(); g.translate(40, 120); g.rotate(-.04);
    ['ESTAMOS BIEN', 'EN EL REFUGIO', 'LOS 33'].forEach((l, i) => g.fillText(l, 0, i * 110)); g.restore();
  });
  const paper = mesh(new THREE.PlaneGeometry(2.1, 1.56), new THREE.MeshStandardMaterial({ map: note, side: THREE.DoubleSide, roughness: .9 }), { cast: false });
  const holder = new THREE.Group(); holder.position.set(0, 1.4, -.8); holder.add(paper); scene.add(holder);
  const tape = mesh(new THREE.BoxGeometry(.6, .16, .01), mat('#b8b8a8', { transparent: true, opacity: .8 }), { y: .7, z: .01 }); holder.add(tape);
  const lamp = new THREE.PointLight('#ffd9a0', 10, 8, 1.4); lamp.position.set(1, 2.5, 2); scene.add(lamp);
  return {
    scene, camera,
    update(lt, info) {
      const k = easeBack(prog(lt, .1, .7));
      holder.scale.setScalar(Math.max(.001, k)); holder.rotation.set(Math.sin(lt * 1.2) * .05, lerp(-.6, .12, easeOut(prog(lt, 0, 1.2))) + Math.sin(lt) * .05, -.05);
      bit.rotation.y = lt * .5;
      camera.position.set(0, 1.5, lerp(5.6, 4.6, easeInOut(lt / info.dur))); camera.lookAt(0, 1.3, -.8);
    }
  };
}

// ---------- 10. Las "palomas" ----------
function palomas() {
  const scene = new THREE.Scene(); scene.background = gradientBg('#2c2236', '#d79a86', '#8a5f72');
  scene.add(new THREE.HemisphereLight('#ffe0d0', '#402820', 1.2));
  const d = new THREE.DirectionalLight('#ffd8c0', 1.4); d.position.set(-3, 5, 6); scene.add(d);
  const camera = new THREE.PerspectiveCamera(42, W / H, .1, 200);
  profile(scene);
  scene.add(mesh(new THREE.BoxGeometry(.06, 6.8, .02), new THREE.MeshBasicMaterial({ color: '#1a0f0b' }), { y: .4, z: .05, cast: false }));
  scene.add(mesh(new THREE.BoxGeometry(2.2, .8, .02), new THREE.MeshBasicMaterial({ color: '#2a1a14' }), { y: -3.3, z: .05, cast: false }));
  const r = rng(3);
  for (let i = 0; i < 9; i++) scene.add(mesh(new THREE.BoxGeometry(.08, .22, .02), new THREE.MeshBasicMaterial({ color: ['#f2c230', '#e8642a'][i % 2] }), { x: -.9 + i * .22, y: -3.5, z: .08, cast: false }));
  const tube = mesh(new THREE.CylinderGeometry(.09, .09, .7, 12), mat('#2f6fd0', { emissive: '#2f6fd0', emissiveIntensity: .4 }), { cast: false }); scene.add(tube);
  const items = ['AGUA', 'COMIDA', 'CARTAS'].map(t => { const s = textSprite(t, { size: 46, color: '#fff', bg: 'rgba(30,20,15,.85)', stroke: null, scale: 1.2 }); scene.add(s); return s; });
  return {
    scene, camera,
    update(lt, info) {
      camera.position.set(0, lerp(.2, -.6, easeInOut(lt / info.dur)), 12); camera.lookAt(0, -.2, 0);
      const cyc = (lt % 1.6) / 1.6; tube.position.set(0, lerp(3.9, -2.9, easeInOut(cyc)), .1);
      items.forEach((s, i) => { popScale(s, easeBack(prog(lt, .6 + i * .7, .9 + i * .7))); s.position.set(1.35, 1.0 - i * .8, .3); });
    }
  };
}

// ---------- 11. Cápsula Fénix ----------
function fenix() {
  const g = new THREE.Group();
  const flag = canvasTex(64, 512, (c, w, h) => { const s = [['#f4f4f0', .32], ['#d52b1e', .14], ['#f4f4f0', .08], ['#0039a6', .14], ['#f4f4f0', .32]]; let y = 0; s.forEach(([col, f]) => { c.fillStyle = col; c.fillRect(0, y, w, h * f); y += h * f; }); });
  g.add(mesh(new THREE.CylinderGeometry(.33, .33, 2.6, 18), new THREE.MeshStandardMaterial({ map: flag, roughness: .4, metalness: .2 }), { y: 1.3 }));
  g.add(mesh(new THREE.ConeGeometry(.33, .6, 18), mat('#f4f4f0'), { y: 2.9 }));
  g.add(mesh(new THREE.CylinderGeometry(.36, .36, .08, 18), mat('#9aa0a8', { metalness: .7 }), { y: .04 }));
  return g;
}

function capsula() {
  const { scene, camera } = baseScene({ top: '#0c0d1e', mid: '#2a2140', bottom: '#5a3a46', sun: '#cfd8ff', sunI: 1.6, sunPos: [4, 8, 6], shadowSize: 6 });
  scene.add(mesh(new THREE.PlaneGeometry(200, 200), mat('#6a4a48'), { cast: false, rx: -Math.PI / 2 }));
  const cap = fenix(); scene.add(cap);
  const rig = new THREE.Group(); scene.add(rig); const red = mat('#c8382c');
  for (const sx of [-1, 1]) rig.add(mesh(new THREE.BoxGeometry(.15, 5, .15), red, { x: sx * 1.2, y: 2.5 }));
  rig.add(mesh(new THREE.BoxGeometry(2.6, .2, .2), red, { y: 5 }));
  const wheel = mesh(new THREE.TorusGeometry(.4, .07, 8, 20), mat('#333'), { y: 5.3 }); rig.add(wheel);
  rig.add(mesh(new THREE.CylinderGeometry(.015, .015, 2, 6), mat('#222'), { y: 4.1 }));
  const spot = new THREE.SpotLight('#fff2d0', 60, 20, .5, .5); spot.position.set(3, 7, 4); spot.target = cap; scene.add(spot);
  return {
    scene, camera,
    update(lt, info) {
      const a = lerp(-.5, .5, easeInOut(lt / info.dur));
      camera.position.set(Math.sin(a) * 7, 2.4, Math.cos(a) * 7); camera.lookAt(0, 1.8, 0);
      cap.position.y = .1 + Math.sin(lt * 1.5) * .04; cap.rotation.y = lt * .3; wheel.rotation.z = lt * 1.5;
    }
  };
}

// ---------- 12. Rescate ----------
function rescate() {
  const { scene, camera } = baseScene({ top: '#07081a', mid: '#1c1838', bottom: '#4a3040', sun: '#cfd8ff', sunI: 1.2, sunPos: [4, 8, 6], shadowSize: 8 });
  scene.add(mesh(new THREE.PlaneGeometry(200, 200), mat('#5a4040'), { cast: false, rx: -Math.PI / 2 }));
  scene.add(mesh(new THREE.TorusGeometry(.55, .12, 8, 24), mat('#9aa0a8', { metalness: .6 }), { y: .1, rx: Math.PI / 2 }));
  scene.add(mesh(new THREE.CircleGeometry(.5, 20), new THREE.MeshBasicMaterial({ color: '#050302' }), { y: .02, rx: -Math.PI / 2, cast: false }));
  const cap = fenix(); scene.add(cap);
  const shell = mesh(new THREE.CylinderGeometry(.34, .34, 2.6, 18, 1, true), new THREE.MeshStandardMaterial({ color: '#cfe6ff', transparent: true, opacity: .25, side: THREE.DoubleSide }), { y: 1.3 });
  const rider = makeMiner(60); rider.scale.setScalar(.95); rider.position.y = .15;
  const inner = new THREE.Group(); inner.add(rider); inner.add(shell); scene.add(inner);
  const r = rng(12);
  for (let i = 0; i < 14; i++) { const a = Math.PI * (.2 + r() * .6) + Math.PI, rr = 4 + r() * 2.5;
    const p = makePerson({ shirt: ['#c8382c', '#2f55c8', '#e8e8e8', '#3d6a4a'][i % 4], pants: '#2c3140', skin: SKIN[i % 5], hair: HAIR[i % 5], seed: 200 + i });
    p.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr - 1); p.lookAt(0, 0, 0); scene.add(p); p.userData.cheer = r(); }
  const crowd = scene.children.filter(c => c.userData && c.userData.cheer !== undefined);
  for (const [x, z] of [[-3, -5], [3.5, -5.5]]) { const f = canvasTex(96, 64, (c, w, h) => { c.fillStyle = '#f4f4f0'; c.fillRect(0, 0, w, h / 2); c.fillStyle = '#d52b1e'; c.fillRect(0, h / 2, w, h / 2); c.fillStyle = '#0039a6'; c.fillRect(0, 0, w / 3, h / 2); c.fillStyle = '#fff'; c.font = '20px sans-serif'; c.fillText('★', 9, 24); });
    scene.add(mesh(new THREE.CylinderGeometry(.03, .03, 3, 6), mat('#ccc'), { x, y: 1.5, z })); const fl = mesh(new THREE.PlaneGeometry(1.2, .8), new THREE.MeshStandardMaterial({ map: f, side: THREE.DoubleSide }), { x: x + .6, y: 2.6, z, cast: false }); fl.userData.flag = 1; scene.add(fl); }
  const spot = new THREE.SpotLight('#fff6e0', 90, 25, .45, .6); spot.position.set(-3, 8, 4); spot.target = cap; scene.add(spot);
  return {
    scene, camera,
    update(lt, info) {
      const up = easeInOut(prog(lt, .3, info.dur * .75));
      cap.position.y = lerp(-3, 0, up); inner.position.y = cap.position.y;
      cap.visible = inner.visible = cap.position.y > -2.9;
      camera.position.set(1.5, lerp(1.6, 2.4, up), lerp(7, 6, up)); camera.lookAt(0, lerp(.6, 1.8, up), 0);
      crowd.forEach((c, i) => { const ch = up > .8 ? 1 : 0; c.userData.arms.forEach(a => a.rotation.x = -ch * (2.4 + Math.sin(lt * 8 + i) * .3)); c.position.y = ch * Math.abs(Math.sin(lt * 7 + c.userData.cheer * 6)) * .1; });
      scene.children.forEach(o => { if (o.userData.flag) o.rotation.y = Math.sin(lt * 2 + o.position.x) * .2; });
    }
  };
}

// ---------- 13. Todos vivos ----------
function superficie() {
  const { scene, camera } = baseScene({ top: '#0a0b20', mid: '#2a2048', bottom: '#7a4a5a', sun: '#ffe2c8', sunI: 1.6, sunPos: [-4, 8, 8], shadowSize: 12 });
  scene.add(mesh(new THREE.PlaneGeometry(200, 200), mat('#6a4a4a'), { cast: false, rx: -Math.PI / 2 }));
  const miners = [];
  for (let i = 0; i < 33; i++) { const m = makeMiner(300 + i, { lamp: false }); const row = Math.floor(i / 11), col = i % 11;
    m.position.set(-5 + col * 1.0 + (row % 2) * .5, 0, -row * 1.1); scene.add(m); miners.push(m);
    m.userData.head.add(mesh(new THREE.BoxGeometry(.3, .07, .04), mat('#111', { roughness: .2 }), { y: .02, z: .22, cast: false })); }
  const r = rng(9), conf = [];
  for (let i = 0; i < 90; i++) { const c = mesh(new THREE.BoxGeometry(.08, .08, .01), new THREE.MeshBasicMaterial({ color: ['#d52b1e', '#0039a6', '#ffffff', '#f2c230'][i % 4] }), { cast: false });
    c.userData = { x: (r() - .5) * 12, z: (r() - .5) * 4, o: r(), s: .5 + r() }; scene.add(c); conf.push(c); }
  return {
    scene, camera,
    update(lt, info) {
      const p = easeInOut(lt / info.dur);
      camera.position.set(lerp(-2, 1, p), lerp(3.2, 2.6, p), lerp(12, 9.5, p)); camera.lookAt(0, 1.2, -1);
      miners.forEach((m, i) => { const v = easeBack(prog(lt, (i % 11) * .06, .4 + (i % 11) * .06)); m.scale.setScalar(Math.max(.001, v));
        const ch = Math.sin(lt * 5 + i) > 0 ? 1 : .7; m.userData.arms.forEach((a, j) => a.rotation.x = -(j === i % 2 ? 2.7 : .3) * ch); });
      conf.forEach(c => { const u = c.userData, f = (lt * .35 * u.s + u.o) % 1; c.position.set(u.x + Math.sin(lt * 2 + u.o * 9) * .3, 7 - f * 7.5, u.z + 1); c.rotation.set(lt * 3 * u.s, lt * 2, 0); });
    }
  };
}

// ---------- 14. Cierre ----------
function cierre() {
  const { scene, camera } = baseScene({ top: '#1a1430', mid: '#7a4a6a', bottom: '#e8a07a', fog: '#c88a88', fogNear: 30, fogFar: 140, sun: '#ffd2b0', sunI: 1.8, sunPos: [-10, 6, 8], shadowSize: 14 });
  desert(scene);
  const door = mesh(new THREE.BoxGeometry(2.6, 2.4, .3), new THREE.MeshBasicMaterial({ color: '#0d0907' }), { y: 1.2, z: -5, cast: false }); scene.add(door);
  return {
    scene, camera,
    update(lt, info) { camera.position.set(0, 2.2, lerp(18, 15, easeInOut(lt / info.dur))); camera.lookAt(0, 3.5, -6); },
    draw2d(ctx, lt, info) {
      const a = easeOut(prog(lt, .3, 1));
      ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const y = 480 + (1 - a) * 30;
      ctx.font = '900 150px Montserrat'; ctx.lineJoin = 'round'; ctx.lineWidth = 14; ctx.strokeStyle = 'rgba(20,10,8,.9)'; ctx.strokeText('LOS 33', W / 2, y);
      const gr = ctx.createLinearGradient(0, y - 70, 0, y + 70); gr.addColorStop(0, '#ffe7b0'); gr.addColorStop(1, '#e09a3a'); ctx.fillStyle = gr; ctx.fillText('LOS 33', W / 2, y);
      ctx.font = '800 32px Montserrat'; ctx.letterSpacing = '5px'; ctx.fillStyle = '#fff';
      ctx.fillText('HISTORIA REAL · 2010', W / 2 + 3, y + 105); ctx.fillStyle = '#ffd98a'; ctx.fillText('PELÍCULA · 2015', W / 2 + 3, y + 150); ctx.letterSpacing = '0px';
      const b = easeBack(prog(lt, info.dur * .45, info.dur * .45 + .4));
      if (b > 0) { ctx.globalAlpha = 1; ctx.translate(W / 2, 1120); ctx.scale(b, b);
        ctx.fillStyle = '#ffd98a'; roundRect(ctx, -270, -40, 540, 80, 40); ctx.fill();
        ctx.fillStyle = '#1a0f0a'; ctx.font = '900 32px Montserrat'; ctx.fillText('SÍGUEME PARA MÁS HISTORIAS', 0, 2); }
      ctx.restore();
    }
  };
}

export const SCENES = { entrada, rampa, derrumbe, refugio, comida, racion, espera, sonda, mensaje, palomas, capsula, rescate, superficie, cierre };
