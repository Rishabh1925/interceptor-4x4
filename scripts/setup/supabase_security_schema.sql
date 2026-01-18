-- ============================================================================
-- INTERCEPTOR SECURITY SCHEMA
-- Encrypted storage for video evidence and user data
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. USERS TABLE (with hashed passwords)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- Hashed with bcrypt, never plain text
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'analyst', -- analyst, investigator, admin
  organization VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- 2. VIDEO EVIDENCE TABLE (with encrypted links)
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_email VARCHAR(255),
  
  -- File information
  filename VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  file_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for integrity verification
  mime_type VARCHAR(100),
  
  -- Encrypted Cloudinary link (format: iv:authTag:encryptedData)
  encrypted_link TEXT NOT NULL,
  
  -- Cloudinary metadata (for reference, not sensitive)
  cloudinary_public_id VARCHAR(255),
  cloudinary_version INTEGER,
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'uploaded', -- uploaded, analyzing, completed, failed
  analysis_status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
  
  -- Analysis results (can be encrypted if needed)
  analysis_result JSONB,
  prediction VARCHAR(50), -- 'real' or 'fake'
  confidence DECIMAL(5, 4),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  analysis_timestamp TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster queries
CREATE INDEX idx_video_evidence_case_id ON video_evidence(case_id);
CREATE INDEX idx_video_evidence_user_id ON video_evidence(user_id);
CREATE INDEX idx_video_evidence_status ON video_evidence(status);
CREATE INDEX idx_video_evidence_analysis_status ON video_evidence(analysis_status);
CREATE INDEX idx_video_evidence_created_at ON video_evidence(created_at DESC);

-- ============================================================================
-- 3. VIDEO ACCESS LOGS TABLE (audit trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  
  -- Access information
  action VARCHAR(100) NOT NULL, -- 'video_retrieved', 'video_downloaded', 'analysis_viewed'
  ip_address VARCHAR(45), -- IPv4 or IPv6
  user_agent TEXT,
  
  -- Timestamp
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for audit queries
CREATE INDEX idx_access_logs_case_id ON video_access_logs(case_id);
CREATE INDEX idx_access_logs_user_id ON video_access_logs(user_id);
CREATE INDEX idx_access_logs_timestamp ON video_access_logs(timestamp DESC);
CREATE INDEX idx_access_logs_action ON video_access_logs(action);

-- ============================================================================
-- 4. FORENSIC ANALYSIS RESULTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS forensic_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id VARCHAR(255) NOT NULL UNIQUE REFERENCES video_evidence(case_id),
  
  -- Analysis metadata
  analysis_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  analyst_id UUID REFERENCES users(id),
  
  -- Detection results
  prediction VARCHAR(50) NOT NULL, -- 'authentic' or 'manipulated'
  confidence DECIMAL(5, 4) NOT NULL,
  
  -- Detailed analysis
  preprocessing_results JSONB, -- Results from 3 preprocessing agents
  core_model_results JSONB, -- E-Raksha model results
  postprocessing_results JSONB, -- Results from 3 postprocessing agents
  
  -- Forensic certificate
  forensic_certificate TEXT, -- Legal-admissible report
  
  -- Chain of custody
  chain_of_custody JSONB DEFAULT '{}',
  
  -- Legal admissibility
  legal_admissibility VARCHAR(50), -- 'admissible', 'conditional', 'inadmissible'
  expert_recommendation TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_forensic_analysis_case_id ON forensic_analysis(case_id);
CREATE INDEX idx_forensic_analysis_analyst_id ON forensic_analysis(analyst_id);
CREATE INDEX idx_forensic_analysis_prediction ON forensic_analysis(prediction);
CREATE INDEX idx_forensic_analysis_created_at ON forensic_analysis(created_at DESC);

-- ============================================================================
-- 5. ENCRYPTION KEYS TABLE (for key rotation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS encryption_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_version INTEGER NOT NULL UNIQUE,
  key_hash VARCHAR(64) NOT NULL, -- Hash of the key for verification
  algorithm VARCHAR(50) DEFAULT 'aes-256-gcm',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  rotated_at TIMESTAMP,
  expires_at TIMESTAMP
);

-- Index for active key lookup
CREATE INDEX idx_encryption_keys_active ON encryption_keys(is_active);

-- ============================================================================
-- 6. SECURITY POLICIES (Row Level Security)
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE forensic_analysis ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_select_policy ON users
  FOR SELECT USING (auth.uid()::text = id::text OR role = 'admin');

-- Users can only see their own video evidence
CREATE POLICY video_evidence_select_policy ON video_evidence
  FOR SELECT USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Users can only see their own access logs
CREATE POLICY access_logs_select_policy ON video_access_logs
  FOR SELECT USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- ============================================================================
-- 7. VIEWS FOR SAFE DATA ACCESS
-- ============================================================================

-- View for video evidence without encrypted links
CREATE OR REPLACE VIEW video_evidence_safe AS
SELECT
  id,
  case_id,
  user_id,
  user_email,
  filename,
  file_size,
  file_hash,
  mime_type,
  status,
  analysis_status,
  prediction,
  confidence,
  upload_timestamp,
  analysis_timestamp,
  created_at,
  updated_at
FROM video_evidence;

-- View for forensic analysis summary
CREATE OR REPLACE VIEW forensic_analysis_summary AS
SELECT
  id,
  case_id,
  analysis_timestamp,
  prediction,
  confidence,
  legal_admissibility,
  expert_recommendation,
  created_at
FROM forensic_analysis;

-- ============================================================================
-- 8. FUNCTIONS FOR SECURITY OPERATIONS
-- ============================================================================

-- Function to log video access
CREATE OR REPLACE FUNCTION log_video_access(
  p_case_id VARCHAR,
  p_user_email VARCHAR,
  p_action VARCHAR,
  p_ip_address VARCHAR DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO video_access_logs (case_id, user_email, action, ip_address)
  VALUES (p_case_id, p_user_email, p_action, p_ip_address);
END;
$$ LANGUAGE plpgsql;

-- Function to update video analysis status
CREATE OR REPLACE FUNCTION update_video_analysis(
  p_case_id VARCHAR,
  p_status VARCHAR,
  p_prediction VARCHAR,
  p_confidence DECIMAL,
  p_analysis_result JSONB
)
RETURNS void AS $$
BEGIN
  UPDATE video_evidence
  SET
    status = p_status,
    analysis_status = 'completed',
    prediction = p_prediction,
    confidence = p_confidence,
    analysis_result = p_analysis_result,
    analysis_timestamp = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
  WHERE case_id = p_case_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts with hashed passwords (bcrypt)';
COMMENT ON TABLE video_evidence IS 'Video evidence with encrypted Cloudinary links (AES-256-GCM)';
COMMENT ON TABLE video_access_logs IS 'Audit trail of all video access for legal compliance';
COMMENT ON TABLE forensic_analysis IS 'Complete forensic analysis results and legal certificates';
COMMENT ON COLUMN video_evidence.encrypted_link IS 'Encrypted Cloudinary URL (format: iv:authTag:encryptedData)';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password - never store plain text';

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================
-- 1. Passwords are hashed with bcrypt (one-way) - cannot be decrypted
-- 2. Video links are encrypted with AES-256-GCM (two-way) - can be decrypted by backend only
-- 3. All access is logged for audit trail
-- 4. Row Level Security (RLS) ensures users only see their own data
-- 5. Encryption keys should be rotated regularly
-- 6. Database backups should be encrypted
-- 7. Access logs should be retained for legal compliance
