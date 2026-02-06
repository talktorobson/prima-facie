/**
 * Logging and Monitoring Setup Tests
 * Tests logging configuration, monitoring capabilities, and error reporting
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const tests = [
  {
    name: 'Console Logging Functionality',
    function: async () => {
      const originalConsole = { ...console };
      const logs = [];
      
      // Capture console output
      console.log = (...args) => {
        logs.push({ level: 'log', args, timestamp: new Date() });
        originalConsole.log(...args);
      };
      
      console.error = (...args) => {
        logs.push({ level: 'error', args, timestamp: new Date() });
        originalConsole.error(...args);
      };
      
      console.warn = (...args) => {
        logs.push({ level: 'warn', args, timestamp: new Date() });
        originalConsole.warn(...args);
      };
      
      try {
        // Test different log levels
        console.log('Test log message');
        console.warn('Test warning message');
        console.error('Test error message');
        
        // Test structured logging
        console.log({ message: 'Structured log', level: 'info', component: 'test' });
        
        // Restore original console
        Object.assign(console, originalConsole);
        
        const logLevels = logs.map(l => l.level);
        const hasAllLevels = ['log', 'warn', 'error'].every(level => logLevels.includes(level));
        
        if (!hasAllLevels) {
          return {
            status: 'failed',
            message: 'Not all console log levels are working',
            details: { logs, logLevels }
          };
        }
        
        return {
          status: 'passed',
          message: `Console logging is functional (${logs.length} log entries captured)`,
          details: { 
            logCount: logs.length,
            logLevels: [...new Set(logLevels)],
            logs: logs.slice(0, 5) // Show first 5 logs only
          }
        };
      } catch (error) {
        // Restore original console
        Object.assign(console, originalConsole);
        
        return {
          status: 'failed',
          message: `Console logging test failed: ${error.message}`,
          details: { error: error.message, logs }
        };
      }
    }
  },

  {
    name: 'Log File Creation and Rotation',
    function: async () => {
      const logDir = path.join(process.cwd(), 'logs');
      const testLogFile = path.join(logDir, 'test-app.log');
      
      try {
        // Ensure log directory exists
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
        
        const results = {
          logDir,
          testLogFile,
          logEntries: [],
          fileStats: {},
          rotationTest: {}
        };
        
        // Test log file creation
        const logEntries = [
          { level: 'INFO', message: 'Application started', timestamp: new Date().toISOString() },
          { level: 'DEBUG', message: 'Debug information', timestamp: new Date().toISOString() },
          { level: 'ERROR', message: 'Test error message', timestamp: new Date().toISOString() },
          { level: 'WARN', message: 'Warning message', timestamp: new Date().toISOString() }
        ];
        
        // Write log entries
        for (const entry of logEntries) {
          const logLine = `[${entry.timestamp}] ${entry.level}: ${entry.message}\n`;
          fs.appendFileSync(testLogFile, logLine);
          results.logEntries.push(entry);
        }
        
        // Get file stats
        const stats = fs.statSync(testLogFile);
        results.fileStats = {
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          permissions: stats.mode.toString(8)
        };
        
        // Test log rotation (simulate by renaming and creating new file)
        const rotatedLogFile = path.join(logDir, `test-app-${Date.now()}.log`);
        fs.renameSync(testLogFile, rotatedLogFile);
        
        // Create new log file
        fs.writeFileSync(testLogFile, `[${new Date().toISOString()}] INFO: Log rotated\n`);
        
        results.rotationTest = {
          rotatedFile: rotatedLogFile,
          rotatedSize: fs.statSync(rotatedLogFile).size,
          newFile: testLogFile,
          newFileSize: fs.statSync(testLogFile).size
        };
        
        // Clean up test files
        fs.unlinkSync(testLogFile);
        fs.unlinkSync(rotatedLogFile);
        
        return {
          status: 'passed',
          message: `Log file operations successful (${results.logEntries.length} entries, rotation tested)`,
          details: results
        };
      } catch (error) {
        // Clean up on error
        try {
          if (fs.existsSync(testLogFile)) {
            fs.unlinkSync(testLogFile);
          }
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        
        return {
          status: 'failed',
          message: `Log file test failed: ${error.message}`,
          details: { error: error.message, logDir, testLogFile }
        };
      }
    }
  },

  {
    name: 'Error Tracking and Reporting',
    function: async () => {
      const results = {
        errorTypes: [],
        handledErrors: 0,
        unhandledErrors: 0,
        errorPatterns: []
      };
      
      const originalErrorHandlers = {
        uncaughtException: process.listeners('uncaughtException'),
        unhandledRejection: process.listeners('unhandledRejection')
      };
      
      try {
        // Test synchronous error handling
        try {
          throw new Error('Test synchronous error');
        } catch (error) {
          results.errorTypes.push({
            type: 'synchronous',
            message: error.message,
            handled: true
          });
          results.handledErrors++;
        }
        
        // Test asynchronous error handling
        try {
          await new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('Test async error')), 10);
          });
        } catch (error) {
          results.errorTypes.push({
            type: 'asynchronous',
            message: error.message,
            handled: true
          });
          results.handledErrors++;
        }
        
        // Test error serialization
        const testError = new Error('Test error with stack');
        testError.code = 'TEST_ERROR';
        testError.details = { component: 'test', operation: 'error-tracking' };
        
        const serializedError = {
          message: testError.message,
          stack: testError.stack,
          code: testError.code,
          details: testError.details,
          timestamp: new Date().toISOString()
        };
        
        results.errorPatterns.push({
          original: {
            message: testError.message,
            hasStack: !!testError.stack,
            hasCode: !!testError.code,
            hasDetails: !!testError.details
          },
          serialized: {
            size: JSON.stringify(serializedError).length,
            keys: Object.keys(serializedError)
          }
        });
        
        // Test error categorization
        const errorCategories = [
          { type: 'DatabaseError', code: 'DB_CONNECTION_FAILED' },
          { type: 'ValidationError', code: 'INVALID_INPUT' },
          { type: 'AuthenticationError', code: 'UNAUTHORIZED' },
          { type: 'NetworkError', code: 'TIMEOUT' }
        ];
        
        errorCategories.forEach(category => {
          const error = new Error(`Test ${category.type}`);
          error.code = category.code;
          error.category = category.type;
          
          results.errorPatterns.push({
            category: category.type,
            code: category.code,
            categorized: true
          });
        });
        
        return {
          status: 'passed',
          message: `Error tracking is functional (${results.handledErrors} errors handled, ${results.errorPatterns.length} patterns tested)`,
          details: results
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Error tracking test failed: ${error.message}`,
          details: { error: error.message, results }
        };
      }
    }
  },

  {
    name: 'Performance Monitoring Setup',
    function: async () => {
      const results = {
        memoryMonitoring: {},
        performanceMarks: [],
        timingMeasurements: [],
        resourceUsage: {}
      };
      
      try {
        // Test memory monitoring
        const memoryUsage = process.memoryUsage();
        results.memoryMonitoring = {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external,
          rss: memoryUsage.rss,
          heapUsedMB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
          heapTotalMB: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2)
        };
        
        // Test performance timing
        const startTime = Date.now();
        
        // Simulate some work
        const testOperations = [
          () => JSON.stringify({ test: 'data', array: new Array(1000).fill(0) }),
          () => new Array(1000).fill(0).map((_, i) => i * 2),
          () => new Promise(resolve => setTimeout(resolve, 10))
        ];
        
        for (let i = 0; i < testOperations.length; i++) {
          const operationStart = Date.now();
          await testOperations[i]();
          const operationEnd = Date.now();
          
          results.timingMeasurements.push({
            operation: `test_operation_${i}`,
            duration: operationEnd - operationStart,
            timestamp: operationStart
          });
        }
        
        const totalTime = Date.now() - startTime;
        
        // Test performance marks (Node.js performance API)
        if (performance && performance.mark) {
          performance.mark('test-start');
          
          // Simulate work
          await new Promise(resolve => setTimeout(resolve, 5));
          
          performance.mark('test-end');
          
          if (performance.measure) {
            performance.measure('test-duration', 'test-start', 'test-end');
            
            results.performanceMarks = [
              { name: 'test-start', supported: true },
              { name: 'test-end', supported: true },
              { name: 'test-duration', supported: true }
            ];
          }
        } else {
          results.performanceMarks.push({
            name: 'performance-api',
            supported: false,
            fallback: 'Using Date.now() for timing'
          });
        }
        
        // Test resource usage monitoring
        if (process.cpuUsage) {
          const cpuUsage = process.cpuUsage();
          results.resourceUsage.cpu = {
            user: cpuUsage.user,
            system: cpuUsage.system,
            userMs: cpuUsage.user / 1000,
            systemMs: cpuUsage.system / 1000
          };
        }
        
        results.resourceUsage.uptime = process.uptime();
        results.resourceUsage.platform = process.platform;
        results.resourceUsage.nodeVersion = process.version;
        
        const avgOperationTime = results.timingMeasurements.reduce((sum, m) => sum + m.duration, 0) / results.timingMeasurements.length;
        
        if (avgOperationTime > 100) {
          return {
            status: 'warning',
            message: `Performance monitoring working but slow operations detected (avg: ${avgOperationTime.toFixed(2)}ms)`,
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: `Performance monitoring is functional (${results.timingMeasurements.length} measurements, avg: ${avgOperationTime.toFixed(2)}ms)`,
          details: results
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Performance monitoring test failed: ${error.message}`,
          details: { error: error.message, results }
        };
      }
    }
  },

  {
    name: 'Application Health Metrics',
    function: async () => {
      const results = {
        healthChecks: [],
        metrics: {},
        systemInfo: {},
        applicationStatus: {}
      };
      
      try {
        // Basic health checks
        const healthChecks = [
          {
            name: 'memory_usage',
            check: () => {
              const usage = process.memoryUsage();
              const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
              return {
                status: heapUsedPercent < 90 ? 'healthy' : 'warning',
                value: heapUsedPercent.toFixed(2) + '%',
                raw: usage
              };
            }
          },
          {
            name: 'uptime',
            check: () => {
              const uptime = process.uptime();
              return {
                status: uptime > 0 ? 'healthy' : 'error',
                value: uptime.toFixed(2) + 's',
                raw: uptime
              };
            }
          },
          {
            name: 'event_loop_delay',
            check: () => {
              const start = Date.now();
              return new Promise(resolve => {
                setImmediate(() => {
                  const delay = Date.now() - start;
                  resolve({
                    status: delay < 10 ? 'healthy' : 'warning',
                    value: delay + 'ms',
                    raw: delay
                  });
                });
              });
            }
          }
        ];
        
        // Execute health checks
        for (const healthCheck of healthChecks) {
          try {
            const result = await healthCheck.check();
            results.healthChecks.push({
              name: healthCheck.name,
              ...result,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            results.healthChecks.push({
              name: healthCheck.name,
              status: 'error',
              error: error.message,
              timestamp: new Date().toISOString()
            });
          }
        }
        
        // Collect system metrics
        results.systemInfo = {
          platform: process.platform,
          arch: process.arch,
          nodeVersion: process.version,
          pid: process.pid,
          ppid: process.ppid,
          cwd: process.cwd()
        };
        
        // Application-specific metrics
        results.applicationStatus = {
          environment: process.env.NODE_ENV || 'development',
          hasEnvVars: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
          packageManager: fs.existsSync(path.join(process.cwd(), 'package-lock.json')) ? 'npm' : 
                        fs.existsSync(path.join(process.cwd(), 'yarn.lock')) ? 'yarn' : 'unknown'
        };
        
        // Calculate overall health score
        const healthyChecks = results.healthChecks.filter(c => c.status === 'healthy').length;
        const totalChecks = results.healthChecks.length;
        const healthScore = (healthyChecks / totalChecks) * 100;
        
        results.metrics.healthScore = healthScore;
        results.metrics.healthyChecks = healthyChecks;
        results.metrics.totalChecks = totalChecks;
        
        if (healthScore < 70) {
          return {
            status: 'failed',
            message: `Poor application health score: ${healthScore.toFixed(1)}%`,
            details: results
          };
        }
        
        if (healthScore < 90) {
          return {
            status: 'warning',
            message: `Moderate application health score: ${healthScore.toFixed(1)}%`,
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: `Application health monitoring is functional (score: ${healthScore.toFixed(1)}%)`,
          details: results
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Health metrics test failed: ${error.message}`,
          details: { error: error.message, results }
        };
      }
    }
  },

  {
    name: 'Log Analysis and Alerting',
    function: async () => {
      const logDir = path.join(process.cwd(), 'logs');
      const testLogFile = path.join(logDir, 'analysis-test.log');
      
      try {
        // Ensure log directory exists
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
        
        const results = {
          logFile: testLogFile,
          logEntries: [],
          patterns: {},
          alerts: [],
          analysis: {}
        };
        
        // Create test log entries with various patterns
        const testLogs = [
          'INFO: Application started successfully',
          'DEBUG: User authentication attempt',
          'ERROR: Database connection failed - connection timeout',
          'WARN: High memory usage detected - 85% heap utilization',
          'ERROR: Failed to process payment - payment_gateway_timeout',
          'INFO: User session created',
          'ERROR: Database connection failed - connection timeout',
          'WARN: Rate limit approaching for user 123',
          'ERROR: Unhandled exception in payment processor',
          'INFO: Backup completed successfully'
        ];
        
        // Write test logs
        testLogs.forEach((log, index) => {
          const timestamp = new Date(Date.now() + index * 1000).toISOString();
          const logLine = `[${timestamp}] ${log}\n`;
          fs.appendFileSync(testLogFile, logLine);
          results.logEntries.push({ timestamp, message: log });
        });
        
        // Analyze log patterns
        const logContent = fs.readFileSync(testLogFile, 'utf8');
        const lines = logContent.split('\n').filter(line => line.trim());
        
        results.patterns = {
          totalLines: lines.length,
          errorCount: lines.filter(line => line.includes('ERROR')).length,
          warningCount: lines.filter(line => line.includes('WARN')).length,
          infoCount: lines.filter(line => line.includes('INFO')).length,
          debugCount: lines.filter(line => line.includes('DEBUG')).length
        };
        
        // Detect alert patterns
        const alertPatterns = [
          { pattern: /ERROR.*Database connection failed/gi, severity: 'high', description: 'Database connectivity issues' },
          { pattern: /WARN.*High memory usage/gi, severity: 'medium', description: 'Memory usage warning' },
          { pattern: /ERROR.*payment/gi, severity: 'high', description: 'Payment processing errors' },
          { pattern: /Rate limit/gi, severity: 'medium', description: 'Rate limiting alerts' }
        ];
        
        alertPatterns.forEach(alertPattern => {
          const matches = logContent.match(alertPattern.pattern);
          if (matches) {
            results.alerts.push({
              pattern: alertPattern.description,
              severity: alertPattern.severity,
              count: matches.length,
              matches: matches.slice(0, 3) // Show first 3 matches
            });
          }
        });
        
        // Analysis summary
        results.analysis = {
          errorRate: (results.patterns.errorCount / results.patterns.totalLines) * 100,
          warningRate: (results.patterns.warningCount / results.patterns.totalLines) * 100,
          alertCount: results.alerts.length,
          highSeverityAlerts: results.alerts.filter(a => a.severity === 'high').length
        };
        
        // Clean up test file
        fs.unlinkSync(testLogFile);
        
        if (results.analysis.highSeverityAlerts > 0) {
          return {
            status: 'warning',
            message: `Log analysis detected ${results.analysis.highSeverityAlerts} high-severity patterns`,
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: `Log analysis functional (${results.patterns.totalLines} entries, ${results.alerts.length} alert patterns)`,
          details: results
        };
      } catch (error) {
        // Clean up on error
        try {
          if (fs.existsSync(testLogFile)) {
            fs.unlinkSync(testLogFile);
          }
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        
        return {
          status: 'failed',
          message: `Log analysis test failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  }
];

module.exports = { tests };