/**
 * DATEV Invoice Automation - Google Apps Script
 * 
 * This script:
 * 1. Scans Gmail for invoice emails
 * 2. Extracts PDF attachments
 * 3. Renames files using DATEV conventions
 * 4. Saves to Google Drive
 * 5. Triggers webhook to Playwright server
 * 6. Tracks processing status
 */

// Configuration - Update these with your values
const CONFIG = {
  // Gmail search query for invoice emails
  GMAIL_SEARCH: 'label:invoices has:attachment filename:pdf',
  
  // Alternative: search by sender
  // GMAIL_SEARCH: 'from:invoices@example.com has:attachment filename:pdf',
  
  // Drive folder IDs
  FOLDER_INCOMING: 'YOUR_INCOMING_FOLDER_ID',
  FOLDER_UPLOADED: 'YOUR_UPLOADED_FOLDER_ID',
  FOLDER_FAILED: 'YOUR_FAILED_FOLDER_ID',
  
  // Webhook server URL
  WEBHOOK_URL: 'https://your-server.com/webhook/upload',
  WEBHOOK_SECRET: 'your-secret-key',
  
  // Status tracking sheet
  TRACKING_SHEET_ID: 'YOUR_SHEET_ID',
  
  // Processing label
  PROCESSED_LABEL: 'DATEV/Processed',
  
  // Max emails to process per run (quota management)
  MAX_EMAILS_PER_RUN: 50
};

/**
 * Main function - Run this on a time-based trigger
 */
function processInvoiceEmails() {
  console.log('Starting invoice email processing...');
  
  try {
    // Get unprocessed invoice emails
    const threads = GmailApp.search(CONFIG.GMAIL_SEARCH, 0, CONFIG.MAX_EMAILS_PER_RUN);
    console.log(`Found ${threads.length} email threads to process`);
    
    let processedCount = 0;
    
    for (const thread of threads) {
      const messages = thread.getMessages();
      
      for (const message of messages) {
        if (!isMessageProcessed(message.getId())) {
          processMessage(message);
          processedCount++;
        }
      }
    }
    
    console.log(`Successfully processed ${processedCount} messages`);
    
  } catch (error) {
    console.error('Error processing emails:', error);
    sendErrorNotification(error);
  }
}

/**
 * Process a single email message
 */
function processMessage(message) {
  console.log(`Processing message: ${message.getSubject()}`);
  
  const attachments = message.getAttachments();
  const pdfAttachments = attachments.filter(att => 
    att.getContentType() === 'application/pdf'
  );
  
  if (pdfAttachments.length === 0) {
    console.log('No PDF attachments found');
    markMessageAsProcessed(message.getId());
    return;
  }
  
  for (const attachment of pdfAttachments) {
    try {
      processAttachment(message, attachment);
    } catch (error) {
      console.error(`Error processing attachment ${attachment.getName()}:`, error);
      logToSheet(message, attachment, 'ERROR', error.toString());
    }
  }
  
  markMessageAsProcessed(message.getId());
}

/**
 * Process a single PDF attachment
 */
function processAttachment(message, attachment) {
  // Extract metadata from email
  const metadata = extractMetadata(message, attachment);
  
  // Rename file using DATEV convention
  const newFileName = generateDATEVFileName(metadata);
  
  // Save to Drive
  const incomingFolder = DriveApp.getFolderById(CONFIG.FOLDER_INCOMING);
  const file = incomingFolder.createFile(
    attachment.copyBlob().setName(newFileName)
  );
  
  console.log(`Saved file: ${newFileName}`);
  
  // Log to tracking sheet
  logToSheet(message, attachment, 'PENDING', '', file.getId());
  
  // Trigger webhook to Playwright server
  triggerWebhook(file, metadata);
}

/**
 * Extract metadata from email and attachment
 */
