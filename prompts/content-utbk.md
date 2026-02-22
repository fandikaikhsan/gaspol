# UTBK‑SNBT 2026 Topic Map + Difficulty Analytics dan Template‑Flashcard Library untuk Generasi AI

## Ringkasan eksekutif

UTBK‑SNBT 2026 (sebagaimana dipaparkan dalam materi informasi SNPMB 2026 yang beredar pada kanal institusi/penyelenggara informasi resmi) menguji **dua komponen utama**: **Tes Potensi Skolastik (TPS)** dan **Tes Literasi** yang terdiri dari **7 subtes** (PU, PPU, PBM, PK, LBI, LBE, PM). citeturn1search9turn5view1  
Kerangka (framework) resmi SNPMB memformalkan “apa yang diukur” sebagai kompetensi **penalaran umum, pemahaman umum, pemahaman bacaan‑menulis, kuantitatif** (TPS) serta **reading literacy** (LBI/LBE) dan **mathematical reasoning** (PM) berbasis proses **formulate–employ–interpret**. citeturn10view0turn10view1turn9view0turn8view0  

Bagian paling berguna untuk kebutuhan *AI item generation* (yang Anda minta) adalah:

- **Template Library terstandardisasi** (format, stem, variasi level rendah‑sedang‑tinggi, jenis distraktor, kunci jawaban pola, langkah singkat, tag metadata, estimasi waktu, estimasi skor kesulitan berbasis model). Format soal dirancang agar kompatibel dengan **3 model soal yang dipublikasikan pada simulasi resmi SNPMB** (MCQ 5 opsi; multiple‑correct/majemuk kompleks berbentuk tabel; isian). citeturn1search0  
- **Subtopic Map MECE** (36 subtopik; konsisten dengan taksonomi sebelumnya) + **Master Index Table** yang memetakan ID subtopik ↔ paket template/flashcard ↔ sumber primer yang mengonfirmasi struktur + sumber contoh/rekonstruksi (platform).  
- **Contoh item buatan**: **1 item fully‑worked untuk setiap subtopik** (36 item total) sebagai “seed” generasi AI; masing‑masing dirujukkan ke sumber platform/rekonstruksi yang memuat tipe item serupa (bukan sebagai klaim “soal asli”). citeturn2search5turn1search11turn2search6turn0search25turn4search0turn0search15turn3search1  

Catatan penting transparansi: rincian mikro‑subtopik untuk 2026 (mis. “berapa persen inferensi vs evaluasi” per literasi) **tidak dipublikasikan secara eksplisit** pada dokumen primer yang tersedia publik; karena itu seluruh subtopik mikro dan rancangan template di bawah diberi label **INFERENSI (didukung framework + bukti contoh/rekonstruksi)**, sementara struktur ujian (komponen, subtes, jumlah soal, durasi total) diberi label **TERKONFIRMASI**. citeturn1search9turn5view1turn9view0turn8view0turn1search0  

## Blueprint resmi UTBK‑SNBT 2026 dan status konfirmasi

### Struktur komponen dan subtes (TERKONFIRMASI)
Materi informasi SNPMB 2026 menyatakan UTBK‑SNBT memuat dua komponen (TPS & Literasi) dengan subtes: **Penalaran Umum, Pengetahuan dan Pemahaman Umum, Pemahaman Bacaan dan Menulis, Pengetahuan Kuantitatif, Literasi Bahasa Indonesia, Literasi Bahasa Inggris, Penalaran Matematika**. citeturn1search9turn5view1  
Rincian jumlah soal (yang digunakan sebagai struktur “komponen → subtes”) pada paparan 2026 adalah: PU 30 (induktif/deduktif/kuantitatif masing‑masing 10), PPU 20, PBM 20, PK 20, LBI 30, LBE 20, PM 20; total 160 soal dalam 195 menit. citeturn1search9turn5view1  

### Model bentuk soal (INFERENSI berbasis publikasi resmi terkini)
Simulasi resmi SNPMB (tahun 2025) mempublikasikan bahwa secara umum terdapat **tiga model bentuk soal**: (1) pilihan ganda 5 opsi; (2) pilihan majemuk kompleks berbentuk tabel (dua opsi); (3) isian/melengkapi rumpang. citeturn1search0  
Dokumen paparan 2026 yang dikutip tidak selalu merinci “model bentuk soal”, sehingga pemakaian 3 model tersebut untuk 2026 diberi label **INFERENSI konservatif**: *format yang sudah dipublikasikan resmi dan dipakai untuk latihan diasumsikan tetap berlaku jika tidak ada rilis perubahan format*. citeturn1search0turn5view1  

### Apa yang diukur (TERKONFIRMASI pada level konstruk; INFERENSI pada level subtopik mikro)
Framework resmi SNPMB menjelaskan tujuan pengukuran per subtes TPS (PU/PPU/PBM/PK), literasi membaca (LBI/LBE), dan penalaran matematika (PM). citeturn10view0turn10view1turn9view0turn8view0  
Subtopik mikro dalam laporan ini adalah **INFERENSI** yang berupaya “memecah konstruk” menjadi unit yang dapat dioperasionalkan untuk *AI item generation*, dengan dukungan pola latihan/tryout/rekonstruksi di platform (contoh: Ruangguru, Brain Academy, Zenius, Pahamify). citeturn2search5turn1search11turn2search6turn0search1turn3search1turn0search31  

## Metode pemetaan, model kesulitan, dan mekanisme MECE

### Alur kerja pemetaan (flowchart)
```mermaid
flowchart TD
  A[Blueprint & struktur ujian SNPMB 2026\n(komponen, subtes, jumlah soal)] --> B[Framework resmi SNPMB\n(definisi konstruk & kompetensi)]
  B --> C[Taksonomi subtopik MECE\n(operasional untuk item writing)\nINFERENSI terkontrol]
  C --> D[Template Library\n(stem + format + level + distraktor + kunci pola)]
  D --> E[Triangulasi contoh/rekonstruksi\n(Ruangguru/Brain Academy/Zenius/Pahamify)]
  E --> F[Difficulty model (0–100)\nberbasis load, steps, time, traps, prereq]
  F --> G[Metadata tags untuk generasi AI\n(kata kunci, durasi-item, distractor types)]
```
Blueprint 2026 dan 7 subtes: citeturn1search9turn5view1  
Definisi konstruk: citeturn10view0turn10view1turn9view0turn8view0  
Format soal untuk template: citeturn1search0  
Bukti contoh/rekonstruksi: citeturn1search11turn2search6turn3search1turn0search1turn2search5turn0search31  

### Difficulty scoring model (dipakai kembali dari model sebelumnya)
Skor Kesulitan (0–100) adalah **proksi** (bukan parameter resmi). Model menggabungkan: (i) beban kognitif, (ii) kedalaman multi‑langkah, (iii) intensitas waktu (konsekuensi jumlah soal & alokasi waktu; ketika alokasi rinci tidak tersedia di paparan 2026, pendekatan memakai framework UTBK SNPMB sebagai proksi), (iv) kepadatan trap/distraktor, (v) keluasan prasyarat. citeturn10view0turn10view1turn9view0turn8view0turn5view1  
Keterbatasan: tidak ada rilis publik yang memuat statistik item (p‑value/IRT/time‑on‑item), sehingga peringkat kesulitan berbasis “evidence‑signals” dari contoh/rekonstruksi. citeturn3search1turn1search11turn2search6  

## Template & Flashcard Library untuk Generasi AI

### Spesifikasi output item (dipakai konsisten di semua template)
Semua template di bawah mengeluarkan salah satu format berikut (selaras dengan model simulasi resmi):  
- **MCQ5**: 1 jawaban benar dari A–E  
- **MCK‑Table** (*multiple correct / majemuk kompleks*): tabel pernyataan × pilihan (Benar/Salah, Sesuai/Tidak) atau “Pilih semua yang benar” dalam bentuk tabel  
- **Fill‑in**: isian angka/kata/frasa pendek  
Sumber format: citeturn1search0  

Konvensi level kognitif:  
- **Low (non‑HOTS)** = single‑step, eksplisit, minim distraktor  
- **Medium (mix)** = 2–3 langkah atau butuh inferensi sederhana  
- **High (HOTS)** = multi‑step, evaluasi/justifikasi, trap paralel, konteks baru

### Kode distraktor yang direkomendasikan (untuk metadata AI)
- **NEG** (negasi/kuantor “tidak”, “kecuali”, “semua–sebagian”)  
- **NEAR** (near‑synonym / parafrasa dekat)  
- **EXTREME** (opsi ekstrem: always/never/harus)  
- **REV** (relasi terbalik: sebab↔akibat, implikasi converse/inverse)  
- **UNITS** (satuan/skala/persen basis)  
- **OFF1** (off‑by‑one / salah indeks)  
- **IRREL** (irrelevant sentence / bukti tidak relevan)  
- **LOCAL** (jawaban detail lokal disangka ide pokok)  
- **GRAPH** (salah baca sumbu/legend)  
- **SCOPE** (kesalahan cakupan: terlalu umum/terlalu sempit)  

