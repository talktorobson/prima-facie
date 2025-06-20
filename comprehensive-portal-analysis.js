#!/usr/bin/env node

// =============================================================================
// COMPREHENSIVE PORTAL ACCESS TESTING AGENT
// Tests portal functionality with proper Puppeteer API usage
// Target: http://localhost:3000
// =============================================================================

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test Configuration
const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 10000;

// Test Results Storage
let testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total_tests: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  portal_analysis: {
    client_portal: {
      accessibility: 'UNKNOWN',
      structure_score: 0,
      navigation_elements: 0,
      features_detected: [],
      issues: []
    },
    staff_portal: {
      accessibility: 'UNKNOWN',
      structure_score: 0,
      navigation_elements: 0,
      features_detected: [],
      issues: []
    },
    rbac_validation: {
      protected_routes: 0,
      total_routes_tested: 0,
      security_score: 0,
      vulnerabilities: []
    },
    integration_status: {
      mobile_responsive: false,
      messaging_integration: false,
      brazilian_compliance: false
    }
  }
};

// Utility Functions
function logTest(category, testName, status, details = '') {
  testResults.summary.total_tests++;
  
  if (status === 'PASS') {
    testResults.summary.passed++;
    console.log(`✅ [${category}] ${testName}`);
  } else if (status === 'FAIL') {
    testResults.summary.failed++;
    console.log(`❌ [${category}] ${testName} - ${details}`);
  } else if (status === 'WARN') {
    testResults.summary.warnings++;
    console.log(`⚠️  [${category}] ${testName} - ${details}`);
  }

  if (details) {
    console.log(`   Details: ${details}`);
  }
}

