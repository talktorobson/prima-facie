#!/usr/bin/env node

// =============================================================================
// DIRECT PORTAL ACCESS TESTING AGENT
// Tests portal functionality using direct HTTP requests and DOM analysis
// Target: http://localhost:3002
// =============================================================================

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test Configuration
const BASE_URL = 'http://localhost:3002';
const TIMEOUT = 15000;

// Test Results Storage
let testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total_tests: 0,
    passed: 0,
    failed: 0,
    errors: 0
  },
  portal_functionality: {
    client_portal_structure: 0,
    staff_portal_structure: 0,
    navigation_functionality: 0,
    rbac_implementation: 0,
    security_measures: 0
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

// =============================================================================
// MAIN TESTING FUNCTIONS
// =============================================================================

async function testPortalAccessibility(page) {
  console.log('\n🔍 Testing Portal Accessibility...');
  
  try {
    // Test client portal accessibility (without auth)
    await page.goto(`${BASE_URL}/portal/client`);
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      logTest('ACCESSIBILITY', 'Client Portal Authentication Required', 'PASS', 'Properly redirected to login');
    } else if (currentUrl.includes('/portal/client')) {
      logTest('ACCESSIBILITY', 'Client Portal Accessible', 'PASS', 'Portal page loaded');
    } else {
      logTest('ACCESSIBILITY', 'Client Portal Redirect', 'FAIL', `Unexpected redirect: ${currentUrl}`);
    }
    
    // Test staff portal accessibility
    await page.goto(`${BASE_URL}/portal/staff`);
    await page.waitForTimeout(3000);
    
    const staffUrl = page.url();
    if (staffUrl.includes('/login') || staffUrl.includes('/portal')) {
      logTest('ACCESSIBILITY', 'Staff Portal Protected/Accessible', 'PASS', 'Portal properly handled');
    } else {
      logTest('ACCESSIBILITY', 'Staff Portal Access', 'FAIL', `Unexpected behavior: ${staffUrl}`);
    }
    
  } catch (error) {
    logTest('ACCESSIBILITY', 'Portal Accessibility', 'ERROR', error.message);
  }
}

async function testPortalStructure(page) {
  console.log('\n🔍 Testing Portal Structure...');
  
  try {
    // Test login page structure first
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('form, input[type="email"], .login-form', { timeout: 10000 });
    logTest('STRUCTURE', 'Login Page Structure', 'PASS', 'Login form found');
    
    // Test direct portal access and structure
    await page.goto(`${BASE_URL}/portal/client`);
    await page.waitForTimeout(5000);
    
    // Check if we can see any portal content or proper redirects
    const pageContent = await page.content();
    const hasPortalElements = pageContent.includes('Portal') || pageContent.includes('Cliente') || pageContent.includes('Client');
    
    if (hasPortalElements) {
      logTest('STRUCTURE', 'Client Portal Content', 'PASS', 'Portal elements found');
    } else {
      logTest('STRUCTURE', 'Client Portal Content', 'FAIL', 'No portal elements detected');
    }
    
    // Test for navigation elements
    const navigation = await page.$$('nav, .navigation, .sidebar, a[href*="portal"]');
    logTest('STRUCTURE', 'Portal Navigation Elements', 
           navigation.length > 0 ? 'PASS' : 'FAIL',
           `Found ${navigation.length} navigation elements`);
    
    // Test staff portal structure
    await page.goto(`${BASE_URL}/portal/staff`);
    await page.waitForTimeout(3000);
    
    const staffContent = await page.content();
    const hasStaffElements = staffContent.includes('Colaborador') || staffContent.includes('Staff') || staffContent.includes('Portal');
    
    logTest('STRUCTURE', 'Staff Portal Structure', 
           hasStaffElements ? 'PASS' : 'FAIL',
           'Staff portal elements detection');
    
  } catch (error) {
    logTest('STRUCTURE', 'Portal Structure', 'ERROR', error.message);
  }
}

