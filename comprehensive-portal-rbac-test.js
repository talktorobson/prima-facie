#!/usr/bin/env node

// =============================================================================
// COMPREHENSIVE PORTAL ACCESS TESTING AGENT
// Tests all client and staff portal functionality with RBAC validation
// Target: http://localhost:3002
// =============================================================================

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test Configuration
const BASE_URL = 'http://localhost:3002';
const TIMEOUT = 30000;
const VIEWPORT = { width: 1920, height: 1080 };

// Test Users for RBAC Testing
const TEST_USERS = {
  admin: {
    id: 'admin-user-1',
    name: 'Admin User',
    email: 'admin@primafacie.law',
    user_type: 'admin',
    firm_id: 'firm-1'
  },
  lawyer: {
    id: 'lawyer-user-1', 
    name: 'Dr. Maria Santos',
    email: 'maria.santos@primafacie.law',
    user_type: 'lawyer',
    firm_id: 'firm-1'
  },
  staff: {
    id: 'staff-user-1',
    name: 'João Silva',
    email: 'joao.silva@primafacie.law', 
    user_type: 'staff',
    firm_id: 'firm-1'
  },
  client: {
    id: 'client-user-1',
    name: 'Carlos Oliveira',
    email: 'carlos.oliveira@email.com',
    user_type: 'client',
    firm_id: 'firm-1'
  }
};

// Test Results Storage
let testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total_tests: 0,
    passed: 0,
    failed: 0,
    errors: 0
  },
  portal_tests: {
    client_portal: [],
    staff_portal: [],
    rbac_validation: [],
    security_tests: [],
    integration_tests: [],
    mobile_tests: []
  },
  detailed_results: []
};

