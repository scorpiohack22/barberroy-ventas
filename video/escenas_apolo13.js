// Escenas de "Apolo 13" (historia real, 1970). Usa las utilidades de escenas.js.
import * as THREE from 'three';
import {
  W, H, clamp, easeOut, easeInOut, easeBack, roundRect, mat, mesh, canvasTex, gradientBg, baseScene,
  textSprite, popScale, makePerson, rng, lerp, prog, stripeTex
} from './escenas.js';

// ---------- piezas ----------
function starsBg(seed = 1, tint = null) {
  return canvasTex(720, 1280, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#03040c'); gr.addColorStop(1, tint || '#0b1030');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const r = rng(seed);
    for (let i = 0; i < 700; i++) { const s = r() < .93 ? r() * 1.4 + .3 : r() * 2.5 + 1.2;
      g.fillStyle = `rgba(255,${230 + r() * 25 | 0},${200 + r() * 55 | 0},${.35 + r() * .65})`; g.beginPath(); g.arc(r() * w, r() * h, s, 0, 7); g.fill(); }
  });
}

function earthTex() {
  return canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = '#1f5fbf'; g.fillRect(0, 0, w, h);
    const r = rng(5);
    for (let i = 0; i < 26; i++) { const cx = r() * w, cy = h * .2 + r() * h * .6;
      for (let j = 0; j < 14; j++) { g.fillStyle = r() < .7 ? '#4f9a4c' : '#b49a62'; g.beginPath();
        g.arc(cx + (r() - .5) * 120, cy + (r() - .5) * 70, 12 + r() * 30, 0, 7); g.fill(); } }
    g.fillStyle = '#f2f6ff'; g.fillRect(0, 0, w, 30); g.fillRect(0, h - 30, w, 30);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${.5 + r() * .4})`; g.beginPath();
      g.ellipse(r() * w, r() * h, 20 + r() * 60, 6 + r() * 12, r() * .5, 0, 7); g.fill(); }
  });
}

function moonTex() {
  return canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = '#9d9a96'; g.fillRect(0, 0, w, h);
    const r = rng(9);
    for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(70,70,75,${.25 + r() * .25})`; g.beginPath(); g.ellipse(r() * w, r() * h, 30 + r() * 90, 20 + r() * 60, r() * 3, 0, 7); g.fill(); }
    for (let i = 0; i < 160; i++) { const x = r() * w, y = r() * h, s = 3 + r() * 16;
      g.fillStyle = 'rgba(60,60,62,.45)'; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill();
      g.fillStyle = 'rgba(230,230,225,.35)'; g.beginPath(); g.arc(x - s * .25, y - s * .25, s * .7, 0, 7); g.fill(); }
  });
}

function planet(tex, radius, detail = 4) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, detail), new THREE.MeshStandardMaterial({ map: tex, roughness: .9, flatShading: true }));
  return m;
}

function spaceScene(seed, tint) {
  const scene = new THREE.Scene(); scene.background = starsBg(seed, tint);
  scene.add(new THREE.HemisphereLight('#b8c8ff', '#1a1a2a', .5));
  const sun = new THREE.DirectionalLight('#fff4e0', 3.2); sun.position.set(-6, 3, 5); scene.add(sun);
  const camera = new THREE.PerspectiveCamera(42, W / H, .05, 600);
  return { scene, camera, sun };
}

const silver = () => mat('#cfd2d6', { metalness: .55, roughness: .35 });
const gold = () => mat('#d9a43a', { metalness: .6, roughness: .45, emissive: '#3a2400', emissiveIntensity: .3 });

// Nave: módulo de servicio + módulo de mando + módulo lunar. Apunta hacia +x.
function makeApollo() {
  const g = new THREE.Group();
  const sm = mesh(new THREE.CylinderGeometry(.5, .5, 1.4, 16), silver()); sm.rotation.z = Math.PI / 2; g.add(sm);
  const panel = mesh(new THREE.BoxGeometry(.5, .04, .42), mat('#a9adb3', { metalness: .5, roughness: .4 }), { x: -.05, y: .5 }); g.add(panel);
  const bell = mesh(new THREE.CylinderGeometry(.12, .38, .6, 14, 1, true), mat('#55575c', { metalness: .6, roughness: .4, side: THREE.DoubleSide }), { x: -1 }); bell.rotation.z = Math.PI / 2; g.add(bell);
  const cm = mesh(new THREE.ConeGeometry(.5, .75, 16), mat('#e8e6e0', { metalness: .4, roughness: .3 }), { x: 1.07 }); cm.rotation.z = -Math.PI / 2; g.add(cm);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + .4;
    g.add(mesh(new THREE.BoxGeometry(.1, .1, .1), mat('#333'), { x: .4, y: Math.cos(a) * .5, z: Math.sin(a) * .5 })); }
  const lm = new THREE.Group(); lm.position.x = 2.05; g.add(lm);
  lm.add(mesh(new THREE.BoxGeometry(.7, .6, .7), gold()));
  lm.add(mesh(new THREE.IcosahedronGeometry(.42, 0), mat('#b9bcc2', { metalness: .4, roughness: .5 }), { x: .5 }));
  for (const [y, z] of [[.4, .4], [.4, -.4], [-.4, .4], [-.4, -.4]]) {
    const leg = mesh(new THREE.CylinderGeometry(.03, .03, .7, 6), mat('#c9a24a', { metalness: .6 }), { x: -.1, y: y * 1.2, z: z * 1.2 });
    leg.rotation.set(z * 1.2, 0, y * 1.2); lm.add(leg); }
  g.userData = { panel, lm, sm };
  return g;
}

