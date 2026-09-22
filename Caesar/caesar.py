"""Caesar cipher. Optional steps records the calculation used by the CLI."""


def _record(steps, phase, kind, title, explanation, data, output=""):
    if steps is not None:
        steps.append(dict(phase=phase, kind=kind, title=title,
                          explanation=explanation, data=data, output=output))


def encrypt(plaintext: str, shift: int, steps=None) -> str:
    result = []
    original_shift = shift
    shift %= 26
    signed_shift = shift if original_shift >= 0 or shift == 0 else shift - 26
    _record(steps, "prepare", "shift", "Siapkan pergeseran",
            f"Pergeseran {original_shift} setara dengan {shift} pada alfabet 26 huruf.",
            dict(text=plaintext, shift=shift, formula=f"{original_shift} mod 26 = {shift}"))

    for i, char in enumerate(plaintext):
        if "A" <= char <= "Z" or "a" <= char <= "z":
            base = ord("A") if char.isupper() else ord("a")
            source = ord(char) - base
            target = (source + shift) % 26
            new_char = chr(target + base)
            sign = "+" if signed_shift >= 0 else "−"
            direction = 1 if signed_shift >= 0 else -1
            distance = abs(signed_shift)
            data = dict(input=char, output=new_char, source=source, target=target,
                        shift=shift, direction=direction, distance=distance, index=i,
                        formula=f"({source} {sign} {distance}) mod 26 = {target}")
            side = "kanan" if direction == 1 else "kiri"
            explanation = f"{char} berada di indeks {source}. Geser {distance} posisi ke {side} menjadi {new_char}."
            kind = "letter"
        else:
            new_char = char
            data = dict(input=char, output=char, index=i)
            explanation = "Karakter bukan A-Z dipertahankan tanpa pergeseran."
            kind = "skip"
        result.append(new_char)
        _record(steps, "process", kind, f"Karakter {i + 1}: {char!r}",
                explanation, data, "".join(result))
    output = "".join(result)
    _record(steps, "result", "complete", "Hasil Caesar", "Gabungkan semua karakter hasil.",
            dict(text=output), output)
    return output


def decrypt(ciphertext: str, shift: int, steps=None) -> str:
    return encrypt(ciphertext, -shift, steps)
