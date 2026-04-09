# 🔧 Railway Troubleshooting Guide

Panduan lengkap untuk mengatasi masalah deployment di Railway.

---

## 🚨 Common Issues & Solutions

### **Issue 1: Build Fails - "Cannot find module"**

**Error Message:**
```
Error: Cannot find module '@shared/validators'
Error: Cannot find module 'shared/types'
```

**Causes:**
- Path alias tidak di-resolve dengan benar
- TypeScript mapping tidak match dengan runtime
- Esbuild tidak membundle dependencies correctly

**Solutions:**

1. **Check `tsconfig.json` paths:**
   ```json
   {
     "compilerOptions": {
       "baseUrl": ".",
       "paths": {
         "@shared/*": ["shared/*"],
         "@server/*": ["server/*"],
         "@client/*": ["client/src/*"]
       }
    }
   }
   ```

2. **Verify import statements:**
   ```typescript
   // ✅ Correct
   import { transactionCreateSchema } from '@shared/validators';
   import { env } from '@server/_core/env';
   
   // ❌ Wrong (relative paths)
   import { transactionCreateSchema } from '../../../shared/validators';
   ```

3. **Rebuild locally first:**
   ```bash
   npm run build
   npm run check
   ```

4. **If still fails, reset Railway build cache:**
   - Railway Dashboard → Deployment → Redeploy

**Prevention:**
- Always run `npm run build` locally before pushing
- Use `npm run check` untuk verify TypeScript

---

### **Issue 2: Database Connection Error**

**Error Message:**
```
Error: connect ECONNREFUSED at 127.0.0.1:3306
Error: getaddrinfo ENOTFOUND mysql-host
Error: Access denied for user 'user'@'host': using password: YES
```

**Causes:**
- `DATABASE_URL` not set atau format salah
- MySQL service not running
- Credentials incorrect
- Network connectivity issue

**Solutions:**

1. **Verify DATABASE_URL format:**
   ```env
   # Correct format
   DATABASE_URL=mysql://user:password@host.railways.internal:3306/database
   
   # NOT localhost (Railway internal network)
   ❌ DATABASE_URL=mysql://user:pass@localhost:3306/db
   ```

2. **Check Railway Variables:**
   ```bash
   railway variables
   ```
   Should show:
   ```
   DATABASE_URL=mysql://...
   MYSQL_USER=postgres
   MYSQL_PASSWORD=...
   MYSQL_HOST=...
   ```

3. **Test connection:**
   ```bash
   railway run node -e "require('mysql2/promise').createConnection(process.env.DATABASE_URL)"
   ```

4. **Verify MySQL service:**
   - Railway Dashboard → Project
   - Check MySQL service status (should be "Running")
   - If "Crashed", click to view logs

5. **If MySQL service crashed:**
   - Click Service → "Redeploy"
   - Wait untuk restart

**Advanced Debugging:**
```bash
# Check if can reach database
railway run ping $MYSQL_HOST

# Check port
railway run nc -zv $MYSQL_HOST 3306

# Direct MySQL test
railway run mysql -u $MYSQL_USER -p$MYSQL_PASSWORD -h $MYSQL_HOST -e "SELECT 1"
```

---

### **Issue 3: Build Timeout (> 15min)**

**Error Message:**
```
Build failed: timeout
Deployment cancelled: build took too long
```

**Causes:**
- Large dependencies installing
- Network slow
- No cache reuse
- Unnecessary files bundled

**Solutions:**

1. **Optimize `node_modules`:**
   ```bash
   npm ci --only=production
   ```

2. **Create `.railwayignore`:**
   ```
   .git
   .gitignore
   node_modules
   .next
   .nuxt
   .cache
   dist
   build
   .env*
   *.log
   ```

3. **Split large dependencies:**
   - If app size > 100MB, consider splitting client/server

4. **Enable Railway build cache:**
   - railway.json → `build.cacheKey` setting

5. **Use pnpm instead of npm:**
   - package.json sudah using pnpm
   - Lebih fast dan efficient

---

### **Issue 4: Application Crashes After Deployment**

**Error Message:**
```
Application exited unexpectedly
Container exited with code 1
```

**Causes:**
- Environment variables missing
- Port conflict
- Memory limit exceeded
- Unhandled exception

**Solutions:**

1. **Check deployment logs:**
   ```bash
   railway logs -f
   ```

