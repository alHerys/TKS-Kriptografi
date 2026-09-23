"""Keep the archived CLIs usable without installing the web dependencies."""

import ast
import importlib.util
from pathlib import Path
import subprocess
import sys

import pytest

ROOT = Path(__file__).resolve().parents[1]
LEGACY = ROOT / "legacy"


@pytest.mark.parametrize("path,input_text,expected", [
    ("Caesar/main.py", "1\nHALO DUNIA\n3\n3\n", "KDOR GXQLD"),
    ("Caesar/main.py", "2\nKDOR GXQLD\n3\n3\n", "HALO DUNIA"),
    ("Vigenere/main.py", "ATTACK AT DAWN\nLEMON\n1\n", "LXFOPV EF RNHR"),
    ("Vigenere/main.py", "LXFOPV EF RNHR\nLEMON\n2\n", "ATTACK AT DAWN"),
    ("Substitution/python/main.py", "1\nHALO DUNIA\n5\n", "Key      :"),
    ("Substitution/python/main.py", "2\nIQSG RXFOQ\nQWERTYUIOPASDFGHJKLZXCVBNM\n5\n", "Dekripsi : HALO DUNIA"),
    ("Transposition/main.py", "1\nHELLO WORLD\nZEBRA\n3\n", "OLXLOXEWXLRXH_D"),
    ("Transposition/main.py", "2\nOLXLOXEWXLRXH_D\nZEBRA\n3\n", "HELLO WORLD"),
    ("playfair/playfair.py", "MONARCHY\nBALLOON\n", "Decrypted: BALXLOON"),
])
def test_legacy_cli_without_site_packages(path, input_text, expected, tmp_path):
    completed = subprocess.run(
        [sys.executable, "-S", "-B", str(LEGACY / path)], input=input_text,
        text=True, capture_output=True, cwd=tmp_path, timeout=5,
    )
    assert completed.returncode == 0, completed.stderr
    assert expected in completed.stdout


@pytest.mark.parametrize("path", [
    "Caesar/caesar.py", "Vigenere/vigenere.py", "Substitution/python/Substitution.py",
    "Transposition/transposition.py", "playfair/playfair.py",
])
def test_legacy_algorithms_have_no_web_or_trace_dependencies(path):
    tree = ast.parse((LEGACY / path).read_text())
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            assert all(alias.name.split(".")[0] in sys.stdlib_module_names for alias in node.names)
        elif isinstance(node, ast.ImportFrom):
            assert node.module.split(".")[0] in sys.stdlib_module_names
        elif isinstance(node, ast.FunctionDef):
            assert node.name != "_record"
            assert "steps" not in [arg.arg for arg in node.args.args]


def test_legacy_playfair_vectors_and_preparation():
    spec = importlib.util.spec_from_file_location("legacy_playfair", LEGACY / "playfair/playfair.py")
    playfair = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(playfair)
    assert playfair.encrypt("Hide the gold in the tree stump", "playfair example") == "BMODZBXDNABEKUDMUIXMMOUVIF"
    assert playfair.encrypt("BALLOON", "MONARCHY") == "IBSUPMNA"
    for text, restored in [("", ""), ("X", "XQ"), ("XX", "XQXQ"), ("Jig!", "IXIG")]:
        assert playfair.decrypt(playfair.encrypt(text, "MONARCHY"), "MONARCHY") == restored
    with pytest.raises(ValueError):
        playfair.decrypt("ABC", "MONARCHY")
