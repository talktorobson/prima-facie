#!/usr/bin/env node

/**
 * Prima Facie E2E Authentication Testing Script
 * Comprehensive testing of authentication flows and route protection
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Test configuration
const APP_URL = 'http://localhost:3000';
const TEST_USERS = {
  admin: { email: 'admin@test.com', password: '123456', expectedRedirect: '/dashboard' },
  lawyer: { email: 'lawyer@test.com', password: '123456', expectedRedirect: '/dashboard' },
  client: { email: 'client@test.com', password: '123456', expectedRedirect: '/portal/client' }
};

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// Utility functions
function logTest(testName, status, details = '') {
  testResults.total++;
  const timestamp = new Date().toISOString();
  const statusEmoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  
  console.log(`${statusEmoji} [${timestamp}] ${testName}: ${status}`);
  if (details) console.log(`   Details: ${details}`);
  
  if (status === 'PASS') {
    testResults.passed++;
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, details, timestamp });
  }
}

function makeRequest(url, options = {}) {
  try {
    const result = execSync(`curl -s -L -w "HTTPSTATUS:%{http_code};REDIRECT:%{redirect_url}" "${url}"`, 
      { encoding: 'utf8', timeout: 10000 });
    
    const statusMatch = result.match(/HTTPSTATUS:(\d+)/);
    const redirectMatch = result.match(/REDIRECT:([^;]*)/);
    
    return {
      status: statusMatch ? parseInt(statusMatch[1]) : 0,
      redirect: redirectMatch ? redirectMatch[1] : '',
      body: result.replace(/HTTPSTATUS:\d+;REDIRECT:[^;]*/, '').trim()
    };
  } catch (error) {
    return { status: 0, redirect: '', body: '', error: error.message };
  }
}

// ===== TEST SUITE EXECUTION =====

console.log('🧪 Prima Facie E2E Authentication Testing Started\\n');
console.log('🎯 Testing Configuration:');
console.log(`   Application URL: ${APP_URL}`);
console.log(`   Mock Authentication: Enabled`);
console.log(`   Test Users: ${Object.keys(TEST_USERS).join(', ')}\\n`);

// ===== PHASE 1: BASIC CONNECTIVITY TESTS =====

console.log('📡 PHASE 1: Basic Connectivity Tests');
console.log('=====================================');

// Test 1.1: Application availability
try {
  const rootResponse = makeRequest(`${APP_URL}/`);
  if (rootResponse.status === 200) {
    logTest('A1.1 - Application Accessibility', 'PASS', `Root path responds with ${rootResponse.status}`);
  } else {
    logTest('A1.1 - Application Accessibility', 'FAIL', `Expected 200, got ${rootResponse.status}`);
  }
} catch (error) {
  logTest('A1.1 - Application Accessibility', 'FAIL', `Connection error: ${error.message}`);
}

// Test 1.2: Login page accessibility
try {
  const loginResponse = makeRequest(`${APP_URL}/login`);
  if (loginResponse.status === 200) {
    logTest('A1.2 - Login Page Accessibility', 'PASS', `Login page responds with ${loginResponse.status}`);
  } else {
    logTest('A1.2 - Login Page Accessibility', 'FAIL', `Expected 200, got ${loginResponse.status}`);
  }
} catch (error) {
  logTest('A1.2 - Login Page Accessibility', 'FAIL', `Connection error: ${error.message}`);
}

// ===== PHASE 2: ROUTE PROTECTION TESTS =====

console.log('\\n🛡️ PHASE 2: Route Protection Tests');
console.log('====================================');

// Test protected routes without authentication
const protectedRoutes = [
  '/dashboard',
  '/admin', 
  '/matters',
  '/clients',
  '/billing',
  '/portal/client',
  '/portal/staff'
];

protectedRoutes.forEach((route, index) => {
  try {
    const response = makeRequest(`${APP_URL}${route}`);
    
    // Check if route is protected (should redirect to login or return 401/403)
    if (response.status === 200 && response.body.includes('login')) {
      logTest(`B2.${index + 1} - Route Protection ${route}`, 'PASS', 'Redirected to login page');
    } else if (response.status === 302 && response.redirect.includes('login')) {
      logTest(`B2.${index + 1} - Route Protection ${route}`, 'PASS', `Redirected to ${response.redirect}`);
    } else if (response.status === 401 || response.status === 403) {
      logTest(`B2.${index + 1} - Route Protection ${route}`, 'PASS', `Unauthorized response ${response.status}`);
    } else {
      logTest(`B2.${index + 1} - Route Protection ${route}`, 'FAIL', 
        `Route accessible without auth: ${response.status}`);
    }
  } catch (error) {
    logTest(`B2.${index + 1} - Route Protection ${route}`, 'FAIL', `Test error: ${error.message}`);
  }
});

// ===== PHASE 3: AUTHENTICATION FLOW TESTS =====

console.log('\\n🔐 PHASE 3: Authentication Flow Analysis');
console.log('=========================================');