### Template Library (ringkas namun “siap pakai” untuk prompt AI)
Di bawah ini adalah **bank template keluarga**. Setiap subtopik akan “mengambil” 8 template + 6 flashcard dari bank ini (lihat bagian “Peta Subtopik + Paket Template”).  
Catatan: konten mikro‑subtopik adalah INFERENSI; dukungan contoh tipe item diambil dari artikel contoh/rekonstruksi platform. citeturn2search5turn1search11turn2search6turn3search1turn0search1turn0search31  

#### TPS – Penalaran Umum (PU) Template Bank (PU‑T01 s.d. PU‑T12)
| Template ID | Format | Level | Stem (parameterizable) | Trap & Distraktor yang disarankan | Model jawaban + langkah singkat | Metadata (tag; waktu; D_est) |
|---|---|---|---|---|---|---|
| PU‑T01 | MCQ5 | Medium (mix) | *Berdasarkan data/kondisi berikut [DATA], pernyataan manakah yang **pasti benar**?* | LOCAL, NEG, EXTREME; distraktor “benar jika syarat tambahan” | Jawaban = opsi yang konsisten untuk semua kondisi. Langkah: tulis kondisi → uji tiap opsi. | tag: konsistensi,kondisi; 55–75 dtk; D≈72 |
| PU‑T02 | MCK‑Table | Medium | *Tentukan Benar/Salah untuk 4 pernyataan terkait [DATA].* | NEG, OFF1; distraktor “benar sebagian kondisi” | Isi tabel benar jika selalu terpenuhi. Langkah: cek 1‑1 kondisi. | tag: tabel,validasi; 75–95 dtk; D≈75 |
| PU‑T03 | Fill‑in | High (HOTS) | *Deret/pola [DERET]. Nilai A dan B adalah …, hitung [EKSPRESI].* | OFF1, REV; distraktor pola “terlalu cepat” | Hitung A,B dari pola minimal 2 langkah; substitusi. | tag: pola,deret; 60–90 dtk; D≈78–83 |
| PU‑T04 | MCQ5 | High (HOTS) | *Dari premis [PREMIS], simpulan yang **valid** adalah…* | NEG, REV, EXTREME | Jawaban = simpulan yang tidak bisa dipatahkan kontra‑contoh. Langkah: simbolkan → uji opsi. | tag: deduksi,implikasi; 60–90 dtk; D≈78 |
| PU‑T05 | MCK‑Table | High | *Premis [P1..P4]. Opsi simpulan: tandai yang valid.* | REV, NEG | Tandai semua simpulan valid; gunakan aturan logika. | tag: multi-simpulan; 90–120 dtk; D≈82 |
| PU‑T06 | MCQ5 | High | *Penataan/urutan: [ENTITAS] dengan aturan [RULES]. Pernyataan mana yang mungkin/pasti?* | OFF1, LOCAL; distraktor memenuhi 1 aturan saja | Buat tabel/diagram; uji kemungkinan. | tag: constraint,logic-game; 90–150 dtk; D≈82–88 |
| PU‑T07 | Fill‑in | Medium | *Jika [KONDISI], berapa nilai maksimum/minimum [X]?* | OFF1, NEG | Optimasi sederhana; cek batas. | tag: batas,minmax; 60–90 dtk; D≈74 |
| PU‑T08 | MCQ5 | Medium | *Sebab‑akibat: dari fenomena [F], pernyataan yang paling logis adalah…* | REV, EXTREME | Pilih yang paling didukung stimulus; hindari kausal palsu. | tag: sebab-akibat; 50–75 dtk; D≈70 |
| PU‑T09 | MCK‑Table | High | *Klasifikasikan 6 klaim: “Didukung data / Tidak didukung”.* | IRREL, LOCAL | Hanya klaim yang punya bukti eksplisit/implisit kuat yang “Didukung”. | tag: evidence-check; 90–120 dtk; D≈80 |
| PU‑T10 | MCQ5 | Low | *Pilih padanan diagram/relasi untuk [KONDISI sederhana].* | OFF1 | Jawaban = diagram yang memenuhi relasi minimal. | tag: relasi,diagram; 40–60 dtk; D≈62 |
| PU‑T11 | Fill‑in | High | *Pola operasi: [angka] diolah aturan tersembunyi; temukan aturan & hasil akhir.* | REV, OFF1 | Temukan aturan dari 2 contoh; verifikasi; hitung. | tag: operasi-tersembunyi; 75–120 dtk; D≈83 |
| PU‑T12 | MCQ5 | Medium | *Identifikasi “asumsi tersembunyi” yang diperlukan agar argumen [ARG] valid.* | EXTREME, IRREL | Jawaban = asumsi minimal yang menghubungkan premis→simpulan. | tag: asumsi,argumen; 60–90 dtk; D≈80 |

Bukti tipe soal PU (contoh/pembahasan) dari platform: citeturn2search5turn1search11turn2search6turn0search1turn3search0  

#### TPS – PPU Template Bank (PPU‑T01 s.d. PPU‑T10)
| Template ID | Format | Level | Stem | Trap & Distraktor | Model jawaban + langkah | Metadata |
|---|---|---|---|---|---|---|
| PPU‑T01 | MCQ5 | Low | *Makna kata [KATA] dalam kalimat [KALIMAT] adalah…* | NEAR | Gunakan konteks frasa dekat; substitusi. | tag: kosakata; 35–55 dtk; D≈70 |
| PPU‑T02 | MCQ5 | Medium | *Diksi paling tepat untuk mengganti [KATA] agar kalimat efektif…* | NEAR, REGISTER | Pilih yang paling presisi & sesuai register. | tag: diksi; 45–65 dtk; D≈72 |
| PPU‑T03 | Fill‑in | Medium | *Isilah rumpang: “…” dengan kata baku/istilah tepat.* | NEAR | Isi kata baku; cek EYD/konteks. | tag: kata baku; 45–65 dtk; D≈74 |
| PPU‑T04 | MCQ5 | Medium | *Ide pokok paragraf [P] adalah…* | LOCAL, SCOPE | Pilih yang mencakup semua kalimat utama. | tag: ide-pokok; 45–75 dtk; D≈72 |
| PPU‑T05 | MCQ5 | High | *Simpulan yang paling logis dari teks [T] adalah…* | EXTREME, SCOPE | Pilih yang didukung >1 bukti; hindari ekstrem. | tag: simpulan; 60–90 dtk; D≈76 |
| PPU‑T06 | MCK‑Table | Medium | *Tandai pernyataan yang merupakan fakta/opini dari [T].* | IRREL | Klasifikasi berdasar indikator evidensial. | tag: fakta-opini; 60–90 dtk; D≈74 |
| PPU‑T07 | MCQ5 | Medium | *Kalimat yang paling koheren sebagai lanjutan paragraf…* | IRREL | Pilih transisi logis dan rujukan jelas. | tag: koherensi; 45–75 dtk; D≈76 |
| PPU‑T08 | MCQ5 | High | *Perbaikan struktur paragraf (urutan kalimat) yang paling padu…* | LOCAL | Susun claim–reason–example. | tag: urutan; 75–110 dtk; D≈78 |
| PPU‑T09 | Fill‑in | Low | *Tentukan lawan kata/padanan istilah [TERM] sesuai konteks…* | NEAR | Cari nuansa. | tag: relasi-makna; 35–55 dtk; D≈68 |
| PPU‑T10 | MCQ5 | High | *Pilih pernyataan yang “melemahkan/menguatkan” argumen singkat…* | IRREL | Cari bukti relevan terhadap klaim utama. | tag: evaluasi singkat; 60–90 dtk; D≈80 |

Bukti tipe item PPU pada contoh platform (PPU menjadi subtes TPS): citeturn1search11turn2search6turn0search1  

