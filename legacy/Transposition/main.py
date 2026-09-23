"""
main.py
User interface for Columnar Transposition Cipher tool.
"""

from transposition import encrypt, decrypt

def print_menu():
    print("\n" + "="*40)
    print("      TRANSPOSITION CIPHER")
    print("="*40)
    print("1. Enkrip sebuah pesan")
    print("2. Dekrip sebuah pesan")
    print("3. Exit")
    print("="*40)

def main():
    while True:
        print_menu()
        choice = input("Pilih Opsi (1-3): ").strip()

        if choice == '1':
            print("\n--- ENCRYPTION ---")
            text = input("Masukkan Plain Text: ")
            key = input("Masukkan Secret key: ").strip()
            
            if not key.isalpha():
                print("Error: KEY HANYA BOLEH ALFABET!")
                continue

            ciphertext = encrypt(text, key)
            print(f"\nHasil Enkripsi: {ciphertext}")

        elif choice == '2':
            print("\n--- DECRYPTION ---")
            ciphertext = input("Masukkan Cipher Text: ").strip()
            key = input("Masukkan Secret Key: ").strip()
            
            if not key.isalpha():
                print("Error: KEY HANYA BOLEH ALFABET!")
                continue

            plaintext = decrypt(ciphertext, key)
            print(f"\n Hasil Dekripsi: {plaintext}")

        elif choice == '3':
            print("\n Bye bye!")
            break
        else:
            print("Masukkan opsi yang benar, anak tk aja tawu.  masukkan 1, 2, or 3.")

if __name__ == "__main__":
    main()