2. **Verify all required env vars set:**
   ```bash
   railway run env | grep -E "NODE_ENV|DATABASE_URL|OAUTH"
   ```

3. **Check memory usage:**
   - Railway Dashboard → Deployment → Metrics
   - If near limit, increase via `railway.json`:
     ```json
     {
       "deploy": {
         "memoryLimit": "1024"  // 1GB
       }
     }
     ```

4. **Test locally first:**
   ```bash
   NODE_ENV=production npm run build
   NODE_ENV=production node dist/index.js
   ```

5. **Check server startup code:**
   ```typescript
   // ✅ Correct: Handle port from env
   const port = process.env.PORT || 3000;
   app.listen(port, () => {
     console.log(`Server running on port ${port}`);
   });
   ```

---

### **Issue 5: Database Migration Fails**

**Error Message:**
```
Error: Query failed: Access denied
Error: ALTER TABLE syntax error
Error: Foreign key constraint failed
```

**Causes:**
- Migration already ran (idempotent issue)
- SQL syntax error
- Permission issues
- Foreign key conflict

**Solutions:**

1. **Check migration status:**
   ```bash
   railway run npx drizzle-kit check
   ```

2. **View migration history:**
   ```bash
   railway run mysql -u $MYSQL_USER -p$MYSQL_PASSWORD -h $MYSQL_HOST -e \
     "SELECT * FROM __drizzle_migrations__"
   ```

3. **Manually run migration:**
   ```bash
   railway run npm run db:push
   ```

4. **If migration stuck:**
   ```bash
   # Reset migrations (CAUTION - loses data!)
   railway run mysql -u $MYSQL_USER -p$MYSQL_PASSWORD -h $MYSQL_HOST -e \
     "DELETE FROM __drizzle_migrations__"
   
   # Rerun
   railway run npm run db:push
   ```

5. **Check drizzle schema:**
   - Verify `drizzle/schema.ts` syntax
   - Verify `drizzle/*.sql` migration files

---

### **Issue 6: OAuth Not Working**

**Error Message:**
```
Error: Redirect URI mismatch
Error: invalid_grant
Error: CORS error
```

**Causes:**
- OAuth app configured dengan wrong redirect URI
- `OAUTH_REDIRECT_URI` env var mismatch
- CORS headers missing
- Session cookie not set

**Solutions:**

1. **Get correct Railway URL:**
   ```bash
   railway status
   ```
   Look untuk: `Service URL: https://...up.railway.app`

2. **Update OAuth app redirect URI:**
   - Google OAuth Console → Settings
   - Add: `https://your-railway-url/auth/callback`
   - Update `OAUTH_REDIRECT_URI` env var

3. **Verify OAuth credentials:**
   ```bash
   railway variables | grep OAUTH
   ```
   Should show:
   ```
   OAUTH_GOOGLE_CLIENT_ID=...
   OAUTH_GOOGLE_CLIENT_SECRET=...
   ```

4. **Check CORS configuration:**
   ```typescript
   // Verify in server/_core/index.ts
   app.use(cors({
     origin: process.env.FRONTEND_URL || '*',
     credentials: true
   }));
   ```

5. **Test OAuth flow:**
   ```bash
   # 1. Visit login page
   https://your-railway-url/login
   
   # 2. Click "Login dengan Google"
   # Callback should redirect to https://your-railway-url/auth/callback?code=...
   ```

---

### **Issue 7: Performance Slow / High Latency**

**Symptoms:**
- Page load time > 3s
- API response slow
- Database queries hanging

**Solutions:**

1. **Check current resource usage:**
   ```bash
   railway metrics
   ```

2. **Enable query logging:**
   ```bash
   railway run NODE_DEBUG=database npm run start
   ```

3. **Optimize database:**
   - Add indexes (already done by migration)
   - Verify indices created:
     ```bash
     railway run mysql -u $MYSQL_USER -p$MYSQL_PASSWORD -h $MYSQL_HOST -e \
       "SHOW INDEX FROM transactions"
     ```

4. **Scale up resources:**
   - `railway.json`:
     ```json
     {
       "deploy": {
         "numReplicas": 2,
         "memoryLimit": "1024"
       }
     }
     ```

5. **Check slow queries:**
   ```bash
   railway run mysql -u $MYSQL_USER -p$MYSQL_PASSWORD -h $MYSQL_HOST -e \
     "SELECT * FROM INFORMATION_SCHEMA.PROCESSLIST WHERE TIME > 10"
   ```

