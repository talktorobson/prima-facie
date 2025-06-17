-- =============================================
-- PRIMA FACIE CORE SCHEMA - STEP 2  
-- Create supporting tables and time tracking
-- =============================================

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL,
  matter_id UUID REFERENCES matters(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  task_type VARCHAR(30) CHECK (task_type IN ('general', 'deadline', 'court_date', 'client_meeting', 'document_review')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date DATE,
  completed_date DATE,
  reminder_date DATE,
  assigned_to UUID,
  is_billable BOOLEAN DEFAULT false,
  estimated_hours DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Create time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL,
  matter_id UUID NOT NULL REFERENCES matters(id),
  user_id UUID NOT NULL,
  task_id UUID REFERENCES tasks(id),
  description TEXT NOT NULL,
  hours_worked DECIMAL(8,2) NOT NULL,
  work_date DATE DEFAULT CURRENT_DATE,
  start_time TIME,
  end_time TIME,
  hourly_rate DECIMAL(10,2),
  total_amount DECIMAL(12,2),
  is_billable BOOLEAN DEFAULT true,
  is_billed BOOLEAN DEFAULT false,
  invoice_id UUID,
  timer_started_at TIMESTAMP WITH TIME ZONE,
  timer_stopped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL,
  matter_id UUID REFERENCES matters(id),
  contact_id UUID REFERENCES contacts(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_type VARCHAR(50),
  file_size INTEGER,
  storage_provider VARCHAR(50),
  storage_path VARCHAR(500),
  external_id VARCHAR(255),
  document_type VARCHAR(100),
  category VARCHAR(100),
  is_confidential BOOLEAN DEFAULT false,
  access_level VARCHAR(20) DEFAULT 'internal' CHECK (access_level IN ('public', 'internal', 'restricted', 'confidential')),
  version VARCHAR(20),
  parent_document_id UUID REFERENCES documents(id),
  tags TEXT[],
  custom_fields JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Create basic invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES contacts(id),
  matter_id UUID REFERENCES matters(id),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255),
  description TEXT,
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  sent_date DATE,
  paid_date DATE,
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,4) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  outstanding_amount DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')),
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  currency VARCHAR(3) DEFAULT 'BRL',
  payment_terms VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Create invoice_line_items table
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  time_entry_id UUID REFERENCES time_entries(id),
  description TEXT NOT NULL,
  quantity DECIMAL(10,4) DEFAULT 1,
  rate DECIMAL(12,2) NOT NULL,
  amount DECIMAL(12,2),
  item_type VARCHAR(20) CHECK (item_type IN ('time', 'expense', 'fee', 'other')),
  service_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create messages table for chat functionality
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL,
  matter_id UUID REFERENCES matters(id),
  contact_id UUID REFERENCES contacts(id),
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system', 'whatsapp')),
  sender_id UUID,
  sender_type VARCHAR(20) CHECK (sender_type IN ('user', 'contact', 'system')),
  receiver_id UUID,
  receiver_type VARCHAR(20) CHECK (receiver_type IN ('user', 'contact', 'system')),
  external_message_id VARCHAR(255),
  external_platform VARCHAR(50),
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  read_at TIMESTAMP WITH TIME ZONE,
  attachments JSONB,
  parent_message_id UUID REFERENCES messages(id),
  thread_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Create pipeline_stages table
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7),
  stage_type VARCHAR(20) CHECK (stage_type IN ('intake', 'onboarding', 'not_hired')),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_final_stage BOOLEAN DEFAULT false,
  auto_actions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Create pipeline_cards table  
CREATE TABLE IF NOT EXISTS pipeline_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL,
  pipeline_stage_id UUID NOT NULL REFERENCES pipeline_stages(id),
  contact_id UUID REFERENCES contacts(id),
  matter_type_id UUID REFERENCES matter_types(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  estimated_value DECIMAL(12,2),
  probability INTEGER CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  last_contact_date DATE,
  next_follow_up_date DATE,
  assigned_to UUID,
  source VARCHAR(100),
  notes TEXT,
  tags TEXT[],
  stage_history JSONB,
  outcome_reason VARCHAR(255),
  outcome_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  law_firm_id UUID NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID,
  description TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_law_firm_id ON tasks(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_tasks_matter_id ON tasks(matter_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_law_firm_id ON time_entries(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_matter_id ON time_entries(matter_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_law_firm_id ON documents(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_documents_matter_id ON documents(matter_id);
CREATE INDEX IF NOT EXISTS idx_invoices_law_firm_id ON invoices(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_invoices_contact_id ON invoices(contact_id);
CREATE INDEX IF NOT EXISTS idx_messages_law_firm_id ON messages(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_cards_stage_id ON pipeline_cards(pipeline_stage_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_law_firm_id ON activity_logs(law_firm_id);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;