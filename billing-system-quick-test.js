// =====================================================
// QUICK BILLING SYSTEM TEST
// Target: http://localhost:3001
// =====================================================

const puppeteer = require('puppeteer')

class QuickBillingTest {
  constructor() {
    this.baseUrl = 'http://localhost:3001'
    this.results = {}
  }
  
  async runQuickTest() {
    console.log('🧪 BILLING SYSTEM TESTING AGENT - Quick Test')
    console.log('🎯 Target:', this.baseUrl)
    console.log('💰 Focus: Core billing functionality validation')
    console.log('=' .repeat(60))
    
    let browser
    try {
      browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: { width: 1920, height: 1080 }
      })
      
      const page = await browser.newPage()
      
      // Test 1: Billing Dashboard Access
      console.log('\n🔍 Testing Billing Dashboard...')
      await page.goto(`${this.baseUrl}/billing`, { waitUntil: 'networkidle0', timeout: 15000 })
      
      const dashboardTitle = await page.$eval('h1', el => el.textContent).catch(() => '')
      const hasFinancialCards = await page.$$('.bg-white.overflow-hidden.shadow.rounded-lg')
      const hasQuickActions = await page.$$('.bg-white.p-6.rounded-lg.shadow')
      
      this.results.billingDashboard = {
        accessible: dashboardTitle.includes('Faturamento'),
        financialCards: hasFinancialCards.length >= 3,
        quickActions: hasQuickActions.length >= 4
      }
      
      console.log('   ✅ Dashboard accessible:', this.results.billingDashboard.accessible)
      console.log('   💰 Financial cards:', this.results.billingDashboard.financialCards)
      console.log('   🚀 Quick actions:', this.results.billingDashboard.quickActions)
      
      // Test 2: Invoice Management
      console.log('\n🔍 Testing Invoice Management...')
      await page.goto(`${this.baseUrl}/billing/invoices`, { waitUntil: 'networkidle0', timeout: 15000 })
      
      const invoiceTitle = await page.$eval('h1', el => el.textContent).catch(() => '')
      const hasInvoiceStats = await page.$$('.text-2xl.font-bold')
      const hasRevenueBreakdown = await page.$('.bg-blue-50, .bg-green-50, .bg-purple-50')
      
      this.results.invoiceManagement = {
        accessible: invoiceTitle.includes('Faturas') || invoiceTitle.includes('Invoice'),
        statistics: hasInvoiceStats.length >= 3,
        revenueBreakdown: !!hasRevenueBreakdown
      }
      
      console.log('   ✅ Invoice page accessible:', this.results.invoiceManagement.accessible)
      console.log('   📊 Invoice statistics:', this.results.invoiceManagement.statistics)
      console.log('   💹 Revenue breakdown:', this.results.invoiceManagement.revenueBreakdown)
      
      // Test 3: Time Tracking
      console.log('\n🔍 Testing Time Tracking...')
      await page.goto(`${this.baseUrl}/billing/time-tracking`, { waitUntil: 'networkidle0', timeout: 15000 })
      
      const timeTitle = await page.$eval('h1', el => el.textContent).catch(() => '')
      const hasTimeControls = await page.$$('button, .btn')
      const hasTimeInterface = await page.$('.container')
      
      this.results.timeTracking = {
        accessible: timeTitle.includes('Tempo') || timeTitle.includes('Time'),
        interface: !!hasTimeInterface,
        controls: hasTimeControls.length >= 2
      }
      
      console.log('   ✅ Time tracking accessible:', this.results.timeTracking.accessible)
      console.log('   🎛️ Time interface:', this.results.timeTracking.interface)
      console.log('   ⏱️ Timer controls:', this.results.timeTracking.controls)
      
      // Test 4: Financial Dashboard
      console.log('\n🔍 Testing Financial Dashboard...')
      await page.goto(`${this.baseUrl}/billing/financial-dashboard`, { waitUntil: 'networkidle0', timeout: 15000 })
      
      const financialTitle = await page.$eval('h1', el => el.textContent).catch(() => '')
      const hasFinancialMetrics = await page.$$('.text-xl.font-bold, .text-2xl.font-bold')
      const hasTabs = await page.$('.tabs, [role="tablist"]')
      
      this.results.financialDashboard = {
        accessible: financialTitle.includes('Financeiro') || financialTitle.includes('Financial'),
        metrics: hasFinancialMetrics.length >= 3,
        tabInterface: !!hasTabs
      }
      
      console.log('   ✅ Financial dashboard accessible:', this.results.financialDashboard.accessible)
      console.log('   📈 Financial metrics:', this.results.financialDashboard.metrics)
      console.log('   📋 Tab interface:', this.results.financialDashboard.tabInterface)
      
      // Test 5: Subscription Management
      console.log('\n🔍 Testing Subscription Management...')
      await page.goto(`${this.baseUrl}/admin/subscription-plans`, { waitUntil: 'networkidle0', timeout: 15000 })
      
      const subscriptionTitle = await page.$eval('h1', el => el.textContent).catch(() => '')
      const hasSubscriptionCards = await page.$$('.bg-white.rounded-lg.shadow, .card')
      const hasManagementButtons = await page.$$('button')
      
      this.results.subscriptionManagement = {
        accessible: subscriptionTitle.includes('Planos') || subscriptionTitle.includes('Subscription'),
        planCards: hasSubscriptionCards.length >= 1,
        managementControls: hasManagementButtons.length >= 2
      }
      
      console.log('   ✅ Subscription plans accessible:', this.results.subscriptionManagement.accessible)
      console.log('   📦 Plan cards:', this.results.subscriptionManagement.planCards)
      console.log('   ⚙️ Management controls:', this.results.subscriptionManagement.managementControls)
      
      // Generate summary
      this.generateSummary()
      
    } catch (error) {
      console.error('❌ Test execution failed:', error.message)
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }
  
  generateSummary() {
    console.log('\n' + '='.repeat(60))
    console.log('💰 BILLING SYSTEM TEST SUMMARY')
    console.log('='.repeat(60))
    
    let totalTests = 0
    let passedTests = 0
    
    for (const [suite, results] of Object.entries(this.results)) {
      console.log(`\n📋 ${suite}:`)
      for (const [test, passed] of Object.entries(results)) {
        console.log(`   ${passed ? '✅' : '❌'} ${test}: ${passed}`)
        totalTests++
        if (passed) passedTests++
      }
    }
    
    const successRate = Math.round((passedTests / totalTests) * 100)
    
    console.log(`\n📊 OVERALL RESULTS:`)
    console.log(`   • Total Tests: ${totalTests}`)
    console.log(`   • Passed: ${passedTests}`)
    console.log(`   • Failed: ${totalTests - passedTests}`)
    console.log(`   • Success Rate: ${successRate}%`)
    
    console.log(`\n🎯 BILLING SYSTEM STATUS:`)
    if (successRate >= 90) {
      console.log('   🟢 EXCELLENT - Billing system is fully operational')
    } else if (successRate >= 75) {
      console.log('   🟡 GOOD - Billing system is mostly functional with minor issues')
    } else if (successRate >= 50) {
      console.log('   🟠 FAIR - Billing system has significant functionality gaps')
    } else {
      console.log('   🔴 POOR - Billing system requires major fixes')
    }
    
    console.log('\n' + '='.repeat(60))
  }
}

// Run the test
async function runTest() {
  const test = new QuickBillingTest()
  await test.runQuickTest()
}

runTest().catch(console.error)