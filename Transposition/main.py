"""
main.py
User interface for Columnar Transposition Cipher tool.
"""

from transposition import encrypt, decrypt

def print_menu():
    print("\n" + "="*40)
    print("      TRANSPOSITION CIPHER TOOL")
    print("="*40)
    print("1. Encrypt Message")
    print("2. Decrypt Message")
    print("3. Exit")
    print("="*40)

def main():
    while True:
        print_menu()
        choice = input("Select an option (1-3): ").strip()

        if choice == '1':
            print("\n--- ENCRYPTION ---")
            text = input("Enter plain text: ")
            key = input("Enter secret keyword: ").strip()
            
            if not key.isalpha():
                print("Error: Key should contain only alphabetic characters!")
                continue

            ciphertext = encrypt(text, key)
            print(f"\nEncrypted Output: {ciphertext}")

        elif choice == '2':
            print("\n--- DECRYPTION ---")
            ciphertext = input("Enter cipher text: ").strip()
            key = input("Enter secret keyword: ").strip()
            
            if not key.isalpha():
                print("Error: Key should contain only alphabetic characters!")
                continue

            plaintext = decrypt(ciphertext, key)
            print(f"\nDecrypted Output: {plaintext}")

        elif choice == '3':
            print("\nExiting Transposition Cipher Tool. Goodbye!")
            break
        else:
            print("Invalid option! Please enter 1, 2, or 3.")

if __name__ == "__main__":
    main()