function makeSaturn() {
  const g = new THREE.Group();
  const w = mat('#f2f2ee', { roughness: .5 }), b = mat('#1d1d1f');
  const chk = canvasTex(256, 256, (c, ww, hh) => { c.fillStyle = '#f2f2ee'; c.fillRect(0, 0, ww, hh); c.fillStyle = '#1d1d1f';
    for (let i = 0; i < 4; i++) c.fillRect(i * 64, (i % 2) * 128, 32, 128); });
  g.add(mesh(new THREE.CylinderGeometry(.55, .55, 4.2, 20), new THREE.MeshStandardMaterial({ map: chk, roughness: .5 }), { y: 2.1 }));
  for (const y of [.2, 4.0]) g.add(mesh(new THREE.CylinderGeometry(.56, .56, .15, 20), b, { y }));
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4;
    const fin = mesh(new THREE.BoxGeometry(.12, .7, .5), b, { x: Math.cos(a) * .6, y: .35, z: Math.sin(a) * .6 }); fin.rotation.y = -a; g.add(fin); }
  g.add(mesh(new THREE.CylinderGeometry(.55, .55, 2.4, 20), w, { y: 5.4 }));
  g.add(mesh(new THREE.CylinderGeometry(.55, .55, .12, 20), b, { y: 6.55 }));
  g.add(mesh(new THREE.CylinderGeometry(.4, .55, .5, 20), w, { y: 6.85 }));
  g.add(mesh(new THREE.CylinderGeometry(.4, .4, 1.3, 20), w, { y: 7.75 }));
  g.add(mesh(new THREE.CylinderGeometry(.33, .4, .5, 20), w, { y: 8.65 }));
  g.add(mesh(new THREE.ConeGeometry(.33, .55, 20), w, { y: 9.17 }));
  g.add(mesh(new THREE.CylinderGeometry(.03, .03, 1, 6), mat('#c0392b'), { y: 9.9 }));
  return g;
}

function puff(color = '#f4f1ea') { return mesh(new THREE.IcosahedronGeometry(1, 1), mat(color, { roughness: 1 }), { cast: false }); }

// ---------- 1. Lanzamiento ----------
function lanzamiento() {
  const { scene, camera } = baseScene({ top: '#5b8fd6', bottom: '#f3d9b1', fog: '#e6d9c4', fogNear: 40, fogFar: 160, sun: '#fff1da', sunPos: [-8, 14, 8], shadowSize: 14 });
  scene.add(mesh(new THREE.PlaneGeometry(400, 400), mat('#b9ad8f'), { cast: false, rx: -Math.PI / 2 }));
  scene.add(mesh(new THREE.CylinderGeometry(4, 4.6, .6, 8), mat('#9a9690'), { y: .3 }));
  const tower = new THREE.Group(); tower.position.set(-2.1, .6, 0); scene.add(tower);
  const red = mat('#b8382c');
  for (const [x, z] of [[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5]]) tower.add(mesh(new THREE.BoxGeometry(.12, 11, .12), red, { x, y: 5.5, z }));
  for (let y = 0; y < 11; y += 1) tower.add(mesh(new THREE.BoxGeometry(1.1, .08, 1.1), red, { y }));
  const arm = mesh(new THREE.BoxGeometry(1.4, .15, .3), red, { x: 1.2, y: 8.6 }); tower.add(arm);
  const rocket = makeSaturn(); rocket.position.y = .6; scene.add(rocket);
  const fl = new THREE.Group(); rocket.add(fl);
  const flMat = mat('#ffb22e', { emissive: '#ff7a00', emissiveIntensity: 2.2, transparent: true, opacity: .95 });
  for (const [x, z] of [[0, 0], [.25, .25], [-.25, .25], [.25, -.25], [-.25, -.25]]) { const f = mesh(new THREE.ConeGeometry(.2, 1.6, 8), flMat, { x, y: -.8, z, cast: false }); f.rotation.x = Math.PI; fl.add(f); }
  const glow = new THREE.PointLight('#ffa040', 0, 30); glow.position.y = -1; rocket.add(glow);
  const puffs = []; const r = rng(3);
  for (let i = 0; i < 60; i++) { const p = puff(); p.userData = { a: r() * 6.28, sp: 2 + r() * 4, d: r() * 2.5, s: .6 + r() * 1.2, up: r() }; scene.add(p); puffs.push(p); }
  for (let i = 0; i < 8; i++) { const h = 12 + r() * 14; scene.add(mesh(new THREE.ConeGeometry(14, h, 5), mat('#a8b4c8'), { x: -80 + i * 24, y: h / 2 - 1, z: -110, cast: false })); }
  return {
    scene, camera,
    update(lt, info) {
      const ign = 1.0, rise = Math.max(0, lt - 1.8);
      const lift = rise * rise * 1.3;
      rocket.position.y = .6 + lift;
      const on = lt > ign; fl.visible = on; fl.scale.set(1, 1 + Math.sin(lt * 40) * .15 + (on ? 1.5 * clamp(lt - ign) : 0), 1);
      glow.intensity = on ? 60 + Math.sin(lt * 30) * 15 : 0;
      arm.rotation.y = -easeInOut(prog(lt, 1.2, 2.2)) * 1.2;
      puffs.forEach(p => { const u = p.userData, tt = lt - ign - u.d * .6;
        if (tt < 0) { p.visible = false; return; } p.visible = true;
        const rr = tt * u.sp; p.position.set(Math.cos(u.a) * rr, .5 + u.up * tt * 1.5, Math.sin(u.a) * rr * .6);
        p.scale.setScalar(Math.min(3, u.s * (.4 + tt * .9))); });
      const shake = on ? (Math.sin(lt * 63) + Math.sin(lt * 47)) * .04 * (1 - clamp(rise / 3)) : 0;
      const p = easeInOut(lt / info.dur);
      camera.position.set(lerp(9, 7, p) + shake, lerp(3, 4, p) + shake, lerp(16, 14, p));
      camera.lookAt(0, lerp(5, Math.max(5, rocket.position.y + 5), clamp(rise / 2)), 0);
    }
  };
}

