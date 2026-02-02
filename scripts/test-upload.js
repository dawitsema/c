#!/usr/bin/env node

/**
 * Test script to verify server and Playwright setup
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('\n=== DATEV Upload Test Suite ===\n');
  
  // Test environment variables
  console.log('Checking environment variables...');
  const requiredVars = ['DATEV_USERNAME', 'DATEV_PASSWORD', 'WEBHOOK_SECRET'];
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`  ✓ ${varName} is set`);
    } else {
      console.log(`  ✗ ${varName} is missing`);
    }
  }
  
  console.log('\nTest complete. Run with actual upload to test Playwright.');
}

runTests();
