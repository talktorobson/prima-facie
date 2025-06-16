#!/usr/bin/env node
/**
 * Database Test Runner
 * Orchestrates the execution of Prima Facie database tests with proper setup and reporting
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  testDir: __dirname,
  configFile: path.join(__dirname, 'jest.config.js'),
  setupFile: path.join(__dirname, 'jest.setup.js'),
  sqlHelpersFile: path.join(__dirname, 'sql', 'test-helper-functions.sql'),
  coverageDir: path.join(__dirname, 'coverage'),
  reportDir: path.join(__dirname, 'reports')
};

// Test suites in execution order
const TEST_SUITES = [
  {
    name: 'Schema Validation',
    file: 'schema-validation.test.js',
    description: 'Tests database schema structure, constraints, and indexes',
    critical: true
  },
  {
    name: 'Data Integrity',
    file: 'data-integrity.test.js',
    description: 'Tests foreign keys, constraints, and data consistency',
    critical: true
  },
  {
    name: 'Database Functions',
    file: 'functions.test.js',
    description: 'Tests PostgreSQL functions and calculations',
    critical: true
  },
  {
    name: 'Database Triggers',
    file: 'triggers.test.js',
    description: 'Tests triggers and automatic updates',
    critical: true
  },
  {
    name: 'Row Level Security',
    file: 'rls-policies.test.js',
    description: 'Tests RLS policies and multi-tenant isolation',
    critical: false
  },
  {
    name: 'Data Seeding',
    file: 'data-seeding.test.js',
    description: 'Tests default data and seed scripts',
    critical: false
  },
  {
    name: 'Data Validation',
    file: 'data-validation.test.js',
    description: 'Tests Brazilian business rules and validations',
    critical: false
  },
  {
    name: 'Performance',
    file: 'performance.test.js',
    description: 'Tests query performance and optimization',
    critical: false
  },
  {
    name: 'Views and Reporting',
    file: 'views-reporting.test.js',
    description: 'Tests database views and reporting functionality',
    critical: false
  }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log('\n' + '='.repeat(60), 'cyan');
  log(message.toUpperCase(), 'cyan');
  log('='.repeat(60), 'cyan');
}

function logSection(message) {
  log('\n' + '-'.repeat(40), 'blue');
  log(message, 'blue');
  log('-'.repeat(40), 'blue');
}

function checkPrerequisites() {
  logHeader('Checking Prerequisites');

  // Check Node.js version
  const nodeVersion = process.version;
  log(`Node.js version: ${nodeVersion}`, 'green');

  // Check environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    log(`Missing environment variables: ${missingVars.join(', ')}`, 'red');
    log('Please set the required environment variables before running tests.', 'red');
    process.exit(1);
  }

  log('Environment variables: OK', 'green');

  // Check test files exist
  const missingFiles = TEST_SUITES.filter(suite => 
    !fs.existsSync(path.join(TEST_CONFIG.testDir, suite.file))
  );

  if (missingFiles.length > 0) {
    log(`Missing test files: ${missingFiles.map(f => f.file).join(', ')}`, 'red');
    process.exit(1);
  }

  log('Test files: OK', 'green');

  // Check Jest configuration
  if (!fs.existsSync(TEST_CONFIG.configFile)) {
    log('Jest configuration file not found', 'red');
    process.exit(1);
  }

  log('Jest configuration: OK', 'green');
}

function createDirectories() {
  logSection('Creating Output Directories');
  
  const dirs = [TEST_CONFIG.coverageDir, TEST_CONFIG.reportDir];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`Created directory: ${dir}`, 'green');
    } else {
      log(`Directory exists: ${dir}`, 'yellow');
    }
  });
}

function getTestCommand(options = {}) {
  const jestPath = path.join(__dirname, '../../node_modules/.bin/jest');
  const baseCommand = [
    jestPath,
    '--config', TEST_CONFIG.configFile,
    '--passWithNoTests'
  ];

  if (options.coverage) {
    baseCommand.push('--coverage');
  }

  if (options.verbose) {
    baseCommand.push('--verbose');
  }

  if (options.watch) {
    baseCommand.push('--watch');
  }

  if (options.testFile) {
    baseCommand.push(options.testFile);
  }

  if (options.bail) {
    baseCommand.push('--bail');
  }

  return baseCommand;
}

function runTestSuite(suite, options = {}) {
  return new Promise((resolve, reject) => {
    logSection(`Running ${suite.name} Tests`);
    log(suite.description, 'blue');

    const command = getTestCommand({
      testFile: suite.file,
      verbose: options.verbose,
      coverage: false // Individual suites don't need coverage
    });

    const startTime = Date.now();
    const child = spawn('node', command, {
      cwd: TEST_CONFIG.testDir,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' }
    });

    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      const durationSeconds = (duration / 1000).toFixed(2);

      if (code === 0) {
        log(`✅ ${suite.name} tests passed (${durationSeconds}s)`, 'green');
        resolve({ suite, passed: true, duration });
      } else {
        log(`❌ ${suite.name} tests failed (${durationSeconds}s)`, 'red');
        
        if (suite.critical && options.bail) {
          reject(new Error(`Critical test suite failed: ${suite.name}`));
        } else {
          resolve({ suite, passed: false, duration });
        }
      }
    });

    child.on('error', (error) => {
      log(`Error running ${suite.name} tests: ${error.message}`, 'red');
      reject(error);
    });
  });
}

function runAllTests(options = {}) {
  return new Promise(async (resolve, reject) => {
    logHeader('Running All Database Tests');

    const results = [];
    const startTime = Date.now();

    try {
      for (const suite of TEST_SUITES) {
        const result = await runTestSuite(suite, options);
        results.push(result);

        // Stop on critical test failure if bail is enabled
        if (options.bail && !result.passed && suite.critical) {
          break;
        }
      }

      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      
      resolve({ results, totalDuration });
    } catch (error) {
      reject(error);
    }
  });
}

function generateSummaryReport(testResults) {
  logHeader('Test Summary Report');

  const { results, totalDuration } = testResults;
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const totalDurationSeconds = (totalDuration / 1000).toFixed(2);

  log(`Total test suites: ${totalTests}`, 'blue');
  log(`Passed: ${passedTests}`, passedTests === totalTests ? 'green' : 'yellow');
  log(`Failed: ${failedTests}`, failedTests === 0 ? 'green' : 'red');
  log(`Total duration: ${totalDurationSeconds}s`, 'blue');

  // Detailed results
  logSection('Detailed Results');
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    const duration = (result.duration / 1000).toFixed(2);
    const color = result.passed ? 'green' : 'red';
    
    log(`${status} ${result.suite.name} (${duration}s)`, color);
  });

  // Failed tests
  const failedSuites = results.filter(r => !r.passed);
  if (failedSuites.length > 0) {
    logSection('Failed Test Suites');
    failedSuites.forEach(result => {
      log(`❌ ${result.suite.name}: ${result.suite.description}`, 'red');
    });
  }

  // Critical test failures
  const criticalFailures = failedSuites.filter(r => r.suite.critical);
  if (criticalFailures.length > 0) {
    logSection('Critical Test Failures');
    log('The following critical tests failed and may indicate serious issues:', 'red');
    criticalFailures.forEach(result => {
      log(`⚠️  ${result.suite.name}`, 'red');
    });
  }

  return {
    totalTests,
    passedTests,
    failedTests,
    criticalFailures: criticalFailures.length,
    success: failedTests === 0
  };
}

function runCoverageReport() {
  logHeader('Generating Coverage Report');

  try {
    const command = getTestCommand({
      coverage: true,
      verbose: false
    });

    execSync(`node ${command.join(' ')}`, {
      cwd: TEST_CONFIG.testDir,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' }
    });

    log('Coverage report generated successfully', 'green');
    log(`Coverage reports available in: ${TEST_CONFIG.coverageDir}`, 'blue');
  } catch (error) {
    log('Failed to generate coverage report', 'red');
    log(error.message, 'red');
  }
}

// Main execution function
async function main() {
  const args = process.argv.slice(2);
  const options = {
    coverage: args.includes('--coverage'),
    verbose: args.includes('--verbose'),
    watch: args.includes('--watch'),
    bail: args.includes('--bail'),
    suite: args.find(arg => arg.startsWith('--suite='))?.split('=')[1]
  };

  try {
    // Display header
    logHeader('Prima Facie Database Test Suite');
    log('Comprehensive database testing for Phase 8.7', 'blue');

    // Check prerequisites
    checkPrerequisites();

    // Create output directories
    createDirectories();

    // Run specific suite if requested
    if (options.suite) {
      const suite = TEST_SUITES.find(s => s.name.toLowerCase().includes(options.suite.toLowerCase()));
      if (!suite) {
        log(`Test suite not found: ${options.suite}`, 'red');
        log('Available suites:', 'blue');
        TEST_SUITES.forEach(s => log(`  - ${s.name}`, 'blue'));
        process.exit(1);
      }

      await runTestSuite(suite, options);
      log('\nSingle test suite execution completed', 'green');
      return;
    }

    // Run all tests
    const testResults = await runAllTests(options);
    
    // Generate summary
    const summary = generateSummaryReport(testResults);

    // Generate coverage report if requested
    if (options.coverage) {
      runCoverageReport();
    }

    // Exit with appropriate code
    if (summary.success) {
      log('\n🎉 All database tests passed successfully!', 'green');
      process.exit(0);
    } else {
      log('\n💥 Some database tests failed', 'red');
      process.exit(summary.criticalFailures > 0 ? 2 : 1);
    }

  } catch (error) {
    log('\n💥 Test execution failed', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = {
  runTestSuite,
  runAllTests,
  generateSummaryReport,
  TEST_SUITES,
  TEST_CONFIG
};