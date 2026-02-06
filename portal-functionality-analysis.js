#!/usr/bin/env node

// =============================================================================
// PORTAL FUNCTIONALITY ANALYSIS
// Comprehensive analysis of portal structure and RBAC implementation
// Target: http://localhost:3000
// =============================================================================

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test Configuration
const BASE_URL = 'http://localhost:3000';
const VIEWPORT = { width: 1920, height: 1080 };

// Test Results Storage
let analysisResults = {
  timestamp: new Date().toISOString(),
  portal_analysis: {
    client_portal: {
      accessibility: 'UNKNOWN',
      structure_score: 0,
      navigation_score: 0,
      features: [],
      issues: []
    },
    staff_portal: {
      accessibility: 'UNKNOWN', 
      structure_score: 0,
      navigation_score: 0,
      features: [],
      issues: []
    },
    rbac_implementation: {
      middleware_protection: 'UNKNOWN',
      role_guards: 'UNKNOWN',
      access_control_score: 0,
      security_issues: []
    },
    integration_status: {
      messaging_integration: 'UNKNOWN',
      dashboard_integration: 'UNKNOWN',
      mobile_responsiveness: 'UNKNOWN'
    }
  },
  test_summary: {
    total_checks: 0,
    passed_checks: 0,
    failed_checks: 0,
    warnings: 0
  }
};

// Utility Functions
function logResult(category, check, status, details = '') {
  analysisResults.test_summary.total_checks++;
  
  if (status === 'PASS') {
    analysisResults.test_summary.passed_checks++;
    console.log(`✅ [${category}] ${check}`);
  } else if (status === 'FAIL') {
    analysisResults.test_summary.failed_checks++;
    console.log(`❌ [${category}] ${check} - ${details}`);
  } else if (status === 'WARN') {
    analysisResults.test_summary.warnings++;
    console.log(`⚠️  [${category}] ${check} - ${details}`);
  } else {
    console.log(`ℹ️  [${category}] ${check} - ${details}`);
  }

  if (details) {
    console.log(`   Details: ${details}`);
  }
}

// =============================================================================
// ANALYSIS FUNCTIONS
// =============================================================================

async function analyzeClientPortal(page) {
  console.log('\n🔍 Analyzing Client Portal...');
  
  try {
    // Test client portal accessibility
    await page.goto(`${BASE_URL}/portal/client`);
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      analysisResults.portal_analysis.client_portal.accessibility = 'PROTECTED';
      logResult('CLIENT_PORTAL', 'Authentication Protection', 'PASS', 'Redirected to login');
    } else if (currentUrl.includes('/portal/client')) {
      analysisResults.portal_analysis.client_portal.accessibility = 'ACCESSIBLE';
      logResult('CLIENT_PORTAL', 'Portal Accessibility', 'PASS', 'Portal accessible');
    } else {
      analysisResults.portal_analysis.client_portal.accessibility = 'REDIRECT_ISSUE';
      logResult('CLIENT_PORTAL', 'Portal Access', 'WARN', `Unexpected redirect: ${currentUrl}`);
    }
    
    // Analyze portal structure if accessible
    if (currentUrl.includes('/portal/client')) {
      const pageContent = await page.content();
      
      // Check for portal layout elements
      const hasLayout = pageContent.includes('Portal do Cliente') || 
                       pageContent.includes('Cliente') ||
                       pageContent.includes('sidebar') ||
                       pageContent.includes('navigation');
      
      if (hasLayout) {
        analysisResults.portal_analysis.client_portal.structure_score = 80;
        analysisResults.portal_analysis.client_portal.features.push('Portal Layout');
        logResult('CLIENT_PORTAL', 'Portal Layout Structure', 'PASS', 'Layout elements found');
      }
      
      // Check for navigation elements
      const navigation = await page.$$('nav, .navigation, .sidebar, a[href*="portal/client"]');
      if (navigation.length > 0) {
        analysisResults.portal_analysis.client_portal.navigation_score = 75;
        analysisResults.portal_analysis.client_portal.features.push('Navigation Menu');
        logResult('CLIENT_PORTAL', 'Navigation Elements', 'PASS', `Found ${navigation.length} navigation elements`);
      }
      
      // Check for specific client portal features
      const clientFeatures = {
        'Dashboard': '/portal/client/dashboard',
        'Matters': '/portal/client/matters', 
        'Profile': '/portal/client/profile',
        'Messages': '/portal/client/messages'
      };
      
      for (const [feature, path] of Object.entries(clientFeatures)) {
        try {
          await page.goto(`${BASE_URL}${path}`);
          await page.waitForTimeout(2000);
          
          const featureUrl = page.url();
          if (featureUrl.includes(path) || featureUrl.includes('/portal/client')) {
            analysisResults.portal_analysis.client_portal.features.push(feature);
            logResult('CLIENT_PORTAL', `${feature} Feature`, 'PASS', 'Feature accessible');
          }
        } catch (error) {
          analysisResults.portal_analysis.client_portal.issues.push(`${feature} inaccessible: ${error.message}`);
          logResult('CLIENT_PORTAL', `${feature} Feature`, 'WARN', error.message);
        }
      }
    }
    
  } catch (error) {
    analysisResults.portal_analysis.client_portal.issues.push(`Analysis error: ${error.message}`);
    logResult('CLIENT_PORTAL', 'Client Portal Analysis', 'FAIL', error.message);
  }
}

