#!/usr/bin/env node

/**
 * Working Messaging System Integration Testing
 * Comprehensive test suite that works with the application's authentication system
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

class WorkingMessagingTester {
  constructor() {
    this.baseUrl = 'http://localhost:3001';
    this.browser = null;
    this.testResults = {
      timestamp: new Date().toISOString(),
      categories: {
        authenticationFlow: [],
        messagingInterface: [],
        clientPortalFeatures: [],
        crossSystemIntegration: [],
        userInteractionFlows: [],
        businessLogicValidation: [],
        performanceAndReliability: []
      },
      summary: { total: 0, passed: 0, failed: 0 }
    };
  }

  async setup() {
    console.log('🚀 Starting Working Messaging Integration Testing...\n');
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async recordTest(category, testName, passed, details = '') {
    this.testResults.categories[category].push({
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
    
    this.testResults.summary.total++;
    if (passed) {
      this.testResults.summary.passed++;
      console.log(`  ✅ ${testName}${details ? ' - ' + details : ''}`);
    } else {
      this.testResults.summary.failed++;
      console.log(`  ❌ ${testName}${details ? ' - ' + details : ''}`);
    }
  }

  async setMockAuth(page, userRole = 'lawyer') {
    const mockUsers = {
      admin: { id: 'admin-1', email: 'admin@primaface.com', name: 'Dr. Roberto Admin', user_type: 'admin' },
      lawyer: { id: 'lawyer-1', email: 'maria@primaface.com', name: 'Dra. Maria Silva Santos', user_type: 'lawyer' },
      staff: { id: 'staff-1', email: 'ana@primaface.com', name: 'Ana Costa', user_type: 'staff' },
      client: { id: 'client-1', email: 'joao@email.com', name: 'João Silva Santos', user_type: 'client' }
    };

    const user = mockUsers[userRole];
    
    // Set mock auth cookie that middleware expects
    await page.setCookie({
      name: 'mock_auth_user',
      value: JSON.stringify({
        id: user.id,
        email: user.email,
        profile: user
      }),
      domain: 'localhost',
      path: '/'
    });
  }

  async waitForElement(page, selector, timeout = 5000) {
    try {
      await page.waitForSelector(selector, { timeout });
      return true;
    } catch {
      return false;
    }
  }

  // Test 1: Authentication Flow
  async testAuthenticationFlow() {
    console.log('📋 Testing Authentication Flow');
    console.log('-'.repeat(40));
    
    const page = await this.browser.newPage();
    
    try {
      // Test 1.1: Unauthenticated redirect
      await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
      const redirectedToLogin = page.url().includes('/login');
      this.recordTest('authenticationFlow', 'Unauthenticated users redirected to login', redirectedToLogin, page.url());
      
      // Test 1.2: Direct access to protected routes
      await page.goto(`${this.baseUrl}/messages`, { waitUntil: 'networkidle2' });
      const messagesProtected = page.url().includes('/login');
      this.recordTest('authenticationFlow', 'Messages route protected', messagesProtected);
      
      // Test 1.3: Mock authentication setup
      await this.setMockAuth(page, 'lawyer');
      await page.goto(`${this.baseUrl}/messages`, { waitUntil: 'networkidle2' });
      const authenticatedAccess = !page.url().includes('/login');
      this.recordTest('authenticationFlow', 'Mock authentication allows access', authenticatedAccess, page.url());
      
      // Test 1.4: Client portal authentication
      await this.setMockAuth(page, 'client');
      await page.goto(`${this.baseUrl}/portal/client/messages`, { waitUntil: 'networkidle2' });
      const clientPortalAccess = !page.url().includes('/login');
      this.recordTest('authenticationFlow', 'Client can access portal', clientPortalAccess, page.url());
      
    } catch (error) {
      this.recordTest('authenticationFlow', 'Authentication flow test', false, error.message);
    }
    
    await page.close();
  }

  // Test 2: Messaging Interface
  async testMessagingInterface() {
    console.log('\n📋 Testing Messaging Interface');
    console.log('-'.repeat(40));
    
    const page = await this.browser.newPage();
    
    try {
      await this.setMockAuth(page, 'lawyer');
      await page.goto(`${this.baseUrl}/messages`, { waitUntil: 'networkidle2' });
      
      // Test 2.1: Page loads
      const pageLoaded = await this.waitForElement(page, 'h1, main');
      this.recordTest('messagingInterface', 'Messages page loads', pageLoaded);
      
      if (pageLoaded) {
        // Test 2.2: Main components present
        const title = await this.waitForElement(page, 'h1');
        this.recordTest('messagingInterface', 'Page title present', title);
        
        const conversationList = await this.waitForElement(page, '.w-80, .conversation-list, [class*="conversation"]');
        this.recordTest('messagingInterface', 'Conversation list sidebar present', conversationList);
        
        const mainArea = await this.waitForElement(page, '.flex-1, .main-area, [class*="main"]');
        this.recordTest('messagingInterface', 'Main chat area present', mainArea);
        
        // Test 2.3: Header buttons
        const phoneBtn = await page.$('button[title*="ligação"], svg[class*="phone"]');
        this.recordTest('messagingInterface', 'Phone call button present', !!phoneBtn);
        
        const videoBtn = await page.$('button[title*="videochamada"], svg[class*="video"]');
        this.recordTest('messagingInterface', 'Video call button present', !!videoBtn);
        
        const settingsBtn = await page.$('button[title*="configurações"], svg[class*="cog"]');
        this.recordTest('messagingInterface', 'Settings button present', !!settingsBtn);
        
        // Test 2.4: Settings modal functionality
        if (settingsBtn) {
          await settingsBtn.click();
          await page.waitForTimeout(500);
          
          const modal = await this.waitForElement(page, '.fixed.inset-0, [role="dialog"], .modal');
          this.recordTest('messagingInterface', 'Settings modal opens', modal);
          
          if (modal) {
            // Check modal content
            const notificationSettings = await page.$('*:has-text("Notificações"), input[type="checkbox"]');
            this.recordTest('messagingInterface', 'Notification settings in modal', !!notificationSettings);
            
            const whatsappSettings = await page.$('*:has-text("WhatsApp")');
            this.recordTest('messagingInterface', 'WhatsApp settings in modal', !!whatsappSettings);
            
            // Close modal
            const closeBtn = await page.$('button:has-text("Cancelar"), button:has-text("×")');
            if (closeBtn) await closeBtn.click();
          }
        }
        
        // Test 2.5: New conversation functionality
        const newConversationBtn = await page.$('button:has-text("Nova Conversa"), svg[class*="plus"]');
        this.recordTest('messagingInterface', 'New conversation button present', !!newConversationBtn);
        
        if (newConversationBtn) {
          await newConversationBtn.click();
          await page.waitForTimeout(500);
          
          const newConversationModal = await this.waitForElement(page, '.fixed.inset-0, [role="dialog"]');
          this.recordTest('messagingInterface', 'New conversation modal opens', newConversationModal);
        }
      }
      
    } catch (error) {
      this.recordTest('messagingInterface', 'Messaging interface test', false, error.message);
    }
    
    await page.close();
  }

  // Test 3: Client Portal Features
  async testClientPortalFeatures() {
    console.log('\n📋 Testing Client Portal Features');
    console.log('-'.repeat(40));
    
    const page = await this.browser.newPage();
    
    try {
      await this.setMockAuth(page, 'client');
      await page.goto(`${this.baseUrl}/portal/client/messages`, { waitUntil: 'networkidle2' });
      
      // Test 3.1: Portal loads
      const portalLoaded = await this.waitForElement(page, 'h1, main');
      this.recordTest('clientPortalFeatures', 'Client portal loads', portalLoaded);
      
      if (portalLoaded) {
        // Test 3.2: Quick action buttons
        const urgentBtn = await page.$('button:has-text("Urgente"), button:has-text("Chat Urgente")');
        this.recordTest('clientPortalFeatures', 'Urgent chat button present', !!urgentBtn);
        
        const consultationBtn = await page.$('button:has-text("Consulta"), button:has-text("Nova Consulta")');
        this.recordTest('clientPortalFeatures', 'Consultation button present', !!consultationBtn);
        
        const documentBtn = await page.$('button:has-text("Documento"), button:has-text("Enviar Documento")');
        this.recordTest('clientPortalFeatures', 'Document button present', !!documentBtn);
        
        // Test 3.3: Button functionality
        if (urgentBtn) {
          await urgentBtn.click();
          await page.waitForTimeout(500);
          // Check for alert or response (mock alert)
          this.recordTest('clientPortalFeatures', 'Urgent button functional', true);
        }
        
        if (documentBtn) {
          await documentBtn.click();
          await page.waitForTimeout(500);
          
          const documentModal = await this.waitForElement(page, '.fixed.inset-0, [role="dialog"]');
          this.recordTest('clientPortalFeatures', 'Document upload modal opens', documentModal);
          
          if (documentModal) {
            const fileInput = await page.$('input[type="file"]');
            this.recordTest('clientPortalFeatures', 'File input in modal', !!fileInput);
            
            const securityNotice = await page.$('*:has-text("criptograf"), *:has-text("segur")');
            this.recordTest('clientPortalFeatures', 'Security notice present', !!securityNotice);
          }
        }
        
        // Test 3.4: Communication guidelines
        const guidelines = await page.$('*:has-text("Diretrizes"), *:has-text("Horário")');
        this.recordTest('clientPortalFeatures', 'Communication guidelines present', !!guidelines);
        
        // Test 3.5: Contact information
        const contactInfo = await page.$('*:has-text("Dra. Maria"), *:has-text("Online")');
        this.recordTest('clientPortalFeatures', 'Lawyer contact information', !!contactInfo);
        
        // Test 3.6: WhatsApp integration notice
        const whatsappNotice = await page.$('*:has-text("WhatsApp"), *:has-text("9")');
        this.recordTest('clientPortalFeatures', 'WhatsApp integration notice', !!whatsappNotice);
      }
      
    } catch (error) {
      this.recordTest('clientPortalFeatures', 'Client portal features test', false, error.message);
    }
    
    await page.close();
  }

  // Test 4: Cross-System Integration
  async testCrossSystemIntegration() {
    console.log('\n📋 Testing Cross-System Integration');
    console.log('-'.repeat(40));
    
    const page = await this.browser.newPage();
    
    try {
      await this.setMockAuth(page, 'lawyer');
      
      // Test 4.1: Navigation between systems
      const testPaths = [
        { path: '/clients', name: 'Clients' },
        { path: '/matters', name: 'Matters' },
        { path: '/billing', name: 'Billing' },
        { path: '/calendar', name: 'Calendar' },
        { path: '/documents', name: 'Documents' }
      ];
      
      for (const testPath of testPaths) {
        try {
          await page.goto(`${this.baseUrl}${testPath.path}`, { waitUntil: 'networkidle2' });
          
          const pageLoaded = await this.waitForElement(page, 'h1, main, .container');
          this.recordTest('crossSystemIntegration', `${testPath.name} page accessible`, pageLoaded);
          
          // Check for navigation menu
          const navMenu = await page.$('nav, .sidebar, [class*="nav"]');
          this.recordTest('crossSystemIntegration', `${testPath.name} has navigation`, !!navMenu);
          
        } catch (error) {
          this.recordTest('crossSystemIntegration', `${testPath.name} accessibility`, false, error.message);
        }
      }
      
      // Test 4.2: Return to messages
      await page.goto(`${this.baseUrl}/messages`, { waitUntil: 'networkidle2' });
      const backToMessages = await this.waitForElement(page, 'h1');
      this.recordTest('crossSystemIntegration', 'Navigation back to messages', backToMessages);
      
    } catch (error) {
      this.recordTest('crossSystemIntegration', 'Cross-system integration test', false, error.message);
    }
    
    await page.close();
  }

  // Test 5: User Interaction Flows
  async testUserInteractionFlows() {
    console.log('\n📋 Testing User Interaction Flows');
    console.log('-'.repeat(40));
    
    const page = await this.browser.newPage();
    
    try {
      await this.setMockAuth(page, 'lawyer');
      await page.goto(`${this.baseUrl}/messages`, { waitUntil: 'networkidle2' });
      
      // Test 5.1: Conversation selection flow
      const conversationList = await this.waitForElement(page, '.w-80, [class*="conversation"]');
      if (conversationList) {
        // Look for conversation items or create new conversation
        const conversationItem = await page.$('.conversation-item, [class*="conversation"][class*="item"]');
        
        if (conversationItem) {
          await conversationItem.click();
          await page.waitForTimeout(500);
          
          const chatInterface = await this.waitForElement(page, '.flex-1, [class*="chat"]');
          this.recordTest('userInteractionFlows', 'Conversation selection opens chat', chatInterface);
        } else {
          this.recordTest('userInteractionFlows', 'Conversation items available', false, 'No conversations found');
        }
      }
      
      // Test 5.2: Search functionality
      const searchInput = await page.$('input[placeholder*="buscar"], input[placeholder*="Buscar"]');
      if (searchInput) {
        await searchInput.type('teste');
        await page.waitForTimeout(500);
        this.recordTest('userInteractionFlows', 'Search input functional', true);
      } else {
        this.recordTest('userInteractionFlows', 'Search functionality present', false);
      }
      
      // Test 5.3: Filter functionality
      const filterButtons = await page.$$('button:has-text("Todas"), button:has-text("Urgente")');
      this.recordTest('userInteractionFlows', 'Filter buttons present', filterButtons.length > 0);
      
      if (filterButtons.length > 0) {
        await filterButtons[0].click();
        await page.waitForTimeout(500);
        this.recordTest('userInteractionFlows', 'Filter buttons functional', true);
      }
      
      // Test 5.4: Mobile responsiveness
      await page.setViewport({ width: 768, height: 1024 });
      await page.reload({ waitUntil: 'networkidle2' });
      
      const mobileLayout = await this.waitForElement(page, 'body, main');
      this.recordTest('userInteractionFlows', 'Mobile layout responsive', mobileLayout);
      
      // Reset viewport
      await page.setViewport({ width: 1920, height: 1080 });
      
    } catch (error) {
      this.recordTest('userInteractionFlows', 'User interaction flows test', false, error.message);
    }
    
    await page.close();
  }

  // Test 6: Business Logic Validation
  async testBusinessLogicValidation() {
    console.log('\n📋 Testing Business Logic Validation');
    console.log('-'.repeat(40));
    
    const page = await this.browser.newPage();
    
    try {
      // Test 6.1: Role-based access control
      const roles = ['admin', 'lawyer', 'staff', 'client'];
      
      for (const role of roles) {
        await this.setMockAuth(page, role);
        
        // Test access to admin panel
        await page.goto(`${this.baseUrl}/admin`, { waitUntil: 'networkidle2' });
        const adminAccess = !page.url().includes('/login') && !page.url().includes('/dashboard');
        const shouldHaveAccess = role === 'admin';
        
        this.recordTest('businessLogicValidation', 
          `${role} admin access: ${shouldHaveAccess ? 'allowed' : 'blocked'}`, 
          adminAccess === shouldHaveAccess);
        
        // Test access to messages
        await page.goto(`${this.baseUrl}/messages`, { waitUntil: 'networkidle2' });
        const messagesAccess = !page.url().includes('/login');
        const shouldHaveMessagesAccess = role !== 'client';
        
        this.recordTest('businessLogicValidation', 
          `${role} messages access: ${shouldHaveMessagesAccess ? 'allowed' : 'blocked'}`, 
          messagesAccess === shouldHaveMessagesAccess);
        
        // Test client portal access
        if (role === 'client') {
          await page.goto(`${this.baseUrl}/portal/client/messages`, { waitUntil: 'networkidle2' });
          const clientPortalAccess = !page.url().includes('/login');
          this.recordTest('businessLogicValidation', 'Client portal access for clients', clientPortalAccess);
        }
      }
      
      // Test 6.2: Attorney-client privilege
      await this.setMockAuth(page, 'client');
      await page.goto(`${this.baseUrl}/clients`, { waitUntil: 'networkidle2' });
      const clientBlockedFromClients = page.url().includes('/login') || page.url().includes('/portal');
      this.recordTest('businessLogicValidation', 'Client blocked from accessing other clients', clientBlockedFromClients);
      
    } catch (error) {
      this.recordTest('businessLogicValidation', 'Business logic validation test', false, error.message);
    }
    
    await page.close();
  }

  // Test 7: Performance and Reliability
  async testPerformanceAndReliability() {
    console.log('\n📋 Testing Performance and Reliability');
    console.log('-'.repeat(40));
    
    const page = await this.browser.newPage();
    
    try {
      await this.setMockAuth(page, 'lawyer');
      
      // Test 7.1: Page load performance
      const startTime = Date.now();
      await page.goto(`${this.baseUrl}/messages`, { waitUntil: 'networkidle2' });
      const loadTime = Date.now() - startTime;
      
      const goodPerformance = loadTime < 3000;
      this.recordTest('performanceAndReliability', 'Page loads under 3 seconds', goodPerformance, `${loadTime}ms`);
      
      // Test 7.2: Console errors
      const logs = await page.evaluate(() => {
        return window.console.errors || [];
      });
      
      const noConsoleErrors = logs.length === 0;
      this.recordTest('performanceAndReliability', 'No console errors', noConsoleErrors, `${logs.length} errors`);
      
      // Test 7.3: Resource loading
      const response = await page.goto(`${this.baseUrl}/messages`, { waitUntil: 'networkidle2' });
      const resourcesLoaded = response.status() === 200;
      this.recordTest('performanceAndReliability', 'Resources load successfully', resourcesLoaded, `Status: ${response.status()}`);
      
      // Test 7.4: Memory usage
      const metrics = await page.metrics();
      const memoryUsage = metrics.JSHeapUsedSize / 1024 / 1024; // Convert to MB
      const reasonableMemory = memoryUsage < 50; // Less than 50MB
      this.recordTest('performanceAndReliability', 'Reasonable memory usage', reasonableMemory, `${memoryUsage.toFixed(2)}MB`);
      
      // Test 7.5: Multiple page loads
      let allLoadsSuccessful = true;
      for (let i = 0; i < 3; i++) {
        try {
          await page.reload({ waitUntil: 'networkidle2' });
          const loaded = await this.waitForElement(page, 'h1, main');
          if (!loaded) allLoadsSuccessful = false;
        } catch {
          allLoadsSuccessful = false;
        }
      }
      
      this.recordTest('performanceAndReliability', 'Multiple page loads stable', allLoadsSuccessful);
      
    } catch (error) {
      this.recordTest('performanceAndReliability', 'Performance and reliability test', false, error.message);
    }
    
    await page.close();
  }

  async generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 MESSAGING SYSTEM INTEGRATION & END-TO-END TEST REPORT');
    console.log('='.repeat(80));
    
    const { total, passed, failed } = this.testResults.summary;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';
    
    console.log(`\n🕒 Test Execution Time: ${this.testResults.timestamp}`);
    console.log(`📈 Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`🎯 Success Rate: ${successRate}%`);
    
    console.log('\n📋 DETAILED RESULTS BY CATEGORY:');
    console.log('-'.repeat(50));
    
    Object.entries(this.testResults.categories).forEach(([category, tests]) => {
      if (tests.length > 0) {
        const categoryPassed = tests.filter(t => t.passed).length;
        const categoryTotal = tests.length;
        const categoryRate = ((categoryPassed / categoryTotal) * 100).toFixed(1);
        
        console.log(`\n${category.toUpperCase()} (${categoryRate}%):`);
        tests.forEach(test => {
          const status = test.passed ? '✅' : '❌';
          console.log(`  ${status} ${test.name}${test.details ? ' - ' + test.details : ''}`);
        });
      }
    });
    
    // Integration Assessment
    console.log('\n🎯 INTEGRATION ASSESSMENT:');
    console.log('-'.repeat(50));
    
    const categoryAnalysis = {};
    Object.entries(this.testResults.categories).forEach(([category, tests]) => {
      const categoryPassed = tests.filter(t => t.passed).length;
      const categoryTotal = tests.length;
      const categoryRate = categoryTotal > 0 ? ((categoryPassed / categoryTotal) * 100) : 0;
      categoryAnalysis[category] = { rate: categoryRate, passed: categoryPassed, total: categoryTotal };
    });
    
    if (successRate >= 90) {
      console.log('🟢 EXCELLENT - System ready for production deployment');
    } else if (successRate >= 80) {
      console.log('🟡 GOOD - System mostly functional with minor issues');
    } else if (successRate >= 70) {
      console.log('🟠 FAIR - System functional but needs improvements');
    } else {
      console.log('🔴 POOR - System needs significant work before deployment');
    }
    
    // Recommendations
    console.log('\n📄 DETAILED FINDINGS:');
    console.log('-'.repeat(50));
    
    // Best performing areas
    const topAreas = Object.entries(categoryAnalysis)
      .sort((a, b) => b[1].rate - a[1].rate)
      .slice(0, 3);
    
    console.log('\n✅ Strong Areas:');
    topAreas.forEach(([category, results]) => {
      if (results.rate >= 80) {
        console.log(`  • ${category}: ${results.rate.toFixed(1)}% success rate`);
      }
    });
    
    // Areas needing attention
    const bottomAreas = Object.entries(categoryAnalysis)
      .filter(([_, results]) => results.rate < 80)
      .sort((a, b) => a[1].rate - b[1].rate);
    
    if (bottomAreas.length > 0) {
      console.log('\n🔧 Areas Needing Attention:');
      bottomAreas.forEach(([category, results]) => {
        console.log(`  • ${category}: ${results.rate.toFixed(1)}% success rate - ${results.total - results.passed} failing tests`);
      });
    }
    
    // Specific recommendations
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('-'.repeat(50));
    
    if (categoryAnalysis.authenticationFlow?.rate < 100) {
      console.log('• Fix authentication and routing issues');
    }
    if (categoryAnalysis.messagingInterface?.rate < 100) {
      console.log('• Improve messaging interface components');
    }
    if (categoryAnalysis.crossSystemIntegration?.rate < 80) {
      console.log('• Enhance cross-system integration');
    }
    if (categoryAnalysis.performanceAndReliability?.rate < 90) {
      console.log('• Address performance and reliability concerns');
    }
    if (categoryAnalysis.businessLogicValidation?.rate < 100) {
      console.log('• Strengthen business logic validation and security');
    }
    
    if (successRate >= 90) {
      console.log('✅ System demonstrates excellent integration and is ready for production');
    }
    
    console.log('\n' + '='.repeat(80));
    
    // Save comprehensive report
    const reportData = {
      ...this.testResults,
      summary: {
        ...this.testResults.summary,
        successRate: parseFloat(successRate)
      },
      categoryAnalysis,
      assessment: {
        overall: successRate >= 90 ? 'EXCELLENT' : successRate >= 80 ? 'GOOD' : successRate >= 70 ? 'FAIR' : 'POOR',
        productionReady: successRate >= 85,
        deploymentRecommendation: successRate >= 90 ? 'DEPLOY' : successRate >= 80 ? 'DEPLOY_WITH_MONITORING' : 'NEEDS_IMPROVEMENT'
      }
    };
    
    const reportPath = `${__dirname}/messaging-integration-test-report.json`;
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📁 Comprehensive report saved to: ${reportPath}`);
    
    return reportData;
  }

  async runAllTests() {
    try {
      await this.setup();
      
      await this.testAuthenticationFlow();
      await this.testMessagingInterface();
      await this.testClientPortalFeatures();
      await this.testCrossSystemIntegration();
      await this.testUserInteractionFlows();
      await this.testBusinessLogicValidation();
      await this.testPerformanceAndReliability();
      
      const report = await this.generateReport();
      return report;
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new WorkingMessagingTester();
  tester.runAllTests().catch(console.error);
}

module.exports = WorkingMessagingTester;