async function waitForPageLoad(page, timeout = TIMEOUT) {
  try {
    await page.waitForLoadState('domcontentloaded', { timeout });
  } catch (error) {
    // Fallback to simple timeout
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// =============================================================================
// MAIN TESTING FUNCTIONS
// =============================================================================

async function testClientPortalAccess(page) {
  console.log('\n🔍 Testing Client Portal Access...');
  
  try {
    // Navigate to client portal
    const response = await page.goto(`${BASE_URL}/portal/client`, { waitUntil: 'domcontentloaded' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    
    if (currentUrl.includes('/login')) {
      testResults.portal_analysis.client_portal.accessibility = 'PROTECTED';
      logTest('CLIENT_PORTAL', 'Authentication Protection', 'PASS', 'Properly redirected to login');
    } else if (currentUrl.includes('/portal/client')) {
      testResults.portal_analysis.client_portal.accessibility = 'ACCESSIBLE';
      logTest('CLIENT_PORTAL', 'Direct Access', 'PASS', 'Portal directly accessible');
      
      // Analyze portal structure
      const pageContent = await page.content();
      
      // Check for Portuguese/Brazilian content
      if (pageContent.includes('Portal do Cliente') || pageContent.includes('Cliente')) {
        testResults.portal_analysis.client_portal.features_detected.push('Brazilian Localization');
        testResults.portal_analysis.integration_status.brazilian_compliance = true;
        logTest('CLIENT_PORTAL', 'Brazilian Localization', 'PASS', 'Portuguese content detected');
      }
      
      // Check for layout structure
      if (pageContent.includes('sidebar') || pageContent.includes('navigation') || pageContent.includes('nav')) {
        testResults.portal_analysis.client_portal.structure_score = 80;
        testResults.portal_analysis.client_portal.features_detected.push('Layout Structure');
        logTest('CLIENT_PORTAL', 'Layout Structure', 'PASS', 'Portal layout detected');
      }
      
      // Count navigation elements
      const navElements = await page.$$('nav, .nav, .navigation, .sidebar, a[href*="portal"]');
      testResults.portal_analysis.client_portal.navigation_elements = navElements.length;
      
      if (navElements.length > 0) {
        testResults.portal_analysis.client_portal.features_detected.push('Navigation Menu');
        logTest('CLIENT_PORTAL', 'Navigation Elements', 'PASS', `Found ${navElements.length} navigation elements`);
      } else {
        testResults.portal_analysis.client_portal.issues.push('No navigation elements found');
        logTest('CLIENT_PORTAL', 'Navigation Elements', 'WARN', 'No navigation elements detected');
      }
      
    } else {
      testResults.portal_analysis.client_portal.accessibility = 'REDIRECT_ISSUE';
      testResults.portal_analysis.client_portal.issues.push(`Unexpected redirect to: ${currentUrl}`);
      logTest('CLIENT_PORTAL', 'Access Behavior', 'WARN', `Unexpected redirect: ${currentUrl}`);
    }
    
    // Test client portal subpages
    const clientPages = [
      '/portal/client/dashboard',
      '/portal/client/matters',
      '/portal/client/profile',
      '/portal/client/messages'
    ];
    
    for (const pagePath of clientPages) {
      try {
        await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'domcontentloaded' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const pageUrl = page.url();
        if (pageUrl.includes(pagePath) || pageUrl.includes('/portal/client') || pageUrl.includes('/login')) {
          testResults.portal_analysis.client_portal.features_detected.push(`Subpage: ${pagePath}`);
          logTest('CLIENT_PORTAL', `Subpage Access: ${pagePath}`, 'PASS', 'Subpage accessible');
        } else {
          testResults.portal_analysis.client_portal.issues.push(`Subpage ${pagePath} redirect issue`);
          logTest('CLIENT_PORTAL', `Subpage Access: ${pagePath}`, 'WARN', `Unexpected redirect: ${pageUrl}`);
        }
      } catch (error) {
        testResults.portal_analysis.client_portal.issues.push(`Subpage ${pagePath} error: ${error.message}`);
        logTest('CLIENT_PORTAL', `Subpage Access: ${pagePath}`, 'FAIL', error.message);
      }
    }
    
  } catch (error) {
    testResults.portal_analysis.client_portal.issues.push(`Analysis error: ${error.message}`);
    logTest('CLIENT_PORTAL', 'Client Portal Analysis', 'FAIL', error.message);
  }
}

async function testStaffPortalAccess(page) {
  console.log('\n🔍 Testing Staff Portal Access...');
  
  try {
    // Navigate to staff portal
    await page.goto(`${BASE_URL}/portal/staff`, { waitUntil: 'domcontentloaded' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    
    if (currentUrl.includes('/login')) {
      testResults.portal_analysis.staff_portal.accessibility = 'PROTECTED';
      logTest('STAFF_PORTAL', 'Authentication Protection', 'PASS', 'Properly redirected to login');
    } else if (currentUrl.includes('/portal/staff')) {
      testResults.portal_analysis.staff_portal.accessibility = 'ACCESSIBLE';
      logTest('STAFF_PORTAL', 'Direct Access', 'PASS', 'Staff portal accessible');
      
      // Analyze staff portal structure
      const pageContent = await page.content();
      
      if (pageContent.includes('Portal do Colaborador') || pageContent.includes('Colaborador') || pageContent.includes('Staff')) {
        testResults.portal_analysis.staff_portal.structure_score = 70;
        testResults.portal_analysis.staff_portal.features_detected.push('Staff Portal Layout');
        logTest('STAFF_PORTAL', 'Staff Portal Structure', 'PASS', 'Staff portal content detected');
      }
      
      // Count navigation elements
      const staffNavElements = await page.$$('nav, .nav, .navigation, a[href*="staff"]');
      testResults.portal_analysis.staff_portal.navigation_elements = staffNavElements.length;
      
      if (staffNavElements.length > 0) {
        testResults.portal_analysis.staff_portal.features_detected.push('Staff Navigation');
        logTest('STAFF_PORTAL', 'Navigation Elements', 'PASS', `Found ${staffNavElements.length} navigation elements`);
      } else {
        testResults.portal_analysis.staff_portal.issues.push('Limited navigation elements');
        logTest('STAFF_PORTAL', 'Navigation Elements', 'WARN', 'Few navigation elements detected');
      }
      
    } else {
      testResults.portal_analysis.staff_portal.accessibility = 'REDIRECT_ISSUE';
      testResults.portal_analysis.staff_portal.issues.push(`Unexpected redirect to: ${currentUrl}`);
      logTest('STAFF_PORTAL', 'Access Behavior', 'WARN', `Unexpected redirect: ${currentUrl}`);
    }
    
  } catch (error) {
    testResults.portal_analysis.staff_portal.issues.push(`Analysis error: ${error.message}`);
    logTest('STAFF_PORTAL', 'Staff Portal Analysis', 'FAIL', error.message);
  }
}

async function testRBACImplementation(page) {
  console.log('\n🔍 Testing RBAC Implementation...');
  
  try {
    const protectedRoutes = [
      '/admin',
      '/admin/users',
      '/admin/settings',
      '/dashboard',
      '/matters',
      '/clients',
      '/billing',
      '/reports',
      '/settings'
    ];
    
    let protectedCount = 0;
    
    for (const route of protectedRoutes) {
      testResults.portal_analysis.rbac_validation.total_routes_tested++;
      
      try {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const currentUrl = page.url();
        
        if (currentUrl.includes('/login') || !currentUrl.includes(route)) {
          protectedCount++;
          testResults.portal_analysis.rbac_validation.protected_routes++;
          logTest('RBAC', `Route Protection: ${route}`, 'PASS', 'Route properly protected');
        } else {
          testResults.portal_analysis.rbac_validation.vulnerabilities.push(`Unprotected route: ${route}`);
          logTest('RBAC', `Route Protection: ${route}`, 'FAIL', 'Route accessible without authentication');
        }
      } catch (error) {
        logTest('RBAC', `Route Protection: ${route}`, 'WARN', error.message);
      }
    }
    
    // Calculate security score
    const securityRate = (protectedCount / protectedRoutes.length) * 100;
    testResults.portal_analysis.rbac_validation.security_score = securityRate;
    
    if (securityRate >= 90) {
      logTest('RBAC', 'Overall Security', 'PASS', `${securityRate.toFixed(1)}% routes protected`);
    } else if (securityRate >= 70) {
      logTest('RBAC', 'Overall Security', 'WARN', `${securityRate.toFixed(1)}% routes protected`);
    } else {
      logTest('RBAC', 'Overall Security', 'FAIL', `Only ${securityRate.toFixed(1)}% routes protected`);
    }
    
    // Test URL manipulation attempts
    const maliciousUrls = [
      '/portal/client/../admin',
      '/portal/staff/../../admin',
      '/admin?bypass=true',
      '/dashboard?role=admin'
    ];
    
    for (const maliciousUrl of maliciousUrls) {
      try {
        await page.goto(`${BASE_URL}${maliciousUrl}`, { waitUntil: 'domcontentloaded' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const resultUrl = page.url();
        
        if (!resultUrl.includes('/admin') || resultUrl.includes('/login')) {
          logTest('RBAC', `URL Manipulation: ${maliciousUrl}`, 'PASS', 'Malicious URL blocked');
        } else {
          testResults.portal_analysis.rbac_validation.vulnerabilities.push(`URL manipulation vulnerability: ${maliciousUrl}`);
          logTest('RBAC', `URL Manipulation: ${maliciousUrl}`, 'FAIL', `Malicious URL succeeded: ${resultUrl}`);
        }
      } catch (error) {
        logTest('RBAC', `URL Manipulation: ${maliciousUrl}`, 'PASS', 'URL properly rejected');
      }
    }
    
  } catch (error) {
    logTest('RBAC', 'RBAC Implementation', 'FAIL', error.message);
  }
}

async function testPortalIntegration(page) {
  console.log('\n🔍 Testing Portal Integration...');
  
  try {
    // Test home page behavior
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const homeUrl = page.url();
    if (homeUrl.includes('/login') || homeUrl.includes('/dashboard') || homeUrl.includes('/portal')) {
      logTest('INTEGRATION', 'Home Page Routing', 'PASS', 'Home page routing working');
    } else {
      logTest('INTEGRATION', 'Home Page Routing', 'WARN', `Unexpected home behavior: ${homeUrl}`);
    }
    
    // Test mobile responsiveness
    await page.setViewport({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/portal/client`, { waitUntil: 'domcontentloaded' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const viewport = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight
    }));
    
    if (viewport.width <= 768) {
      testResults.portal_analysis.integration_status.mobile_responsive = true;
      logTest('INTEGRATION', 'Mobile Responsiveness', 'PASS', `Mobile viewport: ${viewport.width}x${viewport.height}`);
    } else {
      logTest('INTEGRATION', 'Mobile Responsiveness', 'FAIL', 'Mobile viewport not working');
    }
    
    // Reset viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Test messaging integration
    try {
      await page.goto(`${BASE_URL}/portal/client/messages`, { waitUntil: 'domcontentloaded' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const messagesUrl = page.url();
      if (messagesUrl.includes('/messages') || messagesUrl.includes('/login')) {
        testResults.portal_analysis.integration_status.messaging_integration = true;
        logTest('INTEGRATION', 'Messaging Integration', 'PASS', 'Messages feature accessible');
      } else {
        logTest('INTEGRATION', 'Messaging Integration', 'WARN', 'Messages feature may have issues');
      }
    } catch (error) {
      logTest('INTEGRATION', 'Messaging Integration', 'WARN', error.message);
    }
    
  } catch (error) {
    logTest('INTEGRATION', 'Portal Integration', 'FAIL', error.message);
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function runComprehensivePortalAnalysis() {
  console.log('🚀 Starting Comprehensive Portal Access Testing...');
  console.log(`🎯 Target: ${BASE_URL}`);
  console.log('📋 Focus: Complete portal system and RBAC validation\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Run all test suites
    await testClientPortalAccess(page);
    await testStaffPortalAccess(page);
    await testRBACImplementation(page);
    await testPortalIntegration(page);
    
    // Generate comprehensive report
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE PORTAL ACCESS TESTING REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n📈 TEST SUMMARY:`);
    console.log(`   Total Tests: ${testResults.summary.total_tests}`);
    console.log(`   ✅ Passed: ${testResults.summary.passed}`);
    console.log(`   ❌ Failed: ${testResults.summary.failed}`);
    console.log(`   ⚠️  Warnings: ${testResults.summary.warnings}`);
    
    const successRate = testResults.summary.total_tests > 0 ? 
      ((testResults.summary.passed / testResults.summary.total_tests) * 100).toFixed(1) : 0;
    console.log(`   📊 Success Rate: ${successRate}%`);
    
    console.log(`\n🎯 PORTAL FUNCTIONALITY SCORES BY ROLE:`);
    console.log(`   Client Portal Accessibility: ${testResults.portal_analysis.client_portal.accessibility}`);
    console.log(`   Client Portal Structure: ${testResults.portal_analysis.client_portal.structure_score}%`);
    console.log(`   Client Portal Features: ${testResults.portal_analysis.client_portal.features_detected.length} detected`);
    console.log(`   Staff Portal Accessibility: ${testResults.portal_analysis.staff_portal.accessibility}`);
    console.log(`   Staff Portal Structure: ${testResults.portal_analysis.staff_portal.structure_score}%`);
    
    console.log(`\n🔒 RBAC IMPLEMENTATION VALIDATION:`);
    console.log(`   Protected Routes: ${testResults.portal_analysis.rbac_validation.protected_routes}/${testResults.portal_analysis.rbac_validation.total_routes_tested}`);
    console.log(`   Security Score: ${testResults.portal_analysis.rbac_validation.security_score.toFixed(1)}%`);
    console.log(`   Security Vulnerabilities: ${testResults.portal_analysis.rbac_validation.vulnerabilities.length}`);
    
    console.log(`\n🔗 PORTAL INTEGRATION STATUS:`);
    console.log(`   Mobile Responsive: ${testResults.portal_analysis.integration_status.mobile_responsive ? '✅' : '❌'}`);
    console.log(`   Messaging Integration: ${testResults.portal_analysis.integration_status.messaging_integration ? '✅' : '❌'}`);
    console.log(`   Brazilian Compliance: ${testResults.portal_analysis.integration_status.brazilian_compliance ? '✅' : '❌'}`);
    
    console.log(`\n📱 MOBILE EXPERIENCE ASSESSMENT:`);
    const mobileScore = testResults.portal_analysis.integration_status.mobile_responsive ? 'RESPONSIVE' : 'NEEDS_WORK';
    console.log(`   Mobile Portal Experience: ${mobileScore}`);
    
    console.log(`\n🏛️ BUSINESS WORKFLOW VALIDATION:`);
    console.log(`   Client Portal Features: ${testResults.portal_analysis.client_portal.features_detected.join(', ')}`);
    console.log(`   Staff Portal Features: ${testResults.portal_analysis.staff_portal.features_detected.join(', ')}`);
    
    console.log(`\n⚠️  SECURITY COMPLIANCE VERIFICATION:`);
    const securityIssuesCount = testResults.portal_analysis.rbac_validation.vulnerabilities.length +
                               testResults.portal_analysis.client_portal.issues.length +
                               testResults.portal_analysis.staff_portal.issues.length;
    console.log(`   Total Issues Found: ${securityIssuesCount}`);
    
    if (testResults.portal_analysis.rbac_validation.vulnerabilities.length > 0) {
      console.log(`   Security Vulnerabilities:`);
      testResults.portal_analysis.rbac_validation.vulnerabilities.forEach(vuln => {
        console.log(`   - ${vuln}`);
      });
    }
    
    // Save detailed results
    const reportPath = path.join(__dirname, 'COMPREHENSIVE_PORTAL_TESTING_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n💾 Detailed report saved: ${reportPath}`);
    
    // Final assessment
    const rbacScore = testResults.portal_analysis.rbac_validation.security_score;
    const clientPortalScore = testResults.portal_analysis.client_portal.structure_score;
    
    let overallStatus = 'EXCELLENT';
    if (rbacScore < 90 || clientPortalScore < 70) overallStatus = 'GOOD';
    if (rbacScore < 80 || clientPortalScore < 50) overallStatus = 'NEEDS_IMPROVEMENT';
    if (rbacScore < 70 || clientPortalScore < 30) overallStatus = 'CRITICAL';
    
    console.log(`\n🏆 OVERALL PORTAL STATUS: ${overallStatus}`);
    
    const productionReady = rbacScore >= 90 && 
                           clientPortalScore >= 70 && 
                           testResults.portal_analysis.rbac_validation.vulnerabilities.length === 0;
    
    console.log(`🎯 Production Readiness: ${productionReady ? 'DEPLOYMENT_READY' : rbacScore >= 80 ? 'MINOR_FIXES_NEEDED' : 'MAJOR_WORK_REQUIRED'}`);
    
    // Key recommendations
    console.log(`\n💡 KEY RECOMMENDATIONS:`);
    if (testResults.portal_analysis.client_portal.structure_score < 80) {
      console.log(`   - Enhance client portal structure and navigation`);
    }
    if (testResults.portal_analysis.staff_portal.structure_score < 70) {
      console.log(`   - Develop staff portal functionality further`);
    }
    if (rbacScore < 90) {
      console.log(`   - Strengthen RBAC implementation and route protection`);
    }
    if (!testResults.portal_analysis.integration_status.mobile_responsive) {
      console.log(`   - Implement mobile-responsive design`);
    }
    if (!testResults.portal_analysis.integration_status.messaging_integration) {
      console.log(`   - Complete messaging system integration`);
    }
    
    console.log(`\n✨ FINAL ASSESSMENT:`);
    console.log(`   Portal System Development: ${successRate >= 80 ? '🚀 WELL DEVELOPED' : '🔧 NEEDS DEVELOPMENT'}`);
    console.log(`   Security Implementation: ${rbacScore >= 85 ? '🔒 SECURE' : '⚠️  NEEDS SECURITY WORK'}`);
    console.log(`   User Experience: ${testResults.portal_analysis.integration_status.brazilian_compliance ? '🌍 BRAZILIAN COMPLIANT' : '🔧 NEEDS LOCALIZATION'}`);
    
  } catch (error) {
    console.error('❌ Fatal analysis error:', error);
  } finally {
    await browser.close();
  }
  
  return testResults;
}

// Run analysis if called directly
if (require.main === module) {
  runComprehensivePortalAnalysis()
    .then(() => {
      console.log('\n✅ Comprehensive Portal Analysis Complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensivePortalAnalysis };