import pytest
from fastapi.testclient import TestClient

from web.app import app, ROOT, SOURCES

client = TestClient(app)


def test_all_catalog_examples_both_directions():
    catalog = client.get("/api/algorithms").json()
    assert len(catalog) == 5
    for item in catalog:
        response = client.post("/api/run", json=dict(algorithm=item["id"], mode="encrypt", text=item["text"], key=item["key"]))
        assert response.status_code == 200
        run = response.json()
        assert run["output"] == item["ciphertext"]
        assert run["steps"][-1]["output"] == run["output"]
        response = client.post("/api/run", json=dict(algorithm=item["id"], mode="decrypt", text=run["output"], key=item["key"]))
        assert response.status_code == 200
        assert response.json()["steps"][-1]["phase"] == "result"


@pytest.mark.parametrize("changes,field", [
    ({"algorithm": "unknown"}, "algorithm"), ({"mode": "unknown"}, "mode"),
    ({"key": True}, "key"), ({"key": 1.5}, "key"), ({"key": "three"}, "key"),
    ({"text": ""}, "text"), ({"text": "A" * 201}, "text"), ({"text": "café"}, "text"),
    ({"algorithm": "vigenere", "key": ""}, "key"),
    ({"algorithm": "vigenere", "key": "ß"}, "key"),
    ({"algorithm": "substitution", "key": "A" * 26}, "key"),
    ({"algorithm": "playfair", "key": "KEY", "text": "123"}, "text"),
    ({"algorithm": "playfair", "key": "KEY", "text": "ABC", "mode": "decrypt"}, "text"),
    ({"algorithm": "transposition", "key": "KEY", "text": "AB", "mode": "decrypt"}, "text"),
])
def test_invalid_input(changes, field):
    data = dict(algorithm="caesar", mode="encrypt", text="HELLO", key=3)
    data.update(changes)
    response = client.post("/api/run", json=data)
    assert response.status_code == 422
    assert field in response.json()["detail"][0]["loc"]


def test_random_key_has_no_server_session_dependency():
    key = client.post("/api/substitution/key").json()["key"]
    assert set(key) == set("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    cipher = client.post("/api/run", json=dict(algorithm="substitution", mode="encrypt", text="HELLO", key=key)).json()["output"]
    fresh_client = TestClient(app)
    assert fresh_client.post("/api/run", json=dict(algorithm="substitution", mode="decrypt", text=cipher, key=key)).json()["output"] == "HELLO"


def test_legacy_source_is_exact_and_allowlisted():
    assert SOURCES == {
        "caesar": "legacy/Caesar/caesar.py",
        "vigenere": "legacy/Vigenere/vigenere.py",
        "substitution": "legacy/Substitution/python/Substitution.py",
        "transposition": "legacy/Transposition/transposition.py",
        "playfair": "legacy/playfair/playfair.py",
    }
    for algorithm, path in SOURCES.items():
        response = client.get("/api/source/" + algorithm)
        assert response.status_code == 200
        assert response.json() == dict(path=path, code=(ROOT / path).read_text())
    for path in ["requirements.txt", "unknown", "..%2Frequirements.txt"]:
        assert client.get("/api/source/" + path).status_code == 404
