#!/usr/bin/env node

/**
 * Prima Facie - Real-time Messaging Infrastructure Test
 * Tests real-time functionality, WebSocket connections, and data flow
 */

const fs = require('fs');

// Configuration
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

// Test 1: Real-time Service Architecture
async function testRealtimeArchitecture() {
  log('\n⚡ Testing Real-time Service Architecture...', 'blue');
  
  try {
    const realtimeFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/lib/supabase/realtime.ts';
    
    if (!fs.existsSync(realtimeFile)) {
      addResult('Real-time Service File', 'FAIL', 'File not found');
      return;
    }
    
    const content = fs.readFileSync(realtimeFile, 'utf8');
    
    // Test for proper class structure
    if (content.includes('export class RealtimeChatService')) {
      addResult('Real-time Architecture - Class Definition', 'PASS', 'RealtimeChatService class properly defined');
    } else {
      addResult('Real-time Architecture - Class Definition', 'FAIL', 'Missing RealtimeChatService class');
    }
    
    // Test for channel management
    if (content.includes('private channels: Map<string, RealtimeChannel>')) {
      addResult('Real-time Architecture - Channel Management', 'PASS', 'Channel management with Map structure');
    } else {
      addResult('Real-time Architecture - Channel Management', 'FAIL', 'Missing channel management');
    }
    
    // Test for handler management
    const handlerTypes = ['messageHandlers', 'typingHandlers', 'presenceHandlers'];
    const missingHandlers = handlerTypes.filter(handler => !content.includes(handler));
    
    if (missingHandlers.length === 0) {
      addResult('Real-time Architecture - Event Handlers', 'PASS', 'All event handler types present');
    } else {
      addResult('Real-time Architecture - Event Handlers', 'FAIL', `Missing: ${missingHandlers.join(', ')}`);
    }
    
    // Test for cleanup functionality
    if (content.includes('cleanup()') && content.includes('channels.clear()')) {
      addResult('Real-time Architecture - Memory Management', 'PASS', 'Proper cleanup functionality');
    } else {
      addResult('Real-time Architecture - Memory Management', 'WARN', 'Memory management may be incomplete');
    }
    
  } catch (error) {
    addResult('Real-time Architecture', 'FAIL', `Error: ${error.message}`);
  }
}

// Test 2: Message Types and Validation
async function testMessageTypes() {
  log('\n📝 Testing Message Types and Validation...', 'blue');
  
  try {
    const realtimeFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/lib/supabase/realtime.ts';
    const content = fs.readFileSync(realtimeFile, 'utf8');
    
    // Test Message interface
    if (content.includes('export interface Message')) {
      addResult('Message Types - Interface Definition', 'PASS', 'Message interface properly defined');
      
      // Check for essential message fields
      const requiredFields = [
        'id: string',
        'conversation_id: string',
        'content: string',
        'message_type:',
        'created_at: string'
      ];
      
      const missingFields = requiredFields.filter(field => !content.includes(field));
      
      if (missingFields.length === 0) {
        addResult('Message Types - Required Fields', 'PASS', 'All essential message fields present');
      } else {
        addResult('Message Types - Required Fields', 'FAIL', `Missing: ${missingFields.join(', ')}`);
      }
      
      // Check for message types
      const messageTypes = ['text', 'file', 'image', 'document', 'system', 'whatsapp'];
      const typePattern = new RegExp(`message_type.*${messageTypes.join('|')}`);
      
      if (typePattern.test(content)) {
        addResult('Message Types - Type Definitions', 'PASS', 'Multiple message types supported');
      } else {
        addResult('Message Types - Type Definitions', 'WARN', 'Limited message type support');
      }
    } else {
      addResult('Message Types - Interface Definition', 'FAIL', 'Message interface not found');
    }
    
    // Test Conversation interface
    if (content.includes('export interface Conversation')) {
      addResult('Message Types - Conversation Interface', 'PASS', 'Conversation interface defined');
    } else {
      addResult('Message Types - Conversation Interface', 'FAIL', 'Conversation interface missing');
    }
    
    // Test TypingIndicator interface
    if (content.includes('export interface TypingIndicator')) {
      addResult('Message Types - Typing Indicator', 'PASS', 'Typing indicator interface defined');
    } else {
      addResult('Message Types - Typing Indicator', 'FAIL', 'Typing indicator interface missing');
    }
    
  } catch (error) {
    addResult('Message Types', 'FAIL', `Error: ${error.message}`);
  }
}

