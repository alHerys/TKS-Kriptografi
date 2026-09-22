"""Playfair: uppercase A-Z, J becomes I, punctuation is ignored.
Decryption keeps inserted X/Q fillers. This file has no web dependencies.
"""


def _record(steps, phase, kind, title, explanation, data, output=""):
    if steps is not None:
        steps.append(dict(phase=phase, kind=kind, title=title,
                          explanation=explanation, data=data, output=output))


def normalize(text: str) -> str:
    return "".join(char for char in text.upper() if "A" <= char <= "Z").replace("J", "I")


def create_square(key: str, steps=None) -> str:
    keyword = "".join(dict.fromkeys(normalize(key)))
    square = "".join(dict.fromkeys(keyword + "ABCDEFGHIKLMNOPQRSTUVWXYZ"))
    _record(steps, "prepare", "keyword", "Siapkan kunci unik",
            "Ubah ke kapital, gabungkan J dengan I, lalu ambil kemunculan pertama setiap huruf.",
            dict(original=key, text=keyword))
    for i, char in enumerate(square):
        _record(steps, "prepare", "square", f"Isi matriks: {char}",
                "Masukkan huruf kunci, kemudian sisa alfabet tanpa J." if i < len(keyword)
                else "Lengkapi dengan huruf alfabet yang belum muncul, tanpa J.",
                dict(square=square[:i + 1], cell=i, input=char))
    return square


def transform(text: str, key: str, direction: int, steps=None, square=None) -> str:
    square = square if square is not None else create_square(key, steps)
    result = []
    for i in range(0, len(text), 2):
        first, second = text[i:i + 2]
        row1, col1 = divmod(square.index(first), 5)
        row2, col2 = divmod(square.index(second), 5)
        sources = [row1 * 5 + col1, row2 * 5 + col2]
        if row1 == row2:
            rule = "row"
            col1 = (col1 + direction) % 5
            col2 = (col2 + direction) % 5
            explanation = "Satu baris: geser satu kolom ke " + ("kanan." if direction == 1 else "kiri.")
        elif col1 == col2:
            rule = "column"
            row1 = (row1 + direction) % 5
            row2 = (row2 + direction) % 5
            explanation = "Satu kolom: geser satu baris ke " + ("bawah." if direction == 1 else "atas.")
        else:
            rule = "rectangle"
            col1, col2 = col2, col1
            explanation = "Bentuk persegi panjang: setiap huruf mengambil kolom pasangan pada barisnya sendiri."
        targets = [row1 * 5 + col1, row2 * 5 + col2]
        pair_output = "".join(square[index] for index in targets)
        result.append(pair_output)
        _record(steps, "process", "pair", f"Pasangan {first}{second} → {pair_output}",
                explanation + " Jika melewati batas matriks, lanjutkan dari sisi seberangnya.",
                dict(square=square, input=first + second, output=pair_output,
                     sources=sources, targets=targets, rule=rule, direction=direction, index=i // 2),
                "".join(result))
    return "".join(result)


def encrypt(plaintext: str, key: str, steps=None) -> str:
    text = normalize(plaintext)
    _record(steps, "prepare", "normalize", "Normalisasi pesan",
            "Kapitalisasi huruf, ubah J menjadi I, dan abaikan spasi serta tanda baca.",
            dict(original=plaintext, text=text))
    square = create_square(key, steps)
    pairs = []
    i = 0
    while i < len(text):
        first = text[i]
        if i + 1 == len(text) or first == text[i + 1]:
            second = "Q" if first == "X" else "X"
            explanation = "Sisipkan filler untuk huruf kembar atau pasangan terakhir yang belum lengkap."
            i += 1
        else:
            second = text[i + 1]
            explanation = "Ambil dua huruf berbeda sebagai satu pasangan."
            i += 2
        pairs.append(first + second)
        _record(steps, "prepare", "pairing", f"Bentuk pasangan {first}{second}",
                explanation + " Gunakan Q sebagai filler setelah X.",
                dict(text=" ".join(pairs), input=first + second))
    output = transform("".join(pairs), key, 1, steps, square)
    _record(steps, "result", "complete", "Hasil Playfair", "Gabungkan pasangan hasil.", dict(text=output), output)
    return output


def decrypt(ciphertext: str, key: str, steps=None) -> str:
    text = normalize(ciphertext)
    if len(text) % 2:
        raise ValueError("Ciphertext must contain an even number of letters.")
    _record(steps, "prepare", "normalize", "Normalisasi ciphertext",
            "Kapitalisasi huruf dan gunakan pasangan yang sudah ada. Jangan sisipkan filler baru.",
            dict(original=ciphertext, text=text))
    square = create_square(key, steps)
    _record(steps, "prepare", "pairing", "Pisahkan pasangan ciphertext",
            "Baca ciphertext dua huruf sekaligus.",
            dict(text=" ".join(text[i:i + 2] for i in range(0, len(text), 2))))
    output = transform(text, key, -1, steps, square)
    _record(steps, "result", "complete", "Hasil Playfair",
            "Filler X/Q tetap disimpan karena tidak selalu dapat dibedakan dari huruf asli.",
            dict(text=output), output)
    return output


if __name__ == "__main__":
    key = input("Key: ")
    plaintext = input("Plaintext: ")
    ciphertext = encrypt(plaintext, key)
    print("Encrypted:", ciphertext)
    print("Decrypted:", decrypt(ciphertext, key))
