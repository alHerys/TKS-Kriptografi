"""Columnar transposition. Keeps the original underscore / trailing-X cleanup."""

import math


def _record(steps, phase, kind, title, explanation, data, output=""):
    if steps is not None:
        steps.append(dict(phase=phase, kind=kind, title=title,
                          explanation=explanation, data=data, output=output))


def get_keyword_order(key: str) -> list[int]:
    # Huruf kunci yang sama tetap berurutan dari kiri ke kanan.
    return sorted(range(len(key)), key=lambda index: key[index])


def encrypt(plaintext: str, key: str, steps=None) -> str:
    if not key:
        raise ValueError("Kunci tidak boleh kosong.")
    text = plaintext.replace(" ", "_")
    cols = len(key)
    order = get_keyword_order(key)
    rows = math.ceil(len(text) / cols)
    padded = text.ljust(rows * cols, "X")
    grid = [""] * len(padded)
    common = dict(key=key, cols=cols, order=order, rows=rows)
    _record(steps, "prepare", "normalize", "Ganti spasi dengan underscore",
            "Spasi menjadi _. Karakter lainnya tetap sama.", dict(text=text, original=plaintext))
    _record(steps, "prepare", "padding", "Lengkapi baris terakhir",
            f"Tambahkan {len(padded) - len(text)} X agar semua baris berisi {cols} karakter.",
            dict(text=padded, original=text, padding=len(padded) - len(text)))
    _record(steps, "prepare", "order", "Urutkan kunci",
            "Baca kolom menurut alfabet kunci. Huruf kembar diurutkan dari kiri ke kanan.",
            dict(**common, grid=grid.copy()))
    for i, char in enumerate(padded):
        grid[i] = char
        _record(steps, "process", "fill", f"Isi baris {i // cols + 1}, kolom {i % cols + 1}",
                "Masukkan teks ke matriks dari kiri ke kanan, baris demi baris.",
                dict(**common, grid=grid.copy(), cell=i, input=char))
    result = []
    for col in order:
        for row in range(rows):
            cell = row * cols + col
            result.append(grid[cell])
            _record(steps, "process", "read", f"Baca kolom {col + 1}",
                    f"Kolom dengan kunci {key[col]} dibaca dari atas ke bawah.",
                    dict(**common, grid=grid.copy(), cell=cell, input=grid[cell]), "".join(result))
    output = "".join(result)
    _record(steps, "result", "complete", "Hasil Transposition",
            "Gabungkan karakter sesuai urutan pembacaan kolom.", dict(text=output), output)
    return output


def decrypt(ciphertext: str, key: str, steps=None) -> str:
    if not key:
        raise ValueError("Kunci tidak boleh kosong.")
    cols = len(key)
    rows = math.ceil(len(ciphertext) / cols)
    order = get_keyword_order(key)
    grid = [""] * (rows * cols)
    common = dict(key=key, cols=cols, order=order, rows=rows)
    _record(steps, "prepare", "order", "Bangun urutan kolom",
            "Urutan alfabet kunci menentukan kolom yang diisi terlebih dahulu.",
            dict(**common, grid=grid.copy()))
    index = 0
    for col in order:
        for row in range(rows):
            if index < len(ciphertext):
                cell = row * cols + col
                grid[cell] = ciphertext[index]
                _record(steps, "process", "fill", f"Isi kolom {col + 1}",
                        "Masukkan ciphertext dari atas ke bawah pada kolom sesuai urutan kunci.",
                        dict(**common, grid=grid.copy(), cell=cell, input=ciphertext[index]))
                index += 1
    result = []
    for cell, char in enumerate(grid):
        result.append(char)
        _record(steps, "process", "read", f"Baca baris {cell // cols + 1}",
                "Baca matriks dari kiri ke kanan untuk menyusun kembali teks.",
                dict(**common, grid=grid.copy(), cell=cell, input=char), "".join(result))
    raw = "".join(result)
    output = raw.replace("_", " ").rstrip("X")
    _record(steps, "result", "cleanup", "Bersihkan hasil sesuai kode lama",
            "Ubah _ menjadi spasi dan buang seluruh X di akhir. X asli di akhir juga dapat hilang; _ asli menjadi spasi.",
            dict(original=raw, text=output), output)
    return output
