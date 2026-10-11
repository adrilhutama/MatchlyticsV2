```markdown

\# Product Requirements Document (PRD): Matchlytics V2



\*\*Document Version:\*\* 2.0.0  

\*\*Target Architecture:\*\* Static SPA + Serverless DB + Client-Side Deterministic Quant Engine  

\*\*Infrastructure Budget:\*\* \\$0.00 / Month (100% Free Tier Optimized)



\---



\## 1. Executive Summary \& Product Vision



\*\*Matchlytics V2\*\* adalah terminal analitik kuantitatif sepak bola (\*sports betting analytics terminal\*) berkecepatan tinggi yang dirancang dengan prinsip \*data density\*, modularitas domain yang ketat, dan nol komputasi server.



Rebuild V2 bertujuan menyelesaikan kelemahan struktural pada V1:

\- \*\*Mengeliminasi God Component:\*\* Memecah komponen monolitik menjadi modul berbasis fitur (\*feature-sliced\*).

\- \*\*Pemisahan Tegas Desktop \& Mobile:\*\* Meniadakan percabangan layout responsif campuran (`hidden md:flex`) demi menjaga kode tetap modular dan di bawah 150 baris per file.

\- \*\*Isolasi Mesin Kuantitatif:\*\* Menjamin seluruh kalkulasi matematika berjalan deterministik di sisi klien (\*client-side\*), sepenuhnya terpisah dari siklus hidup React UI.

\- \*\*Efisiensi Infrastruktur Gratis:\*\* Memaksimalkan batas gratisan GitHub Actions, Vercel, dan Supabase tanpa risiko pembekuan (\*pausing\*) atau pembengkakan kuota.



\---



\## 2. Tech Stack \& Environment Constraints



| Layer | Technology | Architecture Rationale |

|---|---|---|

| \*\*Frontend Framework\*\* | React 19 / 18 + Vite + TypeScript (Strict) | Bundling instan, performa rendering optimal, pengetikan ketat. |

| \*\*Styling \& UI Primitives\*\* | Tailwind CSS + shadcn/ui (Radix Primitives) + Lucide React | Komponen atomik disalin lokal tanpa dependensi runtime besar; gestur drawer mobile via `vaul`. |

| \*\*State Management\*\* | TanStack Query v5 + Zustand | TanStack Query mengisolasi server cache (Supabase); Zustand menangani UI state dan filter terminal. |

| \*\*Backend \& Storage\*\* | Supabase (PostgreSQL 15+, Auth, RLS) | Database relasional dengan Row Level Security ketat; penanganan auth bawaan. |

| \*\*Quantitative Core\*\* | Pure TypeScript (ES2022) | Fungsi matematika deterministik murni tanpa dependensi DOM/React. |

| \*\*Testing Suite\*\* | Vitest | Validasi akurasi numerik dan toleransi batas model matematika. |

| \*\*Deployment Target\*\* | Vercel (Static Web Hosting) | Static SPA deployment; beban serverless functions 0%. |



\---



\## 3. Data Pipeline \& API Quota Management



Pipeline data beroperasi secara otomatis via GitHub Actions Cron Job untuk mengisi Supabase tanpa melibatkan server backend aktif.





```



```

&#x20;                 ┌────────────────────────┐

&#x20;                 │ GitHub Actions Runners │

&#x20;                 └───────────┬────────────┘

&#x20;    ┌────────────────────────┼────────────────────────┐

&#x20;    ▼                        ▼                        ▼



```



\[The Odds API]         \[Football-Data.org]         \[TheSportsDB]

Odds 1X2, AH, Totals   Skor Akhir \& Match Stats    Logo Klub \& Liga

(500 req/bulan limit)  (10 req/menit gratis)       (Sync 1x di Awal)

│                        │                        │

└────────────────────────┼────────────────────────┘

▼

\[Supabase PostgreSQL]

│

▼

\[Client Browser: React Terminal]

(Client-side Quant Calculations)



