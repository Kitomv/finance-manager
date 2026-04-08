# Panduan Migrasi Data dari localStorage ke Database PostgreSQL

**Penulis**: Manus AI  
**Tanggal**: April 2026  
**Versi**: 1.0

---

## Daftar Isi

1. [Pengenalan](#pengenalan)
2. [Persiapan Awal](#persiapan-awal)
3. [Langkah-Langkah Migrasi](#langkah-langkah-migrasi)
4. [Verifikasi Data](#verifikasi-data)
5. [Troubleshooting](#troubleshooting)
6. [Best Practices](#best-practices)
7. [Referensi](#referensi)

---

## Pengenalan

Aplikasi Personal Finance Manager awalnya menyimpan semua data transaksi, cicilan, tabungan, dan budget di **localStorage** browser. Seiring pertumbuhan aplikasi, migrasi ke database **PostgreSQL** menjadi keharusan untuk:

- **Persistensi data jangka panjang**: Data tidak hilang saat cache browser dibersihkan
- **Skalabilitas multi-user**: Setiap user memiliki data terpisah di database terpusat
- **Keamanan**: Data sensitif tidak tersimpan di browser client
- **Performa**: Query database lebih efisien untuk dataset besar
- **Backup dan recovery**: Sistem backup terpusat untuk disaster recovery

Panduan ini menjelaskan proses migrasi secara detail, dari persiapan hingga verifikasi, dengan contoh kode yang dapat langsung digunakan.

---

## Persiapan Awal

### 1. Backup Data localStorage

Sebelum memulai migrasi, **selalu backup data localStorage** untuk mencegah kehilangan data.

**Langkah-langkah**:

1. Buka aplikasi Finance Manager di browser
2. Buka Developer Tools (F12 atau Ctrl+Shift+I)
3. Navigasi ke tab **Application** → **Local Storage**
4. Pilih domain aplikasi Anda
5. Cari keys berikut:
   - `finance-manager-transactions`
   - `finance-manager-installments`
   - `finance-manager-savings`
   - `finance-manager-budgets`

6. Copy seluruh isi dan simpan ke file JSON lokal

**Contoh struktur data localStorage**:

```json
{
  "finance-manager-transactions": [
    {
      "id": "txn_1",
      "type": "income",
      "amount": 5000000,
      "category": "Gaji",
      "description": "Gaji bulanan",
      "date": "2026-04-01"
    }
  ],
  "finance-manager-installments": [
    {
      "id": "inst_1",
      "name": "Kredit Motor",
      "totalAmount": 50000000,
      "monthlyAmount": 2500000,
      "startYear": 2026,
      "startMonth": 1,
      "durationMonths": 24
    }
  ]
}
```

### 2. Verifikasi Database Connection

Pastikan aplikasi sudah terhubung ke database PostgreSQL dengan benar:

```bash
# Cek environment variable DATABASE_URL
echo $DATABASE_URL

# Output yang diharapkan:
# postgresql://user:password@localhost:5432/finance_manager
```

### 3. Jalankan Database Migrations

Pastikan semua tabel database sudah dibuat dengan schema terbaru:

```bash
cd /home/ubuntu/finance-manager

# Generate migration files
pnpm db:push

# Output yang diharapkan:
# ✓ Migrations generated
# ✓ Database synchronized
```

---

## Langkah-Langkah Migrasi

### Fase 1: Export Data dari localStorage

**Tujuan**: Mengekspor semua data dari localStorage ke file JSON untuk diproses.

**Implementasi**:

```typescript
// client/src/utils/exportLocalStorage.ts
export function exportLocalStorageData() {
  const data = {
    transactions: JSON.parse(
      localStorage.getItem('finance-manager-transactions') || '[]'
    ),
    installments: JSON.parse(
      localStorage.getItem('finance-manager-installments') || '[]'
    ),
    savings: JSON.parse(
      localStorage.getItem('finance-manager-savings') || '[]'
    ),
    budgets: JSON.parse(
      localStorage.getItem('finance-manager-budgets') || '[]'
    ),
    exportDate: new Date().toISOString(),
  };

  return data;
}

// Download sebagai file JSON
export function downloadLocalStorageBackup() {
  const data = exportLocalStorageData();
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `finance-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
```

**Cara menggunakan**:

1. Buka browser console (F12)
2. Jalankan:
   ```javascript
   import { downloadLocalStorageBackup } from '@/utils/exportLocalStorage';
   downloadLocalStorageBackup();
   ```
3. File JSON akan otomatis diunduh

### Fase 2: Transform Data ke Format Database

**Tujuan**: Mengkonversi format localStorage ke format yang sesuai dengan schema database.

**Perbedaan format**:

| Aspek | localStorage | Database |
|-------|--------------|----------|
| **Tipe data** | String (JSON) | Native types (int, varchar, timestamp) |
| **User ID** | Tidak ada (single user) | `userId` (integer) |
| **Amount** | Rupiah (contoh: 5000000) | Cents (50000000) |
| **Date** | String "YYYY-MM-DD" | VARCHAR atau DATE |
| **Timestamps** | Tidak ada | `createdAt`, `updatedAt` |

**Script transformasi**:

```typescript
// server/migrate-data.mjs
import { readFileSync } from 'fs';
import { getDb } from './db.ts';

interface LocalStorageTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
}

interface LocalStorageInstallment {
  id: string;
  name: string;
  totalAmount: number;
  monthlyAmount: number;
  startYear: number;
  startMonth: number;
  durationMonths: number;
}

async function transformAndMigrateData(
  backupFilePath: string,
  userId: number
) {
  try {
    // 1. Baca file backup
    const backupContent = readFileSync(backupFilePath, 'utf-8');
    const backupData = JSON.parse(backupContent);

    const db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

    // 2. Migrate transactions
    console.log('Migrating transactions...');
    for (const txn of backupData.transactions) {
      await db.insert(transactions).values({
        id: txn.id,
        userId: userId,
        type: txn.type,
        amount: txn.amount * 100, // Convert to cents
        category: txn.category,
        description: txn.description || null,
        date: txn.date,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    console.log(`✓ Migrated ${backupData.transactions.length} transactions`);

    // 3. Migrate installments
    console.log('Migrating installments...');
    for (const inst of backupData.installments) {
      await db.insert(installments).values({
        id: inst.id,
        userId: userId,
        name: inst.name,
        totalAmount: inst.totalAmount * 100, // Convert to cents
        monthlyAmount: inst.monthlyAmount * 100,
        startYear: inst.startYear,
        startMonth: inst.startMonth,
        durationMonths: inst.durationMonths,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    console.log(`✓ Migrated ${backupData.installments.length} installments`);

    // 4. Migrate savings
    console.log('Migrating savings...');
    for (const sav of backupData.savings) {
      await db.insert(savings).values({
        id: sav.id,
        userId: userId,
        name: sav.name,
        category: sav.category,
        targetAmount: sav.targetAmount * 100, // Convert to cents
        currentAmount: sav.currentAmount * 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    console.log(`✓ Migrated ${backupData.savings.length} savings`);

    // 5. Migrate budgets
    console.log('Migrating budgets...');
    for (const budget of backupData.budgets) {
      await db.insert(budgets).values({
        id: budget.id,
        userId: userId,
        category: budget.category,
        limit: budget.limit * 100, // Convert to cents
        month: budget.month,
        year: budget.year,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    console.log(`✓ Migrated ${backupData.budgets.length} budgets`);

    console.log('✓ Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Usage
const backupFile = process.argv[2] || './backup.json';
const userId = parseInt(process.argv[3] || '1', 10);
transformAndMigrateData(backupFile, userId);
```

### Fase 3: Jalankan Script Migrasi

**Langkah-langkah**:

```bash
cd /home/ubuntu/finance-manager

# 1. Pastikan file backup sudah ada
ls -la backup.json

# 2. Jalankan script migrasi (ganti userId dengan ID user yang sesuai)
node server/migrate-data.mjs backup.json 1

# Output yang diharapkan:
# Migrating transactions...
# ✓ Migrated 15 transactions
# Migrating installments...
# ✓ Migrated 3 installments
# Migrating savings...
# ✓ Migrated 5 savings
# Migrating budgets...
# ✓ Migrated 12 budgets
# ✓ Migration completed successfully!
```

### Fase 4: Update Frontend untuk Menggunakan Database

**Tujuan**: Mengubah frontend hooks untuk mengambil data dari database melalui tRPC API.

**Sebelum** (menggunakan localStorage):

```typescript
// client/src/hooks/useTransactions.ts (OLD)
export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('finance-manager-transactions');
    setTransactions(stored ? JSON.parse(stored) : []);
  }, []);

  return { transactions };
}
```

**Sesudah** (menggunakan tRPC):

```typescript
// client/src/hooks/useTransactions.ts (NEW)
import { trpc } from '@/lib/trpc';

export function useTransactions() {
  // Query dari database melalui tRPC
  const { data: transactions = [], isLoading } = trpc.transactions.list.useQuery();

  // Fallback ke localStorage jika database tidak tersedia
  const [fallbackTransactions, setFallbackTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!transactions.length && !isLoading) {
      const stored = localStorage.getItem('finance-manager-transactions');
      setFallbackTransactions(stored ? JSON.parse(stored) : []);
    }
  }, [transactions, isLoading]);

  const displayTransactions = transactions.length > 0 ? transactions : fallbackTransactions;

  return { 
    transactions: displayTransactions,
    isLoading,
  };
}
```

---

## Verifikasi Data

### 1. Verifikasi Jumlah Record

Pastikan jumlah data di database sesuai dengan data di localStorage:

```sql
-- Jalankan query berikut di database management tool

SELECT 
  (SELECT COUNT(*) FROM transactions WHERE userId = 1) as transaction_count,
  (SELECT COUNT(*) FROM installments WHERE userId = 1) as installment_count,
  (SELECT COUNT(*) FROM savings WHERE userId = 1) as saving_count,
  (SELECT COUNT(*) FROM budgets WHERE userId = 1) as budget_count;
```

**Output yang diharapkan**:

```
transaction_count | installment_count | saving_count | budget_count
------------------+-------------------+--------------+--------------
               15 |                 3 |            5 |           12
```

### 2. Verifikasi Integritas Data

Periksa beberapa sample record untuk memastikan data termigrasi dengan benar:

```sql
-- Cek transaction terakhir
SELECT id, userId, type, amount, category, date 
FROM transactions 
WHERE userId = 1 
ORDER BY createdAt DESC 
LIMIT 5;

-- Cek installment dengan pembayaran
SELECT i.id, i.name, i.monthlyAmount, COUNT(p.id) as payment_count
FROM installments i
LEFT JOIN installmentPayments p ON i.id = p.installmentId
WHERE i.userId = 1
GROUP BY i.id;
```

### 3. Verifikasi di Frontend

1. Login ke aplikasi dengan user yang sudah di-migrasi
2. Navigasi ke halaman **Transaksi** - pastikan semua transaksi tampil
3. Navigasi ke halaman **Cicilan** - pastikan semua cicilan tampil dengan pembayaran
4. Navigasi ke halaman **Tabungan** - pastikan semua target tabungan tampil
5. Navigasi ke halaman **Budget** - pastikan semua budget tampil
6. Navigasi ke halaman **Analitik** - pastikan grafik dan statistik akurat

---

## Troubleshooting

### Masalah 1: "Database not available" Error

**Penyebab**: Database connection string tidak dikonfigurasi atau database server tidak berjalan.

**Solusi**:

```bash
# 1. Cek environment variable
echo $DATABASE_URL

# 2. Jika kosong, set DATABASE_URL
export DATABASE_URL="postgresql://user:password@localhost:5432/finance_manager"

# 3. Test koneksi
psql $DATABASE_URL -c "SELECT 1;"

# 4. Restart dev server
npm run dev
```

### Masalah 2: "Duplicate Key" Error

**Penyebab**: Data dengan ID yang sama sudah ada di database.

**Solusi**:

```bash
# 1. Bersihkan data lama (HATI-HATI!)
DELETE FROM transactions WHERE userId = 1;
DELETE FROM installments WHERE userId = 1;
DELETE FROM savings WHERE userId = 1;
DELETE FROM budgets WHERE userId = 1;

# 2. Jalankan migrasi ulang
node server/migrate-data.mjs backup.json 1
```

### Masalah 3: Amount Data Tidak Akurat

**Penyebab**: Konversi dari Rupiah ke cents tidak dilakukan dengan benar.

**Verifikasi**:

```sql
-- Cek apakah amount sudah dalam cents (100x lebih besar)
SELECT id, amount FROM transactions WHERE userId = 1 LIMIT 5;

-- Jika masih dalam Rupiah (contoh: 5000000), kalikan dengan 100
UPDATE transactions SET amount = amount * 100 WHERE userId = 1 AND amount < 1000000;
```

### Masalah 4: Data Tidak Muncul di Frontend

**Penyebab**: Frontend masih membaca dari localStorage, bukan dari database.

**Solusi**:

1. Bersihkan browser cache (Ctrl+Shift+Delete)
2. Refresh halaman (Ctrl+F5)
3. Cek browser console untuk error messages
4. Pastikan tRPC query sudah dipanggil dengan benar

---

## Best Practices

### 1. Backup Reguler

Lakukan backup database secara berkala untuk disaster recovery:

```bash
# Backup database ke file SQL
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore dari backup
psql $DATABASE_URL < backup_20260408_120000.sql
```

### 2. Validasi Data Sebelum Migrasi

Selalu validasi data di localStorage sebelum migrasi:

```typescript
function validateLocalStorageData() {
  const transactions = JSON.parse(
    localStorage.getItem('finance-manager-transactions') || '[]'
  );

  const errors: string[] = [];

  transactions.forEach((txn, index) => {
    if (!txn.id) errors.push(`Transaction ${index}: missing id`);
    if (!txn.type) errors.push(`Transaction ${index}: missing type`);
    if (!txn.amount || txn.amount <= 0) errors.push(`Transaction ${index}: invalid amount`);
    if (!txn.date) errors.push(`Transaction ${index}: missing date`);
  });

  if (errors.length > 0) {
    console.error('Validation errors:', errors);
    return false;
  }

  console.log('✓ Data validation passed');
  return true;
}
```

### 3. Dual-Mode Operation

Implementasikan fallback ke localStorage jika database tidak tersedia:

```typescript
export function useTransactions() {
  const { data: dbTransactions, isLoading } = trpc.transactions.list.useQuery();
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Jika database tidak tersedia, gunakan localStorage
    if (!dbTransactions && !isLoading) {
      const stored = localStorage.getItem('finance-manager-transactions');
      setLocalTransactions(stored ? JSON.parse(stored) : []);
    }
  }, [dbTransactions, isLoading]);

  const transactions = dbTransactions || localTransactions;
  const isUsingDatabase = !!dbTransactions;

  return { transactions, isUsingDatabase, isLoading };
}
```

### 4. Monitoring dan Logging

Catat semua aktivitas migrasi untuk audit trail:

```typescript
// server/db.ts
export async function logMigration(
  userId: number,
  dataType: string,
  recordCount: number,
  status: 'success' | 'failed'
) {
  const timestamp = new Date().toISOString();
  console.log(
    `[${timestamp}] Migration: user=${userId}, type=${dataType}, count=${recordCount}, status=${status}`
  );

  // Simpan ke database atau file log
  await createActivityLog({
    userId,
    type: 'migration',
    action: status === 'success' ? 'create' : 'failed',
    description: `Migrated ${recordCount} ${dataType} records`,
  });
}
```

### 5. Incremental Migration

Untuk aplikasi dengan banyak user, lakukan migrasi secara bertahap:

```bash
# Migrasi user 1
node server/migrate-data.mjs backup_user1.json 1

# Migrasi user 2
node server/migrate-data.mjs backup_user2.json 2

# Migrasi user 3
node server/migrate-data.mjs backup_user3.json 3
```

---

## Referensi

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
- [localStorage MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [tRPC Documentation](https://trpc.io/)
- [Data Migration Best Practices](https://en.wikipedia.org/wiki/Data_migration)

---

**Catatan Akhir**: Panduan ini mencakup migrasi dari localStorage ke PostgreSQL. Untuk database lain (MySQL, SQLite), prinsip yang sama berlaku dengan penyesuaian syntax SQL yang sesuai. Jika mengalami masalah, periksa logs aplikasi dan database untuk informasi error yang lebih detail.