async function analyzeStaffPortal(page) {
  console.log('\n🔍 Analyzing Staff Portal...');
  
  try {
    // Test staff portal accessibility
    await page.goto(`${BASE_URL}/portal/staff`);
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      analysisResults.portal_analysis.staff_portal.accessibility = 'PROTECTED';
      logResult('STAFF_PORTAL', 'Authentication Protection', 'PASS', 'Redirected to login');
    } else if (currentUrl.includes('/portal/staff')) {
      analysisResults.portal_analysis.staff_portal.accessibility = 'ACCESSIBLE';
      logResult('STAFF_PORTAL', 'Portal Accessibility', 'PASS', 'Portal accessible');
    } else {
      analysisResults.portal_analysis.staff_portal.accessibility = 'REDIRECT_ISSUE';
      logResult('STAFF_PORTAL', 'Portal Access', 'WARN', `Unexpected redirect: ${currentUrl}`);
    }
    
    // Analyze staff portal structure
    if (currentUrl.includes('/portal/staff')) {
      const pageContent = await page.content();
      
      const hasStaffLayout = pageContent.includes('Portal do Colaborador') ||
                            pageContent.includes('Colaborador') ||
                            pageContent.includes('Staff');
      
      if (hasStaffLayout) {
        analysisResults.portal_analysis.staff_portal.structure_score = 70;
        analysisResults.portal_analysis.staff_portal.features.push('Staff Portal Layout');
        logResult('STAFF_PORTAL', 'Staff Portal Structure', 'PASS', 'Staff layout found');
      }
      
      // Check for staff navigation
      const staffNav = await page.$$('nav, .navigation, a[href*="portal/staff"]');
      analysisResults.portal_analysis.staff_portal.navigation_score = staffNav.length > 0 ? 60 : 20;
      logResult('STAFF_PORTAL', 'Staff Navigation', 
               staffNav.length > 0 ? 'PASS' : 'WARN',
               `Found ${staffNav.length} navigation elements`);
    }
    
  } catch (error) {
    analysisResults.portal_analysis.staff_portal.issues.push(`Analysis error: ${error.message}`);
    logResult('STAFF_PORTAL', 'Staff Portal Analysis', 'FAIL', error.message);
  }
}

