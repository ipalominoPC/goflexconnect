# 🔧 SUPPORT TICKET SYSTEM - TEST NOW

## Quick Test Steps

### 1️⃣ Hard Refresh
Press **Ctrl+Shift+R** (Windows/Linux) or **Cmd+Shift+R** (Mac)

### 2️⃣ Open Console
Press **F12** → Go to **Console** tab

### 3️⃣ Run Debug Function
```javascript
await debugCreateSupportTicketOnce()
```

---

## What You Should See

### ✅ **If Working:**
```
[Support][Debug] Checking Supabase configuration...
[Support][Debug] Environment variables: { hasUrl: true, hasKey: true, ... }
[Support][Debug] Table exists and is accessible
[Support] Generated ticket number: GFC-20251203-XXXXXX
[Support] Insert result: { hasData: true, hasError: false, ticketId: "..." }
[Support][Debug] Ticket created successfully: { ticketId: "...", ticketNumber: "GFC-..." }
```

Returns: `{ ticketId: "uuid", ticketNumber: "GFC-20251203-XXXXXX" }`

### ❌ **If Failing:**
You'll see detailed error with:
- Error message
- Error code
- Error details
- Which step failed

---

## Then Test UI

1. Click **Help icon** (?) in header
2. Fill in form:
   - Name: Test User
   - Email: test@goflexconnect.com
   - Category: Technical Support
   - Message: Testing support system
3. Click **Submit**
4. **Watch console for logs**

### Success = Green screen with ticket number
### Failure = Red banner with REAL error message (not generic)

---

## Check Admin Dashboard

1. Click **Admin** in menu (if you're an admin)
2. Go to **Support Inbox**
3. Click **Refresh** icon
4. Your test ticket should appear

---

## What Changed

✅ Error messages now show REAL error (not generic text)
✅ Comprehensive logging at every step
✅ Environment variable verification
✅ Database and RLS policy verification
✅ Authentication state logging

---

## Share Console Output

If it fails, copy and paste the console output so I can see:
- Which step failed
- The exact error message
- The error code
- The insert payload that was sent

This will instantly reveal the problem!

---

## Ready? Let's Test! 🚀

**Run:** `await debugCreateSupportTicketOnce()`
