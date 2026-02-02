/**
 * Example configuration showing all available options
 * Copy this and customize for your needs
 */

const CONFIG = {
  // ===========================================
  // Gmail Search Configuration
  // ===========================================
  
  // Search for emails with "invoices" label
  GMAIL_SEARCH: 'label:invoices has:attachment filename:pdf',
  
  // Alternative search patterns:
  
  // By sender domain
  // GMAIL_SEARCH: 'from:@vendor.com has:attachment filename:pdf',
  
  // By multiple senders
  // GMAIL_SEARCH: '(from:vendor1.com OR from:vendor2.com) has:attachment filename:pdf',
  
  // By subject keyword
  // GMAIL_SEARCH: 'subject:(rechnung OR invoice) has:attachment filename:pdf',
  
  // Combination
  // GMAIL_SEARCH: 'from:billing@company.com subject:invoice has:attachment filename:pdf',
  
  // ===========================================
  // Google Drive Folder IDs
  // ===========================================
  // Find folder ID: Open folder in Drive, copy ID from URL
  // Example URL: https://drive.google.com/drive/folders/1AbC2DeF3GhI4JkL5MnO
  // Folder ID: 1AbC2DeF3GhI4JkL5MnO
  
  FOLDER_INCOMING: 'YOUR_INCOMING_FOLDER_ID',  // New files awaiting upload
  FOLDER_UPLOADED: 'YOUR_UPLOADED_FOLDER_ID',  // Successfully uploaded files
  FOLDER_FAILED: 'YOUR_FAILED_FOLDER_ID',      // Failed uploads for review
  
  // ===========================================
  // Webhook Configuration
  // ===========================================
  
  WEBHOOK_URL: 'https://your-server.com/webhook/upload',
  
  // Generate a strong secret:
  // node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  WEBHOOK_SECRET: 'your-secret-key',
  
  // ===========================================
  // Google Sheet Tracking
  // ===========================================
  // Create a new Google Sheet and copy its ID from URL
  // Example URL: https://docs.google.com/spreadsheets/d/1AbC2DeF3GhI4JkL5MnO/edit
  // Sheet ID: 1AbC2DeF3GhI4JkL5MnO
  
  TRACKING_SHEET_ID: 'YOUR_SHEET_ID',
  
  // ===========================================
  // Processing Options
  // ===========================================
  
  PROCESSED_LABEL: 'DATEV/Processed',  // Label applied to processed emails
  MAX_EMAILS_PER_RUN: 50,              // Limit per execution (quota management)
  
  // ===========================================
  // Vendor-specific Settings (Optional)
  // ===========================================
  
  // Custom regex patterns for specific vendors
  VENDOR_PATTERNS: {
    'telekom': {
      regex: /Rechnung.*?(\d{10})/i,
      dateFormat: 'DD.MM.YYYY'
    },
    'aws': {
      regex: /Invoice\s+#([A-Z0-9-]+)/i,
      dateFormat: 'YYYY-MM-DD'
    }
  },
  
  // ===========================================
  // File Naming Options
  // ===========================================
  
  // Date format for filenames: YYYYMMDD
  DATE_FORMAT: 'yyyyMMdd',
  
  // Maximum length for vendor and invoice number parts
  MAX_FILENAME_LENGTH: 50,
  
  // Characters to replace in filenames
  FILENAME_REPLACE: {
    ' ': '_',
    '/': '_',
    '\\': '_',
    ':': '_',
    '*': '_',
    '?': '_',
    '"': '_',
    '<': '_',
    '>': '_',
    '|': '_'
  }
};

// Export for use in script
// (For Apps Script, just copy CONFIG object)
