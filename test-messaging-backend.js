#!/usr/bin/env node

/**
 * Prima Facie - Messaging System Backend Test Suite
 * Comprehensive testing of messaging APIs, real-time infrastructure, and database integration
 */

const { execSync } = require('child_process');
const fs = require('fs');
// Using built-in fetch from Node.js 18+

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

// Test 1: Server Health Check
async function testServerHealth() {
  log('\n📊 Testing Server Health...', 'blue');
  
  try {
    const response = await fetch(`${BASE_URL}`, { timeout: 5000 });
    if (response.ok) {
      addResult('Server Health Check', 'PASS', `Status: ${response.status}`);
      return true;
    } else {
      addResult('Server Health Check', 'FAIL', `Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    addResult('Server Health Check', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

// Test 2: WhatsApp Webhook Verification
async function testWhatsAppWebhook() {
  log('\n📱 Testing WhatsApp Webhook...', 'blue');
  
  try {
    // Test webhook verification (GET)
    const verifyUrl = `${BASE_URL}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=prima_facie_webhook_token&hub.challenge=test123`;
    const verifyResponse = await fetch(verifyUrl);
    const verifyText = await verifyResponse.text();
    
    if (verifyResponse.ok && verifyText === 'test123') {
      addResult('WhatsApp Webhook Verification', 'PASS', 'Token verification works');
    } else {
      addResult('WhatsApp Webhook Verification', 'FAIL', `Response: ${verifyText}`);
    }
    
    // Test invalid token
    const invalidUrl = `${BASE_URL}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=invalid&hub.challenge=test123`;
    const invalidResponse = await fetch(invalidUrl);
    
    if (invalidResponse.status === 403) {
      addResult('WhatsApp Webhook Security', 'PASS', 'Invalid token rejected');
    } else {
      addResult('WhatsApp Webhook Security', 'FAIL', `Expected 403, got ${invalidResponse.status}`);
    }
    
  } catch (error) {
    addResult('WhatsApp Webhook', 'FAIL', `Error: ${error.message}`);
  }
}

// Test 3: Database Schema Validation
async function testDatabaseSchema() {
  log('\n🗄️  Testing Database Schema...', 'blue');
  
  const schemaFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/chat-database-schema.sql';
  
  try {
    if (fs.existsSync(schemaFile)) {
      const schema = fs.readFileSync(schemaFile, 'utf8');
      
      // Check for essential tables
      const requiredTables = [
        'conversations',
        'messages', 
        'conversation_participants',
        'message_status',
        'whatsapp_config',
        'notification_preferences'
      ];
      
      const missingTables = requiredTables.filter(table => !schema.includes(`CREATE TABLE ${table}`));
      
      if (missingTables.length === 0) {
        addResult('Database Schema - Tables', 'PASS', `All ${requiredTables.length} required tables defined`);
      } else {
        addResult('Database Schema - Tables', 'FAIL', `Missing: ${missingTables.join(', ')}`);
      }
      
      // Check for RLS policies
      if (schema.includes('ROW LEVEL SECURITY') && schema.includes('CREATE POLICY')) {
        addResult('Database Schema - RLS', 'PASS', 'Row Level Security policies defined');
      } else {
        addResult('Database Schema - RLS', 'FAIL', 'Missing RLS policies');
      }
      
      // Check for indexes
      if (schema.includes('CREATE INDEX')) {
        const indexCount = (schema.match(/CREATE INDEX/g) || []).length;
        addResult('Database Schema - Indexes', 'PASS', `${indexCount} performance indexes defined`);
      } else {
        addResult('Database Schema - Indexes', 'WARN', 'No performance indexes found');
      }
      
    } else {
      addResult('Database Schema File', 'FAIL', 'Schema file not found');
    }
  } catch (error) {
    addResult('Database Schema', 'FAIL', `Error: ${error.message}`);
  }
}

// Test 4: Real-time Service Implementation
async function testRealtimeService() {
  log('\n⚡ Testing Real-time Service...', 'blue');
  
  try {
    const realtimeFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/lib/supabase/realtime.ts';
    
    if (fs.existsSync(realtimeFile)) {
      const content = fs.readFileSync(realtimeFile, 'utf8');
      
      // Check for essential classes and methods
      const requiredElements = [
        'class RealtimeChatService',
        'subscribeToConversation',
        'sendMessage',
        'sendTypingIndicator',
        'getConversationMessages',
        'getUserConversations',
        'markMessagesAsRead'
      ];
      
      const missingElements = requiredElements.filter(element => !content.includes(element));
      
      if (missingElements.length === 0) {
        addResult('Real-time Service - Implementation', 'PASS', `All ${requiredElements.length} required methods present`);
      } else {
        addResult('Real-time Service - Implementation', 'FAIL', `Missing: ${missingElements.join(', ')}`);
      }
      
      // Check for proper TypeScript types
      const requiredTypes = ['Message', 'Conversation', 'TypingIndicator', 'OnlinePresence'];
      const missingTypes = requiredTypes.filter(type => !content.includes(`interface ${type}`));
      
      if (missingTypes.length === 0) {
        addResult('Real-time Service - Types', 'PASS', `All ${requiredTypes.length} TypeScript interfaces defined`);
      } else {
        addResult('Real-time Service - Types', 'FAIL', `Missing: ${missingTypes.join(', ')}`);
      }
      
    } else {
      addResult('Real-time Service File', 'FAIL', 'Realtime service file not found');
    }
  } catch (error) {
    addResult('Real-time Service', 'FAIL', `Error: ${error.message}`);
  }
}

// Test 5: Notification Service
async function testNotificationService() {
  log('\n🔔 Testing Notification Service...', 'blue');
  
  try {
    const notificationFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/lib/notifications/chat-notifications.ts';
    
    if (fs.existsSync(notificationFile)) {
      const content = fs.readFileSync(notificationFile, 'utf8');
      
      // Check for notification methods
      const requiredMethods = [
        'notifyNewMessage',
        'getNotificationPreferences',
        'updateMessageStatus',
        'getUnreadNotifications',
        'markNotificationAsRead'
      ];
      
      const missingMethods = requiredMethods.filter(method => !content.includes(method));
      
      if (missingMethods.length === 0) {
        addResult('Notification Service - Methods', 'PASS', `All ${requiredMethods.length} notification methods present`);
      } else {
        addResult('Notification Service - Methods', 'FAIL', `Missing: ${missingMethods.join(', ')}`);
      }
      
      // Check for notification channels
      const channels = ['email_notifications', 'push_notifications', 'whatsapp_notifications'];
      const hasChannels = channels.every(channel => content.includes(channel));
      
      if (hasChannels) {
        addResult('Notification Service - Channels', 'PASS', 'Multi-channel notification support');
      } else {
        addResult('Notification Service - Channels', 'FAIL', 'Missing notification channels');
      }
      
    } else {
      addResult('Notification Service File', 'FAIL', 'Notification service file not found');
    }
  } catch (error) {
    addResult('Notification Service', 'FAIL', `Error: ${error.message}`);
  }
}

// Test 6: WhatsApp API Integration
async function testWhatsAppAPI() {
  log('\n📞 Testing WhatsApp API Integration...', 'blue');
  
  try {
    const whatsappFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/lib/whatsapp/api.ts';
    
    if (fs.existsSync(whatsappFile)) {
      const content = fs.readFileSync(whatsappFile, 'utf8');
      
      // Check for WhatsApp API methods
      const requiredMethods = [
        'sendTextMessage',
        'sendTemplateMessage',
        'sendDocument',
        'sendImage',
        'downloadMedia',
        'processWebhook',
        'verifyWebhook'
      ];
      
      const missingMethods = requiredMethods.filter(method => !content.includes(method));
      
      if (missingMethods.length === 0) {
        addResult('WhatsApp API - Methods', 'PASS', `All ${requiredMethods.length} API methods present`);
      } else {
        addResult('WhatsApp API - Methods', 'FAIL', `Missing: ${missingMethods.join(', ')}`);
      }
      
      // Check for Brazilian phone number formatting
      if (content.includes('formatPhoneNumber') && content.includes('55')) {
        addResult('WhatsApp API - Brazilian Support', 'PASS', 'Brazilian phone number formatting implemented');
      } else {
        addResult('WhatsApp API - Brazilian Support', 'WARN', 'Brazilian phone number support unclear');
      }
      
    } else {
      addResult('WhatsApp API File', 'FAIL', 'WhatsApp API file not found');
    }
  } catch (error) {
    addResult('WhatsApp API', 'FAIL', `Error: ${error.message}`);
  }
}

// Test 7: Security Implementation
async function testSecurity() {
  log('\n🔒 Testing Security Implementation...', 'blue');
  
  try {
    // Check middleware
    const middlewareFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/middleware.ts';
    
    if (fs.existsSync(middlewareFile)) {
      const content = fs.readFileSync(middlewareFile, 'utf8');
      
      if (content.includes('messages') || content.includes('auth')) {
        addResult('Security - Middleware', 'PASS', 'Authentication middleware present');
      } else {
        addResult('Security - Middleware', 'WARN', 'No specific messaging auth found');
      }
    }
    
    // Check RLS policies in schema
    const schemaFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/chat-database-schema.sql';
    if (fs.existsSync(schemaFile)) {
      const schema = fs.readFileSync(schemaFile, 'utf8');
      
      if (schema.includes('auth.uid()') && schema.includes('conversation_participants')) {
        addResult('Security - RLS Policies', 'PASS', 'Row Level Security with participant validation');
      } else {
        addResult('Security - RLS Policies', 'FAIL', 'Incomplete RLS policies');
      }
    }
    
  } catch (error) {
    addResult('Security Implementation', 'FAIL', `Error: ${error.message}`);
  }
}

// Test 8: API Route Structure
async function testAPIRoutes() {
  log('\n🛣️  Testing API Route Structure...', 'blue');
  
  try {
    const apiDir = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/app/api';
    
    if (fs.existsSync(apiDir)) {
      const routes = [];
      
      // Recursively find all route files
      function findRoutes(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = `${dir}/${file}`;
          if (fs.statSync(fullPath).isDirectory()) {
            findRoutes(fullPath);
          } else if (file === 'route.ts' || file === 'route.js') {
            routes.push(fullPath.replace(apiDir, '').replace('/route.ts', '').replace('/route.js', ''));
          }
        }
      }
      
      findRoutes(apiDir);
      
      addResult('API Routes - Discovery', 'PASS', `Found ${routes.length} API routes: ${routes.join(', ')}`);
      
      // Check for messaging-specific routes
      const messagingRoutes = routes.filter(route => 
        route.includes('whatsapp') || 
        route.includes('message') || 
        route.includes('chat') || 
        route.includes('conversation')
      );
      
      if (messagingRoutes.length > 0) {
        addResult('API Routes - Messaging', 'PASS', `Messaging routes: ${messagingRoutes.join(', ')}`);
      } else {
        addResult('API Routes - Messaging', 'WARN', 'No dedicated messaging API routes found');
      }
      
    } else {
      addResult('API Routes Directory', 'FAIL', 'API directory not found');
    }
  } catch (error) {
    addResult('API Routes', 'FAIL', `Error: ${error.message}`);
  }
}

// Test 9: Component Integration
async function testComponentIntegration() {
  log('\n🧩 Testing Component Integration...', 'blue');
  
  try {
    const componentsDir = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/components/chat';
    
    if (fs.existsSync(componentsDir)) {
      const components = fs.readdirSync(componentsDir).filter(file => file.endsWith('.tsx'));
      
      addResult('Chat Components - Files', 'PASS', `Found ${components.length} chat components: ${components.join(', ')}`);
      
      // Check for essential components
      const requiredComponents = [
        'chat-interface.tsx',
        'conversation-list.tsx',
        'message-status-indicator.tsx'
      ];
      
      const missingComponents = requiredComponents.filter(comp => !components.includes(comp));
      
      if (missingComponents.length === 0) {
        addResult('Chat Components - Required', 'PASS', 'All essential chat components present');
      } else {
        addResult('Chat Components - Required', 'FAIL', `Missing: ${missingComponents.join(', ')}`);
      }
      
    } else {
      addResult('Chat Components Directory', 'FAIL', 'Chat components directory not found');
    }
    
    // Check messages page
    const messagesPage = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/app/(dashboard)/messages/page.tsx';
    if (fs.existsSync(messagesPage)) {
      const content = fs.readFileSync(messagesPage, 'utf8');
      
      if (content.includes('ConversationList') && content.includes('ChatInterface')) {
        addResult('Messages Page - Integration', 'PASS', 'Messages page properly integrates chat components');
      } else {
        addResult('Messages Page - Integration', 'FAIL', 'Messages page missing component integration');
      }
    }
    
  } catch (error) {
    addResult('Component Integration', 'FAIL', `Error: ${error.message}`);
  }
}

// Test 10: Performance and Scalability
async function testPerformance() {
  log('\n🚀 Testing Performance Considerations...', 'blue');
  
  try {
    const schemaFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/chat-database-schema.sql';
    
    if (fs.existsSync(schemaFile)) {
      const schema = fs.readFileSync(schemaFile, 'utf8');
      
      // Check for database indexes
      const indexes = (schema.match(/CREATE INDEX/g) || []).length;
      if (indexes >= 5) {
        addResult('Performance - Database Indexes', 'PASS', `${indexes} performance indexes defined`);
      } else {
        addResult('Performance - Database Indexes', 'WARN', `Only ${indexes} indexes found, consider more for messaging queries`);
      }
      
      // Check for pagination support
      const realtimeFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/lib/supabase/realtime.ts';
      if (fs.existsSync(realtimeFile)) {
        const content = fs.readFileSync(realtimeFile, 'utf8');
        
        if (content.includes('limit') && content.includes('offset')) {
          addResult('Performance - Pagination', 'PASS', 'Message pagination implemented');
        } else {
          addResult('Performance - Pagination', 'WARN', 'Message pagination may be missing');
        }
      }
    }
    
  } catch (error) {
    addResult('Performance Testing', 'FAIL', `Error: ${error.message}`);
  }
}

// Generate Report
function generateReport() {
  log('\n📋 Generating Test Report...', 'blue');
  
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
    recommendations: [],
    timestamp: new Date().toISOString()
  };
  
  // Add recommendations based on failures
  if (failed > 0) {
    report.recommendations.push('Address failed tests before production deployment');
  }
  
  if (warnings > 0) {
    report.recommendations.push('Review warnings for optimization opportunities');
  }
  
  // Generate recommendations
  const failedTests = TEST_RESULTS.filter(r => r.status === 'FAIL');
  
  if (failedTests.some(t => t.test.includes('Database'))) {
    report.recommendations.push('Verify database connection and table existence');
  }
  
  if (failedTests.some(t => t.test.includes('Security'))) {
    report.recommendations.push('Strengthen security implementation before production');
  }
  
  if (failedTests.some(t => t.test.includes('API'))) {
    report.recommendations.push('Complete API endpoint implementation');
  }
  
  // Save report
  fs.writeFileSync('messaging-backend-test-report.json', JSON.stringify(report, null, 2));
  
  // Display summary
  log(`\n${colors.bold}📊 MESSAGING BACKEND TEST SUMMARY${colors.reset}`, 'blue');
  log(`Total Tests: ${total}`);
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'reset');
  log(`⚠️  Warnings: ${warnings}`, warnings > 0 ? 'yellow' : 'reset');
  log(`Success Rate: ${report.summary.successRate}%`, report.summary.successRate >= 80 ? 'green' : 'red');
  
  if (report.recommendations.length > 0) {
    log('\n💡 Recommendations:', 'yellow');
    report.recommendations.forEach(rec => log(`   • ${rec}`, 'yellow'));
  }
  
  log(`\n📄 Detailed report saved to: messaging-backend-test-report.json`, 'blue');
  
  return report.summary.successRate >= 80;
}

// Main test execution
async function runTests() {
  log(`${colors.bold}🧪 PRIMA FACIE - MESSAGING BACKEND TEST SUITE${colors.reset}`, 'blue');
  log('Testing messaging APIs, real-time infrastructure, and database integration\n');
  
  const serverHealthy = await testServerHealth();
  
  if (!serverHealthy) {
    log('\n❌ Server not healthy, some tests may fail', 'red');
  }
  
  await testWhatsAppWebhook();
  await testDatabaseSchema();
  await testRealtimeService();
  await testNotificationService();
  await testWhatsAppAPI();
  await testSecurity();
  await testAPIRoutes();
  await testComponentIntegration();
  await testPerformance();
  
  const success = generateReport();
  
  if (success) {
    log('\n🎉 Messaging backend testing completed successfully!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Messaging backend testing completed with issues.', 'yellow');
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

process.on('unhandledRejection', (reason, promise) => {
  log(`\n❌ Unhandled Rejection: ${reason}`, 'red');
  addResult('Test Suite Execution', 'FAIL', `Unhandled rejection: ${reason}`);
  generateReport();
  process.exit(1);
});

// Run the tests
runTests();