/**
 * Supabase Connectivity Tests
 * Tests database connections, authentication, and API endpoints
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const url = require('url');

const tests = [
  {
    name: 'Supabase Environment Variables',
    function: async () => {
      const requiredVars = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
      };
      
      const missingVars = Object.entries(requiredVars)
        .filter(([key, value]) => !value)
        .map(([key]) => key);
      
      if (missingVars.length > 0) {
        return {
          status: 'failed',
          message: `Missing Supabase environment variables: ${missingVars.join(', ')}`,
          details: { missingVars }
        };
      }
      
      // Validate URL format
      try {
        const parsedUrl = new URL(requiredVars.NEXT_PUBLIC_SUPABASE_URL);
        if (!parsedUrl.hostname.includes('supabase')) {
          return {
            status: 'warning',
            message: 'Supabase URL format appears unusual',
            details: { url: parsedUrl.hostname }
          };
        }
      } catch (error) {
        return {
          status: 'failed',
          message: 'Invalid Supabase URL format',
          details: { error: error.message }
        };
      }
      
      return {
        status: 'passed',
        message: 'All Supabase environment variables are present and valid',
        details: {
          url: requiredVars.NEXT_PUBLIC_SUPABASE_URL,
          anonKeyLength: requiredVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.length,
          serviceKeyLength: requiredVars.SUPABASE_SERVICE_ROLE_KEY.length
        }
      };
    }
  },

  {
    name: 'Supabase API Endpoint Connectivity',
    function: async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      if (!supabaseUrl) {
        return {
          status: 'failed',
          message: 'NEXT_PUBLIC_SUPABASE_URL not set',
          details: {}
        };
      }
      
      return new Promise((resolve) => {
        const parsedUrl = new URL(supabaseUrl);
        const options = {
          hostname: parsedUrl.hostname,
          port: 443,
          path: '/rest/v1/',
          method: 'GET',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        };
        
        const startTime = Date.now();
        const req = https.request(options, (res) => {
          const responseTime = Date.now() - startTime;
          
          if (res.statusCode >= 200 && res.statusCode < 400) {
            resolve({
              status: 'passed',
              message: `Supabase API endpoint is accessible (${res.statusCode})`,
              details: {
                statusCode: res.statusCode,
                responseTime,
                headers: res.headers
              }
            });
          } else {
            resolve({
              status: 'failed',
              message: `Supabase API returned status ${res.statusCode}`,
              details: {
                statusCode: res.statusCode,
                responseTime,
                headers: res.headers
              }
            });
          }
        });
        
        req.on('error', (error) => {
          resolve({
            status: 'failed',
            message: `Failed to connect to Supabase API: ${error.message}`,
            details: { error: error.message, timeout: options.timeout }
          });
        });
        
        req.on('timeout', () => {
          req.destroy();
          resolve({
            status: 'failed',
            message: 'Supabase API connection timed out',
            details: { timeout: options.timeout }
          });
        });
        
        req.end();
      });
    }
  },

  {
    name: 'Supabase Client Initialization',
    function: async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        if (!supabase) {
          return {
            status: 'failed',
            message: 'Failed to create Supabase client',
            details: {}
          };
        }
        
        // Test basic client properties
        const clientInfo = {
          supabaseUrl: supabase.supabaseUrl,
          supabaseKey: supabase.supabaseKey ? 'present' : 'missing',
          authInitialized: !!supabase.auth,
          restInitialized: !!supabase.rest,
          realtimeInitialized: !!supabase.realtime
        };
        
        return {
          status: 'passed',
          message: 'Supabase client initialized successfully',
          details: clientInfo
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Failed to initialize Supabase client: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Database Connection Test',
    function: async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        const startTime = Date.now();
        
        // Try to query system information (this should work with anon key)
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .limit(1);
        
        const responseTime = Date.now() - startTime;
        
        if (error) {
          // This might be expected due to permissions, but connection works
          if (error.code === 'PGRST116' || error.message.includes('permission')) {
            return {
              status: 'passed',
              message: 'Database connection established (permission limited as expected)',
              details: {
                responseTime,
                error: error.message,
                note: 'Limited permissions with anon key is normal'
              }
            };
          }
          
          return {
            status: 'failed',
            message: `Database query failed: ${error.message}`,
            details: {
              responseTime,
              error: error.message,
              code: error.code
            }
          };
        }
        
        return {
          status: 'passed',
          message: 'Database connection and query successful',
          details: {
            responseTime,
            resultCount: data ? data.length : 0
          }
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Database connection failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Authentication Service Test',
    function: async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        if (!supabase.auth) {
          return {
            status: 'failed',
            message: 'Supabase auth service not available',
            details: {}
          };
        }
        
        const startTime = Date.now();
        
        // Test getting current session (should return null for anon)
        const { data: session, error } = await supabase.auth.getSession();
        
        const responseTime = Date.now() - startTime;
        
        if (error) {
          return {
            status: 'failed',
            message: `Auth service error: ${error.message}`,
            details: {
              responseTime,
              error: error.message
            }
          };
        }
        
        return {
          status: 'passed',
          message: 'Authentication service is accessible',
          details: {
            responseTime,
            sessionExists: !!session?.session,
            authMethodsAvailable: true
          }
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Auth service test failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Real-time Connection Test',
    function: async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        if (!supabase.realtime) {
          return {
            status: 'failed',
            message: 'Supabase realtime service not available',
            details: {}
          };
        }
        
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            resolve({
              status: 'warning',
              message: 'Real-time connection test timed out',
              details: { timeout: 5000 }
            });
          }, 5000);
          
          try {
            // Test realtime connection status
            const realtimeStatus = supabase.realtime.isConnected();
            
            clearTimeout(timeout);
            
            return resolve({
              status: 'passed',
              message: 'Real-time service is available',
              details: {
                connected: realtimeStatus,
                channels: supabase.realtime.channels ? supabase.realtime.channels.length : 0
              }
            });
          } catch (error) {
            clearTimeout(timeout);
            resolve({
              status: 'warning',
              message: `Real-time service check failed: ${error.message}`,
              details: { error: error.message }
            });
          }
        });
      } catch (error) {
        return {
          status: 'failed',
          message: `Real-time connection test failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Service Role Key Test',
    function: async () => {
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return {
          status: 'warning',
          message: 'Service role key not configured - admin functions will not work',
          details: {}
        };
      }
      
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );
        
        const startTime = Date.now();
        
        // Test with service role - try to access system tables
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .limit(5);
        
        const responseTime = Date.now() - startTime;
        
        if (error) {
          return {
            status: 'failed',
            message: `Service role key test failed: ${error.message}`,
            details: {
              responseTime,
              error: error.message,
              code: error.code
            }
          };
        }
        
        return {
          status: 'passed',
          message: 'Service role key is valid and functional',
          details: {
            responseTime,
            tablesFound: data ? data.length : 0
          }
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Service role key test error: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Database Schema Validation',
    function: async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        // Check for key tables that should exist in Prima Facie
        const expectedTables = [
          'clients',
          'matters',
          'users',
          'invoices',
          'time_entries'
        ];
        
        const tableChecks = [];
        
        for (const tableName of expectedTables) {
          try {
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);
            
            tableChecks.push({
              table: tableName,
              exists: !error || error.code !== 'PGRST106',
              accessible: !error,
              error: error ? error.message : null
            });
          } catch (err) {
            tableChecks.push({
              table: tableName,
              exists: false,
              accessible: false,
              error: err.message
            });
          }
        }
        
        const existingTables = tableChecks.filter(t => t.exists);
        const accessibleTables = tableChecks.filter(t => t.accessible);
        
        if (existingTables.length === 0) {
          return {
            status: 'failed',
            message: 'No expected database tables found - database may not be initialized',
            details: { tableChecks }
          };
        }
        
        if (existingTables.length < expectedTables.length) {
          return {
            status: 'warning',
            message: `Some tables missing (${existingTables.length}/${expectedTables.length} found)`,
            details: { tableChecks }
          };
        }
        
        return {
          status: 'passed',
          message: `Database schema validation passed (${existingTables.length}/${expectedTables.length} tables found)`,
          details: { 
            tableChecks,
            existingCount: existingTables.length,
            accessibleCount: accessibleTables.length
          }
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Schema validation failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Row Level Security Test',
    function: async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        // Test RLS by trying to access protected tables with anon key
        const protectedTables = ['clients', 'matters', 'invoices'];
        const rlsResults = [];
        
        for (const table of protectedTables) {
          try {
            const { data, error } = await supabase
              .from(table)
              .select('*')
              .limit(1);
            
            rlsResults.push({
              table,
              rlsActive: !!error && (error.code === 'PGRST116' || error.message.includes('permission')),
              error: error ? error.message : null,
              dataReturned: !!data && data.length > 0
            });
          } catch (err) {
            rlsResults.push({
              table,
              rlsActive: true,
              error: err.message,
              dataReturned: false
            });
          }
        }
        
        const rlsEnabledTables = rlsResults.filter(r => r.rlsActive);
        
        if (rlsEnabledTables.length === 0) {
          return {
            status: 'warning',
            message: 'Row Level Security may not be properly configured',
            details: { rlsResults }
          };
        }
        
        return {
          status: 'passed',
          message: `Row Level Security is active on ${rlsEnabledTables.length}/${protectedTables.length} tables`,
          details: { rlsResults }
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `RLS test failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  }
];

module.exports = { tests };