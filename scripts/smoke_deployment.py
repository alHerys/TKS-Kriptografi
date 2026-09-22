"""Check the deployed API using known vectors, traces, and exact Python source."""

import json
from pathlib import Path
import sys
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {
    "caesar": ("KDOR GXQLD", "HALO DUNIA"),
    "vigenere": ("LXFOPV EF RNHR", "ATTACK AT DAWN"),
    "substitution": ("IQSG RXFOQ", "HALO DUNIA"),
    "transposition": ("OLXLOXEWXLRXH_D", "HELLO WORLD"),
    "playfair": ("IBSUPMNA", "BALXLOON"),
}


def check_deployment(base_url):
    def request(path, data=None):
        payload = None if data is None else json.dumps(data).encode()
        req = Request(base_url.rstrip("/") + path, data=payload,
                      headers={"Content-Type": "application/json"})
        with urlopen(req, timeout=30) as response:
            return json.load(response)

    catalog = request("/api/algorithms")
    assert len(catalog) == len(EXPECTED)
    assert {item["id"] for item in catalog} == set(EXPECTED)
    for item in catalog:
        algorithm = item["id"]
        encrypted, decrypted = EXPECTED[algorithm]
        for mode, text, expected in (
            ("encrypt", item["text"], encrypted),
            ("decrypt", encrypted, decrypted),
        ):
            result = request("/api/run", dict(
                algorithm=algorithm, mode=mode, text=text, key=item["key"],
            ))
            assert result["output"] == expected, (algorithm, mode, result["output"])
            assert result["steps"][-1]["output"] == expected
            assert result["steps"][-1]["phase"] == "result"
        source = request("/api/source/" + algorithm)
        path = (ROOT / source["path"]).resolve()
        assert path.is_relative_to(ROOT / "algorithms")
        assert source["code"] == path.read_text(encoding="utf-8"), algorithm
        print(f"{algorithm}: encryption, decryption, traces and source OK")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python scripts/smoke_deployment.py https://app.example.com")
    check_deployment(sys.argv[1])
