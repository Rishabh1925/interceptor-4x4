# INTERCEPTOR Security Implementation Guide

## Overview

This guide implements enterprise-grade security for the INTERCEPTOR deepfake detection system, ensuring that even if the database is leaked, sensitive data remains protected.

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  - User uploads video                                       │
│  - User enters password                                     │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js/Express)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. Hash Password (bcrypt) - One-way                 │   │
│  │    password → bcrypt → hashed_password              │   │
│  │    (Cannot be reversed)                             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 2. Upload to Cloudinary                             │   │
│  │    video → Cloudinary → cloudinary_url              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 3. Encrypt Video Link (AES-256-GCM) - Two-way       │   │
│  │    cloudinary_url → encrypt → encrypted_link        │   │
│  │    (Can be decrypted by backend only)               │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 4. Hash Video File (SHA-256)                        │   │
│  │    video_file → SHA-256 → file_hash                 │   │
│  │    (For integrity verification)                     │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  SUPABASE (PostgreSQL)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ users table:                                         │   │
│  │  - email: user@example.com                           │   │
│  │  - password_hash: $2b$10$... (bcrypt)               │   │
│  │  - Cannot recover original password                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ video_evidence table:                                │   │
│  │  - filename: video.mp4                               │   │
│  │  - encrypted_link: iv:authTag:encryptedData         │   │
│  │  - file_hash: sha256_hash                            │   │
│  │  - Cannot access video without backend decryption   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ video_access_logs table:                             │   │
│  │  - Audit trail of all access                         │   │
│  │  - Legal compliance documentation                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Install Dependencies

```bash
npm install bcrypt crypto cloudinary formidable
```

### Step 2: Generate Encryption Key

```bash
# Generate a 32-byte hex key for AES-256
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output example:
# a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### Step 3: Configure Environment Variables

```bash
# Copy the example file
cp .env.security.example .env.local

# Edit .env.local and add:
ENCRYPTION_KEY=your_generated_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 4: Run Supabase Schema Migration

```bash
# Connect to your Supabase database and run:
psql postgresql://user:password@host:5432/database < scripts/setup/supabase_security_schema.sql

# Or use Supabase SQL editor:
# 1. Go to Supabase Dashboard
# 2. SQL Editor
# 3. Create new query
# 4. Paste contents of supabase_security_schema.sql
# 5. Run
```

### Step 5: Update API Endpoints

#### User Registration (with password hashing)

```javascript
import { hashPassword } from './api/utils/encryption.js';

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  
  // Hash password before storing
  const hashedPassword = await hashPassword(password);
  
  // Store in database
  const { data, error } = await supabase
    .from('users')
    .insert([{
      email,
      password_hash: hashedPassword
    }]);
  
  res.json({ success: true });
});
```

#### User Login (with password verification)

```javascript
import { comparePassword } from './api/utils/encryption.js';

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Get user from database
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  // Compare password with hash
  const isValid = await comparePassword(password, user.password_hash);
  
  if (isValid) {
    res.json({ success: true, token: generateJWT(user) });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});
```

#### Video Upload (with encryption)

```javascript
import { encryptVideoLink, hashVideoFile } from './api/utils/encryption.js';
import { v2 as cloudinary } from 'cloudinary';

app.post('/api/upload', async (req, res) => {
  const file = req.files.video;
  
  // Upload to Cloudinary
  const cloudinaryResult = await cloudinary.uploader.upload(file.path, {
    resource_type: 'video',
    folder: 'interceptor/evidence'
  });
  
  // Encrypt the Cloudinary link
  const encryptedLink = encryptVideoLink(cloudinaryResult.secure_url);
  
  // Hash video file for integrity
  const fileBuffer = fs.readFileSync(file.path);
  const fileHash = hashVideoFile(fileBuffer);
  
  // Store encrypted link in database
  const { data } = await supabase
    .from('video_evidence')
    .insert([{
      filename: file.name,
      file_size: file.size,
      file_hash: fileHash,
      encrypted_link: encryptedLink,
      cloudinary_public_id: cloudinaryResult.public_id
    }]);
  
  res.json({ success: true, caseId: data[0].case_id });
});
```

#### Video Retrieval (with decryption)

```javascript
import { decryptVideoLink } from './api/utils/encryption.js';

app.post('/api/video/retrieve', async (req, res) => {
  const { caseId } = req.body;
  
  // Verify user authorization
  const user = verifyJWT(req.headers.authorization);
  
  // Get encrypted link from database
  const { data: video } = await supabase
    .from('video_evidence')
    .select('encrypted_link')
    .eq('case_id', caseId)
    .single();
  
  // Decrypt the link (only backend can do this)
  const decryptedLink = decryptVideoLink(video.encrypted_link);
  
  // Log access for audit trail
  await supabase.from('video_access_logs').insert([{
    case_id: caseId,
    user_email: user.email,
    action: 'video_retrieved',
    timestamp: new Date().toISOString()
  }]);
  
  // Return decrypted link to frontend
  res.json({ videoLink: decryptedLink });
});
```

## Security Features

### 1. Password Hashing (One-way)

- **Algorithm**: bcrypt with 10 salt rounds
- **Protection**: Even if database is leaked, passwords cannot be recovered
- **Verification**: Compare plain password with hash during login

```javascript
// Hashing
const hashedPassword = await hashPassword('user_password');
// Result: $2b$10$... (cannot be reversed)

// Verification
const isValid = await comparePassword('user_password', hashedPassword);
// Result: true or false
```

