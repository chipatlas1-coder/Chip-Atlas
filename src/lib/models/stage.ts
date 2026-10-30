/**
 * Shared Three.js stage for the article models: renderer, studio lighting, orbit controls that
 * never trap page scrolling on touch screens, render-on-demand with damping, pause when off-screen,
 * and a reduced-motion flag. Each model module builds its scene on top of this.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface Stage {
  THREE: typeof THREE;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  reduce: boolean;
  /** request a frame (the loop otherwise sleeps once damping settles) */
  invalidate: () => void;
  /** per-frame callbacks; return true to keep animating */
  onFrame: (fn: (dt: number, t: number) => boolean) => void;
  /** tween the camera to a position and target */
  flyTo: (pos: [number, number, number], target: [number, number, number], ms?: number) => void;
  dispose: () => void;
}

export function makeStage(host: HTMLElement, canvas: HTMLCanvasElement, opts: { fov?: number; pos: [number, number, number]; target?: [number, number, number]; minDist?: number; maxDist?: number }): Stage {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(opts.fov ?? 30, 16 / 10, 0.1, 2000);
  // Narrow stages (phones) are taller than wide: step the camera back so the model still fits.
  const k = () => { const a = host.clientWidth / Math.max(1, host.clientHeight); return a < 1.45 ? Math.min(1.5, Math.pow(1.6 / a, 0.85)) : 1; };
  const fit = (pos: [number, number, number], target: [number, number, number]) => {
    const f = k();
    return [target[0] + (pos[0] - target[0]) * f, target[1] + (pos[1] - target[1]) * f, target[2] + (pos[2] - target[2]) * f] as [number, number, number];
  };
  camera.position.set(...fit(opts.pos, opts.target ?? [0, 0, 0]));

  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.target.set(...(opts.target ?? [0, 0, 0]));
  controls.minDistance = opts.minDist ?? 10;
  controls.maxDistance = opts.maxDist ?? 400;
  controls.zoomSpeed = 0.6;
  // Wheel zoom only while the pointer has been pressed on the canvas, so page scrolling never zooms by accident.
  controls.enableZoom = false;
  canvas.addEventListener('pointerdown', () => { controls.enableZoom = true; });
  canvas.addEventListener('pointerleave', () => { controls.enableZoom = false; });
  // Touch screens: the page must keep scrolling, so the model turns with the view buttons instead.
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (coarse) { controls.enabled = false; canvas.style.touchAction = 'pan-y'; }

  const key = new THREE.DirectionalLight(0xfff0e4, 1.6);
  key.position.set(60, 90, 70);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x1e6fd6, 1.2);
  rim.position.set(-80, 30, -70);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xe2601a, 0.35);
  fill.position.set(-40, -60, 60);
  scene.add(fill);
  scene.add(new THREE.AmbientLight(0x9aa3ab, 0.25));

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const frames: ((dt: number, t: number) => boolean)[] = [];
  let running = false, visible = true, last = 0;
  let fly: null | { p0: THREE.Vector3; p1: THREE.Vector3; t0: THREE.Vector3; t1: THREE.Vector3; start: number; ms: number } = null;

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    invalidate();
  }
  function loop(now: number) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    let more = controls.update();
    if (fly) {
      const u = Math.min(1, (now - fly.start) / fly.ms), e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      camera.position.lerpVectors(fly.p0, fly.p1, e);
      controls.target.lerpVectors(fly.t0, fly.t1, e);
      if (u >= 1) fly = null;
      more = true;
    }
    for (const fn of frames) if (fn(dt, now / 1000)) more = true;
    renderer.render(scene, camera);
    if (more && visible) requestAnimationFrame(loop);
    else running = false;
  }
  function invalidate() {
    if (running || !visible) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }
  controls.addEventListener('change', invalidate);
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  const io = new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) invalidate(); });
  io.observe(host);
  resize();

  return {
    THREE, scene, camera, renderer, controls, reduce, invalidate,
    onFrame: (fn) => { frames.push(fn); invalidate(); },
    flyTo: (pos0, target, ms = 900) => {
      const pos = fit(pos0, target);
      if (reduce) { camera.position.set(...pos); controls.target.set(...target); invalidate(); return; }
      fly = { p0: camera.position.clone(), p1: new THREE.Vector3(...pos), t0: controls.target.clone(), t1: new THREE.Vector3(...target), start: performance.now(), ms };
      invalidate();
    },
    dispose: () => { ro.disconnect(); io.disconnect(); renderer.dispose(); },
  };
}

