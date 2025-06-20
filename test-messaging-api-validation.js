#!/usr/bin/env node

/**
 * Prima Facie - Messaging API & Data Model Validation
 * Comprehensive validation of API endpoints, data models, and service integration
 */

const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_RESULTS = [];

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function addResult(test, status, details = '') {
  TEST_RESULTS.push({
    test,
    status,
    details,
    timestamp: new Date().toISOString()
  });
  
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  log(`${icon} ${test}: ${status} ${details}`, color);
}

// Test 1: API Endpoint Validation
async function testAPIEndpoints() {
  log('\n🌐 Testing API Endpoints...', 'blue');
  
  try {
    // Test WhatsApp webhook endpoint
    const webhookResponse = await fetch(`${BASE_URL}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=prima_facie_webhook_token&hub.challenge=test`);
    
    if (webhookResponse.ok) {
      const text = await webhookResponse.text();
      if (text === 'test') {
        addResult('API Endpoints - WhatsApp Webhook', 'PASS', 'Webhook verification working');
      } else {
        addResult('API Endpoints - WhatsApp Webhook', 'FAIL', `Unexpected response: ${text}`);
      }
    } else {
      addResult('API Endpoints - WhatsApp Webhook', 'FAIL', `Status: ${webhookResponse.status}`);
    }
    
    // Test webhook security
    const invalidWebhookResponse = await fetch(`${BASE_URL}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=invalid&hub.challenge=test`);
    
    if (invalidWebhookResponse.status === 403) {
      addResult('API Endpoints - Security', 'PASS', 'Invalid tokens properly rejected');
    } else {
      addResult('API Endpoints - Security', 'FAIL', `Expected 403, got ${invalidWebhookResponse.status}`);
    }
    
    // Test health/status endpoints
    const healthResponse = await fetch(`${BASE_URL}`);
    if (healthResponse.ok) {
      addResult('API Endpoints - Health Check', 'PASS', 'Main application accessible');
    } else {
      addResult('API Endpoints - Health Check', 'FAIL', `Status: ${healthResponse.status}`);
    }
    
  } catch (error) {
    addResult('API Endpoints', 'FAIL', `Error: ${error.message}`);
  }
}

// Test 2: Data Model Validation
async function testDataModels() {
  log('\n📊 Testing Data Models...', 'blue');
  
  try {
    const realtimeFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/lib/supabase/realtime.ts';
    const content = fs.readFileSync(realtimeFile, 'utf8');
    
    // Test Message model completeness
    const messageFields = [
      'id', 'conversation_id', 'sender_user_id', 'sender_client_id',
      'message_type', 'content', 'file_url', 'file_name', 'file_size',
      'whatsapp_message_id', 'whatsapp_status', 'is_edited', 'is_deleted',
      'reply_to_message_id', 'created_at', 'updated_at'
    ];
    
    const missingMessageFields = messageFields.filter(field => !content.includes(field));
    
    if (missingMessageFields.length === 0) {
      addResult('Data Models - Message Interface', 'PASS', `All ${messageFields.length} message fields present`);
    } else {
      addResult('Data Models - Message Interface', 'FAIL', `Missing: ${missingMessageFields.join(', ')}`);
    }
    
    // Test Conversation model
    const conversationFields = [
      'id', 'law_firm_id', 'topic_id', 'matter_id', 'client_id',
      'title', 'description', 'conversation_type', 'status', 'priority',
      'is_whatsapp_enabled', 'whatsapp_phone', 'last_message_at'
    ];
    
    const missingConversationFields = conversationFields.filter(field => !content.includes(field));
    
    if (missingConversationFields.length === 0) {
      addResult('Data Models - Conversation Interface', 'PASS', `All ${conversationFields.length} conversation fields present`);
    } else {
      addResult('Data Models - Conversation Interface', 'FAIL', `Missing: ${missingConversationFields.join(', ')}`);
    }
    
    // Test type safety
    if (content.includes('export interface') && content.includes(': string') && content.includes(': boolean')) {
      addResult('Data Models - Type Safety', 'PASS', 'TypeScript interfaces with proper typing');
    } else {
      addResult('Data Models - Type Safety', 'WARN', 'Type safety may be incomplete');
    }
    
  } catch (error) {
    addResult('Data Models', 'FAIL', `Error: ${error.message}`);
  }
}

