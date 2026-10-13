from rdkit import Chem

from app import app


client = app.test_client()
origin = {"Origin": "https://sahmed73.github.io"}

response = client.post("/api/smiles-3d", json={"smiles": "CCO"}, headers=origin)
assert response.status_code == 200
assert response.headers["Access-Control-Allow-Origin"] == origin["Origin"]
mol = Chem.MolFromMolBlock(response.json["sdf"], removeHs=False)
assert mol is not None and mol.GetNumAtoms() == 9 and mol.GetConformer().Is3D()
assert "MMFF94" in response.json["method"]

assert client.options("/api/smiles-3d", headers=origin).status_code == 204
assert client.post("/api/smiles-3d", json={"smiles": "not a smiles"}).status_code == 422
assert client.post("/api/smiles-3d", json={"smiles": "C" * 100}).status_code == 422
assert client.post("/api/smiles-3d", json={"smiles": "C" * 501}).status_code == 422
assert client.post("/api/smiles-3d", data="x" * 2049, content_type="application/json").status_code == 413
assert "Access-Control-Allow-Origin" not in client.post("/api/smiles-3d", json={"smiles": "CCO"}, headers={"Origin": "https://example.com"}).headers
print("RDKit API checks passed")
