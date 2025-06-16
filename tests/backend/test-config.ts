/**
 * Backend API Test Configuration
 * Configuration for running comprehensive backend API tests
 */

export const testConfig = {
  // Test environment settings
  environment: {
    nodeEnv: process.env.NODE_ENV || 'test',
    apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || 'test-service-key'
  },

  // Test database settings
  database: {
    testSchema: 'test_schema',
    isolateTests: true,
    cleanupAfterEach: true,
    seedTestData: true,
    resetSequences: true
  },

  // Authentication settings for tests
  auth: {
    testUsers: {
      admin: {
        email: 'admin@testfirm.com',
        password: 'AdminPassword123!',
        role: 'admin',
        permissions: ['*']
      },
      lawyer: {
        email: 'lawyer@testfirm.com',
        password: 'LawyerPassword123!',
        role: 'lawyer',
        permissions: ['view_clients', 'create_invoices', 'track_time']
      },
      assistant: {
        email: 'assistant@testfirm.com',
        password: 'AssistantPassword123!',
        role: 'assistant',
        permissions: ['view_clients', 'view_matters']
      }
    },
    testTokens: {
      validToken: 'test-valid-token-123',
      expiredToken: 'test-expired-token-456',
      invalidToken: 'test-invalid-token-789'
    }
  },

  // Test data configuration
  testData: {
    lawFirm: {
      id: 'test-law-firm-id',
      name: 'Test Law Firm LTDA',
      cnpj: '12.345.678/0001-90',
      email: 'contato@testlawfirm.com.br',
      phone: '+55 11 99999-9999'
    },
    clients: {
      individual: {
        id: 'test-individual-client-id',
        name: 'João da Silva',
        email: 'joao@exemplo.com',
        cpf: '123.456.789-09',
        client_type: 'individual'
      },
      company: {
        id: 'test-company-client-id',
        name: 'Empresa Teste LTDA',
        email: 'contato@empresateste.com',
        cnpj: '98.765.432/0001-10',
        client_type: 'company'
      }
    },
    vendor: {
      id: 'test-vendor-id',
      name: 'Fornecedor Teste LTDA',
      cnpj: '11.222.333/0001-81',
      email: 'fornecedor@teste.com',
      vendor_type: 'service_provider'
    }
  },

  // Payment processing test configuration
  payments: {
    mockGateways: {
      primary: 'https://api.primarygateway.com',
      secondary: 'https://api.secondarygateway.com'
    },
    testCards: {
      validVisa: '4111111111111111',
      validMastercard: '5555555555554444',
      declinedCard: '4000000000000002',
      expiredCard: '4000000000000069'
    },
    pixKeys: {
      email: 'test@exemplo.com',
      cpf: '123.456.789-09',
      cnpj: '12.345.678/0001-90',
      phone: '+5511999999999',
      random: '123e4567-e89b-12d3-a456-426614174000'
    }
  },

  // Brazilian compliance test data
  compliance: {
    validCPFs: [
      '12345678909',
      '11144477735',
      '22233344456'
    ],
    invalidCPFs: [
      '12345678900',
      '11111111111',
      '00000000000'
    ],
    validCNPJs: [
      '11222333000181',
      '12345678000195',
      '98765432000123'
    ],
    invalidCNPJs: [
      '11222333000180',
      '11111111111111',
      '00000000000000'
    ],
    bankCodes: {
      '001': 'Banco do Brasil',
      '033': 'Banco Santander',
      '104': 'Caixa Econômica Federal',
      '237': 'Banco Bradesco',
      '341': 'Banco Itaú',
      '356': 'Banco Real',
      '389': 'Banco Mercantil',
      '422': 'Banco Safra'
    }
  },

  // Test timeouts and performance thresholds
  performance: {
    timeouts: {
      default: 10000,      // 10 seconds
      database: 5000,      // 5 seconds
      api: 3000,           // 3 seconds
      payment: 15000,      // 15 seconds
      fileUpload: 30000    // 30 seconds
    },
    thresholds: {
      apiResponseTime: 2000,    // 2 seconds max
      databaseQueryTime: 1000,  // 1 second max
      concurrentRequests: 50,   // Max concurrent requests for load testing
      maxPayloadSize: 10485760  // 10MB max payload
    }
  },

  // Rate limiting configuration for tests
  rateLimiting: {
    requests: {
      general: 100,        // Requests per minute
      auth: 5,            // Login attempts per minute
      payments: 10,       // Payment requests per minute
      uploads: 20         // File uploads per minute
    },
    windows: {
      general: 60000,     // 1 minute
      auth: 300000,       // 5 minutes
      payments: 60000,    // 1 minute
      uploads: 60000      // 1 minute
    }
  },

  // Error handling configuration
  errorHandling: {
    retryAttempts: 3,
    retryDelay: 1000,
    exponentialBackoff: true,
    circuitBreakerThreshold: 5,
    circuitBreakerResetTime: 30000
  },

  // Security test configuration
  security: {
    sqlInjectionPayloads: [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; SELECT * FROM sensitive_data; --",
      "' UNION SELECT * FROM users --"
    ],
    xssPayloads: [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert(1)>',
      'javascript:alert("XSS")',
      '<svg onload=alert(1)>'
    ],
    invalidTokens: [
      'Bearer invalid-token',
      'Bearer ',
      'Invalid-Auth-Header',
      ''
    ]
  },

  // File upload test configuration
  fileUploads: {
    allowedTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxSize: 10485760, // 10MB
    testFiles: {
      validPDF: Buffer.from('%PDF-1.4 test content'),
      invalidFile: Buffer.from('invalid file content'),
      largeFile: Buffer.alloc(50 * 1024 * 1024), // 50MB
      emptyFile: Buffer.alloc(0)
    }
  },

  // Webhook test configuration
  webhooks: {
    testEndpoints: [
      'http://localhost:3001/webhook/payment',
      'http://localhost:3001/webhook/invoice',
      'http://localhost:3001/webhook/notification'
    ],
    secretKeys: {
      payment: 'webhook-secret-payment-123',
      invoice: 'webhook-secret-invoice-456',
      notification: 'webhook-secret-notification-789'
    },
    retryPolicy: {
      maxAttempts: 3,
      backoffMultiplier: 2,
      initialDelay: 1000
    }
  },

  // Notification test configuration
  notifications: {
    channels: ['email', 'sms', 'push', 'webhook'],
    templates: {
      invoiceCreated: 'invoice-created-template',
      paymentReceived: 'payment-received-template',
      documentUploaded: 'document-uploaded-template'
    },
    providers: {
      email: 'sendgrid',
      sms: 'twilio',
      push: 'firebase'
    }
  },

  // Reporting test configuration
  reporting: {
    formats: ['json', 'csv', 'pdf', 'xlsx'],
    types: [
      'financial-summary',
      'time-tracking',
      'client-activity',
      'invoice-aging',
      'payment-history'
    ],
    dateRanges: {
      currentMonth: { days: 30 },
      currentQuarter: { days: 90 },
      currentYear: { days: 365 }
    }
  },

  // Test suite configuration
  suites: {
    unit: {
      pattern: '**/*.test.ts',
      timeout: 5000,
      parallel: true
    },
    integration: {
      pattern: '**/integration/*.test.ts',
      timeout: 15000,
      parallel: false
    },
    e2e: {
      pattern: '**/e2e/*.test.ts',
      timeout: 30000,
      parallel: false
    },
    load: {
      pattern: '**/load/*.test.ts',
      timeout: 120000,
      parallel: false
    }
  },

  // Cleanup configuration
  cleanup: {
    cleanupOrder: [
      'invoice_payments',
      'invoice_line_items',
      'invoices',
      'bill_payments',
      'bills',
      'time_entries',
      'active_time_sessions',
      'matters',
      'client_subscriptions',
      'clients',
      'vendors',
      'expense_categories',
      'users',
      'law_firms'
    ],
    preserveTestData: false,
    cleanupTimeout: 30000
  }
}

// Helper functions for test configuration
export const getTestUser = (role: string) => {
  return testConfig.auth.testUsers[role as keyof typeof testConfig.auth.testUsers]
}

export const getTestData = (entity: string) => {
  return testConfig.testData[entity as keyof typeof testConfig.testData]
}

export const getPerformanceThreshold = (metric: string) => {
  return testConfig.performance.thresholds[metric as keyof typeof testConfig.performance.thresholds]
}

export const getRateLimitConfig = (endpoint: string) => {
  return {
    requests: testConfig.rateLimiting.requests[endpoint as keyof typeof testConfig.rateLimiting.requests],
    window: testConfig.rateLimiting.windows[endpoint as keyof typeof testConfig.rateLimiting.windows]
  }
}

export default testConfig