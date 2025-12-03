# Support Ticket System - Complete Testing Guide

## 🎯 Quick Test (30 seconds)

### Step 1: Open Browser Console
Press **F12** or right-click → Inspect → Console

### Step 2: Run Diagnostics
```javascript
runSupportTests()
```

### Step 3: Expected Output
```
[Support][Diagnostics] Starting support ticket system diagnostics...
[Support][Diagnostics] ================================================
[Support][Diagnostics] Supabase URL: https://xxxx.supabase.co
[Support][Diagnostics] Supabase Key exists: true
[Support][Diagnostics] TEST 1: Supabase Connectivity
[Support][Diagnostics] ✅ PASS - Connected to support_tickets table
[Support][Diagnostics] TEST 2: Ticket Insert
[Support][Diagnostics] Attempting insert with data: {...}
[Support][Diagnostics] ✅ PASS - Ticket inserted successfully, ID: xxx
[Support][Diagnostics] Cleaning up test ticket: xxx
[Support][Diagnostics] Test ticket cleaned up successfully
[Support][Diagnostics] TEST 3: Email Edge Function
[Support][Diagnostics] ✅ PASS - Email function is accessible
[Support][Diagnostics] ================================================
[Support][Diagnostics] 🎉 ALL CRITICAL TESTS PASSED
[Support][Diagnostics] Diagnostics complete
```

### ✅ If All Tests Pass → System is Working!

---

## 📝 Full UI Test

### Test 1: Anonymous User Submission

1. **Do NOT log in** (test as anonymous user)

2. **Open Contact Support**
   - From Menu → Contact Support
   - Or Settings → Contact Support

3. **Fill Form:**
   ```
   Name: Test User
   Email: test@example.com
   Phone: (555) 123-4567
   Category: Technical Support
   Subject: Test Ticket
   Message: This is a test support ticket to verify the system works.
   ```

4. **Click "Submit Support Request"**

5. **Watch Console** (Keep F12 open):
   ```
   [Support] Submitting support request
   [Support] Creating ticket for test@example.com
   [Support] Inserting ticket with data: {...}
   [Support] Created ticket { id: "abc...", ticketNumber: "GFC-20251203-123456" }
   [Support] Sending email for ticket GFC-20251203-123456
   ```

6. **Expected UI:**
   - ✅ Button shows "Submitting..." with spinner
   - ✅ Success modal appears
   - ✅ Shows: **"Ticket #GFC-20251203-123456"**
   - ✅ Confirmation message about email
   - ✅ NO red error banner
   - ✅ Modal auto-closes after 4 seconds

### Test 2: Authenticated User Submission

1. **Log in** with your account

2. **Open Contact Support**

3. **Notice:**
   - Name and Email fields pre-filled from account
   - Can still edit them if needed

4. **Fill and Submit:**
   ```
   Category: Billing
   Subject: Payment Question
   Message: I have a question about my subscription.
   ```

5. **Expected Result:**
   - ✅ Same success flow as anonymous user
   - ✅ Ticket created with user_id linked to account

---

## 🗄️ Database Verification

### Check Tickets in Supabase

```sql
-- See all recent tickets
SELECT
  ticket_number,
  name,
  email,
  category,
  status,
  created_at
FROM support_tickets
ORDER BY created_at DESC
LIMIT 10;
```

### Check Specific Test Ticket

```sql
-- Find your test ticket
SELECT *
FROM support_tickets
WHERE email = 'test@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

### Verify Ticket Data

```sql
-- Detailed view
SELECT
  ticket_number,
  user_id,
  name,
  email,
  phone,
  category,
  subject,
  message,
  status,
  source,
  created_at
FROM support_tickets
WHERE ticket_number LIKE 'GFC-20251203%'
ORDER BY created_at DESC;
```

Expected:
- ✅ Row exists
- ✅ ticket_number format: GFC-YYYYMMDD-XXXXXX
- ✅ status = 'open'
- ✅ source = 'app'
- ✅ All fields populated correctly

---

## 📧 Email Verification

### What Should Happen

1. **Email sent TO:** support@goflexconnect.com
2. **Email CC'd to:** test@example.com (the user's email)
3. **Reply-To:** support@goflexconnect.com

### Email Content

- ✅ GoFlexConnect logo (64x64) at top
- ✅ Subject: `[GoFlexConnect] Support Request Received – Ticket #GFC-...`
- ✅ Greeting: "Hi Test User,"
- ✅ Ticket number displayed
- ✅ All ticket details listed
- ✅ User's message in formatted box
- ✅ Reply instructions
- ✅ "1-2 business days" response time
- ✅ Signature with support@goflexconnect.com

