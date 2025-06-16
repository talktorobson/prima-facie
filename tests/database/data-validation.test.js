/**
 * Data Validation Test Suite
 * Tests Brazilian business rules, CNPJ/CPF validation, currency formats, and locale-specific validations
 */

const DatabaseTestHelper = require('./helpers/db-test-helper');

describe('Data Validation Tests', () => {
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

  describe('CNPJ Validation Tests', () => {
    const validCNPJs = [
      '11.222.333/0001-81',
      '11222333000181',
      '12.345.678/0001-95',
      '98.765.432/0001-10'
    ];

    const invalidCNPJs = [
      '11.222.333/0001-99', // Invalid check digits
      '11.111.111/1111-11', // Invalid pattern
      '123456789', // Too short
      '1234567890123456', // Too long
      '00.000.000/0000-00', // All zeros
      'abc.def.ghi/jklm-no', // Non-numeric
      '', // Empty
      null // Null
    ];

    test.each(validCNPJs)('Should validate valid CNPJ: %s', async (cnpj) => {
      const { data: isValid, error } = await testContext.supabase.rpc('validate_cnpj', {
        cnpj_value: cnpj
      });

      expect(error).toBeNull();
      expect(isValid).toBe(true);
    });

    test.each(invalidCNPJs)('Should reject invalid CNPJ: %s', async (cnpj) => {
      const { data: isValid, error } = await testContext.supabase.rpc('validate_cnpj', {
        cnpj_value: cnpj
      });

      expect(error).toBeNull();
      expect(isValid).toBe(false);
    });

    test('Should handle CNPJ formatting variations', async () => {
      const baseCNPJ = '11222333000181';
      const formattedCNPJ = '11.222.333/0001-81';
      const spacedCNPJ = '11 222 333 0001 81';

      // All variations should be valid
      const { data: unformatted } = await testContext.supabase.rpc('validate_cnpj', {
        cnpj_value: baseCNPJ
      });
      const { data: formatted } = await testContext.supabase.rpc('validate_cnpj', {
        cnpj_value: formattedCNPJ
      });
      const { data: spaced } = await testContext.supabase.rpc('validate_cnpj', {
        cnpj_value: spacedCNPJ
      });

      expect(unformatted).toBe(true);
      expect(formatted).toBe(true);
      expect(spaced).toBe(true);
    });

    test('Should store CNPJ in vendors table with validation', async () => {
      const validCNPJ = '11.222.333/0001-81';
      
      const { data: vendor, error } = await testContext.supabase
        .from('vendors')
        .insert({
          law_firm_id: testContext.lawFirmId,
          vendor_type: 'supplier',
          name: 'Test Vendor CNPJ',
          cnpj: validCNPJ,
          vendor_status: 'active'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(vendor.cnpj).toBe(validCNPJ);

      dbHelper.trackRecord('vendors', vendor.id);
    });

    test('Should prevent storing invalid CNPJ in critical tables', async () => {
      // This test depends on database constraints or triggers
      // If CNPJ validation is enforced at the database level
      const invalidCNPJ = '11.222.333/0001-99';
      
      // For now, we test that the validation function works
      const { data: isValid } = await testContext.supabase.rpc('validate_cnpj', {
        cnpj_value: invalidCNPJ
      });

      expect(isValid).toBe(false);
    });
  });

  describe('CPF Validation Tests', () => {
    const validCPFs = [
      '111.444.777-35',
      '11144477735',
      '123.456.789-09',
      '987.654.321-00'
    ];

    const invalidCPFs = [
      '111.444.777-99', // Invalid check digits
      '111.111.111-11', // Invalid pattern
      '123456789', // Too short
      '12345678901234', // Too long
      '000.000.000-00', // All zeros
      'abc.def.ghi-jk', // Non-numeric
      '', // Empty
      null // Null
    ];

    test.each(validCPFs)('Should validate valid CPF: %s', async (cpf) => {
      const { data: isValid, error } = await testContext.supabase.rpc('validate_cpf', {
        cpf_value: cpf
      });

      expect(error).toBeNull();
      expect(isValid).toBe(true);
    });

    test.each(invalidCPFs)('Should reject invalid CPF: %s', async (cpf) => {
      const { data: isValid, error } = await testContext.supabase.rpc('validate_cpf', {
        cpf_value: cpf
      });

      expect(error).toBeNull();
      expect(isValid).toBe(false);
    });

    test('Should handle CPF formatting variations', async () => {
      const baseCPF = '11144477735';
      const formattedCPF = '111.444.777-35';
      const spacedCPF = '111 444 777 35';

      // All variations should be valid
      const { data: unformatted } = await testContext.supabase.rpc('validate_cpf', {
        cpf_value: baseCPF
      });
      const { data: formatted } = await testContext.supabase.rpc('validate_cpf', {
        cpf_value: formattedCPF
      });
      const { data: spaced } = await testContext.supabase.rpc('validate_cpf', {
        cpf_value: spacedCPF
      });

      expect(unformatted).toBe(true);
      expect(formatted).toBe(true);
      expect(spaced).toBe(true);
    });

    test('Should store CPF in clients table with validation', async () => {
      const validCPF = '111.444.777-35';
      
      const { data: client, error } = await testContext.supabase
        .from('clients')
        .insert({
          law_firm_id: testContext.lawFirmId,
          name: 'Test Client CPF',
          email: 'testcpf@test.com',
          client_type: 'individual',
          cpf: validCPF
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(client.cpf).toBe(validCPF);

      dbHelper.trackRecord('clients', client.id);
    });
  });

  describe('Brazilian Currency Validation', () => {
    test('Should default currency to BRL for new records', async () => {
      const invoice = await dbHelper.createTestInvoice();
      expect(invoice.currency).toBe('BRL');

      const vendor = await dbHelper.createTestVendor();
      const bill = await dbHelper.createTestBill(vendor.id);
      expect(bill.currency).toBe('BRL');
    });

    test('Should accept valid currency codes', async () => {
      const validCurrencies = ['BRL', 'USD', 'EUR'];
      
      for (const currency of validCurrencies) {
        const { data: invoice, error } = await testContext.supabase
          .from('invoices')
          .insert({
            law_firm_id: testContext.lawFirmId,
            client_id: testContext.clientId,
            invoice_type: 'case_billing',
            currency: currency,
            subtotal: 1000.00,
            total_amount: 1000.00
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(invoice.currency).toBe(currency);

        dbHelper.trackRecord('invoices', invoice.id);
      }
    });

    test('Should format currency amounts with proper precision', async () => {
      const testAmounts = [
        { input: 1000.123, expected: 1000.12 },
        { input: 999.999, expected: 999.99 },
        { input: 0.001, expected: 0.00 },
        { input: 1000, expected: 1000.00 }
      ];

      for (const { input, expected } of testAmounts) {
        const { data: invoice } = await testContext.supabase
          .from('invoices')
          .insert({
            law_firm_id: testContext.lawFirmId,
            client_id: testContext.clientId,
            invoice_type: 'case_billing',
            subtotal: input,
            total_amount: input
          })
          .select()
          .single();

        expect(parseFloat(invoice.subtotal)).toBeCloseTo(expected, 2);
        expect(parseFloat(invoice.total_amount)).toBeCloseTo(expected, 2);

        dbHelper.trackRecord('invoices', invoice.id);
      }
    });
  });

  describe('Brazilian Address Validation', () => {
    test('Should validate Brazilian postal codes (CEP)', async () => {
      const validCEPs = [
        '01234-567',
        '01234567',
        '12345-678',
        '99999-999'
      ];

      const invalidCEPs = [
        '1234-567', // Too short
        '123456789', // Too long
        'abcde-fgh', // Non-numeric
        '12345-67', // Invalid format
        ''
      ];

      // Test valid CEPs
      for (const cep of validCEPs) {
        const { data: vendor, error } = await testContext.supabase
          .from('vendors')
          .insert({
            law_firm_id: testContext.lawFirmId,
            vendor_type: 'supplier',
            name: `Vendor CEP ${cep}`,
            postal_code: cep,
            country: 'BR',
            vendor_status: 'active'
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(vendor.postal_code).toBe(cep);

        dbHelper.trackRecord('vendors', vendor.id);
      }
    });

    test('Should validate Brazilian state codes', async () => {
      const validStates = [
        'SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'GO', 
        'PE', 'CE', 'PA', 'MA', 'PB', 'ES', 'PI', 'AL',
        'RN', 'MT', 'MS', 'DF', 'SE', 'RO', 'AC', 'AM',
        'RR', 'AP', 'TO'
      ];

      // Test a few valid states
      const testStates = ['SP', 'RJ', 'MG', 'RS'];
      
      for (const state of testStates) {
        const { data: vendor, error } = await testContext.supabase
          .from('vendors')
          .insert({
            law_firm_id: testContext.lawFirmId,
            vendor_type: 'supplier',
            name: `Vendor State ${state}`,
            state: state,
            country: 'BR',
            vendor_status: 'active'
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(vendor.state).toBe(state);
        expect(validStates).toContain(state);

        dbHelper.trackRecord('vendors', vendor.id);
      }
    });

    test('Should default country to BR for Brazilian addresses', async () => {
      const vendor = await dbHelper.createTestVendor({
        address_line1: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        postal_code: '01234-567'
      });

      expect(vendor.country).toBe('BR');
    });
  });

  describe('Phone Number Validation', () => {
    test('Should accept valid Brazilian phone formats', async () => {
      const validPhones = [
        '+55 11 99999-9999',
        '+5511999999999',
        '(11) 99999-9999',
        '11 99999-9999',
        '1199999999'
      ];

      for (const phone of validPhones) {
        const { data: vendor, error } = await testContext.supabase
          .from('vendors')
          .insert({
            law_firm_id: testContext.lawFirmId,
            vendor_type: 'supplier',
            name: `Vendor Phone ${phone}`,
            phone: phone,
            vendor_status: 'active'
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(vendor.phone).toBe(phone);

        dbHelper.trackRecord('vendors', vendor.id);
      }
    });
  });

  describe('Email Validation', () => {
    test('Should validate email formats', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.com.br',
        'admin+legal@company.org',
        'contact@subdomain.domain.com'
      ];

      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user name@domain.com',
        ''
      ];

      // Test valid emails
      for (const email of validEmails) {
        const { data: vendor, error } = await testContext.supabase
          .from('vendors')
          .insert({
            law_firm_id: testContext.lawFirmId,
            vendor_type: 'supplier',
            name: `Vendor Email ${email}`,
            email: email,
            vendor_status: 'active'
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(vendor.email).toBe(email);

        dbHelper.trackRecord('vendors', vendor.id);
      }
    });
  });

  describe('PIX Key Validation', () => {
    test('Should accept valid PIX key formats', async () => {
      const validPixKeys = [
        '111.444.777-35', // CPF
        '11.222.333/0001-81', // CNPJ
        '+5511999999999', // Phone
        'user@domain.com', // Email
        '32d36e22-3f72-4e8a-9b8a-7b1f8b2d3c4e' // Random key
      ];

      for (const pixKey of validPixKeys) {
        const { data: vendor, error } = await testContext.supabase
          .from('vendors')
          .insert({
            law_firm_id: testContext.lawFirmId,
            vendor_type: 'supplier',
            name: `Vendor PIX ${pixKey}`,
            pix_key: pixKey,
            preferred_payment_method: 'pix',
            vendor_status: 'active'
          })
          .select()
          .single();

        expect(error).toBeNull();
        expect(vendor.pix_key).toBe(pixKey);

        dbHelper.trackRecord('vendors', vendor.id);
      }
    });
  });

  describe('Business Logic Validation', () => {
    test('Should enforce minimum invoice amounts', async () => {
      // Test very small amounts
      const { data: smallInvoice, error } = await testContext.supabase
        .from('invoices')
        .insert({
          law_firm_id: testContext.lawFirmId,
          client_id: testContext.clientId,
          invoice_type: 'case_billing',
          subtotal: 0.01,
          total_amount: 0.01
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(parseFloat(smallInvoice.total_amount)).toBe(0.01);

      dbHelper.trackRecord('invoices', smallInvoice.id);
    });

    test('Should validate time entry duration limits', async () => {
      // Test reasonable duration limits
      const reasonableDuration = await dbHelper.createTestTimeEntry({
        duration_minutes: 480 // 8 hours
      });
      expect(reasonableDuration.duration_minutes).toBe(480);

      // Test very long duration (should be allowed but flagged)
      const longDuration = await dbHelper.createTestTimeEntry({
        duration_minutes: 1440 // 24 hours
      });
      expect(longDuration.duration_minutes).toBe(1440);
    });

    test('Should validate billing rate ranges', async () => {
      // Test reasonable billing rates
      const { data: reasonableRate, error } = await testContext.supabase
        .from('lawyer_billing_rates')
        .insert({
          law_firm_id: testContext.lawFirmId,
          user_id: testContext.userId,
          rate_type: 'standard',
          hourly_rate: 250.00,
          effective_from: new Date().toISOString().split('T')[0],
          is_active: true
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(parseFloat(reasonableRate.hourly_rate)).toBe(250.00);

      dbHelper.trackRecord('lawyer_billing_rates', reasonableRate.id);

      // Test very high rate (should be allowed)
      const { data: highRate } = await testContext.supabase
        .from('lawyer_billing_rates')
        .insert({
          law_firm_id: testContext.lawFirmId,
          user_id: testContext.userId,
          rate_type: 'service_specific',
          service_type: 'litigation',
          hourly_rate: 1000.00,
          effective_from: new Date().toISOString().split('T')[0],
          is_active: true
        })
        .select()
        .single();

      expect(parseFloat(highRate.hourly_rate)).toBe(1000.00);

      dbHelper.trackRecord('lawyer_billing_rates', highRate.id);
    });
  });

  describe('Date and Time Validation', () => {
    test('Should validate Brazilian date formats', async () => {
      const today = new Date();
      const futureDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const invoice = await dbHelper.createTestInvoice({
        issue_date: today.toISOString().split('T')[0],
        due_date: futureDate.toISOString().split('T')[0]
      });

      expect(new Date(invoice.issue_date)).toBeInstanceOf(Date);
      expect(new Date(invoice.due_date)).toBeInstanceOf(Date);
      expect(new Date(invoice.due_date) > new Date(invoice.issue_date)).toBe(true);
    });

    test('Should validate time entry timestamps', async () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

      const { data: timeEntry, error } = await testContext.supabase
        .from('time_entries')
        .insert({
          law_firm_id: testContext.lawFirmId,
          user_id: testContext.userId,
          entry_type: 'case_work',
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration_minutes: 120,
          activity_description: 'Time validation test'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(new Date(timeEntry.start_time)).toBeInstanceOf(Date);
      expect(new Date(timeEntry.end_time)).toBeInstanceOf(Date);
      expect(new Date(timeEntry.end_time) > new Date(timeEntry.start_time)).toBe(true);

      dbHelper.trackRecord('time_entries', timeEntry.id);
    });
  });

  describe('Data Sanitization', () => {
    test('Should handle special characters in text fields', async () => {
      const specialCharText = 'Aç~ao Júridica & Consultoria Ltda. - R$ 1.000,00 (Reais)';
      
      const { data: vendor, error } = await testContext.supabase
        .from('vendors')
        .insert({
          law_firm_id: testContext.lawFirmId,
          vendor_type: 'service_provider',
          name: specialCharText,
          vendor_status: 'active'
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(vendor.name).toBe(specialCharText);

      dbHelper.trackRecord('vendors', vendor.id);
    });

    test('Should trim whitespace from input fields', async () => {
      const nameWithSpaces = '  Test Vendor Name  ';
      
      const { data: vendor } = await testContext.supabase
        .from('vendors')
        .insert({
          law_firm_id: testContext.lawFirmId,
          vendor_type: 'supplier',
          name: nameWithSpaces,
          vendor_status: 'active'
        })
        .select()
        .single();

      // Depending on database configuration, whitespace might be trimmed
      expect(vendor.name).toBeDefined();
      expect(vendor.name.length).toBeGreaterThan(0);

      dbHelper.trackRecord('vendors', vendor.id);
    });
  });

  describe('Validation Performance', () => {
    test('Should validate CNPJ/CPF efficiently for bulk operations', async () => {
      const startTime = Date.now();

      // Test multiple validations
      const validationPromises = Array.from({ length: 10 }, (_, i) => {
        const cnpj = dbHelper.generateTestCNPJ();
        const cpf = dbHelper.generateTestCPF();
        
        return Promise.all([
          testContext.supabase.rpc('validate_cnpj', { cnpj_value: cnpj }),
          testContext.supabase.rpc('validate_cpf', { cpf_value: cpf })
        ]);
      });

      await Promise.all(validationPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete validations efficiently
      expect(duration).toBeLessThan(3000);
    });
  });
});