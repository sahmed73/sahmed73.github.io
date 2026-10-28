// Geometry for the studio renderer. Mirrors how 3Dmol 2.0.4 draws ball-and-stick,
// stick, and space-filling styles so both renderers show the same structure.

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const lengthSq = a => a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
const normalize = a => scale(a, 1 / Math.sqrt(lengthSq(a)));
const point = atom => [atom.x, atom.y, atom.z];

function fallbackPerpendicular(dir) {
  const v = [...dir];
  if (Math.abs(v[0]) > 0.0001) v[1] += 1;
  else v[0] += 1;
  return v;
}

// Direction in which double and triple bonds are offset: in the plane of a neighboring atom, as in 3Dmol's getSideBondV.
export function sideVector(atom, atom2, byIndex) {
  const p1 = point(atom);
  const dir = sub(point(atom2), p1);
  let best = [0, 0, 0];
  for (const [owner, other] of [[atom, atom2], [atom2, atom]]) {
    for (const index of owner.bonds) {
      if (index === other.index) continue;
      const neighbor = byIndex.get(index);
      if (!neighbor) continue;
      const v = cross(sub(point(neighbor), p1), dir);
      if (lengthSq(v) > lengthSq(best)) best = v;
    }
    if (lengthSq(best) >= 0.01) break;
  }
  if (lengthSq(best) < 0.01) best = fallbackPerpendicular(dir);
  return normalize(cross(best, dir));
}

function elementRadius(elem, radii) {
  if (radii[elem] !== undefined) return radii[elem];
  const titled = elem.length > 1 ? elem[0].toUpperCase() + elem.slice(1).toLowerCase() : elem;
  return radii[titled] ?? 1.5;
}

function addBond(cylinders, a, b, radius, color1, color2) {
  if (color1 === color2) {
    cylinders.push({start: a, end: b, radius, color: color1});
    return;
  }
  const middle = scale(add(a, b), 0.5);
  cylinders.push({start: a, end: middle, radius, color: color1}, {start: middle, end: b, radius, color: color2});
}

export function moleculeGeometry(atoms, {kind, atomSize, bondRadius, bondMode, bondColor}, radii) {
  const spheres = [];
  const cylinders = [];
  if (kind !== 'stick') {
    const factor = (kind === 'sphere' ? 0.65 : 0.28) * atomSize;
    for (const atom of atoms) spheres.push({center: point(atom), radius: elementRadius(atom.elem, radii) * factor, color: atom.color});
  }
  if (kind === 'sphere') return {spheres, cylinders};

  const byIndex = new Map(atoms.map(atom => [atom.index, atom]));
  const stickColor = atom => bondMode === 'solid' ? bondColor : atom.color;
  for (const atom of atoms) {
    atom.bonds.forEach((index, position) => {
      const atom2 = byIndex.get(index);
      if (!atom2 || atom.index >= atom2.index) return;
      const order = atom.bondOrder?.[position] ?? 1;
      const p1 = point(atom);
      const p2 = point(atom2);
      const color1 = stickColor(atom);
      const color2 = stickColor(atom2);
      if (order <= 1 || order > 3) {
        addBond(cylinders, p1, p2, order < 1 ? bondRadius * order : bondRadius, color1, color2);
      } else if (order === 2) {
        const radius = bondRadius / 2.5;
        const offset = scale(sideVector(atom, atom2, byIndex), radius * 1.5);
        addBond(cylinders, add(p1, offset), add(p2, offset), radius, color1, color2);
        addBond(cylinders, sub(p1, offset), sub(p2, offset), radius, color1, color2);
      } else {
        const radius = bondRadius / 4;
        const offset = scale(normalize(cross(sideVector(atom, atom2, byIndex), sub(p2, p1))), radius * 3);
        addBond(cylinders, add(p1, offset), add(p2, offset), radius, color1, color2);
        addBond(cylinders, p1, p2, radius, color1, color2);
        addBond(cylinders, sub(p1, offset), sub(p2, offset), radius, color1, color2);
      }
    });
  }
  if (kind === 'stick') {
    for (const atom of atoms) if (atom.bonds.length) spheres.push({center: point(atom), radius: bondRadius, color: stickColor(atom)});
  }
  return {spheres, cylinders};
}

// Light direction in camera space: azimuth turns right of the viewer, elevation tilts up; +z points toward the viewer.
export function lightDirection(azimuth, elevation) {
  const a = azimuth * Math.PI / 180;
  const e = elevation * Math.PI / 180;
  return [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)];
}
