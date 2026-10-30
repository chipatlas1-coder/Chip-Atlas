/**
 * A spiral-flute machine tap, M10 × 1.5, cutting a thread in a blind hole of a block cut open by a
 * quarter. The tap's surface is a radial height field r(y, θ): the thread profile of the ISO bolt
 * thread (crest flat P/8, 60° flanks, rounded root, as in thread.ts) swept along a right-hand helix,
 * limited by the chamfer cone (form C, 2.5 threads), the thread run-out at the neck, and three
 * right-hand helical flutes (helix 40°). The tap screws in one pitch per turn, clockwise seen from
 * above, then backs out; the internal thread appears behind the chamfer as it advances (two
 * clipping planes). Units mm; the hole axis is y, the block top at y = 0.
 */
import { makeStage, canvasTexture, makeLabeler } from './stage';

export function mountTap(host: HTMLElement, canvas: HTMLCanvasElement, labels: Record<string, HTMLElement>) {
  const S = makeStage(host, canvas, { fov: 30, pos: [94, 45, 110], target: [0, 7, 0], minDist: 20, maxDist: 300 });
  const { THREE, scene, renderer } = S;
  renderer.localClippingEnabled = true;
  const TAU = Math.PI * 2;
  const d = 10, R = d / 2, P = 1.5, H = (Math.sqrt(3) / 2) * P;
  const rr = H / 6, cr = P / 8, t30 = Math.tan(Math.PI / 6);
  // depth below the major radius at axial position u (crest centre at u = 0), as thread.ts
  const depth = (u: number) => {
    const a = Math.abs((((u + P / 2) % P) + P) % P - P / 2);
    let z = Math.max(0, (a - cr / 2) / t30);
    const b = P / 2 - a, cz = (7 * H) / 8 - 2 * rr, xt = rr * Math.cos(Math.PI / 6);
    if (b <= xt) z = cz + Math.sqrt(Math.max(0, rr * rr - b * b));
    return Math.min(z, (7 * H) / 8);
  };
  const rRoot = R - (7 * H) / 8 + 0;                    // ≈ 4.08, d3/2
  const Lt = 22, yc = 2.5 * P, r0 = 4.0;                // thread length, chamfer length (form C), radius at the tip
  const rShank = 3.5, yNeck = Lt + 1.2, yShank = Lt + 5, yTop = 44, ySq = 51, sq = 2.75;
  const NF = 3, w = (64 * Math.PI) / 180, Rc = 2.3, phi0 = 0.4;
  const Lf = (TAU * R) / Math.tan((40 * Math.PI) / 180);
  const flutes = (y: number, th: number) => {
    let g = Infinity;
    const fade = y > Lt ? Math.min(1, (y - Lt) / 4.5) : 0;            // the flutes run out into the neck
    const rc = Rc + (3.8 - Rc) * fade * fade * (3 - 2 * fade);
    for (let k = 0; k < NF; k++) {
      let dl = ((th - (phi0 + (TAU * y) / Lf + (k * TAU) / NF)) % TAU + TAU) % TAU; if (dl > Math.PI) dl -= TAU;
      if (Math.abs(dl) < w / 2) g = Math.min(g, rc + (R + 0.3 - rc) * Math.pow(Math.abs(dl) / (w / 2), 1.8));
    }
    return g;
  };
  // tap radius in the tap's own frame (tip at y = 0)
  const tapR = (y: number, th: number) => {
    let r = y <= Lt ? R - depth(y - (P * th) / TAU) : Infinity;
    if (y < yc) r = Math.min(r, r0 + ((R - r0) * y) / yc);
    if (y > Lt - P && y <= Lt) r = Math.min(r, R - ((R - rRoot) * (y - (Lt - P))) / P);
    if (y > Lt) r = Math.min(r, y < yNeck ? rRoot + ((rShank - rRoot) * (y - Lt)) / (yNeck - Lt) : rShank);
    return Math.max(0.5, Math.min(r, flutes(y, th)));
  };

  // ---------- the tap ----------
  const steel = new THREE.MeshStandardMaterial({ color: 0xc8cdd2, metalness: 1, roughness: 0.26 });
  const tap = new THREE.Group();
  {
    const NT = 360, NY = Math.round(yShank / (P / 28));
    const pos: number[] = [], idx: number[] = [];
    for (let j = 0; j <= NY; j++) {
      const y = (yShank * j) / NY;
      for (let i = 0; i <= NT; i++) { const th = (TAU * i) / NT, r = tapR(y, th); pos.push(r * Math.cos(th), y, -r * Math.sin(th)); }
    }
    const row = NT + 1;
    for (let j = 0; j < NY; j++) for (let i = 0; i < NT; i++) { const a = j * row + i, b = a + 1, c = a + row, e = c + 1; idx.push(a, b, c, b, e, c); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    tap.add(new THREE.Mesh(g, steel));
    // the fluted end face
    const ep: number[] = [0, 0, 0], ei: number[] = [];
    for (let i = 0; i <= NT; i++) { const th = (TAU * i) / NT, r = tapR(0, th); ep.push(r * Math.cos(th), 0, -r * Math.sin(th)); }
    for (let i = 1; i <= NT; i++) ei.push(0, i + 1, i);
    const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.Float32BufferAttribute(ep, 3)); eg.setIndex(ei); eg.computeVertexNormals();
    tap.add(new THREE.Mesh(eg, new THREE.MeshStandardMaterial({ color: 0xaab2b8, metalness: 0.9, roughness: 0.4 })));
    // shank and square drive
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(rShank, rShank, yTop - yShank, 72, 1, true), steel);
    sh.position.y = (yShank + yTop) / 2; tap.add(sh);
    const c = Math.sqrt(rShank * rShank - sq * sq);
    const oct = new THREE.Shape([[sq, c], [c, sq], [-c, sq], [-sq, c], [-sq, -c], [-c, -sq], [c, -sq], [sq, -c]].map(([x, z]) => new THREE.Vector2(x, z)));
    const sqg = new THREE.ExtrudeGeometry(oct, { depth: ySq - yTop, bevelEnabled: false });
    sqg.rotateX(-Math.PI / 2); sqg.translate(0, yTop, 0);
    tap.add(new THREE.Mesh(sqg, new THREE.MeshStandardMaterial({ color: 0xb9c0c6, metalness: 1, roughness: 0.34, flatShading: true })));
    const ring = new THREE.Mesh(new THREE.RingGeometry(0, rShank, 72), steel); ring.rotation.x = Math.PI / 2; ring.position.y = yTop; tap.add(ring);
  }
  const holder = new THREE.Group(); holder.add(tap); scene.add(holder);

  // ---------- the block, a quarter cut away (θ from 270° to 360° removed) ----------
  const B = 16, Hb = 30, rDrill = 4.25, hHole = 26, tip = rDrill / Math.tan((59 * Math.PI) / 180);
  const tipDepth = 19.5, yStart = 4, travel = tipDepth + yStart;   // the tip runs from +4 above the top to −19.5
  // Screw motion: turned by a = −2π·s·travel/P while the tip goes down s·travel, the tap's thread stays
  // where it is relative to the block: in block coordinates its crests satisfy y − yStart − P·θ/2π = kP.
  // The internal thread is that envelope (plus a small clearance), down to the chamfer at the deepest tip.
  const nutR = (y: number, th: number) => {
    const yt = y + tipDepth;                             // height above the tip at its deepest position
    if (yt < 0) return rDrill;
    let r = R - depth(y - yStart - (P * th) / TAU);
    if (yt < yc) r = Math.min(r, r0 + ((R - r0) * yt) / yc);
    return Math.max(rDrill, r + 0.03);
  };
  const hatch = canvasTexture(256, 256, (g) => {
    g.fillStyle = '#dde3e8'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = 'rgba(110,122,134,0.6)'; g.lineWidth = 3;
    for (let k = -256; k < 512; k += 32) { g.beginPath(); g.moveTo(k, 256); g.lineTo(k + 256, 0); g.stroke(); }
  });
  hatch.wrapS = hatch.wrapT = THREE.RepeatWrapping;
  const front = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);     // keeps y ≥ −c: the cut thread
  const behind = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);   // keeps y ≤ −c: the plain drilled hole
  const cutMat = (clip?: THREE.Plane) => new THREE.MeshStandardMaterial({ color: 0xd8dde1, map: hatch, metalness: 0.15, roughness: 0.85, envMapIntensity: 0.3, side: THREE.DoubleSide, clippingPlanes: clip ? [clip] : [] });
  const wallMat = (clip?: THREE.Plane) => new THREE.MeshStandardMaterial({ color: 0x9aa3aa, metalness: 0.8, roughness: 0.38, envMapIntensity: 0.8, side: THREE.DoubleSide, clippingPlanes: clip ? [clip] : [] });
  const block = new THREE.Group();
  const yLo = -Hb;
  // hole walls over θ ∈ [0, 270°]: threaded (clipped to y ≥ front) and plain (clipped to y ≤ front)
  const wall = (rad: (y: number, th: number) => number, y0: number, y1: number, mat: THREE.Material) => {
    const NT = 180, NY = Math.round((y1 - y0) / (P / 20));
    const pos: number[] = [], idx: number[] = [];
    for (let j = 0; j <= NY; j++) { const y = y0 + ((y1 - y0) * j) / NY; for (let i = 0; i <= NT; i++) { const th = (1.5 * Math.PI * i) / NT, r = rad(y, th); pos.push(r * Math.cos(th), y, -r * Math.sin(th)); } }
    const row = NT + 1;
    for (let j = 0; j < NY; j++) for (let i = 0; i < NT; i++) { const a = j * row + i, b = a + 1, c = a + row, e = c + 1; idx.push(a, c, b, b, c, e); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return new THREE.Mesh(g, mat);
  };
  block.add(wall(nutR, -tipDepth, 0, wallMat(front)));
  block.add(wall(() => rDrill, -hHole, 0, wallMat(behind)));
  // drill point
  {
    const NT = 120, pos: number[] = [0, -hHole - tip, 0], idx: number[] = [];
    for (let i = 0; i <= NT; i++) { const th = (1.5 * Math.PI * i) / NT; pos.push(rDrill * Math.cos(th), -hHole, -rDrill * Math.sin(th)); }
    for (let i = 1; i <= NT; i++) idx.push(0, i, i + 1);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    block.add(new THREE.Mesh(g, wallMat()));
  }
  // cut faces at θ = 0 (plane z = 0, x > 0) and θ = 270° (plane x = 0, z > 0): the hole edge follows the wall
  const section = (th: number, rad: (y: number) => number, clip?: THREE.Plane, plainBelow = true) => {
    const pts: [number, number][] = [[B, 0], [B, yLo], [0, yLo], [0, -hHole - tip], [rDrill, -hHole]];
    const NY = 400;
    for (let j = 0; j <= NY; j++) { const y = -hHole + (hHole * j) / NY; pts.push([plainBelow ? rad(y) : rDrill, y]); }
    const shp = new THREE.Shape(pts.map(([u, v]) => new THREE.Vector2(u, v)));
    const g = new THREE.ShapeGeometry(shp, 1);
    const p = g.attributes.position as THREE.BufferAttribute, uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const u = p.getX(i), v = p.getY(i); uv.setXY(i, u / 9, v / 9); p.setXYZ(i, u * Math.cos(th), v, -u * Math.sin(th)); }
    g.computeVertexNormals();
    return new THREE.Mesh(g, cutMat(clip));
  };
  for (const th of [0, 1.5 * Math.PI]) {
    block.add(section(th, (y) => (y >= -tipDepth ? nutR(y, th) : rDrill), front));
    block.add(section(th, () => rDrill, behind, false));
  }
  // outer faces: top with the hole, bottom, and the four outer walls of the L
  const skin = new THREE.MeshStandardMaterial({ color: 0xa3adb5, metalness: 0.3, roughness: 0.62, envMapIntensity: 0.5, side: THREE.DoubleSide });
  {
    const NT = 90, outline: [number, number][] = [[B, 0], [B, B], [-B, B], [-B, -B], [0, -B], [0, -rDrill]];
    for (let i = NT; i >= 0; i--) { const th = (1.5 * Math.PI * i) / NT; outline.push([rDrill * Math.cos(th), rDrill * Math.sin(th)]); }
    // shape in (x, −z): top face at y = 0
    const shp = new THREE.Shape(outline.map(([x, nz]) => new THREE.Vector2(x, nz)));
    const g = new THREE.ShapeGeometry(shp, 1); g.rotateX(-Math.PI / 2);
    block.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xb4bcc3, metalness: 0.4, roughness: 0.5, envMapIntensity: 0.55, side: THREE.DoubleSide })));
    const bot = new THREE.Shape([[B, 0], [B, B], [-B, B], [-B, -B], [0, -B], [0, 0]].map(([x, nz]) => new THREE.Vector2(x, nz)));
    const bg = new THREE.ShapeGeometry(bot); bg.rotateX(-Math.PI / 2); bg.translate(0, yLo, 0);
    block.add(new THREE.Mesh(bg, skin));
    const quad = (a: number[], b: number[]) => {
      const g2 = new THREE.BufferGeometry();
      g2.setAttribute('position', new THREE.Float32BufferAttribute([a[0], 0, a[1], b[0], 0, b[1], b[0], yLo, b[1], a[0], yLo, a[1]], 3));
      g2.setIndex([0, 1, 2, 0, 2, 3]); g2.computeVertexNormals();
      return new THREE.Mesh(g2, skin);
    };
    // outer walls in (x, z): the L runs (B,0)→(B,−B)→(−B,−B)→(−B,B)→(0,B)
    block.add(quad([B, 0], [B, -B]), quad([B, -B], [-B, -B]), quad([-B, -B], [-B, B]), quad([-B, B], [0, B]));
  }
  scene.add(block);

  // ---------- motion: screw in, dwell, back out ----------
  const turns = travel / P;
  const Tin = 4.2, Tdwell = 0.6, Tout = 2.6, Tpark = 1.2, Tcyc = Tin + Tdwell + Tout + Tpark;
  let t = 0, cycle = -1, mode: 'cycle' | 'park-out' | 'park-mid' = 'cycle', cutTo = 0, spinA = 0;
  const ease = (u: number) => u * u * (3 - 2 * u);
  const place = (dt: number) => {
    let s = 0;
    if (mode === 'park-mid') s = 0.42;
    else if (mode === 'cycle') {
      const k = Math.floor(t / Tcyc), u = t - k * Tcyc;
      if (k !== cycle) { cycle = k; cutTo = 0; }        // a fresh hole for each cycle
      if (u < Tin) s = ease(u / Tin);
      else if (u < Tin + Tdwell) s = 1;
      else if (u < Tin + Tdwell + Tout) s = 1 - ease((u - Tin - Tdwell) / Tout);
    }
    const tipY = yStart - s * travel;
    holder.position.y = tipY;
    if (mode === 'park-out') { spinA -= dt * 0.5; tap.rotation.y = spinA; }
    else tap.rotation.y = -TAU * turns * s;             // clockwise seen from above while it goes down
    // the thread is complete from half the chamfer up; it stays cut while the tap backs out
    const frontY = Math.min(0, tipY + yc * 0.5);
    cutTo = mode === 'cycle' ? Math.min(cutTo, frontY) : mode === 'park-mid' ? -tipDepth + yc * 0.5 : 0;   // in the hole: backing out, the thread cut
    front.constant = -cutTo; behind.constant = cutTo;
  };
  // labels: anchors that follow the tap's height but not its turning, on the side facing the camera
  const labeler = makeLabeler(host, labels);
  const side = new THREE.Vector3(0.62, 0, 0.78);
  // the cutting edge turns with the tap: the leading wall of a flute at the chamfer (turning clockwise
  // seen from above, θ decreases, so the edge is the flute's high-θ wall); shown while it faces the camera
  const edgeLocal = (() => {
    const y = yc * 0.8, th = phi0 + (TAU * y) / Lf + w * 0.42, r = tapR(y, th - 0.02);
    return { p: new THREE.Vector3(r * Math.cos(th), y, -r * Math.sin(th)), th };
  })();
  const tmp = new THREE.Vector3(), nrm = new THREE.Vector3();
  const anchors = (): Record<string, InstanceType<typeof THREE.Vector3>> => {
    const y = holder.position.y;
    const on = (yy: number, r: number) => new THREE.Vector3(side.x * r, y + yy, side.z * r);
    const out: Record<string, InstanceType<typeof THREE.Vector3>> = { drill: new THREE.Vector3(0.6, -hHole - tip * 0.5, -0.6) };
    if (y > -0.5) out.chamfer = on(yc * 0.45, r0 + 0.4);           // hidden once the tip is in the hole
    if (y + 12 > 0.5) out.flute = on(Math.max(12, -y + 3), R - 1.2);
    if (cutTo < y - 4 && cutTo < -9) out.thread = new THREE.Vector3(-3.25, Math.min(y - 3, Math.max(cutTo + 2.5, -16.5)), -3.25);
    tmp.copy(edgeLocal.p).applyMatrix4(tap.matrixWorld);
    const a = edgeLocal.th + tap.rotation.y;
    nrm.set(Math.cos(a), 0, -Math.sin(a));
    if (nrm.dot(S.camera.position.clone().sub(tmp)) > 0 && y > -2) out.edge = tmp.clone();
    return out;
  };
  const views: Record<string, { pos: [number, number, number]; target: [number, number, number]; mode: typeof mode }> = {
    all: { pos: [94, 45, 110], target: [0, 7, 0], mode: 'cycle' },
    tap: { pos: [44, 26, 52], target: [0, 15, 0], mode: 'park-out' },
    section: { pos: [46, 2, 54], target: [0, -10, 0], mode: 'park-mid' },
  };
  let playing = !S.reduce;
  if (S.reduce) mode = 'park-mid';
  S.onFrame((dt) => {
    if (playing && mode === 'cycle') t += dt;
    place(dt);
    holder.updateMatrixWorld();
    labeler(S.camera, anchors());
    return playing && mode !== 'park-mid';
  });
  return {
    show(v: string) {
      const vw = views[v] ?? views.all;
      mode = S.reduce && vw.mode !== 'park-out' ? 'park-mid' : vw.mode;
      if (mode === 'cycle') { t = 0; cycle = -1; }
      S.flyTo(vw.pos, vw.target);
      S.invalidate();
    },
    dispose: S.dispose,
  };
}