/** Canvas texture helper (sRGB). */
export function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/**
 * Places HTML labels with SVG leader lines: the dot sits on the projected anchor, the label at a
 * fixed screen offset (data-dx, data-dy), mirrored horizontally when it would leave the stage.
 */
export function makeLabeler(host: HTMLElement, labels: Record<string, HTMLElement>) {
  const v = new THREE.Vector3();
  const lead: Record<string, SVGGElement> = {};
  host.querySelectorAll<SVGGElement>('[data-leader]').forEach((g) => (lead[g.dataset.leader!] = g));
  return (camera: THREE.Camera, anchors: Record<string, THREE.Vector3>, matrix?: THREE.Matrix4) => {
    const w = host.clientWidth, h = host.clientHeight;
    const boxes: { k: string; el: HTMLElement; g?: SVGGElement; x: number; y: number; lx: number; ly: number; lw: number; lh: number; dx: number; inside: boolean }[] = [];
    for (const [k, el] of Object.entries(labels)) {
      const a = anchors[k]; const g = lead[k];
      if (!a) { el.style.opacity = '0'; if (g) g.style.opacity = '0'; continue; }
      v.copy(a); if (matrix) v.applyMatrix4(matrix); v.project(camera);
      const x = ((v.x + 1) / 2) * w, y = ((1 - v.y) / 2) * h;
      const inside = v.z < 1 && x > -20 && x < w + 20 && y > -20 && y < h + 20;
      let dx = Number(el.dataset.dx || 0); const dy = Number(el.dataset.dy || 0);
      const lw = el.offsetWidth, lh = el.offsetHeight;
      if (x + dx + lw > w - 6 && dx > 0) dx = -dx - lw;
      if (x + dx < 6 && dx < 0) dx = Math.abs(dx);
      const lx = Math.max(6, Math.min(w - lw - 6, x + dx)), ly = Math.max(6, Math.min(h - lh - 6, y + dy - lh / 2));
      boxes.push({ k, el, g, x, y, lx, ly, lw, lh, dx, inside });
    }
    // push overlapping labels apart vertically
    boxes.sort((p, q) => p.ly - q.ly);
    for (let i = 1; i < boxes.length; i++) for (let j = 0; j < i; j++) {
      const p = boxes[j], q = boxes[i];
      if (!p.inside || !q.inside) continue;
      const overlapX = q.lx < p.lx + p.lw + 4 && p.lx < q.lx + q.lw + 4;
      if (overlapX && q.ly < p.ly + p.lh + 4) q.ly = p.ly + p.lh + 4;
    }
    for (const b of boxes) {
      b.el.style.transform = `translate(${b.lx}px, ${b.ly}px)`;
      b.el.style.opacity = b.inside ? '' : '0';
      if (b.g) {
        const line = b.g.querySelector('line')!, dot = b.g.querySelector('circle')!;
        const ex = b.lx + (b.lx + b.lw / 2 >= b.x ? 0 : b.lw), ey = b.ly + b.lh / 2;
        line.setAttribute('x1', String(b.x)); line.setAttribute('y1', String(b.y)); line.setAttribute('x2', String(ex)); line.setAttribute('y2', String(ey));
        dot.setAttribute('cx', String(b.x)); dot.setAttribute('cy', String(b.y));
        b.g.style.opacity = b.inside ? '' : '0';
      }
    }
  };
}