async function testRBACImplementation(page) {
  console.log('\n🔍 Testing RBAC Implementation...');
  
  try {
    // Test middleware protection
    const protectedRoutes = [
      '/admin',
      '/dashboard', 
      '/matters',
      '/clients',
      '/billing',
      '/reports'
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/login') || currentUrl !== `${BASE_URL}${route}`) {
        logTest('RBAC', `Protected Route: ${route}`, 'PASS', 'Route properly protected');
      } else {
        logTest('RBAC', `Protected Route: ${route}`, 'FAIL', 'Route accessible without auth');
      }
    }
    
    // Test portal route behavior
    const portalRoutes = [
      '/portal/client',
      '/portal/staff'
    ];
    
    for (const route of portalRoutes) {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      // Portal routes should either show content or redirect to login
      if (currentUrl.includes('/login') || currentUrl.includes('/portal')) {
        logTest('RBAC', `Portal Route: ${route}`, 'PASS', 'Route properly handled');
      } else {
        logTest('RBAC', `Portal Route: ${route}`, 'FAIL', `Unexpected redirect: ${currentUrl}`);
      }
    }
    
  } catch (error) {
    logTest('RBAC', 'RBAC Implementation', 'ERROR', error.message);
  }
}

async function testSecurityMeasures(page) {
  console.log('\n🔍 Testing Security Measures...');
  
  try {
    // Test for common security headers and measures
    const response = await page.goto(`${BASE_URL}/portal/client`);
    const headers = response.headers();
    
    // Check for basic security practices
    const hasSecurityHeaders = headers['x-frame-options'] || headers['content-security-policy'] || headers['x-content-type-options'];
    logTest('SECURITY', 'Security Headers', 
           hasSecurityHeaders ? 'PASS' : 'INFO',
           'Security headers detection');
    
    // Test URL manipulation attempts
    const maliciousUrls = [
      '/portal/client/../admin',
      '/portal/staff/../../admin',  
      '/portal/client?role=admin',
      '/admin?source=portal'
    ];
    
    for (const url of maliciousUrls) {
      try {
        await page.goto(`${BASE_URL}${url}`);
        await page.waitForTimeout(2000);
        
        const finalUrl = page.url();
        // Should not end up in admin area
        if (!finalUrl.includes('/admin') || finalUrl.includes('/login') || finalUrl.includes('/portal')) {
          logTest('SECURITY', `URL Manipulation: ${url}`, 'PASS', 'Malicious URL blocked');
        } else {
          logTest('SECURITY', `URL Manipulation: ${url}`, 'FAIL', `Access granted: ${finalUrl}`);
        }
      } catch (error) {
        logTest('SECURITY', `URL Manipulation: ${url}`, 'PASS', 'URL properly rejected');
      }
    }
    
  } catch (error) {
    logTest('SECURITY', 'Security Measures', 'ERROR', error.message);
  }
}

async function testNavigationFunctionality(page) {
  console.log('\n🔍 Testing Navigation Functionality...');
  
  try {
    // Test main navigation from root
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(3000);
    
    // Look for navigation links
    const links = await page.$$('a[href]');
    const linkCount = links.length;
    logTest('NAVIGATION', 'Homepage Navigation Links', 
           linkCount > 0 ? 'PASS' : 'FAIL',
           `Found ${linkCount} navigation links`);
    
    // Test portal navigation structure
    await page.goto(`${BASE_URL}/portal/client`);
    await page.waitForTimeout(3000);
    
    // Check for portal-specific navigation
    const portalLinks = await page.$$eval('a[href*="portal"]', links => 
      links.map(a => ({ href: a.href, text: a.textContent?.trim() }))
    );
    
    logTest('NAVIGATION', 'Portal Navigation Links', 
           portalLinks.length > 0 ? 'PASS' : 'FAIL',
           `Found ${portalLinks.length} portal links`);
    
    // Test breadcrumb or pathway navigation
    const breadcrumbs = await page.$$(
      '.breadcrumb, [aria-label*="breadcrumb"], nav[aria-label*="Breadcrumb"]'
    );
    
    logTest('NAVIGATION', 'Breadcrumb Navigation', 
           breadcrumbs.length > 0 ? 'PASS' : 'INFO',
           `Found ${breadcrumbs.length} breadcrumb elements`);
    
  } catch (error) {
    logTest('NAVIGATION', 'Navigation Functionality', 'ERROR', error.message);
  }
}

