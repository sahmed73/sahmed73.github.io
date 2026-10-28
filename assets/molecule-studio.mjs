// Studio renderer: draws the 3Dmol scene again with three.js physically based materials,
// adjustable lights, shadows, and ambient occlusion. 3Dmol still handles loading, picking,
// and mouse rotation; each render copies its camera so both views match exactly.
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {drawLabelCanvas} from './molecule-labels.mjs';
import {lightDirection} from './molecule-scene.mjs';

const toneMappings = {
  neutral: THREE.NeutralToneMapping,
  agx: THREE.AgXToneMapping,
  aces: THREE.ACESFilmicToneMapping,
  none: THREE.NoToneMapping,
};

export function createStudio(container) {
  const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const canvas = renderer.domElement;
  canvas.className = 'molecule-studio-canvas';
  container.append(canvas);

  const scene = new THREE.Scene();
  const labelScene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const cameras = {perspective: new THREE.PerspectiveCamera(), orthographic: new THREE.OrthographicCamera()};
  for (const camera of Object.values(cameras)) scene.add(camera);
  const rotation = new THREE.Group();
  const model = new THREE.Group();
  rotation.add(model);
  scene.add(rotation);
  const labelRotation = new THREE.Group();
  const labelModel = new THREE.Group();
  labelRotation.add(labelModel);
  labelScene.add(labelRotation);

  // Lights live in camera space, like 3Dmol's, so they stay fixed while the molecule turns.
  const rig = new THREE.Group();
  const target = new THREE.Object3D();
  const key = new THREE.DirectionalLight();
  const fill = new THREE.DirectionalLight();
  const rim = new THREE.DirectionalLight();
  const ambient = new THREE.HemisphereLight(0xffffff, 0x40444c);
  ambient.position.set(0, 1, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  for (const light of [key, fill, rim]) light.target = target;
  // A backdrop facing the camera, behind the molecule, catches its drop shadow (a floor would be seen edge-on).
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({opacity: 0.4, fog: false}));
  backdrop.receiveShadow = true;
  rig.add(target, key, fill, rim, ambient, backdrop);

  const material = new THREE.MeshPhysicalMaterial({color: 0xffffff});
  const outlineMaterial = new THREE.MeshBasicMaterial({color: 0x000000, side: THREE.BackSide});
  const sphereGeometry = new THREE.SphereGeometry(1, 64, 32);
  const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 48, 1);
  const up = new THREE.Vector3(0, 1, 0);
  let geometry = {spheres: [], cylinders: []};
  let bounds = {center: new THREE.Vector3(), radius: 1};
  let surfacePoints = [];
  let settings = null;
  let composer = null;
  let composerKey = '';
  let labels = [];

  function instanced(items, shape, mat, place, outline = 0) {
    const mesh = new THREE.InstancedMesh(shape, mat, items.length);
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();
    items.forEach((item, index) => {
      mesh.setMatrixAt(index, place(item, outline, matrix));
      if (!outline) mesh.setColorAt(index, color.set(item.color));
    });
    mesh.castShadow = !outline;
    mesh.receiveShadow = !outline;
    return mesh;
  }

  const placeSphere = (item, outline, matrix) => matrix.compose(
    new THREE.Vector3(...item.center), new THREE.Quaternion(), new THREE.Vector3().setScalar(item.radius + outline));

  function placeCylinder(item, outline, matrix) {
    const start = new THREE.Vector3(...item.start);
    const end = new THREE.Vector3(...item.end);
    const direction = end.clone().sub(start);
    const length = direction.length() || 1e-6;
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction.divideScalar(length));
    return matrix.compose(start.add(end).multiplyScalar(0.5), quaternion, new THREE.Vector3(item.radius + outline, length, item.radius + outline));
  }

  function rebuild() {
    for (const child of [...model.children]) {
      model.remove(child);
      child.dispose?.();
    }
    if (!settings) return;
    const outline = settings.outline.enabled ? settings.outline.width : 0;
    if (geometry.spheres.length) model.add(instanced(geometry.spheres, sphereGeometry, material, placeSphere));
    if (geometry.cylinders.length) model.add(instanced(geometry.cylinders, cylinderGeometry, material, placeCylinder));
    if (outline) {
      if (geometry.spheres.length) model.add(instanced(geometry.spheres, sphereGeometry, outlineMaterial, placeSphere, outline));
      if (geometry.cylinders.length) model.add(instanced(geometry.cylinders, cylinderGeometry, outlineMaterial, placeCylinder, outline));
    }
    const box = new THREE.Box3();
    for (const sphere of geometry.spheres) box.union(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(...sphere.center), new THREE.Vector3().setScalar(2 * sphere.radius)));
    for (const cylinder of geometry.cylinders) box.expandByPoint(new THREE.Vector3(...cylinder.start)).expandByPoint(new THREE.Vector3(...cylinder.end));
    if (box.isEmpty()) box.set(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1));
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    bounds = {center: sphere.center, radius: Math.max(sphere.radius, 1)};
    surfacePoints = geometry.spheres.map(item => ({center: new THREE.Vector3(...item.center), radius: item.radius}));
  }

  function applySettings() {
    const s = settings;
    material.roughness = s.material.roughness;
    material.metalness = s.material.metalness;
    material.clearcoat = s.material.clearcoat;
    material.clearcoatRoughness = Math.min(1, s.material.roughness * 0.6 + 0.03);
    scene.environmentIntensity = s.material.reflections;
    material.needsUpdate = true;
    outlineMaterial.color.set(s.outline.color);
    key.color.set(s.key.color);
    key.intensity = 2 * s.key.brightness;
    fill.intensity = s.fill;
    rim.intensity = s.rim;
    ambient.intensity = s.ambient;
    key.castShadow = s.shadows.enabled;
    key.shadow.radius = s.shadows.softness;
    key.shadow.intensity = s.shadows.strength;
    backdrop.visible = s.shadows.enabled && s.shadows.backdrop;
    backdrop.material.opacity = s.shadows.strength * 0.6;
    renderer.toneMapping = toneMappings[s.toneMapping] ?? THREE.NeutralToneMapping;
    renderer.toneMappingExposure = s.exposure;
    // The background is composited behind the render instead of drawn into it, so tone mapping cannot gray it.
    renderer.setClearColor(0x000000, 0);
    canvas.style.background = s.background.transparent ? 'transparent' : s.background.color;
  }

  // Distance from the camera to the back of the molecule in the current orientation, so the backdrop sits just behind it.
  function backDistance() {
    scene.updateMatrixWorld();
    const point = new THREE.Vector3();
    let farthest = 0;
    for (const {center, radius} of surfacePoints) {
      point.copy(center).applyMatrix4(model.matrixWorld);
      farthest = Math.max(farthest, -point.applyMatrix4(rig.parent.matrixWorldInverse).z + radius);
    }
    return farthest;
  }

  function placeLights(distance, radius) {
    const s = settings;
    target.position.set(0, 0, -distance);
    const place = (light, azimuth, elevation) => light.position.copy(target.position).addScaledVector(new THREE.Vector3(...lightDirection(azimuth, elevation)), radius * 4);
    place(key, s.key.azimuth, s.key.elevation);
    place(fill, s.key.azimuth >= 0 ? -55 : 55, 5);
    place(rim, s.key.azimuth + 160, 35);
    const extent = radius * (backdrop.visible ? 3 : 1.15);
    Object.assign(key.shadow.camera, {left: -extent, right: extent, top: extent, bottom: -extent, near: 0.1, far: radius * 8});
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.bias = -0.0002;
    key.shadow.normalBias = 0.02 * Math.max(1, radius / 10);
    if (backdrop.visible) backdrop.position.set(0, 0, -(Math.max(backDistance(), distance) + Math.max(0.5, radius * 0.04)));
    backdrop.scale.setScalar(radius * 30);
  }

  function ensureComposer(camera) {
    const {width, height} = renderer.getDrawingBufferSize(new THREE.Vector2());
    const keyNow = `${camera.type}:${width}x${height}`;
    if (composer && composerKey === keyNow) return composer;
    composer?.dispose();
    const samples = width * height > 9e6 ? 0 : 4;
    composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(width, height, {type: THREE.HalfFloatType, samples}));
    composer.setPixelRatio(1);
    composer.setSize(width, height);
    composer.addPass(new RenderPass(scene, camera));
    const occlusion = new GTAOPass(scene, camera, width, height);
    // GTAO multiplies alpha by the occlusion too, which turns shaded atoms see-through on the transparent canvas; keep the scene's alpha.
    occlusion.blendMaterial.blendSrcAlpha = THREE.ZeroFactor;
    occlusion.blendMaterial.blendDstAlpha = THREE.OneFactor;
    composer.addPass(occlusion);
    composer.addPass(new OutputPass());
    composerKey = keyNow;
    return composer;
  }

  // 3Dmol clips just behind the molecule; push the far plane back so the backdrop is drawn.
  function withFar(projection, near, far, ortho) {
    const matrix = [...projection];
    matrix[10] = ortho ? -2 / (far - near) : -(far + near) / (far - near);
    matrix[14] = ortho ? -(far + near) / (far - near) : -2 * far * near / (far - near);
    return matrix;
  }

  function placeLabels(projection) {
    const height = renderer.getDrawingBufferSize(new THREE.Vector2()).y;
    const factor = 2 / (projection[5] * height);
    for (const sprite of labels) {
      const {width: w, height: h} = sprite.material.map.image;
      sprite.scale.set(w * factor, h * factor, 1);
    }
  }

  return {
    canvas,
    setScene(nextGeometry) {
      geometry = nextGeometry;
      rebuild();
    },
    setSettings(nextSettings) {
      const outlineChanged = !settings || settings.outline.enabled !== nextSettings.outline.enabled || settings.outline.width !== nextSettings.outline.width;
      settings = nextSettings;
      applySettings();
      if (outlineChanged) rebuild();
    },
    // entries: [{text, position: [x, y, z], color}]; style sizes are already in output pixels.
    setLabels(entries, style) {
      for (const sprite of labels) {
        sprite.material.map.dispose();
        sprite.material.dispose();
        labelModel.remove(sprite);
      }
      labels = entries.map(entry => {
        const texture = new THREE.CanvasTexture(drawLabelCanvas(document.createElement('canvas'), entry.text, {...style, color: entry.color}));
        texture.colorSpace = THREE.SRGBColorSpace;
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: texture, depthTest: false, depthWrite: false, sizeAttenuation: false, toneMapped: false, transparent: true}));
        sprite.position.set(...entry.position);
        // Same placement as the 3Dmol labels: the label's bottom edge sits offset pixels below the atom center.
        sprite.center.set(0.5, style.offset / texture.image.height);
        sprite.renderOrder = 1;
        labelModel.add(sprite);
        return sprite;
      });
    },
    // Copy of the latest frame on the chosen background (or transparent), for exports. Call right after render().
    snapshot() {
      if (settings.background.transparent) return canvas;
      const flat = document.createElement('canvas');
      flat.width = canvas.width;
      flat.height = canvas.height;
      const context = flat.getContext('2d');
      context.fillStyle = settings.background.color;
      context.fillRect(0, 0, flat.width, flat.height);
      context.drawImage(canvas, 0, 0);
      return flat;
    },
    setSize(width, height, pixelRatio) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
    },
    // state comes from the 3Dmol viewer: view, camera position, projection matrix, and fog range.
    render(state) {
      if (!settings) return;
      const [x, y, z, zoom, qx, qy, qz, qw] = state.view;
      const radius = bounds.radius + bounds.center.clone().add(new THREE.Vector3(x, y, z)).length();
      const distance = state.cameraZ - zoom;
      const far = backdrop.visible ? Math.max(state.far, distance + radius * 1.2) : state.far;
      const camera = state.ortho ? cameras.orthographic : cameras.perspective;
      if (rig.parent !== camera) camera.add(rig);
      camera.position.set(0, 0, state.cameraZ);
      camera.near = state.near;
      camera.far = far;
      camera.projectionMatrix.fromArray(far === state.far ? state.projection : withFar(state.projection, state.near, far, state.ortho));
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
      for (const group of [rotation, labelRotation]) {
        group.position.set(0, 0, zoom);
        group.quaternion.set(qx, qy, qz, qw);
      }
      for (const group of [model, labelModel]) group.position.set(x, y, z);
      placeLights(distance, radius);
      // 3Dmol's fog compares gl_FragCoord.z / gl_FragCoord.w, which is f(d - n)/(f - n) in perspective and (d - n)/(f - n) in
      // orthographic view; convert its fog range back to the view distance d that three.js fog uses.
      const {near: n, far: f} = state;
      const fogDistance = depth => n + depth * (f - n) / (state.ortho ? 1 : f);
      scene.fog = settings.fog ? new THREE.Fog(settings.background.color, fogDistance(state.fogNear), fogDistance(state.fogFar)) : null;
      placeLabels(state.projection);
      if (settings.ao.enabled) {
        const pass = ensureComposer(camera).passes[1];
        pass.blendIntensity = settings.ao.intensity;
        pass.updateGtaoMaterial({radius: settings.ao.radius, distanceExponent: 1, thickness: 1, scale: 1, samples: 16});
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
      renderer.autoClear = false;
      renderer.render(labelScene, camera);
      renderer.autoClear = true;
    },
    dispose() {
      composer?.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
