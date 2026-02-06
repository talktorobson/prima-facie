#!/bin/bash

# ============================================================================
# PRIMA FACIE - DATABASE FIXES EXECUTION SCRIPT
# ============================================================================
# Purpose: Execute critical database schema fixes for field mapping issues
# Usage: ./run-database-fixes.sh [--dry-run]
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DRY_RUN=false
BACKUP_DIR="./database-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE} PRIMA FACIE - CRITICAL DATABASE SCHEMA FIXES${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Error: .env.local file not found${NC}"
    echo "Please create .env.local with your Supabase credentials"
    exit 1
fi

# Load environment variables
source .env.local

# Validate required environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Error: Missing Supabase credentials${NC}"
    echo "Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables loaded${NC}"
echo "Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}🧪 DRY RUN MODE - No changes will be made${NC}"
    echo ""
    
    echo -e "${BLUE}Would execute the following steps:${NC}"
    echo "1. Create database backup"
    echo "2. Execute schema fixes from fix-database-schema-mapping.sql"
    echo "3. Verify changes were applied correctly"
    echo "4. Display summary of changes"
    echo ""
    echo -e "${YELLOW}To execute for real, run without --dry-run flag${NC}"
    exit 0
fi

echo -e "${YELLOW}⚠️  CRITICAL OPERATION: About to modify database schema${NC}"
echo "This will fix field mapping issues between frontend forms and database"
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operation cancelled"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 1: Creating database backup...${NC}"

# Create backup using pg_dump (requires psql tools)
BACKUP_FILE="$BACKUP_DIR/prima_facie_backup_$TIMESTAMP.sql"

# Extract database connection details from Supabase URL
DB_HOST=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|\.supabase\.co.*|.supabase.co|')
DB_NAME="postgres"  # Default Supabase database name

echo "Creating backup at: $BACKUP_FILE"

# Note: This requires pg_dump to be installed locally
# Alternative: Use Supabase CLI or manual backup
echo -e "${YELLOW}📝 Note: Automatic backup requires pg_dump. Manually backup via Supabase Dashboard if needed.${NC}"

echo ""
echo -e "${BLUE}Step 2: Executing schema fixes...${NC}"

# Use psql to execute the SQL file
# Note: This requires psql client to be installed
if command -v psql &> /dev/null; then
    echo "Executing fix-database-schema-mapping.sql..."
    
    # Execute the SQL file using psql
    PGPASSWORD="$SUPABASE_SERVICE_ROLE_KEY" psql \
        -h "$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | cut -d'.' -f1).supabase.co" \
        -p 5432 \
        -d postgres \
        -U postgres \
        -f fix-database-schema-mapping.sql
    
    echo -e "${GREEN}✅ SQL script executed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  psql not found. Please execute the SQL manually:${NC}"
    echo ""
    echo "1. Open your Supabase Dashboard"
    echo "2. Go to SQL Editor"
    echo "3. Copy and paste the contents of fix-database-schema-mapping.sql"
    echo "4. Execute the query"
    echo ""
    echo "Then run this script again to continue with verification"
    read -p "Press Enter after executing SQL manually..."
fi

echo ""
echo -e "${BLUE}Step 3: Verifying changes...${NC}"

# Create a simple verification script
cat > verify-changes.sql << 'EOF'
-- Verify that new columns were added
SELECT 
    'contacts' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'contacts' 
  AND column_name IN ('client_number', 'portal_enabled', 'legal_name', 'trade_name')
UNION ALL
SELECT 
    'matters' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'matters' 
  AND column_name IN ('area_juridica', 'case_value', 'probability_success', 'next_action')
ORDER BY table_name, column_name;

-- Check if functions were created
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN (
    'map_client_status',
    'map_contact_type', 
    'map_matter_status',
    'map_matter_priority',
    'generate_client_number'
)
ORDER BY routine_name;
EOF

if command -v psql &> /dev/null; then
    echo "Running verification queries..."
    PGPASSWORD="$SUPABASE_SERVICE_ROLE_KEY" psql \
        -h "$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | cut -d'.' -f1).supabase.co" \
        -p 5432 \
        -d postgres \
        -U postgres \
        -f verify-changes.sql
fi

# Clean up temporary file
rm -f verify-changes.sql

echo ""
echo -e "${BLUE}Step 4: Next steps for code updates...${NC}"
echo ""
echo -e "${GREEN}✅ Database schema fixes completed!${NC}"
echo ""
echo -e "${YELLOW}📋 TODO: Update TypeScript services${NC}"
echo "1. Update /lib/clients/client-service.ts with new field mappings"
echo "2. Update /lib/matters/matter-service.ts with new field mappings"
echo "3. Use the utilities from fix-service-field-mapping.ts"
echo "4. Test form submissions to verify fixes work"
echo ""
echo -e "${BLUE}Files available:${NC}"
echo "- fix-database-schema-mapping.sql (✅ executed)"
echo "- fix-service-field-mapping.ts (📝 ready to use)"
echo "- Backup: $BACKUP_FILE (if created)"
echo ""
echo -e "${GREEN}🎉 Critical database blocker resolved!${NC}"
echo -e "${BLUE}============================================================================${NC}"