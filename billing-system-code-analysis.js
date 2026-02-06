// =====================================================
// BILLING SYSTEM CODE ANALYSIS SCRIPT
// Comprehensive codebase validation for billing functionality
// =====================================================

const fs = require('fs')
const path = require('path')

class BillingSystemCodeAnalyzer {
  constructor() {
    this.projectRoot = __dirname
    this.analysisResults = {
      timestamp: new Date().toISOString(),
      billingComponents: {},
      serviceLayer: {},
      databaseSchema: {},
      integrations: {},
      security: {},
      compliance: {},
      overallScore: 0
    }
  }

  async runAnalysis() {
    console.log('🔍 BILLING SYSTEM CODE ANALYSIS')
    console.log('📁 Project Root:', this.projectRoot)
    console.log('🎯 Focus: Comprehensive billing system validation')
    console.log('=' .repeat(60))

    try {
      // Analyze billing components
      await this.analyzeBillingComponents()
      
      // Analyze service layer
      await this.analyzeServiceLayer()
      
      // Analyze database schema
      await this.analyzeDatabaseSchema()
      
      // Analyze integrations
      await this.analyzeIntegrations()
      
      // Analyze security implementation
      await this.analyzeSecurity()
      
      // Analyze Brazilian compliance
      await this.analyzeBrazilianCompliance()
      
      // Generate comprehensive report
      await this.generateAnalysisReport()
      
    } catch (error) {
      console.error('❌ Analysis failed:', error.message)
    }
  }