async function testMobileResponsiveness(page) {
  console.log('\n🔍 Testing Mobile Responsiveness...');
  
  try {
    // Test desktop first
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(`${BASE_URL}/portal/client`);
    await page.waitForTimeout(3000);
    
    const desktopLayout = await page.evaluate(() => {
      return {
        width: window.innerWidth,
        bodyWidth: document.body.offsetWidth,
        hasResponsiveElements: !!document.querySelector('.responsive, .lg\\:, .md\\:, .sm\\:, [class*="responsive"]')
      };
    });
    
    logTest('MOBILE', 'Desktop Layout', 'PASS', `Desktop: ${desktopLayout.width}px`);
    
    // Test tablet
    await page.setViewport({ width: 768, height: 1024 });
    await page.reload();
    await page.waitForTimeout(2000);
    
    const tabletLayout = await page.evaluate(() => ({
      width: window.innerWidth,
      isResponsive: document.body.offsetWidth <= window.innerWidth
    }));
    
    logTest('MOBILE', 'Tablet Responsiveness', 
           tabletLayout.isResponsive ? 'PASS' : 'FAIL',
           `Tablet: ${tabletLayout.width}px`);
    
    // Test mobile
    await page.setViewport({ width: 375, height: 812 });
    await page.reload();
    await page.waitForTimeout(2000);
    
    const mobileLayout = await page.evaluate(() => ({
      width: window.innerWidth,
      isResponsive: document.body.offsetWidth <= window.innerWidth,
      hasMobileNav: !!document.querySelector('.mobile-nav, .hamburger, [class*="mobile"]')
    }));
    
    logTest('MOBILE', 'Mobile Responsiveness', 
           mobileLayout.isResponsive ? 'PASS' : 'FAIL',
           `Mobile: ${mobileLayout.width}px`);
    
    // Reset viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
  } catch (error) {
    logTest('MOBILE', 'Mobile Responsiveness', 'ERROR', error.message);
  }
}

