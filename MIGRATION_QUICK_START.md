# Quick Start Guide: localStorage → PostgreSQL Migration

**Durasi**: ~15 menit  
**Tingkat Kesulitan**: Menengah  
**Prasyarat**: Node.js, PostgreSQL, akses ke aplikasi Finance Manager

---

## 📋 Pre-Migration Checklist

Sebelum memulai, pastikan semua item berikut sudah selesai:

- [ ] Backup data localStorage sudah dibuat
- [ ] Database PostgreSQL sudah berjalan
- [ ] Environment variable `DATABASE_URL` sudah dikonfigurasi
- [ ] Migrations database sudah dijalankan (`pnpm db:push`)
- [ ] User sudah dibuat di database (minimal 1 user)
- [ ] Dev server sudah berjalan (`npm run dev`)

---

## 🚀 Langkah-Langkah Migrasi (Quick Version)

### Step 1: Export Data dari localStorage (2 menit)

```bash
# Buka browser console (F12) dan jalankan:
localStorage.getItem('finance-manager-transactions')
localStorage.getItem('finance-manager-installments')
localStorage.getItem('finance-manager-savings')
localStorage.getItem('finance-manager-budgets')

# Copy semua output dan simpan ke file backup.json dengan format:
{
  "transactions": [...],
  "installments": [...],
  "savings": [...],
  "budgets": [...],
  "exportDate": "2026-04-08T12:00:00Z"
}
```

### Step 2: Verifikasi Database Connection (2 menit)

```bash
cd /home/ubuntu/finance-manager

# Cek DATABASE_URL
echo $DATABASE_URL

# Jika kosong, set dengan format:
# postgresql://username:password@localhost:5432/database_name

# Test koneksi
psql $DATABASE_URL -c "SELECT version();"
```

### Step 3: Jalankan Database Migrations (3 menit)

```bash
# Generate dan apply migrations
pnpm db:push

# Verifikasi tabel sudah dibuat
psql $DATABASE_URL -c "\dt"
```

### Step 4: Jalankan Migration Script (5 menit)

```bash
# Ganti USER_ID dengan ID user yang sesuai (default: 1)
node server/migrate-data.mjs backup.json 1

# Tunggu hingga selesai, output akan menunjukkan:
# ✓ Migrated X transactions
# ✓ Migrated X installments
# ✓ Migrated X savings
# ✓ Migrated X budgets
# ✓ Migration completed successfully!
```

### Step 5: Verifikasi Data di Database (2 menit)

```bash
# Cek jumlah data yang termigrasi
psql $DATABASE_URL -c "
  SELECT 
    'transactions' as table_name, COUNT(*) as count FROM transactions WHERE userId = 1
  UNION ALL
  SELECT 'installments', COUNT(*) FROM installments WHERE userId = 1
  UNION ALL
  SELECT 'savings', COUNT(*) FROM savings WHERE userId = 1
  UNION ALL
  SELECT 'budgets', COUNT(*) FROM budgets WHERE userId = 1;
"
```

### Step 6: Verifikasi di Frontend (1 menit)

1. Refresh aplikasi (Ctrl+F5)
2. Login dengan user yang sudah di-migrasi
3. Cek halaman **Transaksi** - data harus tampil dari database
4. Cek halaman **Cicilan**, **Tabungan**, **Budget** - semua data harus ada

---

## ⚠️ Troubleshooting Cepat

| Masalah | Solusi |
|---------|--------|
| `DATABASE_URL not found` | `export DATABASE_URL="postgresql://..."`  |
| `Connection refused` | Pastikan PostgreSQL sudah berjalan: `sudo systemctl start postgresql` |
| `Duplicate key error` | Bersihkan data lama: `DELETE FROM transactions WHERE userId = 1;` |
| `Data tidak muncul di frontend` | Bersihkan cache browser: `Ctrl+Shift+Delete` |
| `Amount tidak akurat` | Verifikasi konversi ke cents: `SELECT amount FROM transactions LIMIT 1;` |

---

## 📊 Verification Commands

Gunakan command berikut untuk verifikasi setiap tahap:

```bash
# 1. Cek koneksi database
psql $DATABASE_URL -c "SELECT 1;"

# 2. Cek struktur tabel
psql $DATABASE_URL -c "\d transactions"

# 3. Cek jumlah data per tabel
psql $DATABASE_URL -c "SELECT COUNT(*) FROM transactions WHERE userId = 1;"

# 4. Cek sample data
psql $DATABASE_URL -c "SELECT id, type, amount, date FROM transactions WHERE userId = 1 LIMIT 5;"

# 5. Cek data integrity
psql $DATABASE_URL -c "
  SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT userId) as unique_users,
    MIN(createdAt) as oldest_record,
    MAX(createdAt) as newest_record
  FROM transactions;
"
```

---

## 🔄 Rollback (Jika Diperlukan)

Jika migrasi gagal atau data tidak sesuai, gunakan backup untuk rollback:

```bash
# 1. Hapus data yang sudah termigrasi
psql $DATABASE_URL -c "
  DELETE FROM transactions WHERE userId = 1;
  DELETE FROM installments WHERE userId = 1;
  DELETE FROM savings WHERE userId = 1;
  DELETE FROM budgets WHERE userId = 1;
"

# 2. Jalankan migrasi ulang
node server/migrate-data.mjs backup.json 1

# 3. Atau restore dari backup database
psql $DATABASE_URL < backup_database.sql
```

---

## 📝 Command Reference

**Setup & Preparation**:
```bash
pnpm install                    # Install dependencies
pnpm db:push                    # Run database migrations
npm run dev                     # Start dev server
```

**Migration**:
```bash
node server/migrate-data.mjs backup.json 1    # Run migration
```

**Verification**:
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM transactions WHERE userId = 1;"
pnpm test -- transactions.test.ts             # Run tests
```

**Backup & Restore**:
```bash
pg_dump $DATABASE_URL > backup.sql            # Backup database
psql $DATABASE_URL < backup.sql               # Restore database
```

---

## ✅ Post-Migration Checklist

Setelah migrasi selesai, verifikasi:

- [ ] Semua data sudah ada di database
- [ ] Frontend menampilkan data dengan benar
- [ ] Jumlah record sesuai dengan localStorage
- [ ] Amount data sudah dalam format cents
- [ ] User dapat membuat data baru (transaksi, cicilan, dll)
- [ ] User dapat edit dan delete data
- [ ] Tidak ada error di browser console
- [ ] Tidak ada error di server logs

---

## 🎯 Next Steps

Setelah migrasi berhasil:

1. **Hapus localStorage** (opsional): `localStorage.clear()`
2. **Monitor aplikasi**: Pastikan tidak ada error selama 24 jam pertama
3. **Backup database**: `pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql`
4. **Dokumentasikan**: Catat waktu migrasi dan jumlah data yang termigrasi
5. **Notifikasi user**: Informasikan bahwa data sudah termigrasi ke database

---

## 📞 Support

Jika mengalami masalah:

1. Cek logs: `tail -f .manus-logs/devserver.log`
2. Baca troubleshooting di `LOCALSTORAGE_TO_POSTGRESQL_MIGRATION.md`
3. Verifikasi database connection: `psql $DATABASE_URL -c "SELECT 1;"`
4. Jalankan tests: `pnpm test`

**Estimasi waktu total**: 15-20 menit untuk migrasi lengkap dengan verifikasi.
