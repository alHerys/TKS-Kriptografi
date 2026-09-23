from vigenere import enkripsi_vigenere, dekripsi_vigenere

print("==========    Vigenere Cipher    ==========")

def main():

  pesan = str(input("Input pesan yang ingin di enkripsi/dekripsi: "))
  key = str(input("Input key yang ingin digunakan: "))

  print("\n"+"1. Enkripsi Pesan")
  print("2. Dekripsi Pesan")
  aksi = int(input("pilih input antara 1 atau 2: "))

  if(aksi == 1):
    hasil_Enkripsi = enkripsi_vigenere(pesan, key)
    print(f"Hasil ekripsi: {hasil_Enkripsi}")

  elif(aksi == 2):
    hasil_Dekripsi = dekripsi_vigenere(pesan, key)
    print(f"hasil dekripsi: {hasil_Dekripsi}")

if __name__ == "__main__":
  main()
