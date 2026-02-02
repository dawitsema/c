# Security Best Practices

## Credential Management

### DO NOT
- ❌ Commit credentials to git
- ❌ Share .env files
- ❌ Store passwords in Apps Script
- ❌ Use weak webhook secrets
- ❌ Share service account keys publicly

### DO
- ✅ Use environment variables for secrets
- ✅ Generate strong random webhook secrets
- ✅ Rotate credentials regularly
- ✅ Use service accounts with minimal permissions
- ✅ Enable 2FA on all accounts

## API Security

### Webhook Authentication
- Always verify webhook secret
- Use HTTPS only
- Implement rate limiting
- Log suspicious requests

### Service Account
- Grant read-only access to Drive
- Only share specific folders
- Monitor usage in Google Cloud Console
- Rotate keys every 90 days

## Network Security

### Server
- Use HTTPS with valid SSL certificate
- Enable firewall rules
- Restrict incoming connections to known IPs if possible
- Keep server software updated

### DATEV
- Never expose credentials in logs
- Store session state securely
- Use trusted device feature
- Monitor for unusual login activity

## Code Security

### Dependencies
- Run `npm audit` regularly
- Update dependencies monthly
- Review security advisories
- Use `npm ci` in production

### Error Handling
- Never expose credentials in error messages
- Sanitize logs before sharing
- Don't log sensitive data
- Use generic error messages for users

## Data Security

### Files
- Delete temp files after processing
- Don't store PDFs long-term on server
- Use encrypted storage if persisting data
- Clean up old files regularly

### Logs
- Don't log file contents
- Sanitize email addresses if logging
- Rotate logs regularly
- Secure log access

## Monitoring

### Watch For
- Failed login attempts
- Unusual upload patterns
- Repeated webhook failures
- Service account access errors
- Large file uploads

### Alerts
- Set up email alerts for failures
- Monitor server resource usage
- Track API quota usage
- Review security logs weekly

## Compliance

### GDPR/Data Protection
- Document data flows
- Implement data retention policy
- Provide data deletion mechanism
- Get user consent where required

### Business
- Follow company security policies
- Document security procedures
- Train users on security practices
- Regular security audits

## Incident Response

### If Credentials Compromised
1. Immediately change all affected passwords
2. Rotate webhook secrets
3. Generate new service account key
4. Review logs for unauthorized access
5. Notify affected parties if required

### If Server Compromised
1. Shut down server immediately
2. Review logs for breach extent
3. Restore from clean backup
4. Update all credentials
5. Patch vulnerabilities before restarting

## Checklist

### Initial Setup
- [ ] Strong passwords on all accounts
- [ ] 2FA enabled on Google and DATEV
- [ ] Webhook secret generated randomly
- [ ] Service account permissions minimal
- [ ] .env not committed to git
- [ ] .gitignore includes credential files
- [ ] HTTPS configured for webhooks
- [ ] Firewall rules in place

### Regular Maintenance
- [ ] Update dependencies (monthly)
- [ ] Rotate credentials (quarterly)
- [ ] Review logs (weekly)
- [ ] Check for security advisories (weekly)
- [ ] Test backup restoration (quarterly)
- [ ] Review access permissions (quarterly)

### Before Sharing Code
- [ ] Remove all credentials from code
- [ ] Sanitize example configurations
- [ ] Remove real folder/sheet IDs
- [ ] Check git history for secrets
- [ ] Review .gitignore completeness
