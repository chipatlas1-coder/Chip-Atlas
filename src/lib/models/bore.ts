/**
 * A honed bore in 3D, cut in half, with the crosshatch on its wall. The two families of scratches
 * run at α/2 either side of the circumferential direction (article: tan(α/2) = va/vc, α the
 * included angle). The texture is drawn on the developed wall, so the angle on the model is the
 * geometric angle. Groove spacing and depth are illustrative.
 */
import { makeStage, makeLabeler } from './stage';

export function mountBore(host: HTMLElement, canvas: HTMLCanvasElement, labels: Record<string, HTMLElement>) {
  const S = makeStage(host, canvas, { fov: 30, pos: [62, 74, 158], target: [0, -2, -14], minDist: 30, maxDist: 300 });
  const { THREE, scene } = S;
  const R = 40, Ro = 47, L = 70, arc = Math.PI * R;
  const PX = 18;                                   // texture pixels per mm
  const cw = Math.round(arc * PX), ch = Math.round(L * PX);
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const g = c.getContext('2d')!;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  let alpha = 50;
  const draw = () => {
    seed = 7;
    const grad = g.createLinearGradient(0, 0, cw, ch);
    grad.addColorStop(0, '#c9cfd4'); grad.addColorStop(1, '#aeb6bc');
    g.fillStyle = grad; g.fillRect(0, 0, cw, ch);
    const b = ((alpha / 2) * Math.PI) / 180;
    const families = [b, -b];
    for (const ang of families) {
      const dx = Math.cos(ang), dy = Math.sin(ang);       // direction in (u, v) mm
      const nx = -dy, ny = dx;                             // normal
      const span = Math.abs(nx) * arc + Math.abs(ny) * L;
      for (let s = -span; s < span; s += 0.22 + rnd() * 0.5) {
        const deep = rnd() < 0.1;
        const w = (deep ? 0.14 + rnd() * 0.1 : 0.03 + rnd() * 0.04) * PX;
        g.strokeStyle = deep ? `rgba(34,40,46,${0.6 + rnd() * 0.3})` : `rgba(80,88,96,${0.18 + rnd() * 0.22})`;
        g.lineWidth = w;
        const cx = arc / 2 + nx * s, cy = L / 2 + ny * s, far = arc + L;
        g.beginPath();
        g.moveTo((cx - dx * far) * PX, ch - (cy - dy * far) * PX);
        g.lineTo((cx + dx * far) * PX, ch - (cy + dy * far) * PX);
        g.stroke();
      }
    }
    // the two marked scratches through the centre of the wall
    g.lineWidth = 0.3 * PX; g.strokeStyle = '#f04e00';
    for (const ang of families) {
      const dx = Math.cos(ang), dy = Math.sin(ang), far = 14;
      g.beginPath(); g.moveTo((arc / 2 - dx * far) * PX, ch - (L / 2 - dy * far) * PX); g.lineTo((arc / 2 + dx * far) * PX, ch - (L / 2 + dy * far) * PX); g.stroke();
    }
    tex.needsUpdate = true;
  };
  draw();

  const tube = new THREE.Group();
  const inner = new THREE.CylinderGeometry(R, R, L, 160, 1, true, Math.PI / 2, Math.PI);
  const innerMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex, metalness: 0.55, roughness: 0.5, envMapIntensity: 0.45, side: THREE.BackSide });
  tube.add(new THREE.Mesh(inner, innerMat));
  const outer = new THREE.CylinderGeometry(Ro, Ro, L, 160, 1, true, Math.PI / 2, Math.PI);
  tube.add(new THREE.Mesh(outer, new THREE.MeshStandardMaterial({ color: 0x59626a, metalness: 0.6, roughness: 0.6 })));
  // cut faces and end rings
  const cutMat = new THREE.MeshStandardMaterial({ color: 0x8a939a, metalness: 0.4, roughness: 0.7, side: THREE.DoubleSide });
  for (const th of [Math.PI / 2, (3 * Math.PI) / 2]) {
    const x = Math.sin(th), z = Math.cos(th);
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(R * x, -L / 2, R * z), new THREE.Vector3(Ro * x, -L / 2, Ro * z), new THREE.Vector3(Ro * x, L / 2, Ro * z),
      new THREE.Vector3(R * x, -L / 2, R * z), new THREE.Vector3(Ro * x, L / 2, Ro * z), new THREE.Vector3(R * x, L / 2, R * z),
    ]);
    geo.computeVertexNormals();
    tube.add(new THREE.Mesh(geo, cutMat));
  }
  for (const y of [-L / 2, L / 2]) {
    const ring = new THREE.RingGeometry(R, Ro, 160, 1, Math.PI, Math.PI);
    ring.rotateX(Math.PI / 2); ring.translate(0, y, 0);
    tube.add(new THREE.Mesh(ring, cutMat));
  }
  // axis vertical, as an engine cylinder stands
  scene.add(tube);

  // label anchor: the centre of the wall (inner surface at θ = π, i.e. the back of the half-tube)
  const anchors = { ang: new THREE.Vector3(0, 0, -R + 0.2) };
  const labeler = makeLabeler(host, labels);
  const lab = labels.ang;
  const tr = host.closest<HTMLElement>('[data-locale]')?.dataset.locale === 'tr';
  const setLabel = () => { const q = Math.tan((alpha / 2) * Math.PI / 180).toFixed(2); if (lab) lab.textContent = `α = ${alpha}° · va/vc = ${tr ? q.replace('.', ',') : q}`; };
  setLabel();
  const views: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
    all: { pos: [62, 74, 158], target: [0, -2, -14] },
    wall: { pos: [0, 0, 20], target: [0, 0, -R] },
  };
  S.onFrame(() => { tube.updateMatrixWorld(); labeler(S.camera, anchors); return false; });
  return {
    show(v: string) { S.flyTo(views[v].pos, views[v].target); },
    setAngle(a: number) { alpha = a; draw(); setLabel(); S.invalidate(); },
    dispose: S.dispose,
  };
}
