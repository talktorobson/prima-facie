/**
 * Environment Validation Tests
 * Validates Node.js version, npm packages, and environment variables
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const semver = require('semver');

const tests = [
  {
    name: 'Node.js Version Check',
    function: async () => {
      const nodeVersion = process.version;
      const requiredVersion = '18.0.0';
      
      if (semver.gte(nodeVersion, requiredVersion)) {
        return {
          status: 'passed',
          message: `Node.js ${nodeVersion} meets minimum requirement ${requiredVersion}`,
          details: { nodeVersion, requiredVersion }
        };
      } else {
        return {
          status: 'failed',
          message: `Node.js ${nodeVersion} is below minimum requirement ${requiredVersion}`,
          details: { nodeVersion, requiredVersion }
        };
      }
    }
  },

  {
    name: 'NPM Version Check',
    function: async () => {
      try {
        const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
        const requiredVersion = '8.0.0';
        
        if (semver.gte(npmVersion, requiredVersion)) {
          return {
            status: 'passed',
            message: `NPM ${npmVersion} meets minimum requirement ${requiredVersion}`,
            details: { npmVersion, requiredVersion }
          };
        } else {
          return {
            status: 'warning',
            message: `NPM ${npmVersion} is below recommended version ${requiredVersion}`,
            details: { npmVersion, requiredVersion }
          };
        }
      } catch (error) {
        return {
          status: 'failed',
          message: `Failed to check NPM version: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Package.json Validation',
    function: async () => {
      const packagePath = path.resolve(process.cwd(), 'package.json');
      
      if (!fs.existsSync(packagePath)) {
        return {
          status: 'failed',
          message: 'package.json not found in project root',
          details: { packagePath }
        };
      }
      
      try {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const requiredFields = ['name', 'version', 'dependencies', 'scripts'];
        const missingFields = requiredFields.filter(field => !packageJson[field]);
        
        if (missingFields.length > 0) {
          return {
            status: 'failed',
            message: `Missing required fields in package.json: ${missingFields.join(', ')}`,
            details: { missingFields, packagePath }
          };
        }
        
        return {
          status: 'passed',
          message: 'package.json is valid and contains required fields',
          details: { 
            name: packageJson.name,
            version: packageJson.version,
            dependencyCount: Object.keys(packageJson.dependencies || {}).length,
            devDependencyCount: Object.keys(packageJson.devDependencies || {}).length
          }
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Failed to parse package.json: ${error.message}`,
          details: { error: error.message, packagePath }
        };
      }
    }
  },

  {
    name: 'Critical Dependencies Check',
    function: async () => {
      const criticalDeps = [
        '@supabase/supabase-js',
        'next',
        'react',
        'react-dom'
      ];
      
      try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        const missingDeps = criticalDeps.filter(dep => !dependencies[dep]);
        
        if (missingDeps.length > 0) {
          return {
            status: 'failed',
            message: `Missing critical dependencies: ${missingDeps.join(', ')}`,
            details: { missingDeps, availableDeps: Object.keys(dependencies) }
          };
        }
        
        return {
          status: 'passed',
          message: 'All critical dependencies are present',
          details: { 
            criticalDeps: criticalDeps.map(dep => ({
              name: dep,
              version: dependencies[dep]
            }))
          }
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Failed to check dependencies: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Node Modules Installation Check',
    function: async () => {
      const nodeModulesPath = path.resolve(process.cwd(), 'node_modules');
      
      if (!fs.existsSync(nodeModulesPath)) {
        return {
          status: 'failed',
          message: 'node_modules directory not found - run npm install',
          details: { nodeModulesPath }
        };
      }
      
      try {
        const stats = fs.statSync(nodeModulesPath);
        const files = fs.readdirSync(nodeModulesPath);
        
        return {
          status: 'passed',
          message: `node_modules directory exists with ${files.length} packages`,
          details: { 
            nodeModulesPath,
            packageCount: files.length,
            lastModified: stats.mtime
          }
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Failed to read node_modules: ${error.message}`,
          details: { error: error.message, nodeModulesPath }
        };
      }
    }
  },

  {
    name: 'Environment Variables Check',
    function: async () => {
      const requiredEnvVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
      ];
      
      const missingVars = [];
      const presentVars = [];
      
      requiredEnvVars.forEach(varName => {
        if (process.env[varName]) {
          presentVars.push({
            name: varName,
            length: process.env[varName].length,
            masked: process.env[varName].substring(0, 10) + '...'
          });
        } else {
          missingVars.push(varName);
        }
      });
      
      if (missingVars.length > 0) {
        return {
          status: 'failed',
          message: `Missing required environment variables: ${missingVars.join(', ')}`,
          details: { missingVars, presentVars }
        };
      }
      
      return {
        status: 'passed',
        message: 'All required environment variables are present',
        details: { presentVars }
      };
    }
  },

  {
    name: 'Environment File Check',
    function: async () => {
      const envFiles = ['.env.local', '.env', '.env.example'];
      const foundFiles = [];
      const missingFiles = [];
      
      envFiles.forEach(file => {
        const filePath = path.resolve(process.cwd(), file);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          foundFiles.push({
            name: file,
            size: stats.size,
            lastModified: stats.mtime
          });
        } else {
          missingFiles.push(file);
        }
      });
      
      if (foundFiles.length === 0) {
        return {
          status: 'failed',
          message: 'No environment files found',
          details: { missingFiles }
        };
      }
      
      const hasLocalEnv = foundFiles.some(f => f.name === '.env.local');
      if (!hasLocalEnv) {
        return {
          status: 'warning',
          message: '.env.local file not found - using other environment files',
          details: { foundFiles, missingFiles }
        };
      }
      
      return {
        status: 'passed',
        message: 'Environment files are properly configured',
        details: { foundFiles }
      };
    }
  },

  {
    name: 'TypeScript Configuration Check',
    function: async () => {
      const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');
      
      if (!fs.existsSync(tsconfigPath)) {
        return {
          status: 'warning',
          message: 'tsconfig.json not found - TypeScript configuration missing',
          details: { tsconfigPath }
        };
      }
      
      try {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
        
        // Check for essential TypeScript configurations
        const checks = {
          hasCompilerOptions: !!tsconfig.compilerOptions,
          hasStrictMode: !!tsconfig.compilerOptions?.strict,
          hasModuleResolution: !!tsconfig.compilerOptions?.moduleResolution,
          hasInclude: !!tsconfig.include,
          hasExclude: !!tsconfig.exclude
        };
        
        const passedChecks = Object.values(checks).filter(Boolean).length;
        const totalChecks = Object.keys(checks).length;
        
        if (passedChecks === totalChecks) {
          return {
            status: 'passed',
            message: 'TypeScript configuration is complete',
            details: { checks, tsconfigPath }
          };
        } else {
          return {
            status: 'warning',
            message: `TypeScript configuration incomplete (${passedChecks}/${totalChecks} checks passed)`,
            details: { checks, tsconfigPath }
          };
        }
      } catch (error) {
        return {
          status: 'failed',
          message: `Failed to parse tsconfig.json: ${error.message}`,
          details: { error: error.message, tsconfigPath }
        };
      }
    }
  },

  {
    name: 'Next.js Configuration Check',
    function: async () => {
      const nextConfigPath = path.resolve(process.cwd(), 'next.config.js');
      
      if (!fs.existsSync(nextConfigPath)) {
        return {
          status: 'warning',
          message: 'next.config.js not found - using default Next.js configuration',
          details: { nextConfigPath }
        };
      }
      
      try {
        delete require.cache[require.resolve(nextConfigPath)];
        const nextConfig = require(nextConfigPath);
        
        const configChecks = {
          hasReactStrictMode: nextConfig.reactStrictMode !== undefined,
          hasImages: !!nextConfig.images,
          hasRedirects: typeof nextConfig.redirects === 'function',
          hasSwcMinify: nextConfig.swcMinify !== undefined
        };
        
        return {
          status: 'passed',
          message: 'Next.js configuration loaded successfully',
          details: { configChecks, nextConfigPath }
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Failed to load next.config.js: ${error.message}`,
          details: { error: error.message, nextConfigPath }
        };
      }
    }
  },

  {
    name: 'Build Tool Availability Check',
    function: async () => {
      const tools = ['npm', 'npx', 'node'];
      const results = [];
      
      for (const tool of tools) {
        try {
          const version = execSync(`${tool} --version`, { encoding: 'utf8' }).trim();
          results.push({
            tool,
            available: true,
            version
          });
        } catch (error) {
          results.push({
            tool,
            available: false,
            error: error.message
          });
        }
      }
      
      const unavailableTools = results.filter(r => !r.available);
      
      if (unavailableTools.length > 0) {
        return {
          status: 'failed',
          message: `Build tools not available: ${unavailableTools.map(t => t.tool).join(', ')}`,
          details: { results }
        };
      }
      
      return {
        status: 'passed',
        message: 'All build tools are available',
        details: { results }
      };
    }
  }
];

module.exports = { tests };