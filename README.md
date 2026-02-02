# DATEV Invoice Automation System

Automated invoice processing system that integrates Google Apps Script for email/Drive management with Playwright for browser automation to upload invoices to DATEV Unternehmen online.

## Architecture Overview

```
Gmail Inbox → Apps Script → Google Drive → Webhook Server → Playwright → DATEV Upload
     ↓                            ↓                              ↓
   Label              Drive/DATEV/Incoming              Status Update
                      Drive/DATEV/Uploaded
                      Drive/DATEV/Failed
```

## Features

- **Gmail Automation**: Automatically scan for invoice emails by label or sender
- **PDF Extraction**: Download and rename PDF attachments using DATEV naming conventions
- **Drive Management**: Organized folder structure for incoming, uploaded, and failed files
- **Metadata Tracking**: Track processing status in Google Sheets
- **DATEV Upload**: Browser automation for uploading to DATEV Unternehmen online
- **Error Handling**: Robust error handling with status callbacks
- **Security**: Credentials stored securely, HTTPS webhooks

## Prerequisites

- Node.js 16+ installed
- Google Workspace account with Apps Script access
- DATEV Unternehmen online account
- Server or Cloud Run instance to host the webhook server

## Setup Instructions

### 1. Google Apps Script Setup

1. Go to Google Apps Script (script.google.com)
2. Create a new project
3. Copy contents from `apps-script/Code.gs` to your script
4. Set up Gmail labels for invoice emails
5. Configure Drive folder IDs in the script
6. Deploy as a web app for webhook endpoints
7. Set up time-based triggers to run email scanning

### 2. Webhook Server Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```

4. Fill in your credentials in `.env`:
   - DATEV username and password
   - Google service account path
   - Apps Script webhook URL
   - Webhook secret key

5. Start the server:
   ```bash
   npm start
   ```

### 3. Playwright DATEV Setup

1. First-time login (manual 2FA):
   ```bash
   node playwright/setup-auth.js
   ```
   This will open a browser for you to login and save the session.

2. Test the upload:
   ```bash
   npm run playwright
   ```

### 4. Google Service Account

1. Create a service account in Google Cloud Console
2. Download the JSON credentials file
3. Share your Drive folders with the service account email
4. Place the credentials file as specified in `.env`

## Folder Structure

```
DATEV/
├── Incoming/     # New files waiting for upload
├── Uploaded/     # Successfully uploaded files
└── Failed/       # Failed uploads for manual review
```

## DATEV Naming Convention

Files are renamed to: `{VENDOR}_{YYYYMMDD}_{INVOICE_NUMBER}.pdf`

Example: `TELEKOM_20240115_INV123456.pdf`

## Security Notes

- Never commit `.env` or credential files
- Use HTTPS for all webhook communications
- Store DATEV credentials only on the server (not in Apps Script)
- Use webhook secrets to verify requests
- Service account has minimal required permissions

## Deployment

### Cloud Run (Recommended)

1. Build container:
   ```bash
   docker build -t datev-automation .
   ```

2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy datev-automation --image datev-automation
   ```

### VPS Deployment

1. Use PM2 or systemd to run the server
2. Configure nginx as reverse proxy
3. Set up SSL certificates

## Troubleshooting

### DATEV Login Issues
- Clear saved auth state: `rm -rf playwright/.auth/`
- Re-run manual setup: `node playwright/setup-auth.js`
- Trust device in DATEV settings

### Upload Failures
- Check German locale for DATEV UI selectors
- Verify document category mappings
- Check file size limits (usually 10MB)

### Apps Script Quota
- Gmail API: 100 emails/day (consumer), 10,000/day (Workspace)
- Drive API: 1,000 requests/100 seconds

## Maintenance

- Monitor DATEV UI changes monthly
- Update Playwright selectors if upload fails
- Review failed uploads folder weekly
- Clean up uploaded files monthly

## License

MIT

## Support

For issues or questions, please open an issue in the repository.