// ---------- 2. Rumbo a la Luna ----------
function espacio() {
  const { scene, camera } = spaceScene(11);
  const earth = planet(earthTex(), 6); earth.position.set(-5, -6, -14); scene.add(earth);
  const atm = new THREE.Mesh(new THREE.SphereGeometry(6.25, 32, 20), new THREE.MeshBasicMaterial({ color: '#7fb6ff', transparent: true, opacity: .18, side: THREE.BackSide })); earth.add(atm);
  const moon = planet(moonTex(), 1.2, 3); moon.position.set(9, 10, -60); scene.add(moon);
  const ship = makeApollo(); scene.add(ship);
  return {
    scene, camera,
    update(lt, info) {
      const p = lt / info.dur;
      earth.rotation.y = lt * .05;
      ship.position.set(lerp(-1.4, 1.8, p), lerp(-.6, .9, p), 0); ship.rotation.set(.25, -.5 + p * .2, .5 + Math.sin(lt) * .03);
      camera.position.set(lerp(1, .5, p), lerp(-.5, .3, p), lerp(9, 7, easeInOut(p))); camera.lookAt(ship.position.x * .6, ship.position.y * .6, 0);
    }
  };
}

// ---------- 3. Explosión ----------
function explosion() {
  const { scene, camera } = spaceScene(12);
  const ship = makeApollo(); scene.add(ship); ship.rotation.set(.2, -.35, .1);
  const { panel } = ship.userData;
  const flash = new THREE.PointLight('#ffd9a0', 0, 12); flash.position.set(-.05, .9, 0); ship.add(flash);
  const parts = []; const r = rng(17);
  for (let i = 0; i < 70; i++) { const big = i < 12;
    const p = mesh(big ? new THREE.BoxGeometry(.08, .02, .12) : new THREE.IcosahedronGeometry(.04 + r() * .05, 0),
      big ? mat('#b9bcc2', { metalness: .5 }) : mat(r() < .5 ? '#ffffff' : '#ffd08a', { emissive: '#ffb050', emissiveIntensity: r() * 1.5 }), { cast: false });
    p.userData = { v: new THREE.Vector3((r() - .5) * 2.2, .8 + r() * 2, (r() - .5) * 2.2), s: new THREE.Vector3(r() * 9, r() * 9, r() * 9) };
    ship.add(p); parts.push(p); }
  const gas = []; for (let i = 0; i < 18; i++) { const p = puff('#e8f0ff'); p.material.transparent = true; p.userData = { d: r() * 1.5, v: new THREE.Vector3((r() - .5) * .5, 1, (r() - .5) * .5) }; ship.add(p); gas.push(p); }
  return {
    scene, camera,
    update(lt, info) {
      const T = .9, tt = lt - T;
      const shake = tt > 0 ? Math.exp(-tt * 2) * .12 : 0;
      camera.position.set(.6 + Math.sin(lt * 70) * shake, .8 + Math.cos(lt * 55) * shake, lerp(4.4, 3.8, easeInOut(lt / info.dur)));
      camera.lookAt(0, .35, 0);
      ship.rotation.z = .1 + (tt > 0 ? Math.min(tt, 2) * .25 : 0); ship.rotation.y = -.35 + (tt > 0 ? tt * .15 : 0);
      if (tt <= 0) { panel.position.set(-.05, .5, 0); panel.rotation.set(0, 0, 0); }
      else { panel.position.set(-.05 + tt * .3, .5 + tt * 1.6, tt * .4); panel.rotation.set(tt * 6, tt * 3, tt * 2); }
      flash.intensity = tt > 0 ? 80 * Math.exp(-tt * 4) : 0;
      parts.forEach(p => { p.visible = tt > 0; if (tt > 0) { p.position.set(-.05, .5, 0).addScaledVector(p.userData.v, tt); p.rotation.set(p.userData.s.x * tt, p.userData.s.y * tt, 0); } });
      gas.forEach(p => { const t2 = tt - p.userData.d * .4; p.visible = t2 > 0;
        if (t2 > 0) { p.position.set(-.05, .55, 0).addScaledVector(p.userData.v, t2 * 1.2); p.scale.setScalar(.1 + t2 * .35); p.material.opacity = Math.max(0, .8 - t2 * .45); } });
    },
    draw2d(ctx, lt) { const tt = lt - .9; if (tt > 0 && tt < .25) { ctx.fillStyle = `rgba(255,240,210,${(1 - tt / .25) * .8})`; ctx.fillRect(0, 0, W, H); } }
  };
}

// ---------- 4 y 8. Cabina (alarma / frío) ----------
function astronaut(seed, hair, skin) {
  const p = makePerson({ shirt: '#e9e9e4', pants: '#d9d9d2', hair, skin, seed });
  p.userData.legs.forEach(l => l.rotation.x = -Math.PI / 2 + .2);
  p.add(mesh(new THREE.BoxGeometry(.16, .12, .03), mat('#2a4fa0'), { x: -.17, y: 1.36, z: .18, cast: false }));
  return p;
}

