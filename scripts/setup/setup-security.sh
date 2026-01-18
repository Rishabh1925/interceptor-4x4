#!/bin/bash

# ============================================================================
# INTERCEPTOR Security Setup Script
# ============================================================================
# This script sets up encryption and security for INTERCEPTOR
# Run this after initial installation
# ============================================================================

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         INTERCEPTOR Security Setup                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Step 1: Generate Encryption Key
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Generating Encryption Key"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "Generated Encryption Key:"
echo "  $ENCRYPTION_KEY"
echo ""

# Step 2: Create .env.local if it doesn't exist
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Setting up Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -f .env.local ]; then
    echo "Creating .env.local from template..."
    cp .env.security.example .env.local
    echo "✅ Created .env.local"
else
    echo "⚠️  .env.local already exists, skipping creation"
fi

# Add encryption key to .env.local
if grep -q "ENCRYPTION_KEY=" .env.local; then
    # Replace existing key
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" .env.local
    else
        sed -i "s/ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" .env.local
    fi
    echo "✅ Updated ENCRYPTION_KEY in .env.local"
else
    # Add new key
    echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> .env.local
    echo "✅ Added ENCRYPTION_KEY to .env.local"
fi

echo ""
echo "⚠️  IMPORTANT: Edit .env.local and add your Cloudinary and Supabase credentials:"
echo "   - CLOUDINARY_CLOUD_NAME"
echo "   - CLOUDINARY_API_KEY"
echo "   - CLOUDINARY_API_SECRET"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo ""

# Step 3: Install dependencies
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Installing Security Dependencies"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm install bcrypt cloudinary formidable
echo "✅ Security dependencies installed"
echo ""

# Step 4: Display next steps
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Setup Complete! Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Edit .env.local with your credentials:"
echo "   nano .env.local"
echo ""
echo "2. Run Supabase schema migration:"
echo "   psql postgresql://user:password@host:5432/db < scripts/setup/supabase_security_schema.sql"
echo ""
echo "3. Or use Supabase SQL Editor:"
echo "   - Go to Supabase Dashboard"
echo "   - SQL Editor → New Query"
echo "   - Copy contents of scripts/setup/supabase_security_schema.sql"
echo "   - Run"
echo ""
echo "4. Start your application:"
echo "   npm run dev"
echo ""
echo "5. Read the security guide:"
echo "   cat SECURITY_IMPLEMENTATION_GUIDE.md"
echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  ✅ Security setup complete!                                  ║"
echo "║  Your encryption key has been generated and stored.           ║"
echo "║  Keep .env.local secure and never commit it to git.           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