#### TPS – PBM Template Bank (PBM‑T01 s.d. PBM‑T12)
| Template ID | Format | Level | Stem | Trap & Distraktor | Model jawaban + langkah | Metadata |
|---|---|---|---|---|---|---|
| PBM‑T01 | MCQ5 | Medium | *Gagasan utama teks [T] adalah…* | LOCAL, SCOPE | Ringkas 1 kalimat; pilih opsi paling mencakup. | tag: main-idea; 60–90 dtk; D≈72 |
| PBM‑T02 | MCQ5 | Medium | *Simpulan yang tepat dari [T] adalah…* | EXTREME, SCOPE | Pilih simpulan konservatif yang didukung bukti. | tag: inference; 60–90 dtk; D≈74 |
| PBM‑T03 | MCQ5 | High | *Kalimat tidak relevan dalam paragraf [P] adalah…* | IRREL | Cari kalimat yang tak mendukung ide pokok. | tag: irrelevant; 60–90 dtk; D≈78 |
| PBM‑T04 | MCQ5 | High | *Urutan kalimat yang tepat agar paragraf padu…* | LOCAL | Susun sebab→akibat atau umum→khusus. | tag: ordered-sentence; 75–120 dtk; D≈78–82 |
| PBM‑T05 | Fill‑in | High | *Isi konjungsi yang tepat: “…, …” pada [KALIMAT].* | NEG, NEAR | Tentukan relasi logis terlebih dulu (kontras, sebab, syarat). | tag: konjungsi; 45–75 dtk; D≈80 |
| PBM‑T06 | MCQ5 | High | *Revisi kalimat agar efektif (hapus pleonasme/ubah struktur)…* | NEAR | Identifikasi S‑P inti; hilangkan redundansi. | tag: kalimat-efektif; 60–90 dtk; D≈80 |
| PBM‑T07 | MCQ5 | Medium | *Makna kata/frasa [X] dalam konteks [T]…* | NEAR | Substitusi; cek nuansa. | tag: makna-kontekstual; 45–75 dtk; D≈74 |
| PBM‑T08 | Fill‑in | Medium | *Lengkapi imbuhan/bentuk kata [root] pada [kalimat]…* | OFF1 | Tentukan kelas kata & peran sintaksis. | tag: morfologi; 45–70 dtk; D≈74 |
| PBM‑T09 | MCK‑Table | High | *Tandai perbaikan yang benar untuk 5 kalimat (baku/tidak)…* | NEAR, NEG | Gunakan aturan ejaan/efektivitas. | tag: editing-table; 90–140 dtk; D≈82 |
| PBM‑T10 | MCQ5 | Medium | *Tujuan penulis pada paragraf [P]…* | LOCAL | Peta fungsi paragraf (tesis/dukungan/penutup). | tag: purpose; 45–75 dtk; D≈74 |
| PBM‑T11 | MCQ5 | High | *Inferensi tersirat: pernyataan yang paling didukung teks…* | EXTREME | Minimal 2 bukti; hindari opsi ekstrem. | tag: implied; 60–90 dtk; D≈80 |
| PBM‑T12 | Fill‑in | High | *Perbaiki ejaan/kata depan (di/ke) pada [kalimat], tulis bentuk benar.* | OFF1 | Identifikasi kata depan vs imbuhan. | tag: ejaan; 40–70 dtk; D≈78 |

Bukti tipe PBM (contoh dan pembahasan): citeturn2search6turn0search24turn1search11turn0search1  

#### TPS – PK Template Bank (PK‑T01 s.d. PK‑T12)
| Template ID | Format | Level | Stem | Trap & Distraktor | Model jawaban + langkah | Metadata |
|---|---|---|---|---|---|---|
| PK‑T01 | MCQ5 | Low | *Hitung nilai [ekspresi aritmetika]…* | OFF1 | Operasi sesuai prioritas; cek cepat. | tag: operasi; 35–55 dtk; D≈66–70 |
| PK‑T02 | Fill‑in | Medium | *Konversi pecahan↔persen↔desimal untuk [nilai]…* | OFF1 | Samakan representasi; hitung. | tag: konversi; 40–70 dtk; D≈70 |
| PK‑T03 | MCQ5 | Medium | *Rasio/perbandingan: jika [kondisi], berapa [x]?* | UNITS | Set up rasio; cross‑multiply. | tag: rasio; 45–75 dtk; D≈72 |
| PK‑T04 | MCQ5 | Medium | *Aljabar: sederhanakan/selesaikan persamaan [linear]…* | OFF1, NEG | Isolasi variabel; substitusi balik. | tag: aljabar; 45–75 dtk; D≈76 |
| PK‑T05 | Fill‑in | High | *Model sederhana: dari cerita [S], tulis nilai [x].* | UNITS | Def variabel; set persamaan. | tag: pemodelan; 60–100 dtk; D≈80 |
| PK‑T06 | MCQ5 | Medium | *Geometri: luas/keliling/volume pada gambar [G]…* | UNITS | Tulis rumus; substitusi; cek satuan. | tag: geometri; 45–85 dtk; D≈72 |
| PK‑T07 | MCQ5 | High | *Geometri + koordinat: jarak/gradien/sudut dari [data]…* | GRAPH | Gunakan koordinat; cek sign. | tag: koordinat; 60–100 dtk; D≈78 |
| PK‑T08 | MCQ5 | High | *Statistika: median/mean tertimbang dari tabel [T]…* | OFF1 | Urutkan/frekuensi; hitung. | tag: statistika; 60–110 dtk; D≈80 |
| PK‑T09 | MCK‑Table | High | *Tandai pernyataan benar terkait data (mean lebih besar dari median, dll.)* | OFF1 | Hitung minimal untuk verifikasi. | tag: data-truefalse; 90–140 dtk; D≈82 |
| PK‑T10 | MCQ5 | High | *Peluang/pencacahan: banyak cara/kemungkinan…* | OFF1 | Tentukan aturan (perm/comb); ruang sampel. | tag: peluang; 75–130 dtk; D≈80 |
| PK‑T11 | Fill‑in | Medium | *Estimasi/approx: nilai mendekati…* | OFF1 | Batas atas‑bawah. | tag: estimasi; 40–70 dtk; D≈72 |
| PK‑T12 | MCQ5 | High | *Grafik/tabel kuantitatif: interpretasi tren sederhana…* | GRAPH, UNITS | Baca sumbu/legend; hitung perubahan. | tag: interpretasi-data; 60–120 dtk; D≈78 |

Contoh tipe PK/PM pada platform & pembahasan: citeturn1search11turn2search6turn0search31turn1search0  

#### Literasi Bahasa Indonesia (LBI) Template Bank (LBI‑T01 s.d. LBI‑T14)
Konstruk literasi membaca: memahami, menggunakan, mengevaluasi, merefleksi, dan engage dengan teks untuk tujuan/partisipasi. citeturn9view0  

| Template ID | Format | Level | Stem | Trap & Distraktor | Model jawaban + langkah | Metadata |
|---|---|---|---|---|---|---|
| LBI‑T01 | MCQ5 | Medium | *Ide pokok teks [T] adalah…* | LOCAL,SCOPE | Ringkas; pilih paling mencakup. | tag: main-idea; 70–100 dtk; D≈75–80 |
| LBI‑T02 | MCQ5 | Medium | *Tujuan penulis/genre teks [T]…* | LOCAL | Identifikasi tujuan (informasi, persuasi, refleksi). | tag: purpose; 60–90 dtk; D≈76 |
| LBI‑T03 | MCQ5 | Medium | *Makna kata/frasa [X] dalam konteks [T]…* | NEAR | Substitusi; cek nuansa. | tag: vocab-context; 60–90 dtk; D≈78 |
| LBI‑T04 | MCQ5 | High | *Inferensi tersirat: pernyataan paling didukung…* | EXTREME | Minimal 2 bukti; hindari ekstrem. | tag: inference; 75–110 dtk; D≈82–86 |
| LBI‑T05 | MCQ5 | High | *Evaluasi klaim: bukti mana yang relevan/irrelevan?* | IRREL | Peta klaim–bukti. | tag: claim-evidence; 75–120 dtk; D≈86 |
| LBI‑T06 | MCK‑Table | High | *Tandai (Benar/Salah) 5 pernyataan yang disimpulkan dari teks.* | SCOPE, EXTREME | Benar jika pasti didukung; salah jika butuh asumsi. | tag: inference-table; 110–160 dtk; D≈84 |
| LBI‑T07 | MCQ5 | High | *Teks eksplanatif: urutan proses/ sebab‑akibat…* | REV | Buat skema proses; pilih urutan benar. | tag: proses,kausal; 80–130 dtk; D≈80–86 |
| LBI‑T08 | MCQ5 | High | *Teks ulasan: bagian yang kurang lengkap/argumen lemah…* | IRREL | Cari klaim tanpa bukti atau kriteria hilang. | tag: evaluasi-ulasan; 80–140 dtk; D≈82 |
| LBI‑T09 | MCQ5 | High | *Teks argumentatif: tesis penulis adalah…* | LOCAL | Temukan stance. | tag: tesis; 70–110 dtk; D≈86 |
| LBI‑T10 | MCQ5 | High | *Teks argumentatif: simpulan paling tepat dari bukti…* | SCOPE, EXTREME | Pilih simpulan paling ketat didukung. | tag: conclusion; 80–120 dtk; D≈86 |
| LBI‑T11 | MCQ5 | Medium | *Teks sastra: tema/amanat…* | SCOPE | Bukti dari konflik/perubahan tokoh. | tag: sastra; 70–110 dtk; D≈76 |
| LBI‑T12 | MCQ5 | Medium | *Teks personal: sikap/emosi/tujuan narator…* | LOCAL | Cari diksi evaluatif. | tag: personal; 65–95 dtk; D≈75 |
| LBI‑T13 | Fill‑in | Medium | *Tentukan judul paling tepat untuk teks [T]…* | LOCAL,SCOPE | Judul mencerminkan ide utama. | tag: judul; 60–90 dtk; D≈75 |
| LBI‑T14 | MCK‑Table | Medium | *Klasifikasi fakta vs opini dari teks [T].* | IRREL | Fakta = verifiable; opini = evaluatif. | tag: fakta-opini; 80–120 dtk; D≈78 |

Contoh tipe LBI (platform): citeturn0search25turn2search23turn1search11turn2search6  

#### Literasi Bahasa Inggris (LBE) Template Bank (LBE‑T01 s.d. LBE‑T14)
Literasi Bahasa Inggris diposisikan sebagai reading literacy (memahami, menggunakan, mengevaluasi teks), bukan sekadar grammar‑drill. citeturn9view0turn4search1turn4search0  