function cabina(mode) {
  const frio = mode === 'frio';
  const scene = new THREE.Scene(); scene.background = gradientBg('#0c0f18', '#1c2233');
  const hemi = new THREE.HemisphereLight(frio ? '#9cc4ff' : '#d8dcff', '#202020', frio ? 1.1 : .9); scene.add(hemi);
  const key = new THREE.DirectionalLight(frio ? '#bcd6ff' : '#fff2dc', frio ? 2 : 2); key.position.set(2, 5, frio ? -4 : 4); key.castShadow = true; scene.add(key);
  const alarm = new THREE.PointLight('#ff2a1a', 0, 14); alarm.position.set(0, 3, 1.5); scene.add(alarm);
  const camera = new THREE.PerspectiveCamera(46, W / H, .05, 100);
  const wall = mat(frio ? '#5a6478' : '#6f747d');
  scene.add(mesh(new THREE.BoxGeometry(8, 6, .3), wall, { y: 2, z: -2.2 }));
  scene.add(mesh(new THREE.BoxGeometry(8, .3, 6), wall, { y: 4.4, z: 0 }));
  scene.add(mesh(new THREE.BoxGeometry(8, .3, 6), mat('#4a4e56'), { y: -.15 }));
  const winMat = new THREE.MeshBasicMaterial({ map: starsBg(4) });
  for (const x of [-1.6, 1.6]) scene.add(mesh(new THREE.PlaneGeometry(1, .7), winMat, { x, y: 3.3, z: -2.04, cast: false }));
  const lights = []; const r = rng(23);
  const console_ = new THREE.Group(); console_.position.set(0, 2, -2.03); scene.add(console_);
  console_.add(mesh(new THREE.BoxGeometry(5, 1.6, .1), mat('#2c3038'), { cast: false }));
  for (let i = 0; i < 22; i++) for (let j = 0; j < 6; j++) {
    const c = ['#7cff8a', '#ffd23a', '#4ab4ff', '#ffffff', '#ff5a3a'][(r() * 5) | 0];
    const l = mesh(new THREE.BoxGeometry(.13, .1, .04), new THREE.MeshStandardMaterial({ color: '#222', emissive: c, emissiveIntensity: 1.6 }), { x: -2.3 + i * .22, y: -.6 + j * .24, z: .07, cast: false });
    l.userData = { o: r(), base: 1.6 }; console_.add(l); lights.push(l);
  }
  const master = mesh(new THREE.BoxGeometry(.5, .3, .05), new THREE.MeshStandardMaterial({ color: '#400', emissive: '#ff2a1a', emissiveIntensity: 0 }), { y: 1.05, z: .07, cast: false }); console_.add(master);
  const crew = [astronaut(31, '#3a2a1c', '#e0b28c'), astronaut(32, '#a8743c', '#f0c6a0'), astronaut(33, '#1c1917', '#d9a47c')];
  crew.forEach((c, i) => { c.position.set(-1.3 + i * 1.3, -.2, .2); c.rotation.y = Math.PI; scene.add(c);
    c.add(mesh(new THREE.BoxGeometry(.8, 1.1, .2), mat('#3b4150'), { y: 1.0, z: -.28 })); });
  const frost = [], breath = [];
  if (frio) {
    for (let i = 0; i < 90; i++) { const f = mesh(new THREE.IcosahedronGeometry(.02 + r() * .02, 0), mat('#ffffff', { emissive: '#cfe6ff', emissiveIntensity: .8 }), { cast: false });
      f.userData = { x: (r() - .5) * 6, y: r() * 4, z: (r() - .5) * 3, s: .2 + r() * .3, o: r() * 6 }; scene.add(f); frost.push(f); }
    crew.forEach((c, i) => { const b = puff('#ffffff'); b.material.transparent = true; b.userData = { c, o: i * .7 }; scene.add(b); breath.push(b); });
  }
  return {
    scene, camera,
    update(lt, info) {
      const m2 = info.marks[1] ?? info.dur;
      const p = easeInOut(lt / info.dur);
      if (frio) { camera.position.set(lerp(2.0, 1.3, p), 2.4, -1.85); camera.lookAt(-.5, 1.3, .7); }
      else { camera.position.set(lerp(-.6, .9, p), lerp(3.3, 3.0, p), lerp(5.6, 4.6, p)); camera.lookAt(0, 2.0, -2); }
      const blink = (Math.sin(lt * 9) > 0) ? 1 : 0;
      const alarmOn = !frio;
      alarm.intensity = alarmOn ? blink * 5 : 0; master.material.emissiveIntensity = alarmOn ? blink * 3 : 0;
      const off = frio ? .85 : easeInOut(prog(lt, m2 + .5, info.dur - .3));
      lights.forEach((l, k) => { const dead = l.userData.o < off; l.material.emissiveIntensity = dead ? 0 : l.userData.base * (frio ? .5 : 1) * (.8 + .2 * Math.sin(lt * 5 + k)); });
      crew.forEach((c, i) => { c.userData.head.rotation.y = alarmOn ? Math.sin(lt * 2 + i) * .3 : Math.sin(lt * .6 + i) * .1;
        c.userData.arms.forEach((a, j) => a.rotation.x = frio ? -1.2 : -.6 + (alarmOn && j === i % 2 ? Math.sin(lt * 6 + i) * .4 : 0));
        if (frio) c.userData.arms.forEach((a, j) => a.rotation.z = (j ? 1 : -1) * -.6);
        c.position.x = -1.3 + i * 1.3 + (frio ? Math.sin(lt * 40 + i) * .006 : 0); });
      frost.forEach(f => { const u = f.userData; f.position.set(u.x + Math.sin(lt * u.s + u.o) * .3, (u.y - lt * u.s * .5 + 8) % 4, u.z); });
      breath.forEach(b => { const u = b.userData, ph = ((lt + u.o) % 2.2) / 2.2;
        const hp = u.c.userData.head.getWorldPosition(new THREE.Vector3());
        b.position.set(hp.x, hp.y - .05 + ph * .2, hp.z - .3 - ph * .6); b.scale.setScalar(.05 + ph * .25); b.material.opacity = (1 - ph) * .55; });
      if (frio) { hemi.intensity = lerp(1.1, .8, p); }
    },
    draw2d(ctx, lt) {
      if (!frio) { const blink = (Math.sin(lt * 9) > 0) ? 1 : 0; if (blink) { ctx.fillStyle = 'rgba(255,0,0,.07)'; ctx.fillRect(0, 0, W, H); } }
      else { const g = ctx.createRadialGradient(W / 2, H / 2, H * .25, W / 2, H / 2, H * .7); g.addColorStop(0, 'rgba(180,220,255,0)'); g.addColorStop(1, 'rgba(200,230,255,.35)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    }
  };
}

// ---------- 5. Módulo lunar como bote salvavidas ----------
function modulo() {
  const { scene, camera } = spaceScene(14);
  const earth = planet(earthTex(), 3); earth.position.set(4, -7, -20); scene.add(earth);
  const ship = makeApollo(); scene.add(ship); ship.rotation.set(.15, -.9, .05);
  const { lm } = ship.userData;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.75, .04, 8, 40), new THREE.MeshBasicMaterial({ color: '#ffd23a' })); lm.add(ring); ring.rotation.y = Math.PI / 2;
  const tag = textSprite('MÓDULO LUNAR', { size: 50, color: '#ffd23a', scale: .45 }); lm.add(tag); tag.position.set(0, -1.05, 0);
  const crew = [0, 1, 2].map(i => { const s = textSprite('●', { size: 60, color: '#ffffff', stroke: '#222', scale: .35 }); scene.add(s); return s; });
  return {
    scene, camera,
    update(lt, info) {
      const m2 = info.marks[1] ?? info.dur;
      const p = easeInOut(lt / info.dur);
      const lmw = lm.getWorldPosition(new THREE.Vector3());
      camera.position.set(lerp(1.2, 1.8, p), lerp(.6, .5, p), lerp(7.5, 6.2, p)); camera.lookAt(lerp(.5, lmw.x, p * .7), lerp(.4, lmw.y + .3, p * .7), lerp(0, lmw.z, p * .7));
      const k = easeBack(prog(lt, .3, .7)); ring.scale.setScalar(Math.max(.001, k * (1 + Math.sin(lt * 5) * .05))); popScale(tag, easeBack(prog(lt, .4, .8)));
      // tres "astronautas" (puntos) pasan del módulo de mando al lunar
      const cmw = new THREE.Vector3(1.07, 0, 0).applyMatrix4(ship.matrixWorld);
      crew.forEach((s, i) => { const t = easeInOut(prog(lt, .9 + i * .35, 1.9 + i * .35));
        s.position.lerpVectors(cmw, lmw, t); s.position.y += Math.sin(t * Math.PI) * .4; popScale(s, t > 0 && t < 1 ? 1 : 0); });
      ring.material.color.set(lt > m2 ? (Math.sin(lt * 10) > 0 ? '#ff3a2a' : '#ffd23a') : '#ffd23a');
      earth.rotation.y = lt * .05;
    }
  };
}

// ---------- 9. Filtros: cuadrado vs redondo ----------
function filtro() {
  const { scene, camera } = baseScene({ top: '#dfe4ea', bottom: '#aeb6c2', sun: '#ffffff', sunI: 2.2, sunPos: [-3, 8, 5], shadowSize: 5 });
  scene.add(mesh(new THREE.BoxGeometry(10, .3, 6), mat('#5d6470'), { y: -.15 }));
  const grid = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#d9d9d9'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a8a8a'; g.lineWidth = 6;
    for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 32); g.lineTo(w, i * 32); g.stroke(); } });
  const sq = mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), [mat('#c9c9c9'), mat('#c9c9c9'), mat('#c9c9c9'), mat('#c9c9c9'), new THREE.MeshStandardMaterial({ map: grid }), mat('#c9c9c9')]);
  scene.add(sq);
  const hole = new THREE.Group(); hole.position.set(1.4, .7, 0); scene.add(hole);
  const tube = mesh(new THREE.CylinderGeometry(.55, .55, 1, 24, 1, true), mat('#3a7bd5', { side: THREE.DoubleSide }), { cast: true }); tube.rotation.z = Math.PI / 2; hole.add(tube);
  const flange = mesh(new THREE.TorusGeometry(.55, .1, 8, 24), mat('#2c5fa8')); flange.rotation.y = Math.PI / 2; flange.position.x = -.5; hole.add(flange);
  const lblSq = textSprite('CUADRADO', { size: 46, color: '#fff', bg: '#222', stroke: null, scale: .7 }), lblRd = textSprite('REDONDO', { size: 46, color: '#fff', bg: '#2c5fa8', stroke: null, scale: .7 });
  scene.add(lblSq); scene.add(lblRd);
  const no = textSprite('✕', { size: 160, color: '#ff3b30', stroke: '#fff', scale: 1 }); scene.add(no);
  const ok = textSprite('¡FUNCIONÓ!', { size: 60, color: '#fff', bg: '#2fb24c', stroke: null, scale: .9 }); scene.add(ok);
  // piezas del adaptador
  const card = mesh(new THREE.BoxGeometry(1.3, .04, 1.3), mat('#b98b54')), bag = mesh(new THREE.IcosahedronGeometry(.75, 1), new THREE.MeshStandardMaterial({ color: '#dff2ff', transparent: true, opacity: .45, roughness: .2, flatShading: true }));
  const tapes = [0, 1, 2].map(() => mesh(new THREE.BoxGeometry(1.35, .2, .02), mat('#8f949b')));
  [card, bag, ...tapes].forEach(o => scene.add(o));
  const labels = ['CARTÓN', 'BOLSAS', 'CINTA'].map(t => { const s = textSprite(t, { size: 44, color: '#fff', bg: 'rgba(0,0,0,.7)', stroke: null, scale: .6 }); scene.add(s); return s; });
  return {
    scene, camera,
    update(lt, info) {
      const m2 = info.marks[1] ?? info.dur * .5, L2 = info.dur - m2;
      const p = easeInOut(lt / info.dur);
      camera.position.set(lerp(-.5, .4, p), lerp(3.2, 2.8, p), lerp(7.2, 6.2, p)); camera.lookAt(.3, .6, 0);
      popScale(lblSq, easeBack(prog(lt, m2 * .45, m2 * .45 + .3))); popScale(lblRd, easeBack(prog(lt, m2 * .7, m2 * .7 + .3)));
      // intento de encajar: va, choca, rebota (varias veces)
      let x = -1.4;
      if (lt < m2) { const t = Math.max(0, lt - .6); const cyc = (t % 1.1) / 1.1; x = -1.4 + Math.sin(Math.min(cyc, .5) * Math.PI) * .75 * (t > 0 ? 1 : 0); }
      sq.position.set(x, .6, 0); sq.rotation.set(0, 0, lt < m2 ? Math.sin(lt * 7) * .04 : 0);
      lblSq.position.set(sq.position.x, 1.65, 0); lblRd.position.set(1.4, 1.65, 0);
      popScale(no, lt < m2 ? easeBack(prog(lt, 1.1, 1.4)) * (Math.sin(lt * 6) > -.3 ? 1 : .9) : 0); no.position.set(.35, 1.1, .8);
      // segunda línea: llegan las piezas y envuelven el cubo
      const lt2 = lt - m2;
      const fly = (o, i, target) => { const t = easeOut(prog(lt2, .4 + i * .7, 1.0 + i * .7)); o.visible = lt2 > .4 + i * .7;
        o.position.set(lerp(target.x - 3, target.x, t), lerp(target.y + 3, target.y, t), target.z); o.rotation.set((1 - t) * 4, (1 - t) * 3, 0); return t; };
      const base = new THREE.Vector3(.2, .6, 0);
      if (lt >= m2) sq.position.copy(base);
      const t1 = fly(card, 0, new THREE.Vector3(.2, 1.23, 0)), t2 = fly(bag, 1, new THREE.Vector3(.8, .65, 0));
      bag.scale.set(1, .85, .85);
      tapes.forEach((tp, i) => { fly(tp, 2 + i * .25, new THREE.Vector3(.5, .3 + i * .3, .63)); });
      labels.forEach((l, i) => { popScale(l, lt2 > 0 ? easeBack(prog(lt2, .55 + i * .7, .85 + i * .7)) * (1 - prog(lt2, 2.9, 3.1)) : 0); l.position.set(-1.6, 2.2 - i * .45, .5); });
      popScale(lblSq, lt >= m2 ? 0 : lblSq.scale.x / lblSq.userData.base.x); popScale(lblRd, lt >= m2 ? 0 : lblRd.scale.x / lblRd.userData.base.x);
      const fin = easeBack(prog(lt2, L2 - 1.3, L2 - 1.0)); popScale(ok, lt >= m2 ? fin : 0); ok.position.set(.5, 2.1, .5);
      void t1; void t2;
    }
  };
}

