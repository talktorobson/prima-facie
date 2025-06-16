/**
 * Backup and Recovery Procedure Tests
 * Tests backup creation, validation, and recovery procedures
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

const tests = [
  {
    name: 'Database Backup Configuration Test',
    function: async () => {
      try {
        const results = {
          backupTools: [],
          configuration: {},
          connectivity: {},
          permissions: {}
        };
        
        // Check if backup tools are available
        const tools = ['pg_dump', 'psql'];
        
        for (const tool of tools) {
          try {
            const version = execSync(`${tool} --version`, { encoding: 'utf8', timeout: 5000 });
            results.backupTools.push({
              tool,
              available: true,
              version: version.trim().split('\n')[0]
            });
          } catch (error) {
            results.backupTools.push({
              tool,
              available: false,
              error: error.message
            });
          }
        }
        
        // Check Supabase configuration for backup
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        results.configuration = {
          hasSupabaseUrl: !!supabaseUrl,
          hasServiceKey: !!serviceKey,
          urlFormat: supabaseUrl ? 'valid' : 'missing'
        };
        
        if (supabaseUrl && serviceKey) {
          try {
            const supabase = createClient(supabaseUrl, serviceKey);
            const { data, error } = await supabase
              .from('information_schema.tables')
              .select('table_name')
              .limit(1);
            
            results.connectivity = {
              canConnect: !error,
              error: error ? error.message : null,
              hasPermissions: !error || !error.message.includes('permission')
            };
          } catch (error) {
            results.connectivity = {
              canConnect: false,
              error: error.message,
              hasPermissions: false
            };
          }
        }
        
        // Check backup directory permissions
        const backupDir = path.join(process.cwd(), 'backups');
        
        try {
          if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
          }
          
          const testFile = path.join(backupDir, 'backup-test.tmp');
          fs.writeFileSync(testFile, 'test backup content');
          fs.unlinkSync(testFile);
          
          results.permissions = {
            backupDir,
            canWrite: true,
            canRead: true
          };
        } catch (error) {
          results.permissions = {
            backupDir,
            canWrite: false,
            canRead: false,
            error: error.message
          };
        }
        
        const availableTools = results.backupTools.filter(t => t.available).length;
        const hasConnectivity = results.connectivity.canConnect;
        const hasPermissions = results.permissions.canWrite;
        
        if (availableTools === 0 && !hasConnectivity) {
          return {
            status: 'failed',
            message: 'No backup tools available and cannot connect to database',
            details: results
          };
        }
        
        if (!hasPermissions) {
          return {
            status: 'failed',
            message: 'Cannot write to backup directory',
            details: results
          };
        }
        
        if (availableTools === 0 || !hasConnectivity) {
          return {
            status: 'warning',
            message: 'Limited backup capabilities - some tools or connectivity missing',
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: `Backup configuration is ready (${availableTools} tools available)`,
          details: results
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Backup configuration test failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'File System Backup Test',
    function: async () => {
      const backupDir = path.join(process.cwd(), 'backups');
      const testBackupName = `filesystem-backup-${Date.now()}`;
      const testBackupPath = path.join(backupDir, testBackupName);
      
      try {
        // Ensure backup directory exists
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const results = {
          backupDir,
          testBackupPath,
          sourceFiles: [],
          backedUpFiles: [],
          verification: {},
          compression: {}
        };
        
        // Create test source files
        const testSourceDir = path.join(backupDir, 'test-source');
        if (!fs.existsSync(testSourceDir)) {
          fs.mkdirSync(testSourceDir, { recursive: true });
        }
        
        const testFiles = [
          { name: 'config.json', content: JSON.stringify({ test: 'config', timestamp: new Date().toISOString() }) },
          { name: 'data.txt', content: 'Test data file content\nLine 2\nLine 3' },
          { name: 'binary.dat', content: Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]) }
        ];
        
        // Create source files
        testFiles.forEach(file => {
          const filePath = path.join(testSourceDir, file.name);
          if (Buffer.isBuffer(file.content)) {
            fs.writeFileSync(filePath, file.content);
          } else {
            fs.writeFileSync(filePath, file.content, 'utf8');
          }
          
          const stats = fs.statSync(filePath);
          results.sourceFiles.push({
            name: file.name,
            path: filePath,
            size: stats.size,
            created: stats.birthtime
          });
        });
        
        // Create backup directory
        fs.mkdirSync(testBackupPath, { recursive: true });
        
        // Copy files to backup location
        results.sourceFiles.forEach(file => {
          const backupFilePath = path.join(testBackupPath, file.name);
          fs.copyFileSync(file.path, backupFilePath);
          
          const stats = fs.statSync(backupFilePath);
          results.backedUpFiles.push({
            name: file.name,
            path: backupFilePath,
            size: stats.size,
            backedUp: stats.birthtime
          });
        });
        
        // Verify backup integrity
        let verificationPassed = true;
        const verificationResults = [];
        
        for (const sourceFile of results.sourceFiles) {
          const backupFile = results.backedUpFiles.find(f => f.name === sourceFile.name);
          
          if (!backupFile) {
            verificationPassed = false;
            verificationResults.push({
              file: sourceFile.name,
              status: 'missing',
              message: 'File not found in backup'
            });
            continue;
          }
          
          // Compare file sizes
          if (sourceFile.size !== backupFile.size) {
            verificationPassed = false;
            verificationResults.push({
              file: sourceFile.name,
              status: 'size_mismatch',
              sourceSize: sourceFile.size,
              backupSize: backupFile.size
            });
            continue;
          }
          
          // Compare file contents
          const sourceContent = fs.readFileSync(sourceFile.path);
          const backupContent = fs.readFileSync(backupFile.path);
          
          if (!sourceContent.equals(backupContent)) {
            verificationPassed = false;
            verificationResults.push({
              file: sourceFile.name,
              status: 'content_mismatch',
              message: 'File contents do not match'
            });
          } else {
            verificationResults.push({
              file: sourceFile.name,
              status: 'verified',
              message: 'File backup verified successfully'
            });
          }
        }
        
        results.verification = {
          passed: verificationPassed,
          results: verificationResults
        };
        
        // Test compression (if available)
        try {
          const { execSync } = require('child_process');
          const tarFile = path.join(backupDir, `${testBackupName}.tar.gz`);
          
          execSync(`tar -czf "${tarFile}" -C "${testBackupPath}" .`, { timeout: 10000 });
          
          const originalSize = results.backedUpFiles.reduce((sum, file) => sum + file.size, 0);
          const compressedSize = fs.statSync(tarFile).size;
          
          results.compression = {
            available: true,
            originalSize,
            compressedSize,
            compressionRatio: ((originalSize - compressedSize) / originalSize * 100).toFixed(2) + '%',
            tarFile
          };
          
          // Clean up compressed file
          fs.unlinkSync(tarFile);
        } catch (error) {
          results.compression = {
            available: false,
            error: error.message
          };
        }
        
        // Clean up test files
        fs.rmSync(testSourceDir, { recursive: true, force: true });
        fs.rmSync(testBackupPath, { recursive: true, force: true });
        
        if (!verificationPassed) {
          return {
            status: 'failed',
            message: 'Backup verification failed - file integrity issues detected',
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: `File system backup test passed (${results.backedUpFiles.length} files backed up and verified)`,
          details: results
        };
      } catch (error) {
        // Clean up on error
        try {
          const testSourceDir = path.join(backupDir, 'test-source');
          if (fs.existsSync(testSourceDir)) {
            fs.rmSync(testSourceDir, { recursive: true, force: true });
          }
          if (fs.existsSync(testBackupPath)) {
            fs.rmSync(testBackupPath, { recursive: true, force: true });
          }
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        
        return {
          status: 'failed',
          message: `File system backup test failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Database Schema Backup Test',
    function: async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        const backupDir = path.join(process.cwd(), 'backups');
        const schemaBackupFile = path.join(backupDir, `schema-backup-${Date.now()}.json`);
        
        const results = {
          backupFile: schemaBackupFile,
          tables: [],
          views: [],
          functions: [],
          backupSize: 0,
          verification: {}
        };
        
        // Ensure backup directory exists
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        
        // Get table information
        try {
          const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name, table_type')
            .eq('table_schema', 'public');
          
          if (!tablesError && tables) {
            results.tables = tables.map(table => ({
              name: table.table_name,
              type: table.table_type
            }));
          }
        } catch (error) {
          // May fail due to permissions, continue with limited info
        }
        
        // Get column information for accessible tables
        const expectedTables = ['clients', 'matters', 'users', 'invoices', 'time_entries'];
        
        for (const tableName of expectedTables) {
          try {
            const { data: columns, error } = await supabase
              .from('information_schema.columns')
              .select('column_name, data_type, is_nullable, column_default')
              .eq('table_name', tableName)
              .eq('table_schema', 'public');
            
            if (!error && columns && columns.length > 0) {
              const tableInfo = results.tables.find(t => t.name === tableName) || { name: tableName, type: 'table' };
              tableInfo.columns = columns;
              
              if (!results.tables.find(t => t.name === tableName)) {
                results.tables.push(tableInfo);
              }
            }
          } catch (error) {
            // Table may not exist or not accessible
          }
        }
        
        // Create schema backup
        const schemaBackup = {
          timestamp: new Date().toISOString(),
          database: 'prima-facie',
          tables: results.tables,
          views: results.views,
          functions: results.functions,
          metadata: {
            backupVersion: '1.0',
            generator: 'prima-facie-ops-test'
          }
        };
        
        // Write backup file
        fs.writeFileSync(schemaBackupFile, JSON.stringify(schemaBackup, null, 2));
        
        const backupStats = fs.statSync(schemaBackupFile);
        results.backupSize = backupStats.size;
        
        // Verify backup file
        try {
          const backupContent = fs.readFileSync(schemaBackupFile, 'utf8');
          const parsedBackup = JSON.parse(backupContent);
          
          results.verification = {
            canRead: true,
            validJson: true,
            hasTimestamp: !!parsedBackup.timestamp,
            hasMetadata: !!parsedBackup.metadata,
            tableCount: parsedBackup.tables ? parsedBackup.tables.length : 0,
            contentSize: backupContent.length
          };
        } catch (error) {
          results.verification = {
            canRead: false,
            validJson: false,
            error: error.message
          };
        }
        
        // Clean up backup file
        fs.unlinkSync(schemaBackupFile);
        
        if (!results.verification.canRead || !results.verification.validJson) {
          return {
            status: 'failed',
            message: 'Schema backup verification failed',
            details: results
          };
        }
        
        if (results.tables.length === 0) {
          return {
            status: 'warning',
            message: 'Schema backup created but no tables found (may be due to permissions)',
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: `Schema backup test passed (${results.tables.length} tables, ${results.backupSize} bytes)`,
          details: results
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Schema backup test failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Recovery Procedure Test',
    function: async () => {
      const backupDir = path.join(process.cwd(), 'backups');
      const recoveryTestDir = path.join(backupDir, 'recovery-test');
      
      try {
        // Ensure directories exist
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        
        if (!fs.existsSync(recoveryTestDir)) {
          fs.mkdirSync(recoveryTestDir, { recursive: true });
        }
        
        const results = {
          recoveryTestDir,
          testScenarios: [],
          recoverySteps: [],
          verification: {}
        };
        
        // Test Scenario 1: Configuration File Recovery
        const configRecoveryTest = async () => {
          const originalConfig = {
            app: 'prima-facie',
            version: '1.0.0',
            database: { host: 'localhost', port: 5432 },
            backup: true
          };
          
          const configPath = path.join(recoveryTestDir, 'app-config.json');
          const backupConfigPath = path.join(recoveryTestDir, 'app-config.backup.json');
          
          // Create original config
          fs.writeFileSync(configPath, JSON.stringify(originalConfig, null, 2));
          
          // Create backup
          fs.copyFileSync(configPath, backupConfigPath);
          
          // Simulate corruption
          fs.writeFileSync(configPath, 'corrupted config data');
          
          // Attempt recovery
          const recoverySteps = [];
          
          try {
            // Step 1: Detect corruption
            JSON.parse(fs.readFileSync(configPath, 'utf8'));
            recoverySteps.push({ step: 'detection', status: 'failed', message: 'Corruption not detected' });
          } catch (error) {
            recoverySteps.push({ step: 'detection', status: 'passed', message: 'Corruption detected' });
            
            // Step 2: Restore from backup
            try {
              fs.copyFileSync(backupConfigPath, configPath);
              recoverySteps.push({ step: 'restore', status: 'passed', message: 'Backup restored' });
              
              // Step 3: Verify recovery
              const recoveredConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
              const isValid = JSON.stringify(recoveredConfig) === JSON.stringify(originalConfig);
              
              recoverySteps.push({ 
                step: 'verification', 
                status: isValid ? 'passed' : 'failed', 
                message: isValid ? 'Recovery verified' : 'Recovery verification failed' 
              });
            } catch (restoreError) {
              recoverySteps.push({ step: 'restore', status: 'failed', message: restoreError.message });
            }
          }
          
          return {
            scenario: 'config_recovery',
            steps: recoverySteps,
            success: recoverySteps.every(step => step.status === 'passed')
          };
        };
        
        // Test Scenario 2: Database Connection Recovery
        const dbRecoveryTest = async () => {
          const recoverySteps = [];
          
          try {
            // Simulate connection failure and recovery attempts
            const connectionConfigs = [
              { url: 'invalid://database.url', key: 'invalid-key' },
              { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: 'invalid-key' },
              { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY }
            ];
            
            for (let i = 0; i < connectionConfigs.length; i++) {
              const config = connectionConfigs[i];
              
              try {
                const supabase = createClient(config.url, config.key);
                const { data, error } = await supabase
                  .from('information_schema.schemata')
                  .select('schema_name')
                  .limit(1);
                
                if (!error || error.message.includes('permission')) {
                  recoverySteps.push({
                    step: `connection_attempt_${i + 1}`,
                    status: 'passed',
                    message: 'Connection successful'
                  });
                  break;
                } else {
                  throw new Error(error.message);
                }
              } catch (error) {
                recoverySteps.push({
                  step: `connection_attempt_${i + 1}`,
                  status: 'failed',
                  message: error.message
                });
              }
            }
            
            return {
              scenario: 'database_recovery',
              steps: recoverySteps,
              success: recoverySteps.some(step => step.status === 'passed')
            };
          } catch (error) {
            return {
              scenario: 'database_recovery',
              steps: [{ step: 'error', status: 'failed', message: error.message }],
              success: false
            };
          }
        };
        
        // Execute test scenarios
        results.testScenarios.push(await configRecoveryTest());
        results.testScenarios.push(await dbRecoveryTest());
        
        // Overall verification
        const successfulScenarios = results.testScenarios.filter(s => s.success).length;
        const totalScenarios = results.testScenarios.length;
        
        results.verification = {
          successfulScenarios,
          totalScenarios,
          successRate: (successfulScenarios / totalScenarios) * 100
        };
        
        // Clean up test directory
        fs.rmSync(recoveryTestDir, { recursive: true, force: true });
        
        if (successfulScenarios === 0) {
          return {
            status: 'failed',
            message: 'All recovery scenarios failed',
            details: results
          };
        }
        
        if (successfulScenarios < totalScenarios) {
          return {
            status: 'warning',
            message: `Some recovery scenarios failed (${successfulScenarios}/${totalScenarios} passed)`,
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: `Recovery procedure test passed (${successfulScenarios}/${totalScenarios} scenarios successful)`,
          details: results
        };
      } catch (error) {
        // Clean up on error
        try {
          if (fs.existsSync(recoveryTestDir)) {
            fs.rmSync(recoveryTestDir, { recursive: true, force: true });
          }
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        
        return {
          status: 'failed',
          message: `Recovery procedure test failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  },

  {
    name: 'Backup Retention and Cleanup Test',
    function: async () => {
      const backupDir = path.join(process.cwd(), 'backups');
      
      try {
        // Ensure backup directory exists
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const results = {
          backupDir,
          testBackups: [],
          retentionPolicy: {},
          cleanupResults: {}
        };
        
        // Create mock backup files with different ages
        const mockBackups = [
          { name: 'backup-daily-2024-01-01.tar.gz', age: 30, type: 'daily' },
          { name: 'backup-daily-2024-01-15.tar.gz', age: 16, type: 'daily' },
          { name: 'backup-weekly-2024-01-07.tar.gz', age: 23, type: 'weekly' },
          { name: 'backup-monthly-2023-12-01.tar.gz', age: 45, type: 'monthly' },
          { name: 'backup-daily-current.tar.gz', age: 0, type: 'daily' }
        ];
        
        // Create test backup files
        mockBackups.forEach(backup => {
          const backupPath = path.join(backupDir, backup.name);
          fs.writeFileSync(backupPath, `Mock backup content for ${backup.name}`);
          
          // Set file modification time to simulate age
          const ageDate = new Date(Date.now() - (backup.age * 24 * 60 * 60 * 1000));
          fs.utimesSync(backupPath, ageDate, ageDate);
          
          const stats = fs.statSync(backupPath);
          results.testBackups.push({
            name: backup.name,
            path: backupPath,
            age: backup.age,
            type: backup.type,
            size: stats.size,
            created: stats.mtime
          });
        });
        
        // Define retention policy
        const retentionPolicy = {
          daily: { keepDays: 7, keepCount: 7 },
          weekly: { keepDays: 30, keepCount: 4 },
          monthly: { keepDays: 365, keepCount: 12 }
        };
        
        results.retentionPolicy = retentionPolicy;
        
        // Apply retention policy
        const backupsToKeep = [];
        const backupsToDelete = [];
        
        Object.keys(retentionPolicy).forEach(type => {
          const typeBackups = results.testBackups
            .filter(b => b.type === type)
            .sort((a, b) => b.created - a.created); // Sort by newest first
          
          const policy = retentionPolicy[type];
          
          typeBackups.forEach((backup, index) => {
            if (index < policy.keepCount && backup.age <= policy.keepDays) {
              backupsToKeep.push(backup);
            } else {
              backupsToDelete.push(backup);
            }
          });
        });
        
        // Perform cleanup simulation
        let deletedCount = 0;
        let deletedSize = 0;
        
        backupsToDelete.forEach(backup => {
          try {
            deletedSize += backup.size;
            fs.unlinkSync(backup.path);
            deletedCount++;
          } catch (error) {
            // Track deletion errors
          }
        });
        
        results.cleanupResults = {
          totalBackups: results.testBackups.length,
          backupsToKeep: backupsToKeep.length,
          backupsToDelete: backupsToDelete.length,
          deletedCount,
          deletedSize,
          freedSpaceMB: (deletedSize / 1024 / 1024).toFixed(2)
        };
        
        // Verify remaining backups
        const remainingBackups = backupsToKeep.filter(backup => fs.existsSync(backup.path));
        
        // Clean up remaining test files
        remainingBackups.forEach(backup => {
          try {
            fs.unlinkSync(backup.path);
          } catch (error) {
            // Ignore cleanup errors
          }
        });
        
        if (deletedCount !== backupsToDelete.length) {
          return {
            status: 'warning',
            message: `Partial cleanup completed (${deletedCount}/${backupsToDelete.length} files deleted)`,
            details: results
          };
        }
        
        return {
          status: 'passed',
          message: `Backup retention test passed (${deletedCount} old backups cleaned, ${backupsToKeep.length} retained)`,
          details: results
        };
      } catch (error) {
        return {
          status: 'failed',
          message: `Backup retention test failed: ${error.message}`,
          details: { error: error.message }
        };
      }
    }
  }
];

module.exports = { tests };