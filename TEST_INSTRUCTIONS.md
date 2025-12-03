# Quick Test Instructions - Support Ticket System

## Fastest Way to Test (30 seconds)

1. **Start the app:**
   ```bash
   npm run dev
   ```

2. **Open browser console** (F12)

3. **Run tests:**
   ```javascript
   runSupportTests()
   ```

4. **Watch the console:**
   - You'll see detailed test execution
   - All 7 tests should pass ✅
   - Look for ticket numbers like `GFC-20251203-123456`
   - Check for `[Support]` log messages

## Expected Output

```
🧪 Support Test Suite Available
Run: runSupportTests()

╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     GOFLEXCONNECT SUPPORT TICKET SYSTEM TEST SUITE        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

🧪 TEST 1: Happy Path - Complete Ticket Creation
[Support] Creating ticket for test-happy@example.com
[Support] Generated ticket number: GFC-20251203-123456
[Support] Created ticket { id: "...", ticketNumber: "GFC-20251203-123456" }
[Support] Sending email for ticket GFC-20251203-123456
[Support] Email sent successfully

============================================================
TEST: Happy Path - Complete Ticket Creation
STATUS: ✅ PASSED
MESSAGE: Ticket created successfully with correct data and email sent
============================================================

... (6 more tests) ...

╔════════════════════════════════════════════════════════════╗
║                      TEST SUMMARY                          ║
╚════════════════════════════════════════════════════════════╝

Total Tests: 7
✅ Passed: 7
❌ Failed: 0
⏱️  Duration: 12.34s

🎉 ALL TESTS PASSED! The support ticket system is fully operational.
```

## What Gets Tested

1. ✅ **Ticket Creation** - Real tickets created in database
2. ✅ **Unique Ticket Numbers** - GFC-YYYYMMDD-XXXXXX format
3. ✅ **Email Sending** - Emails sent to support@goflexconnect.com
4. ✅ **Support Inbox** - Tickets appear in admin view
5. ✅ **Validation** - Required fields enforced
6. ✅ **All Categories** - Technical, Account, Billing, Feature Request, Feedback
7. ✅ **Metadata** - Status, timestamps, source all set correctly

## Manual UI Test (2 minutes)

1. **Open Contact Support:**
   - From Menu → Contact Support
   - Or from Settings → Contact Support

2. **Fill the form:**
   - Name: Test User
   - Email: test@example.com
   - Category: Technical Support
   - Message: Testing the support system

3. **Submit:**
   - Click "Submit Support Request"
   - Button shows "Sending..." with spinner
   - Success banner appears with ticket number

4. **Check Support Inbox (admin only):**
   - Navigate to Admin Dashboard → Support Inbox
   - Click "Refresh"
   - Your ticket should appear

## Check Email

**Who receives emails:**
- TO: support@goflexconnect.com
- CC: test@example.com (user's email)

**Email includes:**
- GoFlexConnect logo
- Ticket number (GFC-...)
- All ticket details
- User's message
- Reply instructions

## Verify Database

```sql
-- Check recent tickets
SELECT
  ticket_number,
  status,
  name,
  email,
  category,
  subject,
  created_at
FROM support_tickets
ORDER BY created_at DESC
LIMIT 10;

-- Check test tickets
SELECT COUNT(*) as test_tickets
FROM support_tickets
WHERE email LIKE 'test-%@example.com';
```

## Clean Up Test Data

```sql
-- Remove test tickets
DELETE FROM support_tickets
WHERE email LIKE 'test-%@example.com';
```

## Troubleshooting

**If tests fail:**
1. Check Supabase connection (verify .env file)
2. Ensure database is accessible
3. Verify edge functions are deployed
4. Check console for detailed error messages

**If you see permission errors:**
- Support Inbox test requires admin access
- This is expected for non-admin users
- Other tests should still pass

**If email fails:**
- Tickets should still be created (non-blocking)
- Check send-email edge function deployment
- Verify SMTP credentials

## Success Criteria

✅ Console shows: "🎉 ALL TESTS PASSED!"
✅ All 7 tests show ✅ PASSED
✅ Ticket numbers generated (GFC-...)
✅ Console logs show [Support] messages
✅ No red errors in console

---

**That's it! The support system is working if all tests pass.** 🎉

For more details, see:
- `SUPPORT_TICKET_TESTS.md` - Full test documentation
- `SUPPORT_SYSTEM_COMPLETE.md` - Complete system overview
