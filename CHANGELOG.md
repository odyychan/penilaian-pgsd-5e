# 📜 Changelog

Dokumentasi seluruh pembaruan, perbaikan, dan peningkatan fitur pada Sistem Peer-Assessment PGSD Kelas 5E FKIP Universitas Lambung Mangkurat.

---

## [2.1.2] - 2026-08-23

### 🖨️ Optimalisasi Tata Letak & Celah Ruang Cetak (*Print Canvas Optimization*)
- **Penyelarasan Margin Halaman:** Menyesuaikan margin @page menjadi 6mm 8mm 8mm 8mm guna mengeliminasi celah ruang putih berlebih (*excess whitespace gaps*) pada dialog cetak browser.
- **Peningkatan Proporsi Konten Cetak:** Mengoptimalkan ukuran font, padding sel tabel, dan ruang kartu evaluasi agar mengisi kanvas kertas A4 secara penuh dan proporsional.
- **Penyelarasan Kop Surat & Logo:** Menyesuaikan ukuran logo ULM menjadi 70px dan menyelaraskan jarak garis pembatas kop resmi agar tampak seimbang dan padat.

---

## [2.1.1] - 2026-08-23

### 🖨️ Cetak & Format Dokumen Laporan Rekapitulasi Resmi
- **Logo Resmi ULM:** Menambahkan lambang resmi Universitas Lambung Mangkurat pada sisi kiri Kop Surat laporan cetak.
- **Garis Pembatas Kop Standar Dinas:** Mengimplementasikan standar garis ganda (*double-line*) kop dinas akademik resmi (garis tebal atas dan garis tipis bawah).
- **Perbaikan Nama Dosen & Tanda Tangan:** Mengoptimalkan perataan dan pembungkusan nama dosen beserta gelar lengkap agar tampil rapi pada satu baris dengan garis bawah tunggal yang proporsional.
- **Peningkatan Ruang Tanda Tangan:** Memperluas area fisik tanda tangan dan cap stempel institusi menjadi 75px.
- **Perlindungan Pemotongan Halaman (*Page Break Protection*):** Menerapkan aturan reak-inside: avoid pada setiap kartu evaluasi, baris tabel, dan blok pengesahan agar tidak terpotong canggung saat pencetakan multi-halaman.
- **Pencegahan Teks Terpotong (*Non-breaking Formatting*):** Menerapkan format spasi tanpa putus (*non-breaking space*) pada perolehan suara presentator terbaik agar tidak menimbulkan kata menggantung (*orphan word*).
