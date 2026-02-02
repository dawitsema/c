# Troubleshooting Guide

## Apps Script Issues

### Error: "Exception: You do not have permission to call GmailApp.search"

**Cause:** Script not authorized

**Solution:**
1. In Apps Script editor, run any function manually
2. Click "Review Permissions"
3. Select your Google account
4. Click "Allow"

### Error: "Cannot access folder with ID..."

**Cause:** Incorrect folder ID or no access

**Solution:**
1. Verify folder ID by opening folder in browser
2. Check that folder exists
3. Ensure you have edit access to folder

### No emails found

**Cause:** Search query doesn't match any emails

**Solution:**
1. Test Gmail search query directly in Gmail
2. Verify label exists and is applied to emails
3. Try simpler search: `has:attachment filename:pdf`
4. Check MAX_EMAILS_PER_RUN isn't 0

### Script exceeds maximum execution time

**Cause:** Processing too many emails at once

**Solution:**
1. Reduce MAX_EMAILS_PER_RUN to 20-30
2. Increase trigger frequency
3. Archive old processed emails

## Server Issues

### Error: "ECONNREFUSED" when triggering webhook

**Cause:** Server not running or wrong URL

**Solution:**
1. Check server is running: `curl http://localhost:3000/health`
2. Verify webhook URL in Apps Script CONFIG
3. Check firewall settings
4. Ensure port 3000 is accessible

### Error: "Unauthorized" on webhook

**Cause:** Webhook secret mismatch

**Solution:**
1. Verify WEBHOOK_SECRET in .env matches Apps Script CONFIG
2. Check Authorization header format
3. Restart server after changing .env

### Error: "Cannot find module"

**Cause:** Dependencies not installed

**Solution:**
```bash
npm install
```

### Google Drive download fails

**Cause:** Service account not authorized

**Solution:**
1. Share Drive folders with service account email
2. Verify service account JSON file path in .env
3. Check service account has Drive API enabled
4. Grant "Viewer" permission on folders

## Playwright Issues

### Error: "Executable doesn't exist"

**Cause:** Playwright browsers not installed

**Solution:**
```bash
npx playwright install chromium
npx playwright install-deps chromium
```

### DATEV login fails

**Cause:** Session expired or incorrect credentials

**Solution:**
1. Run setup again: `node playwright/setup-auth.js`
2. Verify credentials in .env
3. Complete 2FA if prompted
4. Trust device in DATEV
5. Delete old auth: `rm -rf playwright/.auth/`

### Upload times out

**Cause:** Network slow or DATEV unresponsive

**Solution:**
1. Increase UPLOAD_TIMEOUT_MS in .env (e.g., 120000)
2. Check internet connection
3. Try manual upload in browser to test DATEV
4. Check DATEV service status

### Selectors not found

**Cause:** DATEV UI changed

**Solution:**
1. Inspect DATEV page with browser DevTools
2. Update selectors in `playwright/datev-upload.js`
3. Test with `node playwright/datev-upload.js test.pdf`
4. Consider using more robust selectors

## File Processing Issues

### Files not moving to uploaded folder

**Cause:** Status callback not received or failed

**Solution:**
1. Check APPS_SCRIPT_WEBHOOK_URL in .env
2. Verify web app deployment in Apps Script
3. Check server logs for status callback errors
4. Manually run `handleUploadSuccess` in Apps Script

### Duplicate files

**Cause:** Script processing same email twice

**Solution:**
1. Check script properties aren't cleared
2. Verify processed label is being applied
3. Add additional duplicate detection logic

### File name encoding issues

**Cause:** Special characters in metadata

**Solution:**
1. Review `sanitizeFileName` function
2. Add additional character replacements
3. Test with problematic filenames

## Performance Issues

### Apps Script slow

**Cause:** Processing many emails or large attachments

**Solution:**
1. Reduce MAX_EMAILS_PER_RUN
2. Filter out non-invoice emails earlier
3. Consider batch processing

### Server memory issues

**Cause:** Large files or concurrent uploads

**Solution:**
1. Set MAX_FILE_SIZE_MB in .env
2. Implement upload queue
3. Increase server memory allocation
4. Clean up temp files regularly

### Playwright crashes

**Cause:** Browser process issues

**Solution:**
1. Restart server
2. Clear browser cache: `rm -rf playwright/.auth/`
3. Update Playwright: `npm update playwright`
4. Check system resources

## Network Issues

### Webhook connection refused

**Cause:** Firewall or network issue

**Solution:**
1. Check server firewall allows incoming connections
2. Verify port is open
3. Test with curl: `curl -X POST http://server:3000/webhook/upload`
4. Check cloud provider security groups

### SSL/TLS errors

**Cause:** Certificate issues

**Solution:**
1. Verify SSL certificate is valid
2. Update Node.js to latest LTS
3. Check CA certificates: `npm install -g node-ca`

## Debugging Tips

### Enable verbose logging

In server/index.js:
```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

In playwright/datev-upload.js:
```javascript
const browser = await chromium.launch({
  headless: false, // See what's happening
  slowMo: 1000     // Slow down actions
});
```

### Test components individually

**Test Apps Script:**
```javascript
// Run testConfiguration function
```

**Test server:**
```bash
curl http://localhost:3000/health
```

**Test Playwright:**
```bash
node playwright/datev-upload.js test.pdf
```

**Test webhook:**
```bash
curl -X POST http://localhost:3000/webhook/upload \
  -H "Authorization: Bearer your-secret" \
  -H "Content-Type: application/json" \
  -d '{"fileId":"test","fileName":"test.pdf"}'
```

### Check logs

**Apps Script:**
- View > Logs in editor
- View > Executions for trigger history

**Server:**
```bash
# If using PM2
pm2 logs datev-automation

# If running directly
# Check console output
```

**Playwright:**
```bash
# Enable debug mode
DEBUG=pw:api node playwright/datev-upload.js test.pdf
```

## Getting More Help

1. Check tracking sheet for error patterns
2. Review all logs chronologically
3. Test with minimal configuration first
4. Try on different network
5. Verify all credentials are current
6. Check DATEV service status
7. Review recent DATEV UI changes

## Emergency Recovery

### If system completely broken

1. Stop all triggers in Apps Script
2. Stop server
3. Verify all credentials are correct
4. Test each component individually
5. Re-run setup scripts from scratch
6. Check for external service outages
7. Restore from backup if needed

### If DATEV locked account

1. Contact DATEV support
2. Reset password if needed
3. Re-run `node playwright/setup-auth.js`
4. Verify 2FA settings

### If Google quota exceeded

1. Wait for quota reset (usually 24 hours)
2. Reduce trigger frequency
3. Optimize search queries
4. Consider Google Workspace upgrade