// ---------- 10. Alrededor de la Luna ----------
function luna() {
  const { scene, camera } = spaceScene(15, '#0a0a1a');
  const moon = planet(moonTex(), 4, 4); scene.add(moon);
  const earth = planet(earthTex(), .9, 3); earth.position.set(-9, 6, -30); scene.add(earth);
  const ship = makeApollo(); ship.scale.setScalar(.35); scene.add(ship);
  const path = new THREE.EllipseCurve(0, 0, 5.4, 5.4, 0, Math.PI * 2);
  const pts = path.getPoints(100).map(p => new THREE.Vector3(p.x, 0, p.y));
  const trail = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: '#ffd23a', dashSize: .25, gapSize: .2 }));
  trail.computeLineDistances(); trail.rotation.x = .25; scene.add(trail);
  return {
    scene, camera,
    update(lt, info) {
      const p = lt / info.dur;
      moon.rotation.y = lt * .08;
      const a = lerp(Math.PI * .85, Math.PI * 2.25, easeInOut(p));
      const pos = new THREE.Vector3(Math.cos(a) * 5.4, 0, Math.sin(a) * 5.4).applyAxisAngle(new THREE.Vector3(1, 0, 0), .25);
      const nxt = new THREE.Vector3(Math.cos(a + .05) * 5.4, 0, Math.sin(a + .05) * 5.4).applyAxisAngle(new THREE.Vector3(1, 0, 0), .25);
      ship.position.copy(pos); ship.lookAt(nxt); ship.rotateY(-Math.PI / 2);
      camera.position.set(0, lerp(7, 5, p), lerp(17, 14, easeInOut(p))); camera.lookAt(0, -.5, 0);
    }
  };
}

