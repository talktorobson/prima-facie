#!/usr/bin/env node

/**
 * MANUAL CLIENT MANAGEMENT TESTING WITH AUTHENTICATION
 * Prima Facie - Client Management System Testing
 * 
 * This script performs manual testing of the client management system
 * with proper authentication using the existing test users.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE_URL = 'http://localhost:3001';
const TEST_RESULTS = [];

// Test users from TEST_USERS_REPORT.md
const TEST_USERS = {
  lawyer_firm_a: {
    email: 'lawyer@firm-a.com',
    password: '123456789',
    role: 'lawyer',
    firm: 'Dávila Reis Advocacia'
  },
  admin_firm_a: {
    email: 'admin@firm-a.com', 
    password: '123456789',
    role: 'admin',
    firm: 'Dávila Reis Advocacia'
  },
  staff_firm_a: {
    email: 'staff@firm-a.com',
    password: '123456789', 
    role: 'staff',
    firm: 'Dávila Reis Advocacia'
  }
};

// Test configuration
const TEST_CONFIG = {
  headless: false, // Show browser for visual verification
  slowMo: 250,     // Slow down for observation
  timeout: 30000   // Increased timeout for database operations
};

// Utility functions
function logTest(approach, category, test, status, details = '', error = null) {
  const timestamp = new Date().toISOString();
  const result = {
    timestamp,
    approach,
    category,
    test,
    status,
    details,
    error: error ? error.message : null
  };
  
  TEST_RESULTS.push(result);
  console.log(`[${approach}] ${category} - ${test}: ${status}`);
  if (details) console.log(`  └─ ${details}`);
  if (error) console.log(`  ✗ Error: ${error.message}`);
}

async function loginUser(page, user) {
  try {
    console.log(`\n🔐 Logging in as ${user.role} (${user.email})...`);
    
    // Go to login page
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle0' });
    
    // Wait for login form
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    
    // Fill login form
    await page.type('input[type="email"], input[name="email"]', user.email);
    await page.type('input[type="password"], input[name="password"]', user.password);
    
    // Submit form
    await page.click('button[type="submit"], button:contains("Entrar"), .login-button');
    
    // Wait for navigation or dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 });
    
    // Check if we're logged in by looking for dashboard elements
    const currentUrl = page.url();
    const isDashboard = currentUrl.includes('/dashboard') || currentUrl.includes('/admin') || currentUrl.includes('/portal');
    
    if (isDashboard) {
      logTest('AUTH', 'Login', `${user.role} Login`, 'PASS', `Successfully logged in to ${currentUrl}`);
      return true;
    } else {
      logTest('AUTH', 'Login', `${user.role} Login`, 'FAIL', `Login failed, still at ${currentUrl}`);
      return false;
    }
    
  } catch (error) {
    logTest('AUTH', 'Login', `${user.role} Login`, 'FAIL', 'Login process failed', error);
    return false;
  }
}

async function testClientListPage(page, userRole) {
  console.log(`\n📋 Testing Client List Page as ${userRole}...`);
  
  try {
    // Navigate to clients page
    await page.goto(`${BASE_URL}/clients`, { waitUntil: 'networkidle0' });
    
    // Check if page loads successfully
    const title = await page.$eval('h1', el => el.textContent.trim()).catch(() => '');
    
    if (title && title.includes('Cliente')) {
      logTest('APPROACH 1', 'Page Loading', 'Client List Page Load', 'PASS', `Page loaded with title: "${title}"`);
    } else {
      logTest('APPROACH 1', 'Page Loading', 'Client List Page Load', 'FAIL', `Unexpected title: "${title}"`);
      return false;
    }
    
    // Check for client data
    await page.waitForTimeout(2000); // Wait for data to load
    
    const clientItems = await page.$$('li').catch(() => []);
    const hasClientData = clientItems.length > 0;
    
    if (hasClientData) {
      logTest('APPROACH 2', 'Data Loading', 'Client Data Present', 'PASS', `${clientItems.length} list items found`);
      
      // Check if data looks real
      const firstClientText = await page.evaluate(() => {
        const firstLi = document.querySelector('li');
        return firstLi ? firstLi.textContent : '';
      });
      
      const hasRealData = firstClientText && !firstClientText.includes('Mock') && firstClientText.length > 20;
      if (hasRealData) {
        logTest('APPROACH 2', 'Data Quality', 'Real Database Data', 'PASS', 'Client data appears to be from database');
      } else {
        logTest('APPROACH 2', 'Data Quality', 'Data Quality Check', 'WARNING', 'Client data may be mock or empty');
      }
    } else {
      logTest('APPROACH 2', 'Data Loading', 'Client Data Present', 'WARNING', 'No client data displayed');
    }
    
    // Test search functionality
    const searchInput = await page.$('input[placeholder*="Buscar"], input[placeholder*="buscar"]').catch(() => null);
    if (searchInput) {
      logTest('APPROACH 3', 'Search', 'Search Input Present', 'PASS', 'Search input found');
      
      try {
        await page.type('input[placeholder*="Buscar"], input[placeholder*="buscar"]', 'test');
        await page.waitForTimeout(1000);
        logTest('APPROACH 3', 'Search', 'Search Input Functional', 'PASS', 'Can type in search field');
      } catch (error) {
        logTest('APPROACH 3', 'Search', 'Search Input Functional', 'FAIL', 'Cannot type in search field', error);
      }
    } else {
      logTest('APPROACH 3', 'Search', 'Search Input Present', 'FAIL', 'Search input not found');
    }
    
    // Test "New Client" button
    const newClientButton = await page.$('a[href="/clients/new"]').catch(() => null);
    if (newClientButton) {
      logTest('APPROACH 1', 'Navigation', 'New Client Button Present', 'PASS', 'New client button found');
      
      // Test button click
      try {
        await page.click('a[href="/clients/new"]');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        
        const currentUrl = page.url();
        if (currentUrl.includes('/clients/new')) {
          logTest('APPROACH 1', 'Navigation', 'New Client Navigation', 'PASS', 'Successfully navigated to new client page');
          return true;
        } else {
          logTest('APPROACH 1', 'Navigation', 'New Client Navigation', 'FAIL', `Navigation failed, at: ${currentUrl}`);
        }
      } catch (error) {
        logTest('APPROACH 1', 'Navigation', 'New Client Button Click', 'FAIL', 'Button click failed', error);
      }
    } else {
      logTest('APPROACH 1', 'Navigation', 'New Client Button Present', 'FAIL', 'New client button not found');
    }
    
    return true;
  } catch (error) {
    logTest('APPROACH 1', 'Page Access', 'Client List Access', 'FAIL', 'Failed to access client list', error);
    return false;
  }
}

async function testNewClientForm(page, userRole) {
  console.log(`\n📝 Testing New Client Form as ${userRole}...`);
  
  try {
    // Should already be on /clients/new from previous test
    const currentUrl = page.url();
    if (!currentUrl.includes('/clients/new')) {
      await page.goto(`${BASE_URL}/clients/new`, { waitUntil: 'networkidle0' });
    }
    
    // Check form elements
    const nameInput = await page.$('input[name="name"], #name').catch(() => null);
    const emailInput = await page.$('input[type="email"], input[name="email"]').catch(() => null);
    const cpfInput = await page.$('input[name="cpf"], #cpf').catch(() => null);
    const cnpjInput = await page.$('input[name="cnpj"], #cnpj').catch(() => null);
    
    if (nameInput && emailInput) {
      logTest('APPROACH 3', 'Form Elements', 'Essential Fields Present', 'PASS', 'Name and email fields found');
    } else {
      logTest('APPROACH 3', 'Form Elements', 'Essential Fields Present', 'FAIL', 'Required fields missing');
      return false;
    }
    
    if (cpfInput || cnpjInput) {
      logTest('APPROACH 3', 'Brazilian Compliance', 'Document Fields Present', 'PASS', 'CPF/CNPJ fields found');
    } else {
      logTest('APPROACH 3', 'Brazilian Compliance', 'Document Fields Present', 'WARNING', 'Brazilian document fields not found');
    }
    
    // Test form input
    try {
      await page.type('input[name="name"], #name', 'João Silva Teste');
      await page.type('input[type="email"], input[name="email"]', 'joao.teste@email.com');
      
      if (cpfInput) {
        await page.type('input[name="cpf"], #cpf', '12345678900');
        
        // Check if CPF formatting works
        const cpfValue = await page.$eval('input[name="cpf"], #cpf', el => el.value);
        if (cpfValue.includes('.') || cpfValue.includes('-')) {
          logTest('APPROACH 3', 'Form Validation', 'CPF Formatting', 'PASS', 'CPF auto-formatting works');
        } else {
          logTest('APPROACH 3', 'Form Validation', 'CPF Formatting', 'WARNING', 'CPF formatting may not be active');
        }
      }
      
      logTest('APPROACH 3', 'Form Input', 'Form Fields Functional', 'PASS', 'Can input data into form fields');
    } catch (error) {
      logTest('APPROACH 3', 'Form Input', 'Form Fields Functional', 'FAIL', 'Cannot input data', error);
    }
    
    // Test form validation
    const submitButton = await page.$('button[type="submit"]').catch(() => null);
    if (submitButton) {
      logTest('APPROACH 3', 'Form Elements', 'Submit Button Present', 'PASS', 'Submit button found');
      
      // Try submitting with minimal data to test validation
      try {
        await page.click('button[type="submit"]');
        await page.waitForTimeout(2000);
        
        // Check for validation messages
        const validationErrors = await page.$$('.text-red-600, .error, [class*="error"]').catch(() => []);
        if (validationErrors.length > 0) {
          logTest('APPROACH 3', 'Form Validation', 'Validation Messages', 'PASS', `${validationErrors.length} validation messages found`);
        } else {
          logTest('APPROACH 3', 'Form Validation', 'Validation Messages', 'WARNING', 'No validation messages detected');
        }
      } catch (error) {
        logTest('APPROACH 3', 'Form Validation', 'Form Submit Test', 'WARNING', 'Form submission test failed', error);
      }
    } else {
      logTest('APPROACH 3', 'Form Elements', 'Submit Button Present', 'FAIL', 'Submit button not found');
    }
    
    return true;
  } catch (error) {
    logTest('APPROACH 3', 'Form Testing', 'New Client Form', 'FAIL', 'Form testing failed', error);
    return false;
  }
}

async function testClientDetails(page, userRole) {
  console.log(`\n👤 Testing Client Details as ${userRole}...`);
  
  try {
    // Go back to client list first
    await page.goto(`${BASE_URL}/clients`, { waitUntil: 'networkidle0' });
    
    // Find a client detail link
    const clientLinks = await page.$$('a[href*="/clients/"]:not([href*="/new"]):not([href*="/edit"])').catch(() => []);
    
    if (clientLinks.length > 0) {
      logTest('APPROACH 1', 'Navigation', 'Client Detail Links Present', 'PASS', `${clientLinks.length} client detail links found`);
      
      // Click first client detail link
      try {
        await clientLinks[0].click();
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        
        const currentUrl = page.url();
        if (currentUrl.includes('/clients/') && !currentUrl.endsWith('/clients')) {
          logTest('APPROACH 1', 'Navigation', 'Client Detail Navigation', 'PASS', 'Successfully navigated to client details');
          
          // Check if client detail page has content
          const pageTitle = await page.$eval('h1', el => el.textContent.trim()).catch(() => '');
          if (pageTitle && pageTitle.length > 0) {
            logTest('APPROACH 3', 'UI Display', 'Client Detail Content', 'PASS', `Client detail page shows: "${pageTitle}"`);
          } else {
            logTest('APPROACH 3', 'UI Display', 'Client Detail Content', 'WARNING', 'Client detail page may be empty');
          }
          
          // Test edit button
          const editButton = await page.$('a[href*="/edit"]').catch(() => null);
          if (editButton) {
            logTest('APPROACH 1', 'CRUD Operations', 'Edit Button Present', 'PASS', 'Edit button found on client detail');
          } else {
            logTest('APPROACH 1', 'CRUD Operations', 'Edit Button Present', 'FAIL', 'Edit button not found');
          }
          
        } else {
          logTest('APPROACH 1', 'Navigation', 'Client Detail Navigation', 'FAIL', `Navigation failed, at: ${currentUrl}`);
        }
      } catch (error) {
        logTest('APPROACH 1', 'Navigation', 'Client Detail Click', 'FAIL', 'Failed to click client detail link', error);
      }
    } else {
      logTest('APPROACH 1', 'Navigation', 'Client Detail Links Present', 'WARNING', 'No client detail links found');
    }
    
    return true;
  } catch (error) {
    logTest('APPROACH 1', 'Client Details', 'Client Detail Testing', 'FAIL', 'Client detail testing failed', error);
    return false;
  }
}

async function generateReport() {
  const report = {
    testDate: new Date().toISOString(),
    totalTests: TEST_RESULTS.length,
    passedTests: TEST_RESULTS.filter(r => r.status === 'PASS').length,
    failedTests: TEST_RESULTS.filter(r => r.status === 'FAIL').length,
    warningTests: TEST_RESULTS.filter(r => r.status === 'WARNING').length,
    results: TEST_RESULTS,
    summary: {
      approach1: TEST_RESULTS.filter(r => r.approach === 'APPROACH 1').length,
      approach2: TEST_RESULTS.filter(r => r.approach === 'APPROACH 2').length,
      approach3: TEST_RESULTS.filter(r => r.approach === 'APPROACH 3').length,
      auth: TEST_RESULTS.filter(r => r.approach === 'AUTH').length
    }
  };
  
  fs.writeFileSync('client-management-manual-test-report.json', JSON.stringify(report, null, 2));
  return report;
}

// Main testing function
async function runManualClientManagementTests() {
  console.log('🚀 STARTING MANUAL CLIENT MANAGEMENT TESTING');
  console.log('📊 Testing Prima Facie Client Management System');
  console.log('🔐 Using authenticated test users');
  console.log('⏰ Started at:', new Date().toISOString());
  console.log('=====================================\n');
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch(TEST_CONFIG);
    page = await browser.newPage();
    
    // Set user agent and viewport
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set timeouts
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(10000);
    
    // Test with lawyer user (has access to client management)
    const testUser = TEST_USERS.lawyer_firm_a;
    const loginSuccess = await loginUser(page, testUser);
    
    if (loginSuccess) {
      await testClientListPage(page, testUser.role);
      await testNewClientForm(page, testUser.role); 
      await testClientDetails(page, testUser.role);
    } else {
      console.log('❌ Login failed, cannot proceed with client management testing');
    }
    
  } catch (error) {
    console.error('❌ Fatal error in testing:', error);
    logTest('SETUP', 'Test Execution', 'Test Suite Execution', 'FAIL', 'Fatal error occurred', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Generate and display final report
  const report = await generateReport();
  
  console.log('\n=====================================');
  console.log('📋 CLIENT MANAGEMENT TEST RESULTS');
  console.log('=====================================');
  console.log(`📊 Total Tests: ${report.totalTests}`);
  console.log(`✅ Passed: ${report.passedTests}`);
  console.log(`⚠️  Warnings: ${report.warningTests}`);
  console.log(`❌ Failed: ${report.failedTests}`);
  console.log(`📈 Success Rate: ${((report.passedTests / report.totalTests) * 100).toFixed(1)}%`);
  console.log('');
  console.log('📁 Detailed report saved to: client-management-manual-test-report.json');
  console.log('⏰ Completed at:', new Date().toISOString());
  
  // Key findings
  console.log('\n🔍 KEY FINDINGS:');
  const criticalFailures = TEST_RESULTS.filter(r => r.status === 'FAIL');
  if (criticalFailures.length > 0) {
    console.log('❌ Critical Issues Found:');
    criticalFailures.forEach(failure => {
      console.log(`  • ${failure.category} - ${failure.test}: ${failure.details}`);
    });
  }
  
  const warnings = TEST_RESULTS.filter(r => r.status === 'WARNING');
  if (warnings.length > 0) {
    console.log('⚠️  Warnings Identified:');
    warnings.forEach(warning => {
      console.log(`  • ${warning.category} - ${warning.test}: ${warning.details}`);
    });
  }
  
  const successes = TEST_RESULTS.filter(r => r.status === 'PASS');
  if (successes.length > 0) {
    console.log('✅ Working Features:');
    successes.forEach(success => {
      console.log(`  • ${success.category} - ${success.test}`);
    });
  }
  
  console.log('\n🎯 CLIENT MANAGEMENT TESTING COMPLETE');
  console.log('=====================================\n');
}

// Execute the tests
if (require.main === module) {
  runManualClientManagementTests().catch(console.error);
}

module.exports = { runManualClientManagementTests };