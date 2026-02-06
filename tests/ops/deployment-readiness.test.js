/**
 * Deployment Readiness Tests
 * Tests production readiness, configuration, build process, and deployment requirements
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

const tests = [
  {
    name: 'Build Process Validation',
    function: async () => {
      const results = {
        buildConfiguration: {},
        dependencies: {},
        buildTest: {},
        outputValidation: {}
      };
      
      try {
        // Check package.json build configuration
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        results.buildConfiguration = {
          hasNextConfig: fs.existsSync(path.join(process.cwd(), 'next.config.js')),
          hasTSConfig: fs.existsSync(path.join(process.cwd(), 'tsconfig.json')),
          hasTailwindConfig: fs.existsSync(path.join(process.cwd(), 'tailwind.config.ts')),
          hasPostCSSConfig: fs.existsSync(path.join(process.cwd(), 'postcss.config.js')),
          buildScript: packageJson.scripts?.build || null,
          startScript: packageJson.scripts?.start || null,
          devDependencies: Object.keys(packageJson.devDependencies || {}).length,
          dependencies: Object.keys(packageJson.dependencies || {}).length
        };
        
        // Check critical dependencies for production
        const productionDeps = [
          'next',
          'react',
          'react-dom',
          '@supabase/supabase-js'
        ];
        
        const missingDeps = productionDeps.filter(dep => 
          !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
        );
        
        results.dependencies = {
          required: productionDeps,
          missing: missingDeps,
          allPresent: missingDeps.length === 0
        };
        
        // Test build process (dry run without actually building)
        try {
          // Check if we can run TypeScript compiler check
          const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
          if (fs.existsSync(tsconfigPath)) {
            try {
              execSync('npx tsc --noEmit', { 
                cwd: process.cwd(), 
                timeout: 30000,
                stdio: 'pipe'
              });
              results.buildTest.typeCheck = 'passed';
            } catch (error) {
              results.buildTest.typeCheck = 'failed';
              results.buildTest.typeCheckError = error.message;
            }
          }
          
          // Check if we can run linting
          try {
            execSync('npx next lint --quiet', { 
              cwd: process.cwd(), 
              timeout: 30000,
              stdio: 'pipe'
            });
            results.buildTest.linting = 'passed';
          } catch (error) {
            results.buildTest.linting = 'failed';
            results.buildTest.lintingError = error.message;
          }
          
          results.buildTest.canRunBuildTools = true;
        } catch (error) {
          results.buildTest.canRunBuildTools = false;
          results.buildTest.error = error.message;
        }
        
        // Check output directory and build artifacts
        const nextBuildDir = path.join(process.cwd(), '.next');
        const hasPreviousBuild = fs.existsSync(nextBuildDir);
        
        results.outputValidation = {
          hasPreviousBuild,
          buildDirectory: nextBuildDir
        };
        
        if (hasPreviousBuild) {
          try {
            const buildStats = fs.statSync(nextBuildDir);
            const buildFiles = fs.readdirSync(nextBuildDir);
            
            results.outputValidation.buildStats = {
              lastModified: buildStats.mtime,
              fileCount: buildFiles.length,
              hasStaticDir: buildFiles.includes('static'),
              hasServerDir: buildFiles.includes('server'),
              hasCacheDir: buildFiles.includes('cache')
            };
          } catch (error) {
            results.outputValidation.buildStatsError = error.message;
          }
        }
        
        // Evaluate build readiness
        const buildIssues = [];
        
        if (!results.buildConfiguration.hasNextConfig) {
          buildIssues.push('Missing next.config.js');
        }
        
        if (!results.buildConfiguration.buildScript) {
          buildIssues.push('Missing build script in package.json');
        }
        
        if (!results.buildConfiguration.startScript) {
          buildIssues.push('Missing start script in package.json');
        }
        
        if (!results.dependencies.allPresent) {
          buildIssues.push(`Missing dependencies: ${results.dependencies.missing.join(', ')}`);
        }
        
        if (results.buildTest.typeCheck === 'failed') {
          buildIssues.push('TypeScript compilation errors');
        }
        
        if (results.buildTest.linting === 'failed') {
          buildIssues.push('Linting errors');
        }
        
        if (buildIssues.length > 2) {
          return {
            status: 'failed',
            message: `Build process not ready: ${buildIssues.slice(0, 2).join(', ')}...`,
            details: results
          };
        }
        
        if (buildIssues.length > 0) {
          return {
            status: 'warning',
            message: `Build process issues: ${buildIssues.join(', ')}`,
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: `Build process is ready (${results.dependencies.dependencies} deps, ${results.buildConfiguration.devDependencies} dev deps)`,
          details: results
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Build validation failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Production Environment Configuration',
    function: async () => {
      const results = {
        environmentVariables: {},
        securityConfiguration: {},
        performanceSettings: {},
        monitoring: {}
      };
      
      try {
        // Check environment variables for production
        const requiredEnvVars = [
          'NEXT_PUBLIC_SUPABASE_URL',
          'NEXT_PUBLIC_SUPABASE_ANON_KEY',
          'SUPABASE_SERVICE_ROLE_KEY'
        ];
        
        const optionalEnvVars = [
          'NODE_ENV',
          'VERCEL_URL',
          'NEXT_PUBLIC_VERCEL_URL'
        ];
        
        results.environmentVariables.required = {};
        requiredEnvVars.forEach(envVar => {
          const value = process.env[envVar];
          results.environmentVariables.required[envVar] = {
            present: !!value,
            length: value ? value.length : 0,
            masked: value ? value.substring(0, 10) + '...' : null
          };
        });
        
        results.environmentVariables.optional = {};
        optionalEnvVars.forEach(envVar => {
          const value = process.env[envVar];
          results.environmentVariables.optional[envVar] = {
            present: !!value,
            value: value || null
          };
        });
        
        // Check production-specific configurations
        const nodeEnv = process.env.NODE_ENV;
        results.environmentVariables.environment = {
          nodeEnv,
          isProduction: nodeEnv === 'production',
          isDevelopment: nodeEnv === 'development',
          isTest: nodeEnv === 'test'
        };
        
        // Security configuration checks
        results.securityConfiguration = {
          httpsRequired: true, // Should be enforced in production
          corsConfigured: true, // Assumed to be handled by Next.js/Vercel
          authenticationRequired: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          environmentSecrets: {
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 0
          }
        };
        
        // Performance settings
        const nextConfigPath = path.join(process.cwd(), 'next.config.js');
        let nextConfig = {};
        
        if (fs.existsSync(nextConfigPath)) {
          try {
            delete require.cache[require.resolve(nextConfigPath)];
            nextConfig = require(nextConfigPath);
          } catch (error) {
            // Ignore config loading errors
          }
        }
        
        results.performanceSettings = {
          reactStrictMode: nextConfig.reactStrictMode,
          swcMinify: nextConfig.swcMinify,
          hasImageOptimization: !!nextConfig.images,
          hasRedirects: typeof nextConfig.redirects === 'function',
          compressionEnabled: true // Assumed for production
        };
        
        // Monitoring and observability
        results.monitoring = {
          errorBoundariesConfigured: true, // Should be implemented in React app
          loggingConfigured: true, // Basic console logging available
          metricsAvailable: false, // Would need specific setup
          healthCheckEndpoint: false // Would need to be implemented
        };
        
        // Test database connection with production-like constraints
        try {
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          );
          
          const connectionStartTime = Date.now();
          const { data, error } = await supabase
            .from('information_schema.schemata')
            .select('schema_name')
            .limit(1);
          
          const connectionTime = Date.now() - connectionStartTime;
          
          results.monitoring.databaseConnection = {
            successful: !error || error.message.includes('permission'),
            responseTime: connectionTime,
            error: error ? error.message : null
          };
        } catch (error) {
          results.monitoring.databaseConnection = {
            successful: false,
            error: error.message
          };
        }
        
        // Evaluate production readiness
        const productionIssues = [];
        
        const missingRequiredVars = Object.entries(results.environmentVariables.required)
          .filter(([key, config]) => !config.present)
          .map(([key]) => key);
        
        if (missingRequiredVars.length > 0) {
          productionIssues.push(`Missing required env vars: ${missingRequiredVars.join(', ')}`);
        }
        
        if (!results.securityConfiguration.authenticationRequired) {
          productionIssues.push('Service role key not configured');
        }
        
        if (!results.monitoring.databaseConnection?.successful) {
          productionIssues.push('Database connection failed');
        }
        
        if (results.environmentVariables.environment.nodeEnv === 'development') {
          productionIssues.push('NODE_ENV is set to development');
        }
        
        if (productionIssues.length > 2) {
          return {
            status: 'failed',
            message: `Production configuration not ready: ${productionIssues.slice(0, 2).join(', ')}...`,
            details: results
          };
        }
        
        if (productionIssues.length > 0) {
          return {
            status: 'warning',
            message: `Production configuration issues: ${productionIssues.join(', ')}`,
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: `Production configuration is ready (env: ${results.environmentVariables.environment.nodeEnv})`,
          details: results
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Production configuration check failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Database Migration Readiness',
    function: async () => {
      const results = {
        migrationFiles: {},
        schemaValidation: {},
        dataIntegrity: {},
        backupReadiness: {}
      };
      
      try {
        // Check for migration files
        const migrationDirs = [
          path.join(process.cwd(), 'database', 'migrations'),
          path.join(process.cwd(), 'migrations'),
          path.join(process.cwd(), 'sql', 'migrations')
        ];
        
        const foundMigrations = [];
        
        migrationDirs.forEach(dir => {
          if (fs.existsSync(dir)) {
            try {
              const files = fs.readdirSync(dir);
              const sqlFiles = files.filter(file => file.endsWith('.sql'));
              
              foundMigrations.push({
                directory: dir,
                fileCount: sqlFiles.length,
                files: sqlFiles.slice(0, 10) // Show first 10 files
              });
            } catch (error) {
              foundMigrations.push({
                directory: dir,
                error: error.message
              });
            }
          }
        });
        
        results.migrationFiles = {
          searchedDirectories: migrationDirs,
          foundMigrations,
          totalMigrationFiles: foundMigrations.reduce((sum, m) => sum + (m.fileCount || 0), 0)
        };
        
        // Check database schema files
        const schemaFiles = [
          'setup-database.sql',
          'schema.sql',
          'database-schema.sql'
        ].map(file => {
          const filePath = path.join(process.cwd(), file);
          return {
            file,
            exists: fs.existsSync(filePath),
            path: filePath,
            size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
          };
        });
        
        results.schemaValidation = {
          schemaFiles,
          hasSchemaFiles: schemaFiles.some(f => f.exists),
          totalSchemaSize: schemaFiles.reduce((sum, f) => sum + f.size, 0)
        };
        
        // Test database connection for migration readiness
        try {
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          );
          
          // Check if we can access schema information
          const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name, table_type')
            .eq('table_schema', 'public')
            .limit(10);
          
          results.dataIntegrity = {
            canAccessSchema: !tablesError || tablesError.message.includes('permission'),
            tableCount: tables ? tables.length : 0,
            hasExistingData: tables && tables.length > 0,
            error: tablesError ? tablesError.message : null
          };
          
          // Check for specific Prima Facie tables
          const expectedTables = ['clients', 'matters', 'users', 'invoices', 'time_entries'];
          const existingTables = [];
          
          for (const tableName of expectedTables) {
            try {
              const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);
              
              if (!error) {
                existingTables.push({
                  table: tableName,
                  exists: true,
                  hasData: data && data.length > 0
                });
              } else if (error.code !== 'PGRST106') { // Not "relation does not exist"
                existingTables.push({
                  table: tableName,
                  exists: true,
                  accessible: false,
                  error: error.message
                });
              } else {
                existingTables.push({
                  table: tableName,
                  exists: false
                });
              }
            } catch (error) {
              existingTables.push({
                table: tableName,
                exists: false,
                error: error.message
              });
            }
          }
          
          results.dataIntegrity.expectedTables = existingTables;
          results.dataIntegrity.existingTableCount = existingTables.filter(t => t.exists).length;
        } catch (error) {
          results.dataIntegrity = {
            canAccessSchema: false,
            error: error.message
          };
        }
        
        // Check backup readiness
        const backupDir = path.join(process.cwd(), 'backups');
        results.backupReadiness = {
          backupDirExists: fs.existsSync(backupDir),
          backupDirPath: backupDir
        };
        
        if (fs.existsSync(backupDir)) {
          try {
            const backupFiles = fs.readdirSync(backupDir);
            results.backupReadiness.existingBackups = backupFiles.length;
            results.backupReadiness.recentBackups = backupFiles.filter(file => {
              const filePath = path.join(backupDir, file);
              const stats = fs.statSync(filePath);
              const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
              return ageHours < 24; // Backups within last 24 hours
            }).length;
          } catch (error) {
            results.backupReadiness.error = error.message;
          }
        }
        
        // Evaluate migration readiness
        const migrationIssues = [];
        
        if (results.migrationFiles.totalMigrationFiles === 0 && !results.schemaValidation.hasSchemaFiles) {
          migrationIssues.push('No migration or schema files found');
        }
        
        if (!results.dataIntegrity.canAccessSchema) {
          migrationIssues.push('Cannot access database schema');
        }
        
        if (!results.backupReadiness.backupDirExists) {
          migrationIssues.push('Backup directory not configured');
        }
        
        if (process.env.SUPABASE_SERVICE_ROLE_KEY && results.dataIntegrity.existingTableCount === 0) {
          migrationIssues.push('No expected tables found in database');
        }
        
        if (migrationIssues.length > 2) {
          return {
            status: 'failed',
            message: `Database migration not ready: ${migrationIssues.slice(0, 2).join(', ')}...`,
            details: results
          };
        }
        
        if (migrationIssues.length > 0) {
          return {
            status: 'warning',
            message: `Migration readiness issues: ${migrationIssues.join(', ')}`,
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: `Database migration is ready (${results.migrationFiles.totalMigrationFiles} migrations, ${results.dataIntegrity.existingTableCount || 0} tables)`,
          details: results
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Database migration readiness check failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Deployment Platform Compatibility',
    function: async () => {
      const results = {
        vercelCompatibility: {},
        nextjsFeatures: {},
        staticAssets: {},
        apiRoutes: {}
      };
      
      try {
        // Check Vercel-specific configurations
        const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
        const hasVercelConfig = fs.existsSync(vercelConfigPath);
        
        let vercelConfig = {};
        if (hasVercelConfig) {
          try {
            vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
          } catch (error) {
            // Ignore JSON parsing errors
          }
        }
        
        results.vercelCompatibility = {
          hasVercelConfig,
          configPath: vercelConfigPath,
          hasBuilds: !!vercelConfig.builds,
          hasRedirects: !!vercelConfig.redirects,
          hasRewrites: !!vercelConfig.rewrites,
          hasHeaders: !!vercelConfig.headers,
          hasEnvironmentVariables: !!vercelConfig.env,
          framework: vercelConfig.framework || 'nextjs' // Default assumption
        };
        
        // Check Next.js specific features
        const nextConfigPath = path.join(process.cwd(), 'next.config.js');
        let nextConfig = {};
        
        if (fs.existsSync(nextConfigPath)) {
          try {
            delete require.cache[require.resolve(nextConfigPath)];
            nextConfig = require(nextConfigPath);
          } catch (error) {
            // Ignore config loading errors
          }
        }
        
        results.nextjsFeatures = {
          hasNextConfig: fs.existsSync(nextConfigPath),
          reactStrictMode: nextConfig.reactStrictMode,
          swcMinify: nextConfig.swcMinify,
          hasImageConfig: !!nextConfig.images,
          hasRedirects: typeof nextConfig.redirects === 'function',
          hasRewrites: typeof nextConfig.rewrites === 'function',
          hasHeaders: typeof nextConfig.headers === 'function',
          experimental: !!nextConfig.experimental,
          outputFileTracing: nextConfig.experimental?.outputFileTracing
        };
        
        // Check static assets
        const publicDir = path.join(process.cwd(), 'public');
        const stylesDir = path.join(process.cwd(), 'styles');
        
        results.staticAssets = {
          hasPublicDir: fs.existsSync(publicDir),
          hasStylesDir: fs.existsSync(stylesDir),
          publicDirPath: publicDir,
          stylesDirPath: stylesDir
        };
        
        if (fs.existsSync(publicDir)) {
          try {
            const publicFiles = fs.readdirSync(publicDir);
            results.staticAssets.publicFiles = publicFiles.length;
            results.staticAssets.hasImages = publicFiles.some(file => 
              /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i.test(file)
            );
            results.staticAssets.hasFavicon = publicFiles.includes('favicon.ico');
          } catch (error) {
            results.staticAssets.publicDirError = error.message;
          }
        }
        
        // Check API routes
        const apiDir = path.join(process.cwd(), 'app', 'api');
        const pagesApiDir = path.join(process.cwd(), 'pages', 'api');
        
        results.apiRoutes = {
          hasAppApiDir: fs.existsSync(apiDir),
          hasPagesApiDir: fs.existsSync(pagesApiDir),
          appApiPath: apiDir,
          pagesApiPath: pagesApiDir
        };
        
        // Check which API structure is being used
        if (fs.existsSync(apiDir)) {
          try {
            const apiFiles = fs.readdirSync(apiDir, { recursive: true });
            const routeFiles = apiFiles.filter(file => 
              typeof file === 'string' && file.endsWith('route.ts') || file.endsWith('route.js')
            );
            
            results.apiRoutes.appApiRoutes = routeFiles.length;
            results.apiRoutes.usingAppRouter = true;
          } catch (error) {
            results.apiRoutes.appApiError = error.message;
          }
        }
        
        if (fs.existsSync(pagesApiDir)) {
          try {
            const apiFiles = fs.readdirSync(pagesApiDir, { recursive: true });
            results.apiRoutes.pagesApiRoutes = apiFiles.length;
            results.apiRoutes.usingPagesRouter = true;
          } catch (error) {
            results.apiRoutes.pagesApiError = error.message;
          }
        }
        
        // Check package.json for deployment scripts
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        const deploymentScripts = {
          build: packageJson.scripts?.build,
          start: packageJson.scripts?.start,
          dev: packageJson.scripts?.dev,
          lint: packageJson.scripts?.lint,
          test: packageJson.scripts?.test
        };
        
        results.deploymentScripts = deploymentScripts;
        
        // Evaluate deployment compatibility
        const compatibilityIssues = [];
        
        if (!deploymentScripts.build) {
          compatibilityIssues.push('Missing build script');
        }
        
        if (!deploymentScripts.start) {
          compatibilityIssues.push('Missing start script');
        }
        
        if (!results.nextjsFeatures.hasNextConfig) {
          compatibilityIssues.push('Missing next.config.js');
        }
        
        if (!results.staticAssets.hasPublicDir) {
          compatibilityIssues.push('Missing public directory');
        }
        
        if (results.apiRoutes.usingAppRouter && results.apiRoutes.usingPagesRouter) {
          compatibilityIssues.push('Mixed API routing patterns detected');
        }
        
        // Check for potential deployment blockers
        const blockers = [];
        
        if (!packageJson.dependencies?.next) {
          blockers.push('Next.js not found in dependencies');
        }
        
        if (!packageJson.dependencies?.react) {
          blockers.push('React not found in dependencies');
        }
        
        if (blockers.length > 0) {
          return {
            status: 'failed',
            message: `Deployment blockers: ${blockers.join(', ')}`,
            details: results
          };
        }
        
        if (compatibilityIssues.length > 2) {
          return {
            status: 'warning',
            message: `Deployment compatibility issues: ${compatibilityIssues.slice(0, 2).join(', ')}...`,
            details: results
          };
        }
        
        if (compatibilityIssues.length > 0) {
          return {
            status: 'warning',
            message: `Minor deployment issues: ${compatibilityIssues.join(', ')}`,
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: `Deployment platform compatibility verified (Next.js app with ${results.apiRoutes.appApiRoutes || results.apiRoutes.pagesApiRoutes || 0} API routes)`,
          details: results
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Deployment compatibility check failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Final Deployment Checklist',
    function: async () => {
      const results = {
        checklist: {},
        criticalRequirements: {},
        recommendations: [],
        deploymentScore: 0
      };
      
      try {
        // Critical deployment requirements
        const criticalChecks = [
          {
            name: 'Environment Variables',
            check: () => !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
          },
          {
            name: 'Build Configuration',
            check: () => {
              try {
                const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                return !!(packageJson.scripts?.build && packageJson.scripts?.start);
              } catch { return false; }
            }
          },
          {
            name: 'Database Connection',
            check: async () => {
              try {
                const supabase = createClient(
                  process.env.NEXT_PUBLIC_SUPABASE_URL,
                  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
                );
                const { data, error } = await supabase
                  .from('information_schema.schemata')
                  .select('schema_name')
                  .limit(1);
                return !error || error.message.includes('permission');
              } catch { return false; }
            }
          },
          {
            name: 'Static Assets',
            check: () => fs.existsSync('public')
          },
          {
            name: 'TypeScript Configuration',
            check: () => fs.existsSync('tsconfig.json')
          }
        ];
        
        // Execute critical checks
        for (const check of criticalChecks) {
          try {
            const result = await check.check();
            results.criticalRequirements[check.name] = {
              passed: result,
              required: true
            };
          } catch (error) {
            results.criticalRequirements[check.name] = {
              passed: false,
              required: true,
              error: error.message
            };
          }
        }
        
        // Additional deployment checklist
        const additionalChecks = [
          {
            name: 'Security Headers',
            check: () => {
              // Check if security is configured in next.config.js
              try {
                const nextConfigPath = path.join(process.cwd(), 'next.config.js');
                if (fs.existsSync(nextConfigPath)) {
                  delete require.cache[require.resolve(nextConfigPath)];
                  const nextConfig = require(nextConfigPath);
                  return !!(nextConfig.headers || nextConfig.async?.headers);
                }
                return false;
              } catch { return false; }
            },
            optional: true
          },
          {
            name: 'Error Boundaries',
            check: () => {
              // Check for error boundary components
              const errorBoundaryFiles = [
                'components/error-boundary.tsx',
                'components/ErrorBoundary.tsx',
                'app/error.tsx',
                'app/global-error.tsx'
              ];
              return errorBoundaryFiles.some(file => fs.existsSync(file));
            },
            optional: true
          },
          {
            name: 'Monitoring Setup',
            check: () => {
              // Check for monitoring/analytics setup
              const monitoringFiles = [
                'lib/analytics.ts',
                'lib/monitoring.ts',
                'lib/sentry.ts'
              ];
              return monitoringFiles.some(file => fs.existsSync(file));
            },
            optional: true
          },
          {
            name: 'Performance Optimization',
            check: () => {
              try {
                const nextConfigPath = path.join(process.cwd(), 'next.config.js');
                if (fs.existsSync(nextConfigPath)) {
                  delete require.cache[require.resolve(nextConfigPath)];
                  const nextConfig = require(nextConfigPath);
                  return !!(nextConfig.swcMinify || nextConfig.compiler);
                }
                return false;
              } catch { return false; }
            },
            optional: true
          },
          {
            name: 'Testing Coverage',
            check: () => {
              const testDirs = ['tests', '__tests__', 'test'];
              return testDirs.some(dir => fs.existsSync(dir));
            },
            optional: true
          }
        ];
        
        // Execute additional checks
        for (const check of additionalChecks) {
          try {
            const result = await check.check();
            results.checklist[check.name] = {
              passed: result,
              optional: check.optional
            };
          } catch (error) {
            results.checklist[check.name] = {
              passed: false,
              optional: check.optional,
              error: error.message
            };
          }
        }
        
        // Calculate deployment score
        const criticalPassed = Object.values(results.criticalRequirements).filter(r => r.passed).length;
        const criticalTotal = Object.keys(results.criticalRequirements).length;
        const optionalPassed = Object.values(results.checklist).filter(r => r.passed).length;
        const optionalTotal = Object.keys(results.checklist).length;
        
        const criticalScore = (criticalPassed / criticalTotal) * 80; // 80% weight for critical
        const optionalScore = (optionalPassed / optionalTotal) * 20; // 20% weight for optional
        
        results.deploymentScore = Number((criticalScore + optionalScore).toFixed(2));
        
        // Generate recommendations
        Object.entries(results.criticalRequirements).forEach(([name, result]) => {
          if (!result.passed) {
            results.recommendations.push(`Critical: Fix ${name}`);
          }
        });
        
        Object.entries(results.checklist).forEach(([name, result]) => {
          if (!result.passed && result.optional) {
            results.recommendations.push(`Recommended: Implement ${name}`);
          }
        });
        
        // Add deployment-specific recommendations
        if (results.deploymentScore < 100) {
          if (!results.checklist['Security Headers']?.passed) {
            results.recommendations.push('Configure security headers for production');
          }
          
          if (!results.checklist['Error Boundaries']?.passed) {
            results.recommendations.push('Add error boundaries for better error handling');
          }
          
          if (!results.checklist['Monitoring Setup']?.passed) {
            results.recommendations.push('Set up monitoring and analytics');
          }
        }
        
        // Determine final deployment readiness
        if (criticalPassed < criticalTotal) {
          return {
            status: 'failed',
            message: `Deployment blocked: ${criticalTotal - criticalPassed} critical requirements not met (score: ${results.deploymentScore}%)`,
            details: results
          };
        }
        
        if (results.deploymentScore < 70) {
          return {
            status: 'warning',
            message: `Deployment possible but not optimal: ${results.deploymentScore}% readiness score`,
            details: results
          };
        }
        
        if (results.deploymentScore < 90) {
          return {
            status: 'warning',
            message: `Deployment ready with minor issues: ${results.deploymentScore}% readiness score`,
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: `Deployment ready: ${results.deploymentScore}% readiness score (${criticalPassed}/${criticalTotal} critical, ${optionalPassed}/${optionalTotal} optional)`,
          details: results
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Final deployment checklist failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  }
];

module.exports = { tests };