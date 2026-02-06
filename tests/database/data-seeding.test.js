/**
 * Data Seeding Test Suite
 * Tests default data insertion, seed scripts, and initial system setup
 */

const DatabaseTestHelper = require('./helpers/db-test-helper');

describe('Data Seeding Tests', () => {
  let dbHelper;
  let testContext;

  beforeAll(async () => {
    dbHelper = new DatabaseTestHelper();
    await dbHelper.initialize();
    testContext = dbHelper.getTestContext();
  });

  afterAll(async () => {
    if (dbHelper) {
      await dbHelper.cleanup();
    }
  });

  describe('Default Expense Categories Seeding', () => {
    test('Should have default expense categories available', async () => {
      const { data: categories, error } = await testContext.supabase
        .from('expense_categories')
        .select('*');

      expect(error).toBeNull();
      expect(Array.isArray(categories)).toBe(true);
      
      // Should have at least the default categories
      const categoryNames = categories.map(cat => cat.category_name);
      const expectedCategories = [
        'Rent & Facilities',
        'Technology',
        'Professional Services',
        'Marketing & Advertising',
        'Travel & Entertainment',
        'Office Supplies',
        'Insurance',
        'Training & Education',
        'Communications',
        'Banking & Finance',
        'Taxes & Licenses',
        'Miscellaneous'
      ];

      expectedCategories.forEach(expectedCategory => {
        expect(categoryNames).toContain(expectedCategory);
      });
    });

    test('Should have correct default category properties', async () => {
      const { data: categories } = await testContext.supabase
        .from('expense_categories')
        .select('*')
        .eq('category_name', 'Technology');

      expect(categories.length).toBeGreaterThan(0);
      
      const techCategory = categories[0];
      expect(techCategory.is_tax_deductible).toBe(true);
      expect(techCategory.is_active).toBe(true);
      expect(techCategory.category_level).toBe(1);
    });

    test('Should have non-deductible categories marked correctly', async () => {
      const { data: bankingCategories } = await testContext.supabase
        .from('expense_categories')
        .select('*')
        .eq('category_name', 'Banking & Finance');

      if (bankingCategories.length > 0) {
        expect(bankingCategories[0].is_tax_deductible).toBe(false);
      }

      const { data: taxCategories } = await testContext.supabase
        .from('expense_categories')
        .select('*')
        .eq('category_name', 'Taxes & Licenses');

      if (taxCategories.length > 0) {
        expect(taxCategories[0].is_tax_deductible).toBe(false);
      }
    });
  });

  describe('Custom Expense Categories Creation', () => {
    test('Should allow creating custom expense categories', async () => {
      const { data: customCategory, error } = await testContext.supabase
        .from('expense_categories')
        .insert({
          law_firm_id: testContext.lawFirmId,
          category_name: 'Custom Legal Research',
          description: 'Custom category for legal research expenses',
          is_tax_deductible: true,
          requires_approval: true,
          approval_threshold: 500.00
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(customCategory.category_name).toBe('Custom Legal Research');
      expect(customCategory.is_tax_deductible).toBe(true);
      expect(parseFloat(customCategory.approval_threshold)).toBe(500.00);

      dbHelper.trackRecord('expense_categories', customCategory.id);
    });

    test('Should allow creating hierarchical categories', async () => {
      // Create parent category
      const { data: parentCategory } = await testContext.supabase
        .from('expense_categories')
        .insert({
          law_firm_id: testContext.lawFirmId,
          category_name: 'Legal Software',
          description: 'Software expenses for legal practice',
          category_level: 1,
          is_tax_deductible: true
        })
        .select()
        .single();

      dbHelper.trackRecord('expense_categories', parentCategory.id);

      // Create child category
      const { data: childCategory, error } = await testContext.supabase
        .from('expense_categories')
        .insert({
          law_firm_id: testContext.lawFirmId,
          category_name: 'Case Management Software',
          description: 'Subscription fees for case management platforms',
          parent_category_id: parentCategory.id,
          category_level: 2,
          is_tax_deductible: true
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(childCategory.parent_category_id).toBe(parentCategory.id);
      expect(childCategory.category_level).toBe(2);

      dbHelper.trackRecord('expense_categories', childCategory.id);
    });
  });

  describe('Default Vendor Seed Data', () => {
    test('Should allow creating common vendor types', async () => {
      const commonVendors = [
        {
          vendor_type: 'utility',
          name: 'Electric Company',
          preferred_payment_method: 'bank_transfer',
          payment_terms: '30_days'
        },
        {
          vendor_type: 'service_provider',
          name: 'Cleaning Service',
          preferred_payment_method: 'check',
          payment_terms: '15_days'
        },
        {
          vendor_type: 'supplier',
          name: 'Office Supply Store',
          preferred_payment_method: 'credit_card',
          payment_terms: 'immediate'
        }
      ];

      for (const vendorData of commonVendors) {
        const { data: vendor, error } = await testContext.supabase
          .from('vendors')
          .insert({
            law_firm_id: testContext.lawFirmId,
            ...vendorData,
            vendor_status: 'active'
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(vendor.vendor_type).toBe(vendorData.vendor_type);
        expect(vendor.preferred_payment_method).toBe(vendorData.preferred_payment_method);
        expect(vendor.vendor_status).toBe('active');

        dbHelper.trackRecord('vendors', vendor.id);
      }
    });

    test('Should seed vendors with Brazilian business information', async () => {
      const { data: brazilianVendor, error } = await testContext.supabase
        .from('vendors')
        .insert({
          law_firm_id: testContext.lawFirmId,
          vendor_type: 'service_provider',
          name: 'Consultoria Jurídica Ltda',
          cnpj: dbHelper.generateTestCNPJ(),
          email: 'contato@consultoria.com.br',
          phone: '+55 11 99999-9999',
          address_line1: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP',
          postal_code: '01234-567',
          country: 'BR',
          pix_key: 'consultoria@pix.com.br',
          preferred_payment_method: 'pix',
          vendor_status: 'active'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(brazilianVendor.country).toBe('BR');
      expect(brazilianVendor.state).toBe('SP');
      expect(brazilianVendor.preferred_payment_method).toBe('pix');
      expect(brazilianVendor.pix_key).toBe('consultoria@pix.com.br');

      dbHelper.trackRecord('vendors', brazilianVendor.id);
    });
  });

  describe('Time Entry Templates Seeding', () => {
    test('Should create common time entry templates', async () => {
      const commonTemplates = [
        {
          template_name: 'Client Meeting',
          description: 'Template for client consultation meetings',
          default_entry_type: 'case_work',
          default_task_category: 'Client Communication',
          default_activity_description: 'Client consultation meeting to discuss case strategy',
          default_duration_minutes: 60,
          default_is_billable: true,
          default_location: 'Office'
        },
        {
          template_name: 'Court Hearing',
          description: 'Template for court appearances',
          default_entry_type: 'case_work',
          default_task_category: 'Court Appearance',
          default_activity_description: 'Court hearing attendance',
          default_duration_minutes: 120,
          default_is_billable: true,
          default_location: 'Court'
        },
        {
          template_name: 'Administrative Work',
          description: 'Template for administrative tasks',
          default_entry_type: 'administrative',
          default_task_category: 'Administration',
          default_activity_description: 'Administrative tasks and office management',
          default_duration_minutes: 30,
          default_is_billable: false,
          default_location: 'Office'
        }
      ];

      for (const templateData of commonTemplates) {
        const { data: template, error } = await testContext.supabase
          .from('time_entry_templates')
          .insert({
            law_firm_id: testContext.lawFirmId,
            user_id: testContext.userId,
            ...templateData,
            is_shared: true,
            is_active: true
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(template.template_name).toBe(templateData.template_name);
        expect(template.default_entry_type).toBe(templateData.default_entry_type);
        expect(template.is_shared).toBe(true);
        expect(template.is_active).toBe(true);

        dbHelper.trackRecord('time_entry_templates', template.id);
      }
    });

    test('Should create personal and shared templates', async () => {
      // Personal template
      const { data: personalTemplate } = await testContext.supabase
        .from('time_entry_templates')
        .insert({
          law_firm_id: testContext.lawFirmId,
          user_id: testContext.userId,
          template_name: 'Personal Research',
          description: 'Personal template for legal research',
          default_entry_type: 'case_work',
          default_activity_description: 'Legal research and case preparation',
          is_shared: false,
          is_active: true
        })
        .select()
        .single();

      dbHelper.trackRecord('time_entry_templates', personalTemplate.id);

      // Shared template
      const { data: sharedTemplate } = await testContext.supabase
        .from('time_entry_templates')
        .insert({
          law_firm_id: testContext.lawFirmId,
          user_id: null, // Shared template not owned by specific user
          template_name: 'Document Review',
          description: 'Shared template for document review tasks',
          default_entry_type: 'case_work',
          default_activity_description: 'Document review and analysis',
          is_shared: true,
          is_active: true
        })
        .select()
        .single();

      expect(personalTemplate.is_shared).toBe(false);
      expect(personalTemplate.user_id).toBe(testContext.userId);
      
      expect(sharedTemplate.is_shared).toBe(true);
      expect(sharedTemplate.user_id).toBeNull();

      dbHelper.trackRecord('time_entry_templates', sharedTemplate.id);
    });
  });

  describe('Lawyer Billing Rates Seeding', () => {
    test('Should seed standard billing rates for lawyers', async () => {
      const billingRates = [
        {
          rate_type: 'standard',
          hourly_rate: 250.00,
          effective_from: '2024-01-01',
          is_active: true,
          notes: 'Standard hourly rate for senior associate'
        },
        {
          rate_type: 'service_specific',
          hourly_rate: 300.00,
          service_type: 'litigation',
          effective_from: '2024-01-01',
          is_active: true,
          notes: 'Premium rate for litigation work'
        },
        {
          rate_type: 'service_specific',
          hourly_rate: 200.00,
          service_type: 'consultation',
          effective_from: '2024-01-01',
          is_active: true,
          notes: 'Standard rate for client consultations'
        }
      ];

      for (const rateData of billingRates) {
        const { data: rate, error } = await testContext.supabase
          .from('lawyer_billing_rates')
          .insert({
            law_firm_id: testContext.lawFirmId,
            user_id: testContext.userId,
            ...rateData
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(rate.rate_type).toBe(rateData.rate_type);
        expect(parseFloat(rate.hourly_rate)).toBe(rateData.hourly_rate);
        expect(rate.is_active).toBe(true);

        dbHelper.trackRecord('lawyer_billing_rates', rate.id);
      }
    });

    test('Should handle rate history and effective dates', async () => {
      // Old rate (inactive)
      const { data: oldRate } = await testContext.supabase
        .from('lawyer_billing_rates')
        .insert({
          law_firm_id: testContext.lawFirmId,
          user_id: testContext.userId,
          rate_type: 'standard',
          hourly_rate: 200.00,
          effective_from: '2023-01-01',
          effective_until: '2023-12-31',
          is_active: false,
          notes: 'Previous year rate'
        })
        .select()
        .single();

      dbHelper.trackRecord('lawyer_billing_rates', oldRate.id);

      // Current rate (active)
      const { data: currentRate } = await testContext.supabase
        .from('lawyer_billing_rates')
        .insert({
          law_firm_id: testContext.lawFirmId,
          user_id: testContext.userId,
          rate_type: 'standard',
          hourly_rate: 250.00,
          effective_from: '2024-01-01',
          is_active: true,
          notes: 'Current rate'
        })
        .select()
        .single();

      expect(oldRate.is_active).toBe(false);
      expect(oldRate.effective_until).toBe('2023-12-31');
      
      expect(currentRate.is_active).toBe(true);
      expect(currentRate.effective_until).toBeNull();

      dbHelper.trackRecord('lawyer_billing_rates', currentRate.id);
    });
  });

  describe('Invoice Templates Seeding', () => {
    test('Should create standard invoice templates', async () => {
      const invoiceTemplates = [
        {
          template_name: 'Standard Legal Services',
          template_type: 'case_billing',
          subject_template: 'Invoice for Legal Services - Case #{case_number}',
          description_template: 'Professional legal services rendered for {client_name}',
          terms_and_conditions: 'Payment due within 30 days. Late payments subject to 1.5% monthly interest.',
          default_payment_terms: '30_days',
          default_due_days: 30,
          email_subject: 'Invoice #{invoice_number} - Legal Services',
          email_template: 'Dear {client_name}, Please find attached your invoice for legal services rendered.',
          is_active: true,
          is_default: true
        },
        {
          template_name: 'Monthly Subscription',
          template_type: 'subscription',
          subject_template: 'Monthly Legal Services Subscription - {month} {year}',
          description_template: 'Monthly subscription fee for ongoing legal services',
          terms_and_conditions: 'Subscription fee due on the 1st of each month.',
          default_payment_terms: 'immediate',
          default_due_days: 5,
          auto_generate: true,
          auto_send: true,
          email_subject: 'Monthly Subscription Invoice - {month} {year}',
          email_template: 'Your monthly subscription invoice is now available.',
          is_active: true
        }
      ];

      for (const templateData of invoiceTemplates) {
        const { data: template, error } = await testContext.supabase
          .from('invoice_templates')
          .insert({
            law_firm_id: testContext.lawFirmId,
            ...templateData
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(template.template_name).toBe(templateData.template_name);
        expect(template.template_type).toBe(templateData.template_type);
        expect(template.is_active).toBe(true);

        dbHelper.trackRecord('invoice_templates', template.id);
      }
    });

    test('Should create payment plan invoice template', async () => {
      const { data: paymentPlanTemplate, error } = await testContext.supabase
        .from('invoice_templates')
        .insert({
          law_firm_id: testContext.lawFirmId,
          template_name: 'Payment Plan Installment',
          template_type: 'payment_plan',
          subject_template: 'Payment Plan Installment #{installment_number} of {total_installments}',
          description_template: 'Installment payment for case services',
          terms_and_conditions: 'This is installment {installment_number} of {total_installments}. Late payments may result in payment plan cancellation.',
          default_payment_terms: '30_days',
          default_due_days: 30,
          default_late_fee_rate: 0.015, // 1.5% monthly
          send_reminder_days: [7, 3, 1],
          email_subject: 'Payment Plan Installment Due - {due_date}',
          email_template: 'Your payment plan installment is due on {due_date}. Please remit payment to avoid late fees.',
          is_active: true
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(paymentPlanTemplate.template_type).toBe('payment_plan');
      expect(parseFloat(paymentPlanTemplate.default_late_fee_rate)).toBe(0.015);
      expect(paymentPlanTemplate.send_reminder_days).toEqual([7, 3, 1]);

      dbHelper.trackRecord('invoice_templates', paymentPlanTemplate.id);
    });
  });

  describe('Brazilian Legal System Defaults', () => {
    test('Should seed Brazilian court types and jurisdictions', async () => {
      // This would typically be in a separate courts or jurisdictions table
      // For now, we'll test that vendor types support government entities
      const { data: courtVendor, error } = await testContext.supabase
        .from('vendors')
        .insert({
          law_firm_id: testContext.lawFirmId,
          vendor_type: 'government',
          name: 'Tribunal de Justiça de São Paulo',
          cnpj: '12.345.678/0001-90',
          email: 'protocolo@tjsp.jus.br',
          address_line1: 'Praça da Sé, s/n',
          city: 'São Paulo',
          state: 'SP',
          postal_code: '01001-000',
          country: 'BR',
          preferred_payment_method: 'bank_transfer',
          payment_terms: 'immediate',
          vendor_status: 'active'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(courtVendor.vendor_type).toBe('government');
      expect(courtVendor.country).toBe('BR');
      expect(courtVendor.state).toBe('SP');

      dbHelper.trackRecord('vendors', courtVendor.id);
    });

    test('Should support Brazilian payment methods', async () => {
      const { data: pixVendor } = await testContext.supabase
        .from('vendors')
        .insert({
          law_firm_id: testContext.lawFirmId,
          vendor_type: 'service_provider',
          name: 'Serviços de TI Ltda',
          cnpj: dbHelper.generateTestCNPJ(),
          pix_key: '+5511999999999',
          preferred_payment_method: 'pix',
          vendor_status: 'active'
        })
        .select()
        .single();

      expect(pixVendor.preferred_payment_method).toBe('pix');
      expect(pixVendor.pix_key).toBe('+5511999999999');

      dbHelper.trackRecord('vendors', pixVendor.id);
    });
  });

  describe('Seed Data Validation', () => {
    test('Should validate seeded expense categories integrity', async () => {
      const { data: categories } = await testContext.supabase
        .from('expense_categories')
        .select('*');

      categories.forEach(category => {
        expect(category.category_name).toBeTruthy();
        expect(typeof category.is_tax_deductible).toBe('boolean');
        expect(typeof category.is_active).toBe('boolean');
        expect(category.category_level).toBeGreaterThan(0);
      });
    });

    test('Should validate seeded templates functionality', async () => {
      const { data: templates } = await testContext.supabase
        .from('time_entry_templates')
        .select('*')
        .eq('law_firm_id', testContext.lawFirmId);

      templates.forEach(template => {
        expect(template.template_name).toBeTruthy();
        expect(['case_work', 'subscription_work', 'administrative'].includes(template.default_entry_type)).toBe(true);
        expect(typeof template.is_active).toBe('boolean');
        expect(typeof template.is_shared).toBe('boolean');
      });
    });

    test('Should validate billing rates setup', async () => {
      const { data: rates } = await testContext.supabase
        .from('lawyer_billing_rates')
        .select('*')
        .eq('law_firm_id', testContext.lawFirmId);

      rates.forEach(rate => {
        expect(['standard', 'matter_specific', 'client_specific', 'service_specific'].includes(rate.rate_type)).toBe(true);
        expect(parseFloat(rate.hourly_rate)).toBeGreaterThan(0);
        expect(rate.effective_from).toBeTruthy();
        expect(typeof rate.is_active).toBe('boolean');
      });
    });
  });

  describe('Seed Data Performance', () => {
    test('Should efficiently create bulk seed data', async () => {
      const startTime = Date.now();

      // Create multiple expense categories at once
      const categoryPromises = Array.from({ length: 10 }, (_, i) =>
        testContext.supabase
          .from('expense_categories')
          .insert({
            law_firm_id: testContext.lawFirmId,
            category_name: `Bulk Category ${i + 1}`,
            description: `Test category ${i + 1}`,
            is_tax_deductible: true,
            is_active: true
          })
          .select()
          .single()
      );

      const results = await Promise.all(categoryPromises);
      results.forEach(result => {
        if (result.data) {
          dbHelper.trackRecord('expense_categories', result.data.id);
        }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});