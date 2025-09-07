# 🚀 Google OAuth Authentication Fix - Deployment Checklist

## ✅ CONFIRMATION STEPS

Follow these exact steps to resolve the "Authentication Error" issue:

### Step 1: Test Your Debug Endpoint
**IMMEDIATE ACTION:** Visit this URL and note the response:
```
https://fake-detector.vercel.app/api/auth/debug
```

**Expected Results:**
```json
{
  "environment": {
    "NEXTAUTH_URL": "✅ Set",
    "AUTH_SECRET": "✅ Set",
    "GOOGLE_CLIENT_ID": "✅ Set",
    "GOOGLE_CLIENT_SECRET": "✅ Set"
  },
  "database": "✅ Connected",
  "authentication": "✅ Working"
}
```

**If anything shows "❌ Missing" or "❌ Failed", stop here and fix.**

### Step 2: Verify Google OAuth Settings
Visit [Google Cloud Console](https://console.cloud.google.com):
1. **APIs & Services** → **Credentials** → Your OAuth Client
2. **Authorized redirect URIs** must equal:
   ```
   https://fake-detector.vercel.app/api/auth/callback/google
   ```
3. **Authorized origins** must equal:
   ```
   https://fake-detector.vercel.app
   ```

### Step 3: Deploy Environment Variables to Vercel
Go to [Vercel Dashboard](https://vercel.com/dashboard):
1. Your project → **Settings** → **Environment Variables**
2. Verify these are set in Vercel Environment Variables (⚠️ **NEVER commit actual secrets to code**)
   ```
   NEXTAUTH_URL=https://fake-detector.vercel.app
   AUTH_SECRET=your-auth-secret-here
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret-here
   ```

### Step 4: Force Redeploy
```bash
git add -A
git commit -m "fix: oauth redirect uri configuration"
git push origin main
```

### Step 5: Clear Browser Cache
1. Open DevTools → **Application** tab → **Clear Storage**
2. Or manually clear cookies for fake-detector.vercel.app

### Step 6: Test Authentication
1. Visit: `https://fake-detector.vercel.app/auth/signin`
2. Click "Sign in with Google"
3. **This should work now!**

## 🔍 TROUBLESHOOTING

### If Debug Shows "❌ Database Failed"
- Your Prisma Accelerate URL is incorrect
- Check your Accelerate dashboard for the correct connection string

### If Debug Shows "❌ Authentication Failed"
- Google OAuth credentials are invalid
- Go back to Step 2 and verify the Client ID/Secret

### If Debug Shows Missing Environment Variable
- Variables not deployed to Vercel
- Go back to Step 3

### If Still Getting Redirect URI Mismatch
- Check for trailing slashes: `/api/auth/callback/google` (no extra slash)
- Ensure exactly: `https://fake-detector.vercel.app` (lowercase)
- Redeploy after any changes to Google Console

## 📞 SUPPORT

1. **Share your debug endpoint response** if still failing
2. **Check Vercel function logs** for specific errors
3. **Try private window** to rule out cache issues
4. **Verify domain ownership** in Google Console

## 🎉 SUCCESS CONFIRMATION

Once working, you'll see:
1. **No more "Authentication Error" page**
2. **Successful redirect to dashboard**
3. **User created in database**
4. **JWT token in browser storage**

**This checklist should resolve 99% of OAuth issues!** ✅
