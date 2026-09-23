"""Standalone CLI version of Playfair, without web visualization traces."""


def normalize(text: str) -> str:
    return "".join(char for char in text.upper() if "A" <= char <= "Z").replace("J", "I")


def create_square(key: str) -> str:
    return "".join(dict.fromkeys(normalize(key) + "ABCDEFGHIKLMNOPQRSTUVWXYZ"))


def transform(text: str, key: str, direction: int) -> str:
    square = create_square(key)
    result = []
    for i in range(0, len(text), 2):
        first, second = text[i:i + 2]
        row1, col1 = divmod(square.index(first), 5)
        row2, col2 = divmod(square.index(second), 5)
        if row1 == row2:
            col1 = (col1 + direction) % 5
            col2 = (col2 + direction) % 5
        elif col1 == col2:
            row1 = (row1 + direction) % 5
            row2 = (row2 + direction) % 5
        else:
            col1, col2 = col2, col1
        result.append(square[row1 * 5 + col1] + square[row2 * 5 + col2])
    return "".join(result)


def encrypt(plaintext: str, key: str) -> str:
    text = normalize(plaintext)
    pairs = []
    i = 0
    while i < len(text):
        first = text[i]
        if i + 1 == len(text) or first == text[i + 1]:
            second = "Q" if first == "X" else "X"
            i += 1
        else:
            second = text[i + 1]
            i += 2
        pairs.append(first + second)
    return transform("".join(pairs), key, 1)


def decrypt(ciphertext: str, key: str) -> str:
    text = normalize(ciphertext)
    if len(text) % 2:
        raise ValueError("Ciphertext must contain an even number of letters.")
    # Keep X/Q fillers because they may also be original letters.
    return transform(text, key, -1)


if __name__ == "__main__":
    key = input("Key: ")
    plaintext = input("Plaintext: ")
    ciphertext = encrypt(plaintext, key)
    print("Encrypted:", ciphertext)
    print("Decrypted:", decrypt(ciphertext, key))
