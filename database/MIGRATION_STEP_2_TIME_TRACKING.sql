-- =============================================
-- STEP 2: TIME TRACKING SCHEMA MIGRATION
-- =============================================

-- Drop existing incompatible time tracking tables
DROP TABLE IF EXISTS time_tracking_projects CASCADE;
DROP TABLE IF EXISTS time_sheets CASCADE;
DROP TABLE IF EXISTS billable_hours CASCADE;

-- If time_entries exists with different schema, rename it
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'time_entries') THEN
        -- Check if it has our expected schema
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'time_entries' 
            AND column_name = 'entry_type'
        ) THEN
            EXECUTE 'ALTER TABLE time_entries RENAME TO time_entries_old_' || to_char(now(), 'YYYYMMDD');
            RAISE NOTICE 'Renamed existing time_entries table to preserve data';
        END IF;
    END IF;
END $$;

-- Create new time entries table with Phase 8.6.1 schema
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- Entry classification
    entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN (
        'case_work', 'subscription_work', 'administrative', 'business_development', 'non_billable'
    )),
    entry_status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (entry_status IN (
        'draft', 'submitted', 'approved', 'rejected', 'billed'
    )),
    
    -- Time tracking
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    break_minutes INTEGER NOT NULL DEFAULT 0,
    effective_minutes INTEGER GENERATED ALWAYS AS (duration_minutes - break_minutes) STORED,
    
    -- Work details
    matter_id UUID,
    client_subscription_id UUID,
    task_category VARCHAR(100),
    activity_description TEXT NOT NULL,
    
    -- Billing information
    is_billable BOOLEAN NOT NULL DEFAULT true,
    billable_rate DECIMAL(10,2),
    billing_rate_source VARCHAR(50) DEFAULT 'user_default',
    billable_amount DECIMAL(12,2) GENERATED ALWAYS AS (
        CASE 
            WHEN is_billable THEN (effective_minutes::DECIMAL / 60.0) * COALESCE(billable_rate, 0)
            ELSE 0
        END
    ) STORED,
    
    -- Subscription allocation
    counts_toward_subscription BOOLEAN DEFAULT false,
    subscription_service_type VARCHAR(50),
    
    -- Additional details
    location VARCHAR(100),
    is_remote_work BOOLEAN DEFAULT false,
    notes TEXT,
    
    -- Timer functionality
    timer_started_at TIMESTAMP WITH TIME ZONE,
    is_timer_running BOOLEAN DEFAULT false,
    
    -- Metadata
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create time entry templates
CREATE TABLE IF NOT EXISTS time_entry_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    user_id UUID,
    
    -- Template details
    template_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Default values
    default_entry_type VARCHAR(50),
    default_task_category VARCHAR(100),
    default_activity_description TEXT,
    default_duration_minutes INTEGER,
    default_is_billable BOOLEAN DEFAULT true,
    default_location VARCHAR(100),
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Sharing
    is_shared BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create lawyer billing rates
CREATE TABLE IF NOT EXISTS lawyer_billing_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- Rate configuration
    rate_type VARCHAR(30) NOT NULL CHECK (rate_type IN (
        'standard', 'matter_specific', 'client_specific', 'service_specific'
    )),
    hourly_rate DECIMAL(10,2) NOT NULL,
    
    -- Scope
    matter_id UUID,
    client_id UUID,
    service_type VARCHAR(50),
    
    -- Validity
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create subscription time allocations
CREATE TABLE IF NOT EXISTS subscription_time_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    client_subscription_id UUID NOT NULL,
    
    -- Allocation period
    allocation_month DATE NOT NULL, -- First day of month
    
    -- Hours allocation
    allocated_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
    used_hours DECIMAL(10,2) NOT NULL DEFAULT 0,
    remaining_hours DECIMAL(10,2) GENERATED ALWAYS AS (allocated_hours - used_hours) STORED,
    overage_hours DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE WHEN used_hours > allocated_hours THEN used_hours - allocated_hours ELSE 0 END
    ) STORED,
    
    -- Service breakdown
    service_breakdown JSONB,
    
    -- Status
    allocation_status VARCHAR(20) DEFAULT 'active' CHECK (allocation_status IN (
        'active', 'completed', 'rolled_over', 'expired'
    )),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create supporting tables
CREATE TABLE IF NOT EXISTS time_entry_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    time_entry_id UUID NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
    subscription_time_allocation_id UUID REFERENCES subscription_time_allocations(id),
    
    -- Allocation details
    allocated_minutes INTEGER NOT NULL,
    service_type VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_time_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    law_firm_id UUID NOT NULL,
    user_id UUID NOT NULL,
    summary_date DATE NOT NULL,
    
    -- Summary data
    total_minutes INTEGER DEFAULT 0,
    billable_minutes INTEGER DEFAULT 0,
    non_billable_minutes INTEGER DEFAULT 0,
    break_minutes INTEGER DEFAULT 0,
    
    -- Breakdown by type
    case_work_minutes INTEGER DEFAULT 0,
    subscription_work_minutes INTEGER DEFAULT 0,
    administrative_minutes INTEGER DEFAULT 0,
    
    -- Revenue
    total_billable_amount DECIMAL(12,2) DEFAULT 0,
    
    -- Entry count
    total_entries INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint
    UNIQUE(law_firm_id, user_id, summary_date)
);

CREATE TABLE IF NOT EXISTS active_time_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    time_entry_id UUID REFERENCES time_entries(id) ON DELETE CASCADE,
    
    -- Session details
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    is_paused BOOLEAN DEFAULT false,
    pause_duration_minutes INTEGER DEFAULT 0,
    
    -- Session data
    session_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_law_firm_id ON time_entries(law_firm_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_matter_id ON time_entries(matter_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_entry_date ON time_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_status ON time_entries(entry_status);

-- Enable RLS
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entry_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_billing_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_time_allocations ENABLE ROW LEVEL SECURITY;

-- Verification
SELECT 'Time tracking tables created successfully' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('time_entries', 'time_entry_templates', 'lawyer_billing_rates', 'subscription_time_allocations')
ORDER BY table_name;