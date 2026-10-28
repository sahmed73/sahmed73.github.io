import {GIFEncoder, quantize, applyPalette} from './gifenc.mjs';
import {Muxer, ArrayBufferTarget} from './mp4-muxer.mjs';
import {drawLabelCanvas} from './molecule-labels.mjs';
import {moleculeGeometry, lightDirection} from './molecule-scene.mjs';

export const animationWidths = [640, 960, 1280, 1920, 2560, 3840];
export const videoFrameRates = [24, 30, 60];
export const gifMaxWidth = 1920;
const gifFrameRate = 12;

const massElements = [
  [1.008, 'H'], [12.011, 'C'], [14.007, 'N'], [15.999, 'O'],
  [18.998, 'F'], [30.974, 'P'], [32.06, 'S'], [35.45, 'Cl'],
  [79.904, 'Br'], [126.904, 'I'], [28.085, 'Si'], [22.990, 'Na'],
];

const sectionNames = new Set([
  'Masses', 'Atoms', 'Bonds', 'Velocities', 'Angles', 'Dihedrals', 'Impropers',
  'Pair Coeffs', 'Bond Coeffs', 'Angle Coeffs', 'Dihedral Coeffs',
  'Improper Coeffs', 'PairIJ Coeffs', 'Atom Type Labels', 'Bond Type Labels',
]);

function positiveInt(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) throw new Error(`Invalid ${label}: ${value}`);
  return number;
}

function nonnegativeInt(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw new Error(`Invalid ${label}: ${value}`);
  return number;
}

function finiteNumber(value, label) {
  const number = Number(value);
  if (value === undefined || !Number.isFinite(number)) throw new Error(`Invalid ${label}: ${value}`);
  return number;
}

export function parseLammps(text) {
  const atoms = new Map();
  const bonds = [];
  const masses = new Map();
  const bounds = {};
  let section = '';
  let style = 'full';
  let declaredAtoms;
  let declaredBonds;

  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    const [body, comment = ''] = raw.split('#', 2);
    const line = body.trim();
    if (!line) continue;
    const sectionName = [...sectionNames].find(name => line === name);
    if (sectionName) {
      section = sectionName;
      if (section === 'Atoms') {
        style = comment.trim().split(/\s+/)[0] || 'full';
        if (!['full', 'molecular', 'atomic', 'charge'].includes(style)) {
          throw new Error(`Unsupported atom style “${style}”. Use full, molecular, atomic, or charge.`);
        }
      }
      continue;
    }
    const columns = line.split(/\s+/);
    const where = `line ${index + 1}`;
    if (/^\d+ atoms$/.test(line)) declaredAtoms = positiveInt(columns[0], 'atom count');
    else if (/^\d+ bonds$/.test(line)) declaredBonds = Number(columns[0]);
    else if (/^[-+\d.eE]+\s+[-+\d.eE]+\s+[xyz]lo\s+[xyz]hi$/.test(line)) {
      const axis = columns[2][0];
      bounds[axis] = [finiteNumber(columns[0], where), finiteNumber(columns[1], where)];
    } else if (/^[-+\d.eE]+\s+[-+\d.eE]+\s+[-+\d.eE]+\s+xy\s+xz\s+yz$/.test(line) || /^(avec|bvec|cvec|abc origin)\b/.test(line)) {
      throw new Error('Tilted simulation boxes are not supported. Export an orthogonal box or a structure file.');
    } else if (section === 'Masses' && /^\d+\s/.test(line)) {
      const type = positiveInt(columns[0], 'atom type');
      const mass = finiteNumber(columns[1], where);
      if (mass <= 0) throw new Error(`Invalid mass on ${where}`);
      const symbol = comment.trim().match(/(?:^|\/\s*)(Cl|Br|Si|Na|[HCNOFPSI])(?:\b|\d|[_-])/i)?.[1];
      const closest = massElements.reduce((a, b) => Math.abs(b[0] - mass) < Math.abs(a[0] - mass) ? b : a);
      masses.set(type, symbol ? symbol[0].toUpperCase() + symbol.slice(1).toLowerCase() : Math.abs(closest[0] - mass) < 0.5 ? closest[1] : 'X');
    } else if (section === 'Atoms' && /^\d+\s/.test(line)) {
      const layouts = {full: [7, 2, 4], molecular: [6, 2, 3], atomic: [5, 1, 2], charge: [6, 1, 3]};
      const [length, typeAt, xyzAt] = layouts[style];
      if (columns.length !== length && columns.length !== length + 3) throw new Error(`Invalid ${style} atom on ${where}`);
      const id = positiveInt(columns[0], 'atom ID');
      if (atoms.has(id)) throw new Error(`Duplicate atom ID ${id}`);
      const type = positiveInt(columns[typeAt], 'atom type');
      const xyz = columns.slice(xyzAt, xyzAt + 3).map(value => finiteNumber(value, where));
      const image = columns.length === length + 3 ? columns.slice(length).map(Number) : null;
      if (image?.some(value => !Number.isSafeInteger(value))) throw new Error(`Invalid image flags on ${where}`);
      const symbol = comment.trim().match(/(?:^|\/\s*)(Cl|Br|Si|Na|[HCNOFPSI])(?:\b|\d|[_-])/i)?.[1];
      atoms.set(id, {id, type, molId: ['full', 'molecular'].includes(style) ? nonnegativeInt(columns[1], 'molecule ID') : null, xyz, image, symbol: symbol ? symbol[0].toUpperCase() + symbol.slice(1).toLowerCase() : null});
    } else if (section === 'Bonds' && /^\d+\s/.test(line)) {
      if (columns.length !== 4) throw new Error(`Invalid bond on ${where}`);
      bonds.push([positiveInt(columns[2], 'bond atom ID'), positiveInt(columns[3], 'bond atom ID')]);
    } else if (/^[A-Za-z][A-Za-z\s]*$/.test(line)) {
      section = '';
    }
  }

  if (!atoms.size) throw new Error('No atoms found. Check the Atoms section and atom style.');
  if (atoms.size > 20000) throw new Error('This viewer supports up to 20,000 atoms per file.');
  if (declaredAtoms !== undefined && declaredAtoms !== atoms.size) throw new Error(`Header says ${declaredAtoms} atoms; found ${atoms.size}.`);
  if (declaredBonds !== undefined && declaredBonds !== bonds.length) throw new Error(`Header says ${declaredBonds} bonds; found ${bonds.length}.`);
  for (const [a, b] of bonds) if (!atoms.has(a) || !atoms.has(b) || a === b) throw new Error(`Bond refers to an invalid atom: ${a}–${b}`);

  const dimensions = ['x', 'y', 'z'].map(axis => {
    if (!bounds[axis]) return null;
    const size = bounds[axis][1] - bounds[axis][0];
    if (size <= 0) throw new Error(`Invalid ${axis} box bounds.`);
    return size;
  });
  if (dimensions.some(size => size === null) && dimensions.some(size => size !== null)) throw new Error('Incomplete simulation box bounds.');
  for (const atom of atoms.values()) {
    atom.elem = atom.symbol || masses.get(atom.type) || 'X';
    if (atom.image && dimensions.every(size => size !== null)) {
      atom.xyz = atom.xyz.map((value, axis) => value + atom.image[axis] * dimensions[axis]);
    }
  }

  // shortcut: minimum-image unwrapping assumes bonded spans are shorter than half a box, upgrade for long bonds or triclinic cells.
  if (dimensions.every(size => size !== null) && bonds.length) {
    const adjacent = new Map([...atoms.keys()].map(id => [id, []]));
    for (const [a, b] of bonds) { adjacent.get(a).push(b); adjacent.get(b).push(a); }
    const seen = new Set();
    for (const start of atoms.keys()) {
      if (seen.has(start)) continue;
      seen.add(start);
      const queue = [start];
      for (let head = 0; head < queue.length; head++) {
        const current = atoms.get(queue[head]);
        for (const id of adjacent.get(current.id)) {
          if (seen.has(id)) continue;
          const next = atoms.get(id);
          next.xyz = next.xyz.map((value, axis) => value - Math.round((value - current.xyz[axis]) / dimensions[axis]) * dimensions[axis]);
          seen.add(id);
          queue.push(id);
        }
      }
    }
  }

  const list = [...atoms.values()];
  const positions = new Map(list.map((atom, index) => [atom.id, index]));
  const modelAtoms = list.map(atom => ({elem: atom.elem, x: atom.xyz[0], y: atom.xyz[1], z: atom.xyz[2], bonds: [], bondOrder: []}));
  for (const [a, b] of bonds) {
    const i = positions.get(a), j = positions.get(b);
    modelAtoms[i].bonds.push(j); modelAtoms[i].bondOrder.push(1);
    modelAtoms[j].bonds.push(i); modelAtoms[j].bondOrder.push(1);
  }
  return {atoms: modelAtoms, bounds, unknownTypes: [...new Set(list.filter(atom => atom.elem === 'X').map(atom => atom.type))], bondCount: bonds.length};
}