### If Email Fails

**This is OK!** Email sending is non-blocking:
- ✅ Ticket still created
- ✅ User still sees success message
- ✅ Console logs: `[Support] Ticket email send failed (non-blocking): ...`

---

## 🛠️ Support Inbox Verification

### For Admin Users Only

1. **Log in as admin** (see config/admin.ts for approved emails)

2. **Navigate to Admin Dashboard → Support Inbox**

3. **Click "Refresh"**

4. **Verify:**
   - ✅ Test ticket appears in list
   - ✅ Ticket number displayed: GFC-20251203-123456
   - ✅ Status shows "Open"
   - ✅ Category correct
   - ✅ Name and email visible
   - ✅ Created timestamp accurate

5. **Test Filters:**
   - Click "All" tab → See all tickets
   - Click "Open" tab → See only open tickets
   - Select category filter → See filtered results
   - Use search box → Find tickets by email/name

---

## 🚨 Troubleshooting

### Issue: "We couldn't submit your request" Error

**Run diagnostics first:**
```javascript
runSupportTests()
```

**Check for specific failures:**

#### TEST 1 FAILS: Connectivity
```
[Support][Diagnostics] ❌ FAIL - Connectivity error
```
**Solution:** Check `.env` file has correct Supabase credentials

#### TEST 2 FAILS: Insert
```
[Support][Diagnostics] ❌ FAIL - Insert error: { code: "42501", message: "..." }
```
**Solution:** RLS policy issue - check migration was applied

#### TEST 3 FAILS: Email
```
[Support][Diagnostics] ⚠️ WARNING - Email function error
```
**Solution:** Non-critical - tickets will still work

### Issue: Diagnostics Pass but UI Still Fails

**Check console when submitting:**
```
[Support] Failed to create ticket: Error: ...
[Support] Full error from createSupportTicket: ...
[Support] Error message: ...
```

**Look for:**
- Network errors → Check internet connection
- "Invalid API key" → Check environment variables
- "Policy violation" → RLS issue, re-apply migration
- Generic errors → Check full error object in console

---

## ✅ Acceptance Criteria Checklist

Before considering the system "working", verify ALL of these:

### Database
- [ ] `support_tickets` table exists
- [ ] Can SELECT from table
- [ ] Can INSERT into table
- [ ] Ticket appears in database after submission

### RLS Policies
- [ ] Anonymous users can INSERT
- [ ] Authenticated users can INSERT
- [ ] Anonymous users can SELECT (for immediate read-back)
- [ ] Users can SELECT their own tickets
- [ ] Admins can SELECT all tickets

### Frontend - Contact Support
- [ ] Modal opens correctly
- [ ] Form validates required fields
- [ ] Submit button shows loading state
- [ ] Success modal appears on completion
- [ ] Ticket number displayed to user
- [ ] NO error banner on success

### Backend - Service Layer
- [ ] `createSupportTicket()` executes without errors
- [ ] Generates unique ticket numbers
- [ ] Returns ticket ID and number
- [ ] Email send is non-blocking

### Email
- [ ] Email function is deployed
- [ ] Email sent to support@goflexconnect.com
- [ ] User CC'd on email
- [ ] Professional HTML template
- [ ] Email failure doesn't break ticket creation

### Admin Interface
- [ ] Support Inbox lists all tickets
- [ ] Ticket numbers displayed
- [ ] Filters work correctly
- [ ] Can view ticket details

### Diagnostics
- [ ] `runSupportTests()` accessible in console
- [ ] All 3 tests pass
- [ ] Clear logging with [Support] prefix
- [ ] Error details logged when failures occur

---

## 🎉 Success Criteria Met

**The system is working when:**

1. ✅ `runSupportTests()` shows: "🎉 ALL CRITICAL TESTS PASSED"
2. ✅ Submitting Contact Support shows success modal with ticket number
3. ✅ Ticket appears in database
4. ✅ No console errors during submission
5. ✅ Support Inbox shows the ticket (for admins)

**If all above are true → Support ticket system is FULLY OPERATIONAL! 🚀**
