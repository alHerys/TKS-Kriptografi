from caesar import encrypt, decrypt


def print_menu():
    print("\n" + "=" * 40)
    print("           CAESAR CIPHER")
    print("=" * 40)
    print("1. Enkripsi")
    print("2. Dekripsi")
    print("3. Exit")
    print("=" * 40)


def main():
    while True:
        print_menu()
        choice = input("Pilih Opsi (1-3): ").strip()

        if choice == "1":
            print("\n--- ENKRIPSI ---")
            text = input("Masukkan Plain Text: ")
            key_input = input("Masukkan Kunci Pergeseran (angka integer): ").strip()

            try:
                shift = int(key_input)
            except ValueError:
                print("Error: KUNCI HARUS BERUPA BILANGAN BULAT (ANGKA)!")
                continue

            ciphertext = encrypt(text, shift)
            print(f"\nHasil Enkripsi: {ciphertext}")

        elif choice == "2":
            print("\n--- DEKRIPSI ---")
            ciphertext = input("Masukkan Cipher Text: ")
            key_input = input("Masukkan Kunci Pergeseran (angka integer): ").strip()

            try:
                shift = int(key_input)
            except ValueError:
                print("Error: KUNCI HARUS BERUPA BILANGAN BULAT (ANGKA)!")
                continue

            plaintext = decrypt(ciphertext, shift)
            print(f"\nHasil Dekripsi: {plaintext}")

        elif choice == "3":
            print("\nTerima kasih! Sampai jumpa.")
            break
        else:
            print("Pilihan tidak valid. Silakan masukkan 1, 2, atau 3.")


if __name__ == "__main__":
    main()