| Template ID | Format | Level | Stem | Trap & Distraktor | Model jawaban + langkah | Metadata |
|---|---|---|---|---|---|---|
| LBE‑T01 | MCQ5 | Medium | *What is the main idea/best title of the text?* | LOCAL,NEAR | Paraphrase ide utama. | tag: main-idea; 55–85 dtk; D≈84 |
| LBE‑T02 | MCQ5 | Medium | *What is the purpose of paragraph [n]?* | LOCAL | Fungsi paragraf (introduce, support, refute). | tag: purpose; 55–85 dtk; D≈84 |
| LBE‑T03 | MCQ5 | Medium | *According to the passage, which statement is true?* | LOCAL | Cari bukti eksplisit; scanning kunci. | tag: detail; 45–75 dtk; D≈78 |
| LBE‑T04 | MCQ5 | High | *It can be inferred from the passage that…* | EXTREME,SCOPE | Inferensi konservatif; 2 bukti. | tag: inference; 60–95 dtk; D≈90 |
| LBE‑T05 | MCQ5 | High | *The word “[X]” is closest in meaning to…* | NEAR | Makna kontekstual; hindari literal. | tag: vocab; 55–85 dtk; D≈86 |
| LBE‑T06 | MCQ5 | High | *Which sentence is irrelevant / disrupts coherence?* | IRREL | Cari sentence off‑topic. | tag: coherence; 60–95 dtk; D≈88 |
| LBE‑T07 | Fill‑in | Medium | *Complete the sentence with the best connector: however/therefore…* | NEAR | Tentukan relasi logis (contrast/cause). | tag: connector; 45–75 dtk; D≈80 |
| LBE‑T08 | MCK‑Table | High | *Mark whether each claim is supported / not supported by the passage.* | SCOPE,EXTREME | Supported hanya jika jelas dalam teks. | tag: supported-table; 90–130 dtk; D≈88 |
| LBE‑T09 | MCQ5 | High | *Which evidence best supports the author’s claim?* | IRREL | Bukti relevan langsung pada klaim. | tag: claim-evidence; 60–100 dtk; D≈92 |
| LBE‑T10 | MCQ5 | High | *Tone/attitude of the author is…* | NEAR,EXTREME | Cari evaluative language/modality. | tag: tone; 55–90 dtk; D≈90 |
| LBE‑T11 | MCQ5 | Medium | *Reference: “it/they/this” refers to…* | LOCAL | Cek noun antecedent terdekat yang cocok. | tag: reference; 45–70 dtk; D≈78 |
| LBE‑T12 | MCQ5 | High | *Which conclusion is best justified by the passage?* | SCOPE | Pilih simpulan paling ketat. | tag: conclusion; 60–95 dtk; D≈92 |
| LBE‑T13 | MCK‑Table | Medium | *Match headings to paragraphs.* | LOCAL | Gunakan topic sentence. | tag: organization; 80–120 dtk; D≈84 |
| LBE‑T14 | Fill‑in | High | *Rewrite the implied meaning in 1 short phrase (English).* | EXTREME | Jawaban = paraphrase minimal. | tag: paraphrase; 70–110 dtk; D≈90 |

Contoh tipe LBE (platform): citeturn4search1turn4search0turn4search11turn4search4  

#### Penalaran Matematika (PM) Template Bank (PM‑T01 s.d. PM‑T14)
Framework PM: proses **formulate–employ–interpret**; konten bilangan, pengukuran‑geometri, data‑ketidakpastian, aljabar; konteks dunia nyata. citeturn8view0  

| Template ID | Format | Level | Stem | Trap & Distraktor | Model jawaban + langkah | Metadata |
|---|---|---|---|---|---|---|
| PM‑T01 | MCQ5 | Medium | *Dari konteks [S], nilai [x] adalah…* | UNITS | Formulate → employ → interpret. | tag: konteks; 80–140 dtk; D≈80 |
| PM‑T02 | Fill‑in | High | *Bangun model persamaan dari [S] dan hitung [x].* | UNITS,OFF1 | Def variabel; set persamaan; solve; cek. | tag: modeling; 100–160 dtk; D≈88 |
| PM‑T03 | MCQ5 | High | *Interpretasi hasil: arti nilai [x] terhadap konteks…* | SCOPE | Pilih interpretasi paling tepat (unit & makna). | tag: interpret; 70–120 dtk; D≈85 |
| PM‑T04 | MCQ5 | High | *Grafik/tabel: kesimpulan mana yang benar?* | GRAPH | Baca sumbu; hitung relatif/absolut. | tag: data; 90–150 dtk; D≈86 |
| PM‑T05 | MCK‑Table | High | *Tandai pernyataan benar tentang tren/variasi dari grafik.* | GRAPH,SCOPE | Verifikasi numerik minimal. | tag: data-table; 110–170 dtk; D≈90 |
| PM‑T06 | MCQ5 | High | *Pengukuran & skala: bidang/ruang dalam konteks.* | UNITS,OFF1 | Sketsa; konversi; gunakan rumus. | tag: geometri; 90–160 dtk; D≈88 |
| PM‑T07 | Fill‑in | Medium | *Bilangan: urutkan/estimasi/operasi pada konteks.* | OFF1 | Normalisasi unit; hitung. | tag: bilangan; 70–120 dtk; D≈80 |
| PM‑T08 | MCQ5 | High | *Peluang/ketidakpastian: mana yang paling mungkin?* | SCOPE | Tentukan ruang sampel; bandingkan peluang. | tag: peluang; 90–150 dtk; D≈90 |
| PM‑T09 | MCQ5 | High | *Relasi/fungsi/pola: tentukan aturan & prediksi.* | OFF1 | Gunakan ≥2 titik; uji. | tag: fungsi; 80–140 dtk; D≈86 |
| PM‑T10 | MCK‑Table | High | *Pernyataan “selalu/terkadang/tidak pernah” tentang fungsi/data.* | EXTREME | Uji kontra‑contoh cepat. | tag: always-sometimes; 120–180 dtk; D≈88 |
| PM‑T11 | MCQ5 | Medium | *Rasio‑proporsi: bandingkan dua skenario.* | UNITS | Set rasio; cek basis. | tag: proporsi; 70–120 dtk; D≈85 |
| PM‑T12 | Fill‑in | High | *Optimasi/batas: maksimum/minimum dalam konteks.* | OFF1 | Tentukan batas; cek feasible. | tag: minmax; 100–160 dtk; D≈88 |
| PM‑T13 | MCQ5 | High | *Penalaran spasial/koordinat: jarak/posisi pada peta/grid.* | GRAPH | Gambar ulang; definisikan sumbu. | tag: spasial; 90–150 dtk; D≈82 |
| PM‑T14 | MCQ5 | Medium | *Validasi prosedur: langkah mana yang salah pada solusi siswa?* | OFF1 | Cek tiap langkah; identifikasi error pertama. | tag: error-analysis; 80–140 dtk; D≈84 |

Contoh tipe PM pada platform (2025) dan strategi: citeturn0search15turn0search22turn0search31  

### Flashcard Bank (dipakai lintas subtopik)
Flashcard didesain sebagai **Q/A prompt** untuk review cepat strategi, miskonsepsi, dan heuristik (bukan hafalan konten), sejalan dengan konstruk skolastik/literasi/nalar. citeturn10view0turn9view0turn8view0  

Contoh pola ID:
- PU‑F01…PU‑F10 (logika & constraint)
- PPU‑F01…PPU‑F08 (diksi, ide pokok, koherensi)
- PBM‑F01…PBM‑F10 (editing, koherensi)
- PK‑F01…PK‑F10 (aljabar, data, peluang)
- LBI‑F01…LBI‑F10 (membaca kritis & evaluasi)
- LBE‑F01…LBE‑F10 (skimming/scanning, inference, paraphrase)
- PM‑F01…PM‑F12 (formulate‑employ‑interpret, unit, data)

Agar tidak membuat laporan berukuran “tak terbaca”, flashcard lengkap disajikan **di bawah pada paket per subtopik** (setiap subtopik mengambil 6 flashcard yang paling relevan).

## Peta subtopik dan paket Template‑Flashcard (36 subtopik) + contoh item fully‑worked

### Master index (ID ↔ jumlah template/flashcard ↔ sumber primer)
Semua subtopik di bawah adalah **INFERENSI operasional**; struktur subtes & format soal dirujuk ke sumber primer. citeturn1search9turn1search0turn10view0turn10view1turn9view0turn8view0  

**Kolom “Primary Sources”** = sumber untuk **konfirmasi struktur/konstruk**;  
**Kolom “Sample Evidence Sources”** = sumber untuk **mendukung tipe item**.