6. **Enable caching:**
   - React Query `staleTime` configuration
   - Redis (optional for Railway)

---

### **Issue 8: Disk Space Issues**

**Error Message:**
```
Error: No space left on device
ENOSPC: no space left on device
```

**Causes:**
- Large database
- Logs accumulating
- Cache not cleared

**Solutions:**

1. **Check disk usage:**
   ```bash
   railway run df -h
   ```

2. **Clean up old deployments:**
   - Railway Dashboard → Deployment tab
   - Delete old deployments (keep last 5)

3. **View Railway environment:**
   - Standard Railway disk: 10GB
   - Upgrade untuk larger apps

4. **Check application logs:**
   ```bash
   # Don't log too much data
   railway logs | wc -l  # Count logs
   ```

---

### **Issue 9: Environment Variable Not Updating**

**Error Message:**
- Application still using old config
- Feature flags not working
- Database string outdated

**Solutions:**

1. **Verify variables set:**
   ```bash
   railway variables
   ```

2. **Re-read in application:**
   ```typescript
   // Application must restart to read new env vars
   // Add to startup:
   console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 20) + '...');
   ```

3. **Force redeploy:**
   ```bash
   railway deploy --force
   ```

4. **Check variable precedence:**
   - Railway Variables > GitHub Secrets > .env file
   - Remove conflicting `.env` from repository

---

### **Issue 10: `Procfile` Not Being Used**

**Error Message:**
- Application not running migration before start
- Wrong process running

**Solutions:**

1. **Verify Procfile exists:**
   ```bash
   ls -la Procfile
   ```
   Should show:
   ```
   -rw-r--r-- 1 Procfile (82 bytes)
   ```

2. **Verify Procfile format:**
   ```
   web: NODE_ENV=production node dist/index.js
   migration: NODE_ENV=production npm run db:push
   ```
   - No trailing spaces
   - Correct process names
   - Correct commands

3. **Check Railway logs:**
   - Should show: "Executing release command: npm run db:push"
   - Followed by: "Executing start command: node dist/index.js"

4. **If using `railway.json`:**
   - Procfile overrides railway.json
   - Remove one untuk consistency

---

## 🔍 Debugging Commands

### View Logs (Real-time)
```bash
railway logs -f
```

### Check Status
```bash
railway status
```

### View Current Configuration
```bash
railway variables
railway config
```

### Test Connectivity
```bash
# Test database
railway run npm run check

# Test DNS
railway run nslookup google.com

# Test HTTP
railway run curl https://api.example.com
```

### Compare Local vs Production
```bash
# Local
NODE_ENV=production npm run build
NODE_ENV=production node dist/index.js

# Production
railway logs -f
```

---

## 📊 Monitoring Checklist

Add ke daily/weekly routine:

- [ ] Check Railway Dashboard für errors
- [ ] Monitor memory/CPU metrics
- [ ] Review last 24h logs für warnings
- [ ] Test login flow manually
- [ ] Verify database backups (if enabled)
- [ ] Check for slow queries
- [ ] Monitor budget usage

---

## 🆘 When All Else Fails

### 1. **Nuclear Option - Complete Redeploy**
```bash
# Delete everything
railway deployment destroy <deployment-id>

# Redeploy fresh
git push origin main
railway deploy
railway run npm run db:push
```

### 2. **Reset Database (Caution!)**
```bash
# Backup first
railway run mysqldump -u $MYSQL_USER -p$MYSQL_PASSWORD -h $MYSQL_HOST > backup.sql

# Drop all tables
railway run mysql -u $MYSQL_USER -p$MYSQL_PASSWORD -h $MYSQL_HOST -e "DROP DATABASE database; CREATE DATABASE database;"

# Run migrations
railway run npm run db:push
```

### 3. **Rollback to Previous Deployment**
```bash
railway rollback <deployment-id>
```

### 4. **Escalate to Railway Support**
- Railway Dashboard → Support → Create ticket
- Provide:
  - Deployment ID
  - Error logs
  - Steps to reproduce
  - What you've tried

---

## 📞 Resources

- **Railway Docs**: https://docs.railway.app
- **Drizzle Docs**: https://orm.drizzle.team
- **tRPC Docs**: https://trpc.io
- **Node.js Docs**: https://nodejs.org/docs

---

**Last Updated**: April 9, 2026  
**Version**: 1.0.0  
**Issues Covered**: 10 major issues + 4 alternative solutions