export function moleculeStyle(kind, atomSize, bondRadius, bondMode, bondColor) {
  const stick = {radius: bondRadius};
  if (bondMode === 'solid') stick.color = bondColor;
  if (kind === 'sphere') return {sphere: {scale: 0.65 * atomSize}};
  if (kind === 'stick') return {stick};
  return {stick, sphere: {scale: 0.28 * atomSize}};
}

export function boxEdges(bounds) {
  const edges = [];
  for (const axis of ['x', 'y', 'z']) {
    const [a, b] = ['x', 'y', 'z'].filter(key => key !== axis);
    for (const first of [0, 1]) for (const second of [0, 1]) {
      const start = {x: bounds.x[0], y: bounds.y[0], z: bounds.z[0]};
      start[a] = bounds[a][first];
      start[b] = bounds[b][second];
      edges.push({start, end: {...start, [axis]: bounds[axis][1]}});
    }
  }
  return edges;
}

export function exportDimensions(viewWidth, viewHeight, outputWidth) {
  if (![viewWidth, viewHeight, outputWidth].every(value => Number.isFinite(value) && value > 0)) throw new Error('Invalid export dimensions.');
  return {width: Math.round(outputWidth), height: Math.round(outputWidth * viewHeight / viewWidth)};
}

export function videoBitrate(width, height, fps) {
  return Math.round(Math.min(80e6, Math.max(8e6, width * height * fps * 0.15)));
}

export function animationAngle(progress, {from, to, motion}) {
  const position = Math.max(0, Math.min(1, progress));
  return from + (to - from) * (motion === 'oscillate' ? 1 - Math.abs(2 * position - 1) : position);
}

export function pngDimensions(uri) {
  const prefix = 'data:image/png;base64,';
  if (typeof uri !== 'string' || !uri.startsWith(prefix)) throw new Error('PNG export failed.');
  const header = atob(uri.slice(prefix.length, prefix.length + 32));
  if (header.length < 24 || header.charCodeAt(0) !== 137 || header.slice(1, 4) !== 'PNG' || header.slice(12, 16) !== 'IHDR') throw new Error('PNG export failed.');
  const read32 = offset => header.charCodeAt(offset) * 2 ** 24 + header.charCodeAt(offset + 1) * 2 ** 16 + header.charCodeAt(offset + 2) * 256 + header.charCodeAt(offset + 3);
  const width = read32(16), height = read32(20);
  if (!width || !height) throw new Error('PNG export failed.');
  return {width, height};
}