// ---------- 11. Reentrada ----------
function reentrada() {
  const { scene, camera } = baseScene({ top: '#0b0f2a', mid: '#3a2a6a', bottom: '#ff8a4a', sun: '#ffe8d0', sunI: 1.6, sunPos: [3, 6, 5] });
  const cap = new THREE.Group(); scene.add(cap);
  cap.add(mesh(new THREE.ConeGeometry(.9, 1.3, 18), mat('#d8d4cc', { metalness: .3, roughness: .5 }), { y: .65 }));
  const shieldMat = mat('#6b3b22', { emissive: '#ff6a00', emissiveIntensity: 0 });
  cap.add(mesh(new THREE.SphereGeometry(.95, 18, 6, 0, Math.PI * 2, Math.PI * .72, Math.PI * .28), shieldMat, { y: .62 }));
  cap.rotation.set(.6, 0, -.5);
  const heat = new THREE.PointLight('#ff7a20', 0, 10); heat.position.set(0, -.6, 0); cap.add(heat);
  const plasma = []; const r = rng(19);
  for (let i = 0; i < 80; i++) { const p = mesh(new THREE.IcosahedronGeometry(.06 + r() * .1, 0), mat(r() < .5 ? '#ffb347' : '#ff5a1f', { emissive: '#ff6a00', emissiveIntensity: 2, transparent: true }), { cast: false });
    p.userData = { o: r(), x: (r() - .5) * 1.4, z: (r() - .5) * 1.4 }; scene.add(p); plasma.push(p); }
  const clouds = []; for (let i = 0; i < 14; i++) { const c = puff('#ffe6d6'); c.material.transparent = true; c.material.opacity = .45; c.userData = { x: (r() < .5 ? -1 : 1) * (2.2 + r() * 3), o: r(), s: .4 + r() * .7 }; scene.add(c); clouds.push(c); }
  return {
    scene, camera,
    update(lt, info) {
      const glow = clamp(lt / 1.2) * (1 - prog(lt, info.dur - 1.2, info.dur) * .7);
      shieldMat.emissiveIntensity = glow * (2 + Math.sin(lt * 25) * .4); heat.intensity = glow * 40;
      const sh = .05 * glow;
      camera.position.set(Math.sin(lt * 61) * sh, 1.4 + Math.cos(lt * 53) * sh, 6); camera.lookAt(0, .3, 0);
      cap.position.y = .2 + Math.sin(lt * 3) * .05;
      const dirv = new THREE.Vector3(0, -1, 0).applyEuler(cap.rotation);
      plasma.forEach(p => { const u = p.userData, ph = (lt * 1.8 + u.o) % 1;
        p.visible = glow > .05; p.position.set(-dirv.x * ph * 4 + u.x * (.3 + ph), -dirv.y * ph * 4 + .2, u.z * (.3 + ph) - dirv.z * ph * 4);
        p.material.opacity = (1 - ph) * glow; p.scale.setScalar(1 - ph * .6); });
      clouds.forEach(c => { const u = c.userData, ph = (lt * .5 + u.o) % 1; c.position.set(u.x, 6 - ph * 14, -4 - u.o * 4); c.scale.setScalar(u.s); });
    },
    draw2d(ctx, lt, info) { // estática de radio
      const a = .1 + .06 * Math.sin(lt * 13); ctx.fillStyle = `rgba(255,255,255,${a * .4})`;
      const r = rng((lt * 30) | 0); for (let i = 0; i < 260; i++) ctx.fillRect(r() * W, r() * H, 2 + r() * 3, 1);
    }
  };
}

