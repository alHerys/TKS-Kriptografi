# Lab Kriptografi

Lima algoritma kriptografi klasik dengan CLI Python dan web visualisasi interaktif:
Caesar, Vigenere, Substitution, Columnar Transposition, dan Playfair.

Web menggunakan **FastAPI + Svelte + Vite + SVG + GSAP**. Semua perhitungan tetap
berada di file Python masing-masing. Algoritma dapat dipakai tanpa memasang web.

## Jalankan untuk presentasi

Prasyarat: Python 3.10+ dan Node.js 22.12+ (atau 20.19+). Pengembangan dan
pengujian dilakukan dengan Python 3.14 dan Node.js 24. Perintah berikut dijalankan
dari root repo `TKS-Kriptografi` pada Linux/macOS.

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-lock.txt
cd frontend
npm ci
npm run build
cd ..
.venv/bin/python -B -m uvicorn web.app:app --host 127.0.0.1 --port 8000
```

Buka **http://127.0.0.1:8000**. Setelah instalasi dan build, internet dan server
Node.js tidak diperlukan saat presentasi. Font, JavaScript, dan CSS disajikan
secara lokal oleh FastAPI. Jalankan ulang server setelah build baru.

Pada Windows, gunakan `python` untuk membuat venv dan ganti `.venv/bin/python`
dengan `.venv\Scripts\python.exe`.

`requirements-lock.txt` mengunci seluruh lingkungan yang diuji, termasuk alat
tes. `requirements.txt` memuat dependensi runtime langsung; `requirements-dev.txt`
memuat dependensi pengujian langsung. Lock perlu diperbarui jika dependensi berubah.

## Cara menggunakan demo

1. Pilih algoritma dan mode Enkripsi atau Dekripsi.
2. Masukkan pesan/kunci atau pilih **Pakai contoh**. Klik **Proses pesan**.
3. Proses dimulai dalam keadaan paused. Panah **Berikutnya** memainkan satu langkah
   sampai selesai. Jika animasi sudah berjalan (atau dijeda di tengah), klik
   **Berikutnya** langsung menyelesaikan animasi langkah itu dan menghentikan autoplay.
   Klik lagi untuk menjalankan langkah selanjutnya. **Play** melanjutkan langkah secara otomatis.
4. **Pause** menghentikan gerakan pada posisi saat ini. **Sebelumnya** membuka
   awal langkah sebelumnya; **Reset** kembali ke awal proses.
5. Dropdown fase di samping nomor langkah berisi **Persiapan / Proses / Hasil**
   untuk melompat. Penjelasan langkah berada di atas kontrol playback. Kecepatan tersedia
   pada 0,5×, 1×, dan 2×.
   Khusus operasi huruf Vigenere, hasil ditahan 1 detik pada kecepatan 1× sebelum
   lanjut agar perhitungan modulo dapat dibaca. Jeda mengikuti kecepatan playback,
   bisa dijeda dengan Pause, dan dilewati dengan Berikutnya.
6. Ikon fullscreen memperbesar area demo supaya matriks, penjelasan, dan kontrol lebih
   mudah dilihat melalui proyektor. Keluar dengan ikon yang sama atau Escape.
7. Tab **Kode Python** menampilkan file asli yang digunakan backend, dengan
   nomor baris dan syntax highlighting Python yang mengikuti tema Latte/Mocha.
   Membuka kode menghentikan playback tanpa membuang posisinya.
8. Tombol matahari/bulan di pojok kanan atas mengganti **Catppuccin Latte**
   (terang) dan **Mocha** (gelap). Awalnya tema mengikuti preferensi perangkat;
   setelah tombol ditekan, pilihan disimpan di browser. Palet bersumber dari
   [Catppuccin](https://github.com/catppuccin/palette).
9. Ringkasan tugas menyimpan pesan awal, kunci, tujuan, dan aturan proses yang
   sedang dijalankan, termasuk saat mode fokus. Panel hasil menyandingkan input
   dengan hasil sementara; garis tebal menandai bagian aktif dan titik menunjukkan
   bagian yang belum selesai. Playfair ditampilkan per pasangan siap proses,
   sedangkan Transposition menyorot posisi sumber dan hasil yang berbeda.
   Normalisasi, filler, dan pembersihan padding dijelaskan tanpa mengubah kode algoritma.

Mengubah input membatalkan visualisasi lama. Beralih mode setelah menghitung
memakai hasil sebelumnya sebagai input baru dan mempertahankan kuncinya.
Pada Substitution, **Acak kunci** menghasilkan kunci di Python. Simpan kunci
tersebut untuk mendekripsi ciphertext yang sesuai.

Pesan web dibatasi 200 karakter ASCII agar visualisasi tetap praktis.
Matriks/pesan panjang dapat digulir di dalam area visualisasi. Preferensi sistem
reduced motion menampilkan keadaan tiap langkah langsung tanpa perpindahan huruf.

## Jalankan saat development

Terminal pertama, dari root repo:

```bash
.venv/bin/python -B -m uvicorn web.app:app --reload --host 127.0.0.1 --port 8000
```

Terminal kedua:

```bash
cd frontend
npm run dev
```

Buka alamat Vite yang tercetak di terminal. Vite meneruskan `/api` ke FastAPI.
Jika port 8000 sedang digunakan, hentikan proses demo lama sebelum memulai server.

## Algoritma tetap mandiri

Semua implementasi dan CLI berada di `algorithms/`. Subfolder setiap algoritma
tetap dipertahankan, termasuk implementasi Java untuk Substitution. Setiap
implementasi Python tetap mandiri dalam satu file, tanpa dependensi web.

| Algoritma | File implementasi | Menjalankan CLI dari root repo |
|---|---|---|
| Caesar | `algorithms/Caesar/caesar.py` | `python3 algorithms/Caesar/main.py` |
| Vigenere | `algorithms/Vigenere/vigenere.py` | `python3 algorithms/Vigenere/main.py` |
| Substitution | `algorithms/Substitution/python/Substitution.py` | `python3 algorithms/Substitution/python/main.py` |
| Transposition | `algorithms/Transposition/transposition.py` | `python3 algorithms/Transposition/main.py` |
| Playfair | `algorithms/playfair/playfair.py` | `python3 algorithms/playfair/playfair.py` |

Nama fungsi publik yang lama tetap tersedia dan hasilnya tetap berupa string.
Tambahan parameter opsional `steps` mencatat perhitungan yang sama:

```python
from algorithms.Caesar.caesar import encrypt