// Test 3: Service Layer Integration
async function testServiceIntegration() {
  log('\n🔧 Testing Service Layer Integration...', 'blue');
  
  try {
    // Test notification service
    const notificationFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/lib/notifications/chat-notifications.ts';
    
    if (fs.existsSync(notificationFile)) {
      const content = fs.readFileSync(notificationFile, 'utf8');
      
      // Test service class structure
      if (content.includes('class ChatNotificationService')) {
        addResult('Service Integration - Notification Service', 'PASS', 'ChatNotificationService class defined');
      } else {
        addResult('Service Integration - Notification Service', 'FAIL', 'ChatNotificationService class missing');
      }
      
      // Test service methods
      const serviceMethods = [
        'notifyNewMessage',
        'getNotificationPreferences',
        'updateMessageStatus',
        'getUnreadNotifications'
      ];
      
      const missingMethods = serviceMethods.filter(method => !content.includes(method));
      
      if (missingMethods.length === 0) {
        addResult('Service Integration - Notification Methods', 'PASS', 'All notification methods present');
      } else {
        addResult('Service Integration - Notification Methods', 'FAIL', `Missing: ${missingMethods.join(', ')}`);
      }
    } else {
      addResult('Service Integration - Notification Service', 'FAIL', 'Notification service file not found');
    }
    
    // Test WhatsApp service
    const whatsappFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/lib/whatsapp/api.ts';
    
    if (fs.existsSync(whatsappFile)) {
      const content = fs.readFileSync(whatsappFile, 'utf8');
      
      if (content.includes('export class WhatsAppService')) {
        addResult('Service Integration - WhatsApp Service', 'PASS', 'WhatsAppService class defined');
      } else {
        addResult('Service Integration - WhatsApp Service', 'FAIL', 'WhatsAppService class missing');
      }
    } else {
      addResult('Service Integration - WhatsApp Service', 'FAIL', 'WhatsApp service file not found');
    }
    
  } catch (error) {
    addResult('Service Integration', 'FAIL', `Error: ${error.message}`);
  }
}

// Test 4: Database Schema Validation
async function testDatabaseSchema() {
  log('\n🏗️  Testing Database Schema...', 'blue');
  
  try {
    const schemaFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/chat-database-schema.sql';
    
    if (!fs.existsSync(schemaFile)) {
      addResult('Database Schema - File Existence', 'FAIL', 'Schema file not found');
      return;
    }
    
    const schema = fs.readFileSync(schemaFile, 'utf8');
    
    // Test table creation
    const requiredTables = [
      'conversation_topics',
      'conversations',
      'conversation_participants', 
      'messages',
      'message_status',
      'whatsapp_config',
      'whatsapp_templates',
      'notification_preferences'
    ];
    
    const missingTables = requiredTables.filter(table => !schema.includes(`CREATE TABLE ${table}`));
    
    if (missingTables.length === 0) {
      addResult('Database Schema - Table Creation', 'PASS', `All ${requiredTables.length} required tables defined`);
    } else {
      addResult('Database Schema - Table Creation', 'FAIL', `Missing tables: ${missingTables.join(', ')}`);
    }
    
    // Test foreign key relationships
    const foreignKeys = ['REFERENCES law_firms', 'REFERENCES conversations', 'REFERENCES clients', 'REFERENCES users'];
    const missingForeignKeys = foreignKeys.filter(fk => !schema.includes(fk));
    
    if (missingForeignKeys.length === 0) {
      addResult('Database Schema - Foreign Keys', 'PASS', 'Proper foreign key relationships');
    } else {
      addResult('Database Schema - Foreign Keys', 'FAIL', `Missing: ${missingForeignKeys.join(', ')}`);
    }
    
    // Test constraints
    if (schema.includes('CHECK (') && schema.includes('CONSTRAINT')) {
      addResult('Database Schema - Constraints', 'PASS', 'Data validation constraints present');
    } else {
      addResult('Database Schema - Constraints', 'WARN', 'Data constraints may be incomplete');
    }
    
    // Test indexes
    const indexCount = (schema.match(/CREATE INDEX/g) || []).length;
    if (indexCount >= 10) {
      addResult('Database Schema - Performance Indexes', 'PASS', `${indexCount} performance indexes`);
    } else {
      addResult('Database Schema - Performance Indexes', 'WARN', `Only ${indexCount} indexes found`);
    }
    
  } catch (error) {
    addResult('Database Schema', 'FAIL', `Error: ${error.message}`);
  }
}

