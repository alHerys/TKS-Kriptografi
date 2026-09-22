"""Vigenere cipher with optional calculation records and no web dependencies."""


def _record(steps, phase, kind, title, explanation, data, output=""):
    if steps is not None:
        steps.append(dict(phase=phase, kind=kind, title=title,
                          explanation=explanation, data=data, output=output))


def _transform(pesan, key, direction, steps):
    alfabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    key = key.upper()
    if not key or any(char not in alfabet for char in key):
        raise ValueError("Kunci Vigenere harus berisi huruf A-Z.")
    aligned = []
    key_index = 0
    for char in pesan:
        if char.isascii() and char.isalpha():
            aligned.append(key[key_index % len(key)])
            key_index += 1
        else:
            aligned.append(" ")
    _record(steps, "prepare", "key", "Siapkan kunci",
            "Ubah kunci ke huruf kapital. A = 0, B = 1, hingga Z = 25.",
            dict(text=key, key=key))
    _record(steps, "prepare", "alignment", "Selaraskan kunci dengan pesan",
            "Ulangi kunci hanya pada huruf. Spasi dan tanda baca tidak menghabiskan kunci.",
            dict(text=pesan, aligned="".join(aligned), key=key))
    result = []
    for i, char in enumerate(pesan):
        key_char = aligned[i]
        if key_char != " ":
            source = alfabet.index(char.upper())
            shift = alfabet.index(key_char)
            target = (source + direction * shift) % 26
            out = alfabet[target]
            if char.islower():
                out = out.lower()
            sign = "+" if direction == 1 else "−"
            data = dict(input=char, output=out, source=source, target=target,
                        key_char=key_char, shift=shift, index=i, text=pesan,
                        aligned="".join(aligned), direction=direction,
                        formula=f"({source} {sign} {shift}) mod 26 = {target}")
            explanation = f"Pasangkan {char} dengan kunci {key_char} ({shift}), lalu hitung indeks hasil."
            kind = "letter"
        else:
            out = char
            data = dict(input=char, output=char, index=i, text=pesan, aligned="".join(aligned))
            explanation = "Pertahankan karakter ini. Posisi kunci tidak maju."
            kind = "skip"
        result.append(out)
        _record(steps, "process", kind, f"Karakter {i + 1}: {char!r}", explanation, data, "".join(result))
    output = "".join(result)
    _record(steps, "result", "complete", "Hasil Vigenere", "Gabungkan karakter hasil.", dict(text=output), output)
    return output


def enkripsi_vigenere(pesan, key, steps=None):
    return _transform(pesan, key, 1, steps)


def dekripsi_vigenere(pesan, key, steps=None):
    return _transform(pesan, key, -1, steps)
