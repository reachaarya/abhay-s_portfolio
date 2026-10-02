import * as THREE from 'three';

// Built by `npm run compress:eagle` from Eagle/Eagle.gltf.
const MODEL_URL = '/models/eagle.glb';

// Tweak these if the eagle flies backwards or upside down once the real model is in.
export const EAGLE = {
  flipForward: false, // true if the eagle flies tail-first
  wingspan: 0.24,     // fraction of screen width the wingspan covers at mid-depth
  flapSpeed: 15,      // wing beats (radians per second)
  flapAmount: 0.55,   // how far the wing tips travel
  tiltToCamera: 0.55, // radians: tilts the back toward the viewer so the spread wings read well
};

/* ------------------------------------------------------------------ */
/* Loading + normalising                                               */
/* ------------------------------------------------------------------ */

/** Resolves to a ready-to-fly THREE.Group, or null if the model can't be loaded. */
export async function loadEagle(url = MODEL_URL) {
  try {
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const gltf = await new GLTFLoader().loadAsync(url);
    return normalise(gltf.scene);
  } catch (err) {
    console.warn('Eagle model unavailable, using the drawn bird instead.', err);
    return null;
  }
}

/**
 * Bakes every mesh into one consistent space: centred, wingspan = 1 unit along X,
 * beak pointing +Z. The wing-flap shader relies on that layout.
 */
function normalise(scene) {
  scene.updateMatrixWorld(true);
  const meshes = [];
  scene.traverse((o) => o.isMesh && meshes.push(o));

  const box = new THREE.Box3();
  meshes.forEach((m) => {
    m.geometry = m.geometry.clone();
    m.geometry.applyMatrix4(m.matrixWorld);
    m.geometry.computeBoundingBox();
    box.union(m.geometry.boundingBox);
  });

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const fix = new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z);
  // wings are the widest horizontal extent: rotate them onto X if they lie along Z
  const spanAlongZ = size.z > size.x;
  if (spanAlongZ) fix.premultiply(new THREE.Matrix4().makeRotationY(Math.PI / 2));
  if (EAGLE.flipForward) fix.premultiply(new THREE.Matrix4().makeRotationY(Math.PI));
  fix.premultiply(new THREE.Matrix4().makeScale(...Array(3).fill(1 / Math.max(size.x, size.z))));

  const uniforms = { uTime: { value: 0 }, uFlap: { value: EAGLE.flapAmount } };
  const group = new THREE.Group();
  meshes.forEach((m) => {
    m.geometry.applyMatrix4(fix);
    m.geometry.computeBoundingSphere();
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    const flapping = mats.map((mat) => addWingFlap(mat.clone(), uniforms));
    const mesh = new THREE.Mesh(m.geometry, Array.isArray(m.material) ? flapping : flapping[0]);
    mesh.frustumCulled = false; // vertices move in the shader
    group.add(mesh);
  });
  group.userData.uniforms = uniforms;
  return group;
}

/** Bends the outer wing vertices up and down: a flap without needing a rigged animation. */
function addWingFlap(material, uniforms) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uFlap = uniforms.uFlap;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uFlap;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float span = clamp(abs(transformed.x) / 0.5, 0.0, 1.0);
        float wing = smoothstep(0.14, 1.0, span);
        float beat = sin(uTime - span * 0.9); // tips lag behind the shoulders
        transformed.y += beat * uFlap * wing * wing * 0.42;
        transformed.x *= 1.0 - abs(beat) * wing * 0.06; // wings fold in slightly on the stroke`
      );
  };
  material.customProgramCacheKey = () => 'eagle-flap';
  return material;
}

/* ------------------------------------------------------------------ */
/* Flight                                                              */
/* ------------------------------------------------------------------ */

// Path in screen space: u (0 = left, 1 = right), v (0 = top, 1 = bottom), depth (+ = toward camera)
const PATH = [
  [-0.18, 0.02, -7],
  [0.18, 0.3, -3],
  [0.5, 0.76, 2.5],
  [0.82, 0.42, 0],
  [1.25, -0.35, -5],
];

