"""Monoalphabetic substitution; the optional trace stays plain Python."""

import random


def _record(steps, phase, kind, title, explanation, data, output=""):
    if steps is not None:
        steps.append(dict(phase=phase, kind=kind, title=title,
                          explanation=explanation, data=data, output=output))


class Substitution:
    FINAL_STRING = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

    def __init__(self, key=None):
        self.key = self.generate_key() if key is None else key.upper()
        self.ct = ""

    def _transform(self, text, key, decrypt, steps):
        key = key.upper()
        if len(key) != 26 or set(key) != set(self.FINAL_STRING):
            raise ValueError("Kunci harus memuat 26 huruf A-Z masing-masing satu kali.")
        normalized = text.upper()
        source, target = (key, self.FINAL_STRING) if decrypt else (self.FINAL_STRING, key)
        common = dict(source_alphabet=source, target_alphabet=target, key=key)
        _record(steps, "prepare", "normalize", "Kapitalisasi pesan",
                "Substitution pada implementasi ini menggunakan huruf kapital.",
                dict(original=text, text=normalized))
        _record(steps, "prepare", "mapping", "Bangun peta substitusi",
                "Setiap huruf pada baris asal berpasangan dengan huruf di bawahnya.",
                dict(**common))
        result = []
        for i, char in enumerate(normalized):
            index = source.find(char)
            out = target[index] if index != -1 else char
            result.append(out)
            _record(steps, "process", "letter" if index != -1 else "skip",
                    f"Karakter {i + 1}: {char!r}",
                    f"Cari {char} pada baris asal, lalu ambil {out} pada baris tujuan."
                    if index != -1 else "Karakter bukan A-Z dipertahankan.",
                    dict(**common, input=char, output=out, source=index, target=index, index=i),
                    "".join(result))
        output = "".join(result)
        _record(steps, "result", "complete", "Hasil Substitution",
                "Gabungkan seluruh karakter hasil.", dict(text=output), output)
        return output

    def enkripsi(self, pt, steps=None):
        return self._transform(pt, self.key, False, steps)

    def dekripsi(self, ct, steps=None):
        return self._transform(ct, self.key, True, steps)

    def dekripsi_dengan_key(self, ct, key, steps=None):
        return self._transform(ct, key, True, steps)

    def generate_key(self):
        key_list = list(self.FINAL_STRING)
        random.shuffle(key_list)
        return "".join(key_list)

    def remake_key(self):
        self.key = self.generate_key()

    @staticmethod
    def main():
        subs = Substitution()
        pt = "Bang, ambilkan makanan di meja"
        for _ in range(2):
            enkrip = subs.enkripsi(pt)
            print("Plaintext : " + pt)
            print("Ciphertext : " + enkrip)
            print("Decrypted : " + subs.dekripsi(enkrip))
            print("Key : " + subs.key)
            print()
            subs.remake_key()


if __name__ == "__main__":
    Substitution.main()