export function imageSvg({uri, width, height}) {
  if (!uri.startsWith('data:image/png;base64,') || ![width, height].every(value => Number.isSafeInteger(value) && value > 0)) throw new Error('Invalid PNG for SVG export.');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><image width="${width}" height="${height}" href="${uri}"/></svg>`;
}

export async function imagePdf({uri, width, height}) {
  if (!uri.startsWith('data:image/png;base64,') || ![width, height].every(value => Number.isSafeInteger(value) && value > 0)) throw new Error('Invalid PNG for PDF export.');
  if (typeof CompressionStream === 'undefined') throw new Error('This browser cannot create lossless PDFs.');
  const image = new Image();
  image.src = uri;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', {willReadFrequently: true});
  if (!context) throw new Error('Could not read the PNG image.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0);
  const rgba = context.getImageData(0, 0, width, height).data;
  const rgb = new Uint8Array(width * height * 3);
  for (let source = 0, target = 0; source < rgba.length; source += 4) {
    rgb[target++] = rgba[source];
    rgb[target++] = rgba[source + 1];
    rgb[target++] = rgba[source + 2];
  }
  const compressed = new Uint8Array(await new Response(new Blob([rgb]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
  const pageWidth = 792;
  const pageHeight = Math.round(pageWidth * height / width);
  const commands = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ\n`;
  const encoder = new TextEncoder();
  const chunks = [];
  const offsets = [0];
  let length = 0;
  const write = value => {
    const bytes = typeof value === 'string' ? encoder.encode(value) : value;
    chunks.push(bytes);
    length += bytes.length;
  };
  const object = (number, values) => {
    offsets.push(length);
    write(`${number} 0 obj\n`);
    values.forEach(write);
    write('\nendobj\n');
  };
  write('%PDF-1.4\n');
  object(1, ['<< /Type /Catalog /Pages 2 0 R >>']);
  object(2, ['<< /Type /Pages /Kids [3 0 R] /Count 1 >>']);
  object(3, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`]);
  object(4, [`<< /Length ${commands.length} >>\nstream\n`, commands, 'endstream']);
  object(5, [`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${compressed.length} >>\nstream\n`, compressed, '\nendstream']);
  const xref = length;
  write(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  offsets.slice(1).forEach(offset => write(`${String(offset).padStart(10, '0')} 00000 n \n`));
  write(`trailer\n<< /Root 1 0 R /Size ${offsets.length} >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob(chunks, {type: 'application/pdf'});
}

if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  const status = $('molecule-status');
  const viewer = window.$3Dmol?.createViewer('molecule-canvas', {backgroundColor: 'white'});
  let hasModel = false;
  let box = null;
  let loadId = 0;
  let modelAtoms = [];
  const elementColors = new Map();
  const colorPresets = {
    classic: {C: '#909090', H: '#ffffff', O: '#ff0d0d', N: '#3050f8'},
    soft: {C: '#65717d', H: '#f2f2f2', O: '#df7979', N: '#729ce8'},
    contrast: {C: '#222222', H: '#f5f5f5', O: '#d91e18', N: '#0057d9'},
    vibrant: {C: '#4b5563', H: '#ffe599', O: '#ff3b30', N: '#00a6fb'},
    earth: {C: '#795548', H: '#fff1d6', O: '#d76742', N: '#477b93'},
    'deep-blue': {C: '#2b4965', H: '#e1ecf8', O: '#e97373', N: '#3d87bd'},
    'sea-glass': {C: '#286267', H: '#ddf4ef', O: '#ed8d79', N: '#48a9a6'},
    forest: {C: '#36543e', H: '#e9f2d9', O: '#d67a55', N: '#71a875'},
    sage: {C: '#606d56', H: '#f1f4e7', O: '#d88b72', N: '#9aaf7b'},
    lavender: {C: '#5d5579', H: '#f0eafa', O: '#db799f', N: '#8c8fe1'},
    neon: {C: '#25243a', H: '#e8ff54', O: '#ff2e91', N: '#1bdbe5'},
    grayscale: {C: '#2b2b2b', H: '#f2f2f2', O: '#686868', N: '#b5b5b5'},
    sunset: {C: '#54345f', H: '#ffe1b8', O: '#fa6a3c', N: '#a755ae'},
    citrus: {C: '#556126', H: '#fff6b5', O: '#ff981f', N: '#a6cb26'},
    berry: {C: '#5c2445', H: '#fce0ed', O: '#df2f6a', N: '#8442a9'},
    glacier: {C: '#355666', H: '#ecfbff', O: '#8ad4e4', N: '#456bd0'},
    desert: {C: '#806348', H: '#f7e9c9', O: '#cc794b', N: '#a6a063'},
    tropical: {C: '#15594b', H: '#eaffdf', O: '#f05f45', N: '#49b77e'},
    primary: {C: '#243b6b', H: '#fff9d6', O: '#e53935', N: '#f4c20d'},
    candy: {C: '#7f6384', H: '#fff3f8', O: '#ff729c', N: '#55b8e5'},
  };
  const materialPresets = {
    matte: {roughness: 0.9, metalness: 0, clearcoat: 0, reflections: 0.05},
    satin: {roughness: 0.5, metalness: 0, clearcoat: 0.2, reflections: 0.08},
    plastic: {roughness: 0.35, metalness: 0, clearcoat: 0.5, reflections: 0.12},
    glossy: {roughness: 0.18, metalness: 0, clearcoat: 1, reflections: 0.2},
    mirror: {roughness: 0.05, metalness: 0, clearcoat: 1, reflections: 0.5},
    metallic: {roughness: 0.3, metalness: 0.85, clearcoat: 0.3, reflections: 0.6},
  };
  const atomOverrides = new Map();
  const labelColors = new Map();
  const hiddenLabelElements = new Set();
  let studio = null;
  let studioRequest = null;
  let studioDirty = false;
  let lastStudioKey = '';
  let selectedAtom = -1;
  let animationBusy = false;
  let exporting = false;
  let cancelPreview = null;
  const webCodecs = typeof VideoEncoder === 'function' && typeof VideoFrame === 'function';
  const videoFormat = typeof MediaRecorder === 'function' && typeof MediaRecorder.isTypeSupported === 'function' && typeof HTMLCanvasElement.prototype.captureStream === 'function'
    ? [['video/mp4;codecs=avc1.42E01E', 'mp4'], ['video/webm;codecs=vp9', 'webm'], ['video/webm;codecs=vp8', 'webm'], ['video/webm', 'webm']].find(([mime]) => MediaRecorder.isTypeSupported(mime))
    : null;
  if (!webCodecs && !videoFormat) $('molecule-save-video').title = 'Video recording is unavailable in this browser.';

  function message(text, error = false) {
    status.textContent = text;
    status.classList.toggle('error', error);
  }

  function colorHex(value) {
    if (typeof value === 'string' && /^#[\da-f]{6}$/i.test(value)) return value;
    const number = Number(value);
    return `#${(Number.isFinite(number) ? number : 0xff1493).toString(16).padStart(6, '0').slice(-6)}`;
  }

  function updatePickedAtom() {
    const atom = modelAtoms[selectedAtom];
    $('molecule-selected-label').textContent = atom ? `Selected atom: ${atom.elem} ${atom.serial ?? selectedAtom + 1}` : 'Selected atom: none';
    $('molecule-picked-color').disabled = !atom;
    $('molecule-picked-reset').disabled = !atom || !atomOverrides.has(selectedAtom);
    if (atom) $('molecule-picked-color').value = atomOverrides.get(selectedAtom) || elementColors.get(atom.elem);
  }

  function labelColor(atom) {
    const mode = $('molecule-label-color-mode').value;
    if (mode === 'atom') return colorHex(atom.color);
    if (mode === 'element') return labelColors.get(atom.elem) || colorHex(atom.color);
    return $('molecule-label-text-color').value;
  }

  function labelEntries() {
    const enabled = $('molecule-labels').getAttribute('aria-pressed') === 'true';
    const atoms = modelAtoms.map((atom, index) => ({atom, index}));
    const heavyAtoms = atoms.filter(({atom}) => atom.elem !== 'H');
    const scoped = $('molecule-label-scope').value === 'all' || !heavyAtoms.length ? atoms : heavyAtoms;
    const perElement = $('molecule-label-color-mode').value === 'element';
    const eligible = perElement ? scoped.filter(({atom}) => !hiddenLabelElements.has(atom.elem)) : scoped;
    // shortcut: sample labels above 120 atoms; use viewport culling if dense structures need every label.
    const stride = Math.max(1, Math.ceil(eligible.length / 120));
    const entries = [];
    if (enabled) for (let position = 0; position < eligible.length; position += stride) {
      const {atom, index} = eligible[position];
      if (index !== selectedAtom) entries.push({text: atom.elem, atom});
    }
    if (selectedAtom >= 0) {
      const atom = modelAtoms[selectedAtom];
      entries.push({text: `${atom.elem} ${atom.serial ?? selectedAtom + 1}`, atom});
    }
    $('molecule-label-note').hidden = !enabled || eligible.length <= 120;
    return entries;
  }

  // Label sizes in output pixels; scale is output pixels per CSS pixel.
  function labelDrawStyle(scale) {
    return {
      fontSize: Number($('molecule-label-size').value) * scale,
      fontFamily: $('molecule-label-font').value,
      fontWeight: Number($('molecule-label-weight').value),
      background: $('molecule-label-bg-color').value,
      backgroundOpacity: Number($('molecule-label-opacity').value),
      padding: 4 * scale,
      outlineWidth: Number($('molecule-label-outline').value) * scale,
      outlineColor: $('molecule-label-outline-color').value,
      offset: 10 * scale,
    };
  }

  const viewerPixelRatio = () => viewer.getCanvas().width / viewer.getCanvas().clientWidth;
  const screenScale = () => studioOn() ? window.devicePixelRatio || 1 : viewerPixelRatio();

  // Labels are drawn at output resolution (sharp on screen and in exports); pixelRatio is the 3Dmol renderer's, which sizes its sprites.
  function updateAtomLabels(scale = screenScale(), pixelRatio = viewerPixelRatio()) {
    viewer.removeAllLabels();
    const entries = labelEntries();
    const style = labelDrawStyle(scale);
    if (studioOn()) {
      studio.setLabels(entries.map(({text, atom}) => ({text, position: [atom.x, atom.y, atom.z], color: labelColor(atom)})), style);
      studioDirty = true;
    } else {
      for (const {text, atom} of entries) {
        const label = viewer.addLabel(text, {position: atom, alignment: 'bottomCenter', screenOffset: {x: 0, y: -style.offset}, inFront: true}, undefined, true);
        drawLabelCanvas(label.canvas, text, {...style, color: labelColor(atom)});
        label.sprite.material.map.needsUpdate = true;
        label.sprite.scale.set(1 / pixelRatio, 1 / pixelRatio, 1);
      }
    }
    viewer.render();
  }

  function showLabelColors() {
    const mode = $('molecule-label-color-mode').value;
    const list = $('molecule-label-element-colors');
    $('molecule-label-text-color-row').hidden = mode !== 'solid';
    list.hidden = mode !== 'element';
    list.replaceChildren();
    if (mode !== 'element') return;
    const elements = [...new Set(modelAtoms.map(atom => atom.elem))].sort();
    if (!elements.length) list.textContent = 'Load a molecule to choose label colors.';
    for (const elem of elements) {
      if (!labelColors.has(elem)) labelColors.set(elem, elementColors.get(elem));
      const row = document.createElement('span');
      const show = document.createElement('input');
      const input = document.createElement('input');
      show.type = 'checkbox';
      show.checked = !hiddenLabelElements.has(elem);
      show.setAttribute('aria-label', `Show ${elem} labels`);
      show.title = `Show ${elem} labels`;
      input.type = 'color';
      input.value = labelColors.get(elem);
      input.disabled = !show.checked;
      input.setAttribute('aria-label', `${elem} label text color`);
      show.addEventListener('change', () => {
        if (show.checked) hiddenLabelElements.delete(elem);
        else hiddenLabelElements.add(elem);
        input.disabled = !show.checked;
        if (hasModel) updateAtomLabels();
      });
      input.addEventListener('input', () => {
        labelColors.set(elem, input.value);
        if (hasModel) updateAtomLabels();
      });
      const name = document.createElement('label');
      name.textContent = elem;
      name.prepend(show);
      row.append(name, input);
      list.append(row);
    }
  }

  function showElementColors() {
    const list = $('molecule-element-colors');
    list.replaceChildren();
    for (const elem of [...new Set(modelAtoms.map(atom => atom.elem))].sort()) {
      const label = document.createElement('label');
      const input = document.createElement('input');
      label.textContent = elem;
      input.type = 'color';
      input.value = elementColors.get(elem);
      input.setAttribute('aria-label', `${elem} atom color`);
      input.addEventListener('input', () => {
        elementColors.set(elem, input.value);
        $('molecule-element-preset').value = '';
        if (hasModel) applyStyle(viewer.getModel());
        updatePickedAtom();
      });
      label.append(input);
      list.append(label);
    }
  }

  function applyStyle(model) {
    modelAtoms.forEach((atom, index) => { atom.color = atomOverrides.get(index) || elementColors.get(atom.elem); });
    model.setStyle({}, moleculeStyle($('molecule-style').value, Number($('molecule-atom-size').value), Number($('molecule-bond-radius').value), $('molecule-bond-mode').value, $('molecule-bond-color').value));
    syncStudioScene();
    if ($('molecule-label-color-mode').value === 'atom') updateAtomLabels();
    else viewer.render();
  }

  function drawBox() {
    viewer.removeAllShapes();
    if (box && $('molecule-box').checked) {
      const radius = Number($('molecule-box-radius').value);
      const color = $('molecule-box-color').value;
      for (const edge of boxEdges(box)) viewer.addCylinder({...edge, radius, color});
    }
    syncStudioScene();
    viewer.render();
  }

  function renderSettings() {
    const number = id => Number($(id).value);
    return {
      material: {roughness: number('molecule-roughness'), metalness: number('molecule-metalness'), clearcoat: number('molecule-clearcoat'), reflections: number('molecule-reflections')},
      key: {brightness: number('molecule-light-brightness'), azimuth: number('molecule-light-azimuth'), elevation: number('molecule-light-elevation'), color: $('molecule-light-color').value},
      fill: number('molecule-fill-light'),
      rim: number('molecule-rim-light'),
      ambient: number('molecule-ambient-light'),
      shadows: {enabled: $('molecule-shadows').checked, softness: number('molecule-shadow-softness'), strength: number('molecule-shadow-strength'), backdrop: $('molecule-backdrop-shadow').checked},
      ao: {enabled: $('molecule-ao').checked, radius: number('molecule-ao-radius'), intensity: number('molecule-ao-strength')},
      toneMapping: $('molecule-tone-mapping').value,
      exposure: number('molecule-exposure'),
      fog: $('molecule-fog').checked,
      fov: number('molecule-fov'),
      projection: $('molecule-projection').value,
      background: {color: $('molecule-background').value, transparent: $('molecule-transparent').checked},
      outline: {enabled: $('molecule-outline').checked, width: number('molecule-outline-width'), color: $('molecule-outline-color').value},
    };
  }

  // Light direction, brightness, and color, camera, fog, background, and outline also drive the standard 3Dmol renderer.
  function applyRenderSettings() {
    if (!viewer) return;
    const settings = renderSettings();
    const light = viewer.scene?.children.find(child => child.intensity !== undefined && child.color && child.position);
    if (light) {
      light.position.set(...lightDirection(settings.key.azimuth, settings.key.elevation));
      light.intensity = settings.key.brightness;
      const value = parseInt(settings.key.color.slice(1), 16);
      Object.assign(light.color, {r: (value >> 16 & 255) / 255, g: (value >> 8 & 255) / 255, b: (value & 255) / 255});
    }
    viewer.setCameraParameters({fov: settings.fov});
    viewer.setProjection(settings.projection);
    viewer.config.disableFog = !settings.fog;
    viewer.setBackgroundColor(settings.background.color, settings.background.transparent ? 0 : 1);
    viewer.setViewStyle(settings.outline.enabled ? {style: 'outline', color: settings.outline.color, width: settings.outline.width} : {style: 'none'});
    viewer.render();
    if (studio) {
      studio.setSettings(settings);
      studioDirty = true;
    }
  }

  function studioOn() {
    return !!studio && $('molecule-renderer').value === 'studio';
  }

  function cameraState() {
    const camera = viewer.camera;
    return {
      view: viewer.getView(), cameraZ: camera.position.z, projection: Array.from(camera.projectionMatrix.elements),
      near: camera.near, far: camera.far, ortho: !!camera.ortho, fogNear: viewer.scene.fog.near, fogFar: viewer.scene.fog.far,
    };
  }

  function studioFrame() {
    if (!studioOn()) {
      studioRequest = null;
      return;
    }
    if (!exporting && hasModel) {
      const state = cameraState();
      const key = `${state.view.join()}|${state.projection.join()}|${state.fogNear}`;
      if (studioDirty || key !== lastStudioKey) {
        studio.render(state);
        lastStudioKey = key;
        studioDirty = false;
      }
    }
    studioRequest = requestAnimationFrame(studioFrame);
  }

  function syncStudioScene() {
    if (!studioOn()) return;
    const geometry = moleculeGeometry(modelAtoms, {
      kind: $('molecule-style').value, atomSize: Number($('molecule-atom-size').value), bondRadius: Number($('molecule-bond-radius').value),
      bondMode: $('molecule-bond-mode').value, bondColor: $('molecule-bond-color').value,
    }, window.$3Dmol?.GLModel?.vdwRadii || {});
    if (box && $('molecule-box').checked) {
      const radius = Number($('molecule-box-radius').value);
      const color = $('molecule-box-color').value;
      for (const {start, end} of boxEdges(box)) geometry.cylinders.push({start: [start.x, start.y, start.z], end: [end.x, end.y, end.z], radius, color});
    }
    studio.setScene(geometry);
    studioDirty = true;
  }

  function sizeStudio() {
    if (!studioOn()) return;
    const container = $('molecule-canvas');
    studio.setSize(container.clientWidth, container.clientHeight, window.devicePixelRatio || 1);
    studioDirty = true;
  }

  async function setRenderer() {
    const studioMode = $('molecule-renderer').value === 'studio';
    for (const element of document.querySelectorAll('.molecule-studio-only')) element.hidden = !studioMode;
    if (studioMode && !studio) {
      message('Loading the studio renderer…');
      try {
        const {createStudio} = await import('./molecule-studio.mjs');
        studio ??= createStudio($('molecule-canvas'));
      } catch (error) {
        $('molecule-renderer').value = 'standard';
        message(`The studio renderer could not load: ${error.message}`, true);
        return setRenderer();
      }
      message(hasModel ? 'Studio renderer ready.' : 'Load a molecule to begin.');
    }
    viewer.getCanvas().style.opacity = studioMode ? '0' : '';
    // three.js sets an inline display on its canvas, which would override the hidden attribute.
    if (studio) studio.canvas.style.display = studioMode ? 'block' : 'none';
    applyRenderSettings();
    sizeStudio();
    syncStudioScene();
    if (hasModel) updateAtomLabels();
    if (studioMode && !studioRequest) studioRequest = requestAnimationFrame(studioFrame);
  }

  // Renders the WebGL canvas itself at the output size (not an upscaled screen copy), keeps its on-screen size, and scales labels to match.
  async function withExportSize(outputWidth, render) {
    const canvas = viewer.getCanvas();
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    const size = exportDimensions(cssWidth, cssHeight, outputWidth);
    const pixelRatio = canvas.width / cssWidth;
    const view = viewer.getView();
    exporting = true;
    try {
      viewer.setWidth(Math.round(size.width / pixelRatio));
      viewer.setHeight(Math.round(size.height / pixelRatio));
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      if (studioOn()) studio.setSize(size.width, size.height, 1);
      updateAtomLabels(size.width / cssWidth, pixelRatio);
      viewer.setView(view);
      viewer.render();
      if (studioOn()) studio.render(cameraState());
      return await render(studioOn() ? studio.canvas : canvas, size);
    } finally {
      exporting = false;
      viewer.resize();
      viewer.setView(view);
      sizeStudio();
      updateAtomLabels();
    }
  }

  function renderPng(outputWidth) {
    return withExportSize(outputWidth, source => {
      const uri = studioOn() ? studio.snapshot().toDataURL('image/png') : viewer.pngURI();
      return {uri, ...pngDimensions(uri)};
    });
  }

  function download(uri, filename) {
    const link = document.createElement('a');
    link.href = uri;
    link.download = filename;
    link.click();
  }

  function downloadBlob(blob, filename) {
    const uri = URL.createObjectURL(blob);
    download(uri, filename);
    setTimeout(() => URL.revokeObjectURL(uri), 60000);
  }

  function animationSettings() {
    const from = Number($('molecule-animation-from').value);
    const to = Number($('molecule-animation-to').value);
    const motion = $('molecule-animation-motion').value;
    const duration = Number($('molecule-animation-duration').value);
    const width = Number($('molecule-animation-width').value);
    const fps = Number($('molecule-animation-fps').value);
    if ([$('molecule-animation-from'), $('molecule-animation-to'), $('molecule-animation-duration')].some(input => !input.value.trim()) ||
        ![from, to].every(angle => Number.isFinite(angle) && angle >= -720 && angle <= 720) ||
        !['one-way', 'oscillate'].includes(motion) || !Number.isFinite(duration) || duration < 1 || duration > 15 ||
        !animationWidths.includes(width) || !videoFrameRates.includes(fps)) {
      throw new Error('Choose angles from −720° to 720°, a duration of 1–15 seconds, and a valid width and frame rate.');
    }
    return {from, to, motion, duration, width, fps};
  }

  function animationCanvas(source, size, readPixels) {
    const canvas = document.createElement('canvas');
    canvas.width = 2 * Math.round(size.width / 2);
    canvas.height = 2 * Math.round(size.height / 2);
    const context = canvas.getContext('2d', {willReadFrequently: readPixels});
    if (!context) throw new Error('Could not create an animation canvas.');
    return {source, canvas, context};
  }

  async function videoEncoding(width, height, fps) {
    if (!webCodecs) return null;
    const base = {width, height, framerate: fps, bitrate: videoBitrate(width, height, fps), latencyMode: 'quality'};
    const candidates = [
      ...['avc1.640034', 'avc1.640033', 'avc1.64002a', 'avc1.640028', 'avc1.4d0034', 'avc1.4d0033', 'avc1.4d0028'].map(codec => ({muxCodec: 'avc', config: {...base, codec, avc: {format: 'avc'}}})),
      ...['vp09.00.51.08', 'vp09.00.41.08'].map(codec => ({muxCodec: 'vp9', config: {...base, codec}})),
    ];
    for (const candidate of candidates) {
      try { if ((await VideoEncoder.isConfigSupported(candidate.config)).supported) return candidate; } catch { /* try the next codec */ }
    }
    return null;
  }

  function animationFrame(view, angle, output) {
    viewer.setView(view);
    viewer.rotate(-angle, 'vy');
    viewer.render();
    if (studioOn()) studio.render(cameraState());
    if (output) {
      output.context.fillStyle = $('molecule-background').value;
      output.context.fillRect(0, 0, output.canvas.width, output.canvas.height);
      output.context.drawImage(output.source, 0, 0, output.canvas.width, output.canvas.height);
    }
  }

  function renderPreview(view, settings) {
    animationFrame(view, animationAngle(0, settings));
    return new Promise((resolve, reject) => {
      let started, frameId;
      cancelPreview = () => { cancelAnimationFrame(frameId); resolve(false); };
      const frame = now => {
        try {
          if (started === undefined) started = now;
          const progress = Math.min((now - started) / (settings.duration * 1000), 1);
          animationFrame(view, animationAngle(progress, settings));
          if (progress < 1) frameId = requestAnimationFrame(frame);
          else resolve(true);
        } catch (error) { reject(error); }
      };
      frameId = requestAnimationFrame(frame);
    });
  }

  async function renderGif(view, settings, output) {
    const {duration} = settings;
    const gif = GIFEncoder();
    const frames = Math.round(duration * gifFrameRate);
    for (let index = 0; index < frames; index++) {
      animationFrame(view, animationAngle(index / (frames - 1), settings), output);
      const rgba = output.context.getImageData(0, 0, output.canvas.width, output.canvas.height).data;
      const palette = quantize(rgba, 256);
      const pixels = applyPalette(rgba, palette);
      const delay = Math.round((index + 1) * duration * 100 / frames) * 10 - Math.round(index * duration * 100 / frames) * 10;
      gif.writeFrame(pixels, output.canvas.width, output.canvas.height, {palette, delay, repeat: 0});
      if (index % 6 === 0) {
        message(`Creating GIF: ${Math.round((index + 1) / frames * 100)}%…`);
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    gif.finish();
    return new Blob([gif.bytes()], {type: 'image/gif'});
  }

  // Encodes every frame at the chosen frame rate, so the result is smooth however long each high-resolution frame takes to render.
  async function encodeVideo(view, settings, output, encoding) {
    const {duration, fps} = settings;
    const {width, height} = output.canvas;
    const muxer = new Muxer({target: new ArrayBufferTarget(), video: {codec: encoding.muxCodec, width, height, frameRate: fps}, fastStart: 'in-memory'});
    let failure = null;
    const encoder = new VideoEncoder({output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: error => { failure = error; }});
    encoder.configure(encoding.config);
    const frames = Math.max(2, Math.round(duration * fps));
    try {
      for (let index = 0; index < frames; index++) {
        if (failure) throw failure;
        animationFrame(view, animationAngle(index / (frames - 1), settings), output);
        const frame = new VideoFrame(output.canvas, {timestamp: Math.round(index * 1e6 / fps), duration: Math.round(1e6 / fps)});
        encoder.encode(frame, {keyFrame: index % (2 * fps) === 0});
        frame.close();
        while (encoder.encodeQueueSize > 4) await new Promise(resolve => setTimeout(resolve, 2));
        if (index % 10 === 0) {
          message(`Encoding video: ${Math.round((index + 1) / frames * 100)}%…`);
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      await encoder.flush();
      if (failure) throw failure;
      muxer.finalize();
      return new Blob([muxer.target.buffer], {type: 'video/mp4'});
    } finally {
      if (encoder.state !== 'closed') encoder.close();
    }
  }

  // Fallback for browsers without WebCodecs: records in real time, so very large frames may play back unevenly.
  async function recordVideo(view, settings, output) {
    const {duration, fps} = settings;
    animationFrame(view, animationAngle(0, settings), output);
    const stream = output.canvas.captureStream(fps);
    try {
      const recorder = new MediaRecorder(stream, {mimeType: videoFormat[0], videoBitsPerSecond: videoBitrate(output.canvas.width, output.canvas.height, fps)});
      return await new Promise((resolve, reject) => {
        const chunks = [];
        recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
        recorder.onerror = event => reject(event.error || new Error('Video recording failed.'));
        recorder.onstop = () => resolve(new Blob(chunks, {type: videoFormat[0]}));
        recorder.start();
        let started;
        const frame = now => {
          if (recorder.state === 'inactive') return;
          try {
            if (started === undefined) started = now;
            const progress = Math.min((now - started) / (duration * 1000), 1);
            animationFrame(view, animationAngle(progress, settings), output);
            if (progress < 1) requestAnimationFrame(frame);
            else setTimeout(() => recorder.stop(), 50);
          } catch (error) { recorder.stop(); reject(error); }
        };
        requestAnimationFrame(frame);
      });
    } finally { stream.getTracks().forEach(track => track.stop()); }
  }

  function show(data, format, label) {
    if (!viewer) throw new Error('3D viewer could not load. Check your connection and reload.');
    viewer.spin(false);
    $('molecule-spin').setAttribute('aria-pressed', 'false');
    $('molecule-spin').textContent = 'Rotate';
    viewer.clear();
    hasModel = false;
    modelAtoms = [];
    atomOverrides.clear();
    selectedAtom = -1;
    $('molecule-element-colors').textContent = 'Load a molecule to choose colors.';
    updatePickedAtom();
    $('molecule-save').disabled = true;
    $('molecule-save-svg').disabled = true;
    $('molecule-save-pdf').disabled = true;
    $('molecule-save-gif').disabled = true;
    $('molecule-save-video').disabled = true;
    $('molecule-preview').disabled = true;
    $('molecule-labels').disabled = true;
    $('molecule-spin').disabled = true;
    box = format === 'lammps' && Object.keys(data.bounds).length === 3 ? data.bounds : null;
    $('molecule-box-controls').hidden = !box;
    $('molecule-box').checked = !!box;
    const model = format === 'lammps' ? viewer.addModel() : viewer.addModel(data, format);
    if (format === 'lammps') model.addAtoms(data.atoms);
    const count = model.selectedAtoms({}).length;
    if (!count) throw new Error('No atoms could be read from this structure.');
    modelAtoms = model.selectedAtoms({});
    modelAtoms.forEach((atom, index) => {
      atom.pickIndex = index;
      if (!elementColors.has(atom.elem)) elementColors.set(atom.elem, colorHex(atom.color));
    });
    model.setClickable({}, true, atom => {
      selectedAtom = selectedAtom === atom.pickIndex ? -1 : atom.pickIndex;
      updatePickedAtom();
      updateAtomLabels();
    });
    showElementColors();
    showLabelColors();
    applyStyle(model);
    drawBox();
    viewer.zoomTo();
    updateAtomLabels();
    hasModel = true;
    $('molecule-save').disabled = false;
    $('molecule-save-svg').disabled = false;
    $('molecule-save-pdf').disabled = false;
    $('molecule-save-gif').disabled = false;
    $('molecule-save-video').disabled = !webCodecs && !videoFormat;
    $('molecule-preview').disabled = false;
    $('molecule-labels').disabled = false;
    $('molecule-spin').disabled = false;
    message(`${label}: ${count.toLocaleString()} atoms${format === 'lammps' ? `, ${data.bondCount.toLocaleString()} bonds` : ''}.${format === 'lammps' && data.unknownTypes.length ? ` Unknown element types ${data.unknownTypes.join(', ')} are shown as X.` : ''}`);
  }

  for (const [id, file, label] of [
    ['molecule-demo', 'pao-example.mol', 'PAO molecule'],
    ['molecule-demo-zddp', 'zddp-dibutyl-example.mol', 'ZDDP (dibutyl)'],
    ['molecule-demo-adpa', 'adpa-dioctyl-example.mol', 'ADPA (dioctyl)'],
  ]) {
    $(id).addEventListener('click', async () => {
      const current = ++loadId;
      try {
        message('Loading example…');
        const response = await fetch(new URL(file, import.meta.url));
        if (!response.ok) throw new Error('Example file could not be loaded.');
        const text = await response.text();
        if (current === loadId) show(text, 'sdf', `Example: ${label}`);
      } catch (error) { if (current === loadId) message(error.message, true); }
    });
  }

  $('molecule-file').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    const current = ++loadId;
    try {
      if (file.size > 10_000_000) throw new Error('Choose a file under 10 MB.');
      message(`Reading ${file.name}…`);
      const text = await file.text();
      if (current !== loadId) return;
      const extension = file.name.split('.').pop().toLowerCase();
      const format = {data: 'lammps', mol: 'sdf', sdf: 'sdf', pdb: 'pdb', xyz: 'xyz'}[extension];
      if (!format) throw new Error('Choose a .data, .mol, .sdf, .pdb, or .xyz file.');
      show(format === 'lammps' ? parseLammps(text) : text, format, file.name);
    } catch (error) { if (current === loadId) message(error.message, true); }
  });

  $('molecule-smiles-form').addEventListener('submit', async event => {
    event.preventDefault();
    const smiles = $('molecule-smiles').value.trim();
    if (!smiles || smiles.length > 500) return message('Enter a SMILES string of 1–500 characters.', true);
    const current = ++loadId;
    try {
      message('Requesting 3D coordinates from PubChem…');
      const response = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(smiles)}/SDF?record_type=3d`, {signal: AbortSignal.timeout(20000)});
      if (!response.ok) throw new Error('PubChem did not return a 3D conformer.');
      const text = await response.text();
      if (current === loadId) show(text, 'sdf', 'PubChem 3D structure');
    } catch (pubchemError) {
      if (current !== loadId) return;
      const endpoint = $('molecule-smiles-form').dataset.rdkitApi;
      if (!endpoint) return message(`PubChem could not provide a 3D structure: ${pubchemError.message} Try loading a MOL or SDF file.`, true);
      try {
        message('PubChem unavailable; generating an RDKit conformer… The service may take about a minute to wake.');
        const response = await fetch(endpoint, {
          method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({smiles}), signal: AbortSignal.timeout(90000),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.sdf) throw new Error(result?.error || 'RDKit is unavailable.');
        if (current === loadId) show(result.sdf, 'sdf', `RDKit 3D structure (${result.method})`);
      } catch (error) { if (current === loadId) message(`PubChem and RDKit could not load this SMILES: ${error.message}`, true); }
    }
  });

  $('molecule-style').addEventListener('change', () => {
    if (!hasModel) return;
    applyStyle(viewer.getModel());
  });
  for (const [id, output, format] of [
    ['molecule-atom-size', 'molecule-atom-size-value', value => `${Number(value).toFixed(1)}×`],
    ['molecule-bond-radius', 'molecule-bond-radius-value', value => `${Number(value).toFixed(2)} Å`],
  ]) {
    $(id).addEventListener('input', () => {
      $(output).textContent = format($(id).value);
      if (hasModel) applyStyle(viewer.getModel());
    });
  }
  $('molecule-bond-mode').addEventListener('change', () => {
    $('molecule-bond-color-row').hidden = $('molecule-bond-mode').value !== 'solid';
    if (hasModel) applyStyle(viewer.getModel());
  });
  $('molecule-bond-color').addEventListener('input', () => { if (hasModel) applyStyle(viewer.getModel()); });
  $('molecule-element-preset').addEventListener('change', event => {
    const preset = colorPresets[event.currentTarget.value];
    if (!preset) return;
    for (const [elem, color] of Object.entries(preset)) elementColors.set(elem, color);
    if (hasModel) {
      showElementColors();
      applyStyle(viewer.getModel());
      updatePickedAtom();
    }
  });
  $('molecule-picked-color').addEventListener('input', () => {
    if (selectedAtom < 0) return;
    atomOverrides.set(selectedAtom, $('molecule-picked-color').value);
    $('molecule-picked-reset').disabled = false;
    applyStyle(viewer.getModel());
  });
  $('molecule-picked-reset').addEventListener('click', () => {
    atomOverrides.delete(selectedAtom);
    updatePickedAtom();
    applyStyle(viewer.getModel());
  });
  $('molecule-reset').addEventListener('click', () => { if (hasModel) { viewer.zoomTo(); viewer.render(); } });
  $('molecule-box').addEventListener('change', drawBox);
  $('molecule-box-radius').addEventListener('input', () => {
    $('molecule-box-radius-value').textContent = `${Number($('molecule-box-radius').value).toFixed(2)} Å`;
    drawBox();
  });
  $('molecule-box-color').addEventListener('input', drawBox);
  $('molecule-spin').addEventListener('click', event => {
    const active = event.currentTarget.getAttribute('aria-pressed') !== 'true';
    viewer.spin(active ? 'vy' : false, -Number($('molecule-spin-speed').value));
    event.currentTarget.setAttribute('aria-pressed', String(active));
    event.currentTarget.textContent = active ? 'Stop rotation' : 'Rotate';
  });
  $('molecule-spin-speed').addEventListener('input', () => {
    $('molecule-spin-speed-value').textContent = `${Number($('molecule-spin-speed').value).toFixed(2)}×`;
    if ($('molecule-spin').getAttribute('aria-pressed') === 'true') viewer.spin('vy', -Number($('molecule-spin-speed').value));
  });
  $('molecule-labels').addEventListener('click', event => {
    const enabled = event.currentTarget.getAttribute('aria-pressed') !== 'true';
    event.currentTarget.setAttribute('aria-pressed', String(enabled));
    event.currentTarget.textContent = enabled ? 'Hide element labels' : 'Show element labels';
    updateAtomLabels();
  });
  $('molecule-label-color-mode').addEventListener('change', () => {
    showLabelColors();
    if (hasModel) updateAtomLabels();
  });
  for (const id of ['molecule-label-scope', 'molecule-label-size', 'molecule-label-font', 'molecule-label-weight', 'molecule-label-text-color', 'molecule-label-outline', 'molecule-label-outline-color', 'molecule-label-bg-color', 'molecule-label-opacity']) {
    $(id).addEventListener('input', () => {
      $('molecule-label-size-value').textContent = `${$('molecule-label-size').value} px`;
      $('molecule-label-outline-value').textContent = `${$('molecule-label-outline').value} px`;
      $('molecule-label-opacity-value').textContent = `${Math.round(Number($('molecule-label-opacity').value) * 100)}%`;
      if (hasModel) updateAtomLabels();
    });
  }
  const renderPanel = $('molecule-render-settings');
  const showRenderValues = () => {
    for (const input of renderPanel.querySelectorAll('input[type="range"]')) {
      const output = $(`${input.id}-value`);
      if (output) output.textContent = `${input.value}${input.dataset.unit || ''}`;
    }
  };
  renderPanel.addEventListener('input', event => {
    if (event.target.id === 'molecule-renderer' || event.target.id === 'molecule-material-preset') return;
    if (['molecule-roughness', 'molecule-metalness', 'molecule-clearcoat', 'molecule-reflections'].includes(event.target.id)) $('molecule-material-preset').value = '';
    showRenderValues();
    applyRenderSettings();
  });
  $('molecule-material-preset').addEventListener('change', event => {
    const preset = materialPresets[event.currentTarget.value];
    if (!preset) return;
    for (const [name, value] of Object.entries(preset)) $(`molecule-${name}`).value = value;
    showRenderValues();
    applyRenderSettings();
  });
  $('molecule-renderer').addEventListener('change', setRenderer);
  new ResizeObserver(() => { if (!exporting) sizeStudio(); }).observe($('molecule-canvas'));
  showRenderValues();
  applyRenderSettings();
  const stage = $('molecule-stage');
  $('molecule-fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement === stage) await document.exitFullscreen();
      else await stage.requestFullscreen();
    } catch (error) { message(`Fullscreen failed: ${error.message}`, true); }
  });
  document.addEventListener('fullscreenchange', () => {
    const active = document.fullscreenElement === stage;
    $('molecule-fullscreen').textContent = active ? 'Exit fullscreen' : 'Fullscreen';
    $('molecule-fullscreen').setAttribute('aria-pressed', String(active));
    requestAnimationFrame(() => { viewer?.resize(); viewer?.render(); sizeStudio(); });
  });
  window.addEventListener('resize', () => { if (!exporting) viewer?.resize(); });
  $('molecule-save').addEventListener('click', async () => {
    try {
      const requestedWidth = Number($('molecule-export-width').value);
      const image = await renderPng(requestedWidth);
      download(image.uri, 'molecule.png');
      message(`Saved ${image.width} × ${image.height} PNG.${image.width < requestedWidth * 0.98 ? ' Browser size limit reached.' : ''}`);
    } catch { message('High-resolution image export failed. Try 2000 px.', true); }
  });
  for (const [id, format] of [['molecule-save-svg', 'SVG'], ['molecule-save-pdf', 'PDF']]) $(id).addEventListener('click', async () => {
    const button = $(id);
    button.disabled = true;
    try {
      message(`Creating ${format}…`);
      const image = await renderPng(Number($('molecule-export-width').value));
      const blob = format === 'SVG' ? new Blob([imageSvg(image)], {type: 'image/svg+xml'}) : await imagePdf(image);
      downloadBlob(blob, `molecule.${format.toLowerCase()}`);
      message(`Saved ${image.width} × ${image.height} ${format} with the same 3D image as PNG.`);
    } catch (error) { message(`${format} export failed. Try 2000 px. ${error.message}`, true); }
    finally { button.disabled = false; }
  });
  for (const [id, format] of [['molecule-preview', 'preview'], ['molecule-save-gif', 'GIF'], ['molecule-save-video', 'video']]) $(id).addEventListener('click', async () => {
    if (format === 'preview' && cancelPreview) return cancelPreview();
    if (!hasModel) return;
    if (animationBusy) return;
    const controls = [...document.querySelectorAll('.molecule-tool button, .molecule-tool input, .molecule-tool select')];
    const disabled = controls.map(control => control.disabled);
    const canvas = viewer.getCanvas();
    const pointerEvents = canvas.style.pointerEvents;
    const spinning = $('molecule-spin').getAttribute('aria-pressed') === 'true';
    let view;
    try {
      const settings = animationSettings();
      if (format === 'video' && !webCodecs && !videoFormat) throw new Error('Video recording is unavailable in this browser.');
      if (format === 'GIF' && settings.width > gifMaxWidth) throw new Error(`GIF supports up to ${gifMaxWidth} px. Use Save video for larger sizes.`);
      animationBusy = true;
      viewer.spin(false);
      view = viewer.getView().slice();
      controls.forEach(control => { control.disabled = true; });
      if (format === 'preview') {
        $('molecule-preview').disabled = false;
        $('molecule-preview').textContent = 'Stop preview';
      }
      canvas.style.pointerEvents = 'none';
      message(format === 'preview' ? 'Previewing rotation…' : format === 'GIF' ? 'Creating GIF…' : 'Creating video…');
      if (format === 'preview') {
        const completed = await renderPreview(view, settings);
        message(completed ? 'Preview complete; original view restored.' : 'Preview stopped; original view restored.');
      } else {
        const {blob, extension, width, height} = await withExportSize(settings.width, async (source, size) => {
          const output = animationCanvas(source, size, format === 'GIF');
          const {width, height} = output.canvas;
          if (format === 'GIF') return {blob: await renderGif(view, settings, output), extension: 'gif', width, height};
          const encoding = await videoEncoding(width, height, settings.fps);
          if (encoding) return {blob: await encodeVideo(view, settings, output, encoding), extension: 'mp4', width, height};
          if (!videoFormat) throw new Error('This browser cannot encode video at this size. Try a smaller width.');
          return {blob: await recordVideo(view, settings, output), extension: videoFormat[1], width, height};
        });
        if (blob.size < 100) throw new Error('The recorded file is empty.');
        downloadBlob(blob, `molecule-rotation.${extension}`);
        message(`Saved ${settings.from}° to ${settings.to}° ${settings.motion === 'oscillate' ? 'back-and-forth motion' : 'rotation'} over ${settings.duration} s as ${width} × ${height} ${extension.toUpperCase()}${format === 'video' ? ` at ${settings.fps} fps` : ''}.`);
      }
    } catch (error) { message(`${format === 'preview' ? 'Preview' : format + ' export'} failed: ${error.message}`, true); }
    finally {
      cancelPreview = null;
      animationBusy = false;
      $('molecule-preview').textContent = 'Preview';
      if (view) {
        viewer.setView(view);
        viewer.render();
        if (spinning) viewer.spin('vy', -Number($('molecule-spin-speed').value));
      }
      canvas.style.pointerEvents = pointerEvents;
      controls.forEach((control, index) => { control.disabled = disabled[index]; });
    }
  });
}
