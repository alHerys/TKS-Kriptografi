def enkripsi_vigenere(pesan, key):
  alfabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  encrypt_text = []

  key = key.upper()
  key_index = 0

  for karakter in pesan:
    if karakter.isalpha():
      is_upper = karakter.isupper()
      karakter_upper = karakter.upper()

      angka_pesan = alfabet.index(karakter_upper)
      angka_key = alfabet.index(key[key_index % len(key)])

      angka_enkripsi = (angka_pesan + angka_key) % 26

      huruf_enkripsi = alfabet[angka_enkripsi]

      if not is_upper:
        huruf_enkripsi = huruf_enkripsi.lower()

      encrypt_text.append(huruf_enkripsi)
      key_index += 1
    else:
      encrypt_text.append(karakter)

  return "".join(encrypt_text)

def dekripsi_vigenere(pesan, key):
  alfabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  decript_text = []
  
  key = key.upper()
  key_index = 0
  
  for karakter in pesan:
    if karakter.isalpha():
      is_upper = karakter.isupper()
      karakter_upper = karakter.upper()

      angka_pesan = alfabet.index(karakter_upper)
      angka_key = alfabet.index(key[key_index % len(key)])

      angka_dekripsi = (angka_pesan - angka_key) % 26

      huruf_dekripsi = alfabet[angka_dekripsi]

      if not is_upper:
        huruf_dekripsi = huruf_dekripsi.lower()

      decript_text.append(huruf_dekripsi)
      key_index += 1
    else:
      decript_text.append(karakter)

  return "".join(decript_text)