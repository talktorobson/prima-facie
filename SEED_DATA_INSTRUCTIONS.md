# Prima Facie Seed Data Instructions

## Overview
This guide provides comprehensive seed data to enrich the Prima Facie Legal-as-a-Service platform with realistic test data for optimal user experience testing.

## Prerequisites
✅ **Database Migration Applied**: All core tables must exist before seeding
- Run `manual-migration-step1.sql` (Core tables)
- Run `manual-migration-step2.sql` (Supporting tables)
- Verify with: `node verify-migration.js`

## Seed Data Components

### 📋 Step 1: Core Data (`seed-data-step1-core.sql`)
**Creates foundational business data**

**What's Included:**
- **8 Matter Types**: Different legal specialties (Labor, Criminal, Family, Corporate, Tax, IP)
- **8 Realistic Clients**: Mix of individuals and companies with Brazilian compliance (CPF/CNPJ)
- **8 Legal Matters/Cases**: Active cases across different practice areas
- **8 Matter-Contact Relationships**: Client assignments to their cases
- **6 Tasks**: Realistic legal tasks with due dates and priorities

**Sample Data:**
```
Clients:
• Carlos Eduardo Silva (Individual) - Labor case, R$ 1,300 outstanding
• TechStart Soluções LTDA (Company) - Contract review, R$ 2,500 outstanding
• Indústria Brasileira SA (Company) - Corporate restructuring, R$ 5,000 outstanding

Legal Matters:
• Labor Action - Carlos Silva vs Company XYZ (Active, High Priority)
• Consensual Divorce - Mariana Santos (Closed, Successful)
• Criminal Defense - Roberto Lima (Active, Urgent)
• Corporate Restructuring - Industrial Brazilian SA (Active, High Value)
```

### 💰 Step 2: Billing System (`seed-data-step2-billing.sql`)
**Sets up subscription and billing configurations**

**What's Included:**
- **6 Subscription Plans**: Brazilian legal market focused plans
- **8 Case Types**: Billing configurations with minimum fees
- **4 Client Subscriptions**: Active and trial subscriptions
- **8 Case Billing Methods**: Multi-modal billing (hourly, fixed, percentage)
- **4 Discount Rules**: Subscription and loyalty discounts

**Sample Plans:**
```
Dávila Reis Advocacia:
• Trabalhista Básico: R$ 890/month (10h included)
• Trabalhista Premium: R$ 1,890/month (25h included) ⭐
• Empresarial Executivo: R$ 3,500/month (50h included) ⭐

Silva & Associados:
• Tributário Starter: R$ 1,200/month (15h included)
• Empresarial Completo: R$ 4,500/month (80h included) ⭐
• Propriedade Intelectual Pro: R$ 2,800/month (30h included) ⭐
```

### ⏱️ Step 3: Time Tracking & Invoices (`seed-data-step3-timetracking.sql`)
**Adds time entries and invoice data**

**What's Included:**
- **18 Time Entries**: Realistic billable hours across different matters
- **7 Invoices**: Complete lifecycle (paid, pending, overdue)
- **10+ Invoice Line Items**: Detailed billing breakdowns

**Sample Time Entries:**
```
• Analysis of labor case - 2.5h @ R$ 300/h = R$ 750
• Contract review meeting - 4h @ R$ 400/h = R$ 1,600
• Court hearing attendance - 2h @ R$ 500/h = R$ 1,000
• Corporate restructuring planning - 8h @ R$ 450/h = R$ 3,600
```

**Sample Invoices:**
```
• INV-2024-001: R$ 2,250 (PAID) - Labor case initial work
• INV-2024-002: R$ 1,787.50 (PAID) - Divorce proceedings
• INV-2024-003: R$ 1,540 (PARTIAL) - Collection action
• INV-2024-004: R$ 2,200 (PENDING) - Contract review
```

### 🏢 Step 4: Financial & Supporting Data (`seed-data-step4-financial.sql`)
**Completes the ecosystem with operational data**

**What's Included:**
- **7 Chat Messages**: Client-lawyer communications
- **7 Pipeline Stages**: Sales process management
- **4 Sales Cards**: Business development opportunities
- **7 Activity Logs**: System usage tracking
- **7 Legal Documents**: Case files and contracts
- **7 Vendors**: Courts, suppliers, service providers
- **9 Bills**: Operational expenses (paid, pending, approved)