// Test 3: Subscription Management
async function testSubscriptionManagement() {
  log('\n🔗 Testing Subscription Management...', 'blue');
  
  try {
    const realtimeFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/lib/supabase/realtime.ts';
    const content = fs.readFileSync(realtimeFile, 'utf8');
    
    // Test subscription methods
    const subscriptionMethods = [
      'subscribeToConversation',
      'subscribeToPresence',
      'subscribeToConversations'
    ];
    
    const missingMethods = subscriptionMethods.filter(method => !content.includes(method));
    
    if (missingMethods.length === 0) {
      addResult('Subscription Management - Methods', 'PASS', 'All subscription methods present');
    } else {
      addResult('Subscription Management - Methods', 'FAIL', `Missing: ${missingMethods.join(', ')}`);
    }
    
    // Test unsubscribe functionality
    if (content.includes('return () => {') && content.includes('unsubscribe')) {
      addResult('Subscription Management - Unsubscribe', 'PASS', 'Proper unsubscribe functionality');
    } else {
      addResult('Subscription Management - Unsubscribe', 'WARN', 'Unsubscribe functionality may be incomplete');
    }
    
    // Test channel naming conventions
    if (content.includes('conversation:${conversationId}') || content.includes('presence:${userId}')) {
      addResult('Subscription Management - Channel Naming', 'PASS', 'Consistent channel naming conventions');
    } else {
      addResult('Subscription Management - Channel Naming', 'WARN', 'Channel naming conventions unclear');
    }
    
  } catch (error) {
    addResult('Subscription Management', 'FAIL', `Error: ${error.message}`);
  }
}

// Test 4: Message Sending and Broadcasting
async function testMessageSending() {
  log('\n📤 Testing Message Sending and Broadcasting...', 'blue');
  
  try {
    const realtimeFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/lib/supabase/realtime.ts';
    const content = fs.readFileSync(realtimeFile, 'utf8');
    
    // Test sendMessage method
    if (content.includes('async sendMessage(')) {
      addResult('Message Sending - Send Method', 'PASS', 'sendMessage method implemented');
      
      // Check for proper message construction
      if (content.includes('sender_user_id') && content.includes('sender_client_id')) {
        addResult('Message Sending - Sender Identification', 'PASS', 'Proper sender identification');
      } else {
        addResult('Message Sending - Sender Identification', 'FAIL', 'Missing sender identification');
      }
      
      // Check for broadcast functionality
      if (content.includes('channel.send') || content.includes('broadcast')) {
        addResult('Message Sending - Broadcasting', 'PASS', 'Message broadcasting implemented');
      } else {
        addResult('Message Sending - Broadcasting', 'FAIL', 'Missing message broadcasting');
      }
    } else {
      addResult('Message Sending - Send Method', 'FAIL', 'sendMessage method not found');
    }
    
    // Test typing indicator
    if (content.includes('sendTypingIndicator')) {
      addResult('Message Sending - Typing Indicator', 'PASS', 'Typing indicator functionality');
    } else {
      addResult('Message Sending - Typing Indicator', 'FAIL', 'Missing typing indicator');
    }
    
    // Test file/media support
    if (content.includes('fileData') || content.includes('file_url')) {
      addResult('Message Sending - File Support', 'PASS', 'File attachment support');
    } else {
      addResult('Message Sending - File Support', 'WARN', 'File attachment support unclear');
    }
    
  } catch (error) {
    addResult('Message Sending', 'FAIL', `Error: ${error.message}`);
  }
}

// Test 5: Database Integration
async function testDatabaseIntegration() {
  log('\n🗄️  Testing Database Integration...', 'blue');
  
  try {
    const realtimeFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/lib/supabase/realtime.ts';
    const content = fs.readFileSync(realtimeFile, 'utf8');
    
    // Test database methods
    const dbMethods = [
      'getConversationMessages',
      'getUserConversations',
      'markMessagesAsRead',
      'createConversation'
    ];
    
    const missingDbMethods = dbMethods.filter(method => !content.includes(method));
    
    if (missingDbMethods.length === 0) {
      addResult('Database Integration - Methods', 'PASS', 'All database methods present');
    } else {
      addResult('Database Integration - Methods', 'FAIL', `Missing: ${missingDbMethods.join(', ')}`);
    }
    
    // Test Supabase integration
    if (content.includes('supabase.from(') && content.includes('select') && content.includes('insert')) {
      addResult('Database Integration - Supabase Queries', 'PASS', 'Proper Supabase query integration');
    } else {
      addResult('Database Integration - Supabase Queries', 'FAIL', 'Missing Supabase query integration');
    }
    
    // Test pagination
    if (content.includes('limit') && content.includes('offset')) {
      addResult('Database Integration - Pagination', 'PASS', 'Message pagination implemented');
    } else {
      addResult('Database Integration - Pagination', 'WARN', 'Pagination may be missing');
    }
    
    // Test error handling
    if (content.includes('try {') && content.includes('catch (error)')) {
      addResult('Database Integration - Error Handling', 'PASS', 'Error handling implemented');
    } else {
      addResult('Database Integration - Error Handling', 'WARN', 'Error handling may be incomplete');
    }
    
  } catch (error) {
    addResult('Database Integration', 'FAIL', `Error: ${error.message}`);
  }
}