// Test 5: Security Implementation
async function testSecurityImplementation() {
  log('\n🔒 Testing Security Implementation...', 'blue');
  
  try {
    const schemaFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/chat-database-schema.sql';
    
    if (fs.existsSync(schemaFile)) {
      const schema = fs.readFileSync(schemaFile, 'utf8');
      
      // Test RLS enablement
      const rlsEnabledTables = (schema.match(/ENABLE ROW LEVEL SECURITY/g) || []).length;
      if (rlsEnabledTables >= 6) {
        addResult('Security - RLS Enablement', 'PASS', `RLS enabled on ${rlsEnabledTables} tables`);
      } else {
        addResult('Security - RLS Enablement', 'FAIL', `RLS only enabled on ${rlsEnabledTables} tables`);
      }
      
      // Test RLS policies
      const policyCount = (schema.match(/CREATE POLICY/g) || []).length;
      if (policyCount >= 5) {
        addResult('Security - RLS Policies', 'PASS', `${policyCount} security policies defined`);
      } else {
        addResult('Security - RLS Policies', 'FAIL', `Only ${policyCount} policies found`);
      }
      
      // Test auth integration
      if (schema.includes('auth.uid()')) {
        addResult('Security - Auth Integration', 'PASS', 'Supabase auth integration');
      } else {
        addResult('Security - Auth Integration', 'FAIL', 'Missing auth integration');
      }
    }
    
    // Test API security
    const webhookFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/app/api/whatsapp/webhook/route.ts';
    
    if (fs.existsSync(webhookFile)) {
      const content = fs.readFileSync(webhookFile, 'utf8');
      
      if (content.includes('verifyWebhook') && content.includes('signature')) {
        addResult('Security - Webhook Verification', 'PASS', 'Webhook signature verification');
      } else {
        addResult('Security - Webhook Verification', 'FAIL', 'Missing webhook verification');
      }
    }
    
  } catch (error) {
    addResult('Security Implementation', 'FAIL', `Error: ${error.message}`);
  }
}

