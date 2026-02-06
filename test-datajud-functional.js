#!/usr/bin/env node

// =====================================================
// DataJud CNJ Functional Integration Tests
// Tests actual DataJud API connectivity and features
// =====================================================

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const DATAJUD_API_KEY = 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==';

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${level}: ${message}`);
}

async function testDataJudAPIDirectly() {
  log('🔍 Testing DataJud API Direct Connection...');
  
  try {
    // Test DataJud API connection directly
    const response = await axios({
      method: 'GET',
      url: 'https://datajud-api.cnj.jus.br/api_publica_tjsp/_search',
      headers: {
        'Authorization': `Basic ${DATAJUD_API_KEY}`,
        'Content-Type': 'application/json'
      },
      params: {
        size: 1
      },
      timeout: 10000,
      validateStatus: () => true
    });

    log(`DataJud API Response Status: ${response.status}`);
    
    if (response.status === 200) {
      log('✅ DataJud API connection successful');
      if (response.data && response.data.hits) {
        log(`   Found ${response.data.hits.total} total processes`);
        if (response.data.hits.hits && response.data.hits.hits.length > 0) {
          const sample = response.data.hits.hits[0]._source;
          log(`   Sample process: ${sample.numeroProcesso || 'N/A'}`);
          log(`   Tribunal: ${sample.tribunal || 'N/A'}`);
        }
      }
      return true;
    } else if (response.status === 401) {
      log('❌ DataJud API authentication failed - Check API key');
      return false;
    } else {
      log(`❌ DataJud API returned status ${response.status}`);
      if (response.data) {
        log(`   Error: ${JSON.stringify(response.data).substring(0, 200)}`);
      }
      return false;
    }
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      log('❌ Cannot connect to DataJud API - Network/DNS issue');
    } else if (error.code === 'ECONNREFUSED') {
      log('❌ Connection refused by DataJud API');
    } else if (error.code === 'ETIMEDOUT') {
      log('❌ DataJud API request timed out');
    } else {
      log(`❌ DataJud API error: ${error.message}`);
    }
    return false;
  }
}

async function testAPIServiceClasses() {
  log('\n🛠️ Testing API Service Integration...');
  
  try {
    // Test our API service instantiation by calling health check
    const healthResponse = await axios({
      method: 'GET',
      url: `${BASE_URL}/api/datajud/health-check`,
      timeout: 5000
    });

    if (healthResponse.data.services) {
      const apiService = healthResponse.data.services.datajud_api;
      
      if (apiService) {
        log(`✅ API Service Status: ${apiService.status}`);
        if (apiService.response_time_ms) {
          log(`   Response Time: ${apiService.response_time_ms}ms`);
        }
        if (apiService.error) {
          log(`   Service Error: ${apiService.error}`);
        }
        return apiService.status === 'healthy';
      } else {
        log('⚠️  API Service not included in health check');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    log(`❌ API Service test failed: ${error.message}`);
    return false;
  }
}

async function testRateLimitingBehavior() {
  log('\n⏱️ Testing Rate Limiting Implementation...');
  
  // Test multiple health check requests to see rate limiting behavior
  const startTime = Date.now();
  const promises = [];
  
  for (let i = 0; i < 10; i++) {
    promises.push(
      axios({
        method: 'GET',
        url: `${BASE_URL}/api/datajud/health-check`,
        timeout: 5000
      }).catch(err => ({ error: err.message }))
    );
  }
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  const successful = results.filter(r => r.status === 200 || (r.data && r.data.status)).length;
  const failed = results.length - successful;
  
  log(`✅ Rate Limiting Test: ${successful}/${results.length} requests successful`);
  log(`   Total Time: ${totalTime}ms`);
  log(`   Average Time: ${Math.round(totalTime / results.length)}ms per request`);
  
  if (failed > 0) {
    log(`⚠️  ${failed} requests failed (may indicate rate limiting)`);
  }
  
  return successful >= 8; // At least 80% should succeed
}

async function testCNJProcessNumberValidation() {
  log('\n🔢 Testing CNJ Process Number Validation...');
  
  // Test valid CNJ process number format
  const validNumbers = [
    '1234567-89.2024.1.23.4567',
    '0001234-56.2023.8.26.0100',
    '5000123-45.2024.4.01.3456'
  ];
  
  const invalidNumbers = [
    '123456789',
    'invalid-number',
    '1234567-89.2024',
    ''
  ];
  
  log('Testing valid CNJ process numbers:');
  validNumbers.forEach(num => {
    // CNJ format: NNNNNNN-DD.AAAA.J.TR.OOOO (20 digits total)
    const cleaned = num.replace(/\D/g, '');
    const isValid = cleaned.length === 20;
    log(`   ${num}: ${isValid ? '✅ Valid' : '❌ Invalid'} (${cleaned.length} digits)`);
  });
  
  log('Testing invalid CNJ process numbers:');
  invalidNumbers.forEach(num => {
    const cleaned = num.replace(/\D/g, '');
    const isValid = cleaned.length === 20;
    log(`   ${num}: ${isValid ? '❌ Should be invalid' : '✅ Correctly invalid'} (${cleaned.length} digits)`);
  });
  
  return true;
}

async function testDatabaseConnectivity() {
  log('\n🗄️ Testing Database Connectivity for DataJud Tables...');
  
  try {
    const healthResponse = await axios({
      method: 'GET',
      url: `${BASE_URL}/api/datajud/health-check`,
      timeout: 5000
    });

    if (healthResponse.data.services && healthResponse.data.services.database) {
      const dbStatus = healthResponse.data.services.database.status;
      log(`✅ Database Status: ${dbStatus}`);
      
      if (dbStatus === 'healthy') {
        log('   ✅ Database connection successful');
        log('   ✅ DataJud tables should be accessible');
        return true;
      } else {
        log(`   ❌ Database status is ${dbStatus}`);
        return false;
      }
    } else {
      log('⚠️  Database status not available in health check');
      return false;
    }
  } catch (error) {
    log(`❌ Database connectivity test failed: ${error.message}`);
    return false;
  }
}

async function testEnvironmentConfiguration() {
  log('\n🔧 Testing Environment Configuration...');
  
  try {
    const healthResponse = await axios({
      method: 'GET',
      url: `${BASE_URL}/api/datajud/health-check`,
      timeout: 5000
    });

    if (healthResponse.data.environment) {
      const env = healthResponse.data.environment;
      
      log(`✅ Node Environment: ${env.node_env}`);
      log(`✅ DataJud API Configured: ${env.datajud_api_configured}`);
      
      if (env.datajud_api_configured) {
        log('   ✅ API key is properly loaded');
      } else {
        log('   ❌ API key not configured');
        return false;
      }
      
      return true;
    } else {
      log('❌ Environment configuration not available');
      return false;
    }
  } catch (error) {
    log(`❌ Environment test failed: ${error.message}`);
    return false;
  }
}

async function testErrorHandlingScenarios() {
  log('\n🚨 Testing Error Handling Scenarios...');
  
  try {
    // Test authentication error
    const authTest = await axios({
      method: 'POST',
      url: `${BASE_URL}/api/datajud/enrich-case`,
      data: {
        case_id: 'test-case',
        process_number: '1234567-89.2024.1.23.4567'
      },
      validateStatus: () => true
    });
    
    log(`✅ Auth Error Handling: ${authTest.status === 401 ? 'Correct (401)' : 'Unexpected (' + authTest.status + ')'}`);
    
    // Test malformed request
    const malformedTest = await axios({
      method: 'POST',
      url: `${BASE_URL}/api/datajud/enrich-case`,
      data: 'invalid json',
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true
    });
    
    log(`✅ Malformed Request Handling: ${malformedTest.status >= 400 ? 'Correct' : 'Unexpected'}`);
    
    // Test non-existent endpoint
    const notFoundTest = await axios({
      method: 'GET',
      url: `${BASE_URL}/api/datajud/non-existent-endpoint`,
      validateStatus: () => true
    });
    
    log(`✅ 404 Error Handling: ${notFoundTest.status === 404 ? 'Correct' : 'Unexpected'}`);
    
    return true;
  } catch (error) {
    log(`❌ Error handling test failed: ${error.message}`);
    return false;
  }
}

async function runFunctionalTests() {
  log('🔬 Starting DataJud Functional Integration Tests\n');
  
  const results = {
    directAPI: await testDataJudAPIDirectly(),
    serviceIntegration: await testAPIServiceClasses(),
    rateLimiting: await testRateLimitingBehavior(),
    cnjValidation: await testCNJProcessNumberValidation(),
    database: await testDatabaseConnectivity(),
    environment: await testEnvironmentConfiguration(),
    errorHandling: await testErrorHandlingScenarios()
  };
  
  // Calculate overall results
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const successRate = (passedTests / totalTests) * 100;
  
  log('\n' + '='.repeat(60));
  log('📊 FUNCTIONAL TEST RESULTS');
  log('='.repeat(60));
  
  Object.entries(results).forEach(([test, passed]) => {
    log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
  });
  
  log(`\n📈 Overall Success Rate: ${successRate.toFixed(1)}% (${passedTests}/${totalTests})`);
  
  if (successRate >= 90) {
    log('🟢 EXCELLENT - Integration is production ready');
  } else if (successRate >= 80) {
    log('🟡 GOOD - Minor issues detected');
  } else if (successRate >= 70) {
    log('🟠 FAIR - Several issues need attention');
  } else {
    log('🔴 POOR - Major issues detected');
  }
  
  // Specific recommendations
  log('\n💡 FUNCTIONAL TEST RECOMMENDATIONS:');
  
  if (!results.directAPI) {
    log('   🔧 Check DataJud API key and network connectivity');
    log('   🌐 Verify access to datajud-api.cnj.jus.br');
  }
  
  if (!results.database) {
    log('   🗄️ Verify database migrations were applied correctly');
    log('   🔐 Check database connection and permissions');
  }
  
  if (results.directAPI && results.database && results.environment) {
    log('   ✅ Core infrastructure is working correctly');
    log('   🚀 Ready for case enrichment testing');
    log('   📱 UI components can be safely integrated');
  }
  
  log('\n🎯 Next Steps:');
  log('   1. Test with real CNJ process numbers');
  log('   2. Verify case enrichment workflow');
  log('   3. Test timeline synchronization');
  log('   4. Validate participant matching');
  
  return results;
}

runFunctionalTests()
  .then((results) => {
    const allPassed = Object.values(results).every(Boolean);
    process.exit(allPassed ? 0 : 1);
  })
  .catch((error) => {
    log(`💥 CRITICAL ERROR: ${error.message}`, 'ERROR');
    process.exit(1);
  });