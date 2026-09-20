import random


class Substitution:
    FINAL_STRING = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

    def __init__(self):
        self.key = self.generate_key()
        self.ct = ""

    def enkripsi(self, pt):
        pre_pt = pt.upper()
        result = []

        for i in range(len(pre_pt)):
            curr = pre_pt[i]
            index = self.FINAL_STRING.find(curr)

            if index != -1:
                result.append(self.key[index])
            else:
                result.append(curr)

        return "".join(result)

    def dekripsi(self, ct):
        result = []
        pre_ct = ct.upper()

        for i in range(len(pre_ct)):
            curr = pre_ct[i]
            index = self.key.find(curr)

            if index != -1:
                result.append(self.FINAL_STRING[index])
            else:
                result.append(curr)

        return "".join(result)

    def dekripsi_dengan_key(self, ct, key):
        result = []
        pre_ct = ct.upper()

        for i in range(len(pre_ct)):
            curr = pre_ct[i]
            index = key.find(curr)

            if index != -1:
                result.append(self.FINAL_STRING[index])
            else:
                result.append(curr)

        return "".join(result)

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
        enkrip = subs.enkripsi(pt)
        dekrip = subs.dekripsi(enkrip)

        print("Plaintext : " + pt)
        print("Ciphertext : " + enkrip)
        print("Decrypted : " + dekrip)
        print("Key : " + subs.key)

        subs.remake_key()

        enkrip = subs.enkripsi(pt)
        dekrip = subs.dekripsi(enkrip)

        print()
        print("Plaintext : " + pt)
        print("Ciphertext : " + enkrip)
        print("Decrypted : " + dekrip)
        print("Key : " + subs.key)


if __name__ == "__main__":
    Substitution.main()