// Test 6: Error Handling and Resilience
async function testErrorHandling() {
  log('\n⚠️  Testing Error Handling and Resilience...', 'blue');
  
  try {
    const realtimeFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/lib/supabase/realtime.ts';
    const content = fs.readFileSync(realtimeFile, 'utf8');
    
    // Test try-catch blocks
    const tryCatchCount = (content.match(/try \{/g) || []).length;
    const catchCount = (content.match(/\} catch \(/g) || []).length;
    
    if (tryCatchCount >= 5 && tryCatchCount === catchCount) {
      addResult('Error Handling - Try-Catch Coverage', 'PASS', `${tryCatchCount} try-catch blocks`);
    } else {
      addResult('Error Handling - Try-Catch Coverage', 'WARN', `${tryCatchCount} try blocks, ${catchCount} catch blocks`);
    }
    
    // Test error logging
    if (content.includes('console.error')) {
      addResult('Error Handling - Error Logging', 'PASS', 'Error logging implemented');
    } else {
      addResult('Error Handling - Error Logging', 'WARN', 'Error logging may be missing');
    }
    
    // Test null checks
    if (content.includes('if (!') && content.includes('return')) {
      addResult('Error Handling - Null Checks', 'PASS', 'Null/undefined checks present');
    } else {
      addResult('Error Handling - Null Checks', 'WARN', 'Null checks may be incomplete');
    }
    
    // Test graceful degradation
    if (content.includes('error') && content.includes('return null')) {
      addResult('Error Handling - Graceful Degradation', 'PASS', 'Graceful error handling');
    } else {
      addResult('Error Handling - Graceful Degradation', 'WARN', 'Error handling may not be graceful');
    }
    
  } catch (error) {
    addResult('Error Handling', 'FAIL', `Error: ${error.message}`);
  }
}

// Test 7: Performance Optimization
async function testPerformanceOptimization() {
  log('\n🚀 Testing Performance Optimization...', 'blue');
  
  try {
    const realtimeFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/lib/supabase/realtime.ts';
    const content = fs.readFileSync(realtimeFile, 'utf8');
    
    // Test pagination
    if (content.includes('limit') && content.includes('offset')) {
      addResult('Performance - Pagination', 'PASS', 'Query result pagination');
    } else {
      addResult('Performance - Pagination', 'WARN', 'Pagination may be missing');
    }
    
    // Test connection reuse
    if (content.includes('channels.get(') && content.includes('Map')) {
      addResult('Performance - Connection Reuse', 'PASS', 'Channel connection reuse');
    } else {
      addResult('Performance - Connection Reuse', 'WARN', 'Connection management may be inefficient');
    }
    
    // Test memory management
    if (content.includes('cleanup()') && content.includes('clear()')) {
      addResult('Performance - Memory Management', 'PASS', 'Proper cleanup methods');
    } else {
      addResult('Performance - Memory Management', 'WARN', 'Memory management may leak');
    }
    
    // Test selective fields
    if (content.includes('select(') && !content.includes('select(*)')) {
      addResult('Performance - Selective Queries', 'PASS', 'Selective field queries');
    } else {
      addResult('Performance - Selective Queries', 'WARN', 'Query optimization opportunity');
    }
    
  } catch (error) {
    addResult('Performance Optimization', 'FAIL', `Error: ${error.message}`);
  }
}

// Test 8: Documentation and Maintainability
async function testDocumentationMaintainability() {
  log('\n📚 Testing Documentation and Maintainability...', 'blue');
  
  try {
    const files = [
      '/Users/20015403/Documents/PROJECTS/personal/prima-facie/lib/supabase/realtime.ts',
      '/Users/20015403/Documents/PROJECTS/personal/prima-facie/lib/notifications/chat-notifications.ts',
      '/Users/20015403/Documents/PROJECTS/personal/prima-facie/lib/whatsapp/api.ts'
    ];
    
    let totalComments = 0;
    let filesWithComments = 0;
    let totalInterfaces = 0;
    
    for (const file of files) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        const commentCount = (content.match(/\/\//g) || []).length + (content.match(/\/\*/g) || []).length;
        const interfaceCount = (content.match(/interface /g) || []).length;
        
        totalComments += commentCount;
        totalInterfaces += interfaceCount;
        
        if (commentCount > 0) {
          filesWithComments++;
        }
      }
    }
    
    if (filesWithComments >= 2) {
      addResult('Documentation - Code Comments', 'PASS', `${totalComments} comments across ${filesWithComments} files`);
    } else {
      addResult('Documentation - Code Comments', 'WARN', 'Limited code documentation');
    }
    
    if (totalInterfaces >= 5) {
      addResult('Documentation - Type Definitions', 'PASS', `${totalInterfaces} TypeScript interfaces`);
    } else {
      addResult('Documentation - Type Definitions', 'WARN', 'Limited type documentation');
    }
    
    // Test schema documentation
    const schemaFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/chat-database-schema.sql';
    if (fs.existsSync(schemaFile)) {
      const schema = fs.readFileSync(schemaFile, 'utf8');
      
      if (schema.includes('COMMENT ON')) {
        addResult('Documentation - Database Comments', 'PASS', 'Database schema documented');
      } else {
        addResult('Documentation - Database Comments', 'WARN', 'Database documentation limited');
      }
    }
    
  } catch (error) {
    addResult('Documentation and Maintainability', 'FAIL', `Error: ${error.message}`);
  }
}

// Generate Report
function generateReport() {
  log('\n📋 Generating API Validation Report...', 'blue');
  
  const passed = TEST_RESULTS.filter(r => r.status === 'PASS').length;
  const failed = TEST_RESULTS.filter(r => r.status === 'FAIL').length;
  const warnings = TEST_RESULTS.filter(r => r.status === 'WARN').length;
  const total = TEST_RESULTS.length;
  
  const report = {
    summary: {
      total,
      passed,
      failed,
      warnings,
      successRate: Math.round((passed / total) * 100)
    },
    results: TEST_RESULTS,
    categories: {
      'API Endpoints': TEST_RESULTS.filter(r => r.test.includes('API Endpoints')),
      'Data Models': TEST_RESULTS.filter(r => r.test.includes('Data Models')),
      'Service Integration': TEST_RESULTS.filter(r => r.test.includes('Service Integration')),
      'Database Schema': TEST_RESULTS.filter(r => r.test.includes('Database Schema')),
      'Security': TEST_RESULTS.filter(r => r.test.includes('Security')),
      'Error Handling': TEST_RESULTS.filter(r => r.test.includes('Error Handling')),
      'Performance': TEST_RESULTS.filter(r => r.test.includes('Performance')),
      'Documentation': TEST_RESULTS.filter(r => r.test.includes('Documentation'))
    },
    recommendations: [],
    timestamp: new Date().toISOString()
  };
  
  // Generate category-specific recommendations
  const failedTests = TEST_RESULTS.filter(r => r.status === 'FAIL');
  const warningTests = TEST_RESULTS.filter(r => r.status === 'WARN');
  
  if (failedTests.some(t => t.test.includes('API'))) {
    report.recommendations.push('Fix API endpoint failures before production deployment');
  }
  
  if (failedTests.some(t => t.test.includes('Security'))) {
    report.recommendations.push('Address security failures - critical for production');
  }
  
  if (failedTests.some(t => t.test.includes('Database'))) {
    report.recommendations.push('Complete database schema and relationships');
  }
  
  if (warningTests.length > 5) {
    report.recommendations.push('Review and address warnings for system robustness');
  }
  
  if (warningTests.some(t => t.test.includes('Performance'))) {
    report.recommendations.push('Optimize performance bottlenecks for scalability');
  }
  
  if (warningTests.some(t => t.test.includes('Documentation'))) {
    report.recommendations.push('Improve code documentation for maintainability');
  }
  
  // Save report
  fs.writeFileSync('messaging-api-validation-report.json', JSON.stringify(report, null, 2));
  
  // Display summary
  log(`\n${colors.bold}📊 MESSAGING API VALIDATION SUMMARY${colors.reset}`, 'blue');
  log(`Total Tests: ${total}`);
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'reset');
  log(`⚠️  Warnings: ${warnings}`, warnings > 0 ? 'yellow' : 'reset');
  log(`Success Rate: ${report.summary.successRate}%`, report.summary.successRate >= 85 ? 'green' : 'red');
  
  // Category breakdown
  log('\n📈 Category Breakdown:', 'blue');
  Object.entries(report.categories).forEach(([category, tests]) => {
    const categoryPassed = tests.filter(t => t.status === 'PASS').length;
    const categoryTotal = tests.length;
    const categoryRate = categoryTotal > 0 ? Math.round((categoryPassed / categoryTotal) * 100) : 0;
    const color = categoryRate >= 80 ? 'green' : categoryRate >= 60 ? 'yellow' : 'red';
    log(`   ${category}: ${categoryPassed}/${categoryTotal} (${categoryRate}%)`, color);
  });
  
  if (report.recommendations.length > 0) {
    log('\n💡 Recommendations:', 'yellow');
    report.recommendations.forEach(rec => log(`   • ${rec}`, 'yellow'));
  }
  
  log(`\n📄 Detailed report saved to: messaging-api-validation-report.json`, 'blue');
  
  return report.summary.successRate >= 85;
}

// Main test execution
async function runTests() {
  log(`${colors.bold}🧪 PRIMA FACIE - MESSAGING API & DATA MODEL VALIDATION${colors.reset}`, 'blue');
  log('Comprehensive validation of API endpoints, data models, and service integration\n');
  
  await testAPIEndpoints();
  await testDataModels();
  await testServiceIntegration();
  await testDatabaseSchema();
  await testSecurityImplementation();
  await testErrorHandling();
  await testPerformanceOptimization();
  await testDocumentationMaintainability();
  
  const success = generateReport();
  
  if (success) {
    log('\n🎉 Messaging API validation completed successfully!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Messaging API validation completed with issues.', 'yellow');
    process.exit(1);
  }
}

// Error handling
process.on('uncaughtException', (error) => {
  log(`\n❌ Uncaught Exception: ${error.message}`, 'red');
  addResult('Test Suite Execution', 'FAIL', `Uncaught exception: ${error.message}`);
  generateReport();
  process.exit(1);
});

// Run the tests
runTests();