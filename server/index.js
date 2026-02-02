/**
 * Webhook Server
 * 
 * This Express server bridges Google Apps Script and Playwright:
 * 1. Receives webhook from Apps Script when new file is ready
 * 2. Downloads file from Google Drive
 * 3. Triggers Playwright to upload to DATEV
 * 4. Sends status callback to Apps Script
 */

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { uploadToDatev } = require('../playwright/datev-upload');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Google Drive authentication
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
  scopes: ['https://www.googleapis.com/auth/drive.readonly']
});

const drive = google.drive({ version: 'v3', auth });

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Webhook endpoint - receives upload requests from Apps Script
 */
app.post('/webhook/upload', async (req, res) => {
  try {
    // Verify authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.includes(process.env.WEBHOOK_SECRET)) {
      console.error('Unauthorized webhook request');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { fileId, fileName, metadata } = req.body;
    
    if (!fileId || !fileName) {
      return res.status(400).json({ error: 'Missing fileId or fileName' });
    }
    
    console.log(`Received upload request for file: ${fileName} (${fileId})`);
    
    // Acknowledge request immediately
    res.json({ success: true, message: 'Upload request received' });
    
    // Process upload asynchronously
    processUpload(fileId, fileName, metadata).catch(error => {
      console.error('Error processing upload:', error);
    });
    
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Process file upload to DATEV
 */
async function processUpload(fileId, fileName, metadata) {
  let tempFilePath = null;
  
  try {
    console.log(`Starting upload process for ${fileName}`);
    
    // Download file from Google Drive
    tempFilePath = await downloadFileFromDrive(fileId, fileName);
    console.log(`File downloaded to: ${tempFilePath}`);
    
    // Upload to DATEV using Playwright
    const result = await uploadToDatev(tempFilePath, fileName, metadata);
    
    if (result.success) {
      console.log(`Successfully uploaded ${fileName} to DATEV`);
      
      // Send success callback to Apps Script
      await sendStatusCallback(fileId, 'SUCCESS');
    } else {
      throw new Error(result.error || 'Upload failed');
    }
    
  } catch (error) {
    console.error(`Failed to upload ${fileName}:`, error);
    
    // Send failure callback to Apps Script
    await sendStatusCallback(fileId, 'FAILED', error.message);
    
  } finally {
    // Clean up temporary file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
      console.log(`Cleaned up temp file: ${tempFilePath}`);
    }
  }
}

/**
 * Download file from Google Drive
 */
async function downloadFileFromDrive(fileId, fileName) {
  const tempDir = path.join(__dirname, '../temp');
  
  // Create temp directory if it doesn't exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const filePath = path.join(tempDir, fileName);
  const dest = fs.createWriteStream(filePath);
  
  return new Promise((resolve, reject) => {
    drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    )
      .then(response => {
        response.data
          .on('end', () => {
            console.log(`Download completed: ${fileName}`);
            resolve(filePath);
          })
          .on('error', err => {
            console.error('Error downloading file:', err);
            reject(err);
          })
          .pipe(dest);
      })
      .catch(error => {
        reject(error);
      });
  });
}

/**
 * Send status callback to Apps Script
 */
async function sendStatusCallback(fileId, status, error = '') {
  const webhookUrl = process.env.APPS_SCRIPT_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('Apps Script webhook URL not configured');
    return;
  }
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.WEBHOOK_SECRET}`
      },
      body: JSON.stringify({
        fileId,
        status,
        error,
        timestamp: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      console.log(`Status callback sent: ${status}`);
    } else {
      console.error(`Failed to send status callback: ${response.status}`);
    }
    
  } catch (error) {
    console.error('Error sending status callback:', error);
  }
}

/**
 * Manual upload endpoint for testing
 */
app.post('/upload/manual', async (req, res) => {
  try {
    const { filePath, fileName } = req.body;
    
    if (!filePath || !fileName) {
      return res.status(400).json({ error: 'Missing filePath or fileName' });
    }
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    console.log(`Manual upload request for: ${fileName}`);
    
    const result = await uploadToDatev(filePath, fileName);
    
    res.json(result);
    
  } catch (error) {
    console.error('Error in manual upload:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Error handler
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
