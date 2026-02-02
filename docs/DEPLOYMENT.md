# Deployment Guide

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. Set up DATEV authentication:
   ```bash
   node playwright/setup-auth.js
   ```

4. Start server:
   ```bash
   npm start
   ```

## Production Deployment Options

### Cloud Run (Google Cloud)
### VPS/Server

See full documentation for deployment steps.
