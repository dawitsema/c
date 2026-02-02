# DATEV Invoice Automation - Quick Start

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Google Workspace account
- [ ] DATEV Unternehmen online account
- [ ] Server or cloud hosting (for webhook server)

## Setup Steps

### 1. Google Drive Setup (5 minutes)

1. Create folder structure in Google Drive:
   - DATEV/Incoming
   - DATEV/Uploaded
   - DATEV/Failed

2. Note each folder ID (from URL)

3. Create Google Sheet named "DATEV Tracking"

4. Note Sheet ID (from URL)

### 2. Apps Script Setup (10 minutes)

1. Go to script.google.com
2. Create new project
3. Copy `apps-script/Code.gs` contents
4. Update CONFIG with your folder/sheet IDs
5. Run `testConfiguration` to verify
6. Run `setupTracking` to initialize
7. Deploy as web app
8. Copy web app URL
9. Set up time-based trigger (every hour)

### 3. Server Setup (15 minutes)

```bash
# Clone repository
git clone <repo-url>
cd datev-automation

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

Required in `.env`:
- DATEV_USERNAME
- DATEV_PASSWORD
- WEBHOOK_SECRET (generate a random string)
- GOOGLE_SERVICE_ACCOUNT_PATH (path to service account JSON)
- APPS_SCRIPT_WEBHOOK_URL (from step 2.7)

### 4. Service Account Setup (10 minutes)

1. Go to Google Cloud Console
2. Create new project or select existing
3. Enable Google Drive API
4. Create service account
5. Create JSON key
6. Download and save as `service-account.json`
7. Share Drive folders with service account email
8. Update path in `.env`

### 5. DATEV Authentication (5 minutes)

```bash
# Run interactive login
node playwright/setup-auth.js
```

- Complete login in browser
- Complete 2FA if required
- Trust device
- Close browser when done

### 6. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

### 7. Gmail Label Setup (5 minutes)

1. Create Gmail label "invoices"
2. Create filter to auto-apply label
3. Test with sample invoice email

### 8. Test Complete Flow

1. Send test invoice email to yourself
2. Apply "invoices" label (or wait for filter)
3. Wait for Apps Script trigger (or run manually)
4. Check server logs for upload
5. Verify file in DATEV
6. Check tracking sheet

## Verification Checklist

- [ ] Apps Script runs without errors
- [ ] Files appear in Drive/Incoming
- [ ] Webhook server receives requests
- [ ] Files download from Drive
- [ ] Playwright logs in to DATEV
- [ ] Files upload successfully
- [ ] Files move to Drive/Uploaded
- [ ] Status logged in tracking sheet
- [ ] Email labeled as processed

## Common Issues

### "Authorization required" in Apps Script
→ Run script manually once to grant permissions

### "Cannot access folder"
→ Verify folder IDs are correct

### "Webhook connection refused"
→ Ensure server is running and URL is correct

### "DATEV login failed"
→ Run `node playwright/setup-auth.js` again

### "Service account access denied"
→ Share Drive folders with service account email

## Getting Help

1. Check logs: Apps Script executions, server logs
2. Review tracking sheet for error messages
3. Check files in Drive/Failed folder
4. Verify environment variables
5. Test each component individually

## Production Checklist

- [ ] Use HTTPS for webhooks
- [ ] Strong webhook secret
- [ ] Service account with minimal permissions
- [ ] Regular backup of tracking sheet
- [ ] Monitor logs for errors
- [ ] Set up alerts for failures
- [ ] Document DATEV UI selectors
- [ ] Plan for UI changes
- [ ] Schedule periodic auth refresh
- [ ] Test disaster recovery

## Maintenance

**Weekly:**
- Review failed uploads folder
- Check tracking sheet for patterns
- Verify automated triggers still running

**Monthly:**
- Update dependencies: `npm update`
- Review and archive old files
- Test DATEV UI selectors still work
- Clean up temp files

**Quarterly:**
- Review security settings
- Update documentation
- Test full disaster recovery
- Review and optimize costs

## Cost Estimate

- Google Workspace: Included with existing account
- Server hosting: $5-20/month (VPS) or pay-per-use (Cloud Run)
- No ongoing service fees
- Total: ~$10/month average

## Next Steps

After successful setup:
1. Monitor for first week
2. Adjust trigger frequency if needed
3. Customize filename patterns
4. Add more email senders/filters
5. Set up monitoring alerts
6. Document any customizations