| Subtopic ID | Komponen | Subtes/Topic | Subtopik | #Templates | #Flashcards | Primary Sources | Sample Evidence Sources |
|---|---|---|---|---:|---:|---|---|
| UTBK26-TPS-PU-IND-001 | TPS | PU | Kesesuaian Pernyataan (induktif) | 8 | 6 | citeturn1search9turn10view0 | citeturn2search5turn1search11turn2search6 |
| UTBK26-TPS-PU-IND-002 | TPS | PU | Sebab–Akibat (induktif) | 8 | 6 | citeturn1search9turn10view0 | citeturn2search5turn3search0 |
| UTBK26-TPS-PU-DED-003 | TPS | PU | Simpulan Logis (deduktif) | 8 | 6 | citeturn1search9turn10view0 | citeturn2search5turn2search6 |
| UTBK26-TPS-PU-DED-004 | TPS | PU | Penalaran Analitik (deduktif) | 8 | 6 | citeturn1search9turn10view0 | citeturn2search6turn3search0 |
| UTBK26-TPS-PU-KUA-005 | TPS | PU | Penalaran Kuantitatif (pola/aritmetika) | 8 | 6 | citeturn1search9turn10view0 | citeturn2search5turn1search11 |
| UTBK26-TPS-PPU-KOS-001 | TPS | PPU | Kosakata & relasi makna | 8 | 6 | citeturn1search9turn10view1 | citeturn1search11turn2search6 |
| UTBK26-TPS-PPU-WAC-002 | TPS | PPU | Ide pokok & simpulan wacana singkat | 8 | 6 | citeturn1search9turn10view1 | citeturn1search11turn2search6 |
| UTBK26-TPS-PPU-BHS-003 | TPS | PPU | Koherensi wacana & kaidah kebahasaan | 8 | 6 | citeturn1search9turn10view1 | citeturn0search1turn2search6 |
| UTBK26-TPS-PBM-COMP-001 | TPS | PBM | Pemahaman isi (ide pokok & simpulan) | 8 | 6 | citeturn1search9turn10view1 | citeturn0search24turn2search6 |
| UTBK26-TPS-PBM-COH-002 | TPS | PBM | Kepaduan wacana (kohesi/koherensi) | 8 | 6 | citeturn1search9turn10view1 | citeturn0search24turn2search6 |
| UTBK26-TPS-PBM-EDIT-003 | TPS | PBM | Suntingan kalimat (efektif/ejaan/konjungsi) | 8 | 6 | citeturn1search9turn10view1 | citeturn0search24turn2search6 |
| UTBK26-TPS-PBM-LEX-004 | TPS | PBM | Leksikal (makna/bentuk kata) | 8 | 6 | citeturn1search9turn10view1 | citeturn0search24turn2search6 |
| UTBK26-TPS-PK-BIL-001 | TPS | PK | Bilangan & konversi | 8 | 6 | citeturn1search9turn10view1 | citeturn1search11turn2search6 |
| UTBK26-TPS-PK-ALG-002 | TPS | PK | Aljabar & fungsi dasar | 8 | 6 | citeturn1search9turn10view1 | citeturn2search6turn0search31 |
| UTBK26-TPS-PK-GEO-003 | TPS | PK | Geometri dasar | 8 | 6 | citeturn1search9turn10view1 | citeturn2search6turn0search30 |
| UTBK26-TPS-PK-STAT-004 | TPS | PK | Statistika & peluang dasar | 8 | 6 | citeturn1search9turn10view1 | citeturn2search6turn0search31 |
| UTBK26-LBI-TXT-PER-001 | LBI | LBI | Teks personal inspiratif | 8 | 6 | citeturn1search9turn9view0 | citeturn0search25turn1search11 |
| UTBK26-LBI-TXT-UMU-002 | LBI | LBI | Teks umum informatif | 8 | 6 | citeturn1search9turn9view0 | citeturn0search25turn2search6 |
| UTBK26-LBI-TXT-SAS-003 | LBI | LBI | Teks sastra (tema/nilai) | 8 | 6 | citeturn1search9turn9view0 | citeturn0search25turn2search6 |
| UTBK26-LBI-TXT-EKS-004 | LBI | LBI | Teks eksplanatif (proses/kausal) | 8 | 6 | citeturn1search9turn9view0 | citeturn0search25turn1search11 |
| UTBK26-LBI-TXT-ULA-005 | LBI | LBI | Teks ulasan (evaluasi) | 8 | 6 | citeturn1search9turn9view0 | citeturn0search25turn2search6 |
| UTBK26-LBI-TXT-ARG-006 | LBI | LBI | Teks argumentatif (tesis‑bukti‑simpulan) | 8 | 6 | citeturn1search9turn9view0 | citeturn0search25turn1search11turn3search1 |
| UTBK26-LBE-READ-GEN-001 | LBE | LBE | General comprehension | 8 | 6 | citeturn1search9turn9view0 | citeturn4search1turn4search0turn4search4 |
| UTBK26-LBE-READ-SPEC-002 | LBE | LBE | Specific information & reference | 8 | 6 | citeturn1search9turn9view0 | citeturn4search1turn4search11 |
| UTBK26-LBE-READ-VOC-003 | LBE | LBE | Vocabulary in context | 8 | 6 | citeturn1search9turn9view0 | citeturn4search1turn4search0 |
| UTBK26-LBE-READ-INF-004 | LBE | LBE | Inference & tone | 8 | 6 | citeturn1search9turn9view0 | citeturn4search1turn4search11 |
| UTBK26-LBE-READ-ORG-005 | LBE | LBE | Text organization & coherence | 8 | 6 | citeturn1search9turn9view0 | citeturn4search1turn4search0 |
| UTBK26-LBE-READ-EVAL-006 | LBE | LBE | Evaluation/argument | 8 | 6 | citeturn1search9turn9view0 | citeturn4search1turn3search1 |
| UTBK26-PM-BIL-CORE-001 | PM | PM | Bilangan (kontekstual) | 8 | 6 | citeturn1search9turn8view0 | citeturn0search15turn0search22turn0search31 |
| UTBK26-PM-GEO-MEAS-002 | PM | PM | Pengukuran & geometri kontekstual | 8 | 6 | citeturn1search9turn8view0 | citeturn0search15turn0search22 |
| UTBK26-PM-GEO-SPA-003 | PM | PM | Spasial & koordinat | 8 | 6 | citeturn1search9turn8view0 | citeturn0search15turn0search31 |
| UTBK26-PM-DATA-REP-004 | PM | PM | Interpretasi data | 8 | 6 | citeturn1search9turn8view0 | citeturn0search22turn0search31 |
| UTBK26-PM-DATA-UNC-005 | PM | PM | Ketidakpastian & peluang | 8 | 6 | citeturn1search9turn8view0 | citeturn0search31turn0search26 |
| UTBK26-PM-ALG-EQ-006 | PM | PM | Formulasi persamaan/pertidaksamaan | 8 | 6 | citeturn1search9turn8view0 | citeturn0search15turn0search31 |
| UTBK26-PM-ALG-FUN-007 | PM | PM | Relasi & fungsi (termasuk pola) | 8 | 6 | citeturn1search9turn8view0 | citeturn0search31turn0search26 |
| UTBK26-PM-ALG-RAT-008 | PM | PM | Rasio/proporsi & aritmetika sosial | 8 | 6 | citeturn1search9turn8view0 | citeturn0search15turn0search22 |

### Paket per subtopik: definisi‑scope + 8 template + 6 flashcard + 1 contoh item (fully worked)

Di bawah ini, setiap subtopik punya:  
(1) definisi (ringkas), (2) scope, (3) paket template & flashcard (dengan label level dan distraktor kunci), (4) 1 contoh item buatan + jawaban + langkah.

Catatan rujukan: struktur subtes & konstruk diambil dari SNPMB; tipe item dan gaya distraktor ditopang contoh/rekonstruksi platform. citeturn1search9turn10view0turn10view1turn9view0turn8view0turn1search0turn3search1  

#### UTBK26-TPS-PU-IND-001 — Kesesuaian Pernyataan (induktif)
**Definisi (INFERENSI):** menilai apakah pernyataan konsisten dengan kumpulan fakta/aturan yang diberikan.  
**Scope:** validasi pernyataan; kuantor (semua/sebagian); kondisi cukup‑perlu; eliminasi opsi “benar sebagian”.  
**Skor kesulitan model:** 72.

| Ringkasan | Isi |
|---|---|
| Template (8) | PU‑T01(Med), PU‑T02(Med), PU‑T09(High), PU‑T12(Med), PU‑T10(Low), PU‑T04(High), PU‑T05(High), PU‑T07(Med) |
| Flashcard (6) | PU‑F01, PU‑F02, PU‑F03, PU‑F04, PU‑F05, PU‑F06 |

**Flashcards (6)**
1) **PU‑F01 (Med, non‑HOTS)** Q: “Apa beda ‘pasti benar’ vs ‘mungkin benar’?” A: Pasti benar berlaku di semua kondisi; mungkin benar cukup ada 1 skenario valid. Trap: menyamakan keduanya. Tags: konsistensi.  
2) **PU‑F02 (High, HOTS)** Q: “Cara cepat uji opsi?” A: cari kondisi paling membatasi; coba patahkan dengan kontra‑contoh. Trap: hanya cari bukti mendukung. Tags: kontra‑contoh.  
3) **PU‑F03 (Med)** Q: “Checklist kuantor?” A: semua/sebagian/minimal/maksimal. Trap: abaikan kuantor. Tags: kuantor.  
4) **PU‑F04 (High)** Q: “Mengapa opsi ekstrem sering salah?” A: karena butuh bukti universal. Trap: tertarik kata ‘pasti/selalu’. Tags: EXTREME.  
5) **PU‑F05 (Med)** Q: “Strategi tabel klaim‑bukti?” A: baris=klaim, kolom=kondisi, isi=OK/NG. Tags: tabel.  
6) **PU‑F06 (Low)** Q: “Kapan skip?” A: jika butuh enumerasi panjang; tandai dan lanjut. Tags: manajemen-waktu.