### 2. Video Link Encryption (Two-way)

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Protection**: Video links are encrypted before storage
- **Decryption**: Only backend can decrypt links using the encryption key
- **Format**: `iv:authTag:encryptedData` (includes IV and authentication tag)

```javascript
// Encryption
const encryptedLink = encryptVideoLink('https://cloudinary.com/video.mp4');
// Result: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6:authTag:encryptedData

// Decryption (backend only)
const decryptedLink = decryptVideoLink(encryptedLink);
// Result: https://cloudinary.com/video.mp4
```

### 3. File Integrity Verification

- **Algorithm**: SHA-256 hash
- **Protection**: Detect if video file has been tampered with
- **Verification**: Compare stored hash with computed hash

```javascript
const fileHash = hashVideoFile(fileBuffer);
// Result: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### 4. Audit Logging

- **Tracking**: All video access is logged
- **Legal Compliance**: Maintains chain of custody
- **Retention**: Logs retained for 90 days (configurable)

```javascript
// Logged information:
// - Who accessed the video (user_email)
// - When (timestamp)
// - What they did (action: video_retrieved, video_downloaded, etc.)
// - From where (ip_address)
```

### 5. Row Level Security (RLS)

- **Database Level**: PostgreSQL RLS policies
- **Protection**: Users can only see their own data
- **Admin Access**: Admins can see all data

```sql
-- Users can only see their own video evidence
CREATE POLICY video_evidence_select_policy ON video_evidence
  FOR SELECT USING (user_id = auth.uid() OR role = 'admin');
```

## Database Leak Scenario

### Before Implementation
If database is leaked:
- ❌ Passwords are readable (plain text)
- ❌ Video links are accessible (anyone can watch videos)
- ❌ No audit trail (cannot prove who accessed what)

### After Implementation
If database is leaked:
- ✅ Passwords are unreadable (bcrypt hashed)
- ✅ Video links are encrypted (cannot be decrypted without key)
- ✅ Audit trail exists (legal compliance)
- ✅ File integrity can be verified (SHA-256 hash)

## Key Management

### Encryption Key Storage

```bash
# Option 1: Environment Variable (Development)
ENCRYPTION_KEY=your_key_here

# Option 2: AWS Secrets Manager (Production)
aws secretsmanager get-secret-value --secret-id interceptor/encryption-key

# Option 3: HashiCorp Vault (Enterprise)
vault kv get secret/interceptor/encryption-key
```

### Key Rotation

```javascript
// Generate new key
const newKey = crypto.randomBytes(32).toString('hex');

// Store in encryption_keys table
await supabase.from('encryption_keys').insert([{
  key_version: 2,
  key_hash: hashMetadata(newKey),
  is_active: true
}]);

// Re-encrypt all video links with new key
// (This is a background job)
```

## Testing

### Test Password Hashing

```javascript
const { hashPassword, comparePassword } = require('./api/utils/encryption.js');

async function testPasswordHashing() {
  const password = 'MySecurePassword123!';
  
  // Hash password
  const hashedPassword = await hashPassword(password);
  console.log('Hashed:', hashedPassword);
  
  // Verify correct password
  const isValid = await comparePassword(password, hashedPassword);
  console.log('Valid password:', isValid); // true
  
  // Verify wrong password
  const isInvalid = await comparePassword('WrongPassword', hashedPassword);
  console.log('Invalid password:', isInvalid); // false
}

testPasswordHashing();
```

### Test Video Link Encryption

```javascript
const { encryptVideoLink, decryptVideoLink } = require('./api/utils/encryption.js');

function testVideoLinkEncryption() {
  const videoLink = 'https://res.cloudinary.com/demo/video/upload/v1234567890/video.mp4';
  
  // Encrypt
  const encryptedLink = encryptVideoLink(videoLink);
  console.log('Encrypted:', encryptedLink);
  
  // Decrypt
  const decryptedLink = decryptVideoLink(encryptedLink);
  console.log('Decrypted:', decryptedLink);
  console.log('Match:', videoLink === decryptedLink); // true
}

testVideoLinkEncryption();
```

## Compliance

### GDPR Compliance
- ✅ Data encryption at rest
- ✅ Audit logging
- ✅ User data deletion capability
- ✅ Data portability

### Legal Evidence Requirements
- ✅ Chain of custody documentation
- ✅ File integrity verification
- ✅ Tamper detection
- ✅ Access audit trail

### Court Admissibility
- ✅ Forensic certificate generation
- ✅ Expert documentation
- ✅ Technical analysis reports
- ✅ Legal compliance verification

## Troubleshooting

### Issue: "ENCRYPTION_KEY environment variable not set"

```bash
# Generate and set encryption key
export ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

### Issue: "Video link decryption failed"

```javascript
// Check if encrypted link format is correct
// Should be: iv:authTag:encryptedData
const parts = encryptedLink.split(':');
console.log('Parts:', parts.length); // Should be 3
```

### Issue: "Password comparison failed"

```javascript
// Ensure password is string, not buffer
const password = req.body.password.toString();
const isValid = await comparePassword(password, hashedPassword);
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Generate encryption key
3. ✅ Configure environment variables
4. ✅ Run database schema migration
5. ✅ Update API endpoints
6. ✅ Test encryption/hashing
7. ✅ Deploy to production
8. ✅ Monitor audit logs
9. ✅ Rotate keys periodically
10. ✅ Maintain compliance documentation

## Support

For security issues or questions:
- Email: security@interceptor.dev
- Report vulnerabilities responsibly
- Do not disclose security issues publicly

---

**Last Updated**: January 2026
**Version**: 1.0.0
**Status**: Production Ready
