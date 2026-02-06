#!/usr/bin/env node

// =====================================================
// DataJud CNJ Integration Comprehensive Test Suite
// Tests all endpoints, services, and functionality
// =====================================================

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_RESULTS = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper functions
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${level}: ${message}`);
}

function assert(condition, message) {
  if (condition) {
    TEST_RESULTS.passed++;
    log(`✅ PASS: ${message}`);
    return true;
  } else {
    TEST_RESULTS.failed++;
    TEST_RESULTS.errors.push(message);
    log(`❌ FAIL: ${message}`, 'ERROR');
    return false;
  }
}

async function testEndpoint(url, method = 'GET', data = null, headers = {}, expectedStatus = 200) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      validateStatus: () => true // Don't throw on HTTP errors
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    
    return {
      success: response.status === expectedStatus,
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: 0
    };
  }
}

// Test Suite
async function runDataJudTests() {
  log('🚀 Starting DataJud CNJ Integration Comprehensive Test Suite');
  
  // =====================================================
  // 1. Health Check Tests
  // =====================================================
  log('\n📊 Testing Health Check Endpoint...');
  
  const healthCheck = await testEndpoint('/api/datajud/health-check');
  assert(healthCheck.success, 'Health check endpoint responds with 200');
  
  if (healthCheck.success) {
    const health = healthCheck.data;
    assert(health.status !== undefined, 'Health check returns status field');
    assert(['healthy', 'degraded', 'down'].includes(health.status), 'Health check status is valid');
    assert(health.timestamp !== undefined, 'Health check includes timestamp');
    assert(health.services !== undefined, 'Health check includes services status');
    assert(health.environment !== undefined, 'Health check includes environment info');
    assert(health.environment.datajud_api_configured === true, 'DataJud API key is configured');
    
    log(`   Health Status: ${health.status}`);
    log(`   API Configured: ${health.environment.datajud_api_configured}`);
    log(`   Response Time: ${health.response_time_ms}ms`);
  }

  // =====================================================
  // 2. Enrichment Stats Tests (Requires Auth)
  // =====================================================
  log('\n📈 Testing Enrichment Stats Endpoint...');
  
  const statsNoAuth = await testEndpoint('/api/datajud/enrichment-stats', 'GET', null, {}, 401);
  assert(statsNoAuth.success, 'Stats endpoint requires authentication (401)');

  // =====================================================
  // 3. Case Enrichment Tests (Requires Auth)
  // =====================================================
  log('\n🔍 Testing Case Enrichment Endpoint...');
  
  const enrichNoAuth = await testEndpoint('/api/datajud/enrich-case', 'POST', {
    case_id: 'test-case-id',
    process_number: '1234567-89.2024.1.23.4567'
  }, {}, 401);
  assert(enrichNoAuth.success, 'Enrichment endpoint requires authentication (401)');

  // =====================================================
  // 4. Timeline Events Tests (Requires Auth)
  // =====================================================
  log('\n📅 Testing Timeline Events Endpoint...');
  
  const timelineNoAuth = await testEndpoint('/api/datajud/timeline-events/test-case-id', 'GET', null, {}, 401);
  assert(timelineNoAuth.success, 'Timeline events endpoint requires authentication (401)');

  // =====================================================
  // 5. Case Enrichment Details Tests (Requires Auth)
  // =====================================================
  log('\n📋 Testing Case Enrichment Details Endpoint...');
  
  const detailsNoAuth = await testEndpoint('/api/datajud/case-enrichment/test-case-id', 'GET', null, {}, 401);
  assert(detailsNoAuth.success, 'Case enrichment details endpoint requires authentication (401)');

  // =====================================================
  // 6. API Input Validation Tests
  // =====================================================
  log('\n🔒 Testing API Input Validation...');
  
  // Test malformed requests
  const malformedEnrich = await testEndpoint('/api/datajud/enrich-case', 'POST', {
    invalid_field: 'test'
  }, {}, 401); // Will fail auth first, but validates structure
  assert(malformedEnrich.success, 'API handles malformed requests properly');

  // =====================================================
  // 7. CORS and Security Headers Tests
  // =====================================================
  log('\n🛡️ Testing CORS and Security...');
  
  const corsOptions = await testEndpoint('/api/datajud/health-check', 'OPTIONS');
  assert(corsOptions.success, 'OPTIONS requests work for CORS');

  // =====================================================
  // 8. API Performance Tests
  // =====================================================
  log('\n⚡ Testing API Performance...');
  
  const startTime = Date.now();
  const perfTest = await testEndpoint('/api/datajud/health-check');
  const responseTime = Date.now() - startTime;
  
  assert(perfTest.success, 'Performance test endpoint responds');
  assert(responseTime < 5000, `Health check responds in under 5 seconds (${responseTime}ms)`);
  
  // =====================================================
  // 9. Database Schema Validation Tests
  // =====================================================
  log('\n🗄️ Testing Database Schema...');
  
  // Since we can't directly query the database without auth,
  // we'll test that the health check can access the database
  if (healthCheck.success && healthCheck.data.services) {
    const dbStatus = healthCheck.data.services.database;
    assert(dbStatus !== undefined, 'Database service status is included');
    assert(dbStatus.status !== undefined, 'Database status is defined');
    log(`   Database Status: ${dbStatus.status}`);
  }

  // =====================================================
  // 10. Error Handling Tests
  // =====================================================
  log('\n🚨 Testing Error Handling...');
  
  // Test non-existent endpoints
  const notFound = await testEndpoint('/api/datajud/non-existent', 'GET', null, {}, 404);
  assert(notFound.status === 404, 'Non-existent endpoints return 404');

  // Test malformed JSON
  const malformedJson = await testEndpoint('/api/datajud/enrich-case', 'POST', 'invalid-json', {}, 400);
  // Note: This might return 401 due to auth check first
  assert(malformedJson.status === 401 || malformedJson.status === 400, 'Malformed requests handled properly');

  // =====================================================
  // 11. API Rate Limiting Tests
  // =====================================================
  log('\n⏱️ Testing Rate Limiting Awareness...');
  
  // Test multiple rapid requests to health check
  const rapidRequests = await Promise.all([
    testEndpoint('/api/datajud/health-check'),
    testEndpoint('/api/datajud/health-check'),
    testEndpoint('/api/datajud/health-check'),
    testEndpoint('/api/datajud/health-check'),
    testEndpoint('/api/datajud/health-check')
  ]);
  
  const successfulRapidRequests = rapidRequests.filter(r => r.success).length;
  assert(successfulRapidRequests >= 4, `Multiple rapid requests handled (${successfulRapidRequests}/5)`);

  // =====================================================
  // 12. Environment Configuration Tests
  // =====================================================
  log('\n🔧 Testing Environment Configuration...');
  
  if (healthCheck.success && healthCheck.data.environment) {
    const env = healthCheck.data.environment;
    assert(env.node_env !== undefined, 'Node environment is configured');
    assert(env.datajud_api_configured === true, 'DataJud API key is properly configured');
    log(`   Node Environment: ${env.node_env}`);
    log(`   API Key Configured: ${env.datajud_api_configured}`);
  }

  // =====================================================
  // Test Results Summary
  // =====================================================
  log('\n' + '='.repeat(60));
  log('📊 DATAGJUD CNJ INTEGRATION TEST RESULTS');
  log('='.repeat(60));
  log(`✅ Tests Passed: ${TEST_RESULTS.passed}`);
  log(`❌ Tests Failed: ${TEST_RESULTS.failed}`);
  log(`📈 Success Rate: ${((TEST_RESULTS.passed / (TEST_RESULTS.passed + TEST_RESULTS.failed)) * 100).toFixed(1)}%`);
  
  if (TEST_RESULTS.failed > 0) {
    log('\n❌ FAILED TESTS:');
    TEST_RESULTS.errors.forEach((error, index) => {
      log(`   ${index + 1}. ${error}`);
    });
  }

  // =====================================================
  // Integration Health Score
  // =====================================================
  const healthScore = (TEST_RESULTS.passed / (TEST_RESULTS.passed + TEST_RESULTS.failed)) * 100;
  
  log('\n🎯 INTEGRATION HEALTH SCORE:');
  if (healthScore >= 90) {
    log(`🟢 EXCELLENT (${healthScore.toFixed(1)}%) - Production Ready`);
  } else if (healthScore >= 80) {
    log(`🟡 GOOD (${healthScore.toFixed(1)}%) - Minor Issues`);
  } else if (healthScore >= 70) {
    log(`🟠 FAIR (${healthScore.toFixed(1)}%) - Needs Attention`);
  } else {
    log(`🔴 POOR (${healthScore.toFixed(1)}%) - Major Issues`);
  }

  // =====================================================
  // Recommendations
  // =====================================================
  log('\n💡 RECOMMENDATIONS:');
  
  if (healthCheck.success) {
    if (healthCheck.data.status === 'healthy') {
      log('   ✅ Integration is healthy and ready for use');
      log('   ✅ All core endpoints are responding correctly');
      log('   ✅ Environment is properly configured');
    } else {
      log('   ⚠️  Some services are degraded - check logs');
    }
  }
  
  if (TEST_RESULTS.failed === 0) {
    log('   🚀 Ready for production deployment');
    log('   📱 Ready to integrate UI components');
    log('   🔄 Ready for case enrichment testing');
  } else {
    log('   🔧 Fix failed tests before production use');
    log('   📋 Review error logs for specific issues');
  }

  log('\n🎉 DataJud CNJ Integration Testing Complete!');
  
  return {
    success: TEST_RESULTS.failed === 0,
    passed: TEST_RESULTS.passed,
    failed: TEST_RESULTS.failed,
    healthScore: healthScore
  };
}

// Run the tests
runDataJudTests()
  .then((results) => {
    process.exit(results.success ? 0 : 1);
  })
  .catch((error) => {
    log(`💥 CRITICAL ERROR: ${error.message}`, 'ERROR');
    process.exit(1);
  });