function extractMetadata(message, attachment) {
  const subject = message.getSubject();
  const from = message.getFrom();
  const date = message.getDate();
  
  // Extract vendor from sender email
  const vendorMatch = from.match(/([^@<]+)@/);
  const vendor = vendorMatch ? vendorMatch[1].toUpperCase() : 'UNKNOWN';
  
  // Extract invoice number from subject (customize regex as needed)
  const invoiceMatch = subject.match(/(?:invoice|rechnung|inv)[\s#:]*([A-Z0-9-]+)/i);
  const invoiceNumber = invoiceMatch ? invoiceMatch[1] : 'NO_INV';
  
  return {
    vendor: sanitizeFileName(vendor),
    date: Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyyMMdd'),
    invoiceNumber: sanitizeFileName(invoiceNumber),
    originalName: attachment.getName(),
    subject: subject,
    from: from,
    emailDate: date
  };
}

/**
 * Generate DATEV-compliant file name
 * Format: VENDOR_YYYYMMDD_INVOICENUMBER.pdf
 */
function generateDATEVFileName(metadata) {
  return `${metadata.vendor}_${metadata.date}_${metadata.invoiceNumber}.pdf`;
}

/**
 * Sanitize string for use in filename
 */
function sanitizeFileName(str) {
  return str
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 50); // Limit length
}

/**
 * Trigger webhook to Playwright server
 */
function triggerWebhook(file, metadata) {
  const payload = {
    fileId: file.getId(),
    fileName: file.getName(),
    metadata: metadata,
    timestamp: new Date().toISOString()
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    headers: {
      'Authorization': `Bearer ${CONFIG.WEBHOOK_SECRET}`
    },
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(CONFIG.WEBHOOK_URL, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode === 200) {
      console.log('Webhook triggered successfully');
    } else {
      console.error(`Webhook failed with status ${responseCode}: ${response.getContentText()}`);
    }
    
  } catch (error) {
    console.error('Error triggering webhook:', error);
    throw error;
  }
}

/**
 * Check if message has been processed
 */
function isMessageProcessed(messageId) {
  const properties = PropertiesService.getScriptProperties();
  return properties.getProperty(`processed_${messageId}`) !== null;
}

/**
 * Mark message as processed
 */
function markMessageAsProcessed(messageId) {
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty(`processed_${messageId}`, new Date().toISOString());
  
  // Apply processed label if it exists
  try {
    const label = GmailApp.getUserLabelByName(CONFIG.PROCESSED_LABEL) || 
                  GmailApp.createLabel(CONFIG.PROCESSED_LABEL);
    const message = GmailApp.getMessageById(messageId);
    const thread = message.getThread();
    thread.addLabel(label);
  } catch (error) {
    console.warn('Could not apply label:', error);
  }
}

/**
 * Log processing status to Google Sheet
 */
function logToSheet(message, attachment, status, errorMsg = '', fileId = '') {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.TRACKING_SHEET_ID)
                                .getActiveSheet();
    
    sheet.appendRow([
      new Date(),
      message.getSubject(),
      message.getFrom(),
      attachment.getName(),
      fileId,
      status,
      errorMsg
    ]);
    
  } catch (error) {
    console.error('Error logging to sheet:', error);
  }
}

/**
 * Webhook endpoint for status updates from Playwright server
 */
function doPost(e) {
  try {
    // Verify webhook secret
    const authHeader = e.parameter.authorization || e.postData?.headers?.Authorization;
    if (!authHeader || !authHeader.includes(CONFIG.WEBHOOK_SECRET)) {
      return ContentService.createTextOutput(JSON.stringify({
        error: 'Unauthorized'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = JSON.parse(e.postData.contents);
    
    // Handle upload success
    if (data.status === 'SUCCESS') {
      handleUploadSuccess(data.fileId);
    } else if (data.status === 'FAILED') {
      handleUploadFailure(data.fileId, data.error);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Error in webhook handler:', error);
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle successful upload
 */
function handleUploadSuccess(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    const uploadedFolder = DriveApp.getFolderById(CONFIG.FOLDER_UPLOADED);
    const incomingFolder = DriveApp.getFolderById(CONFIG.FOLDER_INCOMING);
    
    // Move file to uploaded folder
    file.moveTo(uploadedFolder);
    
    // Update tracking sheet
    updateSheetStatus(fileId, 'UPLOADED');
    
    console.log(`File ${fileId} moved to uploaded folder`);
    
  } catch (error) {
    console.error('Error handling upload success:', error);
  }
}

/**
 * Handle failed upload
 */
function handleUploadFailure(fileId, errorMsg) {
  try {
    const file = DriveApp.getFileById(fileId);
    const failedFolder = DriveApp.getFolderById(CONFIG.FOLDER_FAILED);
    
    // Move file to failed folder
    file.moveTo(failedFolder);
    
    // Update tracking sheet
    updateSheetStatus(fileId, 'FAILED', errorMsg);
    
    console.log(`File ${fileId} moved to failed folder`);
    
  } catch (error) {
    console.error('Error handling upload failure:', error);
  }
}

/**
 * Update status in tracking sheet
 */
function updateSheetStatus(fileId, status, errorMsg = '') {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.TRACKING_SHEET_ID)
                                .getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // Find row with matching fileId (column 5)
    for (let i = 1; i < data.length; i++) {
      if (data[i][4] === fileId) {
        sheet.getRange(i + 1, 6).setValue(status);
        sheet.getRange(i + 1, 7).setValue(errorMsg);
        sheet.getRange(i + 1, 8).setValue(new Date());
        break;
      }
    }
    
  } catch (error) {
    console.error('Error updating sheet status:', error);
  }
}

/**
 * Send error notification email
 */
function sendErrorNotification(error) {
  const recipient = Session.getActiveUser().getEmail();
  const subject = 'DATEV Automation Error';
  const body = `An error occurred in the DATEV invoice automation:\n\n${error}\n\nTime: ${new Date()}`;
  
  try {
    GmailApp.sendEmail(recipient, subject, body);
  } catch (e) {
    console.error('Could not send error notification:', e);
  }
}

/**
 * Setup function - Run once to initialize
 */
function setupTracking() {
  // Create tracking sheet if it doesn't exist
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.TRACKING_SHEET_ID)
                                .getActiveSheet();
    
    // Add headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp',
        'Email Subject',
        'From',
        'File Name',
        'Drive File ID',
        'Status',
        'Error',
        'Updated'
      ]);
      
      // Format header row
      sheet.getRange(1, 1, 1, 8)
           .setFontWeight('bold')
           .setBackground('#4285f4')
           .setFontColor('#ffffff');
    }
    
    console.log('Tracking sheet initialized');
    
  } catch (error) {
    console.error('Error setting up tracking sheet:', error);
  }
  
  // Create Gmail labels if they don't exist
  try {
    GmailApp.getUserLabelByName(CONFIG.PROCESSED_LABEL) || 
    GmailApp.createLabel(CONFIG.PROCESSED_LABEL);
    console.log('Gmail labels created');
  } catch (error) {
    console.error('Error creating labels:', error);
  }
}

/**
 * Test function - Use to verify configuration
 */
function testConfiguration() {
  console.log('Testing configuration...');
  
  // Test folder access
  try {
    DriveApp.getFolderById(CONFIG.FOLDER_INCOMING);
    console.log('✓ Incoming folder accessible');
  } catch (e) {
    console.error('✗ Cannot access incoming folder:', e);
  }
  
  try {
    DriveApp.getFolderById(CONFIG.FOLDER_UPLOADED);
    console.log('✓ Uploaded folder accessible');
  } catch (e) {
    console.error('✗ Cannot access uploaded folder:', e);
  }
  
  try {
    DriveApp.getFolderById(CONFIG.FOLDER_FAILED);
    console.log('✓ Failed folder accessible');
  } catch (e) {
    console.error('✗ Cannot access failed folder:', e);
  }
  
  // Test sheet access
  try {
    SpreadsheetApp.openById(CONFIG.TRACKING_SHEET_ID);
    console.log('✓ Tracking sheet accessible');
  } catch (e) {
    console.error('✗ Cannot access tracking sheet:', e);
  }
  
  // Test Gmail search
  try {
    const threads = GmailApp.search(CONFIG.GMAIL_SEARCH, 0, 1);
    console.log(`✓ Gmail search working (${threads.length} threads found)`);
  } catch (e) {
    console.error('✗ Gmail search failed:', e);
  }
  
  console.log('Configuration test complete');
}
