-- =============================================
-- PRIMA FACIE ADVANCED SCHEMA - STEP 3
-- Create advanced billing and financial tables
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL,
  vendor_type VARCHAR(50) CHECK (vendor_type IN ('court', 'supplier', 'service_provider', 'government', 'other')),
  name VARCHAR(200) NOT NULL,
  legal_name VARCHAR(200),
  cnpj VARCHAR(18),
  cpf VARCHAR(14),
  email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  website VARCHAR(255),
  contact_person VARCHAR(100),
  address_street VARCHAR(255),
  address_number VARCHAR(20),
  address_complement VARCHAR(100),
  address_neighborhood VARCHAR(100),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zipcode VARCHAR(10),
  address_country VARCHAR(2) DEFAULT 'BR',
  payment_terms VARCHAR(100),
  preferred_payment_method VARCHAR(50),
  pix_key VARCHAR(100),
  bank_name VARCHAR(100),
  bank_agency VARCHAR(20),
  bank_account VARCHAR(30),
  tax_id VARCHAR(50),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  matter_id UUID REFERENCES matters(id),
  bill_number VARCHAR(50),
  vendor_invoice_number VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  bill_date DATE DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  outstanding_amount DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'paid', 'overdue', 'cancelled')),
  category VARCHAR(100),
  payment_method VARCHAR(50),
  payment_date DATE,
  payment_reference VARCHAR(100),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  is_billable BOOLEAN DEFAULT false,
  is_reimbursable BOOLEAN DEFAULT false,
  currency VARCHAR(3) DEFAULT 'BRL',
  attachments JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2),
  price_quarterly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
  service_inclusions JSONB,
  legal_areas TEXT[],
  max_matters_per_month INTEGER,
  max_consultations_per_month INTEGER,
  max_documents_per_month INTEGER,
  max_hours_per_month DECIMAL(5,2),
  overage_rate_per_hour DECIMAL(10,2),
  overage_rate_per_matter DECIMAL(10,2),
  overage_rate_per_consultation DECIMAL(10,2),
  overage_rate_per_document DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Create case_types table
CREATE TABLE IF NOT EXISTS case_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  legal_area VARCHAR(100),
  complexity_level VARCHAR(20) CHECK (complexity_level IN ('low', 'medium', 'high', 'expert')),
  estimated_duration_months INTEGER,
  minimum_fee DECIMAL(10,2),
  default_hourly_rate DECIMAL(10,2),
  default_flat_fee DECIMAL(10,2),
  default_contingency_percentage DECIMAL(5,2),
  success_fee_percentage DECIMAL(5,2),
  billing_methods TEXT[] DEFAULT ARRAY['hourly', 'flat_fee', 'contingency'],
  required_documents TEXT[],
  typical_tasks TEXT[],
  risk_factors TEXT[],
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Create client_subscriptions table
CREATE TABLE IF NOT EXISTS client_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES contacts(id),
  subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('trial', 'active', 'paused', 'cancelled', 'expired')),
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  billing_cycle VARCHAR(20) CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
  monthly_price DECIMAL(10,2),
  next_billing_date DATE,
  last_billing_date DATE,
  usage_current_period JSONB DEFAULT '{}',
  usage_limits JSONB DEFAULT '{}',
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_reason VARCHAR(255),
  auto_renew BOOLEAN DEFAULT true,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Create discount_rules table
CREATE TABLE IF NOT EXISTS discount_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  rule_type VARCHAR(50) CHECK (rule_type IN ('subscription_discount', 'volume_discount', 'loyalty_discount', 'referral_discount', 'promotional_discount')),
  discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value DECIMAL(10,2) NOT NULL,
  applies_to VARCHAR(50) CHECK (applies_to IN ('subscription', 'case_billing', 'time_billing', 'flat_fee', 'all')),
  minimum_subscription_months INTEGER,
  minimum_case_value DECIMAL(12,2),
  minimum_monthly_billing DECIMAL(12,2),
  maximum_discount_amount DECIMAL(10,2),
  start_date DATE,
  end_date DATE,
  max_usage_per_client INTEGER,
  client_eligibility_criteria JSONB,
  case_type_restrictions TEXT[],
  subscription_plan_restrictions UUID[],
  auto_apply BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vendors_law_firm_id ON vendors(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_vendors_vendor_type ON vendors(vendor_type);
CREATE INDEX IF NOT EXISTS idx_bills_law_firm_id ON bills(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_bills_vendor_id ON bills(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_law_firm_id ON subscription_plans(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_case_types_law_firm_id ON case_types(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_law_firm_id ON client_subscriptions(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_contact_id ON client_subscriptions(contact_id);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_subscription_plan_id ON client_subscriptions(subscription_plan_id);
CREATE INDEX IF NOT EXISTS idx_discount_rules_law_firm_id ON discount_rules(law_firm_id);

-- Enable Row Level Security
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_rules ENABLE ROW LEVEL SECURITY;

-- Success message
SELECT 'Advanced billing and financial tables created successfully!' as status;