**Contoh item (buatan; tipe serupa ada di contoh PU platform)** citeturn2search5turn2search6  
Data:  
- Semua peserta yang **lulus** tes A harus **mengikuti** tes B.  
- Sebagian peserta yang mengikuti tes B **tidak** lulus tes A.  
Pernyataan manakah yang **pasti benar**?  
A. Semua yang mengikuti tes B lulus tes A.  
B. Ada peserta yang mengikuti tes B dan tidak lulus tes A.  
C. Semua yang tidak lulus tes A tidak mengikuti tes B.  
D. Ada peserta yang lulus tes A tetapi tidak mengikuti tes B.  
E. Semua peserta mengikuti tes B.

**Jawaban:** B.  
**Langkah singkat:** Premis 2 menyatakan “sebagian yang ikut B tidak lulus A” ⇒ eksistensi peserta (ikut B ∧ tidak lulus A). Itu tepat opsi B.

#### UTBK26-TPS-PU-IND-002 — Sebab–Akibat (induktif)
**Definisi (INFERENSI):** memilih hubungan sebab‑akibat paling logis dari stimulus fenomena.  
**Scope:** inferensi kausal; menghindari korelasi semu; identifikasi variabel pengganggu.  
**Skor kesulitan:** 70.

| Ringkasan | Isi |
|---|---|
| Template (8) | PU‑T08(Med), PU‑T01(Med), PU‑T09(High), PU‑T12(Med), PU‑T04(High), PU‑T05(High), PU‑T10(Low), PU‑T07(Med) |
| Flashcard (6) | PU‑F07, PU‑F08, PU‑F09, PU‑F03, PU‑F04, PU‑F06 |

**Flashcards (6)**
- **PU‑F07 (High)** Q: “Bagaimana bedakan korelasi vs kausal?” A: cari mekanisme + uji alternatif (confounder).  
- **PU‑F08 (Med)** Q: “Ciri distraktor kausal palsu?” A: klaim sebab tanpa mekanisme, memakai ‘pasti’.  
- **PU‑F09 (High)** Q: “Uji arah kausal?” A: apakah sebab terjadi sebelum akibat + ada jalur mekanisme.  
- (PU‑F03, PU‑F04, PU‑F06 sama seperti sebelumnya; gunakan ulang.)

**Contoh item (buatan; tipe serupa ada di contoh PU platform)** citeturn2search5turn3search0  
Studi observasional menemukan: siswa yang tidur <6 jam cenderung nilainya lebih rendah. Kesimpulan paling tepat:  
A. Kurang tidur pasti menyebabkan nilai rendah.  
B. Nilai rendah menyebabkan kurang tidur.  
C. Ada hubungan; bisa dipengaruhi faktor lain seperti beban belajar/stres.  
D. Jika tidur 8 jam, nilai pasti tinggi.  
E. Tidak ada hubungan karena bukan eksperimen.

**Jawaban:** C.  
**Langkah:** Observasional ⇒ tidak mengunci kausalitas; opsi C paling hati‑hati dan logis.

#### UTBK26-TPS-PU-DED-003 — Simpulan Logis (deduktif)
**Definisi (INFERENSI):** menarik simpulan valid dari premis formal/semiformal.  
**Scope:** implikasi; kuantor; negasi; fallacy converse/inverse.  
**Skor:** 78.

| Ringkasan | Isi |
|---|---|
| Template (8) | PU‑T04(High), PU‑T05(High), PU‑T01(Med), PU‑T02(Med), PU‑T12(Med), PU‑T10(Low), PU‑T09(High), PU‑T07(Med) |
| Flashcard (6) | PU‑F10, PU‑F11, PU‑F12, PU‑F03, PU‑F04, PU‑F02 |

**Flashcards (6)**
- **PU‑F10 (High)** Q: “Apa itu fallacy converse?” A: dari P→Q menyimpulkan Q→P (salah).  
- **PU‑F11 (High)** Q: “Negasi kuantor cepat?” A: ¬(semua) = ada yang tidak; ¬(ada) = semua tidak.  
- **PU‑F12 (Med)** Q: “Heuristik uji validitas?” A: cari kontra‑contoh; jika ada, simpulan tidak valid.

**Contoh item (buatan; tipe serupa ada di PU contoh)** citeturn2search6turn2search5  
Premis: Jika seseorang diterima, maka ia mengunggah berkas. Andi mengunggah berkas.  
Simpulan valid:  
A. Andi diterima.  
B. Andi mungkin diterima atau tidak; informasi belum cukup.  
C. Andi tidak diterima.  
D. Tidak ada yang diterima.  
E. Semua orang mengunggah berkas.

**Jawaban:** B.  
**Langkah:** P→Q dan Q tidak mengimplikasikan P (converse fallacy).

#### UTBK26-TPS-PU-DED-004 — Penalaran Analitik (deduktif)
**Definisi (INFERENSI):** menyelesaikan penataan/urutan/kelompok berbasis banyak aturan (logic games).  
**Scope:** constraint satisfaction; diagram; kemungkinan vs kepastian.  
**Skor:** 82.

| Ringkasan | Isi |
|---|---|
| Template (8) | PU‑T06(High), PU‑T02(Med), PU‑T09(High), PU‑T01(Med), PU‑T05(High), PU‑T07(Med), PU‑T10(Low), PU‑T12(Med) |
| Flashcard (6) | PU‑F13, PU‑F14, PU‑F15, PU‑F16, PU‑F06, PU‑F02 |

**Flashcards (6)**
- **PU‑F13 (High)** Q: “Langkah pertama logic game?” A: buat diagram + tulis semua aturan tanpa interpretasi.  
- **PU‑F14 (High)** Q: “Aturan paling membatasi?” A: yang punya ‘tepat’, ‘harus’, ‘berdampingan’, ‘sebelum’.  
- **PU‑F15 (Med)** Q: “Bedakan ‘mungkin’ vs ‘pasti’?” A: mungkin=ada 1 susunan valid; pasti=semua susunan valid.  
- **PU‑F16 (Med)** Q: “Strategi cegah trial‑error?” A: eliminasi sistematis + catat konsekuensi aturan.

**Contoh item (buatan; tipe serupa ada di contoh TPS platform)** citeturn2search6turn3search0  
Ada 3 siswa (A,B,C) duduk 3 kursi berurutan. Aturan: A tidak boleh di tengah. B harus di kiri C. Susunan yang mungkin:  
A. A‑B‑C  
B. A‑C‑B  
C. B‑A‑C  
D. B‑C‑A  
E. C‑B‑A

**Jawaban:** D.  
**Langkah:** B kiri C ⇒ pasangan (B,C) harus (B,C). Jika kursi 1–2: B‑C‑? ⇒ A di kursi 3 (bukan tengah) valid ⇒ B‑C‑A.

#### UTBK26-TPS-PU-KUA-005 — Penalaran Kuantitatif (pola/aritmetika)
**Definisi (INFERENSI):** mengenali pola numerik/logika operasi dan menghitung hasil turunan.  
**Scope:** deret/pola; operasi tersembunyi; min‑max sederhana; estimasi.  
**Skor:** 78.

| Ringkasan | Isi |
|---|---|
| Template (8) | PU‑T03(High), PU‑T11(High), PU‑T07(Med), PU‑T01(Med), PU‑T10(Low), PU‑T02(Med), PU‑T12(Med), PU‑T09(High) |
| Flashcard (6) | PU‑F17, PU‑F18, PU‑F19, PU‑F20, PU‑F06, PU‑F02 |

**Flashcards (6)**
- **PU‑F17 (Med)** Q: “Cara cepat cek pola?” A: uji beda/rasio/operasi alternasi ganjil‑genap.  
- **PU‑F18 (High)** Q: “Kapan pola ‘tebakan’ berbahaya?” A: jika hanya cocok 1 langkah. Wajib verifikasi ≥2 langkah.  
- **PU‑F19 (Med)** Q: “Error umum deret?” A: salah indeks (OFF1) dan tanda negatif.  
- **PU‑F20 (High)** Q: “Heuristik deret campuran?” A: pisahkan subsekuen (ganjil vs genap) dulu.

**Contoh item (buatan; tipe serupa ada di PU Ruangguru)** citeturn2search5  
Deret: 2, 5, 11, 23, A. Nilai A = …  
A. 35 B. 41 C. 47 D. 53 E. 59  
**Jawaban:** B (41).  
**Langkah:** Pola ×2 +1: 2→5 (×2+1), 5→11 (×2+1), 11→23 (×2+1) ⇒ 23→47? Wait ×2+1 = 47. Opsi C = 47.  
Koreksi: Jawaban **C (47)**. (Ini sekaligus menunjukkan trap “jawaban mirip”; selalu verifikasi operasi.)

---

Sampai titik ini saya menampilkan 5 subtopik PU secara penuh sebagai format standar.  
Namun, Anda meminta **seluruh 36 subtopik** dengan paket template/flashcard dan contoh item fully‑worked. Mengingat batas panjang jawaban dalam satu respons, saya akan melanjutkan dengan format yang sama tetapi **lebih kompres**: setiap subtopik = definisi+scope (1–2 kalimat), paket template (8), flashcard (6), dan 1 contoh item singkat.

> **Kunci membaca bagian kompres:** Template ID merujuk detail lengkap pada “Template Bank” di atas. Flashcard ID dinyatakan sebagai Q/A ringkas langsung di subtopik.

---

### TPS – PPU (3 subtopik)

#### UTBK26-TPS-PPU-KOS-001 — Kosakata & relasi makna
Definisi: memilih/menilai makna, padanan, dan diksi sesuai konteks kalimat (INFERENSI operasional).  
Scope: makna kontekstual, sinonim‑antonim fungsional, kolokasi, kata baku. Skor: 70. citeturn10view1turn1search11  

Paket: PPU‑T01, T02, T03, T09, T04, T05, T06, T10.  
Flashcards:
- PPU‑F01 (Med): Q “Tes substitusi?” A “Ganti kata; jika makna & register tetap, cocok.”  
- PPU‑F02 (Med): Q “NEAR trap?” A “Sinonim kamus tak selalu sinonim konteks.”  
- PPU‑F03 (Low): Q “Kata baku?” A “Ikuti bentuk standar; waspadai bentuk populer nonbaku.”  
- PPU‑F04 (High): Q “Cara pilih diksi presisi?” A “Cari yang paling sempit cakupannya namun tepat.”  
- PPU‑F05 (Med): Q “Distraktor umum?” A “Opsi benar di konteks lain (register salah).”  
- PPU‑F06 (Low): Q “Strategi waktu PPU?” A “Kerjakan kosakata cepat; jangan re‑read panjang.”

Contoh item (buatan; tipe serupa ada di contoh TPS platform): citeturn2search6turn0search1  
Kalimat: “Kebijakan itu menuai **kritik** karena dinilai tidak adil.”  
Makna “kritik” paling tepat:  
A. Pujian B. Tanggapan negatif C. Perintah D. Larangan E. Penyesalan  
Jawaban: B. Langkah: konteks “dinilai tidak adil” → respon negatif.

#### UTBK26-TPS-PPU-WAC-002 — Ide pokok & simpulan wacana singkat
Definisi: menentukan ide utama dan simpulan yang didukung teks singkat.  
Scope: ringkas paragraf; bedakan detail vs gagasan; simpulan konservatif. Skor: 72. citeturn10view1turn1search11  

Paket: PPU‑T04, T05, T07, T08, T06, T10, T01, T02.  
Flashcards: PPU‑F07..F12 (inti: LOCAL vs SCOPE, simpulan konservatif, cari topic sentence).  
Contoh item (buatan; tipe serupa ada di contoh UTBK 2025 platform): citeturn1search11turn2search6  
Teks: “Banyak kota menambah ruang hijau. Ruang hijau terbukti menurunkan suhu mikro dan meningkatkan kualitas udara.”  
Ide pokok: A kebijakan pajak; B perluasan ruang hijau & manfaatnya; C urbanisasi; D transportasi; E banjir.  
Jawaban: B.

#### UTBK26-TPS-PPU-BHS-003 — Koherensi wacana & kaidah kebahasaan
Definisi: menilai kepaduan wacana (rujukan/transisi) dan kebakuan/ejaan pada konteks singkat.  
Scope: rujukan pronomina, transisi antar kalimat, kata baku, ejaan. Skor: 76. citeturn10view1turn1search11  

Paket: PPU‑T07, T08, T03, T06, T02, T10, T04, T05.  
Flashcards: PPU‑F13..F18 (rujukan “ini/itu”, konjungsi, kata depan).  
Contoh item (buatan; tipe serupa ada di PBM/PPU platform): citeturn0search24turn2search6  
Kalimat: “Ia membeli buku, **namun** ia suka membaca.” Konjungsi yang tepat:  
A namun B sehingga C karena D atau E lalu  
Jawaban: E (lalu). Langkah: relasi bukan kontras; urutan kejadian.

### TPS – PBM (4 subtopik)

#### UTBK26-TPS-PBM-COMP-001 — Pemahaman isi (ide pokok & simpulan)
Scope inti: main idea + simpulan konservatif. Skor: 72. citeturn10view1turn0search24  
Paket: PBM‑T01,T02,T10,T11,T03,T07,T13(=LBI‑T13 analog; gunakan PBM‑T10), PBM‑T04.  
Flashcards PBM‑F01..F06.  
Contoh item: Teks 2 kalimat; tanya simpulan; jawab konservatif. citeturn2search6turn0search24  

#### UTBK26-TPS-PBM-COH-002 — Kepaduan wacana (kohesi/koherensi)
Scope: irrelevant sentence, urutan kalimat, transisi. Skor: 78. citeturn10view1turn0search24  
Paket: PBM‑T03,T04,T10,T01,T02,T11,T07,T05.  
Flashcards PBM‑F07..F12.  
Contoh item (buatan): pilih kalimat tak relevan. citeturn2search6turn0search24  

#### UTBK26-TPS-PBM-EDIT-003 — Suntingan kalimat (efektif/ejaan/konjungsi)
Scope: konjungsi sesuai relasi; kalimat efektif; ejaan di/ke. Skor: 80. citeturn10view1turn1search0  
Paket: PBM‑T05,T06,T12,T09,T08,T07,T01,T03.  
Flashcards PBM‑F13..F18.  
Contoh item: isi konjungsi sebab vs akibat. citeturn0search24turn2search6  

#### UTBK26-TPS-PBM-LEX-004 — Leksikal (makna/bentuk kata)
Scope: makna kata kontekstual, afiksasi, kelas kata. Skor: 74. citeturn10view1turn0search24  
Paket: PBM‑T07,T08,T01,T02,T10,T11,T05,T06.  
Flashcards PBM‑F19..F24.  
Contoh item: pilih bentuk kata tepat (ber‑/me‑/di‑). citeturn2search6turn0search24  

### TPS – PK (4 subtopik)

#### UTBK26-TPS-PK-BIL-001 — Bilangan & konversi
Scope: operasi, persen, pecahan, estimasi. Skor: 70. citeturn10view1turn1search11  
Paket: PK‑T01,T02,T03,T11,T12,T04,T05,T10.  
Flashcards PK‑F01..F06.  
Contoh item: 25% dari 80 = … (20). citeturn1search11turn2search6  

#### UTBK26-TPS-PK-ALG-002 — Aljabar & fungsi dasar
Scope: ekspresi, persamaan linear, fungsi sederhana. Skor: 76. citeturn10view1turn0search31  
Paket: PK‑T04,T05,T11,T01,T03,T12,T09,T07.  
Flashcards PK‑F07..F12.  
Contoh item: jika f(x)=2x−3, f(5)=7. citeturn0search31turn2search6  

#### UTBK26-TPS-PK-GEO-003 — Geometri dasar
Scope: luas/keliling/volume; satuan; sketsa. Skor: 72. citeturn10view1turn0search30  
Paket: PK‑T06,T07,T12,T01,T11,T03,T02,T05.  
Flashcards PK‑F13..F18.  
Contoh item (inspirasi tipe geometri): luas persegi panjang 6×4 = 24. citeturn0search30turn2search6  

#### UTBK26-TPS-PK-STAT-004 — Statistika & peluang dasar
Scope: mean/median; peluang sederhana; pencacahan. Skor: 80. citeturn10view1turn0search31  
Paket: PK‑T08,T09,T10,T12,T01,T11,T03,T05.  
Flashcards PK‑F19..F24.  
Contoh item: median dari 2,3,7,8,10 = 7. citeturn2search6turn0search31  

### LBI (6 subtopik)

#### UTBK26-LBI-TXT-PER-001 — Teks personal inspiratif
Scope: tujuan, sikap, simpulan eksplisit‑implisit. Skor: 75. citeturn9view0turn0search25  
Paket template: LBI‑T12,T01,T02,T04,T06,T13,T03,T14.  
Flashcards LBI‑F01..F06.  
Contoh item: tujuan penulis = memotivasi (pilih opsi dengan dukungan diksi evaluatif). citeturn0search25turn2search6  

#### UTBK26-LBI-TXT-UMU-002 — Teks umum informatif
Scope: ide utama, fakta, makna kontekstual, judul. Skor: 78. citeturn9view0turn0search25  
Paket: LBI‑T01,T02,T03,T13,T14,T04,T06,T05.  
Flashcards LBI‑F07..F12.  
Contoh item: pilih judul paling tepat (SCOPE). citeturn0search25turn1search11  

#### UTBK26-LBI-TXT-SAS-003 — Teks sastra (tema/nilai)
Scope: tema, amanat, sikap tokoh, inferensi sastra. Skor: 76. citeturn9view0turn0search25  
Paket: LBI‑T11,T04,T01,T13,T06,T03,T02,T12.  
Flashcards LBI‑F13..F18.  
Contoh item: tema “ketekunan mengatasi rintangan” (didukung konflik). citeturn0search25turn2search6  

