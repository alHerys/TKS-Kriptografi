from Substitution import Substitution


class Main:
    @staticmethod
    def main():
        sb = Substitution()
        print("====== SELAMAT DATANG DI SUBSTITUTION CIPHER ======")

        while True:
            print("Silahkan pilih menu")
            print("1. Enkripsi")
            print("2. Dekripsi (Specific Key)")
            print("3. Dekripsi (General Key)")
            print("4. Generate new General Key")
            print("5. Exit")

            jawab = int(input())

            if jawab == 1:
                print("Masukan Plaintext: ", end="")
                pt = input().upper()
                ct = sb.enkripsi(pt)

                print(f"Enkripsi : {ct}")
                print(f"Key      : {sb.key}")
                print()

            elif jawab == 2:
                print("Masukan Chipertext: ", end="")
                ct = input()
                print("Masukan Key (26 karakter): ", end="")
                key = input().upper()

                if len(key) > 26:
                    print("Error: Panjang key lebih dari 26")
                else:
                    dt = sb.dekripsi_dengan_key(ct, key)
                    print()
                    print(f"Enkripsi : {ct}")
                    print(f"Key      : {key}")
                    print(f"Dekripsi : {dt}")
                    print()

            elif jawab == 3:
                print("Masukan Chipertext: ", end="")
                ct = input()

                if len(sb.key) > 26:
                    print("Error: Panjang key lebih dari 26")
                    print()
                else:
                    dt = sb.dekripsi(ct)
                    print()
                    print(f"Enkripsi : {ct}")
                    print(f"Key      : {sb.key}")
                    print(f"Dekripsi : {dt}")
                    print()

            elif jawab == 4:
                sb.remake_key()
                print(f"New Key   : {sb.key}")
                print()

            elif jawab == 5:
                print("====== TERIMA KASIH ======")
                return


if __name__ == "__main__":
    Main.main()