// ---------- 12. Amerizaje ----------
function amerizaje() {
  const { scene, camera } = baseScene({ top: '#5f9be0', bottom: '#d6ecff', fog: '#cfe3f5', fogNear: 20, fogFar: 90, sun: '#fffaf0', sunPos: [-5, 10, 6], shadowSize: 8 });
  const sea = new THREE.PlaneGeometry(200, 200, 60, 60);
  const seaMesh = mesh(sea, mat('#2f78c4', { roughness: .4 }), { cast: false, rx: -Math.PI / 2 }); scene.add(seaMesh);
  const base = sea.attributes.position.array.slice();
  const cap = new THREE.Group(); scene.add(cap);
  cap.add(mesh(new THREE.ConeGeometry(.6, .85, 16), mat('#d8d4cc', { metalness: .3 }), { y: .42 }));
  cap.add(mesh(new THREE.CylinderGeometry(.6, .6, .12, 16), mat('#6b3b22'), { y: 0 }));
  const chutes = []; const stripe = stripeTex(['#e8463a', '#f5f5f5'], 8, false);
  for (let i = 0; i < 3; i++) { const g = new THREE.Group(); cap.add(g);
    const dome = mesh(new THREE.SphereGeometry(1.3, 16, 8, 0, Math.PI * 2, 0, Math.PI * .45), new THREE.MeshStandardMaterial({ map: stripe, side: THREE.DoubleSide, roughness: .8 }), { y: 4 });
    g.add(dome); g.rotation.set(0, i * 2.1, .35);
    const lines = new THREE.Group(); g.add(lines);
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, top = new THREE.Vector3(Math.cos(a) * 1.25, 4.3, Math.sin(a) * 1.25);
      lines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, .85, 0), top]), new THREE.LineBasicMaterial({ color: '#555' }))); }
    chutes.push(g); }
  const splash = []; const r = rng(29);
  for (let i = 0; i < 40; i++) { const s = mesh(new THREE.IcosahedronGeometry(.08 + r() * .08, 0), mat('#ffffff', { transparent: true }), { cast: false }); s.userData = { v: new THREE.Vector3((r() - .5) * 3, 2 + r() * 3, (r() - .5) * 3) }; scene.add(s); splash.push(s); }
  const ship = new THREE.Group(); ship.position.set(-14, 0, -22); scene.add(ship);
  ship.add(mesh(new THREE.BoxGeometry(9, 1.2, 2), mat('#6f7781'), { y: .4 }));
  ship.add(mesh(new THREE.BoxGeometry(2.5, 2, 1.6), mat('#8b939d'), { x: 1, y: 2 }));
  return {
    scene, camera,
    update(lt, info) {
      const pos = sea.attributes.position;
      for (let i = 0; i < pos.count; i++) { const x = base[i * 3], y = base[i * 3 + 1]; pos.setZ(i, Math.sin(x * .35 + lt * 1.6) * .18 + Math.cos(y * .4 + lt * 1.1) * .15); }
      pos.needsUpdate = true; sea.computeVertexNormals();
      const land = info.dur * .6;
      const dy = lt < land ? lerp(9, 0, easeOut(lt / land) * .4 + (lt / land) * .6) : Math.sin((lt - land) * 2.2) * .1;
      cap.position.set(0, dy, 0); cap.rotation.z = lt < land ? Math.sin(lt * 1.5) * .06 : Math.sin(lt * 1.8) * .08;
      const open = easeBack(prog(lt, .2, 1));
      chutes.forEach((c, i) => { c.scale.set(open, open, open); c.visible = lt < land + .25; c.children[0].rotation.y = Math.sin(lt * 2 + i) * .2; });
      const st = lt - land;
      splash.forEach(s => { s.visible = st > 0 && st < 1.4; if (st > 0) { s.position.copy(s.userData.v).multiplyScalar(st); s.position.y -= 4.9 * st * st; s.material.opacity = 1 - st / 1.4; } });
      camera.position.set(3.5, lerp(5, 1.6, easeInOut(lt / land)), lerp(10, 7.5, easeInOut(lt / info.dur)));
      camera.lookAt(0, Math.max(.3, dy * .8 + 1), 0);
    }
  };
}

