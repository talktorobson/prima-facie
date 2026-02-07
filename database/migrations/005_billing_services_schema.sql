-- =====================================================
-- MIGRATION 005: Billing Services Schema
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Discount Rules
CREATE TABLE IF NOT EXISTS discount_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) NOT NULL DEFAULT 'subscription_based',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5,
  conditions JSONB DEFAULT '[]'::jsonb,
  discount_config JSONB DEFAULT '{}'::jsonb,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Payment Plans
CREATE TABLE IF NOT EXISTS payment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
  matter_id UUID REFERENCES matters(id) ON DELETE SET NULL,
  client_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  plan_name VARCHAR(255) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  installment_count INTEGER NOT NULL,
  installment_amount DECIMAL(15,2) NOT NULL,
  down_payment DECIMAL(15,2) DEFAULT 0,
  payment_frequency VARCHAR(50) DEFAULT 'monthly',
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'draft',
  auto_charge BOOLEAN DEFAULT false,
  late_fee_percentage DECIMAL(5,2) DEFAULT 2.0,
  grace_period_days INTEGER DEFAULT 5,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Payment Installments
CREATE TABLE IF NOT EXISTS payment_installments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_plan_id UUID NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  paid_date TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'pending',
  late_fee_applied DECIMAL(15,2) DEFAULT 0,
  payment_method VARCHAR(50),
  transaction_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Case Types (for billing configuration)
CREATE TABLE IF NOT EXISTS case_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  minimum_fee_hourly DECIMAL(15,2) DEFAULT 0,
  minimum_fee_percentage DECIMAL(15,2) DEFAULT 0,
  minimum_fee_fixed DECIMAL(15,2) DEFAULT 0,
  default_billing_method VARCHAR(50) DEFAULT 'hourly',
  default_hourly_rate DECIMAL(15,2) DEFAULT 0,
  default_percentage_rate DECIMAL(5,2) DEFAULT 0,
  default_success_fee_rate DECIMAL(5,2) DEFAULT 0,
  complexity_multiplier DECIMAL(5,2) DEFAULT 1.0,
  estimated_hours_range VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Business Parameters
CREATE TABLE IF NOT EXISTS business_parameters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
  parameter_category VARCHAR(100) NOT NULL,
  parameter_name VARCHAR(255) NOT NULL,
  parameter_key VARCHAR(255) NOT NULL,
  parameter_value TEXT NOT NULL,
  parameter_type VARCHAR(50) DEFAULT 'string',
  description TEXT,
  unit VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(law_firm_id, parameter_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_discount_rules_law_firm ON discount_rules(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_law_firm ON payment_plans(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_matter ON payment_plans(matter_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_client ON payment_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_installments_plan ON payment_installments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_case_types_law_firm ON case_types(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_business_parameters_law_firm ON business_parameters(law_firm_id);

-- RLS Policies
ALTER TABLE discount_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_parameters ENABLE ROW LEVEL SECURITY;

-- Staff access: users can access rows matching their law_firm_id
CREATE POLICY "Staff can manage discount rules" ON discount_rules
  FOR ALL USING (law_firm_id IN (SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Staff can manage payment plans" ON payment_plans
  FOR ALL USING (law_firm_id IN (SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Staff can manage payment installments" ON payment_installments
  FOR ALL USING (payment_plan_id IN (
    SELECT id FROM payment_plans WHERE law_firm_id IN (
      SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()
    )
  ));

CREATE POLICY "Staff can manage case types" ON case_types
  FOR ALL USING (law_firm_id IN (SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Staff can manage business parameters" ON business_parameters
  FOR ALL USING (law_firm_id IN (SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()));

-- Updated_at triggers
CREATE TRIGGER update_discount_rules_updated_at BEFORE UPDATE ON discount_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_plans_updated_at BEFORE UPDATE ON payment_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_installments_updated_at BEFORE UPDATE ON payment_installments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_case_types_updated_at BEFORE UPDATE ON case_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_business_parameters_updated_at BEFORE UPDATE ON business_parameters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Case Billing Methods
CREATE TABLE IF NOT EXISTS case_billing_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  case_type_id UUID REFERENCES case_types(id) ON DELETE SET NULL,
  billing_type VARCHAR(50) NOT NULL DEFAULT 'hourly',
  hourly_rate DECIMAL(15,2),
  percentage_rate DECIMAL(5,2),
  fixed_amount DECIMAL(15,2),
  success_fee_percentage DECIMAL(5,2) DEFAULT 0,
  success_fee_applies_to VARCHAR(50) DEFAULT 'recovered',
  minimum_fee DECIMAL(15,2) DEFAULT 0,
  minimum_fee_source VARCHAR(50) DEFAULT 'custom',
  has_subscription_discount BOOLEAN DEFAULT false,
  original_amount DECIMAL(15,2),
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(15,2) DEFAULT 0,
  final_amount DECIMAL(15,2),
  status VARCHAR(50) DEFAULT 'draft',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Case Outcomes
CREATE TABLE IF NOT EXISTS case_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  outcome_type VARCHAR(50) NOT NULL,
  outcome_subtype VARCHAR(100),
  total_value_claimed DECIMAL(15,2),
  effective_value_redeemed DECIMAL(15,2),
  settlement_amount DECIMAL(15,2),
  court_award_amount DECIMAL(15,2),
  success_achieved BOOLEAN DEFAULT false,
  success_percentage DECIMAL(5,2),
  success_fee_percentage DECIMAL(5,2),
  success_fee_amount DECIMAL(15,2),
  success_fee_calculation_method VARCHAR(50) DEFAULT 'percentage',
  outcome_date DATE NOT NULL,
  final_payment_received_date DATE,
  court_decision_reference TEXT,
  settlement_agreement_reference TEXT,
  notes TEXT,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL REFERENCES law_firms(id) ON DELETE CASCADE,
  plan_name VARCHAR(255) NOT NULL,
  plan_type VARCHAR(50) DEFAULT 'general',
  description TEXT,
  monthly_fee DECIMAL(15,2) NOT NULL DEFAULT 0,
  yearly_fee DECIMAL(15,2) NOT NULL DEFAULT 0,
  setup_fee DECIMAL(15,2) DEFAULT 0,
  services_included JSONB DEFAULT '[]'::jsonb,
  max_monthly_hours INTEGER DEFAULT 0,
  max_document_reviews INTEGER DEFAULT 0,
  support_level VARCHAR(50) DEFAULT 'email',
  billing_interval VARCHAR(50) DEFAULT 'monthly',
  trial_period_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Client Subscriptions
CREATE TABLE IF NOT EXISTS client_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'trial',
  billing_cycle VARCHAR(50) DEFAULT 'monthly',
  auto_renew BOOLEAN DEFAULT true,
  start_date DATE NOT NULL,
  end_date DATE,
  trial_end_date DATE,
  current_period_start DATE NOT NULL,
  current_period_end DATE NOT NULL,
  next_billing_date DATE,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  monthly_fee DECIMAL(15,2) DEFAULT 0,
  yearly_fee DECIMAL(15,2) DEFAULT 0,
  current_fee DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Additional indexes
CREATE INDEX IF NOT EXISTS idx_case_billing_methods_matter ON case_billing_methods(matter_id);
CREATE INDEX IF NOT EXISTS idx_case_outcomes_matter ON case_outcomes(matter_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_law_firm ON subscription_plans(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_client ON client_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_subscriptions_plan ON client_subscriptions(subscription_plan_id);

-- RLS for new tables
ALTER TABLE case_billing_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage case billing methods" ON case_billing_methods
  FOR ALL USING (matter_id IN (
    SELECT id FROM matters WHERE law_firm_id IN (
      SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()
    )
  ));

CREATE POLICY "Staff can manage case outcomes" ON case_outcomes
  FOR ALL USING (matter_id IN (
    SELECT id FROM matters WHERE law_firm_id IN (
      SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()
    )
  ));

CREATE POLICY "Staff can manage subscription plans" ON subscription_plans
  FOR ALL USING (law_firm_id IN (SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Staff can manage client subscriptions" ON client_subscriptions
  FOR ALL USING (client_id IN (
    SELECT id FROM contacts WHERE law_firm_id IN (
      SELECT law_firm_id FROM users WHERE auth_user_id = auth.uid()
    )
  ));

-- Triggers for new tables
CREATE TRIGGER update_case_billing_methods_updated_at BEFORE UPDATE ON case_billing_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_case_outcomes_updated_at BEFORE UPDATE ON case_outcomes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_subscriptions_updated_at BEFORE UPDATE ON client_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE discount_rules IS 'Discount rules engine for subscription-based and loyalty discounts';
COMMENT ON TABLE payment_plans IS 'Payment plan configurations for client billing installments';
COMMENT ON TABLE payment_installments IS 'Individual installments within a payment plan';
COMMENT ON TABLE case_types IS 'Case type configurations with billing defaults and minimum fees';
COMMENT ON TABLE business_parameters IS 'Configurable business parameters for billing and operations';
COMMENT ON TABLE case_billing_methods IS 'Per-matter billing method configuration with discount tracking';
COMMENT ON TABLE case_outcomes IS 'Case outcome tracking for success fee calculations';
COMMENT ON TABLE subscription_plans IS 'Subscription plan definitions for Legal-as-a-Service';
COMMENT ON TABLE client_subscriptions IS 'Client subscription instances linked to plans';
