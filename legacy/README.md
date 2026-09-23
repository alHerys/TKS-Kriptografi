# Versi CLI

Caesar, Vigenere, Substitution (Python/Java), dan Transposition disalin dari
commit `2cfa36e`, sebelum penambahan trace untuk web. Perilaku aslinya dipertahankan.
Playfair belum memiliki commit versi CLI awal, sehingga disediakan versi mandiri
tanpa trace dari implementasi saat ini. Tab Kode Python menampilkan file dari
folder ini; perhitungan dan visualisasi web tetap memakai `algorithms/`.

Jalankan dari root repo dengan Python, tanpa memasang dependensi web:

```bash
python3 legacy/Caesar/main.py
python3 legacy/Vigenere/main.py
python3 legacy/Substitution/python/main.py
python3 legacy/Transposition/main.py
python3 legacy/playfair/playfair.py
```

Untuk Substitution Java, dari folder `legacy/Substitution/java/`:
`javac Main.java Substitution.java`, lalu `java Main` (memerlukan JDK).