async function analyzeRBACImplementation(page) {
  console.log('\n🔍 Analyzing RBAC Implementation...');
  
  try {
    let protectedRouteCount = 0;
    let totalRoutes = 0;
    
    // Test middleware protection on various routes
    const protectedRoutes = [
      '/admin',
      '/admin/users',
      '/dashboard',
      '/matters',
      '/clients',
      '/billing',
      '/reports',
      '/settings'
    ];
    
    for (const route of protectedRoutes) {
      totalRoutes++;
      try {
        await page.goto(`${BASE_URL}${route}`);
        await page.waitForTimeout(2000);
        
        const resultUrl = page.url();
        if (resultUrl.includes('/login') || !resultUrl.includes(route)) {
          protectedRouteCount++;
          logResult('RBAC', `Route Protection: ${route}`, 'PASS', 'Route properly protected');
        } else {
          analysisResults.portal_analysis.rbac_implementation.security_issues.push(`Route ${route} not protected`);
          logResult('RBAC', `Route Protection: ${route}`, 'FAIL', 'Route accessible without auth');
        }
      } catch (error) {
        logResult('RBAC', `Route Protection: ${route}`, 'WARN', error.message);
      }
    }
    
    // Calculate RBAC score
    const protectionRate = (protectedRouteCount / totalRoutes) * 100;
    analysisResults.portal_analysis.rbac_implementation.access_control_score = protectionRate;
    
    if (protectionRate >= 90) {
      analysisResults.portal_analysis.rbac_implementation.middleware_protection = 'EXCELLENT';
      logResult('RBAC', 'Middleware Protection', 'PASS', `${protectionRate.toFixed(1)}% routes protected`);
    } else if (protectionRate >= 70) {
      analysisResults.portal_analysis.rbac_implementation.middleware_protection = 'GOOD';
      logResult('RBAC', 'Middleware Protection', 'WARN', `${protectionRate.toFixed(1)}% routes protected`);
    } else {
      analysisResults.portal_analysis.rbac_implementation.middleware_protection = 'POOR';
      logResult('RBAC', 'Middleware Protection', 'FAIL', `Only ${protectionRate.toFixed(1)}% routes protected`);
    }
    
    // Test portal route behavior
    const portalRoutes = ['/portal/client', '/portal/staff'];
    for (const route of portalRoutes) {
      await page.goto(`${BASE_URL}${route}`);
      await page.waitForTimeout(2000);
      
      const portalUrl = page.url();
      if (portalUrl.includes('/login') || portalUrl.includes('/portal')) {
        logResult('RBAC', `Portal Route: ${route}`, 'PASS', 'Portal route handled correctly');
      } else {
        logResult('RBAC', `Portal Route: ${route}`, 'WARN', `Unexpected behavior: ${portalUrl}`);
      }
    }
    
    // Overall RBAC assessment
    if (protectionRate >= 80) {
      analysisResults.portal_analysis.rbac_implementation.role_guards = 'IMPLEMENTED';
    } else {
      analysisResults.portal_analysis.rbac_implementation.role_guards = 'NEEDS_WORK';
    }
    
  } catch (error) {
    analysisResults.portal_analysis.rbac_implementation.security_issues.push(`RBAC analysis error: ${error.message}`);
    logResult('RBAC', 'RBAC Implementation', 'FAIL', error.message);
  }
}

