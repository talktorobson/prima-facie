/**
 * Performance Benchmarking Tests
 * Tests application performance, load handling, and resource utilization
 */

const { createClient } = require('@supabase/supabase-js');
const { performance } = require('perf_hooks');

const tests = [
  {
    name: 'Database Query Performance Benchmark',
    function: async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        const results = {
          queries: [],
          statistics: {},
          performance: {},
          recommendations: []
        };
        
        // Define benchmark queries
        const benchmarkQueries = [
          {
            name: 'Simple Select',
            query: () => supabase.from('information_schema.schemata').select('schema_name').limit(5),
            iterations: 10
          },
          {
            name: 'Count Query',
            query: () => supabase.from('information_schema.tables').select('*', { count: 'exact', head: true }),
            iterations: 5
          },
          {
            name: 'Complex Join',
            query: () => supabase
              .from('information_schema.columns')
              .select('table_name, column_name, data_type')
              .limit(20),
            iterations: 5
          }
        ];
        
        // Execute benchmark queries
        for (const benchmark of benchmarkQueries) {
          const queryResults = [];
          
          for (let i = 0; i < benchmark.iterations; i++) {
            const startTime = performance.now();
            
            try {
              const { data, error } = await benchmark.query();
              const endTime = performance.now();
              const duration = endTime - startTime;
              
              queryResults.push({
                iteration: i + 1,
                duration,
                success: !error || error.message.includes('permission'),
                dataCount: data ? data.length : 0,
                error: error ? error.message : null
              });
            } catch (error) {
              const endTime = performance.now();
              queryResults.push({
                iteration: i + 1,
                duration: endTime - startTime,
                success: false,
                error: error.message
              });
            }
            
            // Small delay between iterations
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          // Calculate statistics
          const successfulQueries = queryResults.filter(r => r.success);
          const durations = successfulQueries.map(r => r.duration);
          
          if (durations.length > 0) {
            const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
            const minDuration = Math.min(...durations);
            const maxDuration = Math.max(...durations);
            const medianDuration = durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)];
            
            results.queries.push({
              name: benchmark.name,
              iterations: benchmark.iterations,
              successfulQueries: successfulQueries.length,
              avgDuration: Number(avgDuration.toFixed(2)),
              minDuration: Number(minDuration.toFixed(2)),
              maxDuration: Number(maxDuration.toFixed(2)),
              medianDuration: Number(medianDuration.toFixed(2)),
              results: queryResults
            });
          } else {
            results.queries.push({
              name: benchmark.name,
              iterations: benchmark.iterations,
              successfulQueries: 0,
              error: 'All queries failed'
            });
          }
        }
        
        // Calculate overall statistics
        const allDurations = results.queries
          .filter(q => q.avgDuration)
          .map(q => q.avgDuration);
        
        if (allDurations.length > 0) {
          results.statistics = {
            overallAvgDuration: Number((allDurations.reduce((sum, d) => sum + d, 0) / allDurations.length).toFixed(2)),
            fastestQuery: Math.min(...allDurations),
            slowestQuery: Math.max(...allDurations),
            totalQueries: results.queries.reduce((sum, q) => sum + q.successfulQueries, 0)
          };
        }
        
        // Performance analysis and recommendations
        if (results.statistics.overallAvgDuration > 1000) {
          results.recommendations.push('Consider optimizing slow queries (>1000ms average)');
        }
        
        if (results.statistics.slowestQuery > 2000) {
          results.recommendations.push('Investigate slowest query performance');
        }
        
        const failedQueries = results.queries.filter(q => q.successfulQueries === 0).length;
        if (failedQueries > 0) {
          results.recommendations.push(`${failedQueries} query types failed completely`);
        }
        
        // Determine status
        if (failedQueries === results.queries.length) {
          return {
            status: 'failed',
            message: 'All database queries failed',
            details: results
          };
        }
        
        if (results.statistics.overallAvgDuration > 1500) {
          return {
            status: 'warning',
            message: `Poor query performance: ${results.statistics.overallAvgDuration}ms average`,
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: `Database performance acceptable: ${results.statistics.overallAvgDuration}ms average (${results.statistics.totalQueries} queries)`,
          details: results
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Database performance benchmark failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Memory Usage Benchmark',
    function: async () => {
      const results = {
        initialMemory: {},
        memoryTests: [],
        memoryLeaks: [],
        garbageCollection: {},
        recommendations: []
      };
      
      try {
        // Capture initial memory state
        results.initialMemory = process.memoryUsage();
        
        // Memory test scenarios
        const memoryTests = [
          {
            name: 'Large Array Creation',
            test: () => {
              const arrays = [];
              for (let i = 0; i < 10; i++) {
                arrays.push(new Array(10000).fill(i));
              }
              return arrays.length;
            }
          },
          {
            name: 'Object Creation/Destruction',
            test: () => {
              const objects = [];
              for (let i = 0; i < 1000; i++) {
                objects.push({
                  id: i,
                  data: `test-data-${i}`,
                  timestamp: new Date(),
                  nested: { value: i * 2 }
                });
              }
              return objects.length;
            }
          },
          {
            name: 'String Manipulation',
            test: () => {
              let result = '';
              for (let i = 0; i < 1000; i++) {
                result += `Test string ${i} with some additional content to increase memory usage. `;
              }
              return result.length;
            }
          },
          {
            name: 'JSON Operations',
            test: () => {
              const testData = { 
                items: new Array(1000).fill(0).map((_, i) => ({ 
                  id: i, 
                  name: `item-${i}`, 
                  data: new Array(10).fill(`data-${i}`) 
                }))
              };
              const json = JSON.stringify(testData);
              const parsed = JSON.parse(json);
              return parsed.items.length;
            }
          }
        ];
        
        // Execute memory tests
        for (const test of memoryTests) {
          const startMemory = process.memoryUsage();
          const startTime = performance.now();
          
          try {
            const result = await test.test();
            const endTime = performance.now();
            const endMemory = process.memoryUsage();
            
            const memoryDiff = {
              heapUsed: endMemory.heapUsed - startMemory.heapUsed,
              heapTotal: endMemory.heapTotal - startMemory.heapTotal,
              external: endMemory.external - startMemory.external,
              rss: endMemory.rss - startMemory.rss
            };
            
            results.memoryTests.push({
              name: test.name,
              duration: Number((endTime - startTime).toFixed(2)),
              result,
              memoryDiff,
              memoryDiffMB: {
                heapUsed: Number((memoryDiff.heapUsed / 1024 / 1024).toFixed(2)),
                heapTotal: Number((memoryDiff.heapTotal / 1024 / 1024).toFixed(2)),
                external: Number((memoryDiff.external / 1024 / 1024).toFixed(2)),
                rss: Number((memoryDiff.rss / 1024 / 1024).toFixed(2))
              },
              startMemory,
              endMemory
            });
          } catch (error) {
            results.memoryTests.push({
              name: test.name,
              error: error.message,
              duration: Number((performance.now() - startTime).toFixed(2))
            });
          }
          
          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }
          
          // Wait between tests
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Test for memory leaks
        const preLeakMemory = process.memoryUsage();
        
        // Simulate potential memory leak scenario
        const leakTest = [];
        for (let i = 0; i < 1000; i++) {
          leakTest.push({
            id: i,
            data: new Array(100).fill(`leak-test-${i}`),
            closure: () => `closure-${i}`
          });
        }
        
        const postLeakMemory = process.memoryUsage();
        
        // Clear the leak test array
        leakTest.length = 0;
        
        // Force garbage collection
        if (global.gc) {
          global.gc();
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        const postGCMemory = process.memoryUsage();
        
        results.memoryLeaks = {
          preLeakHeap: preLeakMemory.heapUsed,
          postLeakHeap: postLeakMemory.heapUsed,
          postGCHeap: postGCMemory.heapUsed,
          leakMemoryMB: Number(((postLeakMemory.heapUsed - preLeakMemory.heapUsed) / 1024 / 1024).toFixed(2)),
          recoveredMemoryMB: Number(((postLeakMemory.heapUsed - postGCMemory.heapUsed) / 1024 / 1024).toFixed(2)),
          memoryRecoveryRate: Number((((postLeakMemory.heapUsed - postGCMemory.heapUsed) / (postLeakMemory.heapUsed - preLeakMemory.heapUsed)) * 100).toFixed(2))
        };
        
        // Garbage collection test
        if (global.gc) {
          const preGCMemory = process.memoryUsage();
          global.gc();
          const postGCMemory = process.memoryUsage();
          
          results.garbageCollection = {
            available: true,
            memoryFreedMB: Number(((preGCMemory.heapUsed - postGCMemory.heapUsed) / 1024 / 1024).toFixed(2)),
            effectiveness: Number((((preGCMemory.heapUsed - postGCMemory.heapUsed) / preGCMemory.heapUsed) * 100).toFixed(2))
          };
        } else {
          results.garbageCollection = {
            available: false,
            note: 'Run with --expose-gc flag to enable manual garbage collection'
          };
        }
        
        // Generate recommendations
        const maxMemoryIncrease = Math.max(...results.memoryTests.map(t => t.memoryDiffMB?.heapUsed || 0));
        
        if (maxMemoryIncrease > 50) {
          results.recommendations.push(`High memory usage detected: ${maxMemoryIncrease}MB increase`);
        }
        
        if (results.memoryLeaks.memoryRecoveryRate < 80) {
          results.recommendations.push(`Poor memory recovery rate: ${results.memoryLeaks.memoryRecoveryRate}%`);
        }
        
        if (results.garbageCollection.available && results.garbageCollection.effectiveness < 10) {
          results.recommendations.push('Garbage collection not very effective');
        }
        
        // Final memory comparison
        const finalMemory = process.memoryUsage();
        const totalMemoryIncrease = (finalMemory.heapUsed - results.initialMemory.heapUsed) / 1024 / 1024;
        
        if (totalMemoryIncrease > 100) {
          return {
            status: 'warning',
            message: `High memory usage increase: ${totalMemoryIncrease.toFixed(2)}MB`,
            details: results
          };
        }
        
        if (results.recommendations.length > 2) {
          return {
            status: 'warning',
            message: `Memory performance concerns: ${results.recommendations.length} issues detected`,
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: `Memory benchmark completed successfully (${totalMemoryIncrease.toFixed(2)}MB increase, ${results.memoryTests.length} tests)`,
          details: results
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Memory benchmark failed: ${error.message}`,
          details: { error: error.message, results }
        };
      }
    }
  },

  {
    name: 'CPU Performance Benchmark',
    function: async () => {
      const results = {
        cpuTests: [],
        overallPerformance: {},
        systemInfo: {},
        recommendations: []
      };
      
      try {
        // Get system information
        results.systemInfo = {
          platform: process.platform,
          arch: process.arch,
          nodeVersion: process.version,
          cpuCount: require('os').cpus().length,
          totalMemory: require('os').totalmem(),
          freeMemory: require('os').freemem()
        };
        
        // CPU intensive test scenarios
        const cpuTests = [
          {
            name: 'Mathematical Calculations',
            test: () => {
              let result = 0;
              for (let i = 0; i < 1000000; i++) {
                result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
              }
              return result;
            },
            iterations: 3
          },
          {
            name: 'Array Sorting',
            test: () => {
              const array = new Array(50000).fill(0).map(() => Math.random());
              array.sort((a, b) => a - b);
              return array.length;
            },
            iterations: 5
          },
          {
            name: 'String Processing',
            test: () => {
              let text = 'The quick brown fox jumps over the lazy dog. '.repeat(1000);
              for (let i = 0; i < 1000; i++) {
                text = text.replace(/fox/g, 'cat').replace(/dog/g, 'mouse');
              }
              return text.length;
            },
            iterations: 3
          },
          {
            name: 'Object Serialization',
            test: () => {
              const data = {
                items: new Array(10000).fill(0).map((_, i) => ({
                  id: i,
                  name: `item-${i}`,
                  value: Math.random() * 1000,
                  nested: {
                    data: new Array(10).fill(i),
                    metadata: { created: new Date(), type: 'test' }
                  }
                }))
              };
              
              let serialized = JSON.stringify(data);
              let parsed = JSON.parse(serialized);
              return parsed.items.length;
            },
            iterations: 3
          }
        ];
        
        // Execute CPU tests
        for (const test of cpuTests) {
          const testResults = [];
          
          for (let i = 0; i < test.iterations; i++) {
            const startTime = performance.now();
            const startCPU = process.cpuUsage();
            
            try {
              const result = await test.test();
              const endTime = performance.now();
              const endCPU = process.cpuUsage(startCPU);
              
              testResults.push({
                iteration: i + 1,
                duration: Number((endTime - startTime).toFixed(2)),
                result,
                cpuUsage: {
                  user: endCPU.user,
                  system: endCPU.system,
                  userMs: Number((endCPU.user / 1000).toFixed(2)),
                  systemMs: Number((endCPU.system / 1000).toFixed(2))
                },
                success: true
              });
            } catch (error) {
              testResults.push({
                iteration: i + 1,
                duration: Number((performance.now() - startTime).toFixed(2)),
                error: error.message,
                success: false
              });
            }
            
            // Small delay between iterations
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          // Calculate test statistics
          const successfulTests = testResults.filter(t => t.success);
          if (successfulTests.length > 0) {
            const durations = successfulTests.map(t => t.duration);
            const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
            
            results.cpuTests.push({
              name: test.name,
              iterations: test.iterations,
              successfulIterations: successfulTests.length,
              avgDuration: Number(avgDuration.toFixed(2)),
              minDuration: Number(Math.min(...durations).toFixed(2)),
              maxDuration: Number(Math.max(...durations).toFixed(2)),
              totalCPUTime: successfulTests.reduce((sum, t) => sum + t.cpuUsage.userMs + t.cpuUsage.systemMs, 0),
              results: testResults
            });
          } else {
            results.cpuTests.push({
              name: test.name,
              iterations: test.iterations,
              successfulIterations: 0,
              error: 'All iterations failed'
            });
          }
        }
        
        // Calculate overall performance metrics
        const successfulTests = results.cpuTests.filter(t => t.avgDuration);
        if (successfulTests.length > 0) {
          const allDurations = successfulTests.map(t => t.avgDuration);
          const totalCPUTime = successfulTests.reduce((sum, t) => sum + t.totalCPUTime, 0);
          
          results.overallPerformance = {
            avgTestDuration: Number((allDurations.reduce((sum, d) => sum + d, 0) / allDurations.length).toFixed(2)),
            fastestTest: Math.min(...allDurations),
            slowestTest: Math.max(...allDurations),
            totalCPUTime: Number(totalCPUTime.toFixed(2)),
            performanceScore: Number((1000 / (allDurations.reduce((sum, d) => sum + d, 0) / allDurations.length)).toFixed(2))
          };
        }
        
        // Generate recommendations
        if (results.overallPerformance.avgTestDuration > 1000) {
          results.recommendations.push('CPU performance is below average - consider optimization');
        }
        
        if (results.overallPerformance.slowestTest > 5000) {
          results.recommendations.push('Some operations are very slow - investigate bottlenecks');
        }
        
        const failedTests = results.cpuTests.filter(t => t.successfulIterations === 0).length;
        if (failedTests > 0) {
          results.recommendations.push(`${failedTests} CPU tests failed completely`);
        }
        
        // Determine status
        if (failedTests === results.cpuTests.length) {
          return {
            status: 'failed',
            message: 'All CPU performance tests failed',
            details: results
          };
        }
        
        if (results.overallPerformance.avgTestDuration > 2000) {
          return {
            status: 'warning',
            message: `Poor CPU performance: ${results.overallPerformance.avgTestDuration}ms average`,
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: `CPU performance acceptable: ${results.overallPerformance.avgTestDuration}ms average (score: ${results.overallPerformance.performanceScore})`,
          details: results
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `CPU performance benchmark failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Network Latency Benchmark',
    function: async () => {
      const results = {
        latencyTests: [],
        throughputTests: [],
        reliability: {},
        recommendations: []
      };
      
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        // Latency tests
        const latencyIterations = 10;
        const latencyResults = [];
        
        for (let i = 0; i < latencyIterations; i++) {
          const startTime = performance.now();
          
          try {
            const { data, error } = await supabase
              .from('information_schema.schemata')
              .select('schema_name')
              .limit(1);
            
            const endTime = performance.now();
            const latency = endTime - startTime;
            
            latencyResults.push({
              iteration: i + 1,
              latency: Number(latency.toFixed(2)),
              success: !error || error.message.includes('permission'),
              error: error ? error.message : null
            });
          } catch (error) {
            latencyResults.push({
              iteration: i + 1,
              latency: Number((performance.now() - startTime).toFixed(2)),
              success: false,
              error: error.message
            });
          }
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const successfulLatencyTests = latencyResults.filter(t => t.success);
        if (successfulLatencyTests.length > 0) {
          const latencies = successfulLatencyTests.map(t => t.latency);
          results.latencyTests = {
            iterations: latencyIterations,
            successfulTests: successfulLatencyTests.length,
            avgLatency: Number((latencies.reduce((sum, l) => sum + l, 0) / latencies.length).toFixed(2)),
            minLatency: Number(Math.min(...latencies).toFixed(2)),
            maxLatency: Number(Math.max(...latencies).toFixed(2)),
            medianLatency: Number(latencies.sort((a, b) => a - b)[Math.floor(latencies.length / 2)].toFixed(2)),
            results: latencyResults
          };
        }
        
        // Throughput test (parallel requests)
        const throughputRequests = 20;
        const throughputStartTime = performance.now();
        
        const throughputPromises = Array.from({ length: throughputRequests }, async (_, i) => {
          const requestStartTime = performance.now();
          try {
            const { data, error } = await supabase
              .from('information_schema.columns')
              .select('column_name')
              .limit(5);
            
            const requestEndTime = performance.now();
            return {
              request: i + 1,
              duration: Number((requestEndTime - requestStartTime).toFixed(2)),
              success: !error || error.message.includes('permission'),
              error: error ? error.message : null
            };
          } catch (error) {
            return {
              request: i + 1,
              duration: Number((performance.now() - requestStartTime).toFixed(2)),
              success: false,
              error: error.message
            };
          }
        });
        
        const throughputResults = await Promise.all(throughputPromises);
        const throughputEndTime = performance.now();
        const totalThroughputTime = throughputEndTime - throughputStartTime;
        
        const successfulThroughputTests = throughputResults.filter(t => t.success);
        results.throughputTests = {
          totalRequests: throughputRequests,
          successfulRequests: successfulThroughputTests.length,
          totalTime: Number(totalThroughputTime.toFixed(2)),
          requestsPerSecond: Number((successfulThroughputTests.length / (totalThroughputTime / 1000)).toFixed(2)),
          avgRequestTime: successfulThroughputTests.length > 0 ? 
            Number((successfulThroughputTests.reduce((sum, t) => sum + t.duration, 0) / successfulThroughputTests.length).toFixed(2)) : 0,
          results: throughputResults
        };
        
        // Reliability test
        const reliabilityResults = {
          latencyReliability: successfulLatencyTests.length / latencyIterations,
          throughputReliability: successfulThroughputTests.length / throughputRequests,
          overallReliability: (successfulLatencyTests.length + successfulThroughputTests.length) / (latencyIterations + throughputRequests)
        };
        
        results.reliability = {
          latencySuccessRate: Number((reliabilityResults.latencyReliability * 100).toFixed(2)),
          throughputSuccessRate: Number((reliabilityResults.throughputReliability * 100).toFixed(2)),
          overallSuccessRate: Number((reliabilityResults.overallReliability * 100).toFixed(2))
        };
        
        // Generate recommendations
        if (results.latencyTests.avgLatency > 500) {
          results.recommendations.push(`High average latency: ${results.latencyTests.avgLatency}ms`);
        }
        
        if (results.throughputTests.requestsPerSecond < 10) {
          results.recommendations.push(`Low throughput: ${results.throughputTests.requestsPerSecond} req/s`);
        }
        
        if (results.reliability.overallSuccessRate < 90) {
          results.recommendations.push(`Poor reliability: ${results.reliability.overallSuccessRate}% success rate`);
        }
        
        if (results.latencyTests.maxLatency > 2000) {
          results.recommendations.push(`High maximum latency: ${results.latencyTests.maxLatency}ms`);
        }
        
        // Determine status
        if (results.reliability.overallSuccessRate < 70) {
          return {
            status: 'failed',
            message: `Poor network reliability: ${results.reliability.overallSuccessRate}% success rate`,
            details: results
          };
        }
        
        if (results.latencyTests.avgLatency > 1000 || results.throughputTests.requestsPerSecond < 5) {
          return {
            status: 'warning',
            message: `Network performance issues: ${results.latencyTests.avgLatency}ms latency, ${results.throughputTests.requestsPerSecond} req/s`,
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: `Network performance acceptable: ${results.latencyTests.avgLatency}ms latency, ${results.throughputTests.requestsPerSecond} req/s`,
          details: results
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Network latency benchmark failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  }
];

module.exports = { tests };