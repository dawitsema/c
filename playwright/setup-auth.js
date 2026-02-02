/**
 * Setup Authentication for DATEV
 * 
 * Run this script once to manually login to DATEV.
 * The browser session will be saved for future automated uploads.
 * 
 * Usage: node setup-auth.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const DATEV_URL = process.env.DATEV_URL || 'https://unternehmen-online.datev.de';
const STATE_DIR = path.join(__dirname, '.auth');
const STATE_FILE = path.join(STATE_DIR, 'datev-state.json');

async function setupAuth() {
  console.log('=== DATEV Authentication Setup ===\n');
  console.log('This will open a browser for you to login to DATEV.');
  console.log('After logging in and trusting the device, close the browser.');
  console.log('Your session will be saved for automated uploads.\n');
  
  // Ensure state directory exists
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
  
  // Launch browser in headed mode
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });
  
  const context = await browser.newContext({
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin'
  });
  
  const page = await context.newPage();
  
  console.log(`Opening ${DATEV_URL}...`);
  await page.goto(DATEV_URL);
  
  console.log('\nPlease complete the following steps in the browser:');
  console.log('1. Login with your DATEV credentials');
  console.log('2. Complete 2FA if required');
  console.log('3. Trust this device if prompted');
  console.log('4. Wait until you see the DATEV dashboard');
  console.log('5. Close the browser window\n');
  
  // Wait for user to close the browser
  await new Promise((resolve) => {
    browser.on('disconnected', resolve);
  });
  
  // Save the context state
  await context.storageState({ path: STATE_FILE });
  
  console.log('\n✓ Authentication saved successfully!');
  console.log(`Session state saved to: ${STATE_FILE}`);
  console.log('\nYou can now run automated uploads.');
  console.log('If login fails in the future, run this script again.\n');
  
  process.exit(0);
}

setupAuth().catch(error => {
  console.error('Error during setup:', error);
  process.exit(1);
});
