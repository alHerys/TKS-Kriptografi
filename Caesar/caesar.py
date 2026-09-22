def encrypt(plaintext: str, shift: int) -> str:
    result = []
    shift = shift % 26

    for char in plaintext:
        if char.isupper():
            # Geser huruf kapital (A-Z)
            new_char = chr((ord(char) - ord('A') + shift) % 26 + ord('A'))
            result.append(new_char)
        elif char.islower():
            # Geser huruf kecil (a-z)
            new_char = chr((ord(char) - ord('a') + shift) % 26 + ord('a'))
            result.append(new_char)
        else:
            # Karakter selain huruf tidak diubah
            result.append(char)

    return "".join(result)


def decrypt(ciphertext: str, shift: int) -> str:
    return encrypt(ciphertext, -shift)
