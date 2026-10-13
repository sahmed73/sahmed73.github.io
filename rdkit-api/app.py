"""RDKit conformer endpoint for the molecule viewer."""

from flask import Flask, jsonify, request
from rdkit import Chem
from rdkit.Chem import AllChem


app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 2048
ORIGINS = {"https://sahmed73.github.io", "http://127.0.0.1:8766"}


@app.after_request
def allow_viewer(response):
    origin = request.headers.get("Origin")
    if origin in ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        response.headers["Vary"] = "Origin"
    response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/health")
def health():
    return jsonify(ok=True)


@app.route("/api/smiles-3d", methods=["POST", "OPTIONS"])
def smiles_to_3d():
    if request.method == "OPTIONS":
        return "", 204
    if not request.is_json:
        return jsonify(error="Send JSON with a SMILES string."), 415
    body = request.get_json(silent=True)
    smiles = body.get("smiles") if isinstance(body, dict) else None
    if not isinstance(smiles, str) or not 0 < len(smiles) <= 500:
        return jsonify(error="Enter a SMILES string of 1–500 characters."), 422

    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return jsonify(error="RDKit could not parse this SMILES."), 422
    mol = Chem.AddHs(mol)
    if mol.GetNumAtoms() > 150:
        return jsonify(error="RDKit supports up to 150 atoms per SMILES here."), 422

    params = AllChem.ETKDGv3()
    params.randomSeed = 61453
    params.maxIterations = 200
    if AllChem.EmbedMolecule(mol, params) != 0:
        return jsonify(error="RDKit could not generate a 3D conformer."), 422

    method = "ETKDGv3"
    if AllChem.MMFFHasAllMoleculeParams(mol):
        status = AllChem.MMFFOptimizeMolecule(mol, maxIters=500)
        method += " + MMFF94" + (" (iteration limit)" if status else "")
    elif AllChem.UFFHasAllMoleculeParams(mol):
        status = AllChem.UFFOptimizeMolecule(mol, maxIters=500)
        method += " + UFF" + (" (iteration limit)" if status else "")
    return jsonify(sdf=Chem.MolToMolBlock(mol) + "\n$$$$\n", method=method)
