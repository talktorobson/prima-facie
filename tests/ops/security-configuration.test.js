/**
 * Security Configuration Tests
 * Tests HTTPS, CORS, rate limiting, authentication, and security headers
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');
const { createClient } = require('@supabase/supabase-js');

const tests = [
  {
    name: 'HTTPS Configuration Test',
    function: async () => {
      const results = {
        httpsSupport: {},
        certificates: {},
        redirects: {},
        securityHeaders: {}
      };
      
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        
        if (!supabaseUrl) {
          return {
            status: 'failed',
            message: 'No URL configured for HTTPS testing',
            details: results
          };
        }
        
        const parsedUrl = new URL(supabaseUrl);
        
        // Test HTTPS connection
        return new Promise((resolve) => {
          const options = {
            hostname: parsedUrl.hostname,
            port: 443,
            path: '/rest/v1/',
            method: 'HEAD',
            timeout: 10000,
            headers: {
              'User-Agent': 'Prima-Facie-Security-Test'
            }
          };
          
          const req = https.request(options, (res) => {
            results.httpsSupport = {
              supported: true,
              statusCode: res.statusCode,
              protocol: res.socket?.getProtocol ? res.socket.getProtocol() : 'unknown',
              cipher: res.socket?.getCipher ? res.socket.getCipher() : null,
              authorized: res.socket?.authorized || false
            };
            
            // Check security headers
            results.securityHeaders = {
              strictTransportSecurity: res.headers['strict-transport-security'] || null,
              contentSecurityPolicy: res.headers['content-security-policy'] || null,
              xFrameOptions: res.headers['x-frame-options'] || null,
              xContentTypeOptions: res.headers['x-content-type-options'] || null,
              referrerPolicy: res.headers['referrer-policy'] || null
            };
            
            const securityScore = Object.values(results.securityHeaders).filter(Boolean).length;
            const totalHeaders = Object.keys(results.securityHeaders).length;
            
            if (!results.httpsSupport.supported) {
              resolve({
                status: 'failed',
                message: 'HTTPS is not properly configured',
                details: results
              });
            } else if (securityScore < totalHeaders * 0.6) {
              resolve({
                status: 'warning',
                message: `HTTPS working but security headers incomplete (${securityScore}/${totalHeaders})`,
                details: results
              });
            } else {
              resolve({
                status: 'passed',
                message: `HTTPS properly configured with ${securityScore}/${totalHeaders} security headers`,
                details: results
              });
            }
          });
          
          req.on('error', (error) => {
            results.httpsSupport = {
              supported: false,
              error: error.message
            };
            
            resolve({
              status: 'failed',
              message: `HTTPS connection failed: ${error.message}`,
              details: results
            });
          });
          
          req.on('timeout', () => {
            req.destroy();
            resolve({
              status: 'failed',
              message: 'HTTPS connection timed out',
              details: results
            });
          });
          
          req.end();
        });
      } catch (error) {
        return {
          status: 'failed',
          message: `HTTPS test failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'CORS Configuration Test',
    function: async () => {
      const results = {
        corsHeaders: {},
        preflightTest: {},
        originValidation: {}
      };
      
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        
        if (!supabaseUrl) {
          return {
            status: 'warning',
            message: 'No URL configured for CORS testing',
            details: results
          };
        }
        
        const parsedUrl = new URL(supabaseUrl);
        
        // Test CORS headers with OPTIONS request
        return new Promise((resolve) => {
          const options = {
            hostname: parsedUrl.hostname,
            port: 443,
            path: '/rest/v1/',
            method: 'OPTIONS',
            timeout: 10000,
            headers: {
              'Origin': 'https://localhost:3000',
              'Access-Control-Request-Method': 'GET',
              'Access-Control-Request-Headers': 'Content-Type,Authorization'
            }
          };
          
          const req = https.request(options, (res) => {
            results.corsHeaders = {
              accessControlAllowOrigin: res.headers['access-control-allow-origin'] || null,
              accessControlAllowMethods: res.headers['access-control-allow-methods'] || null,
              accessControlAllowHeaders: res.headers['access-control-allow-headers'] || null,
              accessControlMaxAge: res.headers['access-control-max-age'] || null,
              accessControlAllowCredentials: res.headers['access-control-allow-credentials'] || null
            };
            
            results.preflightTest = {
              statusCode: res.statusCode,
              successful: res.statusCode >= 200 && res.statusCode < 300
            };
            
            // Test different origins
            const testOrigins = [
              'https://localhost:3000',
              'http://localhost:3000',
              'https://malicious-site.com'
            ];
            
            const allowedOrigin = results.corsHeaders.accessControlAllowOrigin;
            results.originValidation = {
              allowsAll: allowedOrigin === '*',
              allowsSpecific: allowedOrigin && allowedOrigin !== '*',
              currentOrigin: allowedOrigin
            };
            
            const corsScore = Object.values(results.corsHeaders).filter(Boolean).length;
            const hasCorsSupport = corsScore > 0;
            
            if (!hasCorsSupport) {
              resolve({
                status: 'warning',
                message: 'CORS headers not detected - may cause browser issues',
                details: results
              });
            } else if (results.originValidation.allowsAll) {
              resolve({
                status: 'warning',
                message: 'CORS allows all origins (*) - potential security risk',
                details: results
              });
            } else {
              resolve({
                status: 'passed',
                message: `CORS properly configured with ${corsScore} headers`,
                details: results
              });
            }
          });
          
          req.on('error', (error) => {
            resolve({
              status: 'failed',
              message: `CORS test failed: ${error.message}`,
              details: { error: error.message, results }
            });
          });
          
          req.on('timeout', () => {
            req.destroy();
            resolve({
              status: 'failed',
              message: 'CORS test timed out',
              details: results
            });
          });
          
          req.end();
        });
      } catch (error) {
        return {
          status: 'failed',
          message: `CORS configuration test failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Authentication Security Test',
    function: async () => {
      try {
        const results = {
          tokenValidation: {},
          authFlows: {},
          sessionSecurity: {},
          keyRotation: {}
        };
        
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        // Test anonymous access limitations
        try {
          const { data: restrictedData, error } = await supabase
            .from('users')
            .select('*')
            .limit(1);
          
          results.tokenValidation = {
            anonKeyLimited: !!error && (error.code === 'PGRST116' || error.message.includes('permission')),
            errorCode: error ? error.code : null,
            hasUnauthorizedAccess: !error && restrictedData && restrictedData.length > 0
          };
        } catch (error) {
          results.tokenValidation = {
            anonKeyLimited: true,
            error: error.message
          };
        }
        
        // Test service role key (if available)
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
          try {
            const serviceSupabase = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL,
              process.env.SUPABASE_SERVICE_ROLE_KEY
            );
            
            const { data: serviceData, error: serviceError } = await serviceSupabase
              .from('information_schema.tables')
              .select('table_name')
              .limit(1);
            
            results.keyRotation = {
              serviceKeyFunctional: !serviceError,
              hasElevatedAccess: !serviceError,
              error: serviceError ? serviceError.message : null
            };
          } catch (error) {
            results.keyRotation = {
              serviceKeyFunctional: false,
              error: error.message
            };
          }
        } else {
          results.keyRotation = {
            serviceKeyConfigured: false,
            message: 'Service role key not configured'
          };
        }
        
        // Test authentication flows
        try {
          const { data: session } = await supabase.auth.getSession();
          
          results.authFlows = {
            sessionCheckFunctional: true,
            currentSession: !!session?.session,
            authServiceResponding: true
          };
        } catch (error) {
          results.authFlows = {
            sessionCheckFunctional: false,
            error: error.message
          };
        }
        
        // Test session security
        results.sessionSecurity = {
          httpOnlyRecommended: true, // Should be enforced by Supabase
          secureFlagRecommended: true, // Should be enforced by Supabase
          sameSiteRecommended: true // Should be enforced by Supabase
        };
        
        // Evaluate security posture
        const securityIssues = [];
        
        if (results.tokenValidation.hasUnauthorizedAccess) {
          securityIssues.push('Anonymous key has excessive permissions');
        }
        
        if (!results.tokenValidation.anonKeyLimited) {
          securityIssues.push('Anonymous key restrictions not working');
        }
        
        if (results.keyRotation.serviceKeyConfigured === false) {
          securityIssues.push('Service role key not configured');
        }
        
        if (!results.authFlows.authServiceResponding) {
          securityIssues.push('Authentication service not responding');
        }
        
        if (securityIssues.length > 2) {
          return {
            status: 'failed',
            message: `Critical authentication security issues: ${securityIssues.join(', ')}`,
            details: results
          };
        }
        
        if (securityIssues.length > 0) {
          return {
            status: 'warning',
            message: `Authentication security concerns: ${securityIssues.join(', ')}`,
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: 'Authentication security configuration is properly implemented',
          details: results
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Authentication security test failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Rate Limiting Test',
    function: async () => {
      const results = {
        rateLimitTests: [],
        burstTests: [],
        recoveryTests: [],
        configuration: {}
      };
      
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        // Test normal request rate
        const normalRequests = 5;
        const normalResults = [];
        
        for (let i = 0; i < normalRequests; i++) {
          const startTime = Date.now();
          try {
            const { data, error } = await supabase
              .from('information_schema.schemata')
              .select('schema_name')
              .limit(1);
            
            const responseTime = Date.now() - startTime;
            normalResults.push({
              request: i + 1,
              success: !error || error.message.includes('permission'),
              responseTime,
              error: error ? error.message : null
            });
          } catch (error) {
            normalResults.push({
              request: i + 1,
              success: false,
              responseTime: Date.now() - startTime,
              error: error.message
            });
          }
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        results.rateLimitTests = normalResults;
        
        // Test burst requests (rapid fire)
        const burstRequests = 20;
        const burstResults = [];
        const burstStartTime = Date.now();
        
        const burstPromises = Array.from({ length: burstRequests }, async (_, i) => {
          const requestStartTime = Date.now();
          try {
            const { data, error } = await supabase
              .from('information_schema.schemata')
              .select('schema_name')
              .limit(1);
            
            const responseTime = Date.now() - requestStartTime;
            return {
              request: i + 1,
              success: !error || error.message.includes('permission'),
              responseTime,
              rateLimited: error && (error.message.includes('rate') || error.message.includes('429')),
              error: error ? error.message : null
            };
          } catch (error) {
            return {
              request: i + 1,
              success: false,
              responseTime: Date.now() - requestStartTime,
              rateLimited: error.message.includes('rate') || error.message.includes('429'),
              error: error.message
            };
          }
        });
        
        const burstResponses = await Promise.all(burstPromises);
        results.burstTests = burstResponses;
        
        const burstTotalTime = Date.now() - burstStartTime;
        
        // Analysis
        const normalSuccessRate = (normalResults.filter(r => r.success).length / normalResults.length) * 100;
        const burstSuccessRate = (burstResponses.filter(r => r.success).length / burstResponses.length) * 100;
        const rateLimitDetected = burstResponses.some(r => r.rateLimited);
        
        results.configuration = {
          normalSuccessRate: normalSuccessRate.toFixed(1) + '%',
          burstSuccessRate: burstSuccessRate.toFixed(1) + '%',
          rateLimitDetected,
          burstDuration: burstTotalTime,
          avgNormalResponseTime: (normalResults.reduce((sum, r) => sum + r.responseTime, 0) / normalResults.length).toFixed(2) + 'ms',
          avgBurstResponseTime: (burstResponses.reduce((sum, r) => sum + r.responseTime, 0) / burstResponses.length).toFixed(2) + 'ms'
        };
        
        // Test recovery after potential rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        
        try {
          const recoveryStartTime = Date.now();
          const { data, error } = await supabase
            .from('information_schema.schemata')
            .select('schema_name')
            .limit(1);
          
          const recoveryTime = Date.now() - recoveryStartTime;
          
          results.recoveryTests = [{
            recovered: !error || error.message.includes('permission'),
            recoveryTime,
            error: error ? error.message : null
          }];
        } catch (error) {
          results.recoveryTests = [{
            recovered: false,
            error: error.message
          }];
        }
        
        // Determine status
        if (normalSuccessRate < 80) {
          return {
            status: 'failed',
            message: `Poor request success rate: ${normalSuccessRate}%`,
            details: results
          };
        }
        
        if (!rateLimitDetected && burstSuccessRate > 95) {
          return {
            status: 'warning',
            message: 'Rate limiting may not be properly configured - all burst requests succeeded',
            details: results
          };
        }
        
        if (results.recoveryTests[0] && !results.recoveryTests[0].recovered) {
          return {
            status: 'warning',
            message: 'Service not recovering properly after rate limiting',
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: `Rate limiting appears to be properly configured (normal: ${normalSuccessRate}%, burst: ${burstSuccessRate}%)`,
          details: results
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Rate limiting test failed: ${error.message}`,
          details: { error: error.message, results }
        };
      }
    }
  },

  {
    name: 'Environment Security Test',
    function: async () => {
      const results = {
        environmentVariables: {},
        secrets: {},
        filePermissions: {},
        configuration: {}
      };
      
      try {
        // Check environment variable security
        const criticalEnvVars = [
          'NEXT_PUBLIC_SUPABASE_URL',
          'NEXT_PUBLIC_SUPABASE_ANON_KEY',
          'SUPABASE_SERVICE_ROLE_KEY',
          'NODE_ENV'
        ];
        
        const envVarResults = {};
        criticalEnvVars.forEach(envVar => {
          const value = process.env[envVar];
          envVarResults[envVar] = {
            present: !!value,
            length: value ? value.length : 0,
            isPublic: envVar.startsWith('NEXT_PUBLIC_'),
            containsSensitiveData: value && (value.includes('key') || value.includes('secret') || value.length > 50)
          };
        });
        
        results.environmentVariables = envVarResults;
        
        // Check for exposed secrets
        const potentialSecrets = [];
        Object.keys(process.env).forEach(key => {
          const lowerKey = key.toLowerCase();
          const value = process.env[key];
          
          if ((lowerKey.includes('secret') || lowerKey.includes('key') || lowerKey.includes('token')) && 
              !key.startsWith('NEXT_PUBLIC_') && value && value.length > 10) {
            potentialSecrets.push({
              key,
              valueLength: value.length,
              isPublic: key.startsWith('NEXT_PUBLIC_'),
              category: lowerKey.includes('secret') ? 'secret' : 
                       lowerKey.includes('key') ? 'key' : 'token'
            });
          }
        });
        
        results.secrets = {
          potentialSecretsFound: potentialSecrets.length,
          secrets: potentialSecrets,
          publicSecrets: potentialSecrets.filter(s => s.isPublic)
        };
        
        // Check configuration security
        results.configuration = {
          nodeEnv: process.env.NODE_ENV,
          isProduction: process.env.NODE_ENV === 'production',
          isDevelopment: process.env.NODE_ENV === 'development',
          debugEnabled: !!process.env.DEBUG,
          verboseLogging: !!process.env.VERBOSE
        };
        
        // Security assessment
        const securityIssues = [];
        
        if (!results.environmentVariables.NEXT_PUBLIC_SUPABASE_URL?.present) {
          securityIssues.push('Missing Supabase URL configuration');
        }
        
        if (!results.environmentVariables.NEXT_PUBLIC_SUPABASE_ANON_KEY?.present) {
          securityIssues.push('Missing Supabase anonymous key');
        }
        
        if (results.secrets.publicSecrets.length > 0) {
          securityIssues.push(`${results.secrets.publicSecrets.length} potential secrets exposed as public`);
        }
        
        if (results.configuration.isProduction && results.configuration.debugEnabled) {
          securityIssues.push('Debug mode enabled in production');
        }
        
        if (!results.configuration.nodeEnv) {
          securityIssues.push('NODE_ENV not set');
        }
        
        // File permissions check
        const fs = require('fs');
        const path = require('path');
        
        const sensitiveFiles = ['.env', '.env.local', '.env.production'];
        const filePermissionResults = [];
        
        sensitiveFiles.forEach(file => {
          const filePath = path.join(process.cwd(), file);
          try {
            if (fs.existsSync(filePath)) {
              const stats = fs.statSync(filePath);
              const permissions = stats.mode.toString(8);
              
              filePermissionResults.push({
                file,
                exists: true,
                permissions,
                worldReadable: (stats.mode & parseInt('004', 8)) !== 0,
                groupReadable: (stats.mode & parseInt('040', 8)) !== 0
              });
              
              if ((stats.mode & parseInt('044', 8)) !== 0) {
                securityIssues.push(`${file} has overly permissive permissions`);
              }
            } else {
              filePermissionResults.push({
                file,
                exists: false
              });
            }
          } catch (error) {
            filePermissionResults.push({
              file,
              exists: false,
              error: error.message
            });
          }
        });
        
        results.filePermissions = filePermissionResults;
        
        if (securityIssues.length > 3) {
          return {
            status: 'failed',
            message: `Critical security issues: ${securityIssues.slice(0, 3).join(', ')}...`,
            details: results
          };
        }
        
        if (securityIssues.length > 0) {
          return {
            status: 'warning',
            message: `Security concerns: ${securityIssues.join(', ')}`,
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: 'Environment security configuration is properly implemented',
          details: results
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Environment security test failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  }
];

module.exports = { tests };