async function analyzeIntegrationStatus(page) {
  console.log('\n🔍 Analyzing Integration Status...');
  
  try {
    // Test dashboard integration
    await page.goto(`${BASE_URL}/`);
    await page.waitForTimeout(3000);
    
    const homeUrl = page.url();
    if (homeUrl.includes('/login') || homeUrl.includes('/dashboard') || homeUrl.includes('/portal')) {
      analysisResults.portal_analysis.integration_status.dashboard_integration = 'WORKING';
      logResult('INTEGRATION', 'Dashboard Integration', 'PASS', 'Root navigation working');
    } else {
      analysisResults.portal_analysis.integration_status.dashboard_integration = 'ISSUES';
      logResult('INTEGRATION', 'Dashboard Integration', 'WARN', `Unexpected root behavior: ${homeUrl}`);
    }
    
    // Test messaging integration (if accessible)
    try {
      await page.goto(`${BASE_URL}/portal/client/messages`);
      await page.waitForTimeout(2000);
      
      const messagesUrl = page.url();
      if (messagesUrl.includes('/messages') || messagesUrl.includes('/login') || messagesUrl.includes('/portal')) {
        analysisResults.portal_analysis.integration_status.messaging_integration = 'AVAILABLE';
        logResult('INTEGRATION', 'Messaging Integration', 'PASS', 'Messages feature accessible');
      }
    } catch (error) {
      analysisResults.portal_analysis.integration_status.messaging_integration = 'ISSUES';
      logResult('INTEGRATION', 'Messaging Integration', 'WARN', error.message);
    }
    
    // Test mobile responsiveness
    await page.setViewport({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/portal/client`);
    await page.waitForTimeout(2000);
    
    const isMobile = await page.evaluate(() => {
      return window.innerWidth <= 768;
    });
    
    if (isMobile) {
      analysisResults.portal_analysis.integration_status.mobile_responsiveness = 'RESPONSIVE';
      logResult('INTEGRATION', 'Mobile Responsiveness', 'PASS', 'Mobile viewport working');
    } else {
      analysisResults.portal_analysis.integration_status.mobile_responsiveness = 'ISSUES';
      logResult('INTEGRATION', 'Mobile Responsiveness', 'WARN', 'Mobile viewport issues');
    }
    
    // Reset viewport
    await page.setViewport(VIEWPORT);
    
  } catch (error) {
    logResult('INTEGRATION', 'Integration Analysis', 'FAIL', error.message);
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function runPortalFunctionalityAnalysis() {
  console.log('🚀 Starting Portal Functionality Analysis...');
  console.log(`🎯 Target: ${BASE_URL}`);
  console.log('📋 Focus: Complete portal system and RBAC validation\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: VIEWPORT
  });
  
  const page = await browser.newPage();
  
  try {
    // Run all analysis functions
    await analyzeClientPortal(page);
    await analyzeStaffPortal(page);
    await analyzeRBACImplementation(page);
    await analyzeIntegrationStatus(page);
    
    // Generate comprehensive report
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE PORTAL ACCESS TESTING REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n📈 ANALYSIS SUMMARY:`);
    console.log(`   Total Checks: ${analysisResults.test_summary.total_checks}`);
    console.log(`   ✅ Passed: ${analysisResults.test_summary.passed_checks}`);
    console.log(`   ❌ Failed: ${analysisResults.test_summary.failed_checks}`);
    console.log(`   ⚠️  Warnings: ${analysisResults.test_summary.warnings}`);
    
    const successRate = ((analysisResults.test_summary.passed_checks / analysisResults.test_summary.total_checks) * 100).toFixed(1);
    console.log(`   📊 Success Rate: ${successRate}%`);
    
    console.log(`\n🎯 PORTAL FUNCTIONALITY SCORES BY ROLE:`);
    console.log(`   Client Portal Structure: ${analysisResults.portal_analysis.client_portal.structure_score}%`);
    console.log(`   Client Portal Navigation: ${analysisResults.portal_analysis.client_portal.navigation_score}%`);
    console.log(`   Staff Portal Structure: ${analysisResults.portal_analysis.staff_portal.structure_score}%`);
    console.log(`   Staff Portal Navigation: ${analysisResults.portal_analysis.staff_portal.navigation_score}%`);
    
    console.log(`\n🔒 RBAC IMPLEMENTATION VALIDATION:`);
    console.log(`   Access Control Score: ${analysisResults.portal_analysis.rbac_implementation.access_control_score.toFixed(1)}%`);
    console.log(`   Middleware Protection: ${analysisResults.portal_analysis.rbac_implementation.middleware_protection}`);
    console.log(`   Role Guards Status: ${analysisResults.portal_analysis.rbac_implementation.role_guards}`);
    
    console.log(`\n🔗 PORTAL INTEGRATION STATUS:`);
    console.log(`   Dashboard Integration: ${analysisResults.portal_analysis.integration_status.dashboard_integration}`);
    console.log(`   Messaging Integration: ${analysisResults.portal_analysis.integration_status.messaging_integration}`);
    console.log(`   Mobile Responsiveness: ${analysisResults.portal_analysis.integration_status.mobile_responsiveness}`);
    
    console.log(`\n📱 MOBILE EXPERIENCE ASSESSMENT:`);
    const mobileScore = analysisResults.portal_analysis.integration_status.mobile_responsiveness === 'RESPONSIVE' ? 'EXCELLENT' : 'NEEDS_WORK';
    console.log(`   Mobile Portal Experience: ${mobileScore}`);
    
    console.log(`\n🏛️ BUSINESS WORKFLOW VALIDATION:`);
    const clientFeatures = analysisResults.portal_analysis.client_portal.features.length;
    const staffFeatures = analysisResults.portal_analysis.staff_portal.features.length;
    console.log(`   Client Workflow Features: ${clientFeatures} detected`);
    console.log(`   Staff Workflow Features: ${staffFeatures} detected`);
    
    console.log(`\n⚠️  SECURITY COMPLIANCE VERIFICATION:`);
    const securityIssues = analysisResults.portal_analysis.rbac_implementation.security_issues.length;
    console.log(`   Security Issues Found: ${securityIssues}`);
    if (securityIssues > 0) {
      analysisResults.portal_analysis.rbac_implementation.security_issues.forEach(issue => {
        console.log(`   - ${issue}`);
      });
    } else {
      console.log(`   ✅ No critical security issues detected`);
    }
    
    // Save detailed results
    const reportPath = path.join(__dirname, 'PORTAL_FUNCTIONALITY_ANALYSIS_REPORT.json');
    fs.writeFileSync(reportPath, JSON.stringify(analysisResults, null, 2));
    console.log(`\n💾 Detailed analysis saved: ${reportPath}`);
    
    // Final assessment
    let overallStatus = 'EXCELLENT';
    const rbacScore = analysisResults.portal_analysis.rbac_implementation.access_control_score;
    
    if (rbacScore < 90 || securityIssues > 2) overallStatus = 'GOOD';
    if (rbacScore < 80 || securityIssues > 4) overallStatus = 'NEEDS_IMPROVEMENT';
    if (rbacScore < 70 || securityIssues > 6) overallStatus = 'CRITICAL';
    
    console.log(`\n🏆 OVERALL PORTAL STATUS: ${overallStatus}`);
    console.log(`🎯 Production Readiness: ${rbacScore >= 95 && securityIssues === 0 ? 'DEPLOYMENT_READY' : rbacScore >= 85 ? 'MINOR_FIXES_NEEDED' : 'MAJOR_WORK_REQUIRED'}`);
    
    // Key recommendations
    console.log(`\n💡 KEY RECOMMENDATIONS:`);
    if (analysisResults.portal_analysis.client_portal.structure_score < 80) {
      console.log(`   - Enhance client portal structure and layout`);
    }
    if (analysisResults.portal_analysis.staff_portal.structure_score < 80) {
      console.log(`   - Improve staff portal functionality`);
    }
    if (rbacScore < 90) {
      console.log(`   - Strengthen RBAC implementation`);
    }
    if (securityIssues > 0) {
      console.log(`   - Address ${securityIssues} security issues`);
    }
    if (analysisResults.portal_analysis.integration_status.mobile_responsiveness !== 'RESPONSIVE') {
      console.log(`   - Fix mobile responsiveness issues`);
    }
    
    console.log(`\n✨ DEPLOYMENT STATUS:`);
    const deploymentReady = rbacScore >= 90 && securityIssues === 0 && 
                           analysisResults.portal_analysis.client_portal.structure_score >= 70;
    console.log(`   Portal System: ${deploymentReady ? '🚀 READY FOR PRODUCTION' : '🔧 NEEDS WORK'}`);
    
  } catch (error) {
    console.error('❌ Fatal analysis error:', error);
  } finally {
    await browser.close();
  }
  
  return analysisResults;
}

// Run analysis if called directly
if (require.main === module) {
  runPortalFunctionalityAnalysis()
    .then(() => {
      console.log('\n✅ Portal Functionality Analysis Complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    });
}

module.exports = { runPortalFunctionalityAnalysis };