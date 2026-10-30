/**
 * A worn turning insert in 3D: 80° rhombic negative insert (IC 12.7 mm, s 4.76 mm, rε 0.8 mm,
 * central hole) with the three wear types the article measures or names on the edge: flank wear
 * land on the main flank, crater on the rake face behind the edge, notch at the depth-of-cut line.
 * Wear sizes are exaggerated for visibility; positions follow the article's description.
 */
import { makeStage, canvasTexture, makeLabeler } from './stage';

export type Zone = 'all' | 'flank' | 'crater' | 'notch';

export function mountInsert(host: HTMLElement, canvas: HTMLCanvasElement, labels: Record<string, HTMLElement>) {
  const S = makeStage(host, canvas, { fov: 28, pos: [19.5, 13.8, 19.5], target: [5.5, 0.8, 2.5], minDist: 10, maxDist: 80 });
  const { THREE, scene } = S;

  // ---- outline of the insert in shape coordinates (x, y); world z = −y ----
  const l = 12.7 / Math.sin((80 * Math.PI) / 180);
  const ax = l * Math.cos((40 * Math.PI) / 180), oy = l * Math.sin((40 * Math.PI) / 180);
  const V: [number, number][] = [[ax, 0], [0, oy], [-ax, 0], [0, -oy]];
  const r = 0.8, thick = 4.76, hole = 2.58;
  const rounded = (pts: [number, number][], rad: number, steps = 10) => {
    const out: [number, number][] = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], a = pts[(i + pts.length - 1) % pts.length], b = pts[(i + 1) % pts.length];
      const ua = [a[0] - p[0], a[1] - p[1]], ub = [b[0] - p[0], b[1] - p[1]];
      const la = Math.hypot(ua[0], ua[1]), lb = Math.hypot(ub[0], ub[1]);
      ua[0] /= la; ua[1] /= la; ub[0] /= lb; ub[1] /= lb;
      const th = Math.acos(ua[0] * ub[0] + ua[1] * ub[1]);
      const dt = rad / Math.tan(th / 2), dc = rad / Math.sin(th / 2);
      const bis = [ua[0] + ub[0], ua[1] + ub[1]], lbis = Math.hypot(bis[0], bis[1]);
      const c = [p[0] + (bis[0] / lbis) * dc, p[1] + (bis[1] / lbis) * dc];
      const t1 = [p[0] + ua[0] * dt, p[1] + ua[1] * dt], t2 = [p[0] + ub[0] * dt, p[1] + ub[1] * dt];
      let a1 = Math.atan2(t1[1] - c[1], t1[0] - c[0]), a2 = Math.atan2(t2[1] - c[1], t2[0] - c[0]);
      let d = a2 - a1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      for (let k = 0; k <= steps; k++) { const ang = a1 + (d * k) / steps; out.push([c[0] + rad * Math.cos(ang), c[1] + rad * Math.sin(ang)]); }
    }
    return out;
  };
  const outline = rounded(V, r);
  const shape = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  const holePath = new THREE.Path(); holePath.absarc(0, 0, hole, 0, Math.PI * 2, true);
  shape.holes.push(holePath);

  const coat = new THREE.MeshStandardMaterial({ color: 0x41484e, metalness: 0.55, roughness: 0.5, envMapIntensity: 0.6 });
  const invisible = new THREE.MeshBasicMaterial({ visible: false });
  const body = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, curveSegments: 48 });
  body.rotateX(-Math.PI / 2); body.translate(0, -thick / 2, 0);
  // caps (group 0) hidden: the top is a displaced grid, the bottom a flat shape below
  const insert = new THREE.Group();
  insert.add(new THREE.Mesh(body, [invisible, coat]));
  const bottom = new THREE.ShapeGeometry(shape, 48); bottom.rotateX(-Math.PI / 2); bottom.translate(0, -thick / 2, 0);
  insert.add(new THREE.Mesh(bottom, new THREE.MeshStandardMaterial({ color: 0x41484e, metalness: 0.55, roughness: 0.42, side: THREE.BackSide })));

  // ---- main cutting edge: from the +X corner towards (0, +oy) in world (x, z) ----
  const C = new THREE.Vector2(ax, 0);
  const e = new THREE.Vector2(-ax, oy).normalize();          // along the edge (world x, z)
  const nOut = new THREE.Vector2(e.y, -e.x);                  // outward normal of that edge
  if (nOut.x * (ax / 2) + nOut.y * (oy / 2) < 0) nOut.multiplyScalar(-1);
  const ap = 3.4;                                             // depth-of-cut line along the edge (mm from the corner)
  const tn = (x: number, z: number) => { const d = new THREE.Vector2(x - C.x, z - C.y); return { t: d.dot(e), n: -d.dot(nOut) }; };

  // ---- rake face: displaced grid masked to the insert outline ----
  const W = 21.2, H = 17.4, NX = 300, NZ = 250;
  const grid = new THREE.PlaneGeometry(W, H, NX, NZ);
  grid.rotateX(-Math.PI / 2);
  const pos = grid.attributes.position as THREE.BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  const base = new THREE.Color(0x5b646c), crat = new THREE.Color(0x2a221d), rim = new THREE.Color(0xe2601a), notchC = new THREE.Color(0x6a5a50);
  const cr = { t0: 2.0, n0: 1.05, at: 1.05, an: 0.5, d: 0.22 };
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const { t, n } = tn(x, z);
    const qc = Math.exp(-(((t - cr.t0) / cr.at) ** 4) - (((n - cr.n0) / cr.an) ** 4));
    const qn = Math.exp(-(((t - ap) / 0.22) ** 2) - ((n / 0.42) ** 2));
    const y = thick / 2 - cr.d * qc - 0.34 * qn;
    pos.setY(i, y);
    tmp.copy(base);
    tmp.lerp(crat, Math.min(1, qc * 1.4));
    const ring = Math.exp(-(((qc - 0.18) / 0.1) ** 2));          // a thin orange ring at the crater rim
    tmp.lerp(rim, 0.55 * ring);
    tmp.lerp(notchC, Math.min(1, qn * 1.6));
    tmp.lerp(rim, 0.5 * Math.exp(-(((qn - 0.2) / 0.1) ** 2)));
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
  }
  grid.setAttribute('color', new THREE.BufferAttribute(col, 3));
  grid.computeVertexNormals();
  const mask = canvasTexture(1024, 840, (g) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, 1024, 840);
    const px = (x: number) => ((x + W / 2) / W) * 1024, py = (yShape: number) => ((-yShape + H / 2) / H) * 840;
    g.fillStyle = '#fff'; g.beginPath();
    outline.forEach(([x, y], i) => (i ? g.lineTo(px(x), py(y)) : g.moveTo(px(x), py(y))));
    g.closePath(); g.fill();
    g.fillStyle = '#000'; g.beginPath(); g.arc(px(0), py(0), (hole / W) * 1024, 0, Math.PI * 2); g.fill();
  });
  mask.colorSpace = THREE.NoColorSpace;
  const rake = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, metalness: 0.5, roughness: 0.52, envMapIntensity: 0.55, alphaMap: mask, alphaTest: 0.5, side: THREE.DoubleSide });
  insert.add(new THREE.Mesh(grid, rake));

  // ---- flank wear land on the main flank (a polished strip just outside the flank plane) ----
  const vb = (t: number) => 0.42 + 0.05 * Math.sin(t * 7.3) + 0.03 * Math.sin(t * 17.1 + 1) + 0.55 * Math.exp(-(((t - ap) / 0.22) ** 2));
  const t0 = r / Math.tan((40 * Math.PI) / 180), t1 = ap + 0.45, NS = 120;
  const landPos: number[] = [], landIdx: number[] = [], lower: number[] = [];
  for (let k = 0; k <= NS; k++) {
    const t = t0 + ((t1 - t0) * k) / NS;
    const p = C.clone().addScaledVector(e, t).addScaledVector(nOut, 0.012);
    const h = Math.min(vb(t), 1.4);
    landPos.push(p.x, thick / 2 - 0.004, p.y, p.x, thick / 2 - h, p.y);
    lower.push(p.x + nOut.x * 0.004, thick / 2 - h, p.y + nOut.y * 0.004);
    if (k < NS) { const a = 2 * k; landIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const landGeo = new THREE.BufferGeometry();
  landGeo.setAttribute('position', new THREE.Float32BufferAttribute(landPos, 3));
  landGeo.setIndex(landIdx); landGeo.computeVertexNormals();
  const polished = new THREE.MeshStandardMaterial({ color: 0xe3e7ea, metalness: 1, roughness: 0.16, side: THREE.DoubleSide });
  const land = new THREE.Mesh(landGeo, polished);
  insert.add(land);
  const lowerLine = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(lower, 3)), new THREE.LineBasicMaterial({ color: 0xe2601a }));
  insert.add(lowerLine);
  // depth-of-cut line on the flank, dashed
  const docA = C.clone().addScaledVector(e, ap).addScaledVector(nOut, 0.02);
  const docLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(docA.x, thick / 2 + 0.6, docA.y), new THREE.Vector3(docA.x, -thick / 2, docA.y)]), new THREE.LineDashedMaterial({ color: 0x2a78d6, dashSize: 0.25, gapSize: 0.18 }));
  docLine.computeLineDistances();
  insert.add(docLine);

  scene.add(insert);

  // ---- anchors for the HTML labels ----
  const anchor = (t: number, n: number, y: number) => { const p = C.clone().addScaledVector(e, t).addScaledVector(nOut, -n); return new THREE.Vector3(p.x, y, p.y); };
  const anchors: Record<string, THREE.Vector3> = {
    flank: (() => { const p = C.clone().addScaledVector(e, 1.8).addScaledVector(nOut, 0.05); return new THREE.Vector3(p.x, thick / 2 - 0.45, p.y); })(),
    crater: anchor(cr.t0, cr.n0, thick / 2 - cr.d),
    notch: anchor(ap, 0, thick / 2 - 0.3),
    doc: new THREE.Vector3(docA.x, -thick / 2 + 0.9, docA.y),
  };
  const labeler = makeLabeler(host, labels);
  let focus: Zone = 'all';
  const shown = (): Record<string, THREE.Vector3> => (focus === 'all' ? anchors : Object.fromEntries(Object.entries(anchors).filter(([k]) => k === focus || (focus === 'notch' && k === 'doc'))));
  const placeLabels = () => labeler(S.camera, shown(), insert.matrixWorld);

  // ---- views ----
  const views: Record<Zone, { pos: [number, number, number]; target: [number, number, number] }> = {
    all: { pos: [19.5, 13.8, 19.5], target: [5.5, 0.8, 2.5] },
    flank: (() => { const tg = C.clone().addScaledVector(e, 2.0); return { pos: [tg.x + nOut.x * 19, 8.5, tg.y + nOut.y * 19] as [number, number, number], target: [tg.x, thick / 2 - 0.8, tg.y] as [number, number, number] }; })(),
    crater: (() => { const tg = C.clone().addScaledVector(e, cr.t0).addScaledVector(nOut, -cr.n0); return { pos: [tg.x + nOut.x * 6, 15, tg.y + nOut.y * 6] as [number, number, number], target: [tg.x, thick / 2, tg.y] as [number, number, number] }; })(),
    notch: (() => { const tg = C.clone().addScaledVector(e, ap); return { pos: [tg.x + nOut.x * 9 + e.x * 2, 7.5, tg.y + nOut.y * 9 + e.y * 2] as [number, number, number], target: [tg.x, thick / 2 - 0.3, tg.y] as [number, number, number] }; })(),
  };
  let spin = !S.reduce;
  let rotTarget: number | null = null;
  S.controls.addEventListener('start', () => { spin = false; });
  S.onFrame((dt) => {
    if (spin) insert.rotation.y += dt * 0.12;
    let settling = false;
    if (rotTarget !== null) {
      const d = rotTarget - insert.rotation.y;
      if (Math.abs(d) < 1e-3) { insert.rotation.y = rotTarget; rotTarget = null; }
      else { insert.rotation.y += d * Math.min(1, dt * 6); settling = true; }
    }
    insert.updateMatrixWorld();
    placeLabels();
    return spin || settling;
  });
  return {
    show(z: Zone) {
      spin = false;
      focus = z;
      const k = Math.round(insert.rotation.y / (2 * Math.PI));
      rotTarget = k * 2 * Math.PI;
      S.flyTo(views[z].pos, views[z].target);
    },
    dispose: S.dispose,
  };
}