```



\### 3.1. Kebijakan Konsumsi API

1\. \*\*The Odds API (Quota Limit: 500 Credits/Bulan):\*\*

&#x20;  - \*\*Target Pasar:\*\* `markets=h2h,spreads,totals`

&#x20;  - \*\*Target Region:\*\* `regions=eu` (mencakup Pinnacle sebagai acuan \*sharp market\*, Bet365, Unibet, 1xBet).

&#x20;  - \*\*Biaya Kuota:\*\* 3 kredit per liga per panggilan.

&#x20;  - \*\*Jadwal Tarikan:\*\* 2 kali per pekan per liga (H-1 sebelum \*matchday\* dan 3 jam sebelum \*kickoff\*).

&#x20;  - \*\*Estimasi Konsumsi:\*\* 4 liga $\\times$ 3 kredit $\\times$ 2 tarikan $\\times$ 4 pekan $\\approx$ \*\*96 kredit/bulan\*\* (Sisa kuota aman: $>400$ kredit).

2\. \*\*Football-Data.org (Quota Limit: 10 Request/Menit, Tanpa Batas Bulanan):\*\*

&#x20;  - Mengambil hasil pertandingan selesai, klasemen liga, dan statistik laga untuk menghitung parameter performa tim ($\\lambda$).

&#x20;  - Dijalankan 1 kali setiap tengah malam via GitHub Actions cron.

3\. \*\*TheSportsDB (Metadata \& Asset):\*\*

&#x20;  - Digunakan satu kali pada proses \*seeding\* untuk memetakan nama klub ke URL logo resmi, menghindari ketergantungan API eksternal saat runtime.

4\. \*\*Supabase Keep-Alive Guard:\*\*

&#x20;  - GitHub Action cron mingguan menjalankan query `SELECT 1` untuk mencegah pembekuan otomatis proyek Supabase akibat inaktivitas 7 hari.



\---



\## 4. Spesifikasi Mesin Kuantitatif (Quant Math Core)



Seluruh logika matematika ditempatkan di `src/core/math/` sebagai fungsi deterministik murni (\*zero side-effects\*).



\### 4.1. Estimasi Parameter $\\lambda$ (Expected Goals)

Parameter ekspektasi gol tim kandang ($\\lambda\_1$) dan tim tandang ($\\lambda\_2$) dihitung berdasarkan performa 10 laga terakhir terhadap rata-rata liga:



1\. \*\*Exponential Time-Decay (Dixon-Coles Weighting):\*\*

&#x20;  $$w\_k = e^{-\\xi \\cdot \\Delta t\_k}$$

&#x20;  - $\\Delta t\_k$: Selisih hari antara laga ke-$k$ dengan hari kalkulasi.

&#x20;  - $\\xi = 0.006$ per hari: Memberi bobot lebih tinggi pada laga terkini.

2\. \*\*Bayesian Shrinkage (Regresi ke Rata-Rata Liga):\*\*

&#x20;  $$\\lambda^\* = \\left(\\frac{n}{n + m}\\right)\\lambda\_{\\text{tim}} + \\left(\\frac{m}{n + m}\\right)\\mu\_{\\text{liga}}$$

&#x20;  - $n$: Jumlah laga yang telah dimainkan musim berjalan.

&#x20;  - $m = 8$: Konstanta kepercayaan sampel; menstabilkan data tim di awal musim.



\### 4.2. Dixon-Coles Bivariate Poisson Matrix ($8 \\times 8$)

Koreksi korelasi skor rendah ($\\rho = -0.08$) untuk mengatasi kelemahan Poisson standar pada skor 0-0, 1-0, 0-1, dan 1-1:



$$P(X=x, Y=y) = \\tau\_\\rho(x, y) \\cdot \\frac{\\lambda\_1^x e^{-\\lambda\_1}}{x!} \\cdot \\frac{\\lambda\_2^y e^{-\\lambda\_2}}{y!}$$



Faktor koreksi $\\tau\_\\rho(x, y)$:

$$\\tau\_\\rho(x, y) = \\begin{cases}  1 - \\lambda\_1 \\lambda\_2 \\rho \& \\text{untuk } x=0, y=0 \\\\ 1 + \\lambda\_2 \\rho \& \\text{untuk } x=1, y=0 \\\\ 1 + \\lambda\_1 \\rho \& \\text{untuk } x=0, y=1 \\\\ 1 - \\rho \& \\text{untuk } x=1, y=1 \\\\ 1.0 \& \\text{untuk skor lainnya} \\end{cases}$$



\*\*Derivasi Pasar dari Matriks:\*\*

\- \*\*1X2 (Match Odds):\*\*

&#x20; $$P(\\text{Home}) = \\sum\_{x > y} P(x, y), \\quad P(\\text{Draw}) = \\sum\_{x = y} P(x, y), \\quad P(\\text{Away}) = \\sum\_{x < y} P(x, y)$$

\- \*\*Totals (Over/Under):\*\*

&#x20; $$P(\\text{Over } K) = \\sum\_{x + y > K} P(x, y), \\quad P(\\text{Under } K) = \\sum\_{x + y < K} P(x, y)$$

\- \*\*Asian Handicap ($AH$):\*\*

&#x20; $$P(\\text{Home Cover}) = \\sum\_{x - y + AH > 0} P(x, y)$$

\- \*\*Both Teams to Score (BTTS):\*\*

&#x20; $$P(\\text{BTTS Yes}) = \\sum\_{x \\ge 1, y \\ge 1} P(x, y)$$



\### 4.3. De-vigging Engine (Margin Removal)

1\. \*\*Pasar 1X2 (3-Way): Shin's Method\*\*

&#x20;  Menghitung probabilitas wajar dengan mengoreksi faktor insider trading / \*favorite-longshot bias\*:

&#x20;  $$\\sum\_{i=1}^3 \\sqrt{z^2 + 4(1 - z)\\frac{\\pi\_i^2}{\\sum \\pi}} = 2 - z$$

2\. \*\*Pasar 2-Way (OU \& Asian Handicap): Power Method\*\*

&#x20;  $$P\_i = \\left(\\frac{1}{\\text{Odds}\_i}\\right)^k \\quad \\text{sehingga} \\quad \\sum\_{i=1}^2 P\_i = 1$$

&#x20;  Nilai $k$ dicari secara numerik menggunakan algoritma pencarian biner (\*binary search\* $\\le 10$ iterasi).



\### 4.4. Expected Value (+EV) \& Sizing

\- \*\*Expected Value:\*\*

&#x20; $$\\text{EV} = (P\_{\\text{true}} \\times \\text{Odds}\_{\\text{Soft}}) - 1$$

&#x20; Sinyal valid dipicu jika $\\text{EV} \\ge +0.025$ ($+2.5\\%$).

\- \*\*Fractional Kelly Criterion (Quarter Kelly):\*\*

&#x20; $$f^\* = \\frac{b \\cdot P\_{\\text{true}} - (1 - P\_{\\text{true}})}{b}, \\quad b = \\text{Odds} - 1$$

&#x20; $$\\text{Stake Rekomendasi} = 0.25 \\times \\max(0, f^\*) \\times \\text{Bankroll}$$



\### 4.5. Match Metrics (Non-Odds Projections)

\- \*\*HT/FT Matrix:\*\* Estimasi $\\lambda\_{\\text{HT}} = 0.43 \\times \\lambda\_{\\text{FT}}$ untuk memproyeksikan 9 skenario kombinasi babak pertama dan babak akhir.

\- \*\*xCorners \& xCards:\*\* Distribusi Poisson univariat untuk menghasilkan proyeksi total sudut dan indeks friksi pertandingan berbasis data historis.

\- \*\*Brier Score Calibration:\*\*

&#x20; $$\\text{BS} = \\frac{1}{N} \\sum\_{t=1}^N \\sum\_{j=1}^3 (f\_{tj} - o\_{tj})^2$$

&#x20; Digunakan sebagai indikator kalibrasi model (\*Health Score\*).



\---



\## 5. Skema Database Supabase \& Security (PostgreSQL)



```sql

