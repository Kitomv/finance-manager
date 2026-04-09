# 🚀 Railway Deployment Guide - Finance Manager

Panduan lengkap untuk men-deploy Finance Manager ke Railway.

---

## 📋 Prerequisites

- ✅ Railway account (https://railway.app)
- ✅ Git repository terkoneksi (GitHub)
- ✅ Railway CLI installed (optional): `npm install -g @railway/cli`

---

## 🚀 Deployment Steps

### **Step 1: Siapkan Railway Project**

1. Login ke [Railway Dashboard](https://dashboard.railway.app)
2. Klik **"New Project"** → **"Deploy from GitHub"**
3. Selective repositories → Pilih `finance-manager`
4. Authorize Railway

### **Step 2: Setup Database**

Railway sudah menyediakan MySQL managed service. Untuk setup:

1. Di Railway Dashboard, klik **"+ Create"**
2. Pilih **MySQL**
3. Railway secara otomatis akan generate `DATABASE_URL` environment variable

### **Step 3: Setup Environment Variables**

Railway akan secara otomatis mendeteksi environment variables dari GitHub. Untuk melengkapi:

1. Di Railway project, klik **"Variables"** tab
2. Tambahkan environment variables berikut:

```env
NODE_ENV=production
PORT=8080

# Database (auto-generated oleh Railway MySQL)
DATABASE_URL=mysql://user:password@host:port/database

# OAuth Configuration
OAUTH_GOOGLE_CLIENT_ID=your_client_id
OAUTH_GOOGLE_CLIENT_SECRET=your_client_secret
OAUTH_REDIRECT_URI=https://your-railway-url.up.railway.app/auth/callback

# AWS S3 (untuk cloud backup)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name
AWS_S3_REGION=us-east-1

# Owner OpenId (untuk setup admin)
OWNER_OPEN_ID=your_manus_oauth_id
```

⚠️ **Important**: Ganti values dengan credentials yang sebenarnya.

### **Step 4: Auto-Deploy Configuration**

Railway sudah setup otomatis untuk:
- ✅ Build dengan `npm run build`
- ✅ Start dengan `node dist/index.js` (dari Procfile)
- ✅ Detect Node.js dari package.json

### **Step 5: Run Database Migration**

Setelah deployment pertama:

1. Di Railway Dashboard, klik **"Deployments"**
2. Klik deployment terbaru → **"Execute Recipe"** atau buka **Railway CLI**
3. Run migration:
   ```bash
   railway run npm run db:push
   ```

Atau manual via CLI:
```bash
railway login
railway link
railway run npm run db:push
```

---

## 🔧 Environment Configuration Details

### Database Setup

Railway MySQL akan automatically generate:

```env
DATABASE_URL=mysql://username:password@host.railways.internal:3306/railway
```

Untuk local testing, Override di `.env.local`:

```env
DATABASE_URL=mysql://user:password@localhost:3306/finance_manager
```

### OAuth Setup

Setup OAuth di aplikasi yang Anda gunakan (Google, GitHub, etc):

1. Set redirect URI ke: `https://<your-railway-domain>/auth/callback`
2. Copy Client ID dan Secret ke Railway Variables
3. Set `OWNER_OPEN_ID` untuk account yang menjadi admin

### S3 (Optional untuk Cloud Backup)

Jika ingin enable cloud backup:

1. Setup AWS S3 bucket
2. Create IAM user dengan S3 permissions
3. Set credentials:
   ```env
   AWS_ACCESS_KEY_ID=<your_key>
   AWS_SECRET_ACCESS_KEY=<your_secret>
   AWS_S3_BUCKET=<bucket_name>
   AWS_S3_REGION=us-east-1
   ```

---

## ✅ Verification Checklist

Setelah deployment:

- [ ] Build berhasil (check Deployment logs)
- [ ] Database migration completed
- [ ] `/health` atau homepage accessible via Railway URL
- [ ] Login flow bekerja dengan OAuth
- [ ] Dapat create transaction
- [ ] Database data tersimpan

Untuk check logs:

```bash
railway logs
```

---

## 🐛 Troubleshooting

### **Build Fails**

1. Check deployment logs di Railway Dashboard
2. Verify Node.js version compatibility (v18+ recommended)
3. Ensure all dependencies installed: `pnpm install` locally

```bash
# Fix: Rebuild locally first
npm run build
```

**Error**: `Cannot find module '@shared/validators'`
- Pastikan path alias di `tsconfig.json` benar
- Solution: `npm run build` should resolve aliases via Vite

### **Database Connection Error**

```
Error: connect ECONNREFUSED
```

**Solution**:
1. Verify `DATABASE_URL` di Railway Variables
2. Ensure MySQL service running
3. Check network connectivity: Railway → MySQL internal connection

```bash
# Test connection
railway run npm run check
```

### **Port Issues**

Railway assigns random port via `PORT` env variable. Ensure server listens to it:

```typescript
// ✅ Correct: Use PORT from env
const port = process.env.PORT || 3000;
server.listen(port);
```

### **OAuth Redirect URI Mismatch**

```
Error: Invalid redirect_uri
```

**Solution**: Update OAuth provider with correct Railway URL:

```
https://your-project.up.railway.app/auth/callback
```

Railway URL format: `https://<project>-<env>.up.railway.app` atau custom domain

---

## 📊 Monitoring & Logs

### View Real-time Logs

```bash
# Via Railway CLI
railway logs -f

# Via Dashboard
Railway Dashboard → Project → Deployment → Logs tab
```

### Check Database Status

```bash
railway run mysql -u $MYSQL_USER -p$MYSQL_PASSWORD -h $MYSQL_HOST
```

### Performance Monitoring

Railway menyediakan:
- Memory usage
- CPU usage
- Network I/O
- Deployment history

---

## 🔒 Security Best Practices

1. **Never commit secrets** ke git - use Railway Variables
2. **Use HTTPS** - Railway auto-provides SSL
3. **Enable read replicas** untuk production (Optional)
4. **Setup environment-specific configs**:
   - Production: Railway
   - Staging: Railway (separate project)
   - Development: Local

5. **Backup strategy**:
   ```bash
   # Enable automated backups di Railway MySQL settings
   ```

6. **Rate limiting**: Configure di-implement kalau diperlukan

---

## 📈 Scaling & Performance

### For Higher Traffic

1. **Enable multiple replicas**:
   - Railway Dashboard → Scale tab
   - Set numReplicas > 1

2. **Database optimization**:
   - Index critical columns (done by migration)
   - Monitor slow queries

3. **Memory optimization**:
   - Current: 512MB (default)
   - Upgrade jika OOM errors

### Recommended Config untuk Production

```json
{
  "numReplicas": 2,
  "memoryLimit": "1024",
  "cpuLimit": "500m"
}
```

---

## 🔄 Deployment Workflow

### First Deployment

```bash
# 1. Push ke GitHub
git push origin main

# 2. Railway auto-deploys (check Dashboard)

# 3. Run migrations
railway login
railway link
railway run npm run db:push

# 4. Verify application
curl https://<your-url>/auth/me
```

### Subsequent Deployments

```bash
# Just push to GitHub - Railway auto-redeploys
git push origin main
```

### Rollback

```bash
# Via Railway CLI
railway rollback <deployment_id>

# Or via Dashboard → Deployments tab
```

---

## 📞 Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Project Repository**: GitHub - finance-manager
- **Issues**: Create GitHub issue atau check Railway support

---

## 🎯 Next Steps

1. ✅ Setup Railway project
2. ✅ Configure environment variables
3. ✅ Deploy application
4. ✅ Run database migration
5. ✅ Test all features
6. ✅ Monitor logs & performance
7. ✅ Setup domain (optional)

---

**Last Updated**: April 9, 2026
**Version**: 1.0.0
**Status**: 🟢 Production Ready