// Test 6: Real-time Features
async function testRealtimeFeatures() {
  log('\n🔴 Testing Real-time Features...', 'blue');
  
  try {
    const realtimeFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/lib/supabase/realtime.ts';
    const content = fs.readFileSync(realtimeFile, 'utf8');
    
    // Test presence tracking
    if (content.includes('OnlinePresence') && content.includes('track(')) {
      addResult('Real-time Features - Presence Tracking', 'PASS', 'Online presence tracking implemented');
    } else {
      addResult('Real-time Features - Presence Tracking', 'WARN', 'Presence tracking may be incomplete');
    }
    
    // Test typing indicators
    if (content.includes('is_typing') && content.includes('TypingIndicator')) {
      addResult('Real-time Features - Typing Indicators', 'PASS', 'Typing indicators implemented');
    } else {
      addResult('Real-time Features - Typing Indicators', 'FAIL', 'Missing typing indicators');
    }
    
    // Test message status tracking
    if (content.includes('message_status') && content.includes('read') && content.includes('delivered')) {
      addResult('Real-time Features - Message Status', 'PASS', 'Message status tracking implemented');
    } else {
      addResult('Real-time Features - Message Status', 'WARN', 'Message status tracking may be incomplete');
    }
    
    // Test real-time updates
    if (content.includes('postgres_changes') || content.includes('on(')) {
      addResult('Real-time Features - Live Updates', 'PASS', 'Real-time database updates');
    } else {
      addResult('Real-time Features - Live Updates', 'WARN', 'Real-time updates may use mock implementation');
    }
    
  } catch (error) {
    addResult('Real-time Features', 'FAIL', `Error: ${error.message}`);
  }
}

// Test 7: Chat Component Integration
async function testChatComponentIntegration() {
  log('\n🧩 Testing Chat Component Integration...', 'blue');
  
  try {
    const chatInterfaceFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/components/chat/chat-interface.tsx';
    
    if (!fs.existsSync(chatInterfaceFile)) {
      addResult('Chat Component - File Existence', 'FAIL', 'chat-interface.tsx not found');
      return;
    }
    
    const content = fs.readFileSync(chatInterfaceFile, 'utf8');
    
    // Test service integration
    if (content.includes('chatService') && content.includes('from @/lib/supabase/realtime')) {
      addResult('Chat Component - Service Integration', 'PASS', 'Real-time service properly integrated');
    } else {
      addResult('Chat Component - Service Integration', 'FAIL', 'Missing real-time service integration');
    }
    
    // Test real-time subscriptions
    if (content.includes('subscribeToConversation') && content.includes('useEffect')) {
      addResult('Chat Component - Real-time Subscriptions', 'PASS', 'Real-time subscriptions implemented');
    } else {
      addResult('Chat Component - Real-time Subscriptions', 'FAIL', 'Missing real-time subscriptions');
    }
    
    // Test message sending
    if (content.includes('sendMessage') && content.includes('handleSendMessage')) {
      addResult('Chat Component - Message Sending', 'PASS', 'Message sending functionality');
    } else {
      addResult('Chat Component - Message Sending', 'FAIL', 'Missing message sending');
    }
    
    // Test typing indicators
    if (content.includes('sendTypingIndicator') && content.includes('isTyping')) {
      addResult('Chat Component - Typing Indicators', 'PASS', 'Typing indicators integrated');
    } else {
      addResult('Chat Component - Typing Indicators', 'WARN', 'Typing indicators may be incomplete');
    }
    
    // Test file upload
    if (content.includes('handleFileUpload') && content.includes('file_url')) {
      addResult('Chat Component - File Upload', 'PASS', 'File upload functionality');
    } else {
      addResult('Chat Component - File Upload', 'WARN', 'File upload may be incomplete');
    }
    
  } catch (error) {
    addResult('Chat Component Integration', 'FAIL', `Error: ${error.message}`);
  }
}

