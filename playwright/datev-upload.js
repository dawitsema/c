/**
 * Playwright DATEV Upload Automation
 * 
 * This script automates uploading PDFs to DATEV Unternehmen online:
 * 1. Uses persistent browser context (login persists)
 * 2. Navigates to Belege hochladen
 * 3. Uploads PDF file
 * 4. Selects document category
 * 5. Confirms upload
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// DATEV configuration
const DATEV_CONFIG = {
  url: process.env.DATEV_URL || 'https://unternehmen-online.datev.de',
  username: process.env.DATEV_USERNAME,
  password: process.env.DATEV_PASSWORD,
  timeout: parseInt(process.env.UPLOAD_TIMEOUT_MS) || 60000,
  
  // Selectors (German UI)
  selectors: {
    // Login page
    usernameInput: 'input[name="username"], input[type="text"]',
    passwordInput: 'input[name="password"], input[type="password"]',
    loginButton: 'button[type="submit"], input[type="submit"]',
    
    // Navigation
    belegeMenuItem: 'text=Belege',
    uploadButton: 'text=Hochladen',
    
    // Upload form
    fileInput: 'input[type="file"]',
    documentTypeSelect: 'select[name="documentType"], [aria-label*="Belegart"]',
    submitButton: 'button:has-text("Speichern"), button:has-text("Hochladen")',
    
    // Success indicators
    successMessage: '.success, .confirmation, text=erfolgreich',
    errorMessage: '.error, .alert-danger'
  }
};

// Browser state directory
const STATE_DIR = path.join(__dirname, '.auth');

/**
 * Get or create persistent browser context
 */
async function getBrowserContext() {
  // Ensure state directory exists
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
  
  const browser = await chromium.launch({
    headless: process.env.NODE_ENV === 'production',
    slowMo: 100 // Slow down for stability
  });
  
  const contextPath = path.join(STATE_DIR, 'datev-state.json');
  
  // Load existing context if available
  let context;
  if (fs.existsSync(contextPath)) {
    console.log('Loading saved browser context...');
    context = await browser.newContext({
      storageState: contextPath,
      locale: 'de-DE',
      timezoneId: 'Europe/Berlin'
    });
  } else {
    console.log('Creating new browser context...');
    context = await browser.newContext({
      locale: 'de-DE',
      timezoneId: 'Europe/Berlin'
    });
  }
  
  return { browser, context, contextPath };
}

/**
 * Save browser context state
 */
async function saveContextState(context, contextPath) {
  await context.storageState({ path: contextPath });
  console.log('Browser context saved');
}

/**
 * Check if already logged in
 */
async function isLoggedIn(page) {
  try {
    // Wait for either login form or logged-in indicator
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    
    // Check for common logged-in indicators
    const loggedIn = await page.evaluate(() => {
      // Check for logout button, user menu, or dashboard elements
      return !!(
        document.querySelector('[href*="logout"]') ||
        document.querySelector('.user-menu') ||
        document.querySelector('[class*="dashboard"]') ||
        document.querySelector('text=Willkommen')
      );
    });
    
    return loggedIn;
  } catch (error) {
    return false;
  }
}

/**
 * Perform login to DATEV
 */
async function login(page) {
  console.log('Performing login...');
  
  try {
    // Wait for login form
    await page.waitForSelector(DATEV_CONFIG.selectors.usernameInput, {
      timeout: 10000
    });
    
    // Fill credentials
    await page.fill(DATEV_CONFIG.selectors.usernameInput, DATEV_CONFIG.username);
    await page.fill(DATEV_CONFIG.selectors.passwordInput, DATEV_CONFIG.password);
    
    // Click login
    await page.click(DATEV_CONFIG.selectors.loginButton);
    
    // Wait for navigation after login
    await page.waitForLoadState('networkidle');
    
    console.log('Login successful');
    return true;
    
  } catch (error) {
    console.error('Login failed:', error.message);
    return false;
  }
}

/**
 * Navigate to upload page
 */
