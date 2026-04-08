# Panduan Troubleshooting Migrasi Data

**Tujuan**: Membantu mengatasi masalah umum yang mungkin terjadi selama proses migrasi dari localStorage ke PostgreSQL.

---

## Daftar Masalah

1. [Database Connection Issues](#database-connection-issues)
2. [Data Validation Issues](#data-validation-issues)
3. [Migration Script Issues](#migration-script-issues)
4. [Data Integrity Issues](#data-integrity-issues)
5. [Frontend Issues](#frontend-issues)
6. [Performance Issues](#performance-issues)

---

## Database Connection Issues

### Masalah: "DATABASE_URL not set"

**Gejala**:
```
Error: DATABASE_URL is not defined
```

**Penyebab**: Environment variable `DATABASE_URL` belum dikonfigurasi.

**Solusi**:

```bash
# 1. Cek apakah DATABASE_URL sudah diset
echo $DATABASE_URL

# 2. Jika kosong, set dengan format yang benar
export DATABASE_URL="postgresql://username:password@localhost:5432/finance_manager"

# 3. Verifikasi sudah diset
echo $DATABASE_URL

# 4. Jika menggunakan .env file, tambahkan:
# DATABASE_URL=postgresql://username:password@localhost:5432/finance_manager

# 5. Restart dev server
npm run dev
```

**Verifikasi**:
```bash
psql $DATABASE_URL -c "SELECT version();"
```

---

### Masalah: "Connection refused"

**Gejala**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Penyebab**: PostgreSQL server tidak berjalan atau tidak dapat diakses.

**Solusi**:

```bash
# 1. Cek status PostgreSQL
sudo systemctl status postgresql

# 2. Jika tidak berjalan, start PostgreSQL
sudo systemctl start postgresql

# 3. Verifikasi PostgreSQL sudah berjalan
sudo systemctl status postgresql

# 4. Cek apakah port 5432 sudah listening
netstat -an | grep 5432

# 5. Jika masih error, cek log PostgreSQL
sudo tail -f /var/log/postgresql/postgresql.log

# 6. Verifikasi koneksi dengan psql
psql -h localhost -U postgres -d postgres -c "SELECT 1;"
```

**Jika PostgreSQL belum terinstall**:
```bash
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql
```

---

### Masalah: "Authentication failed"

**Gejala**:
```
Error: password authentication failed for user "username"
```

**Penyebab**: Username atau password salah.

**Solusi**:

```bash
# 1. Verifikasi credentials di DATABASE_URL
# Format: postgresql://username:password@host:port/database

# 2. Cek apakah user ada di PostgreSQL
sudo -u postgres psql -c "\du"

# 3. Jika user tidak ada, buat user baru
sudo -u postgres psql -c "CREATE USER finance_user WITH PASSWORD 'password123';"

# 4. Berikan privileges ke user
sudo -u postgres psql -c "ALTER USER finance_user CREATEDB;"

# 5. Test koneksi dengan user baru
psql -h localhost -U finance_user -d postgres -c "SELECT 1;"

# 6. Update DATABASE_URL dengan credentials yang benar
export DATABASE_URL="postgresql://finance_user:password123@localhost:5432/finance_manager"
```

---

### Masalah: "Database does not exist"

**Gejala**:
```
Error: database "finance_manager" does not exist
```

**Penyebab**: Database belum dibuat.

**Solusi**:

```bash
# 1. Buat database
sudo -u postgres psql -c "CREATE DATABASE finance_manager;"

# 2. Verifikasi database sudah dibuat
sudo -u postgres psql -c "\l"

# 3. Jalankan migrations
pnpm db:push

# 4. Verifikasi tabel sudah dibuat
psql $DATABASE_URL -c "\dt"
```

---

## Data Validation Issues

### Masalah: "Invalid JSON in localStorage"

**Gejala**:
```
Error: Unexpected token in JSON at position X
```

**Penyebab**: Data di localStorage tidak valid JSON.

**Solusi**:

```bash
# 1. Buka browser console dan cek data
localStorage.getItem('finance-manager-transactions')

# 2. Validasi JSON format
# Pastikan format adalah array: [...]
# Bukan object: {...}

# 3. Jika ada error, export dengan cara lain
# Buka Developer Tools → Application → Local Storage
# Copy seluruh isi dan paste ke text editor
# Verifikasi format JSON valid

# 4. Gunakan JSON validator
# https://jsonlint.com/

# 5. Jika data rusak, gunakan backup lama
# Cari file backup di Downloads atau Documents
```

**Contoh format yang benar**:
```json
{
  "transactions": [
    {
      "id": "txn_1",
      "type": "income",
      "amount": 5000000,
      "category": "Gaji",
      "date": "2026-04-01"
    }
  ],
  "installments": [],
  "savings": [],
  "budgets": []
}
```

---

### Masalah: "Missing required fields"

**Gejala**:
```
Error: Field 'amount' is required but missing
```

**Penyebab**: Data di localStorage tidak lengkap.

**Solusi**:

```bash
# 1. Validasi data sebelum migrasi
# Buka browser console dan jalankan:

const transactions = JSON.parse(localStorage.getItem('finance-manager-transactions') || '[]');
const errors = [];

transactions.forEach((txn, idx) => {
  if (!txn.id) errors.push(`Transaction ${idx}: missing id`);
  if (!txn.type) errors.push(`Transaction ${idx}: missing type`);
  if (!txn.amount) errors.push(`Transaction ${idx}: missing amount`);
  if (!txn.date) errors.push(`Transaction ${idx}: missing date`);
});

console.log('Validation errors:', errors);

# 2. Jika ada error, perbaiki data secara manual
# Atau gunakan script untuk fill missing fields

# 3. Jalankan migrasi ulang setelah data diperbaiki
```

---

## Migration Script Issues

### Masalah: "Script not found"

**Gejala**:
```
Error: Cannot find module './migrate-data.mjs'
```

**Penyebab**: File script migrasi belum ada.

**Solusi**:

```bash
# 1. Verifikasi file sudah ada
ls -la server/migrate-data.mjs

# 2. Jika tidak ada, buat file dari dokumentasi
# Copy kode dari LOCALSTORAGE_TO_POSTGRESQL_MIGRATION.md
# Paste ke file server/migrate-data.mjs

# 3. Verifikasi syntax JavaScript
node -c server/migrate-data.mjs

# 4. Jalankan dengan node
node server/migrate-data.mjs backup.json 1
```

---

### Masalah: "Backup file not found"

**Gejala**:
```
Error: ENOENT: no such file or directory, open 'backup.json'
```

**Penyebab**: File backup tidak ada di direktori yang benar.

**Solusi**:

```bash
# 1. Verifikasi file backup ada
ls -la backup.json

# 2. Jika tidak ada, export dari localStorage
# Buka browser console dan jalankan:
const data = {
  transactions: JSON.parse(localStorage.getItem('finance-manager-transactions') || '[]'),
  installments: JSON.parse(localStorage.getItem('finance-manager-installments') || '[]'),
  savings: JSON.parse(localStorage.getItem('finance-manager-savings') || '[]'),
  budgets: JSON.parse(localStorage.getItem('finance-manager-budgets') || '[]'),
};
console.log(JSON.stringify(data, null, 2));

# 3. Copy output dan save ke file backup.json

# 4. Verifikasi file sudah ada
ls -la backup.json

# 5. Jalankan migrasi dengan path yang benar
node server/migrate-data.mjs ./backup.json 1
# atau
node server/migrate-data.mjs /home/ubuntu/finance-manager/backup.json 1
```

---

### Masalah: "Invalid user ID"

**Gejala**:
```
Error: User ID must be a positive integer
```

**Penyebab**: User ID tidak valid atau user tidak ada di database.

**Solusi**:

```bash
# 1. Cek user yang ada di database
psql $DATABASE_URL -c "SELECT id, name, email FROM users;"

# 2. Gunakan ID yang benar saat menjalankan migrasi
node server/migrate-data.mjs backup.json 1

# 3. Jika user belum ada, buat user baru
psql $DATABASE_URL -c "
  INSERT INTO users (openId, name, email, role)
  VALUES ('user_123', 'John Doe', 'john@example.com', 'user');
"

# 4. Cek ID user yang baru dibuat
psql $DATABASE_URL -c "SELECT id, name FROM users WHERE openId = 'user_123';"

# 5. Jalankan migrasi dengan ID yang benar
node server/migrate-data.mjs backup.json 2
```

---

## Data Integrity Issues

### Masalah: "Duplicate key error"

**Gejala**:
```
Error: Duplicate entry 'txn_1' for key 'PRIMARY'
```

**Penyebab**: Data dengan ID yang sama sudah ada di database.

**Solusi**:

```bash
# 1. Cek data yang sudah ada
psql $DATABASE_URL -c "SELECT id FROM transactions WHERE userId = 1 LIMIT 10;"

# 2. Hapus data lama sebelum migrasi ulang
psql $DATABASE_URL -c "
  DELETE FROM transactions WHERE userId = 1;
  DELETE FROM installments WHERE userId = 1;
  DELETE FROM installmentPayments WHERE installmentId IN (
    SELECT id FROM installments WHERE userId = 1
  );
  DELETE FROM savings WHERE userId = 1;
  DELETE FROM budgets WHERE userId = 1;
"

# 3. Jalankan migrasi ulang
node server/migrate-data.mjs backup.json 1

# 4. Verifikasi data sudah termigrasi
psql $DATABASE_URL -c "SELECT COUNT(*) FROM transactions WHERE userId = 1;"
```

---

### Masalah: "Amount data tidak akurat"

**Gejala**:
- Amount di database jauh lebih besar dari yang di localStorage
- Atau amount di database lebih kecil dari yang di localStorage

**Penyebab**: Konversi dari Rupiah ke cents tidak dilakukan dengan benar.

**Solusi**:

```bash
# 1. Cek format amount di database
psql $DATABASE_URL -c "SELECT id, amount FROM transactions WHERE userId = 1 LIMIT 5;"

# 2. Jika amount terlalu besar (100x lebih besar), sudah benar (dalam cents)
# Contoh: 5000000 Rupiah = 500000000 cents

# 3. Jika amount masih dalam Rupiah, kalikan dengan 100
psql $DATABASE_URL -c "
  UPDATE transactions SET amount = amount * 100 WHERE userId = 1 AND amount < 1000000;
  UPDATE installments SET totalAmount = totalAmount * 100 WHERE userId = 1 AND totalAmount < 1000000000;
  UPDATE installments SET monthlyAmount = monthlyAmount * 100 WHERE userId = 1 AND monthlyAmount < 1000000000;
  UPDATE savings SET targetAmount = targetAmount * 100 WHERE userId = 1 AND targetAmount < 1000000000;
  UPDATE savings SET currentAmount = currentAmount * 100 WHERE userId = 1 AND currentAmount < 1000000000;
  UPDATE budgets SET limit = limit * 100 WHERE userId = 1 AND limit < 1000000000;
"

# 4. Verifikasi ulang
psql $DATABASE_URL -c "SELECT id, amount FROM transactions WHERE userId = 1 LIMIT 5;"
```

---

### Masalah: "Date format tidak sesuai"

**Gejala**:
```
Error: invalid input syntax for type date
```

**Penyebab**: Format date tidak sesuai dengan yang diharapkan database.

**Solusi**:

```bash
# 1. Verifikasi format date di backup
# Format yang benar: YYYY-MM-DD (contoh: 2026-04-08)

# 2. Jika format berbeda, update script migrasi
# Ubah line di migrate-data.mjs:
date: txn.date,  // Jika sudah format YYYY-MM-DD

# 3. Jika date dalam format lain, konversi terlebih dahulu
date: new Date(txn.date).toISOString().split('T')[0],  // Konversi ke YYYY-MM-DD

# 4. Jalankan migrasi ulang
node server/migrate-data.mjs backup.json 1
```

---

## Frontend Issues

### Masalah: "Data tidak muncul di frontend"

**Gejala**:
- Frontend menampilkan halaman kosong
- Atau menampilkan data lama dari localStorage

**Penyebab**: Frontend masih membaca dari localStorage, bukan dari database.

**Solusi**:

```bash
# 1. Bersihkan browser cache
# Ctrl+Shift+Delete (Windows/Linux)
# Cmd+Shift+Delete (Mac)

# 2. Refresh halaman
# Ctrl+F5 (hard refresh)

# 3. Cek browser console untuk error
# F12 → Console → Cari error messages

# 4. Verifikasi tRPC query sudah dipanggil
# F12 → Network → Cari request ke /api/trpc

# 5. Jika masih tidak muncul, cek server logs
tail -f .manus-logs/devserver.log

# 6. Verifikasi data ada di database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM transactions WHERE userId = 1;"

# 7. Jika data ada di database tapi tidak muncul di frontend:
# - Logout dan login ulang
# - Atau restart dev server: npm run dev
```

---

### Masalah: "tRPC query error"

**Gejala**:
```
Error: trpc.transactions.list is not a function
```

**Penyebab**: tRPC router belum didefinisikan atau belum di-export.

**Solusi**:

```bash
# 1. Verifikasi router sudah ada di server/routers.ts
grep -n "transactions.list" server/routers.ts

# 2. Jika tidak ada, tambahkan ke server/routers.ts
# Lihat contoh di server/routers.ts

# 3. Verifikasi router sudah di-export
grep -n "export const appRouter" server/routers.ts

# 4. Restart dev server
npm run dev

# 5. Cek browser console untuk error
# F12 → Console
```

---

## Performance Issues

### Masalah: "Migration script berjalan lambat"

**Gejala**:
- Script migrasi memakan waktu lebih dari 5 menit
- Atau script hang/tidak responsif

**Penyebab**: Database connection lambat atau data terlalu banyak.

**Solusi**:

```bash
# 1. Cek kecepatan koneksi database
time psql $DATABASE_URL -c "SELECT COUNT(*) FROM transactions;"

# 2. Jika lambat, cek beban server
top
# Cek CPU dan memory usage

# 3. Jalankan migrasi dengan batch processing
# Modifikasi script untuk insert dalam batch (contoh: 100 records per batch)

# 4. Untuk data besar, gunakan COPY command (lebih cepat)
# Buat CSV file dari backup.json
# Gunakan COPY untuk bulk insert

# 5. Jika masih lambat, pertimbangkan:
# - Upgrade database server
# - Gunakan connection pooling
# - Jalankan migrasi pada waktu off-peak
```

---

### Masalah: "Frontend loading lambat setelah migrasi"

**Gejala**:
- Halaman loading lebih lama dari biasanya
- Atau timeout saat fetch data

**Penyebab**: Query database tidak optimal atau data terlalu banyak.

**Solusi**:

```bash
# 1. Cek query performance
psql $DATABASE_URL -c "
  EXPLAIN ANALYZE
  SELECT * FROM transactions WHERE userId = 1;
"

# 2. Jika query lambat, tambahkan index
psql $DATABASE_URL -c "
  CREATE INDEX idx_transactions_userId ON transactions(userId);
  CREATE INDEX idx_installments_userId ON installments(userId);
  CREATE INDEX idx_savings_userId ON savings(userId);
  CREATE INDEX idx_budgets_userId ON budgets(userId);
"

# 3. Implementasi pagination di frontend
# Jangan load semua data sekaligus
# Load 50 records per page

# 4. Gunakan caching di frontend
# Cache data di React Query dengan staleTime

# 5. Monitor performance
# F12 → Network → Cek response time
```

---

## Checklist Troubleshooting

Jika mengalami masalah, ikuti checklist ini:

- [ ] Verifikasi DATABASE_URL sudah diset dengan benar
- [ ] Verifikasi PostgreSQL server sudah berjalan
- [ ] Verifikasi database dan tabel sudah dibuat
- [ ] Verifikasi backup.json file ada dan valid
- [ ] Verifikasi user ID ada di database
- [ ] Jalankan migration script dengan verbose mode
- [ ] Cek database logs: `tail -f /var/log/postgresql/postgresql.log`
- [ ] Cek server logs: `tail -f .manus-logs/devserver.log`
- [ ] Verifikasi data di database dengan query
- [ ] Bersihkan browser cache dan refresh
- [ ] Restart dev server

---

## Mendapatkan Bantuan

Jika masalah masih belum teratasi:

1. **Kumpulkan informasi**:
   - Error message lengkap
   - Output dari command yang dijalankan
   - Database logs
   - Browser console logs

2. **Cek dokumentasi**:
   - `LOCALSTORAGE_TO_POSTGRESQL_MIGRATION.md`
   - `MIGRATION_QUICK_START.md`
   - PostgreSQL documentation
   - tRPC documentation

3. **Buat minimal reproduction**:
   - Buat backup file kecil untuk testing
   - Jalankan migrasi dengan data kecil
   - Identifikasi masalah spesifik

4. **Hubungi support** dengan informasi lengkap

---

**Catatan**: Dokumentasi ini akan terus diupdate seiring ditemukannya masalah baru. Jika menemukan masalah yang tidak tercakup, silakan laporkan untuk ditambahkan ke panduan ini.
