// Personajes estilizados v2: formas redondeadas, sombreado suave y cara expresiva.
// Misma interfaz que makePerson de escenas.js: userData = { legs, arms, head, hairMat }.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const smooth = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: .72, metalness: 0, ...o });
function m(geo, material, x = 0, y = 0, z = 0, { cast = true, recv = true } = {}) {
  const o = new THREE.Mesh(geo, material); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = recv; return o;
}
const cap = (r, len) => new THREE.CapsuleGeometry(r, len, 6, 12);
const rbox = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 4, r);

export function makeCharacter({ shirt = '#3d4356', pants = '#2c3140', skin = '#e2b48c', hair = '#2a211b', shoes = '#2a2522',
  hairStyle = 'short', beard = false, female = false } = {}) {
  const g = new THREE.Group();
  const mSkin = smooth(skin, { roughness: .6 }), mShirt = smooth(shirt), mPants = smooth(pants), mShoe = smooth(shoes, { roughness: .5 });
  const mHair = smooth(hair, { roughness: .55 });
  const legs = [], arms = [];
  for (const sx of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(sx * .1, .92, 0);
    p.add(m(cap(.082, .62), mPants, 0, -.42, 0));
    p.add(m(rbox(.15, .1, .29, .04), mShoe, 0, -.86, .045));
    g.add(p); legs.push(p);
  }
  g.add(m(rbox(.36, .2, .23, .07), mPants, 0, .96, 0));
  g.add(m(rbox(.37, .04, .235, .015), smooth('#1d1b1a'), 0, 1.05, 0, { cast: false }));
  const torso = m(rbox(female ? .38 : .44, .54, .25, .1), mShirt, 0, 1.31, 0); g.add(torso);
  for (const sx of [-1, 1]) {
    const p = new THREE.Group(); p.position.set(sx * .265, 1.5, 0);
    p.add(m(cap(.062, .44), mShirt, 0, -.27, 0));
    p.add(m(new THREE.SphereGeometry(.062, 12, 10), mSkin, 0, -.57, .01));
    p.rotation.z = sx * .06;
    g.add(p); arms.push(p);
  }
  g.add(m(new THREE.CylinderGeometry(.055, .065, .12, 12), mSkin, 0, 1.6, 0));
  // cabeza
  const head = new THREE.Group(); head.position.y = 1.79; g.add(head);
  const skull = m(new THREE.SphereGeometry(.15, 24, 18), mSkin); skull.scale.set(.95, 1.12, 1.02); head.add(skull);
  const jaw = m(new THREE.SphereGeometry(.1, 16, 12), mSkin, 0, -.07, .035); jaw.scale.set(1, .9, 1); head.add(jaw);
  for (const sx of [-1, 1]) {
    const ear = m(new THREE.SphereGeometry(.035, 10, 8), mSkin, sx * .142, 0, 0); ear.scale.set(.6, 1, .8); head.add(ear);
    head.add(m(new THREE.SphereGeometry(.026, 12, 10), smooth('#fbfaf6', { roughness: .3 }), sx * .053, .02, .128, { cast: false }));
    head.add(m(new THREE.SphereGeometry(.015, 10, 8), smooth('#1a1512', { roughness: .2 }), sx * .053, .02, .149, { cast: false }));
    const brow = m(rbox(.055, .012, .015, .005), smooth(hair), sx * .055, .062, .135, { cast: false }); brow.rotation.z = sx * -.12; head.add(brow);
  }
  const nose = m(new THREE.SphereGeometry(.022, 10, 8), mSkin, 0, -.02, .152, { cast: false }); nose.scale.set(1, 1.2, 1); head.add(nose);
  head.add(m(rbox(.05, .012, .01, .005), smooth('#8a4a40'), 0, -.075, .132, { cast: false }));
  // pelo
  const top = m(new THREE.SphereGeometry(.158, 22, 14, 0, Math.PI * 2, 0, Math.PI * (hairStyle === 'bald' ? .18 : .5)), mHair, 0, .015, -.008);
  top.scale.set(.98, 1.14, 1.05); top.rotation.x = -.22; head.add(top);
  if (hairStyle !== 'bald') { const back = m(new THREE.SphereGeometry(.15, 18, 12, 0, Math.PI * 2, Math.PI * .45, Math.PI * .25), mHair, 0, 0, -.02); back.scale.set(.98, 1.12, 1.03); back.rotation.x = .5; head.add(back); }
  if (hairStyle === 'long') { const l = m(rbox(.27, .3, .1, .05), mHair, 0, -.1, -.1); head.add(l); }
  if (beard) { const mb = smooth(hair, { roughness: .8, transparent: true, opacity: .55 }); const b = m(new THREE.SphereGeometry(.103, 16, 10, -Math.PI * .1, Math.PI * 1.2, Math.PI * .62, Math.PI * .3), mb, 0, -.06, .04, { cast: false }); b.scale.set(1.02, 1, 1.05); head.add(b); }
  g.userData = { legs, arms, head, hairMat: mHair, torso };
  return g;
}

// Minero: casco con lámpara, chaleco reflectante
export function makeMinerV2(r, { lamp = true, skin, hair } = {}) {
  const SK = ['#e8bc96', '#d6a07a', '#b97f58', '#e0ad86', '#9c6a48'];
  const HR = ['#211a15', '#3a2a1c', '#4a3b30', '#151210', '#7b7570'];
  const p = makeCharacter({ shirt: r() < .5 ? '#5b6b8c' : '#6d7482', pants: '#44506a', skin: skin || SK[(r() * SK.length) | 0],
    hair: hair || HR[(r() * HR.length) | 0], beard: r() < .3, hairStyle: r() < .15 ? 'bald' : 'short' });
  const vestCol = r() < .7 ? '#ef6a2a' : '#d9c23f';
  p.add(m(rbox(.47, .42, .275, .09), smooth(vestCol, { roughness: .6 }), 0, 1.33, 0));
  const refl = smooth('#eef0f2', { emissive: '#c8c8c8', emissiveIntensity: .35, roughness: .3 });
  for (const y of [1.22, 1.4]) p.add(m(rbox(.475, .035, .28, .012), refl, 0, y, 0, { cast: false }));
  const head = p.userData.head;
  const hc = r() < .82 ? '#f4c430' : '#f2f2ee';
  const helmet = m(new THREE.SphereGeometry(.172, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), smooth(hc, { roughness: .35 }), 0, .05, 0);
  helmet.scale.set(1, 1.05, 1.08); head.add(helmet);
  head.add(m(new THREE.CylinderGeometry(.2, .2, .018, 28), smooth(hc, { roughness: .35 }), 0, .05, .02));
  head.add(m(rbox(.04, .03, .02, .008), smooth('#ccc'), 0, .17, .16, { cast: false }));
  if (lamp) {
    const l = m(new THREE.CylinderGeometry(.034, .034, .04, 16), new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff4c8', emissiveIntensity: 3.5 }), 0, .14, .175, { cast: false });
    l.rotation.x = Math.PI / 2; head.add(l);
  }
  return p;
}

export function walk2(p, phase, amt = 1) {
  const s = Math.sin(phase) * .5 * amt;
  p.userData.legs[0].rotation.x = s; p.userData.legs[1].rotation.x = -s;
  p.userData.arms[0].rotation.x = -s * .7; p.userData.arms[1].rotation.x = s * .7;
}