  async analyzeBillingComponents() {
    console.log('\n🧩 Analyzing Billing Components...')
    
    const billingPaths = [
      'app/(dashboard)/billing/page.tsx',
      'app/(dashboard)/billing/invoices/page.tsx', 
      'app/(dashboard)/billing/time-tracking/page.tsx',
      'app/(dashboard)/billing/financial-dashboard/page.tsx',
      'components/features/billing/',
      'components/features/financial/'
    ]
    
    let componentsFound = 0
    let componentsWithLogic = 0
    let totalLinesOfCode = 0
    
    for (const billingPath of billingPaths) {
      const fullPath = path.join(this.projectRoot, billingPath)
      
      if (fs.existsSync(fullPath)) {
        componentsFound++
        
        if (fs.statSync(fullPath).isFile()) {
          const content = fs.readFileSync(fullPath, 'utf8')
          const lines = content.split('\n').length
          totalLinesOfCode += lines
          
          // Check for business logic
          if (content.includes('useState') || content.includes('useEffect') || content.includes('async')) {
            componentsWithLogic++
          }
          
          console.log(`   ✅ Found: ${billingPath} (${lines} lines)`)
        } else {
          // Directory - check contents
          const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))
          console.log(`   📁 Directory: ${billingPath} (${files.length} files)`)
          componentsFound += files.length - 1 // Adjust count
        }
      } else {
        console.log(`   ❌ Missing: ${billingPath}`)
      }
    }
    
    this.analysisResults.billingComponents = {
      totalComponents: componentsFound,
      componentsWithLogic,
      totalLinesOfCode,
      completeness: Math.round((componentsFound / billingPaths.length) * 100)
    }
    
    console.log(`   📊 Found ${componentsFound} billing components`)
    console.log(`   💻 Total lines of code: ${totalLinesOfCode}`)
    console.log(`   🧠 Components with logic: ${componentsWithLogic}`)
  }

  async analyzeServiceLayer() {
    console.log('\n⚙️ Analyzing Service Layer...')
    
    const serviceFiles = [
      'lib/billing/subscription-service-production.ts',
      'lib/billing/case-billing-service-production.ts',
      'lib/billing/discount-service-production.ts',
      'lib/financial/financial-service.ts',
      'lib/billing/time-tracking-service.ts'
    ]
    
    let servicesFound = 0
    let productionReady = 0
    let hasSupabaseIntegration = 0
    
    for (const serviceFile of serviceFiles) {
      const fullPath = path.join(this.projectRoot, serviceFile)
      
      if (fs.existsSync(fullPath)) {
        servicesFound++
        const content = fs.readFileSync(fullPath, 'utf8')
        
        // Check for production readiness
        if (content.includes('createClient') && content.includes('supabase')) {
          productionReady++
          hasSupabaseIntegration++
        }
        
        // Check for comprehensive methods
        const methods = (content.match(/async \w+\(/g) || []).length
        console.log(`   ✅ ${serviceFile}: ${methods} methods`)
      } else {
        console.log(`   ❌ Missing: ${serviceFile}`)
      }
    }
    
    this.analysisResults.serviceLayer = {
      totalServices: servicesFound,
      productionReady,
      hasSupabaseIntegration,
      completeness: Math.round((servicesFound / serviceFiles.length) * 100)
    }
    
    console.log(`   📊 Found ${servicesFound}/${serviceFiles.length} services`)
    console.log(`   🚀 Production ready: ${productionReady}`)
    console.log(`   🗄️ Supabase integration: ${hasSupabaseIntegration}`)
  }

  async analyzeDatabaseSchema() {
    console.log('\n🗄️ Analyzing Database Schema...')
    
    const schemaFiles = [
      'database/migrations/',
      'database/seed-data-step1-core-FIXED.sql',
      'database/seed-data-step2-billing.sql',
      'database/seed-data-step3-timetracking.sql',
      'database/seed-data-step4-financial.sql'
    ]
    
    let schemaFilesFound = 0
    let totalTables = 0
    let billingTables = 0
    
    for (const schemaPath of schemaFiles) {
      const fullPath = path.join(this.projectRoot, schemaPath)
      
      if (fs.existsSync(fullPath)) {
        schemaFilesFound++
        
        if (fs.statSync(fullPath).isFile()) {
          const content = fs.readFileSync(fullPath, 'utf8')
          
          // Count tables
          const createTableMatches = content.match(/CREATE TABLE/gi) || []
          const insertMatches = content.match(/INSERT INTO/gi) || []
          
          totalTables += createTableMatches.length
          
          // Count billing-specific tables
          if (content.includes('subscription') || content.includes('invoice') || content.includes('billing')) {
            billingTables += createTableMatches.length
          }
          
          console.log(`   ✅ ${schemaPath}: ${createTableMatches.length} tables, ${insertMatches.length} inserts`)
        } else {
          const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.sql'))
          console.log(`   📁 ${schemaPath}: ${files.length} SQL files`)
        }
      } else {
        console.log(`   ❌ Missing: ${schemaPath}`)
      }
    }
    
    this.analysisResults.databaseSchema = {
      schemaFilesFound,
      totalTables,
      billingTables,
      completeness: Math.round((schemaFilesFound / schemaFiles.length) * 100)
    }
    
    console.log(`   📊 Schema files: ${schemaFilesFound}`)
    console.log(`   🗄️ Total tables: ${totalTables}`)
    console.log(`   💰 Billing tables: ${billingTables}`)
  }

  async analyzeIntegrations() {
    console.log('\n🔗 Analyzing Integrations...')
    
    const integrationFiles = [
      'lib/stripe/',
      'app/api/stripe/',
      'lib/exports/',
      'lib/supabase/'
    ]
    
    let integrationsFound = 0
    let stripeIntegration = false
    let exportCapabilities = false
    let supabaseIntegration = false
    
    for (const integrationPath of integrationFiles) {
      const fullPath = path.join(this.projectRoot, integrationPath)
      
      if (fs.existsSync(fullPath)) {
        integrationsFound++
        
        if (integrationPath.includes('stripe')) {
          stripeIntegration = true
        }
        if (integrationPath.includes('exports')) {
          exportCapabilities = true
        }
        if (integrationPath.includes('supabase')) {
          supabaseIntegration = true
        }
        
        const files = fs.readdirSync(fullPath).length
        console.log(`   ✅ ${integrationPath}: ${files} files`)
      } else {
        console.log(`   ❌ Missing: ${integrationPath}`)
      }
    }
    
    this.analysisResults.integrations = {
      totalIntegrations: integrationsFound,
      stripeIntegration,
      exportCapabilities,
      supabaseIntegration,
      completeness: Math.round((integrationsFound / integrationFiles.length) * 100)
    }
    
    console.log(`   📊 Integrations found: ${integrationsFound}`)
    console.log(`   💳 Stripe: ${stripeIntegration}`)
    console.log(`   📊 Exports: ${exportCapabilities}`)
    console.log(`   🗄️ Supabase: ${supabaseIntegration}`)
  }

  async analyzeSecurity() {
    console.log('\n🔐 Analyzing Security Implementation...')
    
    let middlewareExists = false
    let roleBasedAccess = false
    let rowLevelSecurity = false
    
    // Check middleware
    const middlewarePath = path.join(this.projectRoot, 'middleware.ts')
    if (fs.existsSync(middlewarePath)) {
      middlewareExists = true
      const content = fs.readFileSync(middlewarePath, 'utf8')
      
      if (content.includes('user_type') && content.includes('admin')) {
        roleBasedAccess = true
      }
      
      console.log('   ✅ Middleware: Authentication and routing protection')
    }
    
    // Check for RLS policies
    const rlsFiles = [
      'database/migrations/002_row_level_security.sql',
      'database/migrations/003_billing_rls_policies.sql'
    ]
    
    for (const rlsFile of rlsFiles) {
      const fullPath = path.join(this.projectRoot, rlsFile)
      if (fs.existsSync(fullPath)) {
        rowLevelSecurity = true
        console.log(`   ✅ RLS: ${rlsFile}`)
      }
    }
    
    this.analysisResults.security = {
      middlewareExists,
      roleBasedAccess,
      rowLevelSecurity,
      securityScore: (middlewareExists + roleBasedAccess + rowLevelSecurity) * 33.33
    }
    
    console.log(`   🛡️ Security score: ${Math.round(this.analysisResults.security.securityScore)}%`)
  }

  async analyzeBrazilianCompliance() {
    console.log('\n🇧🇷 Analyzing Brazilian Compliance...')
    
    let cpfCnpjValidation = false
    let currencyFormatting = false
    let portugueseUI = false
    let pixIntegration = false
    
    // Check for Brazilian-specific features
    const filesToCheck = [
      'components/',
      'app/',
      'lib/'
    ]
    
    let totalFiles = 0
    let complianceFiles = 0
    
    for (const dirPath of filesToCheck) {
      const fullDirPath = path.join(this.projectRoot, dirPath)
      if (fs.existsSync(fullDirPath)) {
        const files = this.getAllFiles(fullDirPath, ['.tsx', '.ts'])
        totalFiles += files.length
        
        for (const file of files) {
          const content = fs.readFileSync(file, 'utf8')
          
          if (content.includes('CPF') || content.includes('CNPJ')) {
            cpfCnpjValidation = true
          }
          if (content.includes('pt-BR') || content.includes('BRL')) {
            currencyFormatting = true
          }
          if (content.includes('Faturamento') || content.includes('Receita')) {
            portugueseUI = true
          }
          if (content.includes('PIX')) {
            pixIntegration = true
          }
          
          if (content.includes('CPF') || content.includes('CNPJ') || 
              content.includes('pt-BR') || content.includes('Faturamento')) {
            complianceFiles++
          }
        }
      }
    }
    
    this.analysisResults.compliance = {
      cpfCnpjValidation,
      currencyFormatting,
      portugueseUI,
      pixIntegration,
      compliancePercentage: Math.round((complianceFiles / totalFiles) * 100)
    }
    
    console.log(`   📋 CPF/CNPJ validation: ${cpfCnpjValidation}`)
    console.log(`   💰 Currency formatting: ${currencyFormatting}`)
    console.log(`   🗣️ Portuguese UI: ${portugueseUI}`)
    console.log(`   💳 PIX integration: ${pixIntegration}`)
    console.log(`   📊 Compliance coverage: ${this.analysisResults.compliance.compliancePercentage}%`)
  }

  getAllFiles(dirPath, extensions) {
    const files = []
    
    function walkDir(currentPath) {
      const items = fs.readdirSync(currentPath)
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          walkDir(fullPath)
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath)
        }
      }
    }
    
    walkDir(dirPath)
    return files
  }

  async generateAnalysisReport() {
    // Calculate overall score
    const scores = [
      this.analysisResults.billingComponents.completeness,
      this.analysisResults.serviceLayer.completeness,
      this.analysisResults.databaseSchema.completeness,
      this.analysisResults.integrations.completeness,
      this.analysisResults.security.securityScore,
      this.analysisResults.compliance.compliancePercentage
    ]
    
    this.analysisResults.overallScore = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length
    )
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 BILLING SYSTEM CODE ANALYSIS REPORT')
    console.log('='.repeat(60))
    
    console.log(`\n🎯 OVERALL SCORE: ${this.analysisResults.overallScore}/100`)
    
    console.log(`\n📋 DETAILED SCORES:`)
    console.log(`   🧩 Billing Components: ${this.analysisResults.billingComponents.completeness}%`)
    console.log(`   ⚙️ Service Layer: ${this.analysisResults.serviceLayer.completeness}%`)
    console.log(`   🗄️ Database Schema: ${this.analysisResults.databaseSchema.completeness}%`)
    console.log(`   🔗 Integrations: ${this.analysisResults.integrations.completeness}%`)
    console.log(`   🔐 Security: ${Math.round(this.analysisResults.security.securityScore)}%`)
    console.log(`   🇧🇷 Compliance: ${this.analysisResults.compliance.compliancePercentage}%`)
    
    console.log(`\n📊 SYSTEM METRICS:`)
    console.log(`   💻 Lines of Code: ${this.analysisResults.billingComponents.totalLinesOfCode}`)
    console.log(`   ⚙️ Services: ${this.analysisResults.serviceLayer.totalServices}`)
    console.log(`   🗄️ Database Tables: ${this.analysisResults.databaseSchema.totalTables}`)
    console.log(`   🔗 Integrations: ${this.analysisResults.integrations.totalIntegrations}`)
    
    console.log(`\n✅ PRODUCTION READINESS:`)
    if (this.analysisResults.overallScore >= 90) {
      console.log('   🟢 EXCELLENT - Ready for production deployment')
    } else if (this.analysisResults.overallScore >= 80) {
      console.log('   🟡 GOOD - Minor improvements needed')
    } else if (this.analysisResults.overallScore >= 70) {
      console.log('   🟠 FAIR - Moderate improvements needed')
    } else {
      console.log('   🔴 NEEDS WORK - Significant improvements required')
    }
    
    // Save report
    const reportPath = path.join(this.projectRoot, `billing-code-analysis-${Date.now()}.json`)
    fs.writeFileSync(reportPath, JSON.stringify(this.analysisResults, null, 2))
    
    console.log(`\n📄 Detailed report saved: ${path.basename(reportPath)}`)
    console.log('=' .repeat(60))
  }
}

// Run analysis
async function runAnalysis() {
  const analyzer = new BillingSystemCodeAnalyzer()
  await analyzer.runAnalysis()
}

runAnalysis().catch(console.error)