**Sample Operational Data:**
```
Vendors:
• Tribunal de Justiça de SP - Court fees
• Papelaria Jurídica SP - Office supplies
• Thomson Reuters Brasil - Legal research platform
• Receita Federal do Brasil - Government fees

Bills:
• R$ 850 - Court costs (PAID)
• R$ 16,500 - Legal research license (APPROVED)
• R$ 3,080 - Accounting services (PENDING)
```

## Application Steps

### Manual Application (Required)
Due to Supabase security restrictions, seed data must be applied manually:

1. **Open Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/znupmkjfkrzddokfneaz/sql
   ```

2. **Apply Seed Scripts in Order**
   ```sql
   -- Step 1: Core foundational data
   -- Copy and execute: database/seed-data-step1-core.sql
   
   -- Step 2: Billing system data  
   -- Copy and execute: database/seed-data-step2-billing.sql
   
   -- Step 3: Time tracking and invoices
   -- Copy and execute: database/seed-data-step3-timetracking.sql
   
   -- Step 4: Financial and supporting data
   -- Copy and execute: database/seed-data-step4-financial.sql
   ```

3. **Verify Application**
   ```bash
   node verify-seed-data.js
   ```

## Expected Results

### Data Summary
After complete seeding:
- ✅ **2 Law Firms** (Already exist)
- ✅ **6 Users** (Already exist) 
- ✅ **8 Realistic Clients** (Individual & Corporate)
- ✅ **8 Matter Types** (Different legal specialties)
- ✅ **8 Active Legal Matters/Cases**
- ✅ **6 Tasks** with realistic due dates
- ✅ **18 Time Entries** with billable hours
- ✅ **7 Invoices** (Paid, pending, overdue)
- ✅ **7 Chat Messages** between lawyers/clients
- ✅ **4 Pipeline Stages & Sales Cards**
- ✅ **7 Legal Documents**
- ✅ **7 Vendors & Service Providers**
- ✅ **9 Bills** (Paid, pending, approved)
- ✅ **6 Subscription Plans** (If billing tables exist)
- ✅ **8 Case Types** with billing config
- ✅ **4 Discount Rules**

### User Experience Improvements
- **Realistic Testing**: Authentic Brazilian legal scenarios
- **Complete Workflows**: End-to-end case and billing cycles
- **Financial Complexity**: Multiple payment states and billing methods
- **Client Diversity**: Individual and corporate clients with different needs
- **Active Communication**: Chat history showing lawyer-client interactions
- **Business Pipeline**: Sales opportunities and business development tracking
- **Operational Reality**: Vendor management and expense tracking

### Testing Scenarios Enabled
1. **Client Onboarding**: From prospect to active client
2. **Case Management**: Multiple matters with different statuses
3. **Time Tracking**: Billable hours across various projects
4. **Invoice Lifecycle**: Creation, sending, payment, and collections
5. **Subscription Management**: Active plans with usage tracking
6. **Financial Management**: AP/AR with realistic vendor relationships
7. **Communication Flows**: Client messaging and case updates
8. **Business Development**: Pipeline management and opportunity tracking

## Verification Commands

```bash
# Check migration status
node verify-migration.js

# Apply seed data overview (requires migration first)
node apply-seed-data.js

# Verify seed data application
node verify-seed-data.js
```

## Troubleshooting

### Common Issues
1. **"Missing required tables"** → Apply database migration first
2. **"Table does not exist"** → Optional billing tables, continue with core seeding
3. **"Permission denied"** → Ensure service role key is configured
4. **"Duplicate key"** → Seed data already applied, safe to ignore

### Cleanup (if needed)
To reset seed data:
```sql
-- Remove all seed data (keep structure)
DELETE FROM invoice_line_items;
DELETE FROM invoices;
DELETE FROM time_entries;
DELETE FROM matter_contacts;
DELETE FROM matters;
DELETE FROM contacts WHERE law_firm_id IN ('123e4567-e89b-12d3-a456-426614174000', '234e4567-e89b-12d3-a456-426614174001');
-- Continue for other tables...
```

## Support
The seed data is designed to be:
- **Idempotent**: Safe to run multiple times
- **Realistic**: Based on actual Brazilian legal practice
- **Comprehensive**: Covers all major application features
- **Consistent**: Maintains referential integrity

For issues, verify database migration status first, then check table-specific errors in the SQL output.