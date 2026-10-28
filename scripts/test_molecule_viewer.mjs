import assert from 'node:assert/strict';
import {parseLammps, moleculeStyle, boxEdges, exportDimensions, pngDimensions, imageSvg, animationAngle, videoBitrate, animationWidths, gifMaxWidth} from '../assets/molecule-viewer.mjs';
import {moleculeGeometry, lightDirection} from '../assets/molecule-scene.mjs';
import {GIFEncoder, quantize, applyPalette} from '../assets/gifenc.mjs';

const data = `LAMMPS data file

2 atoms
1 bonds

0 10 xlo xhi
0 10 ylo yhi
0 10 zlo zhi

Masses

1 12.011 # C
2 1.008 # H

Atoms # full

7 1 1 0 9.8 5 5 # C
2 1 2 0 0.2 5 5 # H

Bonds

1 1 7 2
`;

const parsed = parseLammps(data);
assert.equal(parsed.atoms.length, 2);
assert.equal(parsed.bondCount, 1);
assert.deepEqual(parsed.atoms.map(atom => atom.elem), ['C', 'H']);
assert.ok(Math.abs(parsed.atoms[1].x - parsed.atoms[0].x - 0.4) < 1e-9);
assert.deepEqual(parsed.atoms[0].bonds, [1]);
const edges = boxEdges(parsed.bounds);
assert.equal(edges.length, 12);
assert.deepEqual(edges[0], {start: {x: 0, y: 0, z: 0}, end: {x: 10, y: 0, z: 0}});
assert.equal(new Set(edges.flatMap(edge => [edge.start, edge.end].map(point => `${point.x},${point.y},${point.z}`))).size, 8);
assert.throws(() => parseLammps(data.replace('1 1 7 2', '1 1 7 99')), /invalid atom/);
assert.throws(() => parseLammps(data.replace('2 atoms', '3 atoms')), /Header says 3 atoms/);
assert.throws(() => parseLammps(data.replace('Atoms # full', 'Atoms # hybrid')), /Unsupported atom style/);

const atomic = parseLammps(`1 atoms\n\nMasses\n\n1 15.999\n\nAtoms # atomic\n\n1 1 0 0 0`);
assert.equal(atomic.atoms[0].elem, 'O');
assert.deepEqual(moleculeStyle('ball-stick', 1, 0.14, 'split', '#123456'), {stick: {radius: 0.14}, sphere: {scale: 0.28}});
assert.deepEqual(moleculeStyle('stick', 1.5, 0.2, 'solid', '#123456'), {stick: {radius: 0.2, color: '#123456'}});
assert.deepEqual(moleculeStyle('sphere', 2, 0.2, 'solid', '#123456'), {sphere: {scale: 1.3}});
assert.deepEqual(exportDimensions(800, 500, 4000), {width: 4000, height: 2500});
assert.throws(() => exportDimensions(0, 500, 4000), /Invalid export dimensions/);
const pngHeader = Buffer.alloc(24);
Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(pngHeader);
pngHeader.writeUInt32BE(13, 8);
pngHeader.write('IHDR', 12);
pngHeader.writeUInt32BE(6992, 16);
pngHeader.writeUInt32BE(4744, 20);
assert.deepEqual(pngDimensions(`data:image/png;base64,${pngHeader.toString('base64')}`), {width: 6992, height: 4744});
assert.throws(() => pngDimensions('data:image/png;base64,AAAA'), /PNG export failed/);
const png = {uri: 'data:image/png;base64,AAAA', width: 4000, height: 2700};
const svg = imageSvg(png);
assert.match(svg, /<image[^>]+href="data:image\/png;base64,AAAA"/);
assert.match(svg, /width="4000" height="2700"/);
assert.doesNotMatch(svg, /<circle|<line/);
assert.throws(() => imageSvg({...png, uri: 'https://example.com/image.png'}), /Invalid PNG/);
const oscillate = {from: 0, to: 30, motion: 'oscillate'};
assert.deepEqual([0, .25, .5, .75, 1].map(progress => animationAngle(progress, oscillate)), [0, 15, 30, 15, 0]);
assert.deepEqual([0, .5, 1].map(progress => animationAngle(progress, {from: -20, to: 40, motion: 'one-way'})), [-20, 10, 40]);
const ethene = [
  {index: 0, elem: 'C', x: 0, y: 0, z: 0, color: '#909090', bonds: [1, 2], bondOrder: [2, 1]},
  {index: 1, elem: 'C', x: 1.34, y: 0, z: 0, color: '#909090', bonds: [0], bondOrder: [2]},
  {index: 2, elem: 'O', x: -0.7, y: 1.2, z: 0, color: '#ff0d0d', bonds: [0], bondOrder: [1]},
];
const ballStick = moleculeGeometry(ethene, {kind: 'ball-stick', atomSize: 1, bondRadius: 0.14, bondMode: 'split', bondColor: '#b0b0b0'}, {C: 1.7, O: 1.52});
assert.equal(ballStick.spheres.length, 3);
assert.ok(Math.abs(ballStick.spheres[0].radius - 1.7 * 0.28) < 1e-12);
assert.equal(ballStick.cylinders.length, 4); // double C=C as two same-color sticks, C–O split into two colors
const doubleBond = ballStick.cylinders.filter(cylinder => cylinder.color === '#909090' && Math.abs(cylinder.radius - 0.14 / 2.5) < 1e-12);
assert.equal(doubleBond.length, 2);
assert.ok(Math.abs(Math.abs(doubleBond[0].start[1] - doubleBond[1].start[1]) - 2 * 0.14 / 2.5 * 1.5) < 1e-9); // offset in the molecular plane
const solidSticks = moleculeGeometry(ethene, {kind: 'stick', atomSize: 1, bondRadius: 0.2, bondMode: 'solid', bondColor: '#123456'}, {});
assert.ok(solidSticks.cylinders.every(cylinder => cylinder.color === '#123456'));
assert.equal(solidSticks.spheres.length, 3);
assert.equal(moleculeGeometry(ethene, {kind: 'sphere', atomSize: 2, bondRadius: 0.14, bondMode: 'split', bondColor: '#b0b0b0'}, {}).cylinders.length, 0);
assert.deepEqual(lightDirection(0, 0).map(v => Math.round(v * 1e12) / 1e12), [0, 0, 1]);
assert.deepEqual(lightDirection(90, 0).map(v => Math.round(v * 1e12) / 1e12), [1, 0, 0]);
assert.deepEqual(lightDirection(0, 90).map(v => Math.round(v * 1e12) / 1e12), [0, 1, 0]);
assert.equal(videoBitrate(640, 360, 24), 8e6);
assert.equal(videoBitrate(3840, 2160, 30), 37324800);
assert.equal(videoBitrate(3840, 2160, 60), 74649600);
assert.equal(videoBitrate(7680, 4320, 60), 80e6);
assert.ok(animationWidths.includes(3840) && animationWidths.includes(gifMaxWidth));
const rgba = new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 0, 255]);
const palette = quantize(rgba, 256);
const gif = GIFEncoder();
gif.writeFrame(applyPalette(rgba, palette), 2, 1, {palette, delay: 100});
gif.writeFrame(applyPalette(rgba, palette), 2, 1, {palette, delay: 100});
gif.finish();
assert.equal(Buffer.from(gif.bytes().subarray(0, 6)).toString(), 'GIF89a');
assert.equal(gif.bytes().at(-1), 0x3b);
console.log('Molecule parser, style, and export checks passed');