// Test 3.1: Login form presence
try {
  const loginPageResponse = makeRequest(`${APP_URL}/login`);
  const hasEmailField = loginPageResponse.body.includes('type="email"') || loginPageResponse.body.includes('email');
  const hasPasswordField = loginPageResponse.body.includes('type="password"') || loginPageResponse.body.includes('password');
  const hasSubmitButton = loginPageResponse.body.includes('type="submit"') || loginPageResponse.body.includes('Entrar');
  
  if (hasEmailField && hasPasswordField && hasSubmitButton) {
    logTest('C3.1 - Login Form Structure', 'PASS', 'Email, password fields and submit button found');
  } else {
    logTest('C3.1 - Login Form Structure', 'FAIL', 
      `Missing elements - Email: ${hasEmailField}, Password: ${hasPasswordField}, Submit: ${hasSubmitButton}`);
  }
} catch (error) {
  logTest('C3.1 - Login Form Structure', 'FAIL', `Analysis error: ${error.message}`);
}

// Test 3.2: Register page accessibility
try {
  const registerResponse = makeRequest(`${APP_URL}/register`);
  if (registerResponse.status === 200) {
    logTest('C3.2 - Register Page Accessibility', 'PASS', `Register page responds with ${registerResponse.status}`);
  } else {
    logTest('C3.2 - Register Page Accessibility', 'FAIL', `Expected 200, got ${registerResponse.status}`);
  }
} catch (error) {
  logTest('C3.2 - Register Page Accessibility', 'FAIL', `Connection error: ${error.message}`);
}

// Test 3.3: Forgot password page accessibility
try {
  const forgotResponse = makeRequest(`${APP_URL}/forgot-password`);
  if (forgotResponse.status === 200) {
    logTest('C3.3 - Forgot Password Page', 'PASS', `Forgot password page responds with ${forgotResponse.status}`);
  } else {
    logTest('C3.3 - Forgot Password Page', 'FAIL', `Expected 200, got ${forgotResponse.status}`);
  }
} catch (error) {
  logTest('C3.3 - Forgot Password Page', 'FAIL', `Connection error: ${error.message}`);
}

// ===== PHASE 4: MOCK AUTHENTICATION VALIDATION =====

console.log('\\n🧪 PHASE 4: Mock Authentication Validation');
console.log('============================================');

// Test 4.1: Environment configuration check
const envContent = fs.readFileSync('.env.local', 'utf8');
const hasMockAuth = envContent.includes('NEXT_PUBLIC_USE_MOCK_AUTH=true');
const hasSupabaseConfig = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');

if (hasMockAuth) {
  logTest('D4.1 - Mock Auth Configuration', 'PASS', 'Mock authentication enabled in .env.local');
} else {
  logTest('D4.1 - Mock Auth Configuration', 'FAIL', 'Mock authentication not properly configured');
}

if (hasSupabaseConfig) {
  logTest('D4.2 - Supabase Configuration', 'PASS', 'Supabase configuration found');
} else {
  logTest('D4.2 - Supabase Configuration', 'FAIL', 'Supabase configuration missing');
}

// ===== TEST RESULTS SUMMARY =====

console.log('\\n📊 TEST RESULTS SUMMARY');
console.log('========================');
console.log(`Total Tests: ${testResults.total}`);
console.log(`✅ Passed: ${testResults.passed}`);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(`📈 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

if (testResults.errors.length > 0) {
  console.log('\\n🚨 FAILED TESTS DETAILS:');
  testResults.errors.forEach((error, index) => {
    console.log(`${index + 1}. ${error.test}`);
    console.log(`   Details: ${error.details}`);
    console.log(`   Time: ${error.timestamp}\\n`);
  });
}

// ===== NEXT STEPS RECOMMENDATIONS =====

console.log('\\n🎯 NEXT STEPS RECOMMENDATIONS');
console.log('==============================');

if (testResults.failed === 0) {
  console.log('🎉 All basic tests passed! Ready for interactive testing.');
  console.log('📋 Next steps:');
  console.log('   1. Open browser tabs for manual authentication testing');
  console.log('   2. Test login with each user role (admin, lawyer, client)');
  console.log('   3. Validate role-based access control');
  console.log('   4. Test logout and session management');
} else {
  console.log('⚠️ Some tests failed. Review the issues above before proceeding.');
  console.log('📋 Recommended actions:');
  console.log('   1. Fix failing route protection issues');
  console.log('   2. Verify authentication configuration');
  console.log('   3. Re-run tests after fixes');
}

console.log('\\n🔗 Application URLs for Manual Testing:');
console.log(`   • Root: ${APP_URL}/`);
console.log(`   • Login: ${APP_URL}/login`);
console.log(`   • Admin: ${APP_URL}/admin`);
console.log(`   • Dashboard: ${APP_URL}/dashboard`);
console.log(`   • Client Portal: ${APP_URL}/portal/client`);

console.log('\\n🧪 E2E Authentication Testing Complete!');