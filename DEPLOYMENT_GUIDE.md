# GoFlexConnect - IONOS Deployment Guide

## Complete Step-by-Step Instructions

Follow these steps in order to deploy your GoFlexConnect app to IONOS.

---

## Phase 1: Prepare Your Files

### Step 1: Build Your Application

1. Open your terminal/command prompt
2. Navigate to your project folder (where this file is located)
3. Run this command:
   ```bash
   npm run build
   ```
4. Wait for it to complete (should take 5-10 seconds)
5. You should now see a folder called `dist` in your project directory
6. **IMPORTANT:** Keep this `dist` folder - you'll upload these files to IONOS

**✅ Checkpoint:** You should have a `dist` folder containing:
- `index.html` file
- `assets` folder (with CSS and JS files inside)

---

## Phase 2: Create the .htaccess File

### Step 2: Create Routing Configuration

This file tells IONOS how to handle your app's URLs correctly.

1. In your project folder, create a new file called `.htaccess` (note the dot at the beginning)
2. Copy and paste this exact content into the file:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

3. Save the file
4. Copy this `.htaccess` file into your `dist` folder

**✅ Checkpoint:** Your `dist` folder should now contain:
- `index.html`
- `assets` folder
- `.htaccess` file (you just created)

---

## Phase 3: Access Your IONOS Account

### Step 3: Log in to IONOS

1. Go to: **https://www.ionos.com/login**
2. Enter your login credentials
3. Click "Log in"

### Step 4: Navigate to Your Hosting Settings

1. Once logged in, look for **"Hosting"** in the menu (usually on the left or top)
2. Click on **"Hosting"**
3. You'll see your hosting package(s) listed
4. Click on the hosting package where you want to deploy the app

**✅ Checkpoint:** You should now be viewing your hosting package details

---

## Phase 4: Choose Your Deployment Location

You have 3 options. Choose ONE:

### **OPTION A: Main Domain** (Example: `goflexconnect.com`)
- Your app will replace whatever is currently on your main domain
- Best if you want this to be your primary website

### **OPTION B: Subdirectory** (Example: `goflexconnect.com/app`)
- Your app will be in a folder on your existing site
- Best if you want to keep your existing website and add this as a section
- You'll need to modify the `.htaccess` file (see Step 5B)

### **OPTION C: Subdomain** (Example: `app.goflexconnect.com`)
- Your app will be on a separate subdomain
- Best if you want a completely separate URL
- Requires creating a subdomain first (see Step 5C)

**Make your choice and continue to the relevant step below.**

---

## Phase 5: Upload Files to IONOS

### Step 5A: Upload to Main Domain

1. In your IONOS hosting dashboard, look for **"File Manager"** or **"WebSpace Explorer"**
2. Click on it to open the file browser
3. You'll see a directory structure. Navigate to the root folder:
   - This might be called `/`, `/html`, or `/public_html`
4. **BACKUP YOUR CURRENT FILES:**
   - If there are existing files, select all and download them first (just in case)
   - Or rename the folder to something like `old_website_backup`
5. Delete the old files or clear the directory
6. Click **"Upload"** button
7. Select ALL files from your `dist` folder:
   - `index.html`
   - `assets` folder
   - `.htaccess`
8. Upload them to the root directory
9. Wait for the upload to complete

**✅ Checkpoint:** Your root directory should now contain only:
- `index.html`
- `assets/` (folder)
- `.htaccess`

**Your app is now accessible at:** `https://yourdomain.com`

**Skip to Phase 6**

---

### Step 5B: Upload to Subdirectory (e.g., `/app`)

1. In your IONOS hosting dashboard, look for **"File Manager"** or **"WebSpace Explorer"**
2. Click on it to open the file browser
3. Navigate to the root folder (`/`, `/html`, or `/public_html`)
4. Click **"Create New Folder"**
5. Name it `app` (or whatever you want, like `wifi`, `survey`, etc.)
6. Open this new folder
7. Click **"Upload"**
8. Select ALL files from your `dist` folder and upload them here

**IMPORTANT: Update .htaccess for subdirectory**
9. After uploading, click on the `.htaccess` file you uploaded
10. Click **"Edit"** or **"View/Edit"**
11. Change line 3 from:
    ```
    RewriteBase /
    ```
    To:
    ```
    RewriteBase /app/
    ```
    (Replace `app` with your actual folder name if different)
12. Change line 7 from:
    ```
    RewriteRule . /index.html [L]
    ```
    To:
    ```
    RewriteRule . /app/index.html [L]
    ```
    (Replace `app` with your actual folder name if different)
13. Save the file

**✅ Checkpoint:** Your `/app` folder should contain:
- `index.html`
- `assets/` (folder)
- `.htaccess` (with updated paths)

**Your app is now accessible at:** `https://yourdomain.com/app`

**Skip to Phase 6**

---

### Step 5C: Upload to Subdomain (e.g., `app.yourdomain.com`)

**First, create the subdomain:**

1. In IONOS dashboard, go to **"Domains"** or **"Domains & SSL"**
2. Find your domain in the list
3. Click **"Subdomains"** or look for a button to manage subdomains
4. Click **"Create Subdomain"** or **"Add New Subdomain"**
5. Enter your subdomain name (e.g., `app`, `wifi`, `survey`)
6. Set the destination folder:
   - Create a new folder name like `app_subdomain` or use an existing one
   - Note the folder path shown (e.g., `/app_subdomain`)
7. Click **"Create"** or **"Save"**
8. Wait a few minutes for the subdomain to be created

**Now upload your files:**

9. Go back to **"File Manager"** or **"WebSpace Explorer"**
10. Navigate to the folder you just created for the subdomain (e.g., `/app_subdomain`)
11. Click **"Upload"**
12. Select ALL files from your `dist` folder and upload them here

**✅ Checkpoint:** Your subdomain folder should contain:
- `index.html`
- `assets/` (folder)
- `.htaccess`

**Your app is now accessible at:** `https://app.yourdomain.com`

**⏰ Note:** Subdomain DNS can take 15 minutes to 24 hours to propagate

---

## Phase 6: Enable SSL/HTTPS

### Step 6: Secure Your Site with SSL

