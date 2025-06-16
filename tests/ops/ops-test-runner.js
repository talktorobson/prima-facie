#!/usr/bin/env node

/**
 * Prima Facie Operational Test Runner
 * Comprehensive operational testing suite for environment validation,
 * database connectivity, performance monitoring, and deployment readiness.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const util = require('util');

// ANSI color codes for output formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

class OpsTestRunner {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: [],
      startTime: new Date(),
      endTime: null,
      duration: 0
    };
    
    this.testSuites = [
      'environment-validation',
      'supabase-connectivity',
      'database-performance',
      'filesystem-permissions',
      'logging-monitoring',
      'backup-recovery',
      'security-configuration',
      'performance-benchmarks',
      'health-checks',
      'deployment-readiness'
    ];
  }

  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logSuccess(message) {
    this.log(`✅ ${message}`, 'green');
  }

  logError(message) {
    this.log(`❌ ${message}`, 'red');
  }

  logWarning(message) {
    this.log(`⚠️  ${message}`, 'yellow');
  }

  logInfo(message) {
    this.log(`ℹ️  ${message}`, 'blue');
  }

  logHeader(message) {
    this.log(`\n${'='.repeat(60)}`, 'cyan');
    this.log(`${message}`, 'cyan');
    this.log(`${'='.repeat(60)}`, 'cyan');
  }

  async runTest(testName, testFunction) {
    this.results.total++;
    const startTime = Date.now();
    
    try {
      this.logInfo(`Running: ${testName}`);
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      if (result.status === 'passed') {
        this.results.passed++;
        this.logSuccess(`${testName} - PASSED (${duration}ms)`);
      } else if (result.status === 'warning') {
        this.results.warnings++;
        this.logWarning(`${testName} - WARNING (${duration}ms): ${result.message}`);
      } else {
        this.results.failed++;
        this.logError(`${testName} - FAILED (${duration}ms): ${result.message}`);
      }
      
      this.results.tests.push({
        name: testName,
        status: result.status,
        message: result.message,
        duration,
        details: result.details || {}
      });
      
    } catch (error) {
      this.results.failed++;
      const duration = Date.now() - startTime;
      this.logError(`${testName} - ERROR (${duration}ms): ${error.message}`);
      
      this.results.tests.push({
        name: testName,
        status: 'error',
        message: error.message,
        duration,
        details: { stack: error.stack }
      });
    }
  }

  async runAllTests() {
    this.logHeader('PRIMA FACIE OPERATIONAL TEST SUITE');
    this.logInfo(`Starting operational tests at ${this.results.startTime.toISOString()}`);
    
    // Load and run each test suite
    for (const suiteName of this.testSuites) {
      try {
        const suitePath = path.join(__dirname, `${suiteName}.test.js`);
        if (fs.existsSync(suitePath)) {
          this.logHeader(`TEST SUITE: ${suiteName.toUpperCase().replace(/-/g, ' ')}`);
          const testSuite = require(suitePath);
          
          if (testSuite.tests && Array.isArray(testSuite.tests)) {
            for (const test of testSuite.tests) {
              await this.runTest(test.name, test.function);
            }
          }
        } else {
          this.logWarning(`Test suite not found: ${suitePath}`);
        }
      } catch (error) {
        this.logError(`Failed to load test suite ${suiteName}: ${error.message}`);
      }
    }
    
    this.results.endTime = new Date();
    this.results.duration = this.results.endTime - this.results.startTime;
    
    this.generateReport();
  }

  generateReport() {
    this.logHeader('TEST RESULTS SUMMARY');
    
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(2);
    
    this.logInfo(`Total Tests: ${this.results.total}`);
    this.logSuccess(`Passed: ${this.results.passed}`);
    this.logError(`Failed: ${this.results.failed}`);
    this.logWarning(`Warnings: ${this.results.warnings}`);
    this.logInfo(`Success Rate: ${successRate}%`);
    this.logInfo(`Duration: ${this.results.duration}ms`);
    
    // Generate detailed report file
    const reportPath = path.join(__dirname, 'ops-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    this.logInfo(`Detailed report saved to: ${reportPath}`);
    
    // Generate human-readable report
    const htmlReportPath = path.join(__dirname, 'ops-test-report.html');
    this.generateHtmlReport(htmlReportPath);
    this.logInfo(`HTML report saved to: ${htmlReportPath}`);
    
    // Exit with appropriate code
    if (this.results.failed > 0) {
      process.exit(1);
    } else if (this.results.warnings > 0) {
      process.exit(2);
    } else {
      process.exit(0);
    }
  }

  generateHtmlReport(filePath) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prima Facie Operational Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 20px; }
        .metric { background: white; padding: 15px; border-radius: 8px; border: 1px solid #dee2e6; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .warning { color: #ffc107; }
        .test-result { background: white; margin: 10px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #dee2e6; }
        .test-result.passed { border-left-color: #28a745; }
        .test-result.failed { border-left-color: #dc3545; }
        .test-result.warning { border-left-color: #ffc107; }
        .test-name { font-weight: bold; margin-bottom: 5px; }
        .test-details { font-size: 0.9em; color: #6c757d; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Prima Facie Operational Test Report</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <p>Duration: ${this.results.duration}ms</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <div class="metric-value">${this.results.total}</div>
            <div>Total Tests</div>
        </div>
        <div class="metric">
            <div class="metric-value passed">${this.results.passed}</div>
            <div>Passed</div>
        </div>
        <div class="metric">
            <div class="metric-value failed">${this.results.failed}</div>
            <div>Failed</div>
        </div>
        <div class="metric">
            <div class="metric-value warning">${this.results.warnings}</div>
            <div>Warnings</div>
        </div>
        <div class="metric">
            <div class="metric-value">${((this.results.passed / this.results.total) * 100).toFixed(1)}%</div>
            <div>Success Rate</div>
        </div>
    </div>
    
    <h2>Test Results</h2>
    ${this.results.tests.map(test => `
        <div class="test-result ${test.status}">
            <div class="test-name">${test.name}</div>
            <div class="test-details">
                Status: ${test.status.toUpperCase()} | Duration: ${test.duration}ms
                ${test.message ? `<br>Message: ${test.message}` : ''}
                ${test.details && Object.keys(test.details).length > 0 ? 
                  `<pre>${JSON.stringify(test.details, null, 2)}</pre>` : ''}
            </div>
        </div>
    `).join('')}
</body>
</html>`;
    
    fs.writeFileSync(filePath, html);
  }
}

// Run tests if called directly
if (require.main === module) {
  const runner = new OpsTestRunner();
  runner.runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = OpsTestRunner;