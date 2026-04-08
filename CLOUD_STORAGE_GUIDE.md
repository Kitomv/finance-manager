# Cloud Storage Migration Guide

## Overview

Finance Manager sekarang mendukung **Cloud Backup** untuk menyimpan data keuangan Anda dengan aman di cloud storage (AWS S3). Fitur ini memberikan:

- **Automatic Backups**: Backup otomatis dari semua data keuangan
- **Compression**: Data dikompresi untuk menghemat ruang penyimpanan
- **Versioning**: Kelola multiple backup versions
- **Restore Capability**: Restore data kapan saja dari backup
- **Security**: Data dienkripsi saat transit dan at rest

---

## Architecture

```
┌─────────────────┐
│  Frontend (UI)  │
│  CloudBackup    │
│  Manager        │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  tRPC API Endpoints         │
│  - backup.create()          │
│  - backup.restore()         │
│  - backup.list()            │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Backend Services           │
│  - cloudBackup.ts           │
│  - Compression (gzip)       │
│  - Metadata Management      │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  AWS S3 Cloud Storage       │
│  - Encrypted Storage        │
│  - Versioning Support       │
│  - Automatic Retention      │
└─────────────────────────────┘
```

---

## Features

### 1. Create Backup

**Endpoint**: `POST /api/trpc/backup.create`

**What it does**:
- Fetches all user data (transactions, installments, savings, budgets)
- Compresses data using gzip
- Uploads to S3 with timestamp-based key
- Logs backup activity

**Example Response**:
```json
{
  "key": "backups/user-1/backup-2026-04-08T09-30-00-000Z.json.gz",
  "url": "https://s3.amazonaws.com/...",
  "metadata": {
    "userId": 1,
    "timestamp": "2026-04-08T09:30:00.000Z",
    "version": "1.0",
    "dataSize": 1024,
    "recordCounts": {
      "transactions": 20,
      "installments": 3,
      "savings": 5,
      "budgets": 2
    },
    "compressed": true,
    "encrypted": false
  }
}
```

### 2. Restore Backup

**Endpoint**: `POST /api/trpc/backup.restore`

**Input**:
```json
{
  "backupKey": "backups/user-1/backup-2026-04-08T09-30-00-000Z.json.gz"
}
```

