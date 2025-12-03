# Email Debugging & Testing Guide

## What Was Fixed

### 1. ✅ Added Comprehensive Logging
**Files Updated:**
- `src/services/supportService.ts` - Added detailed console logs
- `supabase/functions/send-email/index.ts` - Added request/SMTP logging

**What to Look For:**
```javascript
// In browser console after ticket submission:
[Support] Sending email for ticket GF-20251203-XXXX
[Support] Sending to: user@example.com and support@goflexconnect.com
[Support] About to invoke send-email edge function...
[Support] Email sent successfully: {success: true, ...}
[Support] Email response data: {...}

// In edge function logs:
[send-email] Received request
[send-email] To: ["support@goflexconnect.com"]
[send-email] CC: ["user@example.com"]
[send-email] Subject: We received your request – Ticket #GF-...
[send-email] HTML length: 2547
[send-email] SMTP config: {host: "smtp.ionos.com", ...}
```

### 2. ✅ Logo HTML Simplified
- Removed multi-line formatting in template literal
- Single-line `<img>` tag to avoid parsing issues
- Kept all email-safe attributes (border="0", inline styles)

### 3. ✅ Test Email Button Ready
**Location:** Admin Dashboard > Admin Email Test section
**What It Does:**
- Sends test email to all admin addresses
- Verifies SMTP connection & authentication
- Logs result in Admin Alerts
- Shows success/error status with duration

## How to Debug Email Issues

### Step 1: Submit a Test Ticket
1. Open Support form (Help button in app)
2. Fill out all fields
3. Click Submit
4. **Open browser console (F12)**

### Step 2: Check Console Logs
Look for these messages in order:

✅ **Success Flow:**
```
[Support] Ticket created successfully
[Support] Sending email for ticket GF-...
[Support] Sending to: email@example.com and support@goflexconnect.com
[Support] About to invoke send-email edge function...
[Support] Email sent successfully
```

❌ **If Email Fails:**
```
[Support] Error invoking send-email function: {...}
[Support] Failed to send support ticket email: {...}
```

### Step 3: Check Edge Function Logs
1. Go to Supabase Dashboard
2. Navigate to Edge Functions > send-email
3. View Logs tab
4. Look for recent invocations

### Step 4: Use Admin Test Button
1. Log in as admin (ipalominopc@gmail.com or isaac@goflexconnect.com)
2. Go to Admin Dashboard
3. Scroll to "Admin Email Test" section
4. Click "Send Test Email" button
5. Wait for status message (max 15 seconds)

**Expected Result:**
- ✅ Success toast: "Test email sent successfully to 4 admin recipient(s)"
- ✅ Email arrives at all 4 admin addresses
- ✅ Logo displays at top of email

## Common Issues & Solutions

### Issue: No Email Received
**Check:**
1. Spam/junk folder
2. Browser console for errors
3. Edge function logs for SMTP errors
4. SMTP credentials in `send-email/index.ts`

**Solution:**
- Use Admin Test button to isolate issue
- Check if error is in frontend or backend

### Issue: Logo Not Displaying
**Check:**
1. View email HTML source
2. Verify image URL: `https://www.goflexconnect.com/icons/logo-128.png`
3. Test URL directly in browser

**Solution:**
- Logo file must be deployed at `/public/icons/logo-128.png`
- URL must resolve to actual image file

### Issue: Email Times Out
**Check:**
1. SMTP server connection (smtp.ionos.com:587)
2. Firewall blocking port 587
3. SMTP credentials valid

**Solution:**
- Use Admin Test button (has 15-second timeout)
- Check edge function logs for connection errors

## Email Template Structure

All emails now use this format:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;...">
  <div style="background-color:#ffffff;max-width:600px;...">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 20px 0 30px 0;">
          <img src="https://www.goflexconnect.com/icons/logo-128.png" alt="GoFlexConnect" width="80" height="80" border="0" style="display: block; outline: none; border: none; height: auto; line-height: 100%; text-decoration: none;" />
        </td>
      </tr>
      <tr>
        <td align="center" style="font-size: 28px; font-weight: bold; color: #000000; padding-bottom: 20px;">
          GoFlexConnect Support
        </td>
      </tr>
    </table>
    <!-- Email content here -->
  </div>
</body>
</html>
```

## SMTP Configuration

**Current Settings:**
- Host: `smtp.ionos.com`
- Port: `587` (STARTTLS)
- User: `support@goflexconnect.com`
- Pass: `El3m3nt&149@3050`

**Test Manually:**
```bash
# Use telnet or openssl to test SMTP connection
openssl s_client -connect smtp.ionos.com:587 -starttls smtp
```

## Next Steps

1. **Submit test ticket** and check browser console
2. **Use Admin Test button** to verify email system
3. **Check inbox** (including spam) for confirmation emails
4. **Review logs** if emails not received

---

**Status:** ✅ Debugging enabled, logo simplified, test button ready
**Build:** ✅ Successful
**Email Templates:** ✅ All updated with logo
