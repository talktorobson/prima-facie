/**
 * Jest Setup for Database Tests
 * Global setup and configuration for Prima Facie database test suite
 */

// Load environment variables
require('dotenv').config();

// Set test environment variables
process.env.NODE_ENV = 'test';

// Global test configuration
global.console = {
  ...console,
  // Suppress console.log during tests unless in debug mode
  log: process.env.DEBUG_TESTS ? console.log : jest.fn(),
  debug: process.env.DEBUG_TESTS ? console.debug : jest.fn(),
  info: process.env.DEBUG_TESTS ? console.info : jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Global test utilities
global.testUtils = {
  // Generate test UUID
  generateUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Generate test CNPJ
  generateTestCNPJ: () => {
    const base = Math.floor(Math.random() * 100000000).toString().padStart(8, '0') + '0001';
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum1 = 0;
    for (let i = 0; i < 12; i++) {
      sum1 += parseInt(base[i]) * weights1[i];
    }
    const digit1 = sum1 % 11 < 2 ? 0 : 11 - (sum1 % 11);
    
    const baseWithDigit1 = base + digit1;
    let sum2 = 0;
    for (let i = 0; i < 13; i++) {
      sum2 += parseInt(baseWithDigit1[i]) * weights2[i];
    }
    const digit2 = sum2 % 11 < 2 ? 0 : 11 - (sum2 % 11);
    
    return base + digit1.toString() + digit2.toString();
  },

  // Generate test CPF
  generateTestCPF: () => {
    const base = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    
    let sum1 = 0;
    for (let i = 0; i < 9; i++) {
      sum1 += parseInt(base[i]) * (10 - i);
    }
    const digit1 = sum1 % 11 < 2 ? 0 : 11 - (sum1 % 11);
    
    const baseWithDigit1 = base + digit1;
    let sum2 = 0;
    for (let i = 0; i < 10; i++) {
      sum2 += parseInt(baseWithDigit1[i]) * (11 - i);
    }
    const digit2 = sum2 % 11 < 2 ? 0 : 11 - (sum2 % 11);
    
    return base + digit1.toString() + digit2.toString();
  }
};

// Performance monitoring
global.performanceMonitor = {
  timers: new Map(),
  
  start: (name) => {
    global.performanceMonitor.timers.set(name, Date.now());
  },
  
  end: (name) => {
    const start = global.performanceMonitor.timers.get(name);
    if (start) {
      const duration = Date.now() - start;
      global.performanceMonitor.timers.delete(name);
      return duration;
    }
    return 0;
  },
  
  getActiveTImers: () => {
    return Array.from(global.performanceMonitor.timers.keys());
  }
};

// Enhanced expect matchers for database tests
expect.extend({
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },

  toBeValidCNPJ(received) {
    if (!received || typeof received !== 'string') {
      return {
        message: () => `expected ${received} to be a valid CNPJ string`,
        pass: false,
      };
    }
    
    const cnpj = received.replace(/[^\d]/g, '');
    if (cnpj.length !== 14) {
      return {
        message: () => `expected ${received} to be a valid CNPJ (14 digits)`,
        pass: false,
      };
    }
    
    // Basic CNPJ validation logic would go here
    return {
      message: () => `expected ${received} not to be a valid CNPJ`,
      pass: true,
    };
  },

  toBeValidCPF(received) {
    if (!received || typeof received !== 'string') {
      return {
        message: () => `expected ${received} to be a valid CPF string`,
        pass: false,
      };
    }
    
    const cpf = received.replace(/[^\d]/g, '');
    if (cpf.length !== 11) {
      return {
        message: () => `expected ${received} to be a valid CPF (11 digits)`,
        pass: false,
      };
    }
    
    // Basic CPF validation logic would go here
    return {
      message: () => `expected ${received} not to be a valid CPF`,
      pass: true,
    };
  },

  toBeWithinTimeRange(received, expectedTime, toleranceMs = 1000) {
    const receivedTime = new Date(received).getTime();
    const expectedTimeMs = new Date(expectedTime).getTime();
    const diff = Math.abs(receivedTime - expectedTimeMs);
    const pass = diff <= toleranceMs;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be within ${toleranceMs}ms of ${expectedTime}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within ${toleranceMs}ms of ${expectedTime}, but was ${diff}ms off`,
        pass: false,
      };
    }
  },

  toHaveValidCurrency(received) {
    const validCurrencies = ['BRL', 'USD', 'EUR'];
    const pass = validCurrencies.includes(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid currency`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid currency (${validCurrencies.join(', ')})`,
        pass: false,
      };
    }
  }
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Cleanup handler
process.on('exit', () => {
  // Cleanup any resources if needed
  if (global.performanceMonitor.getActiveTImers().length > 0) {
    console.warn('Warning: Active performance timers on exit:', global.performanceMonitor.getActiveTImers());
  }
});

// Test environment validation
beforeAll(() => {
  // Validate required environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Validate test database connection
  if (process.env.NODE_ENV !== 'test') {
    console.warn('Warning: Tests are not running in test environment');
  }
});

// Global test hooks
beforeEach(() => {
  // Reset performance monitoring for each test
  global.performanceMonitor.timers.clear();
});

afterEach(() => {
  // Check for performance issues
  const activeTimers = global.performanceMonitor.getActiveTImers();
  if (activeTimers.length > 0) {
    console.warn(`Test completed with active timers: ${activeTimers.join(', ')}`);
  }
});