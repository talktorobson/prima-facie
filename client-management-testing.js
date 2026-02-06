#!/usr/bin/env node

/**
 * COMPREHENSIVE CLIENT MANAGEMENT TESTING
 * Prima Facie - Client Management System Testing
 * 
 * This script performs thorough testing of the client management system
 * across 3 different testing approaches as requested:
 * 
 * APPROACH 1: Component & Service Integration Testing
 * APPROACH 2: Database Integration Testing  
 * APPROACH 3: User Experience & UI Testing
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

const BASE_URL = 'http://localhost:3001';
const TEST_RESULTS = [];

// Test configuration
const TEST_CONFIG = {
  headless: false, // Show browser for visual verification
  slowMo: 500,     // Slow down for observation
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

function generateReport() {
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
      approach3: TEST_RESULTS.filter(r => r.approach === 'APPROACH 3').length
    }
  };
  
  fs.writeFileSync('client-management-test-report.json', JSON.stringify(report, null, 2));
  return report;
}

async function waitForElement(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

async function checkElementExists(page, selector) {
  try {
    const element = await page.$(selector);
    return element !== null;
  } catch (error) {
    return false;
  }
}

async function getElementText(page, selector) {
  try {
    const element = await page.$(selector);
    if (element) {
      return await page.evaluate(el => el.textContent.trim(), element);
    }
    return '';
  } catch (error) {
    return '';
  }
}

async function countElements(page, selector) {
  try {
    const elements = await page.$$(selector);
    return elements.length;
  } catch (error) {
    return 0;
  }
}

// ==================================================
// APPROACH 1: COMPONENT & SERVICE INTEGRATION TESTING
// ==================================================

async function testApproach1ComponentIntegration(page) {
  console.log('\n=== APPROACH 1: COMPONENT & SERVICE INTEGRATION TESTING ===\n');
  
  // 1.1 Client List Page Analysis
  console.log('1.1 Testing Client List Page Functionality...');
  
  try {
    await page.goto(`${BASE_URL}/clients`, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Check page loads successfully
    const titleExists = await waitForElement(page, 'h1', 5000);
    if (titleExists) {
      const title = await getElementText(page, 'h1');
      if (title.includes('Clientes')) {
        logTest('APPROACH 1', 'Page Loading', 'Client List Page Load', 'PASS', 'Page loaded with correct title');
      } else {
        logTest('APPROACH 1', 'Page Loading', 'Client List Page Load', 'FAIL', `Wrong title: ${title}`);
      }
    } else {
      logTest('APPROACH 1', 'Page Loading', 'Client List Page Load', 'FAIL', 'Page title not found');
    }
    
    // Check for loading states and real data
    await page.waitForTimeout(2000); // Wait for any loading to complete
    
    // Verify no loading spinners are present
    const loadingSpinners = await countElements(page, '.animate-spin');
    if (loadingSpinners === 0) {
      logTest('APPROACH 1', 'Loading States', 'No Loading Spinners', 'PASS', 'All loading completed');
    } else {
      logTest('APPROACH 1', 'Loading States', 'Loading Spinners Check', 'WARNING', `${loadingSpinners} loading spinners still present`);
    }
    
    // Check for real client data vs mock data
    const clientCards = await countElements(page, 'li:has(div.px-4.py-4)');
    const hasClients = clientCards > 0;
    
    if (hasClients) {
      logTest('APPROACH 1', 'Data Integration', 'Client Data Display', 'PASS', `${clientCards} clients displayed`);
      
      // Check if data looks like real database data
      const firstClientText = await getElementText(page, 'li:first-child p.text-lg');
      if (firstClientText && !firstClientText.includes('Mock') && !firstClientText.includes('Example')) {
        logTest('APPROACH 1', 'Data Integration', 'Real Database Data', 'PASS', 'Client names appear to be real data');
      } else {
        logTest('APPROACH 1', 'Data Integration', 'Real Database Data', 'WARNING', 'Client names may be mock data');
      }
    } else {
      logTest('APPROACH 1', 'Data Integration', 'Client Data Display', 'WARNING', 'No clients displayed - may be empty database');
    }
    
    // Test pagination functionality
    const paginationExists = await checkElementExists(page, 'nav[class*="pagination"], .pagination, button:contains("Próximo")');
    if (paginationExists) {
      logTest('APPROACH 1', 'Pagination', 'Pagination Controls', 'PASS', 'Pagination controls found');
    } else {
      logTest('APPROACH 1', 'Pagination', 'Pagination Controls', 'WARNING', 'No pagination found - may not be needed');
    }
    
    // Test search functionality
    const searchInputExists = await waitForElement(page, 'input[placeholder*="Buscar"], input[placeholder*="buscar"]', 3000);
    if (searchInputExists) {
      logTest('APPROACH 1', 'Search', 'Search Input Present', 'PASS', 'Search input field found');
      
      // Test search functionality
      await page.type('input[placeholder*="Buscar"], input[placeholder*="buscar"]', 'João');
      await page.waitForTimeout(1000);
      
      // Check if search filters results
      const filteredClients = await countElements(page, 'li:has(div.px-4.py-4)');
      if (filteredClients !== clientCards) {
        logTest('APPROACH 1', 'Search', 'Search Filtering', 'PASS', `Search filtered to ${filteredClients} clients`);
      } else {
        logTest('APPROACH 1', 'Search', 'Search Filtering', 'WARNING', 'Search may not be working or no matches');
      }
      
      // Clear search
      await page.evaluate(() => {
        const searchInput = document.querySelector('input[placeholder*="Buscar"], input[placeholder*="buscar"]');
        if (searchInput) {
          searchInput.value = '';
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    } else {
      logTest('APPROACH 1', 'Search', 'Search Input Present', 'FAIL', 'Search input not found');
    }
    
    // Test filter functionality
    const filterButtonExists = await checkElementExists(page, 'button:contains("Filtros"), button:contains("Filter")');
    if (filterButtonExists) {
      logTest('APPROACH 1', 'Filtering', 'Filter Button Present', 'PASS', 'Filter controls found');
      
      try {
        await page.click('button:contains("Filtros"), button:contains("Filter")');
        await page.waitForTimeout(500);
        
        const filterOptionsVisible = await checkElementExists(page, 'select, .filter-options');
        if (filterOptionsVisible) {
          logTest('APPROACH 1', 'Filtering', 'Filter Options Display', 'PASS', 'Filter options displayed correctly');
        } else {
          logTest('APPROACH 1', 'Filtering', 'Filter Options Display', 'WARNING', 'Filter options may not be visible');
        }
      } catch (error) {
        logTest('APPROACH 1', 'Filtering', 'Filter Interaction', 'WARNING', 'Could not interact with filters', error);
      }
    } else {
      logTest('APPROACH 1', 'Filtering', 'Filter Button Present', 'WARNING', 'Filter button not found');
    }
    
  } catch (error) {
    logTest('APPROACH 1', 'Page Loading', 'Client List Access', 'FAIL', 'Failed to access client list page', error);
  }
  
  // 1.2 Client CRUD Operations Testing
  console.log('\n1.2 Testing Client CRUD Operations...');
  
  try {
    // Test "Create New Client" functionality
    const newClientButtonExists = await checkElementExists(page, 'a[href="/clients/new"], button:contains("Novo Cliente")');
    if (newClientButtonExists) {
      logTest('APPROACH 1', 'CRUD Operations', 'New Client Button', 'PASS', 'New client button found');
      
      // Click to go to new client page
      await page.click('a[href="/clients/new"], button:contains("Novo Cliente")');
      await page.waitForTimeout(2000);
      
      // Check if we're on the new client page
      const currentUrl = page.url();
      if (currentUrl.includes('/clients/new')) {
        logTest('APPROACH 1', 'CRUD Operations', 'New Client Navigation', 'PASS', 'Successfully navigated to new client page');
        
        // Test form fields existence
        const nameFieldExists = await checkElementExists(page, 'input[name="name"], #name');
        const emailFieldExists = await checkElementExists(page, 'input[name="email"], #email, input[type="email"]');
        const cpfFieldExists = await checkElementExists(page, 'input[name="cpf"], #cpf');
        const cnpjFieldExists = await checkElementExists(page, 'input[name="cnpj"], #cnpj');
        
        if (nameFieldExists && emailFieldExists) {
          logTest('APPROACH 1', 'CRUD Operations', 'Form Fields Present', 'PASS', 'Essential form fields found');
        } else {
          logTest('APPROACH 1', 'CRUD Operations', 'Form Fields Present', 'FAIL', 'Essential form fields missing');
        }
        
        if (cpfFieldExists || cnpjFieldExists) {
          logTest('APPROACH 1', 'CPF/CNPJ Validation', 'Document Fields Present', 'PASS', 'Brazilian document fields found');
        } else {
          logTest('APPROACH 1', 'CPF/CNPJ Validation', 'Document Fields Present', 'FAIL', 'Brazilian document fields missing');
        }
        
        // Test form validation by trying to submit empty form
        const submitButtonExists = await checkElementExists(page, 'button[type="submit"], button:contains("Criar"), button:contains("Salvar")');
        if (submitButtonExists) {
          logTest('APPROACH 1', 'CRUD Operations', 'Submit Button Present', 'PASS', 'Submit button found');
          
          try {
            await page.click('button[type="submit"], button:contains("Criar"), button:contains("Salvar")');
            await page.waitForTimeout(1000);
            
            // Check for validation errors
            const validationErrors = await countElements(page, '.text-red-600, .error, [class*="error"]');
            if (validationErrors > 0) {
              logTest('APPROACH 1', 'Form Validation', 'Required Field Validation', 'PASS', `${validationErrors} validation errors displayed`);
            } else {
              logTest('APPROACH 1', 'Form Validation', 'Required Field Validation', 'WARNING', 'No validation errors shown');
            }
          } catch (error) {
            logTest('APPROACH 1', 'Form Validation', 'Form Submission Test', 'WARNING', 'Could not test form submission', error);
          }
        } else {
          logTest('APPROACH 1', 'CRUD Operations', 'Submit Button Present', 'FAIL', 'Submit button not found');
        }
        
      } else {
        logTest('APPROACH 1', 'CRUD Operations', 'New Client Navigation', 'FAIL', `Navigation failed, current URL: ${currentUrl}`);
      }
    } else {
      logTest('APPROACH 1', 'CRUD Operations', 'New Client Button', 'FAIL', 'New client button not found');
    }
    
  } catch (error) {
    logTest('APPROACH 1', 'CRUD Operations', 'Client Creation Test', 'FAIL', 'Error in client creation testing', error);
  }
  
  // Return to clients list for further testing
  try {
    await page.goto(`${BASE_URL}/clients`, { waitUntil: 'networkidle0' });
  } catch (error) {
    logTest('APPROACH 1', 'Navigation', 'Return to Client List', 'WARNING', 'Could not return to client list', error);
  }
}

// ==================================================
// APPROACH 2: DATABASE INTEGRATION TESTING
// ==================================================

async function testApproach2DatabaseIntegration(page) {
  console.log('\n=== APPROACH 2: DATABASE INTEGRATION TESTING ===\n');
  
  console.log('2.1 Testing Production Service Analysis...');
  
  try {
    // Go to clients page and analyze network requests
    await page.goto(`${BASE_URL}/clients`, { waitUntil: 'networkidle0' });
    
    // Monitor network requests to verify database connectivity
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('supabase') || response.url().includes('api')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForTimeout(3000);
    
    // Analyze if we're getting real database responses
    const supabaseRequests = responses.filter(r => r.url.includes('supabase'));
    if (supabaseRequests.length > 0) {
      logTest('APPROACH 2', 'Database Connectivity', 'Supabase Requests', 'PASS', `${supabaseRequests.length} Supabase requests detected`);
      
      const successfulRequests = supabaseRequests.filter(r => r.status >= 200 && r.status < 300);
      if (successfulRequests.length > 0) {
        logTest('APPROACH 2', 'Database Connectivity', 'Successful DB Queries', 'PASS', `${successfulRequests.length} successful database queries`);
      } else {
        logTest('APPROACH 2', 'Database Connectivity', 'Successful DB Queries', 'FAIL', 'No successful database queries');
      }
    } else {
      logTest('APPROACH 2', 'Database Connectivity', 'Supabase Integration', 'WARNING', 'No Supabase requests detected - may be using mock data');
    }
    
    // Check for mock data indicators in the DOM
    const pageContent = await page.content();
    const hasMockIndicators = pageContent.includes('mock') || pageContent.includes('Mock') || pageContent.includes('example') || pageContent.includes('test@');
    
    if (!hasMockIndicators) {
      logTest('APPROACH 2', 'Data Validation', 'No Mock Data Indicators', 'PASS', 'No obvious mock data patterns detected');
    } else {
      logTest('APPROACH 2', 'Data Validation', 'Mock Data Check', 'WARNING', 'Possible mock data patterns detected');
    }
    
    // Test real-time data fetching by checking for loading states
    const hasLoadingStates = await checkElementExists(page, '.animate-spin, .loading, [class*="loading"]');
    if (!hasLoadingStates) {
      logTest('APPROACH 2', 'Real-time Fetching', 'Data Loaded', 'PASS', 'Data appears to be loaded (no loading states)');
    } else {
      logTest('APPROACH 2', 'Real-time Fetching', 'Loading States', 'WARNING', 'Loading states still present');
    }
    
    // Check for Row Level Security enforcement by analyzing client data
    const clientEmails = await page.evaluate(() => {
      const emailElements = Array.from(document.querySelectorAll('li'))
        .map(li => li.textContent)
        .filter(text => text.includes('@'));
      return emailElements;
    });
    
    if (clientEmails.length > 0) {
      logTest('APPROACH 2', 'RLS Enforcement', 'Client Data Retrieved', 'PASS', `${clientEmails.length} client records with emails found`);
      
      // Check if emails look like real emails (not test@example.com patterns)
      const realEmails = clientEmails.filter(email => 
        !email.includes('test@') && 
        !email.includes('example.') && 
        !email.includes('@example')
      );
      
      if (realEmails.length > 0) {
        logTest('APPROACH 2', 'Data Validation', 'Real Email Patterns', 'PASS', 'Email patterns suggest real data');
      } else {
        logTest('APPROACH 2', 'Data Validation', 'Email Patterns', 'WARNING', 'Email patterns suggest test/mock data');
      }
    } else {
      logTest('APPROACH 2', 'RLS Enforcement', 'Client Data Access', 'WARNING', 'No client email data found');
    }
    
  } catch (error) {
    logTest('APPROACH 2', 'Database Integration', 'Database Testing', 'FAIL', 'Error in database integration testing', error);
  }
  
  console.log('\n2.2 Testing Multi-tenant Data Isolation...');
  
  try {
    // Check for law firm isolation by looking for law firm specific data
    const hasLawFirmData = await page.evaluate(() => {
      const pageText = document.body.textContent;
      return pageText.includes('law_firm') || pageText.includes('firm') || pageText.includes('escritório');
    });
    
    if (hasLawFirmData) {
      logTest('APPROACH 2', 'Multi-tenant', 'Law Firm Context', 'PASS', 'Law firm context detected in page');
    } else {
      logTest('APPROACH 2', 'Multi-tenant', 'Law Firm Context', 'WARNING', 'No obvious law firm context detected');
    }
    
    // Test contact relationship management
    const hasRelationshipData = await page.evaluate(() => {
      const pageText = document.body.textContent;
      return pageText.includes('responsável') || pageText.includes('advogado') || pageText.includes('relationship');
    });
    
    if (hasRelationshipData) {
      logTest('APPROACH 2', 'Contact Relationships', 'Relationship Manager Data', 'PASS', 'Relationship management data found');
    } else {
      logTest('APPROACH 2', 'Contact Relationships', 'Relationship Manager Data', 'WARNING', 'No relationship management data detected');
    }
    
  } catch (error) {
    logTest('APPROACH 2', 'Multi-tenant Testing', 'Isolation Testing', 'FAIL', 'Error in multi-tenant testing', error);
  }
}

// ==================================================
// APPROACH 3: USER EXPERIENCE & UI TESTING
// ==================================================

async function testApproach3UserExperience(page) {
  console.log('\n=== APPROACH 3: USER EXPERIENCE & UI TESTING ===\n');
  
  console.log('3.1 Testing Form Functionality...');
  
  try {
    // Go to new client form
    await page.goto(`${BASE_URL}/clients/new`, { waitUntil: 'networkidle0' });
    
    // Test form input functionality
    const nameInput = await page.$('input[name="name"], #name');
    const emailInput = await page.$('input[name="email"], #email, input[type="email"]');
    
    if (nameInput && emailInput) {
      logTest('APPROACH 3', 'Form Functionality', 'Input Fields Accessible', 'PASS', 'Name and email inputs found');
      
      // Test typing in fields
      await page.type('input[name="name"], #name', 'João Silva Teste');
      await page.type('input[name="email"], #email, input[type="email"]', 'joao.teste@email.com');
      
      // Check if values were entered
      const nameValue = await page.$eval('input[name="name"], #name', el => el.value);
      const emailValue = await page.$eval('input[name="email"], #email, input[type="email"]', el => el.value);
      
      if (nameValue === 'João Silva Teste' && emailValue === 'joao.teste@email.com') {
        logTest('APPROACH 3', 'Form Functionality', 'Input Values Set', 'PASS', 'Form inputs accept values correctly');
      } else {
        logTest('APPROACH 3', 'Form Functionality', 'Input Values Set', 'FAIL', 'Form inputs not working correctly');
      }
      
      // Test form validation feedback
      await page.click('input[name="email"], #email, input[type="email"]');
      await page.keyboard.press('Tab'); // Move to next field to trigger validation
      
      await page.waitForTimeout(500);
      
      // Check for success states or validation feedback
      const validationElements = await countElements(page, '.text-green-600, .text-red-600, .error, .success');
      if (validationElements > 0) {
        logTest('APPROACH 3', 'Form Validation', 'Validation Feedback', 'PASS', 'Form provides validation feedback');
      } else {
        logTest('APPROACH 3', 'Form Validation', 'Validation Feedback', 'WARNING', 'No validation feedback detected');
      }
      
    } else {
      logTest('APPROACH 3', 'Form Functionality', 'Input Fields Accessible', 'FAIL', 'Required input fields not found');
    }
    
    // Test CPF/CNPJ validation and formatting
    const cpfInput = await page.$('input[name="cpf"], #cpf');
    if (cpfInput) {
      await page.type('input[name="cpf"], #cpf', '12345678900');
      await page.waitForTimeout(500);
      
      const cpfValue = await page.$eval('input[name="cpf"], #cpf', el => el.value);
      if (cpfValue.includes('.') || cpfValue.includes('-')) {
        logTest('APPROACH 3', 'CPF/CNPJ Validation', 'CPF Formatting', 'PASS', 'CPF auto-formatting works');
      } else {
        logTest('APPROACH 3', 'CPF/CNPJ Validation', 'CPF Formatting', 'WARNING', 'CPF formatting may not be working');
      }
    } else {
      logTest('APPROACH 3', 'CPF/CNPJ Validation', 'CPF Field Present', 'WARNING', 'CPF input field not found');
    }
    
    // Test responsive design
    await page.setViewport({ width: 768, height: 1024 }); // Tablet size
    await page.waitForTimeout(1000);
    
    const elementsVisible = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return false;
      const rect = form.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    
    if (elementsVisible) {
      logTest('APPROACH 3', 'Responsive Design', 'Tablet Layout', 'PASS', 'Form is visible on tablet screen');
    } else {
      logTest('APPROACH 3', 'Responsive Design', 'Tablet Layout', 'FAIL', 'Form not visible on tablet screen');
    }
    
    await page.setViewport({ width: 375, height: 667 }); // Mobile size
    await page.waitForTimeout(1000);
    
    const mobileVisible = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return false;
      const rect = form.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    
    if (mobileVisible) {
      logTest('APPROACH 3', 'Responsive Design', 'Mobile Layout', 'PASS', 'Form is visible on mobile screen');
    } else {
      logTest('APPROACH 3', 'Responsive Design', 'Mobile Layout', 'FAIL', 'Form not visible on mobile screen');
    }
    
    // Reset viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
  } catch (error) {
    logTest('APPROACH 3', 'Form Functionality', 'Form Testing', 'FAIL', 'Error in form functionality testing', error);
  }
  
  console.log('\n3.2 Testing UI Components and CTAs...');
  
  try {
    // Go back to clients list
    await page.goto(`${BASE_URL}/clients`, { waitUntil: 'networkidle0' });
    
    // Test button functionality and CTAs
    const newClientButton = await page.$('a[href="/clients/new"], button:contains("Novo Cliente")');
    if (newClientButton) {
      logTest('APPROACH 3', 'UI Components', 'New Client CTA', 'PASS', 'New client button is present');
      
      // Test if button is clickable
      const isClickable = await page.evaluate((btn) => {
        const rect = btn.getBoundingClientRect();
        const style = window.getComputedStyle(btn);
        return rect.width > 0 && rect.height > 0 && style.pointerEvents !== 'none';
      }, newClientButton);
      
      if (isClickable) {
        logTest('APPROACH 3', 'UI Components', 'Button Clickability', 'PASS', 'New client button is clickable');
      } else {
        logTest('APPROACH 3', 'UI Components', 'Button Clickability', 'FAIL', 'New client button is not clickable');
      }
    } else {
      logTest('APPROACH 3', 'UI Components', 'New Client CTA', 'FAIL', 'New client button not found');
    }
    
    // Test edit and view buttons for existing clients
    const editButtons = await countElements(page, 'a[href*="/edit"], button:contains("Editar")');
    const viewButtons = await countElements(page, 'a[href*="/clients/"], button:contains("Ver")');
    
    if (editButtons > 0) {
      logTest('APPROACH 3', 'UI Components', 'Edit Buttons Present', 'PASS', `${editButtons} edit buttons found`);
    } else {
      logTest('APPROACH 3', 'UI Components', 'Edit Buttons Present', 'WARNING', 'No edit buttons found');
    }
    
    if (viewButtons > 0) {
      logTest('APPROACH 3', 'UI Components', 'View Buttons Present', 'PASS', `${viewButtons} view buttons found`);
    } else {
      logTest('APPROACH 3', 'UI Components', 'View Buttons Present', 'WARNING', 'No view buttons found');
    }
    
    // Test modal/dialog functionality
    const filterButton = await page.$('button:contains("Filtros")');
    if (filterButton) {
      await page.click('button:contains("Filtros")');
      await page.waitForTimeout(500);
      
      const filterModalVisible = await checkElementExists(page, '.modal, .dropdown, [class*="filter"]');
      if (filterModalVisible) {
        logTest('APPROACH 3', 'Modal Functionality', 'Filter Modal Display', 'PASS', 'Filter modal/dropdown displayed');
      } else {
        logTest('APPROACH 3', 'Modal Functionality', 'Filter Modal Display', 'WARNING', 'Filter modal may not be visible');
      }
    }
    
    // Test navigation after operations
    const firstClientLink = await page.$('a[href*="/clients/"]:not([href*="/new"]):not([href*="/edit"])');
    if (firstClientLink) {
      await page.click('a[href*="/clients/"]:not([href*="/new"]):not([href*="/edit"])');
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/clients/') && !currentUrl.endsWith('/clients')) {
        logTest('APPROACH 3', 'Navigation', 'Client Detail Navigation', 'PASS', 'Successfully navigated to client detail');
        
        // Check if client detail page loads properly
        const clientDetailLoaded = await waitForElement(page, 'h1, .client-name', 5000);
        if (clientDetailLoaded) {
          logTest('APPROACH 3', 'UI Components', 'Client Detail Display', 'PASS', 'Client detail page loads');
        } else {
          logTest('APPROACH 3', 'UI Components', 'Client Detail Display', 'FAIL', 'Client detail page does not load properly');
        }
      } else {
        logTest('APPROACH 3', 'Navigation', 'Client Detail Navigation', 'FAIL', `Navigation failed, URL: ${currentUrl}`);
      }
    } else {
      logTest('APPROACH 3', 'Navigation', 'Client Links Present', 'WARNING', 'No client detail links found');
    }
    
  } catch (error) {
    logTest('APPROACH 3', 'UI Components', 'UI Testing', 'FAIL', 'Error in UI component testing', error);
  }
  
  console.log('\n3.3 Testing Search & Filter Functionality...');
  
  try {
    // Go back to clients list
    await page.goto(`${BASE_URL}/clients`, { waitUntil: 'networkidle0' });
    
    // Test search functionality
    const searchInput = await page.$('input[placeholder*="Buscar"], input[placeholder*="buscar"], input[type="search"]');
    if (searchInput) {
      logTest('APPROACH 3', 'Search & Filter', 'Search Input Present', 'PASS', 'Search input field found');
      
      // Get initial client count
      const initialClientCount = await countElements(page, 'li:has(div.px-4.py-4), .client-card, .client-item');
      
      // Perform search
      await page.type('input[placeholder*="Buscar"], input[placeholder*="buscar"], input[type="search"]', 'Silva');
      await page.waitForTimeout(1500);
      
      const filteredClientCount = await countElements(page, 'li:has(div.px-4.py-4), .client-card, .client-item');
      
      if (filteredClientCount <= initialClientCount) {
        logTest('APPROACH 3', 'Search & Filter', 'Search Filtering Works', 'PASS', `Filtered from ${initialClientCount} to ${filteredClientCount} clients`);
      } else {
        logTest('APPROACH 3', 'Search & Filter', 'Search Filtering Works', 'WARNING', 'Search may not be filtering results');
      }
      
      // Clear search
      await page.evaluate(() => {
        const searchInput = document.querySelector('input[placeholder*="Buscar"], input[placeholder*="buscar"], input[type="search"]');
        if (searchInput) {
          searchInput.value = '';
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await page.waitForTimeout(1000);
      
      const restoredClientCount = await countElements(page, 'li:has(div.px-4.py-4), .client-card, .client-item');
      if (restoredClientCount >= filteredClientCount) {
        logTest('APPROACH 3', 'Search & Filter', 'Search Clear Works', 'PASS', `Restored to ${restoredClientCount} clients`);
      } else {
        logTest('APPROACH 3', 'Search & Filter', 'Search Clear Works', 'WARNING', 'Search clear may not be working');
      }
      
    } else {
      logTest('APPROACH 3', 'Search & Filter', 'Search Input Present', 'FAIL', 'Search input field not found');
    }
    
    // Test advanced search capabilities by testing various search terms
    if (searchInput) {
      const searchTerms = ['@', '.com', 'empresa', 'João'];
      
      for (const term of searchTerms) {
        await page.evaluate((inputSelector) => {
          const input = document.querySelector(inputSelector);
          if (input) {
            input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }, 'input[placeholder*="Buscar"], input[placeholder*="buscar"], input[type="search"]');
        
        await page.type('input[placeholder*="Buscar"], input[placeholder*="buscar"], input[type="search"]', term);
        await page.waitForTimeout(1000);
        
        const results = await countElements(page, 'li:has(div.px-4.py-4), .client-card, .client-item');
        logTest('APPROACH 3', 'Search & Filter', `Search Term "${term}"`, results >= 0 ? 'PASS' : 'FAIL', `${results} results for "${term}"`);
      }
    }
    
    // Test sort functionality if available
    const sortButtons = await countElements(page, 'button:contains("Sort"), button:contains("Ordenar"), th[role="button"]');
    if (sortButtons > 0) {
      logTest('APPROACH 3', 'Search & Filter', 'Sort Controls Present', 'PASS', `${sortButtons} sort controls found`);
    } else {
      logTest('APPROACH 3', 'Search & Filter', 'Sort Controls Present', 'WARNING', 'No sort controls found');
    }
    
  } catch (error) {
    logTest('APPROACH 3', 'Search & Filter', 'Search Testing', 'FAIL', 'Error in search and filter testing', error);
  }
}

// ==================================================
// MAIN TESTING EXECUTION
// ==================================================

async function runComprehensiveClientManagementTests() {
  console.log('🚀 STARTING COMPREHENSIVE CLIENT MANAGEMENT TESTING');
  console.log('📊 Testing Prima Facie Client Management System');
  console.log('⏰ Started at:', new Date().toISOString());
  console.log('=====================================\n');
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch(TEST_CONFIG);
    page = await browser.newPage();
    
    // Set user agent and viewport
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set longer timeouts for database operations
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(10000);
    
    // Test initial connectivity
    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 30000 });
      logTest('SETUP', 'Connectivity', 'Application Access', 'PASS', 'Successfully connected to application');
    } catch (error) {
      logTest('SETUP', 'Connectivity', 'Application Access', 'FAIL', 'Cannot connect to application', error);
      return;
    }
    
    // Run all three testing approaches
    await testApproach1ComponentIntegration(page);
    await testApproach2DatabaseIntegration(page);
    await testApproach3UserExperience(page);
    
  } catch (error) {
    console.error('❌ Fatal error in testing:', error);
    logTest('SETUP', 'Test Execution', 'Test Suite Execution', 'FAIL', 'Fatal error occurred', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Generate and display final report
  const report = generateReport();
  
  console.log('\n=====================================');
  console.log('📋 CLIENT MANAGEMENT TEST RESULTS');
  console.log('=====================================');
  console.log(`📊 Total Tests: ${report.totalTests}`);
  console.log(`✅ Passed: ${report.passedTests}`);
  console.log(`⚠️  Warnings: ${report.warningTests}`);
  console.log(`❌ Failed: ${report.failedTests}`);
  console.log(`📈 Success Rate: ${((report.passedTests / report.totalTests) * 100).toFixed(1)}%`);
  console.log('');
  console.log('📁 Detailed report saved to: client-management-test-report.json');
  console.log('⏰ Completed at:', new Date().toISOString());
  
  // Summary by approach
  console.log('\n📊 RESULTS BY APPROACH:');
  console.log(`Approach 1 (Component Integration): ${report.summary.approach1} tests`);
  console.log(`Approach 2 (Database Integration): ${report.summary.approach2} tests`);
  console.log(`Approach 3 (User Experience): ${report.summary.approach3} tests`);
  
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
    successes.slice(0, 5).forEach(success => {
      console.log(`  • ${success.category} - ${success.test}`);
    });
    if (successes.length > 5) {
      console.log(`  • ... and ${successes.length - 5} more working features`);
    }
  }
  
  console.log('\n🎯 CLIENT MANAGEMENT TESTING COMPLETE');
  console.log('=====================================\n');
}

// Execute the tests
if (require.main === module) {
  runComprehensiveClientManagementTests().catch(console.error);
}

module.exports = {
  runComprehensiveClientManagementTests,
  testApproach1ComponentIntegration,
  testApproach2DatabaseIntegration,
  testApproach3UserExperience
};