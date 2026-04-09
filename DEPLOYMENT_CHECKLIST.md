# ✅ Railway Deployment Checklist

## 📋 Pre-Deployment Checklist

### Code & Repository
- [ ] All changes committed to Git
- [ ] No uncommitted sensitive files (check `.gitignore`)
- [ ] GitHub repository accessible and connected to Railway
- [ ] `package.json` exists with correct scripts
- [ ] Build works locally: `npm run build`
- [ ] No TypeScript errors: `npx tsc --noEmit`

### Configuration Files
- [ ] `railway.json` exists dan properly configured
- [ ] `Procfile` exists dengan correct start command
- [ ] `vite.config.ts` configured untuk production build
- [ ] `tsconfig.json` valid dan no errors

### Dependencies
- [ ] All dependencies installed: `npm install`
- [ ] No peer dependency warnings
- [ ] Lock file committed: `pnpm-lock.yaml`
- [ ] No security vulnerabilities: `npm audit`

### Database
- [ ] Drizzle schema updated: `drizzle/schema.ts`
- [ ] All migrations exist in `drizzle/`
- [ ] Migration scripts valid SQL
- [ ] Database migration tested locally

### Environment Variables Prepared
- [ ] `DATABASE_URL` ready (Railway MySQL string)
- [ ] `OAUTH_GOOGLE_CLIENT_ID` dan `OAUTH_GOOGLE_CLIENT_SECRET` ready
- [ ] `OAUTH_REDIRECT_URI` updated dengan Railway domain
- [ ] `OWNER_OPEN_ID` set untuk admin account
- [ ] Optional: AWS S3 credentials (kalau using cloud backup)
- [ ] All `.example` files documented

---

## 🚀 Deployment Steps Checklist

### Step 1: Create Railway Project
- [ ] Login ke https://dashboard.railway.app
- [ ] Create new project
- [ ] Connect GitHub repository
- [ ] Select `finance-manager` repository
- [ ] Authorize Railway app on GitHub

### Step 2: Setup MySQL Service
- [ ] Click "Create" → "MySQL"
- [ ] Railway generates `DATABASE_URL` automatically
- [ ] Verify MySQL service created dan running

### Step 3: Configure Environment Variables
- [ ] Open Variables tab
- [ ] Add `NODE_ENV=production`
- [ ] Add `PORT=8080` (or custom port)
- [ ] Add `DATABASE_URL` (from MySQL service)
- [ ] Add OAuth credentials:
  - [ ] `OAUTH_GOOGLE_CLIENT_ID`
  - [ ] `OAUTH_GOOGLE_CLIENT_SECRET`
  - [ ] `OAUTH_REDIRECT_URI` with Railway domain
  - [ ] `OWNER_OPEN_ID`
- [ ] Add S3 credentials (optional):
  - [ ] `AWS_ACCESS_KEY_ID`
  - [ ] `AWS_SECRET_ACCESS_KEY`
  - [ ] `AWS_S3_BUCKET`
  - [ ] `AWS_S3_REGION`

### Step 4: Initial Deployment
- [ ] Push code to GitHub (atau Railway auto-triggers)
- [ ] Monitor Deployment logs
- [ ] Wait untuk build completion
- [ ] Check build succeeds (no errors)

### Step 5: Database Migration
- [ ] Via Railway CLI:
  ```bash
  railway login
  railway link
  railway run npm run db:push
  ```
  - [ ] Migration runs successfully
  - [ ] No SQL errors
  
- ATAU via Railway Dashboard:
  - [ ] Click Deployment → Recent → Logs
  - [ ] Verify migration command executed

### Step 6: Verify Deployment
- [ ] Access Railway URL (check dashboard)
- [ ] Homepage loads successfully
- [ ] Login page accessible
- [ ] OAuth redirect working
- [ ] Can login dengan Google account

---

## ✅ Post-Deployment Verification

### Application Health
- [ ] Application responsive (check response time)
- [ ] No `500` errors in deployment logs
- [ ] Database connection established
- [ ] All API routes accessible