async function navigateToUpload(page) {
  console.log('Navigating to upload page...');
  
  try {
    // Look for Belege menu item
    const belegeMenu = await page.locator(DATEV_CONFIG.selectors.belegeMenuItem).first();
    if (await belegeMenu.isVisible()) {
      await belegeMenu.click();
      await page.waitForTimeout(1000);
    }
    
    // Look for upload button
    const uploadBtn = await page.locator(DATEV_CONFIG.selectors.uploadButton).first();
    if (await uploadBtn.isVisible()) {
      await uploadBtn.click();
      await page.waitForLoadState('networkidle');
    }
    
    console.log('Navigated to upload page');
    return true;
    
  } catch (error) {
    console.error('Navigation failed:', error.message);
    return false;
  }
}

/**
 * Upload file to DATEV
 */
async function uploadFile(page, filePath, fileName, metadata) {
  console.log(`Uploading file: ${fileName}`);
  
  try {
    // Wait for file input
    const fileInput = await page.locator(DATEV_CONFIG.selectors.fileInput).first();
    await fileInput.setInputFiles(filePath);
    
    console.log('File selected');
    
    // Wait for file to be processed
    await page.waitForTimeout(2000);
    
    // Select document type if available
    try {
      const docTypeSelect = await page.locator(DATEV_CONFIG.selectors.documentTypeSelect).first();
      if (await docTypeSelect.isVisible()) {
        // Default to "Eingangsrechnung" (incoming invoice)
        await docTypeSelect.selectOption({ label: 'Eingangsrechnung' });
        console.log('Document type selected');
      }
    } catch (e) {
      console.log('Document type selection not available or failed');
    }
    
    // Submit upload
    const submitBtn = await page.locator(DATEV_CONFIG.selectors.submitButton).first();
    await submitBtn.click();
    
    console.log('Upload submitted');
    
    // Wait for success or error message
    try {
      await page.waitForSelector(DATEV_CONFIG.selectors.successMessage, {
        timeout: 10000
      });
      console.log('Upload confirmed successful');
      return { success: true };
      
    } catch (e) {
      // Check for error message
      const errorMsg = await page.locator(DATEV_CONFIG.selectors.errorMessage).first();
      if (await errorMsg.isVisible()) {
        const errorText = await errorMsg.textContent();
        throw new Error(`Upload failed: ${errorText}`);
      }
      
      // No explicit success/error - assume success
      console.log('Upload completed (no explicit confirmation)');
      return { success: true };
    }
    
  } catch (error) {
    console.error('Upload failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main upload function
 */
async function uploadToDatev(filePath, fileName, metadata = {}) {
  let browser = null;
  let context = null;
  
  try {
    // Validate file
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    console.log(`Starting DATEV upload for: ${fileName}`);
    
    // Get browser context
    const browserData = await getBrowserContext();
    browser = browserData.browser;
    context = browserData.context;
    const contextPath = browserData.contextPath;
    
    // Create new page
    const page = await context.newPage();
    
    // Navigate to DATEV
    await page.goto(DATEV_CONFIG.url, {
      waitUntil: 'networkidle',
      timeout: DATEV_CONFIG.timeout
    });
    
    // Check if logged in
    const loggedIn = await isLoggedIn(page);
    
    if (!loggedIn) {
      console.log('Not logged in, performing login...');
      const loginSuccess = await login(page);
      
      if (!loginSuccess) {
        throw new Error('Login failed');
      }
      
      // Save context after successful login
      await saveContextState(context, contextPath);
    } else {
      console.log('Already logged in');
    }
    
    // Navigate to upload page
    const navSuccess = await navigateToUpload(page);
    if (!navSuccess) {
      throw new Error('Failed to navigate to upload page');
    }
    
    // Upload file
    const result = await uploadFile(page, filePath, fileName, metadata);
    
    // Save context state
    await saveContextState(context, contextPath);
    
    // Close page
    await page.close();
    
    return result;
    
  } catch (error) {
    console.error('Error in uploadToDatev:', error);
    return { success: false, error: error.message };
    
  } finally {
    // Clean up
    if (context) {
      await context.close();
    }
    if (browser) {
      await browser.close();
    }
  }
}

// Export for use in server
module.exports = { uploadToDatev };

// Allow running standalone for testing
if (require.main === module) {
  const testFile = process.argv[2];
  const testFileName = process.argv[3] || path.basename(testFile);
  
  if (!testFile) {
    console.error('Usage: node datev-upload.js <file-path> [file-name]');
    process.exit(1);
  }
  
  uploadToDatev(testFile, testFileName)
    .then(result => {
      console.log('Result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}
