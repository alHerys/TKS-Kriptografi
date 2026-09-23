"""HTTP adapter only. All cryptographic calculations live in their own files."""

from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, StrictInt, StrictStr

from algorithms.Caesar import caesar
from algorithms.Vigenere import vigenere
from algorithms.Transposition import transposition
from algorithms.Substitution.python.Substitution import Substitution
from algorithms.playfair import playfair

ROOT = Path(__file__).resolve().parents[1]
Algorithm = Literal["caesar", "vigenere", "substitution", "transposition", "playfair"]
SOURCES = {
    "caesar": "legacy/Caesar/caesar.py",
    "vigenere": "legacy/Vigenere/vigenere.py",
    "substitution": "legacy/Substitution/python/Substitution.py",
    "transposition": "legacy/Transposition/transposition.py",
    "playfair": "legacy/playfair/playfair.py",
}
CATALOG = [
    dict(id="caesar", name="Caesar", category="Pergeseran alfabet", key_type="number",
         description="Satu kunci, satu pergeseran. Ikuti perjalanan setiap huruf pada alfabet.",
         key_hint="Bilangan bulat; boleh negatif. Pergeseran dihitung modulo 26.",
         text="HALO DUNIA", key=3,
         notes=["Huruf besar/kecil dipertahankan. Spasi dan tanda baca tidak berubah."]),
    dict(id="vigenere", name="Vigenere", category="Kunci yang berulang", key_type="text",
         description="Setiap huruf punya pergeseran sendiri, mengikuti kunci yang berulang.",
         key_hint="Huruf A-Z, maksimal 32 karakter.", text="ATTACK AT DAWN", key="LEMON",
         notes=["Kunci hanya maju saat memproses huruf. Kapitalisasi pesan dipertahankan."]),
    dict(id="substitution", name="Substitution", category="Peta pengganti huruf", key_type="text",
         description="Baca hubungan antara dua alfabet. Satu huruf selalu punya pengganti yang sama.",
         key_hint="26 huruf A-Z, setiap huruf tepat satu kali.", text="HALO DUNIA",
         key="QWERTYUIOPASDFGHJKLZXCVBNM",
         notes=["Pesan diubah menjadi huruf kapital. Simpan kunci yang sama untuk dekripsi."]),
    dict(id="transposition", name="Transposition", category="Susun ulang posisi", key_type="text",
         description="Hurufnya tetap. Posisinya berubah ketika matriks dibaca menurut urutan kunci.",
         key_hint="Huruf A-Z, maksimal 32 karakter. Huruf kembar diperbolehkan.", text="HELLO WORLD", key="ZEBRA",
         notes=["Spasi menjadi _ dan baris terakhir dilengkapi X.",
                "Kode lama mengubah seluruh _ menjadi spasi dan membuang semua X di akhir, termasuk X asli."]),
    dict(id="playfair", name="Playfair", category="Pasangan dalam matriks", key_type="text",
         description="Dua huruf, tiga aturan. Temukan jalur setiap pasangan di dalam matriks 5 × 5.",
         key_hint="Huruf dan spasi, maksimal 32 karakter. Huruf J digabung dengan I.", text="BALLOON", key="MONARCHY",
         notes=["Spasi/tanda baca diabaikan; J menjadi I.",
                "Filler X (atau Q setelah X) tetap disimpan saat dekripsi."]),
]


def calculate(algorithm, mode, text, key, steps=None):
    if algorithm == "substitution":
        cipher = Substitution(key)
        return (cipher.enkripsi if mode == "encrypt" else cipher.dekripsi)(text, steps=steps)
    functions = {
        "caesar": (caesar.encrypt, caesar.decrypt),
        "vigenere": (vigenere.enkripsi_vigenere, vigenere.dekripsi_vigenere),
        "transposition": (transposition.encrypt, transposition.decrypt),
        "playfair": (playfair.encrypt, playfair.decrypt),
    }
    return functions[algorithm][mode == "decrypt"](text, key, steps=steps)


