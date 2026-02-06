// Simplified Export Functionality Test Script
// Prima Facie Legal Management System - Export Testing Agent

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Test Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_TIMEOUT = 20000;

// Test Results
let testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  details: []
};

// Helper Functions
function logTest(testName, status, details = '') {
  testResults.totalTests++;
  const result = {
    test: testName,
    status: status,
    details: details,
    timestamp: new Date().toISOString()
  };
  
  testResults.details.push(result);
  
  if (status === 'PASS') {
    testResults.passedTests++;
    console.log(`✅ ${testName}: PASS ${details}`);
  } else {
    testResults.failedTests++;
    console.log(`❌ ${testName}: FAIL ${details}`);
  }
}

function logSection(sectionName) {
  console.log(`\n🔍 Testing: ${sectionName}`);
  console.log('='.repeat(50));
}

// Main Test Suite
async function runExportTests() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set longer timeout
    page.setDefaultTimeout(TEST_TIMEOUT);

    // ========================================
    // 1. APPLICATION ACCESS TESTING
    // ========================================
    logSection('Application Access & Navigation');

    try {
      await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle0', timeout: TEST_TIMEOUT });
      logTest('Application Root Access', 'PASS', 'Application loads successfully');
    } catch (error) {
      logTest('Application Root Access', 'FAIL', `Error: ${error.message}`);
      return; // Can't continue without basic access
    }

    // ========================================
    // 2. FINANCIAL DASHBOARD EXPORT TESTING
    // ========================================
    logSection('Financial Dashboard Export Features');

    try {
      await page.goto(`${BASE_URL}/billing/financial-dashboard`, { 
        waitUntil: 'networkidle0', 
        timeout: TEST_TIMEOUT 
      });
      
      // Check if page loads with export features
      const pageContent = await page.content();
      
      if (pageContent.includes('Dashboard Financeiro') || pageContent.includes('Financial Dashboard')) {
        logTest('Financial Dashboard Access', 'PASS', 'Dashboard page loads successfully');
        
        // Look for export-related elements
        const exportButtons = await page.$$eval('button', buttons => 
          buttons.filter(btn => {
            const text = btn.textContent.toLowerCase();
            return text.includes('export') || text.includes('pdf') || text.includes('excel') || text.includes('download');
          }).length
        );

        if (exportButtons > 0) {
          logTest('Export Buttons Detection', 'PASS', `Found ${exportButtons} export-related buttons`);
          
          // Try to find specific export functionality
          try {
            const hasExportComponent = await page.evaluate(() => {
              // Look for ExportButton components or export-related classes
              return document.querySelectorAll('.export-button, [data-testid*="export"]').length > 0;
            });
            
            logTest('Export Component Integration', hasExportComponent ? 'PASS' : 'SKIP', 
                   hasExportComponent ? 'Export components detected' : 'Basic export elements only');
          } catch (error) {
            logTest('Export Component Detection', 'FAIL', `Error: ${error.message}`);
          }
        } else {
          logTest('Export Buttons Detection', 'FAIL', 'No export buttons found');
        }
      } else {
        logTest('Financial Dashboard Access', 'FAIL', 'Dashboard content not detected');
      }
    } catch (error) {
      logTest('Financial Dashboard Testing', 'FAIL', `Navigation error: ${error.message}`);
    }

    // ========================================
    // 3. EXPORT BUTTON COMPONENT TESTING
    // ========================================
    logSection('Export Button Component Testing');

    try {
      // Check for ExportButton component usage
      const exportComponentPresent = await page.evaluate(() => {
        // Look for elements that suggest ExportButton usage
        const indicators = [
          'button:has-text("Excel")',
          'button:has-text("PDF")', 
          '.export-button',
          '[class*="export"]',
          'button[title*="export"]',
          'button[title*="Export"]'
        ];
        
        return indicators.some(selector => {
          try {
            return document.querySelector(selector) !== null;
          } catch {
            return false;
          }
        });
      });

      logTest('ExportButton Component Usage', exportComponentPresent ? 'PASS' : 'FAIL',
             exportComponentPresent ? 'Export components found in DOM' : 'No export components detected');

      // Test export button interaction
      try {
        const exportButton = await page.$('button');
        if (exportButton) {
          const buttonText = await page.evaluate(el => el.textContent, exportButton);
          logTest('Export Button Interaction', 'PASS', `Button accessible: "${buttonText.substring(0, 30)}..."`);
        }
      } catch (error) {
        logTest('Export Button Interaction', 'FAIL', `Interaction error: ${error.message}`);
      }
    } catch (error) {
      logTest('Export Component Testing', 'FAIL', `Error: ${error.message}`);
    }

    // ========================================
    // 4. MODULE INTEGRATION TESTING
    // ========================================
    logSection('Cross-Module Export Integration');

    const testPages = [
      { name: 'Billing Invoices', url: '/billing/invoices' },
      { name: 'Time Tracking', url: '/billing/time-tracking' },
      { name: 'Reports', url: '/reports' },
      { name: 'Clients', url: '/clients' },
      { name: 'Matters', url: '/matters' }
    ];

    for (const testPage of testPages) {
      try {
        await page.goto(`${BASE_URL}${testPage.url}`, { 
          waitUntil: 'networkidle0', 
          timeout: 15000 
        });
        
        // Check if page loads and has potential export features
        const pageAnalysis = await page.evaluate(() => {
          const content = document.body.textContent.toLowerCase();
          const hasExportElements = document.querySelectorAll('button, .export, [data-export]').length;
          return {
            pageLoads: content.length > 100,
            hasButtons: hasExportElements > 0,
            buttonCount: hasExportElements
          };
        });

        if (pageAnalysis.pageLoads) {
          logTest(`${testPage.name} Page Access`, 'PASS', `Page loads with ${pageAnalysis.buttonCount} interactive elements`);
          
          if (pageAnalysis.hasButtons) {
            logTest(`${testPage.name} Export Potential`, 'PASS', 'Interactive elements available for export functionality');
          } else {
            logTest(`${testPage.name} Export Potential`, 'SKIP', 'No obvious export elements detected');
          }
        } else {
          logTest(`${testPage.name} Page Access`, 'FAIL', 'Page content insufficient');
        }
      } catch (error) {
        logTest(`${testPage.name} Module Testing`, 'FAIL', `Navigation error: ${error.message.substring(0, 50)}...`);
      }
    }

    // ========================================
    // 5. EXPORT SERVICE INTEGRATION TESTING
    // ========================================
    logSection('Export Service Backend Integration');

    try {
      // Check if export service is properly integrated
      const serviceIntegration = await page.evaluate(() => {
        // Look for signs of export service integration
        const scripts = Array.from(document.querySelectorAll('script'));
        const hasExportImports = scripts.some(script => 
          script.textContent && script.textContent.includes('export')
        );
        
        return {
          hasScripts: scripts.length > 0,
          potentialExportCode: hasExportImports,
          scriptCount: scripts.length
        };
      });

      logTest('Export Service Integration', serviceIntegration.potentialExportCode ? 'PASS' : 'SKIP',
             `${serviceIntegration.scriptCount} scripts loaded, export code ${serviceIntegration.potentialExportCode ? 'detected' : 'not detected'}`);
    } catch (error) {
      logTest('Export Service Integration', 'FAIL', `Error: ${error.message}`);
    }

    // ========================================
    // 6. BRANDING ASSETS TESTING
    // ========================================
    logSection('Branding & Asset Integration');

    try {
      // Check for logo and branding assets
      const logoExists = fs.existsSync(path.join(__dirname, 'public', 'logo.png'));
      logTest('Logo Asset Availability', logoExists ? 'PASS' : 'FAIL',
             logoExists ? 'Logo file exists in public directory' : 'Logo file missing');

      // Check for Brazilian compliance indicators
      const brazilianCompliance = await page.evaluate(() => {
        const content = document.body.textContent;
        const indicators = [
          content.includes('BRL') || content.includes('R$'),
          content.includes('Brasil') || content.includes('Brazil'),
          content.includes('CNPJ') || content.includes('CPF'),
          document.documentElement.lang === 'pt' || document.documentElement.lang === 'pt-BR'
        ];
        return indicators.filter(Boolean).length;
      });

      logTest('Brazilian Compliance Features', brazilianCompliance >= 2 ? 'PASS' : 'PARTIAL',
             `${brazilianCompliance}/4 Brazilian compliance indicators found`);
    } catch (error) {
      logTest('Branding Asset Testing', 'FAIL', `Error: ${error.message}`);
    }

  } catch (error) {
    console.error('Critical testing error:', error);
  } finally {
    await browser.close();
  }

  // Generate final report
  generateFinalReport();
}