print(encrypt("ABC", 3))  # DEF, seperti pemanggilan CLI biasa

steps = []
result = encrypt("ABC", 3, steps=steps)
print(result)             # DEF
print(steps[1])           # Perhitungan karakter A
```

Setiap catatan berisi `phase`, `kind`, `title`, `explanation`, `data`, dan
`output` (hasil sementara setelah langkah tersebut). Data posisi, indeks,
matriks, dan huruf tujuan dihitung di Python. Catatan tidak berisi durasi atau
koordinat piksel, dan tidak memerlukan modul web.

`web/app.py` memvalidasi input dan memilih fungsi algoritma. Svelte membaca catatan
tersebut; GSAP menggerakkan progres langkah. SVG diturunkan dari snapshot langkah
dan progres, sehingga mundur/reset tidak bergantung pada riwayat callback animasi.
Frontend tidak mengenkripsi ulang pesan. Komponen algoritma memakai fungsi
pembentuk scene yang hanya mengubah data perhitungan menjadi posisi gambar.

## Perilaku yang sengaja dipertahankan

- **Caesar:** kapitalisasi dan tanda baca dipertahankan. A-Z/a-z adalah alfabet
  yang diproses; karakter lain diteruskan.
- **Vigenere:** huruf besar/kecil dipertahankan. Spasi dan tanda baca tidak
  menghabiskan huruf kunci. Kunci kosong atau bukan A-Z ditolak.
- **Substitution:** pesan menjadi kapital; karakter selain A-Z dipertahankan.
  Kunci harus merupakan permutasi 26 huruf.
- **Transposition:** spasi menjadi `_`, baris terakhir diisi `X`. Dekripsi mengikuti
  kode lama, mengubah `_` menjadi spasi lalu membuang **semua** `X` di akhir.
  Contoh: `HELLO X` akan kembali sebagai `HELLO `, bukan teks asli persis.
  `_` asli juga menjadi spasi. Visualisasi menjelaskan tahap yang ambigu ini.
- **Playfair:** huruf menjadi kapital, J menjadi I, spasi/tanda baca dibuang.
  Filler X memisahkan huruf kembar dan melengkapi pasangan; setelah X digunakan Q.
  Dekripsi **tidak** menghapus filler. `BALLOON` kembali menjadi `BALXLOON`.

Web memvalidasi panjang ciphertext Playfair dan Transposition sebelum menghitung.
Algoritma ini ditujukan untuk pembelajaran, bukan perlindungan data modern.

## API

Dokumentasi interaktif tersedia di http://127.0.0.1:8000/docs.

| Endpoint | Kegunaan |
|---|---|
| `GET /api/algorithms` | Metadata, contoh plaintext/ciphertext, kunci, dan catatan |
| `POST /api/run` | Input `{algorithm, mode, text, key}`; output hasil dan langkah |
| `POST /api/substitution/key` | Menghasilkan permutasi alfabet baru |
| `GET /api/source/{algorithm}` | Isi file implementasi dari allowlist lima algoritma |

Nilai algoritma: `caesar`, `vigenere`, `substitution`, `transposition`, `playfair`.
Mode: `encrypt` atau `decrypt`. Kunci Caesar berupa integer JSON; kunci lainnya
berupa string. Respons proses memuat `input`, `normalized_text`, `key`,
`normalized_key`, `output`, `notes`, dan `steps`. Untuk Transposition,
`normalized_text` sebelum padding; detail padding tersedia di langkah persiapan.

## Pengujian

```bash
.venv/bin/python -B -m pytest -q
cd frontend
npx playwright install chromium
npm test
```

Hentikan server port 8000 sebelum `npm test`. Playwright membangun frontend,
menjalankan FastAPI sendiri, dan menghentikannya setelah pengujian. Chromium
memerlukan library sistem yang sesuai; jika belum tersedia, gunakan petunjuk
dependensi dari Playwright. Konfigurasi browser test memakai `.venv/bin/python`
(Linux/macOS).

Tes meliputi vektor algoritma, kesamaan hasil dengan/tanpa trace, CLI mandiri,
validasi API, file sumber, gerakan dan playback, race respons, kunci acak,
layout desktop/mobile, reduced motion, serta pemblokiran semua request eksternal.
Screenshot dan trace kegagalan tersimpan di `frontend/test-results/`.
