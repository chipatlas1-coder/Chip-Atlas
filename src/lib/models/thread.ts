/**
 * ISO metric bolt thread M10 × 1.5 in 3D, a quarter cut away. The surface is the external
 * thread's design profile swept along a right-hand helix: crest flat P/8 at d, 60° flanks,
 * rounded root reaching d3 = d − 1.226869 P (root radius H/6). The cut faces carry the pitch
 * diameter d2 = d − 0.649519 P and the minor diameter d3, the pitch P and the 60° angle.
 */
import { makeStage, canvasTexture, makeLabeler } from './stage';

export function mountThread(host: HTMLElement, canvas: HTMLCanvasElement, labels: Record<string, HTMLElement>) {
  const S = makeStage(host, canvas, { fov: 28, pos: [26, 12, 30], target: [0, 0, 0], minDist: 12, maxDist: 90 });
  const { THREE, scene } = S;
  const d = 10, P = 1.5, H = (Math.sqrt(3) / 2) * P;
  const d2 = d - 0.649519 * P, d3 = d - 1.226869 * P;
  const L = 10 * P;
  const rr = H / 6, cr = P / 8, t30 = Math.tan(Math.PI / 6);
  // depth below the major radius at axial position u (crest centre at u = 0)
  const depth = (u: number) => {
    const a = Math.abs((((u + P / 2) % P) + P) % P - P / 2);
    let z = Math.max(0, (a - cr / 2) / t30);
    const b = P / 2 - a, cz = (7 * H) / 8 - 2 * rr, xt = rr * Math.cos(Math.PI / 6);
    if (b <= xt) z = cz + Math.sqrt(Math.max(0, rr * rr - b * b));
    return Math.min(z, (7 * H) / 8);
  };
  const rad = (th: number, y: number) => d / 2 - depth(y - (P * th) / (2 * Math.PI));
  const th0 = 0, th1 = 1.5 * Math.PI;           // a quarter is cut away
  const NT = 216, NY = Math.round((L / P) * 64);

  // ---- helical surface ----
  const posArr: number[] = [], idx: number[] = [];
  for (let j = 0; j <= NY; j++) {
    const y = (L * j) / NY;
    for (let i = 0; i <= NT; i++) {
      const th = th0 + ((th1 - th0) * i) / NT, r = rad(th, y);
      posArr.push(r * Math.cos(th), y - L / 2, -r * Math.sin(th));
    }
  }
  const row = NT + 1;
  for (let j = 0; j < NY; j++) for (let i = 0; i < NT; i++) {
    const a = j * row + i, b = a + 1, c = a + row, e = c + 1;
    idx.push(a, c, b, b, c, e);
  }
  const surf = new THREE.BufferGeometry();
  surf.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
  surf.setIndex(idx); surf.computeVertexNormals();
  const steel = new THREE.MeshStandardMaterial({ color: 0xb4bbc1, metalness: 0.92, roughness: 0.32, side: THREE.DoubleSide });
  const bolt = new THREE.Group();
  bolt.add(new THREE.Mesh(surf, steel));

  // ---- cut faces at th0 and th1 (profile from the axis to the thread) ----
  const hatch = canvasTexture(256, 256, (g) => {
    g.fillStyle = '#dde3e8'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = 'rgba(110,122,134,0.6)'; g.lineWidth = 3;
    for (let k = -256; k < 512; k += 22) { g.beginPath(); g.moveTo(k, 256); g.lineTo(k + 256, 0); g.stroke(); }
  });
  hatch.wrapS = hatch.wrapT = THREE.RepeatWrapping;
  const cutMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: hatch, metalness: 0.2, roughness: 0.8, envMapIntensity: 0.4, side: THREE.DoubleSide });
  const face = (th: number) => {
    const pts: [number, number][] = [[0, 0]];
    for (let j = 0; j <= NY; j++) { const y = (L * j) / NY; pts.push([rad(th, y), y]); }
    pts.push([0, L]);
    const sh = new THREE.Shape(pts.map(([u, v]) => new THREE.Vector2(u, v)));
    const g = new THREE.ShapeGeometry(sh, 1);
    const p = g.attributes.position as THREE.BufferAttribute, uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i), v = p.getY(i);
      uv.setXY(i, u / 2.2, v / 2.2);
      p.setXYZ(i, u * Math.cos(th), v - L / 2, -u * Math.sin(th));
    }
    g.computeVertexNormals();
    return new THREE.Mesh(g, cutMat);
  };
  bolt.add(face(th0), face(th1));
  // ---- end caps ----
  const cap = (y: number, flip: boolean) => {
    const pts: number[] = [0, y - L / 2, 0];
    for (let i = 0; i <= NT; i++) { const th = th0 + ((th1 - th0) * i) / NT, r = rad(th, y); pts.push(r * Math.cos(th), y - L / 2, -r * Math.sin(th)); }
    const ix: number[] = [];
    for (let i = 1; i <= NT; i++) flip ? ix.push(0, i + 1, i) : ix.push(0, i, i + 1);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); g.setIndex(ix); g.computeVertexNormals();
    return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x9aa3aa, metalness: 0.85, roughness: 0.45, side: THREE.DoubleSide }));
  };
  bolt.add(cap(0, false), cap(L, true));

  // ---- diameter lines, pitch and 60° on the face at th0 (the x–y plane, z = 0) ----
  const off = 0.02;
  const lineOn = (r: number, color: number, dashed = false) => {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(r, -L / 2 - 0.4, off), new THREE.Vector3(r, L / 2 + 0.4, off)]);
    const m = dashed ? new THREE.LineDashedMaterial({ color, dashSize: 0.22, gapSize: 0.14 }) : new THREE.LineBasicMaterial({ color });
    const l = new THREE.Line(g, m); if (dashed) l.computeLineDistances(); return l;
  };
  bolt.add(lineOn(d / 2, 0x152230, true), lineOn(d2 / 2, 0x7a4fd0, true), lineOn(d3 / 2, 0x2a78d6, true));
  // axis
  const axis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -L / 2 - 1.2, off), new THREE.Vector3(0, L / 2 + 1.2, off)]), new THREE.LineDashedMaterial({ color: 0x656e74, dashSize: 0.6, gapSize: 0.2 }));
  axis.computeLineDistances(); bolt.add(axis);
  // crest centres on the face th0: depth(y) = 0 at y = kP → pick the pitch between y = 2P and 3P
  const yA = 4 * P - L / 2, yB = 5 * P - L / 2, rP = d / 2 + 0.55;
  const pitchLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(rP, yA, off), new THREE.Vector3(rP, yB, off)]), new THREE.LineBasicMaterial({ color: 0xe2601a }));
  const tick = (y: number) => new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(d / 2 + 0.1, y, off), new THREE.Vector3(rP + 0.25, y, off)]), new THREE.LineBasicMaterial({ color: 0xe2601a }));
  bolt.add(pitchLine, tick(yA), tick(yB));
  // 60°: the two flanks of the groove centred at y = 3.5P meet at the sharp root, 7H/8 below d
  const yG = 6.5 * P - L / 2, vx = d / 2 - (7 * H) / 8;
  const flankTop = (s: number) => new THREE.Vector3(d / 2 + 0.35, yG + s * ((7 * H) / 8 + 0.35) * t30, off);
  const flankPts = (s: number) => [new THREE.Vector3(vx, yG, off), flankTop(s)];
  const flankMat = new THREE.LineDashedMaterial({ color: 0xe2601a, dashSize: 0.16, gapSize: 0.1 });
  for (const s of [-1, 1]) { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(flankPts(s)), flankMat); l.computeLineDistances(); bolt.add(l); }
  const arc: THREE.Vector3[] = [];
  for (let k = 0; k <= 24; k++) { const a = -Math.PI / 6 + (Math.PI / 3) * (k / 24); arc.push(new THREE.Vector3(vx + 0.7 * Math.cos(a), yG + 0.7 * Math.sin(a), off)); }
  bolt.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(arc), new THREE.LineBasicMaterial({ color: 0xe2601a })));

  // the bolt lies along x
  bolt.rotation.z = -Math.PI / 2;
  scene.add(bolt);

  const anchors: Record<string, InstanceType<typeof THREE.Vector3>> = {
    d: new THREE.Vector3(d / 2, L / 2 + 0.4, off),
    d2: new THREE.Vector3(d2 / 2, L / 2 + 0.4, off),
    d3: new THREE.Vector3(d3 / 2, L / 2 + 0.4, off),
    P: new THREE.Vector3(rP, (yA + yB) / 2, off),
    ang: new THREE.Vector3(vx + 0.75, yG, off),
  };
  const labeler = makeLabeler(host, labels);
  function yGx() { return 6.5 * P - L / 2 + 0.6; }
  const views: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
    all: { pos: [26, 12, 30], target: [0, -0.5, 0] },
    section: { pos: [0, -3.2, 34], target: [0, -3.2, 0] },
    flank: { pos: [yGx(), -4.6, 12], target: [yGx(), -4.4, 0] },
  };
  let spin = !S.reduce, rotTarget: number | null = null;
  const turn = new THREE.Group(); scene.remove(bolt); turn.add(bolt); scene.add(turn);
  S.controls.addEventListener('start', () => { spin = false; });
  S.onFrame((dt) => {
    if (spin) turn.rotation.x += dt * 0.25;
    let settling = false;
    if (rotTarget !== null) {
      const dd = rotTarget - turn.rotation.x;
      if (Math.abs(dd) < 1e-3) { turn.rotation.x = rotTarget; rotTarget = null; } else { turn.rotation.x += dd * Math.min(1, dt * 6); settling = true; }
    }
    turn.updateMatrixWorld();
    labeler(S.camera, anchors, bolt.matrixWorld);
    return spin || settling;
  });
  return {
    show(v: string) {
      spin = false;
      rotTarget = Math.round(turn.rotation.x / (2 * Math.PI)) * 2 * Math.PI;
      S.flyTo(views[v].pos, views[v].target);
    },
    dispose: S.dispose,
  };
}