/**
 * Creates a full-screen transparent canvas with the eagle on it.
 * Call setProgress(0..1) to move it along the swoop; it returns the eagle's screen position.
 */
export function createEagleFlight(eagle) {
  const canvas = document.createElement('canvas');
  canvas.id = 'eagle-canvas';
  document.body.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
  const CAM_Z = 12;
  camera.position.z = CAM_Z;

  scene.add(new THREE.HemisphereLight('#fff3e6', '#4a2266', 2.2));
  const sun = new THREE.DirectionalLight('#ffffff', 2.6);
  sun.position.set(4, 8, 10);
  scene.add(sun);
  const rimPink = new THREE.DirectionalLight('#ff6fa8', 3);
  rimPink.position.set(-6, -2, -4);
  scene.add(rimPink);
  const rimSky = new THREE.DirectionalLight('#7fd3ff', 2.5);
  rimSky.position.set(6, 3, -5);
  scene.add(rimSky);

  // size the bird relative to the screen
  const aspect = window.innerWidth / window.innerHeight;
  const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
  const planeHalfH = CAM_Z * Math.tan(halfFov);
  const span = planeHalfH * 2 * aspect * EAGLE.wingspan * (aspect < 0.9 ? 1.6 : 1);
  eagle.scale.setScalar(span);
  scene.add(eagle);

  const curve = new THREE.CatmullRomCurve3(
    PATH.map(([u, v, d]) => {
      const halfH = (CAM_Z - d) * Math.tan(halfFov);
      return new THREE.Vector3((u - 0.5) * 2 * halfH * aspect, -(v - 0.5) * 2 * halfH, d);
    }),
    false,
    'centripetal'
  );

  const uniforms = eagle.userData.uniforms;
  const pos = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const ahead = new THREE.Vector3();
  const screen = new THREE.Vector3();
  let bank = 0;
  let last = performance.now();

  function setProgress(p) {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    p = THREE.MathUtils.clamp(p, 0, 1);
    curve.getPointAt(p, pos);
    curve.getTangentAt(p, tan);
    curve.getTangentAt(Math.min(1, p + 0.02), ahead);
    // screen-plane turn rate drives the bank, like a real bird leaning into a curve
    const turn = tan.x * ahead.y - tan.y * ahead.x;
    bank += (THREE.MathUtils.clamp(turn * 18, -0.9, 0.9) - bank) * 0.12;

    eagle.position.copy(pos);
    const tilt = EAGLE.tiltToCamera;
    eagle.up.set(Math.sin(bank) * Math.cos(tilt), Math.cos(bank) * Math.cos(tilt), Math.sin(tilt));
    eagle.lookAt(ahead.multiplyScalar(5).add(pos));

    // flap hard on the dive and climb, glide through the bottom of the swoop
    const glide = THREE.MathUtils.smoothstep(p, 0.3, 0.42) * (1 - THREE.MathUtils.smoothstep(p, 0.5, 0.62));
    uniforms.uTime.value += dt * EAGLE.flapSpeed * (1 - glide * 0.85);
    uniforms.uFlap.value = EAGLE.flapAmount * (1 - glide * 0.7);

    renderer.render(scene, camera);
    screen.copy(pos).project(camera);
    return { x: (screen.x + 1) / 2 * window.innerWidth, y: (1 - screen.y) / 2 * window.innerHeight };
  }

  function dispose() {
    scene.remove(eagle);
    eagle.traverse((o) => {
      if (!o.isMesh) return;
      o.geometry.dispose();
      [].concat(o.material).forEach((m) => {
        Object.values(m).forEach((v) => v?.isTexture && v.dispose());
        m.dispose();
      });
    });
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  }

  setProgress(0);
  return { setProgress, dispose };
}