class RunRequest(BaseModel):
    algorithm: Algorithm
    mode: Literal["encrypt", "decrypt"]
    text: str = Field(min_length=1, max_length=200)
    key: StrictInt | StrictStr


def invalid(field, message):
    raise HTTPException(422, detail=[dict(loc=["body", field], msg=message, type="value_error")])


def validate(request):
    if any(not (32 <= ord(char) <= 126 or char in "\n\r\t") for char in request.text):
        invalid("text", "Gunakan karakter ASCII: huruf A-Z, angka, spasi, atau tanda baca.")
    if request.algorithm == "caesar":
        if type(request.key) is not int:
            invalid("key", "Kunci Caesar harus berupa bilangan bulat.")
        return request.key
    if not isinstance(request.key, str) or not request.key or len(request.key) > 32:
        invalid("key", "Kunci harus berisi 1 sampai 32 karakter.")
    if not request.key.isascii():
        invalid("key", "Gunakan huruf ASCII A-Z untuk kunci.")
    key = request.key.upper()
    if request.algorithm == "substitution":
        if len(key) != 26 or set(key) != set(Substitution.FINAL_STRING):
            invalid("key", "Gunakan tepat 26 huruf A-Z tanpa duplikasi.")
    elif request.algorithm == "playfair":
        if not key.isascii() or any(not ("A" <= char <= "Z" or char == " ") for char in key) or not key.strip():
            invalid("key", "Kunci Playfair hanya berisi huruf A-Z dan spasi, dengan minimal satu huruf.")
        text = playfair.normalize(request.text)
        if not text:
            invalid("text", "Pesan Playfair harus mengandung huruf A-Z.")
        if request.mode == "decrypt" and len(text) % 2:
            invalid("text", "Ciphertext Playfair harus berisi jumlah huruf genap.")
    elif not key.isascii() or not key.isalpha():
        invalid("key", "Kunci harus berisi huruf A-Z saja.")
    if request.algorithm == "transposition" and request.mode == "decrypt" and len(request.text) % len(key):
        invalid("text", "Panjang ciphertext harus merupakan kelipatan panjang kunci.")
    return key


app = FastAPI(title="Lab Kriptografi", description="Visualisasi dari perhitungan Python yang sebenarnya.")


@app.get("/api/algorithms")
def algorithms():
    return [dict(item, ciphertext=calculate(item["id"], "encrypt", item["text"], item["key"])) for item in CATALOG]


@app.post("/api/run")
def run(request: RunRequest):
    key = validate(request)
    steps = []
    output = calculate(request.algorithm, request.mode, request.text, key, steps)
    normalized_text = next((step["data"]["text"] for step in steps if step["kind"] == "normalize"), request.text)
    normalized_key = key % 26 if request.algorithm == "caesar" else playfair.normalize(key) if request.algorithm == "playfair" else key
    return dict(algorithm=request.algorithm, mode=request.mode, input=request.text,
                normalized_text=normalized_text, key=key, normalized_key=normalized_key,
                output=output, steps=steps,
                notes=next(item["notes"] for item in CATALOG if item["id"] == request.algorithm))


@app.post("/api/substitution/key")
def substitution_key():
    return dict(key=Substitution().key)


@app.get("/api/source/{algorithm}")
def source(algorithm: str):
    if algorithm not in SOURCES:
        raise HTTPException(404, "Algoritma tidak ditemukan.")
    path = SOURCES[algorithm]
    return dict(path=path, code=(ROOT / path).read_text(encoding="utf-8"))


DIST = ROOT / "frontend" / "dist"
if (DIST / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")


@app.get("/", include_in_schema=False)
def index():
    if not (DIST / "index.html").is_file():
        raise HTTPException(503, "Frontend belum dibangun. Jalankan npm run build di frontend/.")
    return FileResponse(DIST / "index.html")
