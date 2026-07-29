# Production deployment & privacy checklist

BedsideRelay stores sensitive clinical handover information. Production use requires review and approval by hospital clinical leadership, IT, privacy, security, and legal teams under applicable local laws and hospital policy.

This checklist is **not** a compliance certification.

## Before go-live

- [ ] Rotate `SESSION_SECRET` to a long random value (≥ 32 characters)
- [ ] Set `NODE_ENV=production`
- [ ] Serve only over HTTPS; set secure cookies (`secure: true` already when production)
- [ ] Set `CLIENT_ORIGIN` to the exact browser origin (scheme + host + port, no trailing slash)
- [ ] Restrict MongoDB network access; enable auth on the database
- [ ] Change or disable all seed accounts; never deploy with default seed passwords
- [ ] Confirm hospital terminology in `shared/src/options.ts` (especially T/TT tube, urine field label)
- [ ] Confirm `APP_TIMEZONE` for display
- [ ] Review session max age and inactivity timeout with hospital policy
- [ ] Configure reverse proxy / TLS termination and trust proxy settings
- [ ] Disable public indexing (`noindex` headers/meta already present)
- [ ] Confirm backups and restore procedures for MongoDB
- [ ] Confirm audit log retention policy
- [ ] Train staff that the app does not replace clinical judgment or emergency procedures
- [ ] Verify no real patient data in non-production environments
- [ ] Penetration test and dependency vulnerability review
- [ ] Legal/privacy review of data retention, archival, and access logging

## Do not

- Do not place auth tokens in localStorage
- Do not add analytics, ads, chat widgets, external fonts, or third-party error tools that receive patient data
- Do not add a service worker that caches clinical records
- Do not claim HIPAA/GDPR compliance without formal assessment
- Do not log patient names, MR numbers, clinical values, passwords, or cookies