**What it does**:
- Downloads backup from S3
- Decompresses data
- Verifies backup belongs to current user
- Returns backup data (doesn't auto-import to database)
- Logs restore activity

**Important**: Restore operation returns data but doesn't automatically import to database. You need to implement import logic separately.

### 3. List Backups

**Endpoint**: `GET /api/trpc/backup.list`

**Response**: Array of backup keys available for user

---

## Usage Guide

### From Frontend

#### Create Backup
```typescript
import { useCloudBackup } from '@/hooks/useCloudBackup';

function MyComponent() {
  const { createBackup, isCreating } = useCloudBackup();

  const handleBackup = async () => {
    const result = await createBackup();
    if (result) {
      console.log('Backup created:', result.metadata);
    }
  };

  return (
    <button onClick={handleBackup} disabled={isCreating}>
      {isCreating ? 'Creating backup...' : 'Create Backup'}
    </button>
  );
}
```

#### Restore Backup
```typescript
const { restoreBackup, isRestoring } = useCloudBackup();

const handleRestore = async (backupKey: string) => {
  const success = await restoreBackup(backupKey);
  if (success) {
    // Page will reload automatically
  }
};
```

### From Backend

#### Create Backup Programmatically
```typescript
import { createCloudBackup } from './cloudBackup';

const result = await createCloudBackup(userId);
console.log(`Backup created: ${result.key}`);
```

#### Restore Backup Programmatically
```typescript
import { restoreCloudBackup } from './cloudBackup';

const backupData = await restoreCloudBackup(userId, backupKey);
console.log(`Restored ${backupData.data.transactions.length} transactions`);
```

---

## Data Migration Strategy

### Phase 1: Prepare
1. Ensure all current data is in database (not just localStorage)
2. Run `pnpm db:push` to sync schema
3. Test backup creation manually

### Phase 2: First Backup
1. Login to application
2. Go to Settings → Cloud Backup
3. Click "Buat Backup Sekarang"
4. Wait for backup to complete (shows success message)

### Phase 3: Verify
1. Check backup appears in "Riwayat Backup" list
2. Verify metadata shows correct record counts
3. Test restore on non-critical data first

### Phase 4: Automate
1. Setup cron job to create daily backups (optional)
2. Implement automatic backup on data changes (optional)
3. Setup retention policy to clean old backups

---

## Backup File Structure

Each backup is stored as a compressed JSON file:

```
backups/
├── user-1/
│   ├── backup-2026-04-08T09-30-00-000Z.json.gz
│   ├── backup-2026-04-07T09-30-00-000Z.json.gz
│   └── backup-2026-04-06T09-30-00-000Z.json.gz
├── user-2/
│   └── backup-2026-04-08T10-15-00-000Z.json.gz
```

### Backup JSON Schema
```json
{
  "metadata": {
    "userId": 1,
    "timestamp": "2026-04-08T09:30:00.000Z",
    "version": "1.0",
    "dataSize": 1024,
    "recordCounts": {
      "transactions": 20,
      "installments": 3,
      "savings": 5,
      "budgets": 2
    },
    "compressed": true,
    "encrypted": false
  },
  "data": {
    "transactions": [...],
    "installments": [...],
    "savings": [...],
    "budgets": [...]
  }
}
```

---

## Security Considerations

### Data Encryption
- **In Transit**: HTTPS/TLS encryption
- **At Rest**: S3 server-side encryption (SSE-S3)
- **Application Level**: Backup data is not encrypted by application (handled by S3)

### Access Control
- Backups are stored with user-specific paths
- Only authenticated users can create/restore their own backups
- Backend verifies `userId` before restore

### Retention Policy
- Backups older than 30 days are automatically deleted
- Manual deletion is not currently supported (use S3 console if needed)

---

## Troubleshooting

### Backup Creation Fails
**Symptoms**: "Gagal membuat backup" error

**Solutions**:
1. Check internet connection
2. Verify database has data
3. Check S3 storage quota
4. Review server logs for details

### Restore Fails
**Symptoms**: "Gagal me-restore backup" error

**Solutions**:
1. Verify backup key is correct
2. Ensure backup file exists in S3
3. Check user ID matches
4. Verify database write permissions

### Backup File Too Large
**Symptoms**: Upload timeout or storage quota exceeded

**Solutions**:
1. Delete old backups manually via S3 console
2. Reduce data by archiving old transactions
3. Increase S3 storage quota

---

## Best Practices

1. **Regular Backups**: Create backups at least weekly
2. **Test Restore**: Periodically test restore functionality
3. **Monitor Storage**: Keep track of backup storage usage
4. **Document Changes**: Note major data changes in activity logs
5. **Automate**: Setup daily automatic backups for production
6. **Verify Data**: After restore, verify data integrity

---

## Advanced Configuration

### Automatic Daily Backups

Add to your scheduler (cron job or task queue):

```typescript
// server/jobs/dailyBackup.ts
import { getAllUsers } from './db';
import { createCloudBackup } from './cloudBackup';

export async function runDailyBackup() {
  const users = await getAllUsers();
  
  for (const user of users) {
    try {
      await createCloudBackup(user.id);
      console.log(`Daily backup created for user ${user.id}`);
    } catch (error) {
      console.error(`Failed to backup user ${user.id}:`, error);
    }
  }
}
```

### Custom Retention Policy

```typescript
import { cleanupOldBackups } from './cloudBackup';

// Keep backups for 60 days instead of 30
await cleanupOldBackups(userId, 60);
```

---

## API Reference

### `createCloudBackup(userId: number)`
Creates a new backup of user's data

**Returns**: `{ key, url, metadata }`

### `restoreCloudBackup(userId: number, backupKey: string)`
Restores data from a backup

**Returns**: `BackupData` object with metadata and data

### `listUserBackups(userId: number)`
Lists all available backups for a user

**Returns**: Array of backup keys

### `cleanupOldBackups(userId: number, retentionDays?: number)`
Deletes backups older than retention period

**Returns**: Number of deleted backups

---

## FAQ

**Q: Can I restore to a different user account?**
A: No, backups are user-specific and cannot be transferred between accounts.

**Q: How long does backup take?**
A: Typically 5-30 seconds depending on data size and network speed.

**Q: Can I download backup files manually?**
A: Yes, backup files are stored in S3 and can be accessed via S3 console or API.

**Q: What happens if backup fails?**
A: Failure is logged in activity logs. No partial data is saved. You can retry.

**Q: Is there a limit to backup size?**
A: S3 has a 5GB file size limit per object, but compressed backups should be well under this.

---

## Support

For issues or questions:
1. Check activity logs for error details
2. Review server logs in `.manus-logs/devserver.log`
3. Verify S3 credentials in environment variables
4. Test S3 connectivity manually

