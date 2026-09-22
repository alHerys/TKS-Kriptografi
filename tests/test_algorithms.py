import ast
import importlib.util
import subprocess
import sys
from pathlib import Path

import pytest

from algorithms.Caesar import caesar
from algorithms.Vigenere import vigenere
from algorithms.Substitution.python.Substitution import Substitution
from algorithms.Transposition import transposition
from algorithms.playfair import playfair

ROOT = Path(__file__).resolve().parents[1]
KEY = "QWERTYUIOPASDFGHJKLZXCVBNM"


@pytest.mark.parametrize("encrypt,decrypt,text,key,cipher,restored", [
    (caesar.encrypt, caesar.decrypt, "Hello, Z!", 3, "Khoor, C!", "Hello, Z!"),
    (caesar.encrypt, caesar.decrypt, "AbZ", -1, "ZaY", "AbZ"),
    (vigenere.enkripsi_vigenere, vigenere.dekripsi_vigenere,
     "ATTACK AT DAWN", "LEMON", "LXFOPV EF RNHR", "ATTACK AT DAWN"),
    (vigenere.enkripsi_vigenere, vigenere.dekripsi_vigenere,
     "a!b?z", "BC", "b!d?a", "a!b?z"),
    (transposition.encrypt, transposition.decrypt,
     "WEAREDISCOVEREDFLEEATONCE", "ZEBRAS", "EVLNXACDTXESEAXROFOXDEECXWIREE", "WEAREDISCOVEREDFLEEATONCE"),
    (transposition.encrypt, transposition.decrypt,
     "ABCDEF", "ABA", "ADCFBE", "ABCDEF"),
    (playfair.encrypt, playfair.decrypt, "Hide the gold in the tree stump",
     "playfair example", "BMODZBXDNABEKUDMUIXMMOUVIF", "HIDETHEGOLDINTHETREXESTUMP"),
    (playfair.encrypt, playfair.decrypt, "BALLOON", "MONARCHY", "IBSUPMNA", "BALXLOON"),
])
def test_vectors_and_trace(encrypt, decrypt, text, key, cipher, restored):
    for fn, source, expected in [(encrypt, text, cipher), (decrypt, cipher, restored)]:
        steps = []
        assert fn(source, key) == expected
        assert fn(source, key, steps=steps) == expected
        assert steps[-1]["output"] == expected
        assert {step["phase"] for step in steps} == {"prepare", "process", "result"}


def test_substitution_key_and_trace():
    cipher = Substitution(KEY)
    steps = []
    assert cipher.enkripsi("Hello!", steps) == "ITSSG!"
    assert cipher.dekripsi("ITSSG!") == "HELLO!"
    assert cipher.dekripsi_dengan_key("ITSSG!", KEY) == "HELLO!"
    assert steps[-1]["output"] == "ITSSG!"
    assert len(cipher.generate_key()) == 26
    assert set(cipher.generate_key()) == set(cipher.FINAL_STRING)
    with pytest.raises(ValueError):
        Substitution("A" * 26).enkripsi("HELLO")


@pytest.mark.parametrize("pair,encrypted,rule", [
    ("AB", "BC", "row"), ("EA", "AB", "row"),
    ("AF", "FL", "column"), ("VA", "AF", "column"),
    ("AG", "BF", "rectangle"),
])
def test_playfair_rules(pair, encrypted, rule):
    steps = []
    assert playfair.encrypt(pair, "", steps) == encrypted
    process = next(step for step in steps if step["phase"] == "process")
    assert process["data"]["rule"] == rule
    assert playfair.decrypt(encrypted, "") == pair


@pytest.mark.parametrize("text,prepared", [("", ""), ("X", "XQ"), ("XX", "XQXQ"), ("Jig!", "IXIG")])
def test_playfair_preparation(text, prepared):
    assert playfair.decrypt(playfair.encrypt(text, "MONARCHY"), "MONARCHY") == prepared


def test_transposition_legacy_cleanup_and_snapshots():
    text = "HELLO X"
    cipher = transposition.encrypt(text, "ZEBRA")
    steps = []
    assert transposition.decrypt(cipher, "ZEBRA", steps) == "HELLO "
    assert "X asli" in steps[-1]["explanation"]
    assert transposition.decrypt(transposition.encrypt("A_B", "KEY"), "KEY") == "A B"
    fill = [step for step in steps if step["kind"] == "fill"]
    assert sum(bool(c) for c in fill[0]["data"]["grid"]) == 1
    assert sum(bool(c) for c in fill[-1]["data"]["grid"]) == len(cipher)


@pytest.mark.parametrize("path", ["algorithms/Caesar/caesar.py", "algorithms/Vigenere/vigenere.py", "algorithms/playfair/playfair.py",
                                 "algorithms/Transposition/transposition.py", "algorithms/Substitution/python/Substitution.py"])
def test_single_file_standard_library_only(path):
    content = (ROOT / path).read_text()
    for node in ast.walk(ast.parse(content)):
        if isinstance(node, ast.Import):
            assert all(alias.name.split('.')[0] in sys.stdlib_module_names for alias in node.names)
        elif isinstance(node, ast.ImportFrom):
            assert node.module.split('.')[0] in sys.stdlib_module_names
    spec = importlib.util.spec_from_file_location("standalone", ROOT / path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)


@pytest.mark.parametrize("path,input_text,expected", [
    ("algorithms/Caesar/main.py", "3\n", "Terima kasih"),
    ("algorithms/Vigenere/main.py", "ABC\nB\n1\n", "BCD"),
    ("algorithms/Transposition/main.py", "3\n", "Bye bye"),
    ("algorithms/Substitution/python/main.py", "5\n", "TERIMA KASIH"),
    ("algorithms/playfair/playfair.py", "MONARCHY\nBALLOON\n", "IBSUPMNA"),
])
def test_cli(path, input_text, expected):
    completed = subprocess.run([sys.executable, "-B", str(ROOT / path)], input=input_text,
                               text=True, capture_output=True, timeout=5)
    assert completed.returncode == 0, completed.stderr
    assert expected in completed.stdout