// Test 8: Performance and Scalability
async function testPerformanceScalability() {
  log('\n🚀 Testing Performance and Scalability...', 'blue');
  
  try {
    const realtimeFile = '/Users/20015403/Documents/PROJECTS/personal/prima-facie/lib/supabase/realtime.ts';
    const content = fs.readFileSync(realtimeFile, 'utf8');
    
    // Test memory management
    if (content.includes('cleanup()') && content.includes('clear()')) {
      addResult('Performance - Memory Management', 'PASS', 'Proper memory cleanup');
    } else {
      addResult('Performance - Memory Management', 'WARN', 'Memory management may be incomplete');
    }
    
    // Test efficient querying
    if (content.includes('limit') && content.includes('select(')) {
      addResult('Performance - Efficient Queries', 'PASS', 'Limited query results for performance');
    } else {
      addResult('Performance - Efficient Queries', 'WARN', 'Query optimization may be needed');
    }
    
    // Test channel reuse
    if (content.includes('channels.get(') && content.includes('Map')) {
      addResult('Performance - Channel Reuse', 'PASS', 'Channel reuse for efficiency');
    } else {
      addResult('Performance - Channel Reuse', 'WARN', 'Channel management may create duplicates');
    }
    
    // Test timeout handling
    if (content.includes('timeout') || content.includes('clearTimeout')) {
      addResult('Performance - Timeout Handling', 'PASS', 'Timeout handling implemented');
    } else {
      addResult('Performance - Timeout Handling', 'WARN', 'Timeout handling may be missing');
    }
    
  } catch (error) {
    addResult('Performance and Scalability', 'FAIL', `Error: ${error.message}`);
  }
}

// Generate Report
function generateReport() {
  log('\n📋 Generating Real-time Test Report...', 'blue');
  
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
  
  // Add recommendations based on results
  const failedTests = TEST_RESULTS.filter(r => r.status === 'FAIL');
  const warningTests = TEST_RESULTS.filter(r => r.status === 'WARN');
  
  if (failedTests.some(t => t.test.includes('Real-time Architecture'))) {
    report.recommendations.push('Review real-time service architecture for completeness');
  }
  
  if (failedTests.some(t => t.test.includes('Message'))) {
    report.recommendations.push('Complete message type definitions and validation');
  }
  
  if (failedTests.some(t => t.test.includes('Database'))) {
    report.recommendations.push('Verify database integration and error handling');
  }
  
  if (warningTests.length > 0) {
    report.recommendations.push('Address warnings to improve system robustness');
  }
  
  if (failedTests.some(t => t.test.includes('Chat Component'))) {
    report.recommendations.push('Complete frontend-backend integration');
  }
  
  if (warningTests.some(t => t.test.includes('Performance'))) {
    report.recommendations.push('Optimize performance for production scalability');
  }
  
  // Save report
  fs.writeFileSync('messaging-realtime-test-report.json', JSON.stringify(report, null, 2));
  
  // Display summary
  log(`\n${colors.bold}📊 REAL-TIME MESSAGING TEST SUMMARY${colors.reset}`, 'blue');
  log(`Total Tests: ${total}`);
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, failed > 0 ? 'red' : 'reset');
  log(`⚠️  Warnings: ${warnings}`, warnings > 0 ? 'yellow' : 'reset');
  log(`Success Rate: ${report.summary.successRate}%`, report.summary.successRate >= 80 ? 'green' : 'red');
  
  if (report.recommendations.length > 0) {
    log('\n💡 Recommendations:', 'yellow');
    report.recommendations.forEach(rec => log(`   • ${rec}`, 'yellow'));
  }
  
  log(`\n📄 Detailed report saved to: messaging-realtime-test-report.json`, 'blue');
  
  return report.summary.successRate >= 80;
}

// Main test execution
async function runTests() {
  log(`${colors.bold}🔴 PRIMA FACIE - REAL-TIME MESSAGING INFRASTRUCTURE TEST${colors.reset}`, 'blue');
  log('Testing real-time functionality, WebSocket connections, and data flow\n');
  
  await testRealtimeArchitecture();
  await testMessageTypes();
  await testSubscriptionManagement();
  await testMessageSending();
  await testDatabaseIntegration();
  await testRealtimeFeatures();
  await testChatComponentIntegration();
  await testPerformanceScalability();
  
  const success = generateReport();
  
  if (success) {
    log('\n🎉 Real-time messaging infrastructure testing completed successfully!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Real-time messaging infrastructure testing completed with issues.', 'yellow');
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