/**
 * Encryption Utility for INTERCEPTOR
 * 
 * Handles:
 * - Hashing: Passwords (one-way, using bcrypt)
 * - Encryption: Cloudinary video links (two-way, using crypto)
 * 
 * This ensures that even if the database is leaked:
 * - Passwords remain unreadable (hashed)
 * - Video links remain encrypted (can only be decrypted by backend)
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const SALT_ROUNDS = 10;

// Get encryption key from environment or generate one
// In production, store this securely in environment variables
const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable not set. Generate one using: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
  // Convert hex string to buffer
  return Buffer.from(key, 'hex');
};

/**
 * Hash a password using bcrypt (one-way)
 * Used for user authentication
 * 
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
}

/**
 * Compare plain password with hashed password
 * Used for login verification
 * 
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} - True if passwords match
 */
async function comparePassword(password, hashedPassword) {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    throw new Error(`Password comparison failed: ${error.message}`);
  }
}

/**
 * Encrypt a Cloudinary video link (two-way)
 * Used to store video links securely in database
 * 
 * @param {string} videoLink - Cloudinary video URL
 * @returns {string} - Encrypted link with IV and auth tag (format: iv:authTag:encryptedData)
 */
function encryptVideoLink(videoLink) {
  try {
    const key = getEncryptionKey();
    
    // Generate random IV (Initialization Vector)
    const iv = crypto.randomBytes(16);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    // Encrypt the video link
    let encrypted = cipher.update(videoLink, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag for GCM mode
    const authTag = cipher.getAuthTag();
    
    // Return combined: iv:authTag:encryptedData
    // This format allows us to decrypt later
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    throw new Error(`Video link encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt a Cloudinary video link (two-way)
 * Used to retrieve video links from database for playback
 * 
 * @param {string} encryptedLink - Encrypted link (format: iv:authTag:encryptedData)
 * @returns {string} - Decrypted Cloudinary video URL
 */
function decryptVideoLink(encryptedLink) {
  try {
    const key = getEncryptionKey();
    
    // Parse the encrypted link
    const parts = encryptedLink.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted link format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt the video link
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Video link decryption failed: ${error.message}`);
  }
}

/**
 * Hash a video file for integrity verification
 * Used to detect if a video has been tampered with
 * 
 * @param {Buffer} fileBuffer - Video file buffer
 * @returns {string} - SHA-256 hash of the file
 */
function hashVideoFile(fileBuffer) {
  try {
    return crypto
      .createHash('sha256')
      .update(fileBuffer)
      .digest('hex');
  } catch (error) {
    throw new Error(`Video file hashing failed: ${error.message}`);
  }
}

/**
 * Generate a secure random token
 * Used for session tokens, verification codes, etc.
 * 
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} - Random hex token
 */
function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash sensitive metadata for storage
 * Used for case IDs, evidence identifiers, etc.
 * 
 * @param {string} data - Data to hash
 * @returns {string} - SHA-256 hash
 */
function hashMetadata(data) {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

module.exports = {
  // Password hashing (one-way)
  hashPassword,
  comparePassword,
  
  // Video link encryption (two-way)
  encryptVideoLink,
  decryptVideoLink,
  
  // File and metadata hashing
  hashVideoFile,
  hashMetadata,
  
  // Utility functions
  generateSecureToken,
  getEncryptionKey,
};