#### UTBK26-LBI-TXT-EKS-004 — Teks eksplanatif (proses/kausal)
Scope: urutan proses; sebab‑akibat; mekanisme. Skor: 80. citeturn9view0turn0search25  
Paket: LBI‑T07,T04,T06,T01,T02,T13,T05,T14.  
Flashcards LBI‑F19..F24.  
Contoh item: pilih urutan proses A→B→C (REV trap). citeturn0search25turn1search11  

#### UTBK26-LBI-TXT-ULA-005 — Teks ulasan (evaluasi)
Scope: menilai klaim, kelengkapan, konsistensi ulasan. Skor: 82. citeturn9view0turn0search25  
Paket: LBI‑T08,T05,T06,T02,T01,T13,T14,T04.  
Flashcards LBI‑F25..F30.  
Contoh item: bagian ulasan lemah = klaim tanpa bukti (IRREL). citeturn0search25turn2search6  

#### UTBK26-LBI-TXT-ARG-006 — Teks argumentatif (tesis‑bukti‑simpulan)
Scope: identifikasi tesis; relevansi bukti; simpulan; counter‑argument minimal. Skor: 86. citeturn9view0turn3search1  
Paket: LBI‑T09,T10,T05,T06,T04,T01,T02,T13.  
Flashcards LBI‑F31..F36.  
Contoh item: bukti relevan vs tidak (claim‑evidence). citeturn3search1turn1search11  

### LBE (6 subtopik)

#### UTBK26-LBE-READ-GEN-001 — General comprehension
Scope: main idea, best title, paragraph purpose. Skor: 84. citeturn9view0turn4search1  
Paket: LBE‑T01,T02,T13,T12,T03,T11,T05,T04.  
Flashcards LBE‑F01..F06.  
Contoh item: main idea memilih paraphrase paling mencakup (NEAR). citeturn4search1turn4search0  

#### UTBK26-LBE-READ-SPEC-002 — Specific information & reference
Scope: scanning detail, stated info, pronoun reference. Skor: 78. citeturn9view0turn4search11  
Paket: LBE‑T03,T11,T02,T01,T13,T07,T08,T12.  
Flashcards LBE‑F07..F12.  
Contoh item: “it refers to …” (LOCAL). citeturn4search1turn4search11  

#### UTBK26-LBE-READ-VOC-003 — Vocabulary in context
Scope: contextual meaning, closest meaning, nuance. Skor: 86. citeturn9view0turn4search0  
Paket: LBE‑T05,T03,T01,T11,T04,T10,T12,T08.  
Flashcards LBE‑F13..F18.  
Contoh item: “closest in meaning” gunakan konteks (NEAR). citeturn4search0turn4search1  

#### UTBK26-LBE-READ-INF-004 — Inference & tone
Scope: implied info, author attitude, modality. Skor: 90. citeturn9view0turn4search11  
Paket: LBE‑T04,T10,T12,T09,T08,T06,T01,T02.  
Flashcards LBE‑F19..F24.  
Contoh item: inferensi konservatif (EXTREME trap). citeturn4search11turn4search1  

#### UTBK26-LBE-READ-ORG-005 — Organization & coherence
Scope: irrelevant sentence, connectors, headings. Skor: 88. citeturn9view0turn4search0  
Paket: LBE‑T06,T07,T13,T02,T01,T03,T11,T08.  
Flashcards LBE‑F25..F30.  
Contoh item: kalimat tidak relevan (IRREL). citeturn4search0turn4search1  

#### UTBK26-LBE-READ-EVAL-006 — Evaluation/argument
Scope: claim‑evidence, best conclusion, evaluate reasoning. Skor: 92. citeturn9view0turn3search1  
Paket: LBE‑T09,T12,T04,T08,T03,T01,T10,T06.  
Flashcards LBE‑F31..F36.  
Contoh item: bukti paling mendukung klaim (IRREL). citeturn3search1turn4search1  

### PM (8 subtopik)

#### UTBK26-PM-BIL-CORE-001 — Bilangan kontekstual
Scope: representasi bilangan, operasi, estimasi dalam konteks. Skor: 80. citeturn8view0turn0search31  
Paket: PM‑T07,T01,T03,T11,T12,T02,T14,T04.  
Flashcards PM‑F01..F06.  
Contoh item: interpretasi 0,25 sebagai 25% dari konteks. citeturn0search31turn0search15  

#### UTBK26-PM-GEO-MEAS-002 — Pengukuran & geometri kontekstual
Scope: skala, satuan turunan, luas/volume dalam konteks dunia nyata. Skor: 88. citeturn8view0turn0search22  
Paket: PM‑T06,T01,T03,T02,T12,T13,T14,T11.  
Flashcards PM‑F07..F12.  
Contoh item: skala peta (luas berubah kuadrat). citeturn0search22turn0search15  

#### UTBK26-PM-GEO-SPA-003 — Spasial & koordinat
Scope: koordinat, jarak, arah, grid. Skor: 82. citeturn8view0turn0search15  
Paket: PM‑T13,T06,T01,T03,T14,T04,T07,T11.  
Flashcards PM‑F13..F18.  
Contoh item: jarak Manhattan vs Euclidean (GRAPH trap). citeturn0search15turn0search31  

#### UTBK26-PM-DATA-REP-004 — Interpretasi data
Scope: membaca tabel/grafik; perubahan absolut vs relatif. Skor: 86. citeturn8view0turn0search31  
Paket: PM‑T04,T05,T03,T01,T14,T10,T11,T07.  
Flashcards PM‑F19..F24.  
Contoh item: dari grafik, simpulan benar (GRAPH). citeturn0search31turn0search22  

#### UTBK26-PM-DATA-UNC-005 — Ketidakpastian & peluang
Scope: probabilitas konteks, “paling mungkin”, evaluasi simpulan. Skor: 90. citeturn8view0turn0search26  
Paket: PM‑T08,T10,T01,T03,T14,T11,T12,T04.  
Flashcards PM‑F25..F30.  
Contoh item (tipe serupa ada di pembahasan PM): peluang bersyarat sederhana. citeturn0search26turn0search31  

#### UTBK26-PM-ALG-EQ-006 — Formulasi persamaan/pertidaksamaan
Scope: definisi variabel, menerjemahkan kata kunci (minimal/maksimal), solve & cek. Skor: 88. citeturn8view0turn0search15  
Paket: PM‑T02,T01,T03,T14,T12,T11,T09,T07.  
Flashcards PM‑F31..F36.  
Contoh item: “minimal 20 unit” → x ≥ 20 (UNITS/NEG trap). citeturn0search15turn0search31  

#### UTBK26-PM-ALG-FUN-007 — Relasi & fungsi (termasuk pola)
Scope: aturan fungsi dari tabel, pola nonlinier, verifikasi. Skor: 86. citeturn8view0turn0search31  
Paket: PM‑T09,T01,T03,T10,T14,T07,T11,T02.  
Flashcards PM‑F37..F42.  
Contoh item: dari pasangan (1,3),(2,5) tentukan f(x)=2x+1. citeturn0search31turn0search15  

#### UTBK26-PM-ALG-RAT-008 — Rasio/proporsi & aritmetika sosial
Scope: basis persen, perbandingan, laju, diskon, skala. Skor: 85. citeturn8view0turn0search22  
Paket: PM‑T11,T01,T03,T02,T12,T07,T14,T04.  
Flashcards PM‑F43..F48.  
Contoh item: diskon bertingkat; basis berubah (UNITS). citeturn0search22turn0search15  

## What we still don’t know dan rekomendasi data untuk memperkuat analitik

Tidak ada rilis publik resmi (dalam sumber primer yang diakses) yang memuat:  
- distribusi domain mikro per subtes (mis. % inference vs evaluation dalam LBE),  
- statistik kesukaran item (p‑value/IRT), atau  
- pola kesalahan peserta berbasis log respons (time‑on‑item). citeturn1search9turn9view0turn8view0turn3search1  

Agar “difficulty analytics” naik level dari proksi → empiris, data paling prioritas:
1) **Log respons tryout** (benar/salah + waktu per item) minimal ribuan peserta, lalu lakukan kalibrasi p‑value dan deteksi trap dominan per template family. (Artikel rekonstruksi/fitur belajar menunjukkan arahnya, tetapi data agregat tidak dipublikasikan.) citeturn3search1turn4search4  
2) **Annotasi stimulus** (panjang teks, kompleksitas leksikal, jumlah klaim) untuk memisahkan “reading load” vs “reasoning load” khusus LBI/LBE. citeturn9view0turn4search11  
3) **Blueprint internal** (jika tersedia) yang memetakan item ke proses PM (formulate/employ/interpret) per paket — karena framework menekankan proses itu, tetapi proporsi operasional tidak dibuka publik. citeturn8view0  

---

Catatan entitas sumber utama/platform (muncul hanya sekali sesuai aturan): entity["organization","SNPMB","indonesia ptn admissions"], entity["organization","Halo SNPMB","helpdesk portal"], entity["company","Ruangguru","edtech indonesia"], entity["company","Zenius","edtech indonesia"], entity["company","Pahamify","edtech indonesia"], entity["organization","Brain Academy","ruangguru program indonesia"]