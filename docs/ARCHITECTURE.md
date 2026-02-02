# Architecture Overview

## System Components

### 1. Google Apps Script
- Monitors Gmail for invoice emails
- Extracts PDF attachments
- Renames files with DATEV convention
- Saves to Google Drive
- Triggers webhook to server

### 2. Webhook Server (Node.js/Express)
- Receives upload requests from Apps Script
- Downloads files from Google Drive using service account
- Queues upload jobs
- Triggers Playwright automation
- Sends status callbacks to Apps Script

### 3. Playwright Automation
- Maintains persistent browser session with DATEV
- Navigates DATEV UI
- Uploads PDF files
- Selects document categories
- Confirms upload success

### 4. Google Drive
- Incoming folder: New files waiting for upload
- Uploaded folder: Successfully processed files
- Failed folder: Files requiring manual attention

### 5. Google Sheets
- Tracks all processing attempts
- Records timestamps, status, errors
- Provides audit trail

## Data Flow

```
1. Email arrives → Gmail
2. Apps Script detects invoice → Extracts PDF
3. PDF saved → Drive/Incoming
4. Webhook triggered → Server
5. Server downloads → From Drive
6. Playwright uploads → To DATEV
7. Status callback → Apps Script
8. File moved → Drive/Uploaded or Drive/Failed
9. Status logged → Google Sheet
```

## Security Model

- **Apps Script**: Has access to Gmail and Drive only
- **Server**: Has Drive read-only access via service account
- **DATEV Credentials**: Stored only on server, never in Apps Script
- **Webhooks**: Authenticated with secret keys
- **HTTPS**: All communication encrypted

## Error Handling

1. **Email Processing Errors**: Logged to sheet, email not marked as processed
2. **Download Errors**: Retry logic, move to failed folder
3. **Upload Errors**: Captured by Playwright, file moved to failed folder
4. **Network Errors**: Timeout handling, status callbacks

## Scalability

- Apps Script: Handles up to 50 emails per run
- Server: Can process uploads concurrently
- Playwright: Queued uploads to prevent race conditions
- Storage: Google Drive provides unlimited storage (Workspace)

## Monitoring Points

1. Apps Script execution logs
2. Server application logs
3. Google Sheet tracking data
4. Drive folder file counts
5. DATEV upload confirmations

## Failure Recovery

- Failed uploads moved to dedicated folder
- Manual review and retry process
- Duplicate detection via filename
- Processing state tracked in Google Sheets