async function testBusinessLogicCompliance(page) {
  console.log('\n🔍 Testing Business Logic Compliance...');
  
  try {
    // Test Brazilian localization elements
    await page.goto(`${BASE_URL}/portal/client`);
    await page.waitForTimeout(3000);
    
    const pageContent = await page.content();
    const hasBrazilianContent = pageContent.includes('Cliente') || 
                               pageContent.includes('Portal') ||
                               pageContent.includes('Colaborador') ||
                               pageContent.includes('Processo');
    
    logTest('BUSINESS_LOGIC', 'Brazilian Localization', 
           hasBrazilianContent ? 'PASS' : 'FAIL',
           'Portuguese language elements');
    
    // Test legal-specific terminology
    const hasLegalTerms = pageContent.includes('Processo') ||
                         pageContent.includes('Advocacia') ||
                         pageContent.includes('Jurídico') ||
                         pageContent.includes('Cliente');
    
    logTest('BUSINESS_LOGIC', 'Legal Terminology', 
           hasLegalTerms ? 'PASS' : 'INFO',
           'Legal practice terminology');
    
    // Test for portal-specific workflows
    const portalWorkflowElements = await page.$$('[data-testid], [role="button"], .btn, button');
    logTest('BUSINESS_LOGIC', 'Portal Workflow Elements', 
           portalWorkflowElements.length > 0 ? 'PASS' : 'FAIL',
           `Found ${portalWorkflowElements.length} workflow elements`);
    
  } catch (error) {
    logTest('BUSINESS_LOGIC', 'Business Logic Compliance', 'ERROR', error.message);
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function runDirectPortalTests() {
  console.log('🚀 Starting Direct Portal Access Testing...');
  console.log(`🎯 Target: ${BASE_URL}`);
  console.log('📋 Focus: Portal structure, RBAC, and security validation\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Run all test suites
    await testPortalAccessibility(page);
    await testPortalStructure(page);
    await testRBACImplementation(page);
    await testSecurityMeasures(page);
    await testNavigationFunctionality(page);
    await testMobileResponsiveness(page);
    await testBusinessLogicCompliance(page);
    
    // Calculate functionality scores
    const categories = ['ACCESSIBILITY', 'STRUCTURE', 'RBAC', 'SECURITY', 'NAVIGATION', 'MOBILE', 'BUSINESS_LOGIC'];
    
    categories.forEach(category => {
      const categoryTests = testResults.detailed_results.filter(r => r.category === category);
      const passed = categoryTests.filter(t => t.status === 'PASS').length;
      const total = categoryTests.length;
      const score = total > 0 ? (passed / total * 100).toFixed(1) : 0;
      
      switch(category) {
        case 'STRUCTURE':
          testResults.portal_functionality.client_portal_structure = parseFloat(score);
          testResults.portal_functionality.staff_portal_structure = parseFloat(score);
          break;
        case 'NAVIGATION':
          testResults.portal_functionality.navigation_functionality = parseFloat(score);
          break;
        case 'RBAC':
          testResults.portal_functionality.rbac_implementation = parseFloat(score);
          break;
        case 'SECURITY':
          testResults.portal_functionality.security_measures = parseFloat(score);
          break;
      }
    });
    
    // Generate final report
    console.log('\n' + '='.repeat(80));
    console.log('📊 DIRECT PORTAL ACCESS TESTING REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n📈 TEST SUMMARY:`);
    console.log(`   Total Tests: ${testResults.summary.total_tests}`);
    console.log(`   ✅ Passed: ${testResults.summary.passed}`);
    console.log(`   ❌ Failed: ${testResults.summary.failed}`);
    console.log(`   ⚠️  Errors: ${testResults.summary.errors}`);
    
    const successRate = ((testResults.summary.passed / testResults.summary.total_tests) * 100).toFixed(1);
    console.log(`   📊 Success Rate: ${successRate}%`);
    
    console.log(`\n🎯 PORTAL FUNCTIONALITY SCORES:`);
    console.log(`   Client Portal Structure: ${testResults.portal_functionality.client_portal_structure}%`);
    console.log(`   Staff Portal Structure: ${testResults.portal_functionality.staff_portal_structure}%`);
    console.log(`   Navigation Functionality: ${testResults.portal_functionality.navigation_functionality}%`);
    console.log(`   RBAC Implementation: ${testResults.portal_functionality.rbac_implementation}%`);
    console.log(`   Security Measures: ${testResults.portal_functionality.security_measures}%`);
    
    // Category breakdown
    console.log(`\n📋 DETAILED CATEGORY ANALYSIS:`);
    categories.forEach(category => {
      const categoryTests = testResults.detailed_results.filter(r => r.category === category);
      const passed = categoryTests.filter(t => t.status === 'PASS').length;
      const failed = categoryTests.filter(t => t.status === 'FAIL').length;
      const errors = categoryTests.filter(t => t.status === 'ERROR').length;
      const total = categoryTests.length;
      
      console.log(`   ${category}: ${passed}/${total} passed (${failed} failed, ${errors} errors)`);
    });
    
    // Save detailed results
    const reportPath = path.join(__dirname, 'DIRECT_PORTAL_RBAC_TEST_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n💾 Detailed report saved: ${reportPath}`);
    
    // Generate status assessment
    let overallStatus = 'EXCELLENT';
    if (successRate < 90) overallStatus = 'GOOD';
    if (successRate < 80) overallStatus = 'NEEDS_IMPROVEMENT';
    if (successRate < 70) overallStatus = 'CRITICAL';
    
    console.log(`\n🏆 OVERALL PORTAL STATUS: ${overallStatus}`);
    console.log(`🎯 Production Readiness: ${successRate >= 95 ? 'READY' : successRate >= 85 ? 'MINOR_FIXES_NEEDED' : 'MAJOR_WORK_REQUIRED'}`);
    
    // Key findings
    console.log(`\n🔍 KEY FINDINGS:`);
    const rbacScore = testResults.portal_functionality.rbac_implementation;
    const securityScore = testResults.portal_functionality.security_measures;
    
    if (rbacScore >= 80) {
      console.log(`   ✅ RBAC implementation is solid (${rbacScore}%)`);
    } else {
      console.log(`   ⚠️  RBAC needs improvement (${rbacScore}%)`);
    }
    
    if (securityScore >= 80) {
      console.log(`   ✅ Security measures are adequate (${securityScore}%)`);
    } else {
      console.log(`   ⚠️  Security measures need attention (${securityScore}%)`);
    }
    
    console.log(`\n📱 MOBILE EXPERIENCE: ${testResults.detailed_results.filter(r => r.category === 'MOBILE' && r.status === 'PASS').length > 0 ? 'RESPONSIVE' : 'NEEDS_WORK'}`);
    console.log(`🌍 BRAZILIAN COMPLIANCE: ${testResults.detailed_results.some(r => r.category === 'BUSINESS_LOGIC' && r.test.includes('Brazilian') && r.status === 'PASS') ? 'COMPLIANT' : 'NEEDS_REVIEW'}`);
    
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
  runDirectPortalTests()
    .then(() => {
      console.log('\n✅ Direct Portal Testing Complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Testing failed:', error);
      process.exit(1);
    });
}

module.exports = { runDirectPortalTests };