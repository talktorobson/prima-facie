/**
 * Health Check Endpoints Tests
 * Tests application health endpoints, service status, and monitoring readiness
 */

const https = require('https');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');

const tests = [
  {
    name: 'Basic Application Health Check',
    function: async () => {
      const results = {
        applicationStatus: {},
        dependencies: {},
        systemHealth: {},
        metrics: {}
      };
      
      try {
        // Check Node.js process health
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        results.systemHealth = {
          uptime: process.uptime(),
          memoryUsage: {
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            external: memoryUsage.external,
            rss: memoryUsage.rss,
            heapUsedMB: Number((memoryUsage.heapUsed / 1024 / 1024).toFixed(2)),
            heapTotalMB: Number((memoryUsage.heapTotal / 1024 / 1024).toFixed(2))
          },
          cpuUsage: {
            user: cpuUsage.user,
            system: cpuUsage.system,
            userMs: Number((cpuUsage.user / 1000).toFixed(2)),
            systemMs: Number((cpuUsage.system / 1000).toFixed(2))
          },
          platform: process.platform,
          nodeVersion: process.version,
          pid: process.pid
        };
        
        // Check application configuration
        results.applicationStatus = {
          environment: process.env.NODE_ENV || 'unknown',
          hasRequiredEnvVars: !!(
            process.env.NEXT_PUBLIC_SUPABASE_URL && 
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          ),
          configurationValid: true
        };
        
        // Check critical dependencies
        const dependencyChecks = [
          {
            name: 'supabase-js',
            check: () => {
              try {
                const supabase = createClient(
                  process.env.NEXT_PUBLIC_SUPABASE_URL,
                  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                );
                return { status: 'available', client: !!supabase };
              } catch (error) {
                return { status: 'error', error: error.message };
              }
            }
          },
          {
            name: 'filesystem',
            check: () => {
              try {
                const fs = require('fs');
                const testPath = '/tmp/health-check-test';
                fs.writeFileSync(testPath, 'test');
                fs.unlinkSync(testPath);
                return { status: 'available' };
              } catch (error) {
                return { status: 'error', error: error.message };
              }
            }
          }
        ];
        
        results.dependencies = {};
        for (const dep of dependencyChecks) {
          results.dependencies[dep.name] = dep.check();
        }
        
        // Calculate health metrics
        const heapUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
        const uptimeHours = process.uptime() / 3600;
        
        results.metrics = {
          heapUsagePercent: Number(heapUsagePercent.toFixed(2)),
          uptimeHours: Number(uptimeHours.toFixed(2)),
          dependenciesHealthy: Object.values(results.dependencies).filter(d => d.status === 'available').length,
          totalDependencies: Object.keys(results.dependencies).length
        };
        
        // Determine health status
        const criticalIssues = [];
        
        if (heapUsagePercent > 90) {
          criticalIssues.push('High memory usage');
        }
        
        if (!results.applicationStatus.hasRequiredEnvVars) {
          criticalIssues.push('Missing required environment variables');
        }
        
        if (results.metrics.dependenciesHealthy < results.metrics.totalDependencies) {
          criticalIssues.push('Some dependencies are unhealthy');
        }
        
        if (criticalIssues.length > 1) {
          return {
            status: 'failed',
            message: `Application health check failed: ${criticalIssues.join(', ')}`,
            details: results
          };
        }
        
        if (criticalIssues.length > 0) {
          return {
            status: 'warning',
            message: `Application health issues: ${criticalIssues.join(', ')}`,
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: `Application is healthy (uptime: ${results.metrics.uptimeHours.toFixed(1)}h, heap: ${results.metrics.heapUsagePercent}%)`,
          details: results
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Health check failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Database Health Check',
    function: async () => {
      const results = {
        connectionTest: {},
        queryPerformance: {},
        accessControls: {},
        dataIntegrity: {}
      };
      
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        // Test database connection
        const connectionStartTime = Date.now();
        try {
          const { data, error } = await supabase
            .from('information_schema.schemata')
            .select('schema_name')
            .limit(1);
          
          const connectionTime = Date.now() - connectionStartTime;
          
          results.connectionTest = {
            successful: !error || error.message.includes('permission'),
            responseTime: connectionTime,
            error: error ? error.message : null
          };
        } catch (error) {
          results.connectionTest = {
            successful: false,
            responseTime: Date.now() - connectionStartTime,
            error: error.message
          };
        }
        
        // Test query performance
        const performanceTests = [];
        const queries = [
          () => supabase.from('information_schema.tables').select('table_name').limit(5),
          () => supabase.from('information_schema.columns').select('column_name').limit(10)
        ];
        
        for (let i = 0; i < queries.length; i++) {
          const queryStartTime = Date.now();
          try {
            const { data, error } = await queries[i]();
            const queryTime = Date.now() - queryStartTime;
            
            performanceTests.push({
              query: i + 1,
              success: !error || error.message.includes('permission'),
              responseTime: queryTime,
              resultCount: data ? data.length : 0,
              error: error ? error.message : null
            });
          } catch (error) {
            performanceTests.push({
              query: i + 1,
              success: false,
              responseTime: Date.now() - queryStartTime,
              error: error.message
            });
          }
        }
        
        const successfulQueries = performanceTests.filter(t => t.success);
        results.queryPerformance = {
          totalQueries: performanceTests.length,
          successfulQueries: successfulQueries.length,
          avgResponseTime: successfulQueries.length > 0 ? 
            Number((successfulQueries.reduce((sum, t) => sum + t.responseTime, 0) / successfulQueries.length).toFixed(2)) : 0,
          tests: performanceTests
        };
        
        // Test access controls
        try {
          const { data: unauthorizedData, error: unauthorizedError } = await supabase
            .from('users')
            .select('*');
          
          results.accessControls = {
            rlsActive: !!unauthorizedError && (
              unauthorizedError.code === 'PGRST116' || 
              unauthorizedError.message.includes('permission') ||
              unauthorizedError.message.includes('policy')
            ),
            hasUnauthorizedAccess: !unauthorizedError && unauthorizedData && unauthorizedData.length > 0,
            error: unauthorizedError ? unauthorizedError.message : null
          };
        } catch (error) {
          results.accessControls = {
            rlsActive: true,
            error: error.message
          };
        }
        
        // Test with service role if available
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          try {
            const serviceSupabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL,
              process.env.SUPABASE_SERVICE_ROLE_KEY
            );
            
            const { data: serviceData, error: serviceError } = await serviceSupabase
              .from('information_schema.tables')
              .select('table_name')
              .eq('table_schema', 'public')
              .limit(5);
            
            results.dataIntegrity = {
              serviceRoleWorking: !serviceError,
              tablesAccessible: serviceData ? serviceData.length : 0,
              error: serviceError ? serviceError.message : null
            };
          } catch (error) {
            results.dataIntegrity = {
              serviceRoleWorking: false,
              error: error.message
            };
          }
        }
        
        // Evaluate database health
        const dbIssues = [];
        
        if (!results.connectionTest.successful) {
          dbIssues.push('Database connection failed');
        }
        
        if (results.connectionTest.responseTime > 2000) {
          dbIssues.push('Slow database connection');
        }
        
        if (results.queryPerformance.successfulQueries === 0) {
          dbIssues.push('All database queries failed');
        }
        
        if (results.queryPerformance.avgResponseTime > 1000) {
          dbIssues.push('Slow query performance');
        }
        
        if (results.accessControls.hasUnauthorizedAccess) {
          dbIssues.push('Security issue: unauthorized data access');
        }
        
        if (process.env.SUPABASE_SERVICE_ROLE_KEY && !results.dataIntegrity.serviceRoleWorking) {
          dbIssues.push('Service role authentication failed');
        }
        
        if (dbIssues.length > 2) {
          return {
            status: 'failed',
            message: `Database health check failed: ${dbIssues.slice(0, 2).join(', ')}...`,
            details: results
          };
        }
        
        if (dbIssues.length > 0) {
          return {
            status: 'warning',
            message: `Database health issues: ${dbIssues.join(', ')}`,
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: `Database is healthy (${results.queryPerformance.avgResponseTime}ms avg response, ${results.queryPerformance.successfulQueries}/${results.queryPerformance.totalQueries} queries successful)`,
          details: results
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Database health check failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'External Services Health Check',
    function: async () => {
      const results = {
        supabaseAPI: {},
        dnsResolution: {},
        networkConnectivity: {},
        serviceStatus: {}
      };
      
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        
        if (!supabaseUrl) {
          return {
            status: 'failed',
            message: 'Supabase URL not configured',
            details: results
          };
        }
        
        const parsedUrl = new URL(supabaseUrl);
        
        // Test DNS resolution
        const dns = require('dns').promises;
        try {
          const dnsStartTime = Date.now();
          const addresses = await dns.lookup(parsedUrl.hostname);
          const dnsTime = Date.now() - dnsStartTime;
          
          results.dnsResolution = {
            successful: true,
            hostname: parsedUrl.hostname,
            addresses: Array.isArray(addresses) ? addresses : [addresses],
            responseTime: dnsTime
          };
        } catch (error) {
          results.dnsResolution = {
            successful: false,
            hostname: parsedUrl.hostname,
            error: error.message
          };
        }
        
        // Test Supabase API health
        return new Promise((resolve) => {
          const options = {
            hostname: parsedUrl.hostname,
            port: 443,
            path: '/rest/v1/',
            method: 'HEAD',
            timeout: 10000,
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
              'User-Agent': 'Prima-Facie-Health-Check'
            }
          };
          
          const startTime = Date.now();
          const req = https.request(options, (res) => {
            const responseTime = Date.now() - startTime;
            
            results.supabaseAPI = {
              accessible: true,
              statusCode: res.statusCode,
              responseTime,
              headers: {
                server: res.headers.server,
                contentType: res.headers['content-type'],
                cacheControl: res.headers['cache-control']
              }
            };
            
            // Test network connectivity quality
            results.networkConnectivity = {
              latency: responseTime,
              quality: responseTime < 100 ? 'excellent' : 
                      responseTime < 300 ? 'good' : 
                      responseTime < 1000 ? 'fair' : 'poor'
            };
            
            // Overall service status
            const servicesHealthy = [
              results.dnsResolution.successful,
              results.supabaseAPI.accessible,
              responseTime < 5000
            ].filter(Boolean).length;
            
            results.serviceStatus = {
              totalServices: 3,
              healthyServices: servicesHealthy,
              healthScore: Number(((servicesHealthy / 3) * 100).toFixed(2))
            };
            
            // Determine status
            if (results.serviceStatus.healthScore < 70) {
              resolve({
                status: 'failed',
                message: `External services unhealthy: ${results.serviceStatus.healthScore}% health score`,
                details: results
              });
            } else if (results.serviceStatus.healthScore < 100) {
              resolve({
                status: 'warning',
                message: `Some external service issues: ${results.serviceStatus.healthScore}% health score`,
                details: results
              });
            } else {
              resolve({
                status: 'passed',
                message: `All external services healthy (${responseTime}ms response time)`,
                details: results
              });
            }
          });
          
          req.on('error', (error) => {
            results.supabaseAPI = {
              accessible: false,
              error: error.message
            };
            
            results.networkConnectivity = {
              error: error.message,
              quality: 'unavailable'
            };
            
            results.serviceStatus = {
              totalServices: 3,
              healthyServices: results.dnsResolution.successful ? 1 : 0,
              healthScore: results.dnsResolution.successful ? 33.33 : 0
            };
            
            resolve({
              status: 'failed',
              message: `External service connection failed: ${error.message}`,
              details: results
            });
          });
          
          req.on('timeout', () => {
            req.destroy();
            resolve({
              status: 'failed',
              message: 'External service health check timed out',
              details: results
            });
          });
          
          req.end();
        });
      } catch (error) {
        return {
          status: 'failed',
          message: `External services health check failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Resource Utilization Health Check',
    function: async () => {
      const results = {
        memory: {},
        cpu: {},
        diskSpace: {},
        networkResources: {},
        recommendations: []
      };
      
      try {
        // Memory utilization
        const memoryUsage = process.memoryUsage();
        const heapUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
        
        results.memory = {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external,
          rss: memoryUsage.rss,
          heapUsedMB: Number((memoryUsage.heapUsed / 1024 / 1024).toFixed(2)),
          heapTotalMB: Number((memoryUsage.heapTotal / 1024 / 1024).toFixed(2)),
          heapUsagePercent: Number(heapUsagePercent.toFixed(2)),
          status: heapUsagePercent < 70 ? 'healthy' : 
                  heapUsagePercent < 85 ? 'warning' : 'critical'
        };
        
        // CPU utilization
        const cpuUsage = process.cpuUsage();
        const uptime = process.uptime();
        
        results.cpu = {
          user: cpuUsage.user,
          system: cpuUsage.system,
          userMs: Number((cpuUsage.user / 1000).toFixed(2)),
          systemMs: Number((cpuUsage.system / 1000).toFixed(2)),
          uptime: Number(uptime.toFixed(2)),
          uptimeHours: Number((uptime / 3600).toFixed(2)),
          status: uptime > 3600 ? 'healthy' : 'starting'
        };
        
        // System information
        const os = require('os');
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const systemMemoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;
        
        results.systemResources = {
          totalMemoryMB: Number((totalMemory / 1024 / 1024).toFixed(2)),
          freeMemoryMB: Number((freeMemory / 1024 / 1024).toFixed(2)),
          systemMemoryUsagePercent: Number(systemMemoryUsage.toFixed(2)),
          cpuCount: os.cpus().length,
          platform: os.platform(),
          arch: os.arch()
        };
        
        // Test network resource usage
        const networkStartTime = Date.now();
        try {
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          );
          
          const { data, error } = await supabase
            .from('information_schema.schemata')
            .select('schema_name')
            .limit(1);
          
          const networkTime = Date.now() - networkStartTime;
          
          results.networkResources = {
            testRequestTime: networkTime,
            networkHealthy: networkTime < 2000,
            status: networkTime < 500 ? 'excellent' : 
                   networkTime < 1000 ? 'good' : 
                   networkTime < 2000 ? 'fair' : 'poor'
          };
        } catch (error) {
          results.networkResources = {
            testRequestTime: Date.now() - networkStartTime,
            networkHealthy: false,
            error: error.message,
            status: 'unavailable'
          };
        }
        
        // Generate recommendations
        if (results.memory.heapUsagePercent > 85) {
          results.recommendations.push('High memory usage - consider memory optimization');
        }
        
        if (results.systemResources.systemMemoryUsagePercent > 90) {
          results.recommendations.push('System memory usage is very high');
        }
        
        if (results.networkResources.testRequestTime > 1000) {
          results.recommendations.push('Network latency is high - check connectivity');
        }
        
        if (results.cpu.uptimeHours < 1) {
          results.recommendations.push('Application recently started - monitor stability');
        }
        
        // Calculate overall resource health score
        const healthFactors = [
          results.memory.status === 'healthy' ? 1 : results.memory.status === 'warning' ? 0.5 : 0,
          results.cpu.status === 'healthy' ? 1 : 0.5,
          results.networkResources.networkHealthy ? 1 : 0,
          results.systemResources.systemMemoryUsagePercent < 80 ? 1 : 0.5
        ];
        
        const healthScore = (healthFactors.reduce((sum, factor) => sum + factor, 0) / healthFactors.length) * 100;
        
        results.overallHealth = {
          score: Number(healthScore.toFixed(2)),
          status: healthScore >= 80 ? 'healthy' : 
                  healthScore >= 60 ? 'warning' : 'critical'
        };
        
        // Determine final status
        if (results.overallHealth.status === 'critical') {
          return {
            status: 'failed',
            message: `Critical resource utilization issues (health score: ${results.overallHealth.score}%)`,
            details: results
          };
        }
        
        if (results.overallHealth.status === 'warning' || results.recommendations.length > 2) {
          return {
            status: 'warning',
            message: `Resource utilization concerns (health score: ${results.overallHealth.score}%, ${results.recommendations.length} recommendations)`,
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: `Resource utilization is healthy (health score: ${results.overallHealth.score}%, memory: ${results.memory.heapUsagePercent}%)`,
          details: results
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Resource utilization health check failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  }
];

module.exports = { tests };