\-- Enums

create type user\_tier as enum ('free', 'pro');

create type match\_status as enum ('scheduled', 'live', 'finished');



\-- 1. Profiles Table (Auth Linked)

create table public.profiles (

&#x20; id uuid references auth.users on delete cascade primary key,

&#x20; email text not null,

&#x20; tier user\_tier default 'free'::user\_tier not null,

&#x20; created\_at timestamptz default now() not null

);



alter table public.profiles enable row level security;

create policy "User can view own profile" on public.profiles for select using (auth.uid() = id);



\-- Trigger: Otomatis membuat profile saat sign up

create or replace function public.handle\_new\_user()

returns trigger as $$

begin

&#x20; insert into public.profiles (id, email, tier)

&#x20; values (new.id, new.email, 'free');

&#x20; return new;

end;

$$ language plpgsql security definer;



create trigger on\_auth\_user\_created

&#x20; after insert on auth.users

&#x20; for each row execute procedure public.handle\_new\_user();



\-- 2. Master Leagues

create table public.leagues (

&#x20; id text primary key,

&#x20; name text not null,

&#x20; country text not null,

&#x20; home\_advantage\_factor numeric default 1.25 not null,

&#x20; logo\_url text

);



alter table public.leagues enable row level security;

create policy "Public read access for leagues" on public.leagues for select using (true);



\-- 3. Matches \& Cached Odds

create table public.matches (

&#x20; id uuid default gen\_random\_uuid() primary key,

&#x20; league\_id text references public.leagues(id) on delete cascade not null,

&#x20; home\_team text not null,

&#x20; away\_team text not null,

&#x20; home\_logo\_url text,

&#x20; away\_logo\_url text,

&#x20; kickoff timestamptz not null,

&#x20; status match\_status default 'scheduled'::match\_status not null,

&#x20; 

&#x20; -- Precomputed Quant Parameters

&#x20; lambda\_home numeric not null default 1.35,

&#x20; lambda\_away numeric not null default 1.10,

&#x20; lambda\_cov numeric not null default 0.08,

&#x20; 

&#x20; -- Match Metrics

&#x20; expected\_corners numeric default 9.5,

&#x20; expected\_cards numeric default 4.2,

&#x20; 

&#x20; -- Bookmakers Odds Payload (Pinnacle, Bet365, etc.)

&#x20; odds\_data jsonb default '{}'::jsonb not null,

&#x20; 

&#x20; created\_at timestamptz default now() not null,

&#x20; updated\_at timestamptz default now() not null

);



create index idx\_matches\_kickoff on public.matches(kickoff);

create index idx\_matches\_league on public.matches(league\_id);



alter table public.matches enable row level security;

create policy "Public read access for matches" on public.matches for select using (true);



```



\---



\## 6. Frontend Architecture \& Modularitas UI



\### 6.1. Struktur Direktori



```text

src/

├── app/                           # Vite entry, router, TanStack Query provider

├── core/                          # Zero-UI / Pure Quant Core

│   ├── math/

│   │   ├── bivariate-poisson.ts   # Dixon-Coles 8x8 matrix \& probabilitas

│   │   ├── devig.ts               # Shin method \& Power method

│   │   ├── ev-engine.ts           # +EV \& Quarter Kelly calculation

│   │   ├── metrics.ts             # HT/FT scaling, xCorners, xCards, Brier Score

│   │   └── index.ts

│   ├── types/                     # Domain contracts (Match, Odds, QuantResult)

│   └── guards/                    # match-sanitizer.ts (Null-safety boundary)

├── features/

│   ├── terminal/                  # Fitur utama analitik

│   │   ├── components/

│   │   │   ├── desktop/           # DesktopTerminalView, MatrixHeatmap, OddsDenseGrid

│   │   │   ├── mobile/            # MobileTerminalView, MatchSheet, MobileCard

│   │   │   └── shared/            # QuantBadge, EVTag, OddsCell, StatBox

│   │   ├── hooks/                 # useTerminalData, useMatchQuant

│   │   ├── stores/                # useTerminalStore, useFilterStore (Zustand)

│   │   ├── TerminalContainer.tsx  # Adaptive View Switcher (Desktop vs Mobile)

│   │   └── index.ts

│   ├── auth/                      # Supabase Auth, useAuth hook, TierGate, DevModeSwitch

│   ├── matches/                   # League filter bar, match fixture lists

│   └── bankroll/                  # Staking calculator \& bankroll simulator

├── services/

│   └── supabase/                  # Supabase client \& typed database queries

└── shared/

&#x20;   ├── components/ui/             # shadcn components (Drawer, Tooltip, Dialog, Tabs)

&#x20;   └── hooks/                     # useMediaQuery



```



\### 6.2. Aturan Ketat Pemisahan Desktop dan Mobile



\* \*\*Nol Hybrid Bloat:\*\* Komponen tidak boleh mencampur breakpoint layout kompleks (`hidden lg:flex`).

\* \*\*Container Switcher:\*\* `TerminalContainer.tsx` membaca media query `(min-width: 1024px)`:

\* Layar $\\ge 1024\\text{px}$: Merender `DesktopTerminalView` (layout \*split-pane\*, densitas data tinggi, tabel odds dengan monospace, inspeksi visual matriks berdampingan).

\* Layar $< 1024\\text{px}$: Merender `MobileTerminalView` (kartu vertikal ringkas, gestur geser, inspeksi mendalam via \*bottom sheet drawer\*).





\* \*\*Limit File:\*\* Maksimal 150 baris kode per berkas komponen.



\### 6.3. Null-Safety Data Guard (`match-sanitizer.ts`)



Semua payload mentah dari Supabase wajib divalidasi sebelum menyentuh state UI:



\* Mengeliminasi odds $\\le 1.0$, `null`, atau format pasar yang tidak lengkap.

\* Mengembalikan objek `ValidatedMatch` yang terstandarisasi, mencegah \*runtime error\* (`cannot read properties of undefined`).



\---



\## 7. Model Akses \& Tier Gating (Free vs Pro)



| Kemampuan / Fitur | Free Tier | Pro / Quant Tier |

| --- | --- | --- |

| \*\*Daftar Laga \& Jadwal\*\* | Akses Penuh | Akses Penuh |

| \*\*Odds Pasar 1X2 Rata-Rata\*\* | Tersedia | Tersedia |

| \*\*Pinnacle Fair Odds Benchmark\*\* | Terkunci | Akses Penuh |

| \*\*Matriks Skor $8 \\times 8$ Dixon-Coles\*\* | Terkunci (\*Blurred\*) | Akses Penuh (Heat-map interaktif) |

| \*\*Sinyal +EV\*\* | Terbatas ($\\le +1.5\\%$) | Akses Penuh ($\\ge +2.5\\%$ Golden Edge) |

| \*\*Kalkulator Quarter Kelly\*\* | Dinonaktifkan | Akses Penuh |

| \*\*Proyeksi Asian Handicap \& Totals\*\* | Terkunci | Akses Penuh |

| \*\*Match Metrics (HT/FT, Corners, Cards)\*\* | Ringkasan Dasar | Matriks 9-Skenario \& Metrik Lengkap |



\* \*\*Komponen `<TierGate/>`:\*\* Membungkus elemen berbayar dengan CSS `filter blur-sm pointer-events-none select-none` disertai overlay penguncian dan ajakan upgrade.

\* \*\*Dev Mode Switcher:\*\* Floating badge di pojok kanan bawah khusus mode pengembangan (`import.meta.env.DEV`) untuk beralih instan antara mode `FREE` dan `PRO` guna mempermudah pengujian antarmuka.



\---



\## 8. Standar Pengujian \& Validasi Matematis (Vitest)



File pengujian `tests/quant.test.ts` wajib memverifikasi kondisi batas berikut:



1\. \*\*Normalisasi Probabilitas 1X2:\*\*



$$\\vert{}P(\\text{Home}) + P(\\text{Draw}) + P(\\text{Away}) - 1.0\\vert{} < 10^{-5}$$





2\. \*\*Koreksi Dixon-Coles:\*\* Probabilitas skor imbang pada matriks Dixon-Coles harus terbukti lebih tinggi dibanding Poisson independen untuk parameter skor rendah yang identik.

3\. \*\*De-vigging Accuracy:\*\* Jumlah probabilitas hasil de-vigging metode Shin dan Power Method harus tepat sama dengan $1.00000$.

4\. \*\*Resistensi Sizing Kelly:\*\* Fungsi Kelly Criterion wajib mengembalikan nilai `0` saat $\\text{EV} \\le 0$.

5\. \*\*Sanitizer Robustness:\*\* Input payload yang rusak (\*missing fields\*, \*null odds\*, \*malformed strings\*) harus ditolak secara aman tanpa memicu \*crash\*.



\---



\## 9. Rencana Eksekusi Bertahap (Phased Roadmap)



```text

┌────────────────────────────────────────────────────────┐

│ FASA 1: Database Migration \& Core Math Engine          │

│ • Skrip SQL Supabase (001\_init.sql)                    │

│ • pure functions di src/core/math/                     │

│ • Vitest unit test suite (tests/quant.test.ts)         │

└──────────────────────────┬─────────────────────────────┘

&#x20;                          │

┌──────────────────────────▼─────────────────────────────┐

│ FASA 2: Pipeline Guards, Services \& State Management   │

│ • Type contracts (src/core/types/)                     │

│ • match-sanitizer.ts                                   │

│ • Supabase Client \& TanStack Query v5 Hooks            │

│ • Zustand Filter Stores                                │

└──────────────────────────┬─────────────────────────────┘

&#x20;                          │

┌──────────────────────────▼─────────────────────────────┐

│ FASA 3: UI Scaffolding \& Auth Integration              │

│ • Setup shadcn/ui primitives (Drawer, Tooltip, Dialog) │

│ • Supabase Auth Provider \& useAuth hook                │

│ • Komponen <TierGate/> \& DevModeSwitch                 │

└──────────────────────────┬─────────────────────────────┘

&#x20;                          │

┌──────────────────────────▼─────────────────────────────┐

│ FASA 4: Terminal Views (Desktop vs Mobile Isolation)   │

│ • DesktopTerminalView.tsx (Data-dense grid \& heatmap)  │

│ • MobileTerminalView.tsx (Bottom drawer \& cards)       │

│ • TerminalContainer.tsx (Adaptive switcher)           │

└────────────────────────────────────────────────────────┘



