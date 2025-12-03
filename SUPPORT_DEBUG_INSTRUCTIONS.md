# Support Ticket System Debug Instructions

## Changes Made

### 1. **Real Error Messages in UI**
- Changed from generic "Something went wrong" to actual error message
- Now shows: `Error: [actual error message]. If this persists, email support@goflexconnect.com`

### 2. **Enhanced Console Logging**
- Added detailed logging at every step of ticket submission
- Logs authentication state, form data, Supabase responses
- Shows exact error codes, messages, hints from Supabase

### 3. **Debug Function Enhanced**
- `debugCheckSupabaseConfig()` now checks environment variables
- Verifies Supabase client is properly initialized
- Tests table accessibility and authentication state

## Testing Instructions

### Step 1: Hard Refresh
Press **Ctrl+Shift+R** (or Cmd+Shift+R on Mac) to clear cache and reload

### Step 2: Run Debug Function
Open browser console (F12) and run:

```javascript
await debugCreateSupportTicketOnce()
```

**Expected Output:**
```
[Support][Debug] Checking Supabase configuration...
[Support][Debug] Environment variables: { hasUrl: true, hasKey: true, urlValue: "https://..." }
[Support][Debug] Supabase client: { url: "https://...", hasAuth: true, hasFrom: true }
[Support][Debug] Table exists and is accessible. Count: X
[Support][Debug] Current user: [email or anonymous]
[Support][Debug] Starting debugCreateSupportTicketOnce
[Support] Creating ticket for debug@example.com
[Support] Generated ticket number: GFC-20251203-XXXXXX
[Support] About to insert ticket with payload: { ... }
[Support] Insert result: { hasData: true, hasError: false, ticketId: "..." }
[Support][Debug] Ticket created successfully: { ticketId: "...", ticketNumber: "GFC-..." }
```

**If it fails, you'll see:**
- Exact error message
- Error code
- Error details and hints
- Which step failed

### Step 3: Test UI Submission

1. Click the **Contact Support** button (Help icon in header)
2. Fill in the form:
   - Name: Test User
   - Email: test@goflexconnect.com
   - Category: Technical Support
   - Message: Testing the fixed support system
3. Click **Submit**
4. **Watch the console** for detailed logs

**Console will show:**
```
[Support][UI] Submitting support request
[Support][UI] User authenticated: true/false, User ID: xxx or undefined
[Support][UI] Form data valid, calling createSupportTicket...
[Support][UI] Ticket payload: { ... }
[Support] Creating ticket for test@goflexconnect.com
[Support] Generated ticket number: GFC-YYYYMMDD-XXXXXX
[Support] About to insert ticket with payload: { ... }
[Support] Insert result: { hasData: true, hasError: false, ticketId: "..." }
[Support] Ticket created successfully: { ticketId: "...", ticketNumber: "..." }
```

**On Success:**
- Green success screen appears
- Shows ticket number: `GFC-YYYYMMDD-XXXXXX`
- Console shows: `[Support] Ticket created successfully`

**On Failure:**
- Red error banner appears with ACTUAL error message
- Console shows detailed error with code, details, hint
- Error banner shows: `Error: [specific message]. If this persists, email support@goflexconnect.com`

## Common Issues and Solutions

### Issue 1: Environment Variables Not Found
**Console shows:** `hasUrl: false` or `hasKey: false`

**Solution:** Check `.env` file exists and has:
```
VITE_SUPABASE_URL=https://rqxamghddsgdjlxtrbvu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Issue 2: Permission Denied / RLS Error
**Console shows:** Error code `42501` or `permission denied`

**Solution:** RLS policies are correct (verified). Check if user authentication state matches RLS expectations:
- Anonymous users: `user_id` must be `NULL`
- Authenticated users: `user_id` must equal `auth.uid()`

### Issue 3: Column Not Found
**Console shows:** Error code `42703` with column name

**Solution:** Schema mismatch. Check if insert payload matches actual table columns.

### Issue 4: Network Error
**Console shows:** `TypeError: Failed to fetch` or `NetworkError`

**Solution:**
- Check internet connection
- Verify Supabase URL is accessible
- Check CORS settings in Supabase dashboard

## Verification Checklist

After successful submission:

- [ ] Console shows `[Support] Ticket created successfully`
- [ ] Success screen appears with ticket number
- [ ] No red error banner
- [ ] Ticket appears in Admin Dashboard > Support Inbox
- [ ] Email notification sent (check spam folder)
- [ ] Ticket has correct status: `open`
- [ ] All form data saved correctly

## Need More Help?

If the debug function fails, share the console output including:
1. All `[Support][Debug]` logs
2. Any error messages with error codes
3. The insert payload that was sent
4. The exact error returned from Supabase

This will pinpoint the exact issue!