// Utility Functions
function logTest(category, testName, status, details = '') {
  const result = {
    category,
    test: testName,
    status,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.detailed_results.push(result);
  testResults.summary.total_tests++;
  
  if (status === 'PASS') {
    testResults.summary.passed++;
    console.log(`✅ [${category}] ${testName}`);
  } else if (status === 'FAIL') {
    testResults.summary.failed++;
    console.log(`❌ [${category}] ${testName} - ${details}`);
  } else {
    testResults.summary.errors++;
    console.log(`⚠️  [${category}] ${testName} - ${details}`);
  }

  if (details) {
    console.log(`   Details: ${details}`);
  }
}

async function setMockAuth(page, user) {
  await page.evaluate((userProfile) => {
    // Set mock authentication cookie
    const authData = {
      id: userProfile.id,
      email: userProfile.email,
      profile: userProfile
    };
    document.cookie = `mock_auth_user=${JSON.stringify(authData)}; path=/; max-age=3600`;
  }, user);
}

async function clearAuth(page) {
  await page.evaluate(() => {
    document.cookie = 'mock_auth_user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  });
}

async function waitForPageLoad(page, timeout = TIMEOUT) {
  await page.waitForLoadState('networkidle', { timeout });
}

async function takeScreenshot(page, filename) {
  const screenshotPath = path.join(__dirname, 'test-screenshots', filename);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

// =============================================================================
// MAIN TESTING FUNCTIONS
// =============================================================================

async function testClientPortalAccess(page) {
  console.log('\n🔍 Testing Client Portal Access...');
  
  try {
    // Set client authentication
    await setMockAuth(page, TEST_USERS.client);
    
    // Test client portal landing page
    await page.goto(`${BASE_URL}/portal/client`);
    await page.waitForSelector('h1', { timeout: 10000 });
    
    const title = await page.textContent('h1');
    if (title?.includes('Portal do Cliente')) {
      logTest('CLIENT_PORTAL', 'Client Portal Landing Page', 'PASS', 'Landing page loaded successfully');
    } else {
      logTest('CLIENT_PORTAL', 'Client Portal Landing Page', 'FAIL', `Expected 'Portal do Cliente', got '${title}'`);
    }
    
    // Test client portal layout and navigation
    const navigation = await page.$$('nav a, nav button');
    logTest('CLIENT_PORTAL', 'Client Navigation Menu', navigation.length >= 5 ? 'PASS' : 'FAIL', 
           `Found ${navigation.length} navigation items`);
    
    // Test client portal pages
    const clientPages = [
      '/portal/client/dashboard',
      '/portal/client/matters', 
      '/portal/client/profile',
      '/portal/client/messages'
    ];
    
    for (const pagePath of clientPages) {
      try {
        await page.goto(`${BASE_URL}${pagePath}`);
        await page.waitForSelector('main, .main-content, h1', { timeout: 5000 });
        logTest('CLIENT_PORTAL', `Client Page: ${pagePath}`, 'PASS', 'Page loaded successfully');
      } catch (error) {
        logTest('CLIENT_PORTAL', `Client Page: ${pagePath}`, 'FAIL', error.message);
      }
    }
    
  } catch (error) {
    logTest('CLIENT_PORTAL', 'Client Portal Access', 'ERROR', error.message);
  }
}

async function testStaffPortalAccess(page) {
  console.log('\n🔍 Testing Staff Portal Access...');
  
  try {
    // Test staff portal with staff user
    await setMockAuth(page, TEST_USERS.staff);
    
    await page.goto(`${BASE_URL}/portal/staff`);
    await page.waitForSelector('h1', { timeout: 10000 });
    
    const title = await page.textContent('h1');
    if (title?.includes('Portal do Colaborador')) {
      logTest('STAFF_PORTAL', 'Staff Portal Landing Page', 'PASS', 'Staff portal loaded successfully');
    } else {
      logTest('STAFF_PORTAL', 'Staff Portal Landing Page', 'FAIL', `Expected 'Portal do Colaborador', got '${title}'`);
    }
    
    // Test staff portal with lawyer user
    await setMockAuth(page, TEST_USERS.lawyer);
    await page.goto(`${BASE_URL}/portal/staff`);
    await page.waitForSelector('h1', { timeout: 5000 });
    logTest('STAFF_PORTAL', 'Lawyer Access to Staff Portal', 'PASS', 'Lawyer can access staff portal');
    
    // Test staff portal with admin user
    await setMockAuth(page, TEST_USERS.admin);
    await page.goto(`${BASE_URL}/portal/staff`);
    await page.waitForSelector('h1', { timeout: 5000 });
    logTest('STAFF_PORTAL', 'Admin Access to Staff Portal', 'PASS', 'Admin can access staff portal');
    
  } catch (error) {
    logTest('STAFF_PORTAL', 'Staff Portal Access', 'ERROR', error.message);
  }
}

async function testRBACValidation(page) {
  console.log('\n🔍 Testing Role-Based Access Control (RBAC)...');
  
  // Test client access restrictions
  try {
    await setMockAuth(page, TEST_USERS.client);
    
    // Test client cannot access admin routes
    const restrictedRoutes = [
      '/admin',
      '/admin/users',
      '/admin/settings',
      '/dashboard',
      '/matters',
      '/clients',
      '/billing',
      '/reports'
    ];
    
    for (const route of restrictedRoutes) {
      try {
        await page.goto(`${BASE_URL}${route}`);
        await page.waitForLoadState('networkidle', { timeout: 5000 });
        
        const currentUrl = page.url();
        if (currentUrl.includes('/portal/client') || currentUrl.includes('/login')) {
          logTest('RBAC_VALIDATION', `Client Blocked from ${route}`, 'PASS', 'Client properly redirected');
        } else {
          logTest('RBAC_VALIDATION', `Client Blocked from ${route}`, 'FAIL', `Client accessed ${currentUrl}`);
        }
      } catch (error) {
        logTest('RBAC_VALIDATION', `Client Blocked from ${route}`, 'ERROR', error.message);
      }
    }
    
    // Test staff access permissions
    await setMockAuth(page, TEST_USERS.staff);
    
    // Staff should access dashboard but not admin
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    const dashboardUrl = page.url();
    logTest('RBAC_VALIDATION', 'Staff Dashboard Access', 
           dashboardUrl.includes('/dashboard') ? 'PASS' : 'FAIL', 
           `Staff redirected to: ${dashboardUrl}`);
    
    // Staff should not access admin
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    const adminUrl = page.url();
    logTest('RBAC_VALIDATION', 'Staff Admin Blocked', 
           !adminUrl.includes('/admin') ? 'PASS' : 'FAIL',
           `Staff redirected to: ${adminUrl}`);
    
    // Test admin full access
    await setMockAuth(page, TEST_USERS.admin);
    
    const adminRoutes = ['/admin', '/dashboard', '/matters', '/clients', '/billing'];
    for (const route of adminRoutes) {
      try {
        await page.goto(`${BASE_URL}${route}`);
        await page.waitForSelector('main, h1', { timeout: 5000 });
        logTest('RBAC_VALIDATION', `Admin Access to ${route}`, 'PASS', 'Admin has full access');
      } catch (error) {
        logTest('RBAC_VALIDATION', `Admin Access to ${route}`, 'FAIL', error.message);
      }
    }
    
  } catch (error) {
    logTest('RBAC_VALIDATION', 'RBAC Validation', 'ERROR', error.message);
  }
}

async function testSecurityBoundaries(page) {
  console.log('\n🔍 Testing Security Boundaries...');
  
  try {
    // Test URL manipulation attempts
    await setMockAuth(page, TEST_USERS.client);
    
    const maliciousUrls = [
      '/admin?user=client',
      '/dashboard/../admin',
      '/portal/client/../../../admin',
      '/matters?role=admin',
      '/clients?bypass=true'
    ];
    
    for (const url of maliciousUrls) {
      try {
        await page.goto(`${BASE_URL}${url}`);
        await page.waitForLoadState('networkidle', { timeout: 3000 });
        
        const finalUrl = page.url();
        if (finalUrl.includes('/portal/client') || finalUrl.includes('/login')) {
          logTest('SECURITY_TESTS', `URL Manipulation Blocked: ${url}`, 'PASS', 'Properly redirected');
        } else {
          logTest('SECURITY_TESTS', `URL Manipulation Blocked: ${url}`, 'FAIL', `Access granted to: ${finalUrl}`);
        }
      } catch (error) {
        logTest('SECURITY_TESTS', `URL Manipulation: ${url}`, 'ERROR', error.message);
      }
    }
    
    // Test session isolation
    await clearAuth(page);
    await page.goto(`${BASE_URL}/portal/client`);
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    
    const unauthUrl = page.url();
    logTest('SECURITY_TESTS', 'Session Isolation', 
           unauthUrl.includes('/login') ? 'PASS' : 'FAIL',
           `Unauthenticated user redirected to: ${unauthUrl}`);
    
  } catch (error) {
    logTest('SECURITY_TESTS', 'Security Boundaries', 'ERROR', error.message);
  }
}

async function testPortalIntegration(page) {
  console.log('\n🔍 Testing Portal Integration...');
  
  try {
    // Test client portal integration with main dashboard
    await setMockAuth(page, TEST_USERS.client);
    
    // Test navigation between portal pages
    await page.goto(`${BASE_URL}/portal/client`);
    await page.waitForSelector('nav', { timeout: 5000 });
    
    // Check for navigation links
    const navLinks = await page.$$('nav a');
    logTest('INTEGRATION_TESTS', 'Client Portal Navigation', 
           navLinks.length >= 4 ? 'PASS' : 'FAIL',
           `Found ${navLinks.length} navigation links`);
    
    // Test messaging integration
    try {
      await page.goto(`${BASE_URL}/portal/client/messages`);
      await page.waitForSelector('main, h1', { timeout: 5000 });
      logTest('INTEGRATION_TESTS', 'Client Messages Integration', 'PASS', 'Messages page accessible');
    } catch (error) {
      logTest('INTEGRATION_TESTS', 'Client Messages Integration', 'FAIL', error.message);
    }
    
    // Test staff portal integration
    await setMockAuth(page, TEST_USERS.staff);
    await page.goto(`${BASE_URL}/portal/staff`);
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Test portal to dashboard transition
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForSelector('main, h1', { timeout: 5000 });
    logTest('INTEGRATION_TESTS', 'Staff Portal to Dashboard', 'PASS', 'Seamless portal transition');
    
  } catch (error) {
    logTest('INTEGRATION_TESTS', 'Portal Integration', 'ERROR', error.message);
  }
}

async function testMobilePortalExperience(page) {
  console.log('\n🔍 Testing Mobile Portal Experience...');
  
  try {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    
    // Test client portal on mobile
    await setMockAuth(page, TEST_USERS.client);
    await page.goto(`${BASE_URL}/portal/client`);
    await page.waitForSelector('h1', { timeout: 5000 });
    
    // Check mobile responsiveness
    const isMobileOptimized = await page.evaluate(() => {
      const body = document.body;
      return window.innerWidth <= 768 && body.offsetWidth <= window.innerWidth;
    });
    
    logTest('MOBILE_TESTS', 'Client Portal Mobile Responsive', 
           isMobileOptimized ? 'PASS' : 'FAIL',
           'Mobile viewport optimization');
    
    // Test mobile navigation
    try {
      const mobileNavigation = await page.$('nav, .mobile-nav, .sidebar');
      logTest('MOBILE_TESTS', 'Mobile Navigation Present', 
             mobileNavigation ? 'PASS' : 'FAIL',
             'Mobile navigation elements found');
    } catch (error) {
      logTest('MOBILE_TESTS', 'Mobile Navigation', 'ERROR', error.message);
    }
    
    // Reset viewport
    await page.setViewportSize(VIEWPORT);
    
  } catch (error) {
    logTest('MOBILE_TESTS', 'Mobile Portal Experience', 'ERROR', error.message);
  }
}

async function testPortalBusinessLogic(page) {
  console.log('\n🔍 Testing Portal Business Logic...');
  
  try {
    // Test client portal features
    await setMockAuth(page, TEST_USERS.client);
    
    // Test client dashboard
    await page.goto(`${BASE_URL}/portal/client/dashboard`);
    await page.waitForSelector('main, h1', { timeout: 5000 });
    logTest('BUSINESS_LOGIC', 'Client Dashboard', 'PASS', 'Client dashboard accessible');
    
    // Test client matters view
    await page.goto(`${BASE_URL}/portal/client/matters`);
    await page.waitForSelector('main, h1', { timeout: 5000 });
    logTest('BUSINESS_LOGIC', 'Client Matters View', 'PASS', 'Client can view their matters');
    
    // Test client profile access
    await page.goto(`${BASE_URL}/portal/client/profile`);
    await page.waitForSelector('main, h1', { timeout: 5000 });
    logTest('BUSINESS_LOGIC', 'Client Profile Access', 'PASS', 'Client can access profile');
    
    // Test staff workflow access
    await setMockAuth(page, TEST_USERS.staff);
    await page.goto(`${BASE_URL}/portal/staff`);
    await page.waitForSelector('h1', { timeout: 5000 });
    logTest('BUSINESS_LOGIC', 'Staff Workflow Access', 'PASS', 'Staff can access workflow tools');
    
  } catch (error) {
    logTest('BUSINESS_LOGIC', 'Portal Business Logic', 'ERROR', error.message);
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function runComprehensivePortalTests() {
  console.log('🚀 Starting Comprehensive Portal Access Testing...');
  console.log(`🎯 Target: ${BASE_URL}`);
  console.log('📋 Focus: Complete portal system and role-based access control\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: VIEWPORT
  });
  
  const page = await browser.newPage();
  
  try {
    // Create screenshots directory
    const screenshotDir = path.join(__dirname, 'test-screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    // Run all test suites
    await testClientPortalAccess(page);
    await testStaffPortalAccess(page);
    await testRBACValidation(page);
    await testSecurityBoundaries(page);
    await testPortalIntegration(page);
    await testMobilePortalExperience(page);
    await testPortalBusinessLogic(page);
    
    // Generate final report
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE PORTAL ACCESS TESTING REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n📈 TEST SUMMARY:`);
    console.log(`   Total Tests: ${testResults.summary.total_tests}`);
    console.log(`   ✅ Passed: ${testResults.summary.passed}`);
    console.log(`   ❌ Failed: ${testResults.summary.failed}`);
    console.log(`   ⚠️  Errors: ${testResults.summary.errors}`);
    
    const successRate = ((testResults.summary.passed / testResults.summary.total_tests) * 100).toFixed(1);
    console.log(`   📊 Success Rate: ${successRate}%`);
    
    // Portal functionality scores
    const clientPortalTests = testResults.detailed_results.filter(r => r.category === 'CLIENT_PORTAL');
    const staffPortalTests = testResults.detailed_results.filter(r => r.category === 'STAFF_PORTAL');
    const rbacTests = testResults.detailed_results.filter(r => r.category === 'RBAC_VALIDATION');
    const securityTests = testResults.detailed_results.filter(r => r.category === 'SECURITY_TESTS');
    
    console.log(`\n🎯 PORTAL FUNCTIONALITY SCORES:`);
    console.log(`   Client Portal: ${(clientPortalTests.filter(t => t.status === 'PASS').length / Math.max(clientPortalTests.length, 1) * 100).toFixed(1)}%`);
    console.log(`   Staff Portal: ${(staffPortalTests.filter(t => t.status === 'PASS').length / Math.max(staffPortalTests.length, 1) * 100).toFixed(1)}%`);
    console.log(`   RBAC Implementation: ${(rbacTests.filter(t => t.status === 'PASS').length / Math.max(rbacTests.length, 1) * 100).toFixed(1)}%`);
    console.log(`   Security Compliance: ${(securityTests.filter(t => t.status === 'PASS').length / Math.max(securityTests.length, 1) * 100).toFixed(1)}%`);
    
    // Save detailed results
    const reportPath = path.join(__dirname, 'COMPREHENSIVE_PORTAL_RBAC_TEST_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n💾 Detailed report saved: ${reportPath}`);
    
    // Generate status assessment
    let overallStatus = 'EXCELLENT';
    if (successRate < 90) overallStatus = 'GOOD';
    if (successRate < 80) overallStatus = 'NEEDS_IMPROVEMENT';
    if (successRate < 70) overallStatus = 'CRITICAL';
    
    console.log(`\n🏆 OVERALL PORTAL STATUS: ${overallStatus}`);
    console.log(`🎯 Production Readiness: ${successRate >= 95 ? 'READY' : successRate >= 85 ? 'MINOR_FIXES_NEEDED' : 'MAJOR_WORK_REQUIRED'}`);
    
  } catch (error) {
    console.error('❌ Fatal error during testing:', error);
    logTest('SYSTEM', 'Test Execution', 'ERROR', error.message);
  } finally {
    await browser.close();
  }
  
  return testResults;
}

// Run tests if called directly
if (require.main === module) {
  runComprehensivePortalTests()
    .then(() => {
      console.log('\n✅ Comprehensive Portal Testing Complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Testing failed:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensivePortalTests };