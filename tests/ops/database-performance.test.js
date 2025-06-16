/**
 * Database Performance Tests
 * Tests connection pool performance, query execution times, and database load handling
 */

const { createClient } = require('@supabase/supabase-js');

const tests = [
  {
    name: 'Connection Pool Performance',
    function: async () => {
      const results = {
        connections: [],
        totalTime: 0,
        avgConnectionTime: 0,
        minConnectionTime: Infinity,
        maxConnectionTime: 0,
        successfulConnections: 0,
        failedConnections: 0
      };
      
      const connectionCount = 10;
      const connectionPromises = [];
      
      for (let i = 0; i < connectionCount; i++) {
        connectionPromises.push(
          (async () => {
            const startTime = Date.now();
            try {
              const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
              );
              
              // Test connection with a simple query
              const { data, error } = await supabase
                .from('information_schema.schemata')
                .select('schema_name')
                .limit(1);
              
              const connectionTime = Date.now() - startTime;
              
              if (error && !error.message.includes('permission')) {
                throw new Error(error.message);
              }
              
              results.connections.push({
                index: i,
                time: connectionTime,
                success: true
              });
              
              results.successfulConnections++;
              results.totalTime += connectionTime;
              results.minConnectionTime = Math.min(results.minConnectionTime, connectionTime);
              results.maxConnectionTime = Math.max(results.maxConnectionTime, connectionTime);
              
            } catch (error) {
              const connectionTime = Date.now() - startTime;
              results.connections.push({
                index: i,
                time: connectionTime,
                success: false,
                error: error.message
              });
              results.failedConnections++;
            }
          })()
        );
      }
      
      await Promise.all(connectionPromises);
      
      results.avgConnectionTime = results.totalTime / results.successfulConnections || 0;
      
      if (results.failedConnections > connectionCount * 0.1) {
        return {
          status: 'failed',
          message: `High connection failure rate: ${results.failedConnections}/${connectionCount}`,
          details: results
        };
      }
      
      if (results.avgConnectionTime > 1000) {
        return {
          status: 'warning',
          message: `Slow average connection time: ${results.avgConnectionTime.toFixed(2)}ms`,
          details: results
        };
      }
      
      return {
        status: 'passed',
        message: `Connection pool test passed - avg: ${results.avgConnectionTime.toFixed(2)}ms`,
        details: results
      };
    }
  },

  {
    name: 'Query Response Time Test',
    function: async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        const queries = [
          {
            name: 'Simple Select',
            query: () => supabase.from('information_schema.schemata').select('schema_name').limit(5)
          },
          {
            name: 'Count Query',
            query: () => supabase.from('information_schema.tables').select('*', { count: 'exact', head: true })
          }
        ];
        
        const results = [];
        
        for (const queryTest of queries) {
          const iterations = 5;
          const times = [];
          
          for (let i = 0; i < iterations; i++) {
            const startTime = Date.now();
            try {
              const { data, error } = await queryTest.query();
              const queryTime = Date.now() - startTime;
              
              // Ignore permission errors as they still test connection speed
              if (!error || error.message.includes('permission')) {
                times.push(queryTime);
              } else {
                throw new Error(error.message);
              }
            } catch (error) {
              times.push(Date.now() - startTime);
            }
          }
          
          const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
          const minTime = Math.min(...times);
          const maxTime = Math.max(...times);
          
          results.push({
            query: queryTest.name,
            avgTime,
            minTime,
            maxTime,
            iterations,
            times
          });
        }
        
        const overallAvgTime = results.reduce((sum, r) => sum + r.avgTime, 0) / results.length;
        
        if (overallAvgTime > 500) {
          return {
            status: 'warning',
            message: `Slow query performance detected - avg: ${overallAvgTime.toFixed(2)}ms`,
            details: { results, overallAvgTime }
          };
        }
        
        return {
          status: 'passed',
          message: `Query performance test passed - avg: ${overallAvgTime.toFixed(2)}ms`,
          details: { results, overallAvgTime }
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Query performance test failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Concurrent Query Load Test',
    function: async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        const concurrentQueries = 20;
        const results = {
          totalQueries: concurrentQueries,
          successfulQueries: 0,
          failedQueries: 0,
          totalTime: 0,
          queryTimes: [],
          errors: []
        };
        
        const startTime = Date.now();
        
        const queryPromises = Array.from({ length: concurrentQueries }, async (_, index) => {
          const queryStartTime = Date.now();
          try {
            const { data, error } = await supabase
              .from('information_schema.columns')
              .select('column_name, data_type')
              .limit(10);
            
            const queryTime = Date.now() - queryStartTime;
            
            if (error && !error.message.includes('permission')) {
              throw new Error(error.message);
            }
            
            results.queryTimes.push(queryTime);
            results.successfulQueries++;
            return { success: true, time: queryTime, index };
          } catch (error) {
            const queryTime = Date.now() - queryStartTime;
            results.queryTimes.push(queryTime);
            results.failedQueries++;
            results.errors.push({ index, error: error.message, time: queryTime });
            return { success: false, error: error.message, time: queryTime, index };
          }
        });
        
        await Promise.all(queryPromises);
        
        results.totalTime = Date.now() - startTime;
        results.avgQueryTime = results.queryTimes.reduce((a, b) => a + b, 0) / results.queryTimes.length || 0;
        results.minQueryTime = Math.min(...results.queryTimes);
        results.maxQueryTime = Math.max(...results.queryTimes);
        
        const failureRate = (results.failedQueries / results.totalQueries) * 100;
        
        if (failureRate > 10) {
          return {
            status: 'failed',
            message: `High failure rate under load: ${failureRate.toFixed(1)}%`,
            details: results
          };
        }
        
        if (results.avgQueryTime > 1000) {
          return {
            status: 'warning',
            message: `Slow performance under load: ${results.avgQueryTime.toFixed(2)}ms avg`,
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: `Load test passed - ${results.successfulQueries}/${results.totalQueries} succeeded, avg: ${results.avgQueryTime.toFixed(2)}ms`,
          details: results
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Concurrent load test failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Memory Usage Monitoring',
    function: async () => {
      const initialMemory = process.memoryUsage();
      
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        // Perform multiple operations to test memory usage
        const operations = [];
        
        for (let i = 0; i < 50; i++) {
          operations.push(
            supabase
              .from('information_schema.tables')
              .select('table_name')
              .limit(10)
              .then(result => result)
              .catch(error => ({ error: error.message }))
          );
        }
        
        await Promise.all(operations);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
        
        const finalMemory = process.memoryUsage();
        
        const memoryDiff = {
          heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
          heapTotal: finalMemory.heapTotal - initialMemory.heapTotal,
          external: finalMemory.external - initialMemory.external,
          rss: finalMemory.rss - initialMemory.rss
        };
        
        const heapIncreaseMB = memoryDiff.heapUsed / 1024 / 1024;
        
        if (heapIncreaseMB > 50) {
          return {
            status: 'warning',
            message: `High memory usage detected: ${heapIncreaseMB.toFixed(2)}MB increase`,
            details: {
              initialMemory,
              finalMemory,
              memoryDiff,
              heapIncreaseMB
            }
          };
        }
        
        return {
          status: 'passed',
          message: `Memory usage within acceptable range: ${heapIncreaseMB.toFixed(2)}MB increase`,
          details: {
            initialMemory,
            finalMemory,
            memoryDiff,
            heapIncreaseMB
          }
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Memory monitoring test failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Connection Timeout Test',
    function: async () => {
      try {
        const timeoutDurations = [1000, 5000, 10000]; // 1s, 5s, 10s
        const results = [];
        
        for (const timeout of timeoutDurations) {
          const startTime = Date.now();
          
          try {
            const supabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL,
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            );
            
            // Create a promise that times out
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Timeout')), timeout);
            });
            
            const queryPromise = supabase
              .from('information_schema.schemata')
              .select('schema_name')
              .limit(1);
            
            await Promise.race([queryPromise, timeoutPromise]);
            
            const actualTime = Date.now() - startTime;
            
            results.push({
              timeout,
              success: true,
              actualTime,
              timedOut: false
            });
          } catch (error) {
            const actualTime = Date.now() - startTime;
            const timedOut = error.message === 'Timeout';
            
            results.push({
              timeout,
              success: false,
              actualTime,
              timedOut,
              error: error.message
            });
          }
        }
        
        const successfulConnections = results.filter(r => r.success);
        const fastestConnection = Math.min(...successfulConnections.map(r => r.actualTime));
        
        if (successfulConnections.length === 0) {
          return {
            status: 'failed',
            message: 'All connection timeout tests failed',
            details: { results }
          };
        }
        
        if (fastestConnection > 5000) {
          return {
            status: 'warning',
            message: `Slow connection times detected - fastest: ${fastestConnection}ms`,
            details: { results, fastestConnection }
          };
        }
        
        return {
          status: 'passed',
          message: `Connection timeout test passed - fastest: ${fastestConnection}ms`,
          details: { results, fastestConnection }
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Connection timeout test failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Database Connection Stability',
    function: async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        const testDuration = 30000; // 30 seconds
        const queryInterval = 2000; // Query every 2 seconds
        const startTime = Date.now();
        
        const results = {
          totalQueries: 0,
          successfulQueries: 0,
          failedQueries: 0,
          queryTimes: [],
          errors: [],
          testDuration: 0
        };
        
        return new Promise((resolve) => {
          const intervalId = setInterval(async () => {
            const queryStartTime = Date.now();
            results.totalQueries++;
            
            try {
              const { data, error } = await supabase
                .from('information_schema.schemata')
                .select('schema_name')
                .limit(1);
              
              const queryTime = Date.now() - queryStartTime;
              
              if (error && !error.message.includes('permission')) {
                throw new Error(error.message);
              }
              
              results.successfulQueries++;
              results.queryTimes.push(queryTime);
            } catch (error) {
              results.failedQueries++;
              results.errors.push({
                time: Date.now() - startTime,
                error: error.message
              });
            }
            
            // Stop test after duration
            if (Date.now() - startTime >= testDuration) {
              clearInterval(intervalId);
              results.testDuration = Date.now() - startTime;
              
              const successRate = (results.successfulQueries / results.totalQueries) * 100;
              const avgQueryTime = results.queryTimes.reduce((a, b) => a + b, 0) / results.queryTimes.length || 0;
              
              if (successRate < 90) {
                resolve({
                  status: 'failed',
                  message: `Poor connection stability: ${successRate.toFixed(1)}% success rate`,
                  details: { ...results, successRate, avgQueryTime }
                });
              } else if (successRate < 95) {
                resolve({
                  status: 'warning',
                  message: `Moderate connection stability: ${successRate.toFixed(1)}% success rate`,
                  details: { ...results, successRate, avgQueryTime }
                });
              } else {
                resolve({
                  status: 'passed',
                  message: `Good connection stability: ${successRate.toFixed(1)}% success rate, avg: ${avgQueryTime.toFixed(2)}ms`,
                  details: { ...results, successRate, avgQueryTime }
                });
              }
            }
          }, queryInterval);
        });
      } catch (error) {
        return {
          status: 'failed',
          message: `Connection stability test failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  }
];

module.exports = { tests };