1. In your IONOS dashboard, go to **"Domains & SSL"** or **"SSL Certificates"**
2. Find your domain (or subdomain) in the list
3. Look for SSL status - it might say:
   - "Active" ✅ (you're done!)
   - "Inactive" or "Not configured"
4. If inactive, click **"Activate SSL"** or **"Enable SSL"**
5. IONOS usually provides free SSL certificates (Let's Encrypt)
6. Select the free option if prompted
7. Wait 5-15 minutes for SSL to be activated
8. Once active, your site will be accessible via `https://`

**✅ Checkpoint:** Visit your site with `https://` (note the 's')
- You should see a padlock icon in the browser address bar
- The site should load without security warnings

---

## Phase 7: Test Your Deployment

### Step 7: Verify Everything Works

1. Open your web browser
2. Go to your app's URL:
   - **Main domain:** `https://yourdomain.com`
   - **Subdirectory:** `https://yourdomain.com/app`
   - **Subdomain:** `https://app.yourdomain.com`

3. You should see the **GoFlexConnect** login/signup screen with:
   - Blue gradient background
   - "GF" logo circle
   - "Sign In" and "Sign Up" tabs
   - Email and password fields

4. **Test account creation:**
   - Click "Sign Up" tab
   - Enter an email address
   - Enter a password (at least 6 characters)
   - Click "Create Account"
   - You should be logged in and see the splash screen

5. **Test navigation:**
   - After onboarding, you should see the main menu
   - Try clicking around to verify all features work
   - Go to Settings to verify your email shows up
   - Try the Sign Out button

**✅ Checkpoint:** If all the above works, your deployment is successful!

---

## Phase 8: Share Your App

### Step 8: Give Users Access

Your app is now live! Users can access it by:

1. Going to your URL (share the link)
2. Clicking "Sign Up" to create an account
3. Entering their email and password
4. Starting to use the WiFi survey tool

**Important:**
- Every user MUST create an account to access the app
- User data is stored securely in Supabase
- Users can sign out and sign back in anytime

---

## Troubleshooting Guide

### Problem: Blank white page after visiting the URL

**Solutions:**
1. Check that `index.html` is in the correct directory
2. Verify all files uploaded successfully
3. Clear your browser cache (Ctrl+F5 or Cmd+Shift+R)
4. Check browser console for errors (F12 → Console tab)

---

### Problem: "404 Not Found" or "Page Not Found"

**Solutions:**
1. Verify the `.htaccess` file is in the same directory as `index.html`
2. Check `.htaccess` paths match your deployment location:
   - Main domain: `RewriteBase /`
   - Subdirectory: `RewriteBase /app/` (or your folder name)
3. Make sure the `.htaccess` file wasn't renamed during upload
4. Contact IONOS support to verify mod_rewrite is enabled

---

### Problem: CSS/styling not loading (plain text page)

**Solutions:**
1. Verify the `assets` folder uploaded completely
2. Check that the `assets` folder is in the same directory as `index.html`
3. Right-click the page → "View Page Source" → Click on CSS file links to see if they load
4. Check file permissions in IONOS File Manager (should be readable)

---

### Problem: "Invalid login credentials" or can't create account

**Solutions:**
1. Check your `.env` file has correct Supabase credentials
2. Verify your Supabase project is active (log in to supabase.com)
3. Check browser console for error messages (F12 → Console)
4. Make sure you're using `https://` (not `http://`)

---

### Problem: Subdomain not working

**Solutions:**
1. Wait 24 hours for DNS propagation
2. Try accessing with `http://` first, then `https://`
3. Clear your browser cache
4. Try from a different device or network
5. Verify subdomain was created correctly in IONOS dashboard

---

## Future Updates

### How to Update Your App After Changes

1. Make your code changes locally
2. Run `npm run build` in your terminal
3. Go to IONOS File Manager
4. Navigate to where your app is deployed
5. Upload the NEW files from your `dist` folder
6. Select "Overwrite existing files" when prompted
7. Your changes are now live!

**💡 Tip:** Always keep the `.htaccess` file - don't delete it during updates

---

## Important Links

### Your Project Files
- **Build folder:** Located at `dist/` in your project
- **This guide:** `DEPLOYMENT_GUIDE.md` in your project root

### IONOS Links
- **Login:** https://www.ionos.com/login
- **Help Center:** https://www.ionos.com/help
- **Support:** https://www.ionos.com/contact

### Your Supabase Dashboard
- **Dashboard:** https://supabase.com/dashboard
- **Project Settings:** Check your project for database credentials

### Your Environment Variables
- Check your `.env` file in the project folder for:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

---

## Need Help?

### Common Questions

**Q: Do I need to update anything in my Supabase settings?**
A: No, your Supabase configuration works automatically. Just make sure your `.env` file has the correct credentials.

**Q: Can I use a different folder name instead of "app"?**
A: Yes! Just remember to update the `.htaccess` file paths accordingly.

**Q: Will my users' data be saved?**
A: Yes, all user accounts and data are stored in Supabase and persist across sessions.

**Q: Can I see who has registered?**
A: Yes, log in to your Supabase dashboard → Authentication → Users

**Q: How do I give users access?**
A: Just share your URL. Users create their own accounts by clicking "Sign Up"

**Q: Can I remove the authentication requirement?**
A: You can, but it's not recommended for security. Contact me if you need help with this.

---

## Success Checklist

Before considering deployment complete, verify:

- [ ] Build completed successfully (`npm run build`)
- [ ] `.htaccess` file created and uploaded
- [ ] All files from `dist` folder uploaded to IONOS
- [ ] SSL certificate is active (https:// works)
- [ ] Login/signup screen appears when visiting URL
- [ ] Test account creation works
- [ ] Can navigate through the app
- [ ] Settings shows user email
- [ ] Sign out button works

**🎉 If all boxes are checked, your deployment is complete!**

---

## Your Deployment Summary

Fill this out for your records:

- **Domain/URL:** _________________________
- **Deployment Type:** ☐ Main Domain  ☐ Subdirectory  ☐ Subdomain
- **Deployment Date:** _________________________
- **Upload Method Used:** ☐ File Manager  ☐ FTP
- **SSL Status:** ☐ Active  ☐ Pending
- **First Test Account:** _________________________

---

**Last Updated:** November 23, 2025
**App Version:** GoFlexConnect v1.0
**Guide Version:** 1.0
