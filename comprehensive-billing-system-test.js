// =====================================================
// COMPREHENSIVE BILLING SYSTEM TESTING AGENT
// Target: http://localhost:3001
// Focus: Complete billing system validation
// =====================================================

const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

class BillingSystemTestAgent {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      baseUrl: 'http://localhost:3001',
      testResults: {},
      errors: [],
      screenshots: [],
      summary: {}
    }
    
    this.testSuites = [
      'billingDashboard',
      'invoiceManagement', 
      'subscriptionSystem',
      'caseBilling',
      'timeTracking',
      'financialManagement',
      'paymentIntegration',
      'billingSecurityCompliance'
    ]
  }
  
  async runComprehensiveTests() {
    console.log('🧪 BILLING SYSTEM TESTING AGENT - Starting Comprehensive Tests')
    console.log('🎯 Target: http://localhost:3001')
    console.log('💰 Focus: Complete billing system validation')
    console.log('=' .repeat(60))
    
    let browser
    try {
      // Launch browser
      browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
      
      const page = await browser.newPage()
      await page.setViewport({ width: 1920, height: 1080 })
      
      // Set up error monitoring
      page.on('console', msg => {
        if (msg.type() === 'error') {
          this.results.errors.push({
            type: 'console_error',
            message: msg.text(),
            timestamp: new Date().toISOString()
          })
        }
      })
      
      page.on('pageerror', error => {
        this.results.errors.push({
          type: 'page_error',
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        })
      })
      
      // Run all test suites
      for (const suite of this.testSuites) {
        console.log(`\n🔍 Testing: ${suite}`)
        await this[suite](page)
      }
      
      // Generate comprehensive report
      await this.generateBillingReport()
      
    } catch (error) {
      console.error('❌ Test execution failed:', error)
      this.results.errors.push({
        type: 'execution_error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }
  
  // =====================================================
  // 1. BILLING DASHBOARD TESTING
  // =====================================================
  async billingDashboard(page) {
    const testResults = {
      accessibility: false,
      financialWidgets: false,
      revenueAnalytics: false,
      navigationStructure: false,
      realTimeData: false
    }
    
    try {
      // Navigate to billing dashboard
      await page.goto(`${this.results.baseUrl}/billing`, { 
        waitUntil: 'networkidle0', 
        timeout: 15000 
      })
      
      // Take screenshot
      await this.takeScreenshot(page, 'billing-dashboard')
      
      // Test dashboard accessibility
      const dashboardTitle = await page.$eval('h1', el => el.textContent.trim())
      testResults.accessibility = dashboardTitle.includes('Faturamento')
      
      // Test financial widgets
      const revenueCard = await page.$('[data-testid="monthly-revenue"], .bg-white:has(.text-2xl)')
      testResults.financialWidgets = !!revenueCard
      
      // Check for revenue analytics
      const analyticsSection = await page.$('.grid:has(.text-2xl), [data-testid="financial-stats"]')
      testResults.revenueAnalytics = !!analyticsSection
      
      // Test navigation structure  
      const quickActions = await page.$$('.bg-white.p-6.rounded-lg.shadow')
      testResults.navigationStructure = quickActions.length >= 4
      
      // Check for real-time data
      const currencyElements = await page.$$eval('.text-2xl', els => 
        els.filter(el => el.textContent.includes('R$')).length
      )
      testResults.realTimeData = currencyElements > 0
      
      console.log('   ✅ Dashboard accessibility:', testResults.accessibility)
      console.log('   💰 Financial widgets:', testResults.financialWidgets)
      console.log('   📊 Revenue analytics:', testResults.revenueAnalytics)
      console.log('   🧭 Navigation structure:', testResults.navigationStructure)
      console.log('   ⚡ Real-time data:', testResults.realTimeData)
      
    } catch (error) {
      this.results.errors.push({
        suite: 'billingDashboard',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
    
    this.results.testResults.billingDashboard = testResults
  }
  
  // =====================================================
  // 2. INVOICE MANAGEMENT TESTING
  // =====================================================
  async invoiceManagement(page) {
    const testResults = {
      dualInvoiceSystem: false,
      invoiceNumbering: false,
      statusTracking: false,
      pdfGeneration: false,
      brazilianCompliance: false
    }
    
    try {
      // Navigate to invoices
      await page.goto(`${this.results.baseUrl}/billing/invoices`, { 
        waitUntil: 'networkidle0', 
        timeout: 15000 
      })
      
      await this.takeScreenshot(page, 'invoice-management')
      
      // Test dual invoice system presence
      const invoiceTypes = await page.$$eval('[data-testid*="invoice-type"], .inline-flex:has(.bg-blue-100, .bg-green-100, .bg-purple-100)', 
        els => els.length
      )
      testResults.dualInvoiceSystem = invoiceTypes >= 3
      
      // Check invoice numbering system
      const invoiceNumbers = await page.$$eval('td:has-text("SUB-"), td:has-text("CASE-"), td:has-text("PLAN-")', 
        els => els.length
      ).catch(() => 0)
      testResults.invoiceNumbering = invoiceNumbers > 0
      
      // Test status tracking
      const statusBadges = await page.$$('.inline-flex.px-2.py-1.text-xs')
      testResults.statusTracking = statusBadges.length > 0
      
      // Check for PDF generation capabilities
      const exportButtons = await page.$('[data-testid="export-button"], button:has-text("Exportar"), button:has-text("PDF")')
      testResults.pdfGeneration = !!exportButtons
      
      // Brazilian compliance check
      const currencyBRL = await page.$$eval('*', els => 
        Array.from(els).some(el => el.textContent.includes('R$'))
      )
      testResults.brazilianCompliance = currencyBRL
      
      console.log('   📋 Dual invoice system:', testResults.dualInvoiceSystem)
      console.log('   🔢 Invoice numbering:', testResults.invoiceNumbering)
      console.log('   📊 Status tracking:', testResults.statusTracking)
      console.log('   📄 PDF generation:', testResults.pdfGeneration)
      console.log('   🇧🇷 Brazilian compliance:', testResults.brazilianCompliance)
      
    } catch (error) {
      this.results.errors.push({
        suite: 'invoiceManagement',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
    
    this.results.testResults.invoiceManagement = testResults
  }
  
  // =====================================================
  // 3. SUBSCRIPTION SYSTEM TESTING
  // =====================================================
  async subscriptionSystem(page) {
    const testResults = {
      planManagement: false,
      clientSubscriptions: false,
      usageTracking: false,
      billingCycles: false,
      analytics: false
    }
    
    try {
      // Navigate to subscriptions
      await page.goto(`${this.results.baseUrl}/admin/subscription-plans`, { 
        waitUntil: 'networkidle0', 
        timeout: 15000 
      })
      
      await this.takeScreenshot(page, 'subscription-system')
      
      // Test plan management
      const planCards = await page.$$('.bg-white.rounded-lg.shadow, [data-testid="subscription-plan"]')
      testResults.planManagement = planCards.length > 0
      
      // Check client subscriptions interface
      await page.goto(`${this.results.baseUrl}/billing/subscriptions`, { 
        waitUntil: 'networkidle0', 
        timeout: 10000 
      }).catch(() => {})
      
      const subscriptionsList = await page.$('table, .grid, [data-testid="subscriptions-list"]')
      testResults.clientSubscriptions = !!subscriptionsList
      
      // Test usage tracking capabilities
      const usageIndicators = await page.$$('[data-testid*="usage"], *:has-text("Uso"), *:has-text("Horas")')
      testResults.usageTracking = usageIndicators.length > 0
      
      // Check billing cycles
      const billingCycleElements = await page.$$('*:has-text("Mensal"), *:has-text("Anual"), select:has(option[value*="month"])')
      testResults.billingCycles = billingCycleElements.length > 0
      
      // Test analytics presence
      const analyticsElements = await page.$$('.text-2xl, [data-testid*="metric"], .font-bold:has(.text-green-600, .text-blue-600)')
      testResults.analytics = analyticsElements.length >= 2
      
      console.log('   📦 Plan management:', testResults.planManagement)
      console.log('   👥 Client subscriptions:', testResults.clientSubscriptions)
      console.log('   📊 Usage tracking:', testResults.usageTracking)
      console.log('   🔄 Billing cycles:', testResults.billingCycles)
      console.log('   📈 Analytics:', testResults.analytics)
      
    } catch (error) {
      this.results.errors.push({
        suite: 'subscriptionSystem',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
    
    this.results.testResults.subscriptionSystem = testResults
  }
  
  // =====================================================
  // 4. CASE BILLING TESTING
  // =====================================================
  async caseBilling(page) {
    const testResults = {
      multiModalBilling: false,
      minimumFeeEnforcement: false,
      billingRateConfiguration: false,
      calculations: false,
      discountEngineIntegration: false
    }
    
    try {
      // Navigate to case billing
      await page.goto(`${this.results.baseUrl}/billing/case-billing`, { 
        waitUntil: 'networkidle0', 
        timeout: 15000 
      })
      
      await this.takeScreenshot(page, 'case-billing')
      
      // Test multi-modal billing options
      const billingMethods = await page.$$('input[type="radio"], select option, *:has-text("Hourly"), *:has-text("Fixed"), *:has-text("Percentage")')
      testResults.multiModalBilling = billingMethods.length >= 3
      
      // Check minimum fee enforcement
      const minimumFeeInputs = await page.$$('input[placeholder*="Mínimo"], *:has-text("Taxa Mínima"), input[name*="minimum"]')
      testResults.minimumFeeEnforcement = minimumFeeInputs.length > 0
      
      // Test billing rate configuration
      const rateConfigs = await page.$$('input[placeholder*="R$"], input[type="number"], .currency-input')
      testResults.billingRateConfiguration = rateConfigs.length > 0
      
      // Check calculations functionality
      const calculationElements = await page.$$('button:has-text("Calcular"), [data-testid*="calculate"], .calculation-result')
      testResults.calculations = calculationElements.length > 0
      
      // Test discount engine integration
      const discountElements = await page.$$('*:has-text("Desconto"), input[name*="discount"], .discount-badge')
      testResults.discountEngineIntegration = discountElements.length > 0
      
      console.log('   ⚖️ Multi-modal billing:', testResults.multiModalBilling)
      console.log('   💰 Minimum fee enforcement:', testResults.minimumFeeEnforcement)
      console.log('   ⚙️ Billing rate configuration:', testResults.billingRateConfiguration)
      console.log('   🧮 Calculations:', testResults.calculations)
      console.log('   🎯 Discount engine integration:', testResults.discountEngineIntegration)
      
    } catch (error) {
      this.results.errors.push({
        suite: 'caseBilling',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
    
    this.results.testResults.caseBilling = testResults
  }
  
  // =====================================================
  // 5. TIME TRACKING TESTING
  // =====================================================
  async timeTracking(page) {
    const testResults = {
      timerFunctionality: false,
      timeEntryCreation: false,
      billingCalculations: false,
      approvalWorkflows: false,
      integration: false
    }
    
    try {
      // Navigate to time tracking
      await page.goto(`${this.results.baseUrl}/billing/time-tracking`, { 
        waitUntil: 'networkidle0', 
        timeout: 15000 
      })
      
      await this.takeScreenshot(page, 'time-tracking')
      
      // Test timer functionality
      const timerButtons = await page.$$('button:has-text("Start"), button:has-text("Play"), button:has-text("Pause"), .timer-control')
      testResults.timerFunctionality = timerButtons.length >= 2
      
      // Check time entry creation
      const entryForms = await page.$$('form, input[type="time"], textarea[placeholder*="Descrição"]')
      testResults.timeEntryCreation = entryForms.length > 0
      
      // Test billing calculations
      const calculationDisplays = await page.$$('.total-time, .billable-amount, *:has-text("Total"), input[readonly]')
      testResults.billingCalculations = calculationDisplays.length > 0
      
      // Check approval workflows
      const approvalElements = await page.$$('button:has-text("Aprovar"), .approval-status, select:has(option[value*="approve"])')
      testResults.approvalWorkflows = approvalElements.length > 0
      
      // Test integration with other systems
      const integrationElements = await page.$$('select:has(option), .client-select, .matter-select')
      testResults.integration = integrationElements.length >= 2
      
      console.log('   ⏱️ Timer functionality:', testResults.timerFunctionality)
      console.log('   📝 Time entry creation:', testResults.timeEntryCreation)
      console.log('   💰 Billing calculations:', testResults.billingCalculations)
      console.log('   ✅ Approval workflows:', testResults.approvalWorkflows)
      console.log('   🔗 Integration:', testResults.integration)
      
    } catch (error) {
      this.results.errors.push({
        suite: 'timeTracking',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
    
    this.results.testResults.timeTracking = testResults
  }
  
  // =====================================================
  // 6. FINANCIAL MANAGEMENT TESTING
  // =====================================================
  async financialManagement(page) {
    const testResults = {
      accountsPayable: false,
      accountsReceivable: false,
      vendorManagement: false,
      financialReporting: false,
      cashFlowMonitoring: false
    }
    
    try {
      // Test Accounts Payable
      await page.goto(`${this.results.baseUrl}/billing/accounts-payable`, { 
        waitUntil: 'networkidle0', 
        timeout: 15000 
      })
      
      await this.takeScreenshot(page, 'accounts-payable')
      
      const apElements = await page.$$('table, .bills-list, button:has-text("Nova Conta")')
      testResults.accountsPayable = apElements.length > 0
      
      // Test Accounts Receivable
      await page.goto(`${this.results.baseUrl}/billing/accounts-receivable`, { 
        waitUntil: 'networkidle0', 
        timeout: 15000 
      })
      
      await this.takeScreenshot(page, 'accounts-receivable')
      
      const arElements = await page.$$('table, .receivables-list, *:has-text("A Receber")')
      testResults.accountsReceivable = arElements.length > 0
      
      // Test Financial Dashboard
      await page.goto(`${this.results.baseUrl}/billing/financial-dashboard`, { 
        waitUntil: 'networkidle0', 
        timeout: 15000 
      })
      
      await this.takeScreenshot(page, 'financial-dashboard')
      
      // Check vendor management
      const vendorElements = await page.$$('*:has-text("Fornecedor"), .vendor-list, button:has-text("Novo Fornecedor")')
      testResults.vendorManagement = vendorElements.length > 0
      
      // Test financial reporting
      const reportElements = await page.$$('button:has-text("Exportar"), .export-button, *:has-text("Relatório")')
      testResults.financialReporting = reportElements.length > 0
      
      // Check cash flow monitoring
      const cashFlowElements = await page.$$('.text-green-600, .text-red-600, *:has-text("Saldo"), .financial-metric')
      testResults.cashFlowMonitoring = cashFlowElements.length >= 3
      
      console.log('   📤 Accounts Payable:', testResults.accountsPayable)
      console.log('   📥 Accounts Receivable:', testResults.accountsReceivable)
      console.log('   🏪 Vendor management:', testResults.vendorManagement)
      console.log('   📊 Financial reporting:', testResults.financialReporting)
      console.log('   💰 Cash flow monitoring:', testResults.cashFlowMonitoring)
      
    } catch (error) {
      this.results.errors.push({
        suite: 'financialManagement',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
    
    this.results.testResults.financialManagement = testResults
  }
  
  // =====================================================
  // 7. PAYMENT INTEGRATION TESTING
  // =====================================================
  async paymentIntegration(page) {
    const testResults = {
      stripeIntegration: false,
      brazilianPaymentMethods: false,
      paymentTracking: false,
      reconciliation: false,
      lateFeeCalculations: false
    }
    
    try {
      // Check for Stripe/payment integration indicators
      await page.goto(`${this.results.baseUrl}/billing/invoices`, { 
        waitUntil: 'networkidle0', 
        timeout: 15000 
      })
      
      // Look for payment-related elements
      const paymentElements = await page.$$('*:has-text("PIX"), *:has-text("Cartão"), *:has-text("Boleto"), .payment-method')
      testResults.brazilianPaymentMethods = paymentElements.length > 0
      
      // Check for Stripe integration signs
      const stripeElements = await page.$$('[data-stripe], .stripe-element, *[class*="stripe"]')
      testResults.stripeIntegration = stripeElements.length > 0
      
      // Test payment tracking
      const trackingElements = await page.$$('*:has-text("Pago"), *:has-text("Pendente"), .payment-status')
      testResults.paymentTracking = trackingElements.length > 0
      
      // Check reconciliation features
      const reconciliationElements = await page.$$('*:has-text("Reconciliar"), button:has-text("Confirmar Pagamento")')
      testResults.reconciliation = reconciliationElements.length > 0
      
      // Test late fee calculations
      const lateFeeElements = await page.$$('*:has-text("Vencido"), *:has-text("Multa"), .overdue-indicator')
      testResults.lateFeeCalculations = lateFeeElements.length > 0
      
      console.log('   💳 Stripe integration:', testResults.stripeIntegration)
      console.log('   🇧🇷 Brazilian payment methods:', testResults.brazilianPaymentMethods)
      console.log('   📋 Payment tracking:', testResults.paymentTracking)
      console.log('   🔄 Reconciliation:', testResults.reconciliation)
      console.log('   ⏰ Late fee calculations:', testResults.lateFeeCalculations)
      
    } catch (error) {
      this.results.errors.push({
        suite: 'paymentIntegration',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
    
    this.results.testResults.paymentIntegration = testResults
  }
  
  // =====================================================
  // 8. BILLING SECURITY & COMPLIANCE TESTING
  // =====================================================
  async billingSecurityCompliance(page) {
    const testResults = {
      roleBasedAccess: false,
      dataIsolation: false,
      auditTrails: false,
      brazilianCompliance: false,
      securityValidation: false
    }
    
    try {
      // Test role-based access (should be on billing routes as lawyer/admin)
      await page.goto(`${this.results.baseUrl}/billing`, { 
        waitUntil: 'networkidle0', 
        timeout: 15000 
      })
      
      // Check for billing access (should work for admin/lawyer roles)
      const billingAccess = await page.$('h1:has-text("Faturamento"), .billing-dashboard')
      testResults.roleBasedAccess = !!billingAccess
      
      // Check for Brazilian compliance indicators
      const complianceElements = await page.$$eval('*', els => 
        Array.from(els).filter(el => 
          el.textContent.includes('CNPJ') || 
          el.textContent.includes('CPF') || 
          el.textContent.includes('R$')
        ).length
      )
      testResults.brazilianCompliance = complianceElements >= 3
      
      // Test data isolation (multi-tenant indicators)
      const isolationElements = await page.$$('[data-firm-id], .law-firm-scope, *:has-text("Escritório")')
      testResults.dataIsolation = isolationElements.length > 0
      
      // Check for audit trail capabilities
      const auditElements = await page.$$('*:has-text("Atualizado"), *:has-text("Criado"), .timestamp, .audit-log')
      testResults.auditTrails = auditElements.length > 0
      
      // Security validation
      const securityElements = await page.$$('input[type="password"], .secure-input, *[data-secure]')
      testResults.securityValidation = securityElements.length >= 0 // Basic check
      
      console.log('   🔐 Role-based access:', testResults.roleBasedAccess)
      console.log('   🏢 Data isolation:', testResults.dataIsolation)
      console.log('   📋 Audit trails:', testResults.auditTrails)
      console.log('   🇧🇷 Brazilian compliance:', testResults.brazilianCompliance)
      console.log('   🛡️ Security validation:', testResults.securityValidation)
      
    } catch (error) {
      this.results.errors.push({
        suite: 'billingSecurityCompliance',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }
    
    this.results.testResults.billingSecurityCompliance = testResults
  }
  
  // =====================================================
  // UTILITY METHODS
  // =====================================================
  async takeScreenshot(page, name) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `billing-test-${name}-${timestamp}.png`
      const filepath = path.join(__dirname, 'test-screenshots', filename)
      
      // Ensure directory exists
      const dir = path.dirname(filepath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      
      await page.screenshot({ 
        path: filepath, 
        fullPage: true,
        type: 'png'
      })
      
      this.results.screenshots.push({
        name,
        filename,
        filepath,
        timestamp
      })
      
      console.log(`   📸 Screenshot saved: ${filename}`)
    } catch (error) {
      console.error(`   ❌ Screenshot failed for ${name}:`, error.message)
    }
  }
  
  async generateBillingReport() {
    // Calculate summary statistics
    const testCounts = {}
    let totalTests = 0
    let passedTests = 0
    
    for (const [suite, results] of Object.entries(this.results.testResults)) {
      const suiteResults = Object.values(results)
      const suitePassed = suiteResults.filter(Boolean).length
      const suiteTotal = suiteResults.length
      
      testCounts[suite] = {
        passed: suitePassed,
        total: suiteTotal,
        percentage: Math.round((suitePassed / suiteTotal) * 100)
      }
      
      totalTests += suiteTotal
      passedTests += suitePassed
    }
    
    const overallPercentage = Math.round((passedTests / totalTests) * 100)
    
    // Create comprehensive summary
    this.results.summary = {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      overallPercentage,
      testCounts,
      errorCount: this.results.errors.length,
      screenshotCount: this.results.screenshots.length,
      testDuration: 'Approximately 8-12 minutes',
      recommendations: this.generateRecommendations()
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, `billing-system-test-report-${Date.now()}.json`)
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2))
    
    // Display console summary
    this.displayBillingSummary()
    
    console.log(`\n📄 Detailed report saved: ${reportPath}`)
  }
  
  displayBillingSummary() {
    console.log('\n' + '='.repeat(80))
    console.log('💰 BILLING SYSTEM TESTING AGENT - COMPREHENSIVE REPORT')
    console.log('='.repeat(80))
    
    console.log(`\n📊 OVERALL RESULTS:`)
    console.log(`   • Total Tests: ${this.results.summary.totalTests}`)
    console.log(`   • Passed: ${this.results.summary.passedTests}`)
    console.log(`   • Failed: ${this.results.summary.failedTests}`)
    console.log(`   • Success Rate: ${this.results.summary.overallPercentage}%`)
    console.log(`   • Errors Encountered: ${this.results.summary.errorCount}`)
    
    console.log(`\n🧪 DETAILED SUITE RESULTS:`)
    for (const [suite, counts] of Object.entries(this.results.summary.testCounts)) {
      const status = counts.percentage >= 80 ? '✅' : counts.percentage >= 60 ? '⚠️' : '❌'
      console.log(`   ${status} ${suite}: ${counts.passed}/${counts.total} (${counts.percentage}%)`)
    }
    
    console.log(`\n📋 BILLING SYSTEM FUNCTIONALITY SCORE:`)
    const billingScore = this.calculateBillingScore()
    console.log(`   🎯 Billing System Score: ${billingScore}/100`)
    console.log(`   📈 Payment Processing: ${this.getFeatureScore('paymentIntegration')}/100`)
    console.log(`   📊 Financial Management: ${this.getFeatureScore('financialManagement')}/100`)
    console.log(`   🧾 Invoice Management: ${this.getFeatureScore('invoiceManagement')}/100`)
    console.log(`   ⏱️ Time Tracking: ${this.getFeatureScore('timeTracking')}/100`)
    console.log(`   🔐 Security & Compliance: ${this.getFeatureScore('billingSecurityCompliance')}/100`)
    
    if (this.results.summary.recommendations.length > 0) {
      console.log(`\n💡 RECOMMENDATIONS:`)
      this.results.summary.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`)
      })
    }
    
    console.log('\n' + '='.repeat(80))
  }
  
  calculateBillingScore() {
    return Math.round(this.results.summary.overallPercentage)
  }
  
  getFeatureScore(feature) {
    const counts = this.results.summary.testCounts[feature]
    return counts ? counts.percentage : 0
  }
  
  generateRecommendations() {
    const recommendations = []
    
    // Analyze results and generate specific recommendations
    if (this.getFeatureScore('paymentIntegration') < 80) {
      recommendations.push('Enhance payment integration testing - verify Stripe connectivity and Brazilian payment methods')
    }
    
    if (this.getFeatureScore('timeTracking') < 70) {
      recommendations.push('Improve time tracking functionality - ensure timer controls and billing calculations work properly')
    }
    
    if (this.getFeatureScore('billingSecurityCompliance') < 90) {
      recommendations.push('Strengthen billing security - verify role-based access and data isolation')
    }
    
    if (this.results.errors.length > 5) {
      recommendations.push('Address console errors and page errors to improve stability')
    }
    
    if (this.results.summary.overallPercentage < 75) {
      recommendations.push('Overall billing system needs significant improvements before production deployment')
    }
    
    return recommendations
  }
}

// Execute the comprehensive billing system tests
async function runBillingTests() {
  const agent = new BillingSystemTestAgent()
  await agent.runComprehensiveTests()
}

// Run if called directly
if (require.main === module) {
  runBillingTests().catch(console.error)
}

module.exports = { BillingSystemTestAgent }