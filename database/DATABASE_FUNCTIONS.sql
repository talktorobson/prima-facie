-- =============================================
-- PRIMA FACIE DATABASE FUNCTIONS & TRIGGERS
-- =============================================

-- =============================================
-- FUNCTION: Generate Invoice Numbers
-- =============================================

CREATE OR REPLACE FUNCTION generate_invoice_number(
    p_law_firm_id UUID, 
    p_invoice_type VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
    v_year VARCHAR(4);
    v_sequence INTEGER;
    v_prefix VARCHAR(10);
    v_invoice_number VARCHAR(50);
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    -- Set prefix based on invoice type
    CASE p_invoice_type
        WHEN 'subscription' THEN v_prefix := 'SUB';
        WHEN 'case_billing' THEN v_prefix := 'CASE';
        WHEN 'payment_plan' THEN v_prefix := 'PLAN';
        WHEN 'time_based' THEN v_prefix := 'TIME';
        WHEN 'hybrid' THEN v_prefix := 'HYB';
        WHEN 'adjustment' THEN v_prefix := 'ADJ';
        WHEN 'late_fee' THEN v_prefix := 'LATE';
        ELSE v_prefix := 'INV';
    END CASE;
    
    -- Get next sequence number for this law firm, type, and year
    SELECT COALESCE(MAX(
        CAST(
            REGEXP_REPLACE(
                invoice_number, 
                '^' || v_prefix || '-' || v_year || '-(\\d+)$', 
                '\\1'
            ) AS INTEGER
        )
    ), 0) + 1
    INTO v_sequence
    FROM invoices 
    WHERE law_firm_id = p_law_firm_id
        AND invoice_type = p_invoice_type
        AND invoice_number ~ ('^' || v_prefix || '-' || v_year || '-\\d+$');
    
    -- Format invoice number: PREFIX-YEAR-SEQUENCE (6 digits)
    v_invoice_number := v_prefix || '-' || v_year || '-' || LPAD(v_sequence::VARCHAR, 6, '0');
    
    RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION: Calculate Billable Amount for Time Entry
-- =============================================

CREATE OR REPLACE FUNCTION calculate_billable_amount(
    p_time_entry_id UUID
) RETURNS DECIMAL AS $$
DECLARE
    v_entry RECORD;
    v_rate DECIMAL(10,2);
    v_amount DECIMAL(12,2);
BEGIN
    -- Get time entry details
    SELECT 
        effective_minutes,
        is_billable,
        billable_rate,
        user_id,
        law_firm_id,
        matter_id,
        client_subscription_id,
        entry_type
    INTO v_entry
    FROM time_entries 
    WHERE id = p_time_entry_id;
    
    -- Return 0 if not billable
    IF NOT v_entry.is_billable THEN
        RETURN 0;
    END IF;
    
    -- Use provided rate or lookup default rate
    v_rate := v_entry.billable_rate;
    
    IF v_rate IS NULL THEN
        -- Get rate from lawyer_billing_rates table
        SELECT hourly_rate INTO v_rate
        FROM lawyer_billing_rates
        WHERE law_firm_id = v_entry.law_firm_id
            AND user_id = v_entry.user_id
            AND rate_type = 'standard'
            AND is_active = true
            AND effective_from <= CURRENT_DATE
            AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
        ORDER BY effective_from DESC
        LIMIT 1;
    END IF;
    
    -- Default rate if none found
    IF v_rate IS NULL THEN
        v_rate := 200.00; -- Default rate
    END IF;
    
    -- Calculate amount: (minutes / 60) * hourly_rate
    v_amount := (v_entry.effective_minutes::DECIMAL / 60.0) * v_rate;
    
    RETURN ROUND(v_amount, 2);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION: Update Invoice Total
-- =============================================

CREATE OR REPLACE FUNCTION update_invoice_total(p_invoice_id UUID) 
RETURNS VOID AS $$
DECLARE
    v_subtotal DECIMAL(12,2);
    v_tax_amount DECIMAL(12,2);
    v_discount_amount DECIMAL(12,2);
    v_total DECIMAL(12,2);
BEGIN
    -- Calculate subtotal from line items
    SELECT 
        COALESCE(SUM(line_total), 0),
        COALESCE(SUM(tax_amount), 0)
    INTO v_subtotal, v_tax_amount
    FROM invoice_line_items
    WHERE invoice_id = p_invoice_id;
    
    -- Get current discount amount
    SELECT COALESCE(discount_amount, 0) INTO v_discount_amount
    FROM invoices
    WHERE id = p_invoice_id;
    
    -- Calculate total
    v_total := v_subtotal + v_tax_amount - v_discount_amount;
    
    -- Update invoice
    UPDATE invoices SET
        subtotal = v_subtotal,
        tax_amount = v_tax_amount,
        total_amount = v_total,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION: Update Bill Total
-- =============================================

CREATE OR REPLACE FUNCTION update_bill_total(p_bill_id UUID) 
RETURNS VOID AS $$
DECLARE
    v_subtotal DECIMAL(12,2);
    v_tax_amount DECIMAL(12,2);
    v_discount_amount DECIMAL(12,2);
    v_total DECIMAL(12,2);
BEGIN
    -- Calculate subtotal from line items
    SELECT 
        COALESCE(SUM(line_total), 0),
        COALESCE(SUM(tax_amount), 0)
    INTO v_subtotal, v_tax_amount
    FROM bill_line_items
    WHERE bill_id = p_bill_id;
    
    -- Get current discount amount
    SELECT COALESCE(discount_amount, 0) INTO v_discount_amount
    FROM bills
    WHERE id = p_bill_id;
    
    -- Calculate total
    v_total := v_subtotal + v_tax_amount - v_discount_amount;
    
    -- Update bill
    UPDATE bills SET
        subtotal = v_subtotal,
        tax_amount = v_tax_amount,
        total_amount = v_total,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_bill_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION: Update Daily Time Summary
-- =============================================

CREATE OR REPLACE FUNCTION update_daily_time_summary(
    p_law_firm_id UUID,
    p_user_id UUID,
    p_date DATE
) RETURNS VOID AS $$
DECLARE
    v_summary RECORD;
BEGIN
    -- Calculate daily summary
    SELECT 
        COALESCE(SUM(effective_minutes), 0) as total_minutes,
        COALESCE(SUM(CASE WHEN is_billable THEN effective_minutes ELSE 0 END), 0) as billable_minutes,
        COALESCE(SUM(CASE WHEN NOT is_billable THEN effective_minutes ELSE 0 END), 0) as non_billable_minutes,
        COALESCE(SUM(break_minutes), 0) as break_minutes,
        COALESCE(SUM(CASE WHEN entry_type = 'case_work' THEN effective_minutes ELSE 0 END), 0) as case_work_minutes,
        COALESCE(SUM(CASE WHEN entry_type = 'subscription_work' THEN effective_minutes ELSE 0 END), 0) as subscription_work_minutes,
        COALESCE(SUM(CASE WHEN entry_type = 'administrative' THEN effective_minutes ELSE 0 END), 0) as administrative_minutes,
        COALESCE(SUM(billable_amount), 0) as total_billable_amount,
        COUNT(*) as total_entries
    INTO v_summary
    FROM time_entries
    WHERE law_firm_id = p_law_firm_id
        AND user_id = p_user_id
        AND entry_date = p_date;
    
    -- Insert or update summary
    INSERT INTO daily_time_summaries (
        law_firm_id, user_id, summary_date,
        total_minutes, billable_minutes, non_billable_minutes, break_minutes,
        case_work_minutes, subscription_work_minutes, administrative_minutes,
        total_billable_amount, total_entries
    ) VALUES (
        p_law_firm_id, p_user_id, p_date,
        v_summary.total_minutes, v_summary.billable_minutes, v_summary.non_billable_minutes, v_summary.break_minutes,
        v_summary.case_work_minutes, v_summary.subscription_work_minutes, v_summary.administrative_minutes,
        v_summary.total_billable_amount, v_summary.total_entries
    )
    ON CONFLICT (law_firm_id, user_id, summary_date)
    DO UPDATE SET
        total_minutes = v_summary.total_minutes,
        billable_minutes = v_summary.billable_minutes,
        non_billable_minutes = v_summary.non_billable_minutes,
        break_minutes = v_summary.break_minutes,
        case_work_minutes = v_summary.case_work_minutes,
        subscription_work_minutes = v_summary.subscription_work_minutes,
        administrative_minutes = v_summary.administrative_minutes,
        total_billable_amount = v_summary.total_billable_amount,
        total_entries = v_summary.total_entries,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION: Check Budget Alert
-- =============================================

CREATE OR REPLACE FUNCTION check_budget_alert(
    p_law_firm_id UUID,
    p_expense_category_id UUID,
    p_amount DECIMAL
) RETURNS VOID AS $$
DECLARE
    v_budget RECORD;
    v_spent DECIMAL(12,2);
    v_percentage DECIMAL(5,2);
BEGIN
    -- Get current budget allocation
    SELECT ba.allocated_amount, ba.spent_amount, ec.category_name
    INTO v_budget
    FROM budget_allocations ba
    JOIN expense_categories ec ON ec.id = ba.expense_category_id
    JOIN budget_periods bp ON bp.id = ba.budget_period_id
    WHERE ba.law_firm_id = p_law_firm_id
        AND ba.expense_category_id = p_expense_category_id
        AND bp.period_status = 'active'
    LIMIT 1;
    
    IF v_budget.allocated_amount IS NOT NULL AND v_budget.allocated_amount > 0 THEN
        v_spent := v_budget.spent_amount + p_amount;
        v_percentage := (v_spent / v_budget.allocated_amount) * 100;
        
        -- Create alert if over budget
        IF v_percentage > 100 THEN
            INSERT INTO financial_alerts (
                law_firm_id, alert_type, alert_severity, title, message,
                expense_category_id, threshold_amount, actual_amount, alert_status
            ) VALUES (
                p_law_firm_id, 'budget_exceeded', 'high',
                'Orçamento Excedido: ' || v_budget.category_name,
                'A categoria ' || v_budget.category_name || ' excedeu o orçamento em ' || ROUND(v_percentage - 100, 1) || '%',
                p_expense_category_id, v_budget.allocated_amount, v_spent, 'active'
            );
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to auto-generate invoice numbers
CREATE OR REPLACE FUNCTION trigger_generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number(NEW.law_firm_id, NEW.invoice_type);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_invoice_number ON invoices;
CREATE TRIGGER trigger_invoice_number
    BEFORE INSERT ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_invoice_number();

-- Trigger to update invoice totals when line items change
CREATE OR REPLACE FUNCTION trigger_update_invoice_total()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM update_invoice_total(OLD.invoice_id);
        RETURN OLD;
    ELSE
        PERFORM update_invoice_total(NEW.invoice_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_invoice_line_items_total ON invoice_line_items;
CREATE TRIGGER trigger_invoice_line_items_total
    AFTER INSERT OR UPDATE OR DELETE ON invoice_line_items
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_invoice_total();

-- Trigger to update bill totals when line items change
CREATE OR REPLACE FUNCTION trigger_update_bill_total()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM update_bill_total(OLD.bill_id);
        RETURN OLD;
    ELSE
        PERFORM update_bill_total(NEW.bill_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bill_line_items_total ON bill_line_items;
CREATE TRIGGER trigger_bill_line_items_total
    AFTER INSERT OR UPDATE OR DELETE ON bill_line_items
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_bill_total();

-- Trigger to update daily time summaries
CREATE OR REPLACE FUNCTION trigger_update_time_summary()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM update_daily_time_summary(OLD.law_firm_id, OLD.user_id, OLD.entry_date);
        RETURN OLD;
    ELSE
        PERFORM update_daily_time_summary(NEW.law_firm_id, NEW.user_id, NEW.entry_date);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_time_entries_summary ON time_entries;
CREATE TRIGGER trigger_time_entries_summary
    AFTER INSERT OR UPDATE OR DELETE ON time_entries
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_time_summary();

-- Trigger to check budget alerts on bill creation
CREATE OR REPLACE FUNCTION trigger_budget_alert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expense_category_id IS NOT NULL THEN
        PERFORM check_budget_alert(NEW.law_firm_id, NEW.expense_category_id, NEW.total_amount);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bills_budget_alert ON bills;
CREATE TRIGGER trigger_bills_budget_alert
    AFTER INSERT ON bills
    FOR EACH ROW
    EXECUTE FUNCTION trigger_budget_alert();

-- =============================================
-- VIEWS FOR REPORTING
-- =============================================

-- Invoice summary view
CREATE OR REPLACE VIEW invoice_summary AS
SELECT 
    i.id,
    i.law_firm_id,
    i.invoice_number,
    i.invoice_type,
    i.invoice_status,
    i.total_amount,
    i.currency,
    i.issue_date,
    i.due_date,
    i.paid_date,
    CASE 
        WHEN i.paid_date IS NOT NULL THEN 'Paid'
        WHEN i.due_date < CURRENT_DATE THEN 'Overdue'
        WHEN i.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'Due Soon'
        ELSE 'Current'
    END as payment_status,
    (SELECT COUNT(*) FROM invoice_line_items WHERE invoice_id = i.id) as line_item_count,
    (SELECT SUM(payment_amount) FROM invoice_payments WHERE invoice_id = i.id) as total_payments
FROM invoices i;

-- Time tracking summary view
CREATE OR REPLACE VIEW time_tracking_summary AS
SELECT 
    te.law_firm_id,
    te.user_id,
    te.entry_date,
    COUNT(*) as entry_count,
    SUM(te.effective_minutes) as total_minutes,
    ROUND(SUM(te.effective_minutes) / 60.0, 2) as total_hours,
    SUM(CASE WHEN te.is_billable THEN te.effective_minutes ELSE 0 END) as billable_minutes,
    ROUND(SUM(CASE WHEN te.is_billable THEN te.effective_minutes ELSE 0 END) / 60.0, 2) as billable_hours,
    SUM(te.billable_amount) as total_billable_amount
FROM time_entries te
WHERE te.entry_status != 'rejected'
GROUP BY te.law_firm_id, te.user_id, te.entry_date;

-- Financial summary view
CREATE OR REPLACE VIEW financial_summary AS
SELECT 
    b.law_firm_id,
    DATE_TRUNC('month', b.bill_date) as month_year,
    COUNT(*) as bill_count,
    SUM(b.total_amount) as total_expenses,
    SUM(CASE WHEN b.bill_status = 'paid' THEN b.total_amount ELSE 0 END) as paid_expenses,
    SUM(CASE WHEN b.bill_status IN ('received', 'approved') THEN b.total_amount ELSE 0 END) as pending_expenses,
    SUM(CASE WHEN b.due_date < CURRENT_DATE AND b.bill_status != 'paid' THEN b.total_amount ELSE 0 END) as overdue_expenses
FROM bills b
GROUP BY b.law_firm_id, DATE_TRUNC('month', b.bill_date);

-- =============================================
-- VERIFICATION
-- =============================================

SELECT 'Database functions and triggers created successfully' as status;