# Data Migration Guide: localStorage to Database

Panduan lengkap untuk migrasi data dari localStorage ke database MySQL/TiDB.

## Overview

Aplikasi Finance Manager telah diupgrade untuk menggunakan database backend. Semua data yang sebelumnya disimpan di localStorage dapat dimigrasikan ke database untuk persistensi yang lebih baik dan akses multi-device.

## Fitur Migrasi

- ✅ Migrasi transactions (pemasukan/pengeluaran)
- ✅ Migrasi installments dengan payment schedule
- ✅ Migrasi savings goals
- ✅ Migrasi budgets
- ✅ Fallback otomatis ke localStorage jika database tidak tersedia
- ✅ Backward compatibility dengan data lama

## Tahap-Tahap Migrasi

### 1. Export Data dari localStorage

Sebelum melakukan migrasi, export data Anda dari localStorage:

```typescript
import { downloadLocalStorageData } from '@/utils/exportLocalStorage';

// Di browser console atau dalam aplikasi:
downloadLocalStorageData();
// File akan di-download dengan nama: finance-manager-backup-YYYY-MM-DD.json
```

Atau gunakan fitur export di halaman Settings → Data Management.

### 2. Persiapan Database

Pastikan database sudah ter-setup dengan schema yang benar:

```bash
# Di project root
pnpm db:push
```

### 3. Migrasi Data ke Database

Gunakan migration script untuk memindahkan data dari JSON file ke database:

```bash
# Syntax: node server/migrate-data.mjs <userId> <dataFile>
node server/migrate-data.mjs 1 finance-manager-backup-2026-04-07.json
```

**Parameter:**
- `userId`: ID user di database (biasanya 1 untuk user pertama)
- `dataFile`: Path ke JSON file yang di-export

**Output Contoh:**
```
Starting data migration...
Target userId: 1

Migrating 25 transactions...
  ✓ Transaction: 1712500000000-0.123
  ✓ Transaction: 1712500001000-0.456
  ...

Migrating 5 installments...
  ✓ Installment: 1712500000000-0.789
  ...

Migrating 3 savings...
  ✓ Saving: 1712500000000-0.321
  ...

Migrating 8 budgets...
  ✓ Budget: budget-1712500000000
  ...

✓ Data migration completed successfully!
```

### 4. Verifikasi Data

Setelah migrasi, verifikasi data di aplikasi:

1. Login ke aplikasi
2. Cek halaman Dashboard - data harus ditampilkan dari database
3. Cek halaman Transactions, Installments, Savings, Budget
4. Lakukan operasi CRUD (create, read, update, delete) untuk memastikan semuanya berfungsi

## Arsitektur Migrasi

### Frontend Hooks (Dual Mode)

Semua hooks frontend (`useTransactions`, `useInstallments`, `useSavings`, `useBudget`) sekarang mendukung dual mode:

1. **Database Mode** (Preferred)
   - Menggunakan tRPC queries untuk fetch data dari backend
   - Menyimpan data di database
   - Tersedia ketika user authenticated

2. **localStorage Mode** (Fallback)
   - Menggunakan localStorage sebagai fallback
   - Otomatis aktif jika database tidak tersedia
   - Memastikan aplikasi tetap berfungsi offline

```typescript
// Contoh dari useTransactions.ts
const { data: dbTransactions, isLoading: dbLoading } = trpc.transactions.list.useQuery(undefined, {
  enabled: useDatabase, // Hanya query jika useDatabase = true
});

// Fallback ke localStorage jika database tidak tersedia
if (useDatabase && dbTransactions) {
  setTransactions(dbTransactions);
} else {
  // Gunakan localStorage
}
```

### Backend tRPC Routers

Semua fitur finance memiliki tRPC routers yang protected:

```typescript
// server/routers.ts

transactions: router({
  list: protectedProcedure.query(async ({ ctx }) => {
    // Hanya user yang authenticated bisa akses
    return await db.getUserTransactions(ctx.user.id);
  }),
  create: protectedProcedure.input(...).mutation(...),
  update: protectedProcedure.input(...).mutation(...),
  delete: protectedProcedure.input(...).mutation(...),
}),

installments: router({ ... }),
savings: router({ ... }),
budgets: router({ ... }),
activityLogs: router({ ... }),
```

## Database Schema

### Transactions Table
```sql
- id (varchar, PK)
- userId (int, FK)
- type (enum: 'income', 'expense')
- amount (int, in cents)
- category (varchar)
- description (text)
- date (varchar, YYYY-MM-DD format)
- createdAt (timestamp)
- updatedAt (timestamp)
```

### Installments Table
```sql
- id (varchar, PK)
- userId (int, FK)
- name (varchar)
- totalAmount (int, in cents)
- monthlyAmount (int, in cents)
- startYear (int)
- startMonth (int)
- durationMonths (int)
- createdAt (timestamp)
- updatedAt (timestamp)
```

### InstallmentPayments Table
```sql
- id (varchar, PK)
- installmentId (varchar, FK)
- month (int)
- year (int)
- amount (int, in cents)
- isPaid (int, 0=false, 1=true)
- paidDate (timestamp, nullable)
```

### Savings Table
```sql
- id (varchar, PK)
- userId (int, FK)
- name (varchar)
- category (varchar)
- targetAmount (int, in cents)
- currentAmount (int, in cents)
- createdAt (timestamp)
- updatedAt (timestamp)
```

### Budgets Table
```sql
- id (varchar, PK)
- userId (int, FK)
- category (varchar)
- limit (int, in cents)
- month (int)
- year (int)
- createdAt (timestamp)
- updatedAt (timestamp)
```

### ActivityLogs Table
```sql
- id (varchar, PK)
- userId (int, FK)
- type (enum: 'transaction', 'installment', 'saving')
- action (enum: 'create', 'update', 'delete')
- description (text)
- createdAt (timestamp)
```

## Troubleshooting

### Database Connection Error
```
Error: Cannot connect to database
```
**Solusi:**
1. Pastikan `DATABASE_URL` environment variable sudah set
2. Pastikan database server sedang running
3. Cek koneksi database dengan `pnpm db:push`

### Migration Script Error
```
Error: File not found: finance-manager-backup-2026-04-07.json
```
**Solusi:**
1. Pastikan file JSON ada di path yang benar
2. Gunakan absolute path atau relative path dari project root
3. Pastikan file format valid JSON

### Data Tidak Muncul di UI
**Solusi:**
1. Cek browser console untuk error messages
2. Verifikasi user sudah login
3. Cek di database bahwa data sudah ter-insert dengan benar
4. Refresh halaman atau restart dev server

### Duplikasi Data
**Solusi:**
1. Migration script sudah memiliki check untuk duplikasi berdasarkan ID
2. Jika ada duplikasi, manual delete dari database atau re-run migration dengan file yang sudah di-filter

## Best Practices

1. **Backup Data Sebelum Migrasi**
   ```bash
   # Export data dari localStorage
   # Simpan file JSON di tempat yang aman
   ```

2. **Test di Development Terlebih Dahulu**
   ```bash
   # Test migration process di local environment
   node server/migrate-data.mjs 1 test-data.json
   ```

3. **Monitor Activity Logs**
   - Semua operasi CRUD dicatat di activity logs
   - Gunakan untuk audit trail dan troubleshooting

4. **Periodic Backups**
   - Lakukan backup data secara berkala
   - Export dari Settings → Data Management

## Rollback Plan

Jika ada masalah setelah migrasi:

1. **Kembali ke localStorage Mode**
   - Aplikasi otomatis fallback ke localStorage jika database error
   - Data di localStorage tetap tersimpan

2. **Manual Rollback**
   - Hapus data dari database
   - Gunakan exported JSON file untuk re-import

3. **Contact Support**
   - Jika ada data corruption atau loss
   - Siapkan exported JSON file untuk recovery

## Performance Considerations

- **Caching**: tRPC client otomatis cache data dengan React Query
- **Batch Operations**: Untuk operasi bulk, gunakan transaction jika memungkinkan
- **Pagination**: Untuk dataset besar, implementasi pagination di query
- **Indexes**: Database sudah memiliki index pada userId untuk query optimization

## Future Enhancements

- [ ] Real-time sync across devices
- [ ] Offline-first dengan service workers
- [ ] Data encryption at rest
- [ ] Advanced analytics queries
- [ ] Scheduled backups
- [ ] Data export to CSV/PDF

## Support

Untuk pertanyaan atau masalah, silakan:
1. Cek log di `.manus-logs/` directory
2. Baca error messages di browser console
3. Hubungi support dengan attached JSON file dan error logs