### Feature Testing
- [ ] Login dengan OAuth works
- [ ] Can create new transaction
- [ ] Data saves to database
- [ ] Can view transaction list
- [ ] Pagination works
- [ ] Filtering/sorting works
- [ ] Can create installment
- [ ] Can create savings goal
- [ ] Can create budget

### Database & Data
- [ ] Tables created (via schema)
- [ ] Migration applied successfully
- [ ] Sample data (jika ada) loaded
- [ ] Foreign key constraints applied
- [ ] Indexes created

### Performance
- [ ] Page load time < 3s
- [ ] API response time < 500ms
- [ ] Database queries optimized
- [ ] No memory leaks (check Railway metrics)

### Security
- [ ] OAuth credentials working
- [ ] Only authorized users can access
- [ ] Sensitive data hashed (passwords)
- [ ] HTTPS/SSL working (Railway provides)
- [ ] CORS configured correctly

### Monitoring Setup
- [ ] Check Railway Dashboard regularly
- [ ] Monitor memory usage
- [ ] Monitor CPU usage
- [ ] Monitor network I/O
- [ ] Setup alerts (optional)

---

## 🔧 Troubleshooting Guide

### Build Failed
```bash
# Check build locally
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Verify all dependencies installed
npm install
```

**Railway Console Command**:
```bash
railway run npm run build
```

### Database Connection Error
```bash
# Verify DATABASE_URL format
# Should be: mysql://user:pass@host:port/database

# Test connection
railway run npm run check
```

**Check**: MySQL service running AND `DATABASE_URL` set correctly

### OAuth Not Working
1. Verify `OAUTH_REDIRECT_URI` matches exactly
2. Check Google OAuth app settings
3. Ensure `OAUTH_GOOGLE_CLIENT_ID` dan `SECRET` correct
4. Check error logs: `railway logs`

### Application Not Starting
```bash
# Check logs
railway logs -f

# Check environment variables set
railway variables

# Check port
lsof -i :8080
```

### Memory/Performance Issues
- Reduce `numReplicas` atau adjust resource limits
- Optimize database queries
- Enable caching
- Monitor: `railway metrics`

---

## 📊 Common Commands

### Monitoring
```bash
# View real-time logs
railway logs -f

# View past logs
railway logs --lines 100

# Check project status
railway status
```

### Database
```bash
# Run migration
railway run npm run db:push

# Go interactive shell
railway run mysql -u $MYSQL_USER -p$MYSQL_PASSWORD -h $MYSQL_HOST

# Backup database (manual)
railway run mysqldump -u $MYSQL_USER -p$MYSQL_PASSWORD -h $MYSQL_HOST > backup.sql
```

### Deployment
```bash
# Redeploy latest code
railway deploy

# View deployments
railway deployments

# Rollback to previous
railway rollback <deployment_id>
```

---

## 📱 First-Time User Testing Script

```bash
# 1. Login
curl -X POST https://<your-railway-url>/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass"}'

# 2. Create transaction
curl -X POST https://<your-railway-url>/api/transactions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"type":"EXPENSE","category":"FOOD","amount":50000,"description":"Lunch"}'

# 3. Get transactions
curl https://<your-railway-url>/api/transactions \
  -H "Authorization: Bearer <token>"

# 4. Check health
curl https://<your-railway-url>/health
```

---

## 🎯 Success Criteria

✅ **Deployment Successful When:**
1. Build succeeds tanpa errors
2. Database migration completed
3. Application starts dan responds
4. OAuth login works
5. Can create dan retrieve data
6. No errors dalam logs

✅ **Ready for Production When:**
1. All features tested
2. Performance acceptable
3. Security verified
4. Monitoring setup
5. Team trained on deployment

---

## 📞 Need Help?

- Railway Docs: https://docs.railway.app
- Check logs: `railway logs`
- GitHub Issues: Create issue di repository
- Railway Support: https://railway.app/support

---

**Last Updated**: April 9, 2026  
**Version**: 1.0.0  
**Status**: 🟢 Ready to Deploy