// ---------- 13. Cierre ----------
function cierre() {
  const { scene, camera } = spaceScene(16);
  const earth = planet(earthTex(), 3.2); earth.position.set(0, -4.6, -3); scene.add(earth);
  const atm = new THREE.Mesh(new THREE.SphereGeometry(3.35, 32, 20), new THREE.MeshBasicMaterial({ color: '#7fb6ff', transparent: true, opacity: .2, side: THREE.BackSide })); earth.add(atm);
  const ship = makeApollo(); ship.scale.setScalar(.45); scene.add(ship);
  return {
    scene, camera,
    update(lt, info) {
      earth.rotation.y = lt * .1;
      ship.position.set(lerp(-1.8, 1.8, lt / info.dur), -.35 + Math.sin(lt) * .05, 0); ship.rotation.set(.2, -.3, .1);
      camera.position.set(0, 0, 9); camera.lookAt(0, .1, 0);
    },
    draw2d(ctx, lt, info) {
      const a = easeOut(prog(lt, .4, 1.1));
      ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '900 128px Montserrat'; ctx.lineJoin = 'round';
      const y = 300 + (1 - a) * 30;
      ctx.lineWidth = 14; ctx.strokeStyle = '#000'; ctx.strokeText('APOLO 13', W / 2, y);
      const gr = ctx.createLinearGradient(0, y - 60, 0, y + 60); gr.addColorStop(0, '#fff3c4'); gr.addColorStop(1, '#f0a83a');
      ctx.fillStyle = gr; ctx.fillText('APOLO 13', W / 2, y);
      ctx.font = '800 34px Montserrat'; ctx.letterSpacing = '6px'; ctx.fillStyle = '#fff';
      ctx.fillText('HISTORIA REAL · 1970', W / 2 + 3, y + 92); ctx.fillStyle = '#ffd23a'; ctx.fillText('PELÍCULA · 1995', W / 2 + 3, y + 140); ctx.letterSpacing = '0px';
      const b = easeBack(prog(lt, info.dur * .5, info.dur * .5 + .4));
      if (b > 0) { ctx.globalAlpha = 1; ctx.translate(W / 2, 1150); ctx.scale(b, b);
        ctx.fillStyle = '#ffe41a'; roundRect(ctx, -270, -40, 540, 80, 40); ctx.fill();
        ctx.fillStyle = '#111'; ctx.font = '900 32px Montserrat'; ctx.fillText('SÍGUEME PARA MÁS HISTORIAS', 0, 2); }
      ctx.restore();
    }
  };
}

export const SCENES = {
  lanzamiento, espacio, explosion, cabina: () => cabina('alarma'), modulo, frio: () => cabina('frio'),
  filtro, luna, reentrada, amerizaje, cierre
};
