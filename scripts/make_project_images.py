"""Draw the molecule images on the homepage project cards.

    python3 scripts/make_project_images.py      # needs RDKit (pip install rdkit)

Writes transparent SVGs to assets/projects/. The molecules are well-known,
published antioxidants and additives used as illustrations; none comes from
unpublished results.
"""
from pathlib import Path

from rdkit import Chem
from rdkit.Chem import Draw, rdDepictor
from rdkit.Chem.Draw import rdMolDraw2D

OUT = Path(__file__).resolve().parents[1] / "assets" / "projects"
rdDepictor.SetPreferCoordGen(True)


def options(drawer_options):
    drawer_options.clearBackground = False  # transparent, so it sits on any page color
    drawer_options.bondLineWidth = 2
    drawer_options.padding = 0.06
    drawer_options.additionalAtomLabelPadding = 0.1
    drawer_options.legendFontSize = 17
    return drawer_options


def save(path, svg):
    svg = svg.replace("<?xml version='1.0' encoding='iso-8859-1'?>\n", "")
    path.write_text(svg)
    print("wrote", path.relative_to(OUT.parents[1]))


def single(name, smiles, size, highlights=None, coordgen=True):
    rdDepictor.SetPreferCoordGen(coordgen)
    mol = Chem.MolFromSmiles(smiles)
    rdDepictor.Compute2DCoords(mol)
    rdDepictor.SetPreferCoordGen(True)
    drawer = rdMolDraw2D.MolDraw2DSVG(*size)
    options(drawer.drawOptions())
    atoms, colors = [], {}
    for color, pattern in highlights or []:
        for match in mol.GetSubstructMatches(Chem.MolFromSmarts(pattern)):
            for idx in match:
                atoms.append(idx)
                colors[idx] = color
    rdMolDraw2D.PrepareAndDrawMolecule(drawer, mol, highlightAtoms=atoms, highlightAtomColors=colors,
                                       highlightBonds=[])
    drawer.FinishDrawing()
    save(OUT / name, drawer.GetDrawingText())


def grid(name, entries, per_row, cell):
    mols = [Chem.MolFromSmiles(s) for _, s in entries]
    opts = options(rdMolDraw2D.MolDrawOptions())
    svg = Draw.MolsToGridImage(mols, molsPerRow=per_row, subImgSize=cell, legends=[n for n, _ in entries],
                               useSVG=True, drawOptions=opts)
    save(OUT / name, svg)


SHIELD = (0.80, 0.88, 1.00)    # soft blue: tert-butyl groups that shield the oxygen
REACTIVE = (1.00, 0.78, 0.74)  # soft red: the reactive phenolic oxygen

# Generative AI card: a hindered phenol (BHT), with its reactive O-H oxygen and the
# shielding ortho-tert-butyl groups highlighted.
single("hindered-phenol.svg", "Cc1cc(C(C)(C)C)c(O)c(C(C)(C)C)c1", (260, 230),
       highlights=[(SHIELD, "[CX4](C)(C)(C)c"), (REACTIVE, "[OX2H]")])

# Additive interactions card: two different kinds of lubricant additive, an antioxidant
# (2,6-di-tert-butylphenol) and a friction modifier (glycerol monooleate).
single("additive-pair.svg", "CC(C)(C)c1cccc(C(C)(C)C)c1O.CCCCCCCC/C=C\\CCCCCCCC(=O)OCC(O)CO", (340, 200),
       coordgen=False)

# Literature-mining card: antioxidants widely reported in the literature.
grid("literature-antioxidants.svg", [
    ("propyl gallate", "CCCOC(=O)c1cc(O)c(O)c(O)c1"),
    ("TBHQ", "CC(C)(C)c1cc(O)ccc1O"),
    ("phenothiazine", "c1ccc2c(c1)Nc1ccccc1S2"),
    ("4-methoxyphenol", "COc1ccc(O)cc1"),
], per_row=2, cell=(150, 125))