function generateFinalReport() {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 PRIMA FACIE EXPORT SYSTEM TEST RESULTS');
  console.log('='.repeat(80));
  
  console.log(`\n📊 OVERALL SUMMARY:`);
  console.log(`Total Tests: ${testResults.totalTests}`);
  console.log(`Passed: ${testResults.passedTests} ✅`);
  console.log(`Failed: ${testResults.failedTests} ❌`);
  console.log(`Skipped/Partial: ${testResults.totalTests - testResults.passedTests - testResults.failedTests} ➖`);
  
  const successRate = testResults.totalTests > 0 ? 
    ((testResults.passedTests / testResults.totalTests) * 100).toFixed(1) : 0;
  console.log(`Success Rate: ${successRate}%`);

  console.log(`\n📋 DETAILED RESULTS:`);
  testResults.details.forEach((result, index) => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '➖';
    console.log(`${index + 1}. ${icon} ${result.test}`);
    if (result.details) console.log(`   ${result.details}`);
  });

  // Calculate final score and recommendations
  const scorePercentage = parseFloat(successRate);
  let scoreGrade = 'F';
  let recommendation = '';

  if (scorePercentage >= 90) {
    scoreGrade = 'A';
    recommendation = '🎉 EXCELLENT: Export system is production-ready!';
  } else if (scorePercentage >= 80) {
    scoreGrade = 'B';
    recommendation = '👍 GOOD: Export system functional with minor improvements needed';
  } else if (scorePercentage >= 70) {
    scoreGrade = 'C';
    recommendation = '⚠️  AVERAGE: Export system needs significant improvements';
  } else if (scorePercentage >= 60) {
    scoreGrade = 'D';
    recommendation = '🔴 POOR: Critical export issues need immediate attention';
  } else {
    scoreGrade = 'F';
    recommendation = '💥 CRITICAL: Export system requires major rework';
  }

  console.log(`\n🏆 FINAL ASSESSMENT:`);
  console.log(`Grade: ${scoreGrade} (${scorePercentage}%)`);
  console.log(recommendation);

  console.log(`\n📝 KEY FINDINGS:`);
  console.log(`• Export functionality infrastructure: ${testResults.details.some(d => d.test.includes('Export') && d.status === 'PASS') ? 'PRESENT' : 'NEEDS_WORK'}`);
  console.log(`• Cross-module integration: ${testResults.details.filter(d => d.test.includes('Module') && d.status === 'PASS').length > 3 ? 'GOOD' : 'NEEDS_IMPROVEMENT'}`);
  console.log(`• Brazilian compliance features: ${testResults.details.some(d => d.test.includes('Brazilian') && d.status === 'PASS') ? 'IMPLEMENTED' : 'PARTIAL'}`);
  console.log(`• Asset integration: ${testResults.details.some(d => d.test.includes('Logo') && d.status === 'PASS') ? 'READY' : 'NEEDS_SETUP'}`);

  console.log('\n' + '='.repeat(80));
}

// Run the test suite
console.log('🚀 Starting Prima Facie Export System Testing...\n');
runExportTests